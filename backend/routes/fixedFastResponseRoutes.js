const express = require('express');
const router = express.Router();
const { 
  initializeFixedSystem, 
  generateFixedFastResponse, 
  getFixedSystemStatus,
  clearFixedCache
} = require('../controllers/fixedFastResponseController');

// Initialize Fixed Fast Response System
router.post('/initialize', async (req, res) => {
  try {
    const result = await initializeFixedSystem(req, res);
    return result;
  } catch (error) {
    console.error('[Fixed Fast Response Routes] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Generate Fixed Fast Response
router.post('/respond', async (req, res) => {
  try {
    const result = await generateFixedFastResponse(req, res);
    return result;
  } catch (error) {
    console.error('[Fixed Fast Response Routes] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get Fixed System Status
router.get('/status', async (req, res) => {
  try {
    const result = await getFixedSystemStatus(req, res);
    return result;
  } catch (error) {
    console.error('[Fixed Fast Response Routes] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Clear Cache
router.post('/clear-cache', async (req, res) => {
  try {
    const result = await clearFixedCache(req, res);
    return result;
  } catch (error) {
    console.error('[Clear Cache Routes] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Batch Fast Response
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
    
    // Process all queries in parallel
    const responses = await Promise.all(
      queries.map(query => 
        generateFixedFastResponse({ 
          body: { query, userProfile, context } 
        }, res)
      )
    );
    
    res.json({
      success: true,
      batchMode: 'FIXED_FAST',
      queriesProcessed: queries.length,
      responses,
      role: userProfile.role,
      totalResponseTime: responses.reduce((sum, r) => sum + parseInt(r.responseTime), 0)
    });
    
  } catch (error) {
    console.error('[Batch Response] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Role-specific response
router.post('/respond/:role', async (req, res) => {
  try {
    const { role } = req.params;
    const { query, context } = req.body;
    
    if (!query) {
      return res.status(400).json({ 
        error: 'Missing required field: query' 
      });
    }
    
    if (!['student', 'faculty', 'admin'].includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role. Must be: student, faculty, or admin' 
      });
    }
    
    const userProfile = { role };
    const result = await generateFixedFastResponse({ 
      body: { query, userProfile, context } 
    }, res);
    
    res.json(result);
    
  } catch (error) {
    console.error('[Role Response] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

module.exports = router;
