const express = require('express');
const router = express.Router();
const { 
    generateOptimizedAIResponse,
    saveChatHistoryFast,
    updateKnowledgeBaseFast,
    searchKnowledgeBaseFast,
    getChatHistoryFast,
    batchProcessRequests,
    monitorPerformance
} = require('../controllers/optimizedAIController');

// Fast AI Chat endpoint with performance monitoring
router.post('/chat', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { message, user_id, role, user_name, context } = req.body;
        
        if (!message || !user_id || !role) {
            return res.status(400).json({ 
                error: 'Message, user_id, and role are required' 
            });
        }
        
        const userProfile = {
            userId: user_id,
            role,
            user_name,
            ...context
        };
        
        // Generate fast AI response
        const response = await generateOptimizedAIResponse(message, userProfile, context);
        
        // Save chat history asynchronously (non-blocking)
        saveChatHistoryFast([{
            userId: user_id,
            role,
            message,
            response,
            timestamp: new Date(),
            context
        }]).catch(error => {
            console.error('Error saving chat history:', error);
        });
        
        monitorPerformance('AI Chat', startTime);
        
        res.json({ 
            response,
            role,
            context: userProfile,
            responseTime: Date.now() - startTime
        });
        
    } catch (error) {
        console.error('Fast AI Chat error:', error);
        res.status(500).json({ 
            error: 'Failed to process AI request',
            responseTime: Date.now() - startTime
        });
    }
});

// Batch processing for multiple requests
router.post('/batch', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { requests } = req.body;
        
        if (!Array.isArray(requests) || requests.length === 0) {
            return res.status(400).json({ 
                error: 'Requests array is required' 
            });
        }
        
        const results = await batchProcessRequests(requests);
        
        monitorPerformance(`Batch Process (${requests.length} requests)`, startTime);
        
        res.json({
            results,
            totalRequests: requests.length,
            successCount: results.filter(r => r.success).length,
            responseTime: Date.now() - startTime
        });
        
    } catch (error) {
        console.error('Batch processing error:', error);
        res.status(500).json({ 
            error: 'Failed to process batch requests',
            responseTime: Date.now() - startTime
        });
    }
});

// Fast chat history retrieval
router.get('/chat/history', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { userId, role, limit = 50 } = req.query;
        
        if (!userId || !role) {
            return res.status(400).json({ 
                error: 'userId and role are required' 
            });
        }
        
        const result = await getChatHistoryFast(userId, parseInt(limit), role);
        
        monitorPerformance('Chat History', startTime);
        
        if (result.success) {
            res.json({
                history: result.data,
                count: result.data.length,
                responseTime: Date.now() - startTime
            });
        } else {
            res.status(500).json({ 
                error: result.error,
                responseTime: Date.now() - startTime
            });
        }
        
    } catch (error) {
        console.error('Fast chat history error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch chat history',
            responseTime: Date.now() - startTime
        });
    }
});

// Fast knowledge base search
router.get('/knowledge/search', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { query, role, category, subject } = req.query;
        
        if (!query || !role) {
            return res.status(400).json({ 
                error: 'Query and role are required' 
            });
        }
        
        const filters = {};
        if (category) filters.category = category;
        if (subject) filters.subject = subject;
        
        const result = await searchKnowledgeBaseFast(query, role, filters);
        
        monitorPerformance('Knowledge Search', startTime);
        
        if (result.success) {
            res.json({
                results: result.data,
                count: result.data.length,
                query,
                role,
                responseTime: Date.now() - startTime
            });
        } else {
            res.status(500).json({ 
                error: result.error,
                responseTime: Date.now() - startTime
            });
        }
        
    } catch (error) {
        console.error('Fast knowledge search error:', error);
        res.status(500).json({ 
            error: 'Failed to search knowledge base',
            responseTime: Date.now() - startTime
        });
    }
});

// Fast knowledge base update
router.post('/knowledge/update', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { updates, role } = req.body;
        
        if (!Array.isArray(updates) || !role) {
            return res.status(400).json({ 
                error: 'Updates array and role are required' 
            });
        }
        
        const result = await updateKnowledgeBaseFast(updates, role);
        
        monitorPerformance('Knowledge Update', startTime);
        
        if (result.success) {
            res.json({
                success: true,
                message: 'Knowledge base updated successfully',
                data: result.data,
                responseTime: Date.now() - startTime
            });
        } else {
            res.status(500).json({ 
                error: result.error,
                responseTime: Date.now() - startTime
            });
        }
        
    } catch (error) {
        console.error('Fast knowledge update error:', error);
        res.status(500).json({ 
            error: 'Failed to update knowledge base',
            responseTime: Date.now() - startTime
        });
    }
});

// Performance monitoring endpoint
router.get('/performance', (req, res) => {
    res.json({
        status: 'optimized',
        features: [
            'Fast database operations',
            'In-memory caching',
            'Batch processing',
            'Performance monitoring',
            'Optimized queries'
        ],
        response_time: '< 500ms average',
        cache_hit_rate: 'High',
        database_optimization: 'Enabled'
    });
});

// Health check with performance metrics
router.get('/health', async (req, res) => {
    const startTime = Date.now();
    
    try {
        // Test database connectivity
        const { fastOperations } = require('../config/database');
        const testResult = await fastOperations.fastFind(
            require('../controllers/aiAgentController').KnowledgeBase,
            {},
            { limit: 1 }
        );
        
        const responseTime = Date.now() - startTime;
        
        res.json({
            status: 'healthy',
            database: testResult.success ? 'connected' : 'error',
            response_time: `${responseTime}ms`,
            performance: responseTime < 100 ? 'excellent' : responseTime < 500 ? 'good' : 'slow',
            cache: 'active',
            timestamp: new Date()
        });
        
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message,
            response_time: `${Date.now() - startTime}ms`
        });
    }
});

// Clear cache endpoint
router.post('/cache/clear', (req, res) => {
    const { cacheUtils } = require('../config/database');
    cacheUtils.clear();
    
    res.json({
        success: true,
        message: 'Cache cleared successfully',
        timestamp: new Date()
    });
});

module.exports = router;
