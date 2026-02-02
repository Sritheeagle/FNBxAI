import os
from dotenv import load_dotenv
from pymongo import MongoClient
import certifi

load_dotenv()

# Database Connection
MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    print("[!] MONGO_URI not found in .env, using default cloud URI")
    # Fallback to Cloud URI
    MONGO_URI = "mongodb+srv://FNBXAI_db_user:1JlyINjrx54rhf9P@cluster0.kdss6af.mongodb.net/friendly_notebook?appName=Cluster0"

print(f"[*] Connecting to: {MONGO_URI.split('@')[-1] if '@' in MONGO_URI else 'Localhost'}")

# Use certifi for SSL certificates if needed
try:
    client = MongoClient(MONGO_URI, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=5000)
    # Trigger a connection check
    client.admin.command('ping')
    print("[OK] Connected to MongoDB!")
    
    try:
        db = client.get_default_database()
    except Exception:
        db = client.friendly_notebook

except Exception as e:
    print(f"[!] Connection failed: {e}")
    # Fallback to local if cloud fails?
    print("[*] Trying Cloud fallback (retry)...")
    MONGO_RETRY = "mongodb+srv://FNBXAI_db_user:1JlyINjrx54rhf9P@cluster0.kdss6af.mongodb.net/friendly_notebook?appName=Cluster0"
    client = MongoClient(MONGO_RETRY, serverSelectionTimeoutMS=5000)
    db = client.friendly_notebook


def seed_knowledge_base():
    """Seeds the database with specialized knowledge for Student, Faculty, and Admin agents."""
    
    # 1. Student Knowledge - Extensive B.Tech Subjects & Programming
    student_knowledge = [
        # --- CSE Core Subjects ---
        {
            "category": "CSE Core",
            "subject": "Data Structures & Algorithms",
            "topic": "Overview",
            "content": "DSA is the foundation of efficient coding. Key topics: Arrays, Linked Lists, Stacks, Queues, Trees, Graphs, Hashing, Sorting, and Searching.",
            "tags": ["dsa", "cse"]
        },
        {
            "category": "CSE Core",
            "subject": "Data Structures",
            "topic": "Stacks & Queues",
            "content": "Stack: LIFO (Last In First Out) - used in recursion, undo mechanisms. Queue: FIFO (First In First Out) - used in scheduling.",
            "codeExamples": ["stack = []\nstack.append(1)\nstack.pop()"],
            "tags": ["dsa", "stack", "queue"]
        },
        {
            "category": "CSE Core",
            "subject": "Operating Systems",
            "topic": "Process Scheduling",
            "content": "Scheduling algorithms manage CPU execution. Types: FCFS (First Come First Serve), SJF (Shortest Job First), Round Robin (Time Slicing).",
            "tags": ["os", "scheduling"]
        },
        {
            "category": "CSE Core",
            "subject": "DBMS",
            "topic": "SQL vs NoSQL",
            "content": "SQL (Relational): Structured, tables, ACID compliance (e.g., MySQL). NoSQL (Non-Relational): Flexible, documents/key-value, scalable (e.g., MongoDB).",
            "codeExamples": ["SELECT * FROM students WHERE grade='A';"],
            "tags": ["dbms", "sql", "database"]
        },
        {
            "category": "CSE Core",
            "subject": "Computer Networks",
            "topic": "OSI Model",
            "content": "The 7 layers of OSI: Physical, Data Link, Network, Transport, Session, Presentation, Application.",
            "tags": ["networks", "osi"]
        },

        # --- Programming Languages ---
        {
            "category": "Programming",
            "subject": "Python",
            "topic": "Functions & Modules",
            "content": "Functions reuse code. Modules organize code into files.",
            "codeExamples": ["def greet(name):\n    return f'Hello {name}'"],
            "tags": ["python", "basics"]
        },
        {
            "category": "Programming",
            "subject": "Java",
            "topic": "OOP Concepts",
            "content": "Object-Oriented Programming (OOP) relies on Classes, Objects, Inheritance, Polymorphism, Encapsulation, and Abstraction.",
            "codeExamples": ["class Dog {\n  void bark() {\n    System.out.println(\"Woof\");\n  }\n}"],
            "tags": ["java", "oop"]
        },
        {
            "category": "Programming",
            "subject": "JavaScript",
            "topic": "Async/Await",
            "content": "Async functions enable clean promise handling in JS, avoiding callback hell.",
            "codeExamples": ["async function fetchData() {\n  const res = await fetch('/api');\n  const data = await res.json();\n}"],
            "tags": ["javascript", "web"]
        },
        {
            "category": "Programming",
            "subject": "C++",
            "topic": "Pointers",
            "content": "Pointers store the memory address of another variable. Powerful for low-level memory management.",
            "codeExamples": ["int a = 10;\nint* ptr = &a;"],
            "tags": ["cpp", "pointers"]
        },

        # --- Math & Science ---
        {
            "category": "Mathematics",
            "subject": "Engineering Mathematics",
            "topic": "Linear Algebra",
            "content": "Study of vectors, vector spaces, and linear transformations. Key for ML and Graphics.",
            "tags": ["math", "linear-algebra"]
        },
        {
            "category": "Electronics",
            "subject": "Digital Logic",
            "topic": "Logic Gates",
            "content": "Basic building blocks of digital circuits. AND, OR, NOT, XOR, NAND, NOR.",
            "tags": ["ece", "digital", "logic"]
        },
        
        # --- Trending Tech ---
        {
            "category": "Advanced",
            "subject": "Artificial Intelligence",
            "topic": "Machine Learning Basics",
            "content": "ML teaches computers to learn from data. Types: Supervised (labeled data), Unsupervised (unlabeled), Reinforcement (rewards).",
            "tags": ["ai", "ml"]
        },
        {
            "category": "Advanced",
            "subject": "Web Development",
            "topic": "React.js",
            "content": "React is a JS library for building UIs using components and a virtual DOM.",
            "tags": ["web", "react"]
        }
    ]

    
    # 2. Faculty Knowledge - Admin Tasks
    faculty_knowledge = [
        {
            "category": "Administration",
            "subject": "Attendance",
            "topic": "Marking Attendance",
            "content": "Usage: To mark attendance, navigate to the Attendance Dashboard. You can use 'AI Mark' to auto-detect students from a class photo, or manually toggle checkboxes.",
            "templates": ["Class: {class_id}, Date: {date}, Present: {count}"],
            "tags": ["attendance", "admin", "ai-feature"]
        },
        {
            "category": "Academics",
            "subject": "Exams",
            "topic": "Creating Exam Papers",
            "content": "Usage: Go to Exam Section > Generate Paper. Select Subject, Difficulty (Easy/Medium/Hard), and Question Types (MCQ/Descriptive). The AI will generate a PDF.",
            "templates": ["Exam Template v1"],
            "tags": ["exams", "paper-generation"]
        }
    ]
    
    # 3. Admin Knowledge - System Control
    admin_knowledge = [
        {
            "category": "User Management",
            "module": "Students",
            "topic": "Adding Students",
            "content": "To add a student: Go to 'Students' > 'Add New'. You can upload a CSV for bulk addition or enter details manually. Required: Name, Roll No, Branch.",
            "procedures": ["1. Click Add", "2. Fill Form", "3. Submit"],
            "tips": ["Use CSV for batches > 50 students"],
            "tags": ["students", "onboarding"]
        },
        {
            "category": "Finance",
            "module": "Fees",
            "topic": "Fee Control",
            "content": "Fee Dashboard allows tracking payments. Defaulters are highlighted in red. Use 'Remind All' to send SMS notifications.",
            "tips": ["Check daily collection reports at 5 PM"],
            "tags": ["fees", "finance", "control"]
        },
         {
            "category": "System",
            "module": "Database",
            "topic": "Optimization",
            "content": "To optimize DB: Go to Settings > System Health > Run Optimization. This cleans up unused indexes and compacts collections.",
            "tags": ["database", "maintenance"]
        }
    ]

    print("[*] clearing old knowledge...")
    db.student_knowledges.delete_many({})
    db.faculty_knowledges.delete_many({})
    db.admin_knowledges.delete_many({})

    print("[*] Seeding Student Knowledge...")
    if student_knowledge:
        db.student_knowledges.insert_many(student_knowledge)
    
    print("[*] Seeding Faculty Knowledge...")
    if faculty_knowledge:
        db.faculty_knowledges.insert_many(faculty_knowledge)

    print("[*] Seeding Admin Knowledge...")
    if admin_knowledge:
        db.admin_knowledges.insert_many(admin_knowledge)

    print("[OK] Knowledge Base Updated Successfully!")

if __name__ == "__main__":
    seed_knowledge_base()
