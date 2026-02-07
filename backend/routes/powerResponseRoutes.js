const express = require('express');
const router = express.Router();
const { 
  initializePowerSystem, 
  generatePowerResponse, 
  getSystemStatus 
} = require('../controllers/powerResponseController');

// Initialize ultimate power system
router.post('/initialize', async (req, res) => {
  try {
    const result = await initializePowerSystem(req, res);
    return result;
  } catch (error) {
    console.error('[Power Response Routes] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Generate ultimate power response
router.post('/respond', async (req, res) => {
  try {
    const result = await generatePowerResponse(req, res);
    return result;
  } catch (error) {
    console.error('[Power Response Routes] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get system status
router.get('/status', async (req, res) => {
  try {
    const result = await getSystemStatus(req, res);
    return result;
  } catch (error) {
    console.error('[Power Response Routes] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Continuous response stream (nonstop mode)
router.get('/stream', async (req, res) => {
  try {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    
    // Send continuous updates
    const sendUpdate = () => {
      const update = {
        timestamp: Date.now(),
        status: 'ACTIVE',
        power: 'ULTIMATE',
        knowledge: 'EXPANDING',
        learning: 'CONTINUOUS'
      };
      
      res.write(`data: ${JSON.stringify(update)}\n\n`);
    };
    
    // Send updates every 5 seconds
    const interval = setInterval(sendUpdate, 5000);
    
    // Initial update
    sendUpdate();
    
    // Clean up on disconnect
    req.on('close', () => {
      clearInterval(interval);
    });
    
  } catch (error) {
    console.error('[Power Stream] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

module.exports = router;
