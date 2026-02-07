const mongoose = require('mongoose');
const { ChatOpenAI } = require('@langchain/openai');
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { PromptTemplate } = require('@langchain/core/prompts');
const { RunnableSequence } = require('@langchain/core/runnables');
const { StudentKnowledge, FacultyKnowledge, AdminKnowledge } = require('../models/AIModels');

// Fixed Fast Response System with Separate Knowledge Bases
class FixedFastResponseSystem {
  constructor() {
    this.isInitialized = false;
    this.models = new Map();
    this.knowledgeBases = new Map();
    this.responseCache = new Map();
    this.performanceMetrics = {
      totalResponses: 0,
      avgResponseTime: 0,
      cacheHitRate: 0,
      knowledgeBaseHits: { student: 0, faculty: 0, admin: 0 }
    };
  }

  // Initialize the fixed fast response system
  async initializeSystem() {
    try {
      console.log('🚀 Initializing Fixed Fast Response System...');
      
      // Initialize models
      await this.initializeModels();
      
      // Initialize knowledge bases
      await this.initializeKnowledgeBases();
      
      this.isInitialized = true;
      console.log('✅ Fixed Fast Response System Initialized!');
      
      return {
        success: true,
        models: Array.from(this.models.keys()),
        knowledgeBases: Array.from(this.knowledgeBases.keys()),
        status: 'ACTIVE'
      };
      
    } catch (error) {
      console.error('[Fixed Fast Response] Initialization error:', error);
      return { success: false, error: error.message };
    }
  }

  // Initialize LLM models
  async initializeModels() {
    try {
      // OpenAI GPT-4
      if (process.env.OPENAI_API_KEY) {
        this.models.set('openai', new ChatOpenAI({
          openAIApiKey: process.env.OPENAI_API_KEY,
          modelName: "gpt-4",
          temperature: 0.7,
          maxTokens: 2048,
          streaming: false
        }));
        console.log('✅ OpenAI GPT-4 model initialized');
      }

      // Google Gemini
      if (process.env.GOOGLE_API_KEY) {
        this.models.set('gemini', new ChatGoogleGenerativeAI({
          apiKey: process.env.GOOGLE_API_KEY,
          modelName: "gemini-1.5-flash",
          temperature: 0.7,
          maxOutputTokens: 2048
        }));
        console.log('✅ Google Gemini model initialized');
      }

      // Set default model
      if (this.models.size === 0) {
        throw new Error('No LLM models available. Please set OPENAI_API_KEY or GOOGLE_API_KEY');
      }

      this.defaultModel = this.models.keys().next().value;
      console.log(`🎯 Default model set to: ${this.defaultModel}`);
      
    } catch (error) {
      console.error('[Models] Initialization error:', error);
      throw error;
    }
  }

  // Initialize separate knowledge bases
  async initializeKnowledgeBases() {
    try {
      // Student Knowledge Base
      this.knowledgeBases.set('student', {
        model: StudentKnowledge,
        cache: new Map(),
        systemPrompt: `You are VUAI Agent, an intelligent assistant for B.Tech students. You provide clear, concise, and helpful responses to academic questions. Your role is to help students understand concepts, solve problems, and excel in their studies.

Guidelines:
- Provide step-by-step explanations
- Include relevant examples and code snippets when helpful
- Keep responses focused and educational
- Use simple language for complex topics
- Encourage learning and critical thinking`
      });

      // Faculty Knowledge Base
      this.knowledgeBases.set('faculty', {
        model: FacultyKnowledge,
        cache: new Map(),
        systemPrompt: `You are VUAI Agent, an advanced assistant for faculty members and educators. You provide expert-level insights, teaching strategies, and academic guidance. Your role is to support educators in teaching, research, and institutional excellence.

Guidelines:
- Provide pedagogical insights and teaching strategies
- Offer research guidance and academic best practices
- Share curriculum development expertise
- Include advanced technical details when appropriate
- Support educational innovation and improvement`
      });

      // Admin Knowledge Base
      this.knowledgeBases.set('admin', {
        model: AdminKnowledge,
        cache: new Map(),
        systemPrompt: `You are VUAI Agent, a strategic assistant for educational administrators and institutional leaders. You provide data-driven insights, management strategies, and operational guidance. Your role is to support institutional excellence and strategic decision-making.

Guidelines:
- Provide institutional management strategies
- Share data-driven insights and analytics
- Offer operational improvement recommendations
- Include policy and compliance guidance
- Support strategic planning and implementation`
      });

      console.log('✅ Knowledge bases initialized for: student, faculty, admin');
      
    } catch (error) {
      console.error('[Knowledge Bases] Initialization error:', error);
      throw error;
    }
  }

  // Generate fast response with role-specific knowledge
  async generateFastResponse(query, userProfile, context = {}) {
    const startTime = Date.now();
    
    try {
      if (!this.isInitialized) {
        await this.initializeSystem();
      }

      const { role = 'student' } = userProfile;
      
      // Get role-specific knowledge base
      const knowledgeBase = this.knowledgeBases.get(role);
      if (!knowledgeBase) {
        throw new Error(`Unknown role: ${role}`);
      }

      // Check cache first
      const cacheKey = `${role}:${query.substring(0, 100)}`;
      const cachedResponse = knowledgeBase.cache.get(cacheKey);
      if (cachedResponse) {
        this.performanceMetrics.cacheHitRate++;
        return {
          success: true,
          response: cachedResponse,
          responseTime: `${Date.now() - startTime}ms`,
          source: 'cache',
          role: role
        };
      }

      // Search knowledge base
      const knowledgeResults = await this.searchKnowledgeBase(query, knowledgeBase.model, role);
      
      // Generate response using LLM
      const response = await this.generateLLMResponse(query, userProfile, knowledgeResults, knowledgeBase.systemPrompt);
      
      // Cache the response
      knowledgeBase.cache.set(cacheKey, response);
      
      // Update metrics
      this.performanceMetrics.totalResponses++;
      this.performanceMetrics.knowledgeBaseHits[role]++;
      const responseTime = Date.now() - startTime;
      this.performanceMetrics.avgResponseTime = 
        (this.performanceMetrics.avgResponseTime + responseTime) / 2;

      return {
        success: true,
        response,
        responseTime: `${responseTime}ms`,
        source: 'llm',
        role: role,
        knowledgeResults: knowledgeResults.length,
        model: this.defaultModel
      };

    } catch (error) {
      console.error('[Fast Response] Error:', error);
      return {
        success: false,
        error: error.message,
        responseTime: `${Date.now() - startTime}ms`
      };
    }
  }

  // Search role-specific knowledge base
  async searchKnowledgeBase(query, model, role) {
    try {
      // Extract search terms
      const searchTerms = this.extractSearchTerms(query);
      
      // Build search query
      const searchQuery = {
        $or: [
          { topic: { $regex: searchTerms.join('|'), $options: 'i' } },
          { content: { $regex: searchTerms.join('|'), $options: 'i' } },
          { tags: { $in: searchTerms } },
          { category: { $regex: searchTerms.join('|'), $options: 'i' } },
          { subject: { $regex: searchTerms.join('|'), $options: 'i' } }
        ]
      };

      // Search in role-specific knowledge base
      const results = await model.find(searchQuery).limit(5).lean();
      
      // Sort by relevance
      const scoredResults = results.map(item => ({
        ...item,
        relevanceScore: this.calculateRelevance(item, query, searchTerms)
      })).sort((a, b) => b.relevanceScore - a.relevanceScore);

      return scoredResults;
      
    } catch (error) {
      console.error('[Knowledge Search] Error:', error);
      return [];
    }
  }

  // Extract search terms from query
  extractSearchTerms(query) {
    const noiseWords = ['the', 'is', 'at', 'which', 'on', 'and', 'or', 'but', 'in', 'with', 'a', 'an', 'to', 'for', 'of', 'as', 'by', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall', 'help', 'me', 'please', 'thank', 'you'];
    
    return query.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !noiseWords.includes(word))
      .map(word => word.replace(/[^\w]/g, ''))
      .slice(0, 5); // Limit to 5 terms
  }

  // Calculate relevance score
  calculateRelevance(item, query, searchTerms) {
    let score = 0;
    const queryLower = query.toLowerCase();
    const itemText = `${item.topic} ${item.content} ${item.category} ${item.subject}`.toLowerCase();
    
    // Exact phrase match
    if (itemText.includes(queryLower)) score += 10;
    
    // Term frequency
    searchTerms.forEach(term => {
      const termCount = (itemText.match(new RegExp(term, 'g')) || []).length;
      score += termCount * 2;
    });
    
    // Category and subject matching
    if (item.category && queryLower.includes(item.category.toLowerCase())) score += 5;
    if (item.subject && queryLower.includes(item.subject.toLowerCase())) score += 5;
    
    // Tag matching
    if (item.tags) {
      item.tags.forEach(tag => {
        if (searchTerms.includes(tag.toLowerCase())) score += 3;
      });
    }
    
    return score;
  }

  // Generate LLM response
  async generateLLMResponse(query, userProfile, knowledgeResults, systemPrompt) {
    try {
      const model = this.models.get(this.defaultModel);
      
      // Build context from knowledge results
      let knowledgeContext = '';
      if (knowledgeResults.length > 0) {
        knowledgeContext = '\n\nRelevant Knowledge:\n' + 
          knowledgeResults.map((item, index) => 
            `${index + 1}. ${item.category} - ${item.topic}:\n${item.content}\n${item.codeExamples ? 'Code Examples:\n' + item.codeExamples.join('\n') : ''}`
          ).join('\n\n');
      }

      // Create prompt template
      const promptTemplate = PromptTemplate.fromTemplate(`
${systemPrompt}

${knowledgeContext}

User Query: {query}
User Role: {role}

Instructions:
1. Provide a clear, helpful response based on the query
2. Use the relevant knowledge provided above when applicable
3. If no relevant knowledge is found, provide a helpful general response
4. Keep the response concise and focused
5. Use appropriate technical level for the user's role

Response:`);

      // Create and run the chain
      const chain = RunnableSequence.from([
        {
          query: (input) => input.query,
          role: (input) => input.role
        },
        promptTemplate,
        model,
        new StringOutputParser()
      ]);

      const response = await chain.invoke({ 
        query, 
        role: userProfile.role 
      });
      
      return response;
      
    } catch (error) {
      console.error('[LLM Response] Error:', error);
      return `I apologize, but I'm having trouble processing your request right now. Please try again later.`;
    }
  }

  // Get system status
  getSystemStatus() {
    return {
      isInitialized: this.isInitialized,
      models: Array.from(this.models.keys()),
      knowledgeBases: Array.from(this.knowledgeBases.keys()),
      defaultModel: this.defaultModel,
      performanceMetrics: this.performanceMetrics,
      cacheSize: {
        student: this.knowledgeBases.get('student')?.cache.size || 0,
        faculty: this.knowledgeBases.get('faculty')?.cache.size || 0,
        admin: this.knowledgeBases.get('admin')?.cache.size || 0
      }
    };
  }

  // Clear cache for specific role
  clearCache(role) {
    if (this.knowledgeBases.has(role)) {
      this.knowledgeBases.get(role).cache.clear();
      return { success: true, message: `Cache cleared for ${role}` };
    }
    return { success: false, error: `Invalid role: ${role}` };
  }

  // Clear all caches
  clearAllCaches() {
    this.knowledgeBases.forEach(kb => kb.cache.clear());
    this.responseCache.clear();
    return { success: true, message: 'All caches cleared' };
  }
}

// Export singleton instance
const fixedFastResponseSystem = new FixedFastResponseSystem();

// Controller functions
const initializeFixedSystem = async (req, res) => {
  try {
    const result = await fixedFastResponseSystem.initializeSystem();
    res.json(result);
  } catch (error) {
    console.error('[Fixed Fast Response] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const generateFixedFastResponse = async (req, res) => {
  try {
    const { query, userProfile, context } = req.body;
    
    if (!query || !userProfile) {
      return res.status(400).json({ 
        error: 'Missing required fields: query, userProfile' 
      });
    }
    
    const result = await fixedFastResponseSystem.generateFastResponse(query, userProfile, context);
    res.json(result);
    
  } catch (error) {
    console.error('[Fixed Fast Response] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getFixedSystemStatus = async (req, res) => {
  try {
    const status = fixedFastResponseSystem.getSystemStatus();
    res.json({ success: true, ...status });
  } catch (error) {
    console.error('[Fixed Status] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const clearFixedCache = async (req, res) => {
  try {
    const { role } = req.body;
    const result = role ? fixedFastResponseSystem.clearCache(role) : fixedFastResponseSystem.clearAllCaches();
    res.json(result);
  } catch (error) {
    console.error('[Clear Cache] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  fixedFastResponseSystem,
  initializeFixedSystem,
  generateFixedFastResponse,
  getFixedSystemStatus,
  clearFixedCache
};
