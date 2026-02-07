const express = require('express');
const router = express.Router();
const { 
  initializeNonstopSystem, 
  generateNonstopResponse, 
  getNonstopSystemStatus 
} = require('../controllers/nonstopResponseController');

// Initialize NONSTOP ultimate power system
router.post('/initialize', async (req, res) => {
  try {
    const result = await initializeNonstopSystem(req, res);
    return result;
  } catch (error) {
    console.error('[Nonstop Response Routes] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Generate NONSTOP ultimate power response
router.post('/respond', async (req, res) => {
  try {
    const result = await generateNonstopResponse(req, res);
    return result;
  } catch (error) {
    console.error('[Nonstop Response Routes] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get NONSTOP system status
router.get('/status', async (req, res) => {
  try {
    const result = await getNonstopSystemStatus(req, res);
    return result;
  } catch (error) {
    console.error('[Nonstop Response Routes] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Continuous NONSTOP response stream
router.get('/stream', async (req, res) => {
  try {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    
    // Send continuous NONSTOP updates
    const sendNonstopUpdate = () => {
      const update = {
        timestamp: Date.now(),
        status: 'NONSTOP_ACTIVE',
        power: 'MAXIMUM',
        knowledge: 'EXPANDING',
        learning: 'INFINITE',
        updates: 'CONTINUOUS',
        scaling: 'DYNAMIC',
        optimization: 'REAL_TIME'
      };
      
      res.write(`data: ${JSON.stringify(update)}\n\n`);
    };
    
    // Send updates every 2 seconds (NONSTOP mode)
    const interval = setInterval(sendNonstopUpdate, 2000);
    
    // Initial update
    sendNonstopUpdate();
    
    // Clean up on disconnect
    req.on('close', () => {
      clearInterval(interval);
    });
    
  } catch (error) {
    console.error('[Nonstop Stream] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Maximum power burst mode
router.post('/burst', async (req, res) => {
  try {
    const { queries, userProfile, context } = req.body;
    
    if (!queries || !Array.isArray(queries)) {
      return res.status(400).json({ 
        error: 'Missing required field: queries (array)' 
      });
    }
    
    // Process multiple queries in NONSTOP mode
    const burstResponses = await Promise.all(
      queries.map(query => 
        generateNonstopResponse({ body: { query, userProfile, context } }, res)
      )
    );
    
    res.json({
      success: true,
      burstMode: 'NONSTOP_MAXIMUM',
      queriesProcessed: queries.length,
      responses: burstResponses,
      totalPower: 'ULTIMATE',
      systemStatus: 'BURST_ACTIVE'
    });
    
  } catch (error) {
    console.error('[Nonstop Burst] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

module.exports = router;
