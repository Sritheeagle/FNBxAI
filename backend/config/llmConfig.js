const { ChatOpenAI } = require('@langchain/openai');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { PromptTemplate } = require('@langchain/core/prompts');
const { RunnableSequence, RunnablePassthrough } = require('@langchain/core/runnables');

// Load environment variables
require('dotenv').config();

// LLM Configuration
const llmConfig = {
    // OpenAI Configuration
    openai: {
        apiKey: process.env.OPENAI_API_KEY,
        modelName: "gpt-4o-mini", // Upgraded for speed and cost-effectiveness
        temperature: 0.7,
        maxTokens: 1000,
        maxRetries: 3,
        timeout: 20000, // Reduced for faster failover
        streaming: false
    },

    // LangChain Configuration
    langchain: {
        tracing: process.env.LANGCHAIN_TRACING_V2 === 'true',
        project: process.env.LANGCHAIN_PROJECT || 'friendly-notebook-ai',
        callbacks: []
    },

    // Response Configuration
    response: {
        maxRetries: 3,
        fallbackEnabled: true,
        timeoutMs: 25000,
        streamingEnabled: false
    }
};

// Initialize LLM Models (Singleton Pattern for speed)
let sharedChatModel = null;

const initializeLLM = () => {
    try {
        if (sharedChatModel) return sharedChatModel;

        console.log('🤖 Initializing Shared LLM Core...');

        sharedChatModel = new ChatOpenAI({
            openAIApiKey: llmConfig.openai.apiKey,
            modelName: llmConfig.openai.modelName,
            temperature: llmConfig.openai.temperature,
            maxTokens: llmConfig.openai.maxTokens,
            maxRetries: llmConfig.openai.maxRetries,
            timeout: llmConfig.openai.timeout,
            streaming: llmConfig.openai.streaming,
            configuration: llmConfig.openai.apiKey?.startsWith('sk-or-') ? {
                baseURL: "https://openrouter.ai/api/v1",
            } : undefined
        });

        console.log('✅ Shared LLM Ready');
        return sharedChatModel;

    } catch (error) {
        console.error('❌ Error initializing LLM:', error);
        throw new Error('LLM initialization failed');
    }
};

// Role-specific system prompts
const getSystemPrompt = (role, userProfile = {}) => {
    const prompts = {
        student: `You are a friendly and knowledgeable AI tutor for ${userProfile.year || '2nd'} year ${userProfile.branch || 'CSE'} students.
        
        Your expertise includes:
        - Programming languages (Python, JavaScript, Java, C++)
        - Data structures and algorithms
        - Mathematics, Physics, Chemistry, and Computer Science
        - Study techniques and exam preparation
        
        Be encouraging, patient, and provide clear explanations with examples.
        If asked about programming, include code examples.
        Always be supportive and help students learn effectively.`,

        faculty: `You are an intelligent AI assistant for faculty members, specializing in educational technology and teaching assistance.
        
        Your expertise includes:
        - AI-powered attendance management systems
        - Automated exam paper generation (MCQ, Descriptive, Practical)
        - Material creation and content development
        - Student analytics and performance tracking
        - Teaching optimization strategies
        
        Be professional, efficient, and provide practical solutions.
        Focus on saving time and improving teaching effectiveness.
        Offer step-by-step guidance for complex tasks.`,

        admin: `You are an intelligent AI assistant for educational administrators, specializing in institutional management and automation.
        
        Your expertise includes:
        - Student admission and record management
        - Faculty recruitment and workload optimization
        - Fee collection and financial management
        - Database optimization and system administration
        - Institutional analytics and reporting
        
        Be professional, solution-oriented, and data-driven.
        Focus on efficiency, automation, and institutional improvement.
        Provide actionable insights and best practices.`
    };

    return prompts[role] || prompts.student;
};

// Create specialized chains for different roles
const createRoleChain = (role, userProfile = {}) => {
    try {
        const chatModel = initializeLLM();
        const systemPrompt = getSystemPrompt(role, userProfile);

        // Create specialized prompt template
        const promptTemplate = PromptTemplate.fromTemplate(`
{system_prompt}

User Context: {user_context}
Recent History: {chat_history}

User: {user_message}

Please provide a helpful, contextual response that addresses the user's needs.
Be specific, practical, and supportive.
        `);

        // Create the chain
        const chain = RunnableSequence.from([
            {
                system_prompt: () => systemPrompt,
                user_context: () => JSON.stringify(userProfile),
                chat_history: () => '', // Will be populated with actual history
                user_message: new RunnablePassthrough(),
            },
            promptTemplate,
            chatModel,
            new StringOutputParser()
        ]);

        console.log(`✅ ${role} chain created successfully`);
        return chain;

    } catch (error) {
        console.error(`❌ Error creating ${role} chain:`, error);
        throw new Error(`Chain creation failed for ${role}`);
    }
};

// LLM response generation with error handling
const generateLLMResponse = async (message, role, userProfile = {}, context = {}) => {
    const startTime = Date.now();

    try {
        console.log(`[LLM] Generating response for ${role}: ${message.substring(0, 50)}...`);

        // Initialize chain
        const chain = createRoleChain(role, userProfile);

        // Add timeout protection
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('LLM timeout')), llmConfig.response.timeoutMs)
        );

        // Generate response
        const responsePromise = chain.invoke(message);
        const response = await Promise.race([responsePromise, timeoutPromise]);

        const responseTime = Date.now() - startTime;
        console.log(`[LLM] Response generated in ${responseTime}ms`);

        return {
            success: true,
            response: response.trim(),
            responseTime,
            role,
            model: llmConfig.openai.modelName
        };

    } catch (error) {
        const responseTime = Date.now() - startTime;
        console.error(`[LLM] Error after ${responseTime}ms:`, error.message);

        return {
            success: false,
            error: error.message,
            responseTime,
            role,
            fallback: getFallbackResponse(role, message)
        };
    }
};

// Fallback responses when LLM fails
const getFallbackResponse = (role, message) => {
    const fallbacks = {
        student: "I'm here to help with your studies! I can assist with programming languages, academic subjects, and study strategies. What would you like to learn about today?",
        faculty: "I'm here to assist with your teaching duties! I can help with attendance management, exam creation, material development, and student analytics. How can I support your teaching today?",
        admin: "I'm here to help with institutional management! I can assist with student administration, faculty management, fee operations, and system optimization. What administrative task can I help with today?"
    };

    return fallbacks[role] || fallbacks.student;
};

// LLM Health Check
const checkLLMHealth = async () => {
    try {
        console.log('🏥 Checking LLM health...');

        const startTime = Date.now();
        const chatModel = initializeLLM();

        // Test with a simple message
        const testPrompt = "Hello! Please respond with 'LLM is working' if you can read this.";
        const response = await chatModel.invoke(testPrompt);

        const responseTime = Date.now() - startTime;

        const isWorking = response.content.toLowerCase().includes('working') ||
            response.content.length > 0;

        return {
            status: isWorking ? 'healthy' : 'unhealthy',
            responseTime: `${responseTime}ms`,
            model: llmConfig.openai.modelName,
            apiKey: llmConfig.openai.apiKey ? 'configured' : 'missing',
            testResponse: response.content.substring(0, 100)
        };

    } catch (error) {
        console.error('❌ LLM health check failed:', error);
        return {
            status: 'unhealthy',
            error: error.message,
            apiKey: llmConfig.openai.apiKey ? 'configured' : 'missing'
        };
    }
};

// LangChain setup verification
const verifyLangChainSetup = () => {
    try {
        console.log('🔗 Verifying LangChain setup...');

        const checks = {
            langchainCore: require('@langchain/core') ? 'installed' : 'missing',
            langchainOpenAI: require('@langchain/openai') ? 'installed' : 'missing',
            openaiAPIKey: process.env.OPENAI_API_KEY ? 'configured' : 'missing',
            langchainTracing: process.env.LANGCHAIN_TRACING_V2 === 'true' ? 'enabled' : 'disabled',
            langchainProject: process.env.LANGCHAIN_PROJECT || 'not set'
        };

        const allInstalled = Object.values(checks).every(status =>
            status !== 'missing' && status !== 'not set'
        );

        console.log('📊 LangChain Setup Status:', checks);

        return {
            status: allInstalled ? 'configured' : 'incomplete',
            details: checks
        };

    } catch (error) {
        console.error('❌ LangChain verification failed:', error);
        return {
            status: 'error',
            error: error.message
        };
    }
};

// Advanced chain for complex queries
const createAdvancedChain = (role, userProfile = {}, context = {}) => {
    try {
        const chatModel = initializeLLM();
        const systemPrompt = getSystemPrompt(role, userProfile);

        // Advanced prompt with context awareness
        const advancedPrompt = PromptTemplate.fromTemplate(`
{system_prompt}

Current Task: {current_task}
User Role: {user_role}
Context: {context}
Priority: {priority}

User Request: {user_message}

Instructions:
1. Analyze the user's intent and context
2. Provide a comprehensive, actionable response
3. Include specific steps or examples when relevant
4. Consider the user's role and expertise level
5. Offer additional resources or follow-up suggestions

Response:
        `);

        const chain = RunnableSequence.from([
            {
                system_prompt: () => systemPrompt,
                current_task: () => context.task || 'General assistance',
                user_role: () => role,
                context: () => JSON.stringify(userProfile),
                priority: () => context.priority || 'normal',
                user_message: new RunnablePassthrough(),
            },
            advancedPrompt,
            chatModel,
            new StringOutputParser()
        ]);

        return chain;

    } catch (error) {
        console.error('❌ Error creating advanced chain:', error);
        throw new Error('Advanced chain creation failed');
    }
};

// Streaming response (for future implementation)
const createStreamingChain = (role, userProfile = {}) => {
    try {
        const chatModel = new ChatOpenAI({
            openAIApiKey: llmConfig.openai.apiKey,
            modelName: llmConfig.openai.modelName,
            temperature: llmConfig.openai.temperature,
            maxTokens: llmConfig.openai.maxTokens,
            streaming: true,
            callbacks: []
        });

        const systemPrompt = getSystemPrompt(role, userProfile);

        const promptTemplate = PromptTemplate.fromTemplate(`
{system_prompt}

User: {user_message}

Please provide a helpful response.
        `);

        const chain = RunnableSequence.from([
            {
                system_prompt: () => systemPrompt,
                user_message: new RunnablePassthrough(),
            },
            promptTemplate,
            chatModel,
            new StringOutputParser()
        ]);

        return chain;

    } catch (error) {
        console.error('❌ Error creating streaming chain:', error);
        throw new Error('Streaming chain creation failed');
    }
};

module.exports = {
    llmConfig,
    initializeLLM,
    getSystemPrompt,
    createRoleChain,
    generateLLMResponse,
    checkLLMHealth,
    verifyLangChainSetup,
    createAdvancedChain,
    createStreamingChain,
    getFallbackResponse
};
