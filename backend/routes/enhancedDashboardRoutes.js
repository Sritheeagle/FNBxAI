const express = require('express');
const router = express.Router();
const { 
  initializeEnhancedSystem, 
  generateEnhancedResponse, 
  getEnhancedStatus,
  getUserAnalytics,
  clearEnhancedCache,
  enhancedDashboardController
} = require('../controllers/enhancedDashboardController');

// Initialize Enhanced Dashboard System
router.post('/initialize', async (req, res) => {
  try {
    const result = await initializeEnhancedSystem(req, res);
    return result;
  } catch (error) {
    console.error('[Enhanced Dashboard Routes] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Generate Enhanced Dashboard Response
router.post('/respond', async (req, res) => {
  try {
    const result = await generateEnhancedResponse(req, res);
    return result;
  } catch (error) {
    console.error('[Enhanced Dashboard Routes] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get Enhanced System Status
router.get('/status', async (req, res) => {
  try {
    const result = await getEnhancedStatus(req, res);
    return result;
  } catch (error) {
    console.error('[Enhanced Dashboard Routes] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get User Analytics
router.get('/analytics/:userId', async (req, res) => {
  try {
    const result = await getUserAnalytics(req, res);
    return result;
  } catch (error) {
    console.error('[Enhanced Dashboard Routes] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Clear Enhanced Cache
router.post('/clear-cache', async (req, res) => {
  try {
    const result = await clearEnhancedCache(req, res);
    return result;
  } catch (error) {
    console.error('[Enhanced Dashboard Routes] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Batch Enhanced Response
router.post('/batch', async (req, res) => {
  try {
    const { queries, userProfile, context } = req.body;
    
    if (!queries || !Array.isArray(queries)) {
      return res.status(400).json({ 
        error: 'Missing required field: queries (array)' 
      });
    }
    
    if (!userProfile) {
      return res.status(400).json({ 
        error: 'Missing required field: userProfile' 
      });
    }
    
    // Process all queries in parallel with enhanced features
    const batchPromises = queries.map(query => 
      generateEnhancedResponse({ 
        body: { query, userProfile, context } 
      }, res)
    );
    
    const batchResults = await Promise.all(batchPromises);
    
    res.json({
      success: true,
      batchMode: 'ENHANCED_DASHBOARD',
      queriesProcessed: queries.length,
      responses: batchResults,
      totalResponseTime: batchResults.reduce((sum, r) => 
        sum + parseInt(r.responseTime), 0
      ),
      role: userProfile.role,
      personalizationScores: batchResults.map(r => r.personalizationScore),
      predictiveAccuracies: batchResults.map(r => r.predictiveAccuracy),
      contextualUnderstanding: batchResults.map(r => r.contextualUnderstanding),
      adaptationLevels: batchResults.map(r => r.adaptationLevel),
      recommendations: batchResults.map(r => r.recommendations)
    });
    
  } catch (error) {
    console.error('[Batch Enhanced Response] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Real-time Enhanced Stream
router.get('/stream', async (req, res) => {
  try {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    
    // Send real-time enhanced updates every 2 seconds
    const sendUpdate = () => {
      const status = enhancedDashboardController.getEnhancedStatus();
      const update = {
        timestamp: Date.now(),
        status: status.isInitialized ? 'ENHANCED_ACTIVE' : 'INACTIVE',
        totalResponses: status.performanceMetrics.totalResponses,
        avgResponseTime: status.performanceMetrics.avgResponseTime.toFixed(2),
        cacheHitRate: status.performanceMetrics.cacheHitRate,
        knowledgeUpdates: status.performanceMetrics.knowledgeUpdates,
        ragSuccess: status.performanceMetrics.ragSuccess,
        personalizationScore: status.performanceMetrics.personalizationScore,
        userSatisfaction: status.performanceMetrics.userSatisfaction,
        knowledgeGrowthRate: status.performanceMetrics.knowledgeGrowthRate,
        systemEfficiency: status.performanceMetrics.systemEfficiency,
        activeUsers: status.realTimeUpdates.activeUsers,
        systemLoad: status.realTimeUpdates.systemLoad,
        userSessions: status.userSessions,
        knowledgeGraph: status.knowledgeGraph,
        analyticsEngine: status.analyticsEngine,
        smartCache: status.smartCache
      };
      
      res.write(`data: ${JSON.stringify(update)}\n\n`);
    };
    
    // Send updates every 2 seconds
    const interval = setInterval(sendUpdate, 2000);
    
    // Initial update
    sendUpdate();
    
    // Clean up on disconnect
    req.on('close', () => {
      clearInterval(interval);
    });
    
  } catch (error) {
    console.error('[Enhanced Stream] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Personalized Learning Path
router.post('/learning-path/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { userProfile, goals, preferences } = req.body;
    
    if (!userId || !userProfile) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, userProfile' 
      });
    }
    
    // Generate personalized learning path
    const learningPath = await enhancedDashboardController.generatePersonalizedLearningPath(
      userId, userProfile, goals, preferences
    );
    
    res.json({
      success: true,
      learningPath,
      userId,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Learning Path] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Adaptive Content Recommendations
router.post('/recommendations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { context, preferences, currentProgress } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'Missing required parameter: userId' 
      });
    }
    
    // Generate adaptive recommendations
    const recommendations = await enhancedDashboardController.generateAdaptiveRecommendations(
      userId, context, preferences, currentProgress
    );
    
    res.json({
      success: true,
      recommendations,
      userId,
      context,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Recommendations] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Performance Optimization
router.post('/optimize/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { optimizationType, parameters } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'Missing required parameter: userId' 
      });
    }
    
    // Apply performance optimization
    const optimization = await enhancedDashboardController.applyPerformanceOptimization(
      userId, optimizationType, parameters
    );
    
    res.json({
      success: true,
      optimization,
      userId,
      optimizationType,
      appliedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Performance Optimization] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

module.exports = router;
