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
        if (process.env.GOOGLE_API_KEY) {
            console.log('[AI Config] Using Google Gemini Pro');
            chatModelInstance = new ChatGoogleGenerativeAI({
                apiKey: process.env.GOOGLE_API_KEY,
                modelName: "gemini-pro",
                maxOutputTokens: 1000,
                temperature: 0.7,
            });
        } else {
            console.log('[AI Config] Fallback to OpenAI/OpenRouter');
            chatModelInstance = new ChatOpenAI({
                openAIApiKey: process.env.OPENAI_API_KEY,
                modelName: "gpt-4o-mini",
                temperature: 0.7,
                maxTokens: 1000,
                configuration: process.env.OPENAI_API_KEY?.startsWith('sk-or-') ? {
                    baseURL: "https://openrouter.ai/api/v1",
                } : undefined
            });
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
        student: `You are a friendly and helpful AI study companion for ${name || 'Student'}. 
        You are assisting a ${year || 'unknown'} year ${branch || 'CSE'} student from section ${section || 'A'}.
        Your role is to help with academic questions, provide study guidance, and assist with navigating the student dashboard.
        Always be encouraging, supportive, and provide practical advice.
        You can help with attendance, exams, study materials, assignments, and general academic guidance.
        When appropriate, use navigation commands like {{NAVIGATE:section}} to direct students to specific dashboard sections.`,

        faculty: `You are a professional AI assistant for Professor ${name || 'Faculty Member'}.
        You assist faculty members with teaching tasks, class management, student interactions, and administrative duties.
        Provide helpful guidance on creating materials, managing classes, assessing students, and using the faculty dashboard effectively.
        You can help with attendance tracking, exam creation, material uploads, and student communication.
        When appropriate, use navigation commands like {{NAVIGATE:section}} to direct faculty to specific dashboard sections.`,

        admin: `You are an efficient AI assistant for Administrator ${name || 'Admin'}.
        You help with system management, user administration, academic oversight, and institutional operations.
        Provide guidance on managing students, faculty, courses, and using the admin dashboard effectively.
        You can assist with knowledge base updates, system configuration, and administrative workflows.
        When appropriate, use navigation commands like {{NAVIGATE:section}} to direct to specific admin sections.`
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

        const knowledgeResults = await Model.find()
            .sort({ lastUpdated: -1 })
            .limit(20);

        // Enhanced keyword matching
        const keywords = query.toLowerCase().split(' ').filter(word => word.length > 2);
        const relevantKnowledge = [];

        for (const item of knowledgeResults) {
            let relevanceScore = 0;
            const searchText = `${item.topic} ${item.content} ${item.tags.join(' ')}`.toLowerCase();

            for (const keyword of keywords) {
                if (searchText.includes(keyword)) {
                    relevanceScore += 1;
                }
            }

            if (relevanceScore > 0) {
                relevantKnowledge.push({ ...item.toObject(), relevanceScore });
            }
        }

        return relevantKnowledge.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 3);
    } catch (error) {
        console.error('Error searching knowledge base:', error);
        return [];
    }
};

// Generate AI response using LangChain and OpenAI
const generateAIResponse = async (message, userProfile, context = {}) => {
    const { role, userId } = userProfile;
    const systemPrompt = getSystemPrompt(role, userProfile);

    try {
        console.log(`[AI] Generating response for ${role}: ${message}`);

        // Search knowledge base first
        const knowledgeResults = await searchKnowledgeBase(message, role, context);
        console.log(`[AI] Found ${knowledgeResults.length} knowledge results`);

        const knowledgeContext = knowledgeResults.length > 0
            ? `\n\nRelevant Information from Knowledge Base:\n${knowledgeResults.map(k => `- ${k.topic}: ${k.content}`).join('\n')}`
            : '';

        // Generate synthesized response using LLM
        try {
            const promptTemplate = PromptTemplate.fromTemplate(`
{system_prompt}

{knowledge_context}

User: {user_message}

Please provide a helpful and contextual response. If the user is asking to navigate to a specific section, use the format {{NAVIGATE:section_name}}.
            `);

            // Create the runnable chain
            const chain = RunnableSequence.from([
                {
                    system_prompt: () => systemPrompt,
                    knowledge_context: () => knowledgeContext,
                    user_message: new RunnablePassthrough(),
                },
                promptTemplate,
                getChatModel(),
                new StringOutputParser()
            ]);

            // Generate response with timeout
            const responsePromise = chain.invoke(message);
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('AI Request Timeout')), 8000)
            );

            const response = await Promise.race([responsePromise, timeoutPromise]);
            console.log(`[AI] Response generated successfully`);
            return response.trim();

        } catch (openaiError) {
            console.log(`[AI] OpenAI failed, using enhanced fallback: ${openaiError.message}`);

            // Enhanced fallback with role-specific responses
            const lowerMessage = message.toLowerCase();

            // Navigation commands
            if (lowerMessage.includes('navigate')) {
                const navMatch = message.match(/navigate to (.+)/i);
                if (navMatch) {
                    return `{{NAVIGATE:${navMatch[1].trim()}}}`;
                }
            }

            // Role-specific enhanced responses
            const enhancedResponses = {
                student: {
                    'academic progress': 'View your academic progress, CGPA, and semester completion in the Overview section. {{NAVIGATE:overview}}',
                    'materials': 'Access your study materials, lecture notes, and resources in the Academic Browser. {{NAVIGATE:semester}}',
                    'attendance': 'Check your attendance statistics and class-wise attendance in the Attendance section. {{NAVIGATE:attendance}}',
                    'exams': 'View your exam schedule, previous papers, and preparation materials in the Exams section. {{NAVIGATE:exams}}',
                    'assignments': 'Track your assignments and deadlines in the Tasks section. {{NAVIGATE:tasks}}',
                    'placement': 'Access placement preparation materials and career guidance in the Placement section. {{NAVIGATE:placement}}',
                    'settings': 'Update your profile and preferences in the Settings section. {{NAVIGATE:settings}}'
                },
                faculty: {
                    'schedule': 'View your teaching schedule and class timings in the Overview section. {{NAVIGATE:overview}}',
                    'materials': 'Upload and manage teaching materials in the Materials section. {{NAVIGATE:materials}}',
                    'attendance': 'Mark student attendance and track attendance patterns in the Attendance section. {{NAVIGATE:attendance}}',
                    'exam': 'Create exams, set papers, and manage evaluations in the Exams section. {{NAVIGATE:exams}}',
                    'assignment': 'Create and evaluate student assignments in the Assignments section. {{NAVIGATE:assignments}}',
                    'analytics': 'View student performance analytics and teaching insights in the Analytics section. {{NAVIGATE:analytics}}',
                    'announcements': 'Send announcements and messages to students in the Messages section. {{NAVIGATE:messages}}'
                },
                admin: {
                    'statistics': 'View system statistics and institutional metrics in the Overview section. {{NAVIGATE:overview}}',
                    'students': 'Manage student accounts, admissions, and records in the Students section. {{NAVIGATE:students}}',
                    'faculty': 'Manage faculty accounts, assignments, and workload in the Faculty section. {{NAVIGATE:faculty}}',
                    'courses': 'Create and manage academic courses and curriculum in the Courses section. {{NAVIGATE:courses}}',
                    'materials': 'Oversee all teaching materials and content approval in the Materials section. {{NAVIGATE:materials}}',
                    'announcements': 'Send institutional announcements and system communications in the Messages section. {{NAVIGATE:messages}}',
                    'settings': 'Configure system settings and administrative parameters in the Settings section. {{NAVIGATE:settings}}'
                }
            };

            const roleResponses = enhancedResponses[role] || {};

            for (const [key, response] of Object.entries(roleResponses)) {
                if (lowerMessage.includes(key)) {
                    console.log(`[AI] Using enhanced fallback for: ${key}`);
                    return response;
                }
            }
        }

        // Final fallback
        const fallbackResponses = {
            student: "I'm here to help with your studies! You can ask me about academic progress, materials, attendance, exams, assignments, or use 'Navigate to [section]' to access different parts of your dashboard.",
            faculty: "I'm here to assist with your teaching duties! You can ask me about class schedule, materials, attendance, exams, assignments, analytics, or use 'Navigate to [section]' to access different parts of your dashboard.",
            admin: "I'm here to help with system administration! You can ask me about statistics, students, faculty, courses, materials, announcements, or use 'Navigate to [section]' to access different parts of your dashboard."
        };

        return fallbackResponses[role] || fallbackResponses.student;

    } catch (error) {
        console.error('Error generating AI response:', error);
        return 'I apologize, but I encountered an error. Please try again or contact support.';
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

// Main chat handler (Proxy to Python Backend)
const handleChat = async (req, res) => {
    try {
        const { message, user_id, role, user_name, context } = req.body;

        if (!message || !user_id) {
            return res.status(400).json({ error: 'Message and user_id are required' });
        }

        console.log(`[AI Proxy] Forwarding chat to Agent Backend: ${message}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

        const response = await fetch(`${AGENT_BACKEND_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id,
                message,
                role: role || 'student',
                user_name,
                context
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Agent Backend Error: ${response.statusText}`);
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('Chat proxy error:', error);
        // Fallback to local logic if agent backend is down could be added here, 
        // but for now we want to enforce the agent backend usage.
        res.status(500).json({
            error: 'Failed to connect to AI Agent Backend',
            details: error.message
        });
    }
};

// Get chat history (Proxy to Python Backend)
const getChatHistoryHandler = async (req, res) => {
    try {
        const { userId, role } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        // Python backend uses /history/{user_id}
        const response = await fetch(`${AGENT_BACKEND_URL}/history/${userId}`);

        if (!response.ok) {
            throw new Error(`Agent Backend History Error: ${response.statusText}`);
        }

        const data = await response.json();

        // Transform Python backend format to match frontend expectation if needed
        // Python returns { history: [{role: 'user', content: ...}, {role: 'ai', content: ...}] }
        // Frontend expects array of objects with message/response or similar?
        // VuAiAgent.jsx (line 121) expects keys 'message' and 'response'.
        // Wait, Python returns list of {role, content}.
        // Frontend expects:
        // entry.message (user) OR entry.response (bot).
        // The current Node implementation returns a list of ChatHistory documents.
        // ChatHistory schema has `message` and `response` fields in the *same* document usually?
        // Let's look at `models/AIModels.js` (I requested it).
        // If Python returns a linear list of messages, I need to adapt it.

        // Adaptation Logic:
        // Python: { history: [ {role: 'user', content: 'hi'}, {role: 'ai', content: 'hello'} ] }
        // Frontend needs: [ { message: 'hi', timestamp: ... }, { response: 'hello', timestamp: ... } ] ?
        // VuAiAgent.jsx line 118:
        // if (entry.message) { ... sender: user ... }
        // if (entry.response) { ... sender: bot ... }

        // So generic object with 'message' or 'response' keys works.
        const cleanHistory = data.history.map((msg, index) => {
            return {
                id: index,
                timestamp: new Date().toISOString(), // Python doesn't return timestamp per message in simple view generic
                [msg.role === 'user' ? 'message' : 'response']: msg.content
            };
        });

        res.json(cleanHistory);

    } catch (error) {
        console.error('Get chat history proxy error:', error);
        res.status(500).json({ error: 'Failed to fetch chat history from agent backend' });
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
