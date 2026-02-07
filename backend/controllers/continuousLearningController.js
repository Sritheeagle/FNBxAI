const mongoose = require('mongoose');
const { StudentKnowledge, FacultyKnowledge, AdminKnowledge, ChatHistory } = require('../models/AIModels');
const { getEnhancedChatModel } = require('./enhancedAIController');

// Continuous Learning System
class ContinuousLearning {
  constructor() {
    this.learningThreshold = 0.7; // Confidence threshold for auto-learning
    this.feedbackWeight = 0.3; // Weight for user feedback in knowledge updates
  }

  // Analyze user interactions for learning opportunities
  async analyzeInteractions(sessionData) {
    try {
      const { userId, role, queries, responses, feedback } = sessionData;
      
      // Identify knowledge gaps
      const knowledgeGaps = await this.identifyKnowledgeGaps(queries, responses, role);
      
      // Extract new concepts from successful interactions
      const newConcepts = await this.extractNewConcepts(queries, responses, feedback);
      
      // Update existing knowledge based on feedback
      const knowledgeUpdates = await this.generateKnowledgeUpdates(responses, feedback);
      
      return {
        knowledgeGaps,
        newConcepts,
        knowledgeUpdates,
        learningOpportunities: this.prioritizeLearningOpportunities(knowledgeGaps, newConcepts)
      };
    } catch (error) {
      console.error('[Continuous Learning] Analysis error:', error);
      return { knowledgeGaps: [], newConcepts: [], knowledgeUpdates: [], learningOpportunities: [] };
    }
  }

  // Identify areas where knowledge base is insufficient
  async identifyKnowledgeGaps(queries, responses, role) {
    const gaps = [];
    
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      const response = responses[i];
      
      // Check if response indicates insufficient knowledge
      if (this.isInsufficientResponse(response)) {
        const gap = {
          query: query,
          topic: this.extractTopic(query),
          subject: this.inferSubject(query),
          role: role,
          frequency: 1,
          priority: this.calculateGapPriority(query, role)
        };
        gaps.push(gap);
      }
    }
    
    return this.aggregateGaps(gaps);
  }

  // Extract new concepts from positive interactions
  async extractNewConcepts(queries, responses, feedback) {
    const concepts = [];
    const chatModel = getEnhancedChatModel();
    
    for (let i = 0; i < queries.length; i++) {
      if (feedback[i] && feedback[i].rating >= 4) { // Positive feedback
        const concept = await this.analyzeForNewConcepts(queries[i], responses[i], chatModel);
        if (concept) {
          concepts.push(concept);
        }
      }
    }
    
    return concepts;
  }

  // Generate knowledge updates based on user feedback
  async generateKnowledgeUpdates(responses, feedback) {
    const updates = [];
    
    for (let i = 0; i < responses.length; i++) {
      if (feedback[i] && feedback[i].rating <= 2) { // Negative feedback
        const update = await this.suggestKnowledgeImprovement(responses[i], feedback[i]);
        if (update) {
          updates.push(update);
        }
      }
    }
    
    return updates;
  }

  // Auto-generate new knowledge entries
  async generateKnowledgeEntry(topic, subject, role, context = {}) {
    try {
      const chatModel = getEnhancedChatModel();
      
      const prompt = `
Generate a comprehensive knowledge entry for ${role} users about "${topic}" in ${subject}.

Context: ${JSON.stringify(context)}

Generate:
1. Clear, educational content
2. Relevant code examples (if applicable)
3. Key explanations
4. Appropriate tags
5. Category classification

Format as JSON with fields: content, codeExamples, explanations, tags, category`;

      const result = await chatModel.invoke(prompt);
      
      try {
        const knowledgeEntry = JSON.parse(result.content);
        return {
          topic: topic,
          subject: subject,
          category: knowledgeEntry.category || this.inferCategory(topic, subject),
          content: knowledgeEntry.content,
          codeExamples: knowledgeEntry.codeExamples || [],
          explanations: knowledgeEntry.explanations || [],
          tags: knowledgeEntry.tags || [],
          confidence: this.calculateConfidence(knowledgeEntry),
          source: 'auto-generated',
          createdAt: new Date(),
          verified: false
        };
      } catch (parseError) {
        console.error('[Knowledge Generation] JSON parse error:', parseError);
        return null;
      }
    } catch (error) {
      console.error('[Knowledge Generation] Error:', error);
      return null;
    }
  }

  // Validate and verify auto-generated knowledge
  async validateKnowledge(entry) {
    try {
      // Check for content quality
      const qualityScore = this.assessContentQuality(entry);
      
      // Check for accuracy (could use external validation)
      const accuracyScore = await this.assessAccuracy(entry);
      
      // Check for completeness
      const completenessScore = this.assessCompleteness(entry);
      
      const overallScore = (qualityScore + accuracyScore + completenessScore) / 3;
      
      return {
        isValid: overallScore >= 0.7,
        score: overallScore,
        suggestions: this.generateImprovementSuggestions(entry, overallScore)
      };
    } catch (error) {
      console.error('[Knowledge Validation] Error:', error);
      return { isValid: false, score: 0, suggestions: [] };
    }
  }

  // Update existing knowledge based on feedback
  async updateKnowledgeEntry(entryId, feedback, improvements) {
    try {
      let Model;
      if (feedback.role === 'student') Model = StudentKnowledge;
      else if (feedback.role === 'faculty') Model = FacultyKnowledge;
      else if (feedback.role === 'admin') Model = AdminKnowledge;
      
      const entry = await Model.findById(entryId);
      if (!entry) return null;
      
      // Apply improvements based on feedback
      if (improvements.content) entry.content = improvements.content;
      if (improvements.explanations) entry.explanations.push(...improvements.explanations);
      if (improvements.codeExamples) entry.codeExamples.push(...improvements.codeExamples);
      if (improvements.tags) entry.tags.push(...improvements.tags);
      
      // Update metadata
      entry.lastUpdated = new Date();
      entry.updateCount = (entry.updateCount || 0) + 1;
      entry.feedbackScore = this.calculateFeedbackScore(entry, feedback);
      
      await entry.save();
      return entry;
    } catch (error) {
      console.error('[Knowledge Update] Error:', error);
      return null;
    }
  }

  // Helper methods
  isInsufficientResponse(response) {
    const insufficientIndicators = [
      "I don't have information",
      "I'm not sure",
      "I cannot provide",
      "insufficient knowledge",
      "no data available"
    ];
    
    return insufficientIndicators.some(indicator => 
      response.toLowerCase().includes(indicator.toLowerCase())
    );
  }

  extractTopic(query) {
    // Simple topic extraction - could be enhanced with NLP
    const words = query.toLowerCase().split(' ');
    const topicWords = words.filter(word => word.length > 3);
    return topicWords.slice(0, 3).join(' ');
  }

  inferSubject(query) {
    const subjectKeywords = {
      'Mathematics': ['math', 'calculus', 'algebra', 'statistics', 'probability'],
      'Physics': ['physics', 'mechanics', 'electromagnetism', 'quantum', 'optics'],
      'Chemistry': ['chemistry', 'organic', 'inorganic', 'bonding', 'molecules'],
      'Programming': ['code', 'programming', 'python', 'java', 'javascript', 'algorithm'],
      'Web Development': ['web', 'html', 'css', 'react', 'node', 'frontend', 'backend'],
      'Database': ['database', 'sql', 'mongodb', 'query', 'table'],
      'Networks': ['network', 'socket', 'tcp', 'udp', 'protocol']
    };
    
    const queryLower = query.toLowerCase();
    for (const [subject, keywords] of Object.entries(subjectKeywords)) {
      if (keywords.some(keyword => queryLower.includes(keyword))) {
        return subject;
      }
    }
    
    return 'General';
  }

  inferCategory(topic, subject) {
    const categories = {
      'Mathematics': ['calculus', 'algebra', 'statistics', 'probability'],
      'Physics': ['mechanics', 'electromagnetism', 'quantum', 'thermodynamics'],
      'Chemistry': ['organic', 'inorganic', 'physical', 'analytical'],
      'Programming': ['languages', 'algorithms', 'data-structures', 'paradigms'],
      'Web Development': ['frontend', 'backend', 'fullstack', 'frameworks'],
      'Database': ['relational', 'nosql', 'queries', 'design'],
      'Networks': ['protocols', 'security', 'architecture', 'communication']
    };
    
    const topicLower = topic.toLowerCase();
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => topicLower.includes(keyword))) {
        return category;
      }
    }
    
    return 'General';
  }

  calculateGapPriority(query, role) {
    // Priority based on role and query complexity
    const basePriority = role === 'student' ? 0.8 : 0.6;
    const complexityBonus = query.split(' ').length * 0.05;
    return Math.min(basePriority + complexityBonus, 1.0);
  }

  aggregateGaps(gaps) {
    const aggregated = {};
    
    gaps.forEach(gap => {
      const key = `${gap.topic}-${gap.subject}-${gap.role}`;
      if (aggregated[key]) {
        aggregated[key].frequency += gap.frequency;
        aggregated[key].priority = Math.max(aggregated[key].priority, gap.priority);
      } else {
        aggregated[key] = { ...gap };
      }
    });
    
    return Object.values(aggregated).sort((a, b) => b.priority - a.priority);
  }

  async analyzeForNewConcepts(query, response, chatModel) {
    try {
      const prompt = `Analyze this Q&A pair and extract any new concepts that should be added to the knowledge base:

Q: ${query}
A: ${response}

Return only if you find genuinely new concepts that aren't common knowledge. Format as JSON:
{
  "concept": "concept name",
  "description": "brief description",
  "category": "category",
  "subject": "subject"
}`;

      const result = await chatModel.invoke(prompt);
      return JSON.parse(result.content);
    } catch (error) {
      return null;
    }
  }

  async suggestKnowledgeImprovement(response, feedback) {
    return {
      entryId: feedback.entryId,
      improvements: {
        content: feedback.suggestions?.content,
        explanations: feedback.suggestions?.explanations || [],
        codeExamples: feedback.suggestions?.codeExamples || []
      },
      feedback: feedback
    };
  }

  calculateConfidence(entry) {
    // Simple confidence calculation based on content completeness
    let confidence = 0.5;
    
    if (entry.content && entry.content.length > 100) confidence += 0.2;
    if (entry.codeExamples && entry.codeExamples.length > 0) confidence += 0.1;
    if (entry.explanations && entry.explanations.length > 0) confidence += 0.1;
    if (entry.tags && entry.tags.length > 2) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  assessContentQuality(entry) {
    let score = 0.5;
    
    // Content length and structure
    if (entry.content && entry.content.length > 200) score += 0.2;
    if (entry.content && entry.content.includes('\n')) score += 0.1; // Has structure
    
    // Educational elements
    if (entry.explanations && entry.explanations.length > 0) score += 0.1;
    if (entry.codeExamples && entry.codeExamples.length > 0) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  async assessAccuracy(entry) {
    // Simplified accuracy assessment - could be enhanced with fact-checking
    return 0.8; // Placeholder
  }

  assessCompleteness(entry) {
    let score = 0.5;
    
    if (entry.content) score += 0.2;
    if (entry.explanations && entry.explanations.length > 0) score += 0.1;
    if (entry.codeExamples && entry.codeExamples.length > 0) score += 0.1;
    if (entry.tags && entry.tags.length > 0) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  generateImprovementSuggestions(entry, score) {
    const suggestions = [];
    
    if (score < 0.7) {
      if (!entry.content || entry.content.length < 100) {
        suggestions.push("Add more detailed content");
      }
      if (!entry.explanations || entry.explanations.length === 0) {
        suggestions.push("Add explanatory notes");
      }
      if (!entry.codeExamples || entry.codeExamples.length === 0) {
        suggestions.push("Include code examples if applicable");
      }
    }
    
    return suggestions;
  }

  calculateFeedbackScore(entry, feedback) {
    if (!entry.feedbackScore) return feedback.rating;
    
    // Weighted average of existing score and new feedback
    return (entry.feedbackScore * 0.7 + feedback.rating * 0.3);
  }

  prioritizeLearningOpportunities(gaps, concepts) {
    const opportunities = [
      ...gaps.map(gap => ({ type: 'gap', ...gap, priority: gap.priority })),
      ...concepts.map(concept => ({ type: 'concept', ...concept, priority: 0.6 }))
    ];
    
    return opportunities.sort((a, b) => b.priority - a.priority);
  }
}

// Export singleton instance
const continuousLearning = new ContinuousLearning();

// Controller functions
const analyzeSession = async (req, res) => {
  try {
    const { sessionData } = req.body;
    const analysis = await continuousLearning.analyzeInteractions(sessionData);
    
    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('[Session Analysis] Error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const generateKnowledge = async (req, res) => {
  try {
    const { topic, subject, role, context } = req.body;
    const entry = await continuousLearning.generateKnowledgeEntry(topic, subject, role, context);
    
    if (!entry) {
      return res.status(400).json({ success: false, error: 'Failed to generate knowledge entry' });
    }
    
    // Validate the generated entry
    const validation = await continuousLearning.validateKnowledge(entry);
    
    res.json({
      success: true,
      entry,
      validation
    });
  } catch (error) {
    console.error('[Knowledge Generation] Error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const updateKnowledge = async (req, res) => {
  try {
    const { entryId, feedback, improvements } = req.body;
    const updatedEntry = await continuousLearning.updateKnowledgeEntry(entryId, feedback, improvements);
    
    if (!updatedEntry) {
      return res.status(404).json({ success: false, error: 'Knowledge entry not found' });
    }
    
    res.json({
      success: true,
      entry: updatedEntry
    });
  } catch (error) {
    console.error('[Knowledge Update] Error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

module.exports = {
  continuousLearning,
  analyzeSession,
  generateKnowledge,
  updateKnowledge
};
