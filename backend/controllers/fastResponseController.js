// Safe import for ChatOllama (Handles missing package or incorrect exports)
let ChatOllama;
try {
  // Try community package first (modern LangChain)
  ChatOllama = require('@langchain/community/chat_models/ollama').ChatOllama;
} catch (e) {
  // Final Fallback: Mock class to prevent crash on startup
  ChatOllama = class {
    constructor() {
      console.warn('⚠️ ChatOllama not found in node_modules. Using Mock.');
    }
    invoke() { return { content: "Ollama not available. System falling back." }; }
  };
}

const { StringOutputParser } = require('@langchain/core/output_parsers');
const { PromptTemplate } = require('@langchain/core/prompts');
const { RunnableSequence } = require('@langchain/core/runnables');
const { StudentKnowledge, FacultyKnowledge, AdminKnowledge } = require('../models/AIModels');

// Fast Llama Model Setup
const getFastLlamaModel = () => {
  try {
    return new ChatOllama({
      baseUrl: "http://localhost:11434",
      model: "llama2", // or "llama3", "codellama" based on availability
      temperature: 0.3, // Lower temperature for faster, more consistent responses
      numPredict: 512, // Limit response length for speed
      numCtx: 2048, // Smaller context for faster processing
    });
  } catch (error) {
    console.error('[Fast Response] Llama model initialization error:', error);
    throw new Error('Failed to initialize Llama model');
  }
};

// Fast knowledge retrieval with caching
const knowledgeCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCachedKnowledge = (query, role) => {
  const cacheKey = `${role}:${query.toLowerCase().slice(0, 50)}`;
  const cached = knowledgeCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  return null;
};

const setCachedKnowledge = (query, role, data) => {
  const cacheKey = `${role}:${query.toLowerCase().slice(0, 50)}`;
  knowledgeCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
};

// Fast knowledge base search
const fastKnowledgeSearch = async (query, role) => {
  try {
    // Check cache first
    const cached = getCachedKnowledge(query, role);
    if (cached) return cached;

    let Model;
    if (role === 'student') Model = StudentKnowledge;
    else if (role === 'faculty') Model = FacultyKnowledge;
    else if (role === 'admin') Model = AdminKnowledge;
    else return [];

    // Fast keyword search (simplified for speed)
    const keywords = query.toLowerCase().split(' ').filter(word => word.length > 2);
    const regexPattern = keywords.join('|');

    const results = await Model.find({
      $or: [
        { topic: { $regex: regexPattern, $options: 'i' } },
        { content: { $regex: regexPattern, $options: 'i' } },
        { tags: { $in: keywords } }
      ]
    }).limit(3); // Limit results for speed

    // Cache the results
    setCachedKnowledge(query, role, results);

    return results;
  } catch (error) {
    console.error('[Fast Knowledge Search] Error:', error);
    return [];
  }
};

// Fast response generation
const generateFastResponse = async (query, role, userProfile) => {
  try {
    const startTime = Date.now();

    // Get Llama model
    const model = getFastLlamaModel();

    // Fast knowledge retrieval
    const knowledgeResults = await fastKnowledgeSearch(query, role);

    // Build quick context
    const knowledgeContext = knowledgeResults.length > 0
      ? knowledgeResults.map(item => `${item.topic}: ${item.content}`).join('\n')
      : '';

    // Fast prompt template (optimized for speed)
    const fastPrompt = PromptTemplate.fromTemplate(`
You are VUAI Agent, a fast AI assistant for ${role} users.

Knowledge: {knowledge}
User: {query}
Role: ${role}
Context: ${userProfile.context?.branch || 'B.Tech'}

Provide a quick, helpful response in 2-3 sentences maximum:
`);

    const chain = RunnableSequence.from([
      {
        knowledge: () => knowledgeContext,
        query: (input) => input.query,
      },
      fastPrompt,
      model,
      new StringOutputParser()
    ]);

    const response = await chain.invoke({ query });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    return {
      response,
      responseTime: `${responseTime}ms`,
      knowledgeUsed: knowledgeResults.length > 0,
      sources: knowledgeResults.map(item => item.topic),
      model: 'llama2-fast'
    };

  } catch (error) {
    console.error('[Fast Response] Error:', error);
    return {
      response: "I'm here to help! Could you rephrase your question?",
      responseTime: 'error',
      knowledgeUsed: false,
      sources: [],
      model: 'fallback'
    };
  }
};

// Batch knowledge update for fast response
const updateFastKnowledge = async (knowledgeData) => {
  try {
    const startTime = Date.now();

    // Clear cache to force refresh
    knowledgeCache.clear();

    // Batch insert/update operations
    const operations = [];

    // Student knowledge
    if (knowledgeData.student) {
      operations.push(
        StudentKnowledge.deleteMany({}),
        StudentKnowledge.insertMany(knowledgeData.student)
      );
    }

    // Faculty knowledge  
    if (knowledgeData.faculty) {
      operations.push(
        FacultyKnowledge.deleteMany({}),
        FacultyKnowledge.insertMany(knowledgeData.faculty)
      );
    }

    // Admin knowledge
    if (knowledgeData.admin) {
      operations.push(
        AdminKnowledge.deleteMany({}),
        AdminKnowledge.insertMany(knowledgeData.admin)
      );
    }

    await Promise.all(operations);

    const endTime = Date.now();
    const updateTime = endTime - startTime;

    return {
      success: true,
      updateTime: `${updateTime}ms`,
      message: 'Fast knowledge database updated successfully',
      cacheCleared: true
    };

  } catch (error) {
    console.error('[Fast Knowledge Update] Error:', error);
    return {
      success: false,
      error: error.message,
      updateTime: 'error'
    };
  }
};

// Quick knowledge health check
const checkFastKnowledgeHealth = async () => {
  try {
    const counts = {};

    counts.student = await StudentKnowledge.countDocuments();
    counts.faculty = await FacultyKnowledge.countDocuments();
    counts.admin = await AdminKnowledge.countDocuments();
    counts.cacheSize = knowledgeCache.size;

    return {
      healthy: true,
      counts,
      cacheSize: knowledgeCache.size,
      model: 'llama2',
      status: 'operational'
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      status: 'error'
    };
  }
};

// Clear cache utility
const clearFastCache = () => {
  knowledgeCache.clear();
  return {
    success: true,
    message: 'Fast response cache cleared',
    cacheSize: 0
  };
};

module.exports = {
  generateFastResponse,
  updateFastKnowledge,
  checkFastKnowledgeHealth,
  clearFastCache,
  fastKnowledgeSearch,
  getFastLlamaModel
};
