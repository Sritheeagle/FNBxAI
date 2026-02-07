const express = require('express');
const router = express.Router();
const { 
  initializeDashboardSystem, 
  generateDashboardResponse, 
  getDashboardStatus,
  clearDashboardCache,
  getDashboardHistory,
  getDashboardStats
} = require('../controllers/dashboardResponseController');
const { dashboardResponseController } = require('../controllers/dashboardResponseController');

// Initialize Dashboard System
router.post('/initialize', async (req, res) => {
  try {
    const result = await initializeDashboardSystem(req, res);
    return result;
  } catch (error) {
    console.error('[Dashboard Routes] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Generate Dashboard Response
router.post('/respond', async (req, res) => {
  try {
    const result = await generateDashboardResponse(req, res);
    return result;
  } catch (error) {
    console.error('[Dashboard Routes] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get Dashboard Status
router.get('/status', async (req, res) => {
  try {
    const result = await getDashboardStatus(req, res);
    return result;
  } catch (error) {
    console.error('[Dashboard Routes] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Clear Dashboard Cache
router.post('/clear-cache', async (req, res) => {
  try {
    const result = await clearDashboardCache(req, res);
    return result;
  } catch (error) {
    console.error('[Dashboard Routes] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get Recent Chat History
router.get('/history', async (req, res) => {
  try {
    const result = await getDashboardHistory(req, res);
    return result;
  } catch (error) {
    console.error('[Dashboard Routes] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get Knowledge Statistics
router.get('/stats', async (req, res) => {
  try {
    const result = await getDashboardStats(req, res);
    return result;
  } catch (error) {
    console.error('[Dashboard Routes] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'internal server error' 
    });
  }
});

// Batch Dashboard Response
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
    
    // Process all queries in parallel for fast batch processing
    const batchPromises = queries.map(query => 
      generateDashboardResponse({ 
        body: { query, userProfile, context } 
      }, res)
    );
    
    const batchResults = await Promise.all(batchPromises);
    
    res.json({
      success: true,
      batchMode: 'DASHBOARD_FAST',
      queriesProcessed: queries.length,
      responses: batchResults,
      totalResponseTime: batchResults.reduce((sum, r) => 
        sum + parseInt(r.responseTime), 0
      ),
      role: userProfile.role,
      knowledgeUpdates: batchResults.filter(r => r.knowledgeUpdated).length,
      ragSuccess: batchResults.filter(r => r.ragStatus === 'active').length
    });
    
  } catch (error) {
    console.error('[Batch Dashboard Response] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Real-time Dashboard Stream
router.get('/stream', async (req, res) => {
  try {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    
    // Send real-time updates every 2 seconds
    const sendUpdate = () => {
      const status = dashboardResponseController.getDashboardStatus();
      const update = {
        timestamp: Date.now(),
        status: status.isInitialized ? 'ACTIVE' : 'INACTIVE',
        totalResponses: status.performanceMetrics.totalResponses,
        avgResponseTime: status.performanceMetrics.avgResponseTime.toFixed(2),
        cacheHitRate: status.performanceMetrics.cacheHitRate,
        knowledgeUpdates: status.performanceMetrics.knowledgeUpdates,
        ragSuccess: status.performanceMetrics.ragSuccess,
        cacheSize: status.cacheSize
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
    console.error('[Dashboard Stream] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

module.exports = router;
