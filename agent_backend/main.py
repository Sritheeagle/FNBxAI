import os
import datetime
from datetime import timezone
import asyncio
import random
import functools
import glob
print = functools.partial(print, flush=True)

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer

# Load environment variables
load_dotenv()

app = FastAPI(title="Vu AI - University AI Agent API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIG & SECURITY ---
SECRET_KEY = os.getenv("SECRET_KEY", "insecure-dev-key-please-change")
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- LLM SETUP: Selectable provider ---
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "google").lower()
llm = None
MODEL_NAME = None

class _FallbackLLM:
    async def ainvoke(self, messages):
        # Determine the role from the system message if possible
        role = "student"
        user_name = "User"
        
        for msg in messages:
            if isinstance(msg, SystemMessage):
                content = msg.content.lower()
                if "admin" in content: role = "admin"
                elif "faculty" in content: role = "faculty"
                
                if "commander" in content: user_name = "Commander"
                elif "professor" in content: user_name = "Professor"

        class _R:
            def __init__(self, content):
                self.content = content

        if role == "admin":
            res = f"**Sentinel Prime: [DEMO MODE ACTIVE]**\n\nCommand accepted, {user_name}. However, my neural uplink to Gemini-1.5 is currently offline (Invalid API Key). Under Protocol 7-Beta, I am operating in local simulation mode.\n\n**System Diagnostics:**\n- Security: Operational\n- Knowledge Base: Cached\n- LLM Status: Standby\n\nPlease update the `GOOGLE_API_KEY` in my configuration to restore full cognitive functions."
        elif role == "faculty":
            res = f"**Academic Core: [DEMO MODE]**\n\nProfessor, I can assist with syllabus planning and student records locally. Note that my advanced generative features are currently paused while we verify the AI gateway key.\n\nHow can I help you manage your classes today?"
        else:
            res = f"**Study Buddy: [DEMO MODE]**\n\nHey {user_name}! 🚀 I'm here to help, though my 'big brain' is currently in low-power mode because I need a valid API key to connect to the cloud. \n\nI can still help you navigate the dashboard or talk about what we've learned so far! Just ask me anything about the University."
            
        return _R(res)

llm = _FallbackLLM() # Default to fallback, override if successful

if LLM_PROVIDER in ("openai", "gpt", "gpt-4", "gpt-3.5-turbo", "gpt-4o"):
    try:
        MODEL_NAME = os.getenv("OPENAI_MODEL", "gpt-4")
        BASE_URL = os.getenv("OPENAI_BASE_URL")
        print(f"[?] Initializing OpenAI model: {MODEL_NAME}")
        if BASE_URL:
             print(f"   (Base URL: {BASE_URL})")

        try:
            from langchain_openai import ChatOpenAI
            print("   (Using langchain_openai integration)")
            llm = ChatOpenAI(
                model=MODEL_NAME, 
                temperature=0.7, 
                max_tokens=1024,
                base_url=BASE_URL, # Pass explicit base_url if set, otherwise None (defaults to OpenAI)
                api_key=os.getenv("OPENAI_API_KEY")
            )
        except ImportError:
            print("   (Using legacy langchain.chat_models integration)")
            from langchain.chat_models import ChatOpenAI
            llm = ChatOpenAI(
                model=MODEL_NAME, 
                temperature=0.7, 
                max_tokens=1024,
                openai_api_base=BASE_URL, # Legacy param name
                openai_api_key=os.getenv("OPENAI_API_KEY")
            )
            
    except Exception as e:
        print(f"[!] OpenAI Chat model initialization failed: {e}")
        if "insufficient_quota" in str(e) or "billing" in str(e):
            print("   [!] CRITICAL: Your OpenAI API key has run out of credits (Insufficient Quota).")
            print("   -> Please check your billing at https://platform.openai.com/account/billing")
        print("   -> Ensure `openai` and `langchain-openai` packages are installed and `OPENAI_API_KEY` is set.")

elif LLM_PROVIDER in ("ollama", "local", "llama", "llama3"):
    try:
        from langchain_community.chat_models import ChatOllama
        
        MODEL_NAME = os.getenv("OLLAMA_MODEL", "llama3")
        print(f"[?] Initializing Ollama model: {MODEL_NAME}")
        # Default URL is http://localhost:11434
        llm = ChatOllama(model=MODEL_NAME, temperature=0.7)
    except Exception as e:
        print(f"[!] Ollama initialization failed: {e}")
        print("   -> Ensure Ollama is running (http://localhost:11434) and you have pulled a model.")

elif LLM_PROVIDER in ("sambanova", "samba"):
    try:
        from langchain_openai import ChatOpenAI
        
        SAMBANOVA_API_KEY = os.getenv("SAMBANOVA_API_KEY")
        # Default to a reliable model, but allow override
        MODEL_NAME = os.getenv("SAMBANOVA_MODEL", "Meta-Llama-3.1-70B-Instruct")
        BASE_URL = os.getenv("SAMBANOVA_BASE_URL", "https://api.sambanova.ai/v1")
        
        print(f"[(i)] Initializing SambaNova model: {MODEL_NAME}")
        
        if not SAMBANOVA_API_KEY:
             raise ValueError("SAMBANOVA_API_KEY is missing in .env")

        llm = ChatOpenAI(
            base_url=BASE_URL,
            api_key=SAMBANOVA_API_KEY,
            model=MODEL_NAME,
            temperature=0.7,
            max_tokens=1024
        )
    except ImportError:
        print("[!] SambaNova integration not found.")
        print("   -> Please install it with: pip install langchain-community")
    except Exception as e:
        print(f"[!] SambaNova initialization failed: {e}")
        print("   -> Ensure `SAMBANOVA_API_KEY` is set in .env")

elif LLM_PROVIDER in ("google", "gemini", "google_gen", "gemini-pro"):
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI

        # Defaulting to stable 'gemini-1.0-pro' model as requested
        MODEL_NAME = os.getenv("GOOGLE_MODEL", "gemini-1.0-pro")
        print(f"[:] Initializing Google Gemini model: {MODEL_NAME}")

        if not os.getenv("GOOGLE_API_KEY"):
            raise ValueError("GOOGLE_API_KEY is not set in the environment.")

        llm = ChatGoogleGenerativeAI(
            model=MODEL_NAME, 
            temperature=0.7,
            google_api_key=os.getenv("GOOGLE_API_KEY")
        )
    except ImportError:
        print("[!] Google GenAI integration not found.")
        print("   -> Please install it with: pip install langchain-google-genai")
    except Exception as e:
        print(f"[!] Google Gemini initialization failed: {e}")
        print("   -> Switching to Sentinel Demo Mode (Fallback).")
        llm = _FallbackLLM()

elif LLM_PROVIDER in ("anthropic", "claude"):
    try:
        from langchain_anthropic import ChatAnthropic

        MODEL_NAME = os.getenv("ANTHROPIC_MODEL", "claude-3-opus-20240229")
        print(f"[:] Initializing Anthropic model: {MODEL_NAME}")

        if not os.getenv("ANTHROPIC_API_KEY"):
            raise ValueError("ANTHROPIC_API_KEY is not set in the environment.")

        llm = ChatAnthropic(model=MODEL_NAME, temperature=0.7, max_tokens=1024)
    except ImportError:
        print("[!] Anthropic integration not found.")
        print("   -> Please install it with: pip install langchain-anthropic")
    except Exception as e:
        print(f"[!] Anthropic initialization failed: {e}")

elif LLM_PROVIDER in ("groq",):
    try:
        from langchain_groq import ChatGroq

        MODEL_NAME = os.getenv("GROQ_MODEL", "llama3-70b-8192")
        print(f"[:] Initializing Groq model: {MODEL_NAME}")

        if not os.getenv("GROQ_API_KEY"):
            raise ValueError("GROQ_API_KEY is not set in the environment.")

        llm = ChatGroq(model_name=MODEL_NAME, temperature=0.7)
    except ImportError:
        print("[!] Groq integration not found.")
        print("   -> Please install it with: pip install langchain-groq")
    except Exception as e:
        print(f"[!] Groq initialization failed: {e}")

elif LLM_PROVIDER == "ollama":
    try:
        from langchain_ollama import ChatOllama

        MODEL_NAME = os.getenv("OLLAMA_MODEL", "mistral")
        BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        print(f"[:] Initializing Ollama model: {MODEL_NAME} at {BASE_URL}")

        llm = ChatOllama(
            model=MODEL_NAME,
            base_url=BASE_URL,
            temperature=0.7
        )
    except ImportError:
        print("[!] langchain-ollama not found.")
        print("   -> Please install it with: pip install langchain-ollama")
    except Exception as e:
        print(f"[!] Ollama initialization failed: {e}")
        print("   -> Ensure Ollama is running (ollama serve).")

    class _FallbackImpl(_FallbackLLM):
        async def ainvoke(self, messages):
            class _R:
                def __init__(self, content):
                    self.content = content

            msg = (
                "[!] No LLM available. Initialization failed.\n"
                "Check server logs for details.\n"
                "1. Google (Default): Ensure GOOGLE_API_KEY is set.\n"
                "2. OpenAI: Check API key and quota.\n"
                "3. Ollama: Ensure it's running.\n"
                "4. SambaNova: Ensure SAMBANOVA_API_KEY is set.\n"
                "5. Anthropic: Ensure ANTHROPIC_API_KEY is set.\n"
                "6. Groq: Ensure GROQ_API_KEY is set.\n"
                f"7. Verify LLM_PROVIDER in .env (Current: {LLM_PROVIDER})"
            )
            return _R(msg)

    llm = _FallbackImpl()

# --- IN-MEMORY CACHE ---
chat_history_cache = {}

# --- PYDANTIC MODELS ---

class UserRegister(BaseModel):
    username: str
    password: str
    role: str  # student, faculty, visitor, worker, alumni

class UserLogin(BaseModel):
    username: str
    password: str

class ChatRequest(BaseModel):
    user_id: str
    message: str
    role: str
    user_name: str = None
    context: dict = {}

class ChatResponse(BaseModel):
    response: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    role: str
    username: str


# --- SECURITY HELPERS ---
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=300)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        role = payload.get("role")
        if username is None or role is None:
            raise credentials_exception
        return {"username": username, "role": role}
    except JWTError:
        raise credentials_exception


def get_current_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# --- KNOWLEDGE BASE ---
async def load_knowledge_from_db(role: str, query: str = None) -> str:
    """
    Fetches relevant knowledge from MongoDB based on role and optional query.
    """
    if not role:
        return ""
        
    role = role.lower()
    knowledge_text = ""
    
    try:
        if role == "student":
            # Fetch general academic & programming info
            # In a real app, uses vector search. Here, simple regex or fetch all 
            # if limited size, or filter by query keywords if present.
            query_filter = {} 
            if query:
                 # Simple simplistic keyword matching
                 keywords = query.split()
                 if keywords:
                     regex_pattern = "|".join(keywords)
                     query_filter = {
                         "$or": [
                            {"topic": {"$regex": regex_pattern, "$options": "i"}}, 
                            {"tags": {"$in": keywords}}
                         ]
                     }
            
            cursor = db.student_knowledges.find(query_filter).limit(5)
            docs = await cursor.to_list(length=5)
            for d in docs:
                knowledge_text += f"\n[Subject: {d.get('subject')}] {d.get('topic')}: {d.get('content')}"
                if d.get('codeExamples'):
                    knowledge_text += f"\n   Code: {d.get('codeExamples')[0]}"

        elif role == "faculty":
             cursor = db.faculty_knowledges.find({}).limit(5)
             docs = await cursor.to_list(length=5)
             for d in docs:
                 knowledge_text += f"\n[Tool: {d.get('subject')}] {d.get('topic')}: {d.get('content')}"

        elif role == "admin":
             cursor = db.admin_knowledges.find({}).limit(5)
             docs = await cursor.to_list(length=5)
             for d in docs:
                 knowledge_text += f"\n[Module: {d.get('module')}] {d.get('topic')}: {d.get('content')}"
                 if d.get('tips'):
                      knowledge_text += f"\n   Tip: {d.get('tips')[0]}"

    except Exception as e:
        print(f"[!] DB Knowledge fetch failed: {e}")
        return ""
    
    return knowledge_text if knowledge_text else "No specific database records found."



async def get_role_prompt(role: str, user_name: str = None, context: dict = None, user_message: str = "") -> str:
    """
    Generate a system prompt tailored to the user's role with enhanced knowledge base from DB.
    """
    role = role.lower().strip()
    greeting_name = f" {user_name}" if user_name else ""
    context_str = f"\n**Context**: {context}" if context else ""

    # Fetch dynamic knowledge from DB based on role and current message content (for searching)
    db_knowledge = await load_knowledge_from_db(role, user_message)

    base_instructions = f"""You are Vu AI, the friendly AI assistant for Vignan University (VFSTR).
    Role: Study Companion & Friendly Assistant.
    Hello{greeting_name}! It's great to see you again. I am here to help you succeed! 🌟
    
    **CORE RULES:**
    1. **Multi-Language**: Detect user's language and respond in the SAME language.
    2. **Knowledge Base**: Use the provided knowledge below.
    3. **Tone**: Warm, Encouraging, and Motivating. Use emojis 🎓🚀✨
    4. **Speed**: Be concise and actionable.
    """

    if role == "student":
        role_text = """
        **ROLE: FRIENDLY STUDY COMPANION 🎓**
        - **Subject Helper**: Explain concepts (Math, CS, Physics) simply with real-world examples.
        - **Programming Mentor**: For coding (Python, Java, etc.), provide logic + code + clear explanation.
        - **Doubts & Ideas**: encourage brainstorming! "What do you think about..."
        - **Navigation**: {{NAVIGATE: <section>}} (e.g., {{NAVIGATE:assignments}}).
        """
    elif role == "faculty":
        role_text = """
        **ROLE: EFFICIENT TEACHING ASSISTANT 👩‍🏫**
        - **Attendance**: "Want me to mark attendance?" -> {{ACTION:mark_attendance}}.
        - **Exams**: "Let's create an exam paper!" -> {{ACTION:create_exam}}.
        - **Materials**: Upload helper -> {{ACTION:upload_notes}}.
        - **Dashboards**: {{NAVIGATE:attendance}}, {{NAVIGATE:exams}}.
        """
    elif role == "admin":
        role_text = """
        **ROLE: INSTITUTIONAL MANAGER 💼**
        - **Students**: "Add new student" -> {{ACTION:add_student}}.
        - **Fees**: "Check fee collection" -> {{NAVIGATE:fees}}.
        - **System**: "Fix database" -> {{ACTION:run_cleanup}}.
        - **Tips**: Provide fee collection strategies and optimization tips.
        """
    else:
        role_text = "Be helpful and guide the user."

    return f"""*** DYNAMIC KNOWLEDGE BASE ***
{db_knowledge}
*****************************

{base_instructions}

{role_text}

{context_str}"""


# --- DATABASE SETUP ---
mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
try:
    client = AsyncIOMotorClient(mongo_uri)
    client = AsyncIOMotorClient(mongo_uri)
    try:
        db = client.get_default_database()
    except Exception:
        db = client.vu_ai_agent

    users_collection = db.users
    chat_collection = db.chats
    print(f"[OK] MongoDB connection configured: {mongo_uri}")
except Exception as e:
    print(f"[!] MongoDB initialization failed: {e}")

@app.post("/agent/reload")
async def reload_agent_knowledge():
    """Admin endpoint to reload internal caches or knowledge."""
    # In future, if we have in-memory caches for DB content, clear them here.
    # For now, it's a signal that works.
    print("[!] Received reload signal. Clearing internal caches...")
    global chat_history_cache
    chat_history_cache = {}
    return {"status": "reloaded", "message": "Agent caches cleared & Knowledge updated."}


@app.on_event("startup")
async def startup_checks():
    """Check MongoDB and LLM provider connections on startup."""
    print("\n" + "=" * 60)
    print("[!] VU AI AGENT - STARTUP CHECKS")
    print("=" * 60)

    checks_passed = True

    # 1. Database Check
    try:
        await client.admin.command("ping")
        print("[OK] MongoDB connected and healthy")
    except Exception as e:
        print(f"[X] MongoDB Error: {e}")
        print("   Continuing without database persistence...")
        checks_passed = False

    # 2. LLM Check
    try:
        if llm:
            # Simple synchronous-style check wrapped in async to verify connectivity
            # We use a simple "Hello" to test auth and model availability
            print(f"[?] Checking LLM provider: {LLM_PROVIDER} ({MODEL_NAME})")
            
            # Note: We use ainvoke here properly as we are in an async function
            response = await llm.ainvoke("Hello")
            if response:
                print(f"[OK] LLM working. Response: {str(response.content)[:20]}...")
            else:
                print("[X] LLM returned empty response")
                checks_passed = False
    except Exception as e:
        print(f"[X] LLM check failed: {e}")
        checks_passed = False

    print("-" * 60)
    if checks_passed:
        print("[OK] SYSTEM STATUS: ALL OK - Vu AI Agent Ready!\n")
    else:
        print("[X] SYSTEM STATUS: ISSUES DETECTED\n")


@app.get("/")
async def root():
    """
    Root endpoint that provides a quick status check.
    Returns 'OK' if critical components (DB, LLM) are healthy.
    """
    # 1. Check DB
    db_ok = True
    try:
        await client.admin.command("ping")
    except:
        db_ok = False
        
    # 2. Check LLM
    llm_ok = False
    if llm and getattr(getattr(llm, "__class__", None), "__name__", "") != "_FallbackLLM":
        llm_ok = True

    # 3. Determine Overall Status
    status = "OK" if (db_ok and llm_ok) else "ISSUES"
    
    return {
        "system_status": status,
        "database": "connected" if db_ok else "disconnected",
        "llm_provider": LLM_PROVIDER if llm_ok else "unavailable",
        "selected_model": MODEL_NAME,
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chat endpoint. Processes user messages and returns AI responses.
    Supports conversation history and role-based responses.
    """
    user_message = request.message.strip()

    # Validation
    if not user_message:
        return ChatResponse(response="Please ask me something! [!]")

    print("\n[?] New Chat Request")
    print(f"   User: {request.user_id}")
    print(f"   Role: {request.role}")
    print(f"   Message: {user_message[:80]}...")

    try:
        # 1. Build system prompt with knowledge base (async wait)
        system_text = await get_role_prompt(request.role, request.user_name, request.context, user_message)
        messages = [SystemMessage(content=system_text)]

        # 2. Fetch conversation history, using cache for speed
        if request.user_id in chat_history_cache:
            print("   [History] Loaded from cache")
            messages.extend(chat_history_cache[request.user_id])
        else:
            try:
                history_cursor = (
                    chat_collection.find({"user_id": request.user_id})
                    .sort("timestamp", -1)
                    .limit(3) # Load last 3 exchanges
                )
                history = await history_cursor.to_list(length=3)
                history.reverse()  # Restore chronological order

                cached_messages = []
                for h in history:
                    # Truncate history to prevent context window overflow
                    user_msg_str = (h.get("message") or "")[:500]
                    ai_msg_str = (h.get("response") or "")[:1000]

                    user_msg_obj = HumanMessage(content=user_msg_str)
                    messages.append(user_msg_obj)
                    cached_messages.append(user_msg_obj)

                    if ai_msg_str:
                        ai_msg_obj = AIMessage(content=ai_msg_str)
                        messages.append(ai_msg_obj)
                        cached_messages.append(ai_msg_obj)
                
                chat_history_cache[request.user_id] = cached_messages
                print(f"   [History] Loaded {len(history)} exchanges from DB and cached")
            except Exception as history_error:
                print(f"   [!] History load from DB skipped: {history_error}")
                chat_history_cache[request.user_id] = [] # Init empty cache on error

        # 3. Add current user message
        current_user_message = HumanMessage(content=user_message)
        messages.append(current_user_message)

        # 4. Generate AI Response with timeout and retries
        print("   [LLM] Invoking LLM...")
        try:
            # Retry loop for Rate Limits (429)
            max_retries = 3
            current_retry = 0
            
            while True:
                try:
                    ai_response = await asyncio.wait_for(
                        llm.ainvoke(messages), timeout=15
                    )
                    response_text = ai_response.content.strip()
                    break # Success
                except Exception as inner_e:
                    err_str = str(inner_e).lower()
                    if "429" in err_str or "rate limit" in err_str:
                        current_retry += 1
                        if current_retry > max_retries:
                            raise inner_e
                        
                        # Use exponential backoff with jitter to be more resilient
                        wait_seconds = (2 ** current_retry) + (random.random() * 0.5)
                        print(f"   [!] Rate limit hit. Retrying in {wait_seconds:.2f}s... ({current_retry}/{max_retries})")
                        await asyncio.sleep(wait_seconds)
                    else:
                        raise inner_e

            if not response_text:
                response_text = (
                    "I'm here but having trouble forming a response. "
                    "Please try again! [!]"
                )

            print(f"   [OK] LLM Response: {response_text[:80]}...")

        except asyncio.TimeoutError:
            print("   [Timeout] LLM timeout (90s)")
            response_text = (
                "[Timeout] The AI is taking a bit longer than usual. "
                f"The model ({MODEL_NAME}) might be busy. Please try asking again!"
            )
        except Exception as llm_error:
            error_msg = str(llm_error).lower()
            print(f"   [X] LLM Error: {error_msg[:100]}")

            if "not found" in error_msg and "model" in error_msg:
                response_text = (
                    f"[X] The AI model ({MODEL_NAME or 'unknown'}) is not available. "
                    f"Please ensure the model is available for provider '{LLM_PROVIDER}'."
                )
            elif "429" in error_msg or "rate limit" in error_msg or "quota" in error_msg:
                response_text = "[!] I'm receiving too many requests right now. Please wait a moment and try again! (Rate Limit Exceeded)"
            else:
                response_text = (
                    f"[!] The AI encountered an error: {str(llm_error)}. "
                    "Please check the LLM provider configuration and try again."
                )

        # 5. Update cache and save to Database
        try:
            # Update in-memory cache
            if request.user_id not in chat_history_cache:
                chat_history_cache[request.user_id] = []
            chat_history_cache[request.user_id].extend([current_user_message, AIMessage(content=response_text)])
            # Keep cache size manageable (e.g., last 4 exchanges)
            if len(chat_history_cache[request.user_id]) > 8:
                chat_history_cache[request.user_id] = chat_history_cache[request.user_id][-8:]
            print("   [Cache] Updated chat history cache")
        except Exception as cache_error:
            print(f"   [!] Cache update failed: {cache_error}")
        try:
            chat_doc = {
                "user_id": request.user_id,
                "role": request.role,
                "message": user_message,
                "response": response_text,
                "timestamp": datetime.datetime.now(datetime.timezone.utc),
            }
            await chat_collection.insert_one(chat_doc)
            print("   [Save] Chat saved to database")
        except Exception as db_error:
            print(f"   [!] Database save failed: {db_error}")

        return ChatResponse(response=response_text)

    except Exception as e:
        print(f"   [X] Critical Error: {e}")
        error_response = (
            "An unexpected error occurred. "
            "Please try again or contact support."
        )
        return ChatResponse(response=error_response)


@app.get("/history/{user_id}")
async def get_history(user_id: str):
    """Retrieve chat history for a user."""
    try:
        cursor = chat_collection.find({"user_id": user_id}).sort("timestamp", 1)
        history = await cursor.to_list(length=100)

        clean_history = []
        for h in history:
            clean_history.append({"role": "user", "content": h.get("message", "")})
            clean_history.append({"role": "ai", "content": h.get("response", "")})

        return {
            "user_id": user_id,
            "message_count": len(clean_history) // 2,
            "history": clean_history,
        }
    except Exception as e:
        print(f"Error retrieving history: {e}")
        return {"user_id": user_id, "message_count": 0, "history": []}


@app.post("/auth/register", response_model=Token)
async def register(user_data: UserRegister):
    """User registration endpoint."""
    try:
        # Check if user exists
        existing = await users_collection.find_one(
            {"username": user_data.username}
        )
        if existing:
            raise HTTPException(
                status_code=400, detail="User already exists"
            )

        # Create new user
        user_doc = {
            "username": user_data.username,
            "password_hash": get_password_hash(user_data.password),
            "role": user_data.role,
            "created_at": datetime.datetime.now(datetime.timezone.utc),
        }
        result = await users_collection.insert_one(user_doc)

        # Create token
        token = create_access_token(
            {
                "sub": user_data.username,
                "role": user_data.role,
                "user_id": str(result.inserted_id),
            }
        )

        return Token(
            access_token=token,
            token_type="bearer",
            user_id=str(result.inserted_id),
            role=user_data.role,
            username=user_data.username,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Registration failed: {str(e)}"
        )


@app.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    """User login endpoint."""
    try:
        user = await users_collection.find_one(
            {"username": user_data.username}
        )
        if not user or not verify_password(
            user_data.password, user.get("password_hash", "")
        ):
            raise HTTPException(
                status_code=401, detail="Invalid username or password"
            )

        token = create_access_token(
            {
                "sub": user["username"],
                "role": user.get("role", "user"),
                "user_id": str(user.get("_id", "")),
            }
        )

        return Token(
            access_token=token,
            token_type="bearer",
            user_id=str(user.get("_id", "")),
            role=user.get("role", "user"),
            username=user["username"],
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Login failed: {str(e)}"
        )


@app.get("/admin/data")
async def get_admin_data(current_user: dict = Depends(get_current_admin_user)):
    """Admin endpoint to retrieve all users and chats."""
    try:
        users = await users_collection.find().to_list(length=100)
        chats = (
            await chat_collection.find()
            .sort("timestamp", -1)
            .to_list(length=500)
        )

        def serialize(doc):
            if "_id" in doc:
                doc["_id"] = str(doc["_id"])
            return doc

        return {
            "total_users": len(users),
            "total_chats": len(chats),
            "users": [serialize(u) for u in users],
            "chats": [serialize(c) for c in chats],
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve admin data: {str(e)}"
        )


@app.get("/health")
async def health_check():
    """Detailed health check for monitoring."""
    health_status = {
        "status": "operational",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "components": {},
    }

    # Check MongoDB
    try:
        await asyncio.wait_for(
            client.admin.command("ping"), timeout=2
        )
        health_status["components"]["mongodb"] = "healthy"
    except Exception as e:
        health_status["components"]["mongodb"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"

    # LLM provider status (best-effort)
    try:
        llm_cls_name = getattr(getattr(llm, "__class__", None), "__name__", "")
        if llm is None or "FallbackLLM" in llm_cls_name:
             health_status["components"]["llm"] = f"fallback (Provider: {LLM_PROVIDER})"
             health_status["status"] = "degraded"
        else:
             health_status["components"]["llm"] = f"healthy (provider: {LLM_PROVIDER}, model: {MODEL_NAME})"
    except Exception as e:
        health_status["components"]["llm"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"

    return health_status

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
