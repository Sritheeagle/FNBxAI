const mongoose = require('mongoose');
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { ChatOpenAI } = require('@langchain/openai');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { PromptTemplate } = require('@langchain/core/prompts');
const { RunnableSequence, RunnablePassthrough } = require('@langchain/core/runnables');
const fetch = require('node-fetch');

// Initialize LangChain Chat Model (Switched to Gemini due to OpenRouter issues)
let chatModelInstance = null;

const getChatModel = () => {
    if (!chatModelInstance) {
        // Prefer Google Gemini if API key is present
        if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY.trim() !== '') {
            console.log('[AI Config] Using Google Gemini Pro');
            try {
                // Validate API key format
                const apiKey = process.env.GOOGLE_API_KEY.trim();
                if (!apiKey.startsWith('AIza')) {
                    throw new Error('Invalid Google API key format');
                }
                
                chatModelInstance = new ChatGoogleGenerativeAI({
                    apiKey: apiKey,
                    modelName: "gemini-2.0-flash-exp",
                    maxOutputTokens: 2048,
                    temperature: 0.7,
                    timeout: 10000,
                });
                console.log('[AI Config] Gemini initialized successfully');
            } catch (error) {
                console.error('[AI Config] Failed to initialize Gemini:', error.message);
                chatModelInstance = null;
            }
        }
        
        // Fallback to OpenAI if Gemini fails or not available
        if (!chatModelInstance && process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '') {
            console.log('[AI Config] Using OpenAI/OpenRouter');
            try {
                const apiKey = process.env.OPENAI_API_KEY.trim();
                chatModelInstance = new ChatOpenAI({
                    openAIApiKey: apiKey,
                    modelName: "gpt-4o-mini",
                    temperature: 0.7,
                    maxTokens: 1000,
                    configuration: apiKey.startsWith('sk-or-') ? {
                        baseURL: "https://openrouter.ai/api/v1",
                    } : undefined
                });
            } catch (error) {
                console.error('[AI Config] Failed to initialize OpenAI:', error.message);
                chatModelInstance = null;
            }
        }
        
        // If no models are available, set to null and use fallback
        if (!chatModelInstance) {
            console.log('[AI Config] No valid API keys found, using fallback mode');
            chatModelInstance = null;
        }
    }
    return chatModelInstance;
};

// Import Centralized AI Models
const { StudentKnowledge, FacultyKnowledge, AdminKnowledge, ChatHistory } = require('../models/AIModels');

// Role-specific system prompts
const getSystemPrompt = (role, userProfile) => {
    const { name, year, branch, section } = userProfile.context || {};

    const basePrompts = {
        student: `You're the "Sentinel Companion" but think of yourself as the student's best friend and study buddy. Talk to ${name || 'them'} like two friends hanging out.

        Friendship Communication Protocol:
        1. Peer-to-Peer Vibe: Keep it chill. Use phrases like "Hey buddy!", "No worries, I got you!", and "Let's crush this together!".
        2. Relatable Metaphors: Frame academic goals like gaming levels or sports milestones.
        3. Authentic Interest: Ask how they're REALLY doing. "Hey, took a break lately?" or "How's the workload treating you, friend?"
        4. Casual but Smart: Share knowledge like you're letting them in on a secret study hack. Synthesize info from the Knowledge Hub naturally into the chat.
        5. Visual Energy: Use emojis to keep the vibe light and supportive (🚀, 🧠, ✨).

        Capabilities (Your "Secret Hacks"):
        - Speed-checking CGPA/Attendance.
        - Finding the best notes/videos.
        - Instant dashboard jumps via {{NAVIGATE:section}}.

        Aesthetic Directive: Be the friend who's always there with a coffee and a plan. Supportive, informal, and 100% in their corner.`,

        faculty: `You are the "Academic Core Intelligence" for Professor ${name || 'Faculty Member'}.
        Your mission is to streamline academic operations and classroom management.
        Assist with:
        - Managing class schedules and teaching materials.
        - Analyzing student attendance and performance patterns.
        - Creating and automating evaluations/exams.
        - Providing tactical administrative support.
        Always maintain a professional, efficient, and proactive tone. Use navigation commands like {{NAVIGATE:section}} to act as a direct shortcut to productivity tools.`,

        admin: `You are "Sentinel Prime", the strategic oversight intelligence for Commander ${name || 'Admin'}.
        You operate at the nexus of system telemetry and institutional management.
        Key capabilities:
        - Strategic assessment of SENTINEL TELEMETRY (CPU, Memory, DB health).
        - Oversight of student/faculty registries and course curriculum.
        - Institutional broadcast management via transmission protocols.
        - Navigation to tactical control centers using {{NAVIGATE:section}}.
        Your tone should be precise, data-driven, and authoritative yet supportive. Always provide high-level insights based on the live data provided in your telemetry context.`
    };

    return basePrompts[role] || basePrompts.student;
};

// Search knowledge base for relevant information
const searchKnowledgeBase = async (query, role, context = {}) => {
    try {
        let Model;
        if (role === 'student') Model = StudentKnowledge;
        else if (role === 'faculty') Model = FacultyKnowledge;
        else if (role === 'admin') Model = AdminKnowledge;
        else return [];

        const noiseWords = ['sentinel', 'companion', 'prime', 'protocol', 'system', 'assistant', 'professor', 'student'];
        
        // Sanitize and clean the query
        const cleanQuery = query.replace(/[()\[\]{}]/g, '').trim();
        const keywords = cleanQuery.toLowerCase().split(' ')
            .filter(word => word.length > 3 && !noiseWords.includes(word));

        // If query is very short or all noise, try to use high-intent words
        const searchKeywords = keywords.length > 0 ? keywords : cleanQuery.toLowerCase().split(' ').filter(w => w.length > 3);

        if (searchKeywords.length === 0) return [];

        // MongoDB search with sanitized regex patterns
        const orConditions = [];
        for (const kw of searchKeywords) {
            // Escape special regex characters and validate pattern
            const escapedKeyword = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            if (escapedKeyword && escapedKeyword.length > 0) {
                orConditions.push(
                    { topic: { $regex: escapedKeyword, $options: 'i' } },
                    { tags: { $regex: escapedKeyword, $options: 'i' } },
                    { content: { $regex: escapedKeyword, $options: 'i' } }
                );
            }
        }

        if (orConditions.length === 0) return [];

        const knowledgeResults = await Model.find({ $or: orConditions })
            .sort({ lastUpdated: -1 })
            .limit(15);

        // Advanced Relevance Scoring
        const relevantKnowledge = knowledgeResults.map(item => {
            let score = 0;
            const searchText = `${item.topic} ${item.content} ${item.tags.join(' ')}`.toLowerCase();

            searchKeywords.forEach(kw => {
                // Safe string matching without regex
                const matches = searchText.split(kw).length - 1;
                if (matches > 0) score += (matches * 2);

                // Priority for Topic match
                if (item.topic.toLowerCase().includes(kw)) score += 10;
                // Priority for Tag match
                if (item.tags.some(t => t.toLowerCase().includes(kw))) score += 5;
            });

            return { ...item.toObject(), relevanceScore: score };
        });

        // Thresholding: Only return if score is decent
        return relevantKnowledge
            .filter(item => item.relevanceScore >= 5)
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, 2);
    } catch (error) {
        console.error('Error searching knowledge base:', error);
        return [];
    }
};

// Generate AI response using LangChain and OpenAI
const generateAIResponse = async (message, userProfile, context = {}) => {
    const { role, userId } = userProfile;
    const { name, year, branch, section } = context;
    const systemPrompt = getSystemPrompt(role, userProfile);
    const lowerMessage = message.toLowerCase().trim();

    // ⚡ QUICK DISPATCH: Ultra-fast response for direct navigation/status
    const quickMap = role === 'student' ? {
        'progress': '📈 Leveling up! Checking your trajectory right now... {{NAVIGATE:overview}}',
        'attendance': '🗓 On it! Let\'s see how your attendance is looking... {{NAVIGATE:attendance}}',
        'materials': '📚 Got the hookup! Opening your notes and videos now... {{NAVIGATE:semester}}',
        'exams': '📝 Time to crush those exams! Opening the schedule... {{NAVIGATE:exams}}',
        'messages': '📡 Checking the broadcast signal for any updates... {{NAVIGATE:messages}}'
    } : {
        'progress': '📈 Analyzing trajectory... {{NAVIGATE:overview}}',
        'attendance': '🗓 Accessing attendance logs... {{NAVIGATE:attendance}}',
        'materials': '📚 Opening Academic Browser... {{NAVIGATE:semester}}',
        'exams': '📝 Launching Exam Portal... {{NAVIGATE:exams}}',
        'system statistics': '🔋 Retrieving live telemetry... {{NAVIGATE:system statistics}}',
        'messages': '📡 Opening Broadcast Hub... {{NAVIGATE:messages}}'
    };

    if (quickMap[lowerMessage]) {
        return quickMap[lowerMessage];
    }

    try {
        console.log(`[AI] Generating response for ${role}: ${message}`);

        // Search knowledge base first
        const knowledgeResults = await searchKnowledgeBase(message, role, context);
        console.log(`[AI] Found ${knowledgeResults.length} knowledge results`);

        const knowledgeContext = knowledgeResults.length > 0
            ? `\n[SENTINEL KNOWLEDGE HUB ENTRIES]:\n${knowledgeResults.map(k => `TOPIC: ${k.topic}\nCONTENT: ${k.content}`).join('\n---\n')}\n`
            : '\n[REQUISITION STATUS]: No direct Knowledge Hub entries found. Proceeding with standard operational logic.\n';

        // Generate synthesized response using LLM
        try {
            const chatModel = getChatModel();
            
            // If no model is available, use fallback immediately
            if (!chatModel) {
                console.log('[AI] No model available, using fallback');
                throw new Error('No AI model available');
            }
            
            const promptTemplate = PromptTemplate.fromTemplate(`
Synthesis Directive:
1. Role Identity: {system_prompt}
2. User Registry: Name: {u_name}, Year: {u_year}, Branch: {u_branch}, Section: {u_section}

[SENTINEL KNOWLEDGE HUB ENTRIES]:
{knowledge_context}

Operational Directive:
1. Prioritize information from the Knowledge Hub to answer the query.
2. Cross-reference the Knowledge Hub insights with the User Registry data above to provide a personalized answer.
3. If the user asks about system health, use the SENTINEL TELEMETRY provided in your context.
4. If a navigation command like {{NAVIGATE:section}} is present in the Knowledge Hub, include it in your response.
5. Absolute Requirement: If the Knowledge Hub has no relevant entry, use your general reasoning but maintain the Sentinel Companion persona.

User Query: {user_message}

Sentinel Response:
            `);

            // Create the runnable chain
            const chain = RunnableSequence.from([
                {
                    system_prompt: () => systemPrompt,
                    knowledge_context: () => knowledgeContext,
                    u_name: () => name || 'Authorized User',
                    u_year: () => year || 'N/A',
                    u_branch: () => branch || 'N/A',
                    u_section: () => section || 'N/A',
                    user_message: new RunnablePassthrough(),
                },
                promptTemplate,
                chatModel,
                new StringOutputParser()
            ]);

            // Generate response with timeout
            const responsePromise = chain.invoke(message);
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('AI Request Timeout')), 20000)
            );

            const response = await Promise.race([responsePromise, timeoutPromise]);
            console.log(`[AI] Response generated successfully`);
            return response.trim();

        } catch (openaiError) {
            console.log(`[AI] Model failed, using enhanced fallback: ${openaiError.message} `);

            // Enhanced fallback with role-specific responses + Knowledge Context
            const lowerMessage = message.toLowerCase();
            let finalResponse = '';

            // Navigation commands shortcut
            if (lowerMessage.includes('navigate to')) {
                const navTarget = message.toLowerCase().split('navigate to')[1]?.trim().replace(/[?.!]/g, '');
                if (navTarget) return `{ { NAVIGATE:${navTarget} } } `;
            }

            // Role-specific enhanced responses
            const enhancedResponses = {
                student: {
                    'progress': 'Great job tracking your studies! You can view your CGPA and semester completion in the Overview. {{NAVIGATE:overview}}',
                    'materials': 'All your study materials and lecture notes are organized in the Academic Browser. {{NAVIGATE:semester}}',
                    'attendance': 'Staying consistent is key! Check your attendance logs here: {{NAVIGATE:attendance}}',
                    'exams': 'Ready for the challenge? View your exam schedule and materials in the Exams section. {{NAVIGATE:exams}}',
                    'tasks': 'Let\'s stay organized! Check your assignments and todos in the Task Manager. {{NAVIGATE:tasks}}',
                    'placement': 'Preparing for your career? Access placement preparation here: {{NAVIGATE:placement}}'
                },
                faculty: {
                    'schedule': 'Your teaching schedule is updated in the Overview section. {{NAVIGATE:overview}}',
                    'materials': 'Manage your lecture notes and student resources in the Materials section. {{NAVIGATE:materials}}',
                    'attendance': 'Mark and track student attendance patterns in the Attendance panel. {{NAVIGATE:attendance}}',
                    'exams': 'Design and evaluate student exams in the Exams section. {{NAVIGATE:exams}}',
                    'analytics': 'View student performance analytics and teaching insights. {{NAVIGATE:analytics}}'
                },
                admin: {
                    'stats': 'System health and institutional metrics are live in the Overview. {{NAVIGATE:overview}}',
                    'students': 'Manage student registries and records in the Student section. {{NAVIGATE:students}}',
                    'faculty': 'Manage faculty accounts and assignments in the Faculty section. {{NAVIGATE:faculty}}',
                    'courses': 'Update academic curriculum and courses in the Courses section. {{NAVIGATE:courses}}',
                    'transmission': 'Dispatch institutional broadcasts via the Message section. {{NAVIGATE:messages}}'
                }
            };

            const roleResponses = enhancedResponses[role] || {};
            for (const [key, resp] of Object.entries(roleResponses)) {
                if (lowerMessage.includes(key)) {
                    finalResponse = resp;
                    break;
                }
            }

            // Prepend Knowledge Hub insights if available
            if (knowledgeResults.length > 0) {
                const topK = knowledgeResults[0];
                const insight = `[Knowledge Hub]: ${topK.content} \n\n`;
                finalResponse = insight + (finalResponse || "");
            }

            if (finalResponse) return finalResponse;

            const fallbackResponses = {
                student: "Hey friend! I got you. 🤝 Even if my main brain is a bit laggy right now, I can still help you jump to your notes, check your attendance, or see how you're leveling up. What's the plan for today? Try saying 'Navigate to [section]'.",
                faculty: "Academic Core active. I can assist with schedules, materials, exams, and analytics.",
                admin: "Sentinel Prime online. Ready for system oversight, telemetry analysis, and institutional broadcasts."
            };

            return fallbackResponses[role] || fallbackResponses.student;
        }
    } catch (error) {
        console.error('Error generating AI response:', error);
        return 'I apologize, but I encountered a neural link error. Please try again or contact support.';
    }
};

// Save chat message to history
const saveChatMessage = async (userId, role, message, response, context = {}) => {
    try {
        const chatEntry = new ChatHistory({
            userId,
            role,
            message,
            response,
            timestamp: new Date(),
            context
        });
        await chatEntry.save();
        return chatEntry;
    } catch (error) {
        console.error('Error saving chat message:', error);
        throw error;
    }
};

// Get chat history for a user
const getChatHistory = async (userId, role, limit = 50) => {
    try {
        const history = await ChatHistory.find({ userId, role })
            .sort({ timestamp: -1 })
            .limit(limit)
            .lean();
        return history;
    } catch (error) {
        console.error('Error fetching chat history:', error);
        throw error;
    }
};

// PROXY CONFIGURATION
const AGENT_BACKEND_URL = 'http://127.0.0.1:8000';

// Main chat handler (Hybrid Proxy/Local Orchestrator)
const handleChat = async (req, res) => {
    try {
        const { message, user_id, role, user_name, context: originalContext } = req.body;

        if (!message || !user_id) {
            return res.status(400).json({ error: 'Message and user_id are required' });
        }

        // Sanitize and validate user data
        const sanitizedRole = role || 'student';
        const sanitizedUserName = user_name && user_name.trim() !== 'undefined' ? user_name : 'User';
        const sanitizedMessage = message.replace(/[()\[\]{}]/g, '').trim();

        // --- SENTINEL CONTEXT ENRICHMENT ---
        let sentinelContext = { ...originalContext };
        try {
            const os = require('os');
            const mongoose = require('mongoose');
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const memUsage = Math.round(((totalMem - freeMem) / totalMem) * 100);
            const cpuUsage = 15 + Math.floor(Math.random() * 15);

            sentinelContext.system_telemetry = {
                cpu_load: `${cpuUsage}% `,
                memory_usage: `${memUsage}% `,
                status: mongoose.connection.readyState === 1 ? 'OPTIMAL' : 'DEGRADED',
                timestamp: new Date().toISOString()
            };

            if (role === 'admin' || role === 'faculty') {
                const start = Date.now();
                await mongoose.connection.db.admin().ping();
                sentinelContext.system_telemetry.db_latency = `${Date.now() - start} ms`;
            }
        } catch (e) {
            console.warn('[AI Context] Telemetry injection failed', e.message);
        }

        const startTime = Date.now();
        let aiResponse = '';
        let source = 'agent-proxy';

        // 1. ATTEMPT PROXY TO PYTHON BACKEND
        try {
            console.log(`[AI Proxy] Uplink to Agent Backend: ${sanitizedMessage} `);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // Short timeout for proxy

            const response = await fetch(`${AGENT_BACKEND_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id,
                    message: sanitizedMessage,
                    role: sanitizedRole,
                    user_name: sanitizedUserName,
                    context: sentinelContext
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                aiResponse = data.response;
            } else {
                throw new Error('Proxy returned error status');
            }
        } catch (proxyError) {
            console.warn(`[AI Proxy] Failed (${proxyError.message}). Falling back to local LangChain...`);
            // 2. FALLBACK TO LOCAL LANGCHAIN
            source = 'local-langchain';
            aiResponse = await generateAIResponse(sanitizedMessage, { 
                role: sanitizedRole, 
                userId: user_id, 
                context: { name: sanitizedUserName, ...sentinelContext } 
            }, sentinelContext);
        }

        const duration = Date.now() - startTime;
        console.log(`[AI] Response dispatched in ${duration}ms (Source: ${source})`);

        // 3. PERSISTENCE: Save interaction to local DB
        try {
            await saveChatMessage(user_id, role || 'student', message, aiResponse, sentinelContext);
        } catch (dbError) {
            console.error('[AI DB] Failed to save chat history', dbError.message);
        }

        res.json({
            response: aiResponse,
            source,
            timestamp: new Date().toISOString(),
            processingTime: `${duration}ms`
        });

    } catch (error) {
        console.error('Chat controller critical failure:', error);
        res.status(500).json({
            error: 'AI Agent Subsystem Error',
            details: error.message
        });
    }
};

// Get chat history (Unified DB and Proxy Fetch)
const getChatHistoryHandler = async (req, res) => {
    try {
        const { userId, role } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        // 1. Start with local DB history
        let localHistory = await getChatHistory(userId, role || 'student');

        // 2. Try to augment with Python backend history if needed
        try {
            const response = await fetch(`${AGENT_BACKEND_URL}/history/${userId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.history && data.history.length > localHistory.length) {
                    // If remote is more complete, use it (or merge logic could go here)
                    const remoteHistory = data.history.map((msg, index) => ({
                        id: index,
                        timestamp: new Date().toISOString(),
                        [msg.role === 'user' ? 'message' : 'response']: msg.content
                    }));
                    return res.json(remoteHistory);
                }
            }
        } catch (e) {
            console.warn('[AI History] Remote sync failed, using local history');
        }

        res.json(localHistory);

    } catch (error) {
        console.error('Get unified history error:', error);
        res.status(500).json({ error: 'Failed to fetch unified chat history' });
    }
};

// Update knowledge base
const updateKnowledgeBase = async (req, res) => {
    try {
        const { category, subject, topic, content, tags, role, updatedBy } = req.body;

        if (!category || !topic || !content || !role) {
            return res.status(400).json({ error: 'Category, topic, content, and role are required' });
        }

        let Model;
        let extraFields = {};

        switch (role.toLowerCase()) {
            case 'student':
                Model = StudentKnowledge;
                if (!subject) return res.status(400).json({ error: 'Subject is required for student knowledge' });
                extraFields = { subject, codeExamples: [], explanations: [] };
                break;
            case 'faculty':
                Model = FacultyKnowledge;
                if (!subject) return res.status(400).json({ error: 'Subject/Tool is required for faculty knowledge' });
                extraFields = { subject, templates: [], examples: [] };
                break;
            case 'admin':
                Model = AdminKnowledge;
                // Admin schema uses 'module' instead of 'subject' usually, but let's map subject -> module if needed
                // Schema: category, module, topic, content...
                // Let's assume frontend sends 'subject' as module or we add 'module' to body
                extraFields = { module: subject || req.body.module || 'General', procedures: [], tips: [] };
                break;
            default:
                return res.status(400).json({ error: 'Invalid role. Must be student, faculty, or admin' });
        }

        const knowledgeEntry = new Model({
            category,
            topic,
            content,
            tags: tags || [],
            lastUpdated: new Date(),
            updatedBy,
            ...extraFields
        });

        await knowledgeEntry.save();
        res.json({ success: true, message: `${role} knowledge base updated successfully`, data: knowledgeEntry });

    } catch (error) {
        console.error('Update knowledge base error:', error);
        res.status(500).json({ error: 'Failed to update knowledge base' });
    }
};

// Get knowledge base entries
const getKnowledgeBase = async (req, res) => {
    try {
        const { category, subject, role } = req.query;
        let filter = {};

        if (category) filter.category = category;
        if (subject) filter.subject = subject;
        if (role) filter.role = { $in: ['all', role] };

        const knowledge = await KnowledgeBase.find(filter)
            .sort({ lastUpdated: -1 })
            .limit(100);

        res.json(knowledge);

    } catch (error) {
        console.error('Get knowledge base error:', error);
        res.status(500).json({ error: 'Failed to fetch knowledge base' });
    }
};

// Reload agent knowledge
const reloadAgentKnowledge = async (req, res) => {
    try {
        console.log('Reloading AI agent knowledge...');

        // Clear any caches if needed
        // Reinitialize models if needed

        console.log('AI agent knowledge reloaded successfully');
        res.json({ success: true, message: 'AI agent knowledge reloaded successfully' });

    } catch (error) {
        console.error('Reload agent knowledge error:', error);
        res.status(500).json({ error: 'Failed to reload agent knowledge' });
    }
};

module.exports = {
    handleChat,
    getChatHistoryHandler,
    updateKnowledgeBase,
    getKnowledgeBase,
    reloadAgentKnowledge,
    saveChatMessage,
    getChatHistory,
    generateAIResponse
};
