const express = require('express');
const router = express.Router();
const { 
    generateLLMResponse, 
    checkLLMHealth, 
    verifyLangChainSetup,
    createAdvancedChain,
    createStreamingChain,
    llmConfig
} = require('../config/llmConfig');

// Main LLM chat endpoint
router.post('/chat', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { message, role, user_profile, context } = req.body;
        
        if (!message || !role) {
            return res.status(400).json({ 
                error: 'Message and role are required' 
            });
        }
        
        console.log(`[LLM API] ${role} request: ${message.substring(0, 50)}...`);
        
        const result = await generateLLMResponse(message, role, user_profile || {}, context || {});
        
        const responseTime = Date.now() - startTime;
        
        if (result.success) {
            res.json({
                success: true,
                response: result.response,
                role,
                model: result.model,
                responseTime: result.responseTime,
                apiTime: responseTime
            });
        } else {
            res.json({
                success: false,
                error: result.error,
                fallback: result.fallback,
                role,
                responseTime: result.responseTime,
                apiTime: responseTime
            });
        }
        
    } catch (error) {
        const responseTime = Date.now() - startTime;
        console.error('[LLM API] Error:', error);
        
        res.status(500).json({ 
            error: 'LLM request failed',
            details: error.message,
            responseTime
        });
    }
});

// Advanced LLM chat for complex queries
router.post('/advanced', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { message, role, user_profile, context } = req.body;
        
        if (!message || !role) {
            return res.status(400).json({ 
                error: 'Message and role are required' 
            });
        }
        
        console.log(`[LLM Advanced] ${role} complex query: ${message.substring(0, 50)}...`);
        
        const chain = createAdvancedChain(role, user_profile || {}, context || {});
        const response = await chain.invoke(message);
        
        const responseTime = Date.now() - startTime;
        
        res.json({
            success: true,
            response: response.trim(),
            role,
            model: llmConfig.openai.modelName,
            type: 'advanced',
            responseTime,
            context: context || {}
        });
        
    } catch (error) {
        const responseTime = Date.now() - startTime;
        console.error('[LLM Advanced] Error:', error);
        
        res.status(500).json({ 
            error: 'Advanced LLM request failed',
            details: error.message,
            responseTime
        });
    }
});

// Batch LLM processing
router.post('/batch', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { requests } = req.body;
        
        if (!Array.isArray(requests) || requests.length === 0) {
            return res.status(400).json({ 
                error: 'Requests array is required' 
            });
        }
        
        console.log(`[LLM Batch] Processing ${requests.length} requests`);
        
        const results = await Promise.allSettled(
            requests.map(async (request) => {
                const { message, role, user_profile, context } = request;
                return await generateLLMResponse(message, role, user_profile || {}, context || {});
            })
        );
        
        const processedResults = results.map(result => 
            result.status === 'fulfilled' 
                ? { success: true, ...result.value }
                : { success: false, error: result.reason.message }
        );
        
        const responseTime = Date.now() - startTime;
        const successCount = processedResults.filter(r => r.success).length;
        
        res.json({
            success: true,
            results: processedResults,
            totalRequests: requests.length,
            successCount,
            failureCount: requests.length - successCount,
            responseTime,
            averageTime: Math.round(responseTime / requests.length)
        });
        
    } catch (error) {
        const responseTime = Date.now() - startTime;
        console.error('[LLM Batch] Error:', error);
        
        res.status(500).json({ 
            error: 'Batch LLM request failed',
            details: error.message,
            responseTime
        });
    }
});

// LLM Health Check
router.get('/health', async (req, res) => {
    try {
        const healthStatus = await checkLLMHealth();
        
        res.json({
            status: 'success',
            llm: healthStatus,
            config: {
                model: llmConfig.openai.modelName,
                temperature: llmConfig.openai.temperature,
                maxTokens: llmConfig.openai.maxTokens,
                timeout: llmConfig.response.timeoutMs
            },
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('[LLM Health] Error:', error);
        res.status(500).json({ 
            error: 'Health check failed',
            details: error.message
        });
    }
});

// LangChain Setup Verification
router.get('/langchain/status', (req, res) => {
    try {
        const langchainStatus = verifyLangChainSetup();
        
        res.json({
            status: 'success',
            langchain: langchainStatus,
            config: {
                tracing: llmConfig.langchain.tracing,
                project: llmConfig.langchain.project,
                openaiConfigured: !!llmConfig.openai.apiKey
            },
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('[LangChain Status] Error:', error);
        res.status(500).json({ 
            error: 'LangChain status check failed',
            details: error.message
        });
    }
});

// LLM Configuration Info
router.get('/config', (req, res) => {
    try {
        res.json({
            status: 'success',
            llm: {
                model: llmConfig.openai.modelName,
                temperature: llmConfig.openai.temperature,
                maxTokens: llmConfig.openai.maxTokens,
                maxRetries: llmConfig.openai.maxRetries,
                timeout: llmConfig.openai.timeout,
                streaming: llmConfig.openai.streaming
            },
            langchain: {
                tracing: llmConfig.langchain.tracing,
                project: llmConfig.langchain.project
            },
            response: {
                maxRetries: llmConfig.response.maxRetries,
                fallbackEnabled: llmConfig.response.fallbackEnabled,
                timeoutMs: llmConfig.response.timeoutMs,
                streamingEnabled: llmConfig.response.streamingEnabled
            },
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('[LLM Config] Error:', error);
        res.status(500).json({ 
            error: 'Configuration fetch failed',
            details: error.message
        });
    }
});

// Role-specific system prompts
router.get('/prompts/:role', (req, res) => {
    try {
        const { role } = req.params;
        const { getSystemPrompt } = require('../config/llmConfig');
        
        const validRoles = ['student', 'faculty', 'admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ 
                error: 'Invalid role. Must be student, faculty, or admin' 
            });
        }
        
        const systemPrompt = getSystemPrompt(role);
        
        res.json({
            status: 'success',
            role,
            systemPrompt,
            length: systemPrompt.length,
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('[LLM Prompts] Error:', error);
        res.status(500).json({ 
            error: 'Prompt fetch failed',
            details: error.message
        });
    }
});

// Test specific LLM functionality
router.post('/test', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { test_type, role, message } = req.body;
        
        if (!test_type || !role) {
            return res.status(400).json({ 
                error: 'Test type and role are required' 
            });
        }
        
        let result;
        
        switch (test_type) {
            case 'basic':
                result = await generateLLMResponse(
                    message || 'Hello! Please respond with "Test successful" if you can read this.',
                    role
                );
                break;
                
            case 'health':
                result = await checkLLMHealth();
                break;
                
            case 'advanced':
                const chain = createAdvancedChain(role);
                result = {
                    success: true,
                    response: await chain.invoke(message || 'Explain your capabilities'),
                    type: 'advanced'
                };
                break;
                
            default:
                return res.status(400).json({ 
                    error: 'Invalid test type. Use basic, health, or advanced' 
                });
        }
        
        const responseTime = Date.now() - startTime;
        
        res.json({
            status: 'success',
            test_type,
            role,
            result,
            responseTime,
            timestamp: new Date()
        });
        
    } catch (error) {
        const responseTime = Date.now() - startTime;
        console.error('[LLM Test] Error:', error);
        
        res.status(500).json({ 
            error: 'LLM test failed',
            details: error.message,
            responseTime
        });
    }
});

// Reset/Reinitialize LLM
router.post('/reset', async (req, res) => {
    try {
        console.log('[LLM Reset] Reinitializing LLM...');
        
        // Reinitialize LLM (this would clear any cached connections)
        const { initializeLLM } = require('../config/llmConfig');
        const chatModel = initializeLLM();
        
        // Test the reinitialized model
        const testResponse = await chatModel.invoke('Test message after reset');
        
        res.json({
            status: 'success',
            message: 'LLM reinitialized successfully',
            testResponse: testResponse.content.substring(0, 100),
            model: llmConfig.openai.modelName,
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('[LLM Reset] Error:', error);
        res.status(500).json({ 
            error: 'LLM reset failed',
            details: error.message
        });
    }
});

module.exports = router;
