const { fastOperations, cacheUtils } = require('../config/database');

// Optimized AI response generation with fast database operations
const generateOptimizedAIResponse = async (message, userProfile, context = {}) => {
    const { role, userId } = userProfile;
    
    try {
        console.log(`[Fast AI] Generating response for ${role}: ${message}`);
        
        // Use cached knowledge base for faster responses
        const knowledgeCacheKey = `${role}_knowledge`;
        let knowledgeResults = cacheUtils.get(knowledgeCacheKey);
        
        if (!knowledgeResults) {
            // Fast database query with lean operations
            const model = getKnowledgeModel(role);
            const result = await fastOperations.fastFind(model, {
                $or: [
                    { tags: { $in: extractKeywords(message) } },
                    { topic: { $regex: extractKeywords(message).join('|'), $options: 'i' } }
                ]
            }, { limit: 10 });
            
            knowledgeResults = result.success ? result.data : [];
            cacheUtils.set(knowledgeCacheKey, knowledgeResults);
        }
        
        // Generate response using cached knowledge
        if (knowledgeResults.length > 0) {
            const bestMatch = findBestMatch(message, knowledgeResults);
            console.log(`[Fast AI] Using cached knowledge: ${bestMatch.topic}`);
            return bestMatch.content;
        }
        
        // Fallback to LLM with timeout
        return await generateLLMResponse(message, userProfile, context);
        
    } catch (error) {
        console.error('[Fast AI] Error:', error);
        return getFallbackResponse(role, message);
    }
};

// Fast chat history saving with bulk operations
const saveChatHistoryFast = async (entries) => {
    try {
        const model = getChatHistoryModel(entries[0].role);
        const result = await fastOperations.bulkInsert(model, entries);
        
        if (result.success) {
            console.log(`[Fast DB] Saved ${entries.length} chat entries`);
        }
        
        return result;
    } catch (error) {
        console.error('[Fast DB] Error saving chat history:', error);
        return { success: false, error: error.message };
    }
};

// Optimized knowledge base update
const updateKnowledgeBaseFast = async (updates, role) => {
    try {
        const model = getKnowledgeModel(role);
        const operations = updates.map(update => ({
            updateOne: {
                filter: { topic: update.topic, subject: update.subject },
                update: { $set: update },
                upsert: true
            }
        }));
        
        const result = await model.bulkWrite(operations);
        
        // Clear cache after update
        cacheUtils.clear();
        
        console.log(`[Fast DB] Updated ${result.modifiedCount + result.upsertedCount} knowledge entries`);
        return { success: true, data: result };
        
    } catch (error) {
        console.error('[Fast DB] Error updating knowledge base:', error);
        return { success: false, error: error.message };
    }
};

// Fast knowledge base search with aggregation
const searchKnowledgeBaseFast = async (query, role, filters = {}) => {
    try {
        const cacheKey = `search:${role}:${JSON.stringify(filters)}:${query}`;
        const cached = cacheUtils.get(cacheKey);
        
        if (cached) {
            return cached;
        }
        
        const model = getKnowledgeModel(role);
        const pipeline = [
            {
                $match: {
                    $and: [
                        { $text: { $search: query } },
                        filters
                    ]
                }
            },
            {
                $addFields: {
                    score: { $meta: 'textScore' }
                }
            },
            { $sort: { score: { $meta: 'textScore' } } },
            { $limit: 20 }
        ];
        
        const result = await fastOperations.fastAggregate(model, pipeline);
        
        if (result.success) {
            cacheUtils.set(cacheKey, result.data);
        }
        
        return result;
        
    } catch (error) {
        console.error('[Fast DB] Error searching knowledge base:', error);
        return { success: false, error: error.message };
    }
};

// Optimized chat history retrieval
const getChatHistoryFast = async (userId, role, limit = 50) => {
    try {
        const cacheKey = `history:${userId}:${role}:${limit}`;
        const cached = cacheUtils.get(cacheKey);
        
        if (cached) {
            return cached;
        }
        
        const model = getChatHistoryModel(role);
        const result = await fastOperations.fastFind(
            model,
            { userId },
            { 
                sort: { timestamp: -1 },
                limit: limit
            }
        );
        
        if (result.success) {
            cacheUtils.set(cacheKey, result.data);
        }
        
        return result;
        
    } catch (error) {
        console.error('[Fast DB] Error getting chat history:', error);
        return { success: false, error: error.message };
    }
};

// Helper functions
const getKnowledgeModel = (role) => {
    const models = {
        student: require('./studentAIController').StudentKnowledge,
        faculty: require('./facultyAIController').FacultyKnowledge,
        admin: require('./adminAIController').AdminKnowledge
    };
    return models[role];
};

const getChatHistoryModel = (role) => {
    const models = {
        student: require('./studentAIController').StudentChatHistory,
        faculty: require('./facultyAIController').FacultyChatHistory,
        admin: require('./adminAIController').AdminChatHistory
    };
    return models[role];
};

const extractKeywords = (message) => {
    const keywords = message.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(' ')
        .filter(word => word.length > 2)
        .slice(0, 5);
    return keywords;
};

const findBestMatch = (message, knowledgeResults) => {
    const messageWords = extractKeywords(message);
    let bestMatch = knowledgeResults[0];
    let bestScore = 0;
    
    knowledgeResults.forEach(entry => {
        const entryWords = extractKeywords(entry.topic + ' ' + entry.content);
        const score = messageWords.filter(word => 
            entryWords.some(entryWord => entryWord.includes(word))
        ).length;
        
        if (score > bestScore) {
            bestScore = score;
            bestMatch = entry;
        }
    });
    
    return bestMatch;
};

const generateLLMResponse = async (message, userProfile, context) => {
    // Add timeout to LLM calls
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('LLM timeout')), 5000)
    );
    
    try {
        // Import the original LLM function
        const { generateAIResponse } = require('./aiAgentController');
        const llmPromise = generateAIResponse(message, userProfile, context);
        return await Promise.race([llmPromise, timeoutPromise]);
    } catch (error) {
        console.log('[Fast AI] LLM timeout or error, using fallback');
        return getFallbackResponse(userProfile.role, message);
    }
};

const getFallbackResponse = (role, message) => {
    const fallbacks = {
        student: "I'm here to help with your studies! Ask me about programming, subjects, or assignments.",
        faculty: "I'm here to assist with your teaching! Ask me about attendance, exams, or materials.",
        admin: "I'm here to help with administration! Ask me about students, faculty, or fees."
    };
    return fallbacks[role] || fallbacks.student;
};

// Batch operations for multiple requests
const batchProcessRequests = async (requests) => {
    try {
        const results = await Promise.allSettled(
            requests.map(request => generateOptimizedAIResponse(
                request.message,
                request.userProfile,
                request.context
            ))
        );
        
        return results.map(result => 
            result.status === 'fulfilled' 
                ? { success: true, response: result.value }
                : { success: false, error: result.reason.message }
        );
        
    } catch (error) {
        console.error('[Fast AI] Batch processing error:', error);
        return requests.map(() => ({ success: false, error: 'Batch processing failed' }));
    }
};

// Performance monitoring
const monitorPerformance = (operation, startTime) => {
    const duration = Date.now() - startTime;
    if (duration > 1000) {
        console.warn(`[Performance] Slow operation: ${operation} took ${duration}ms`);
    } else {
        console.log(`[Performance] ${operation} completed in ${duration}ms`);
    }
};

module.exports = {
    generateOptimizedAIResponse,
    saveChatHistoryFast,
    updateKnowledgeBaseFast,
    searchKnowledgeBaseFast,
    getChatHistoryFast,
    batchProcessRequests,
    monitorPerformance,
    fastOperations,
    cacheUtils
};
