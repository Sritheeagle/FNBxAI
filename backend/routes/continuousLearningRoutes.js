const express = require('express');
const router = express.Router();
const { 
  analyzeSession, 
  generateKnowledge, 
  updateKnowledge 
} = require('../controllers/continuousLearningController');

// Analyze session for learning opportunities
router.post('/analyze-session', async (req, res) => {
  try {
    const result = await analyzeSession(req, res);
    return result;
  } catch (error) {
    console.error('[Continuous Learning Routes] Session analysis error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Generate new knowledge entry
router.post('/generate-knowledge', async (req, res) => {
  try {
    const result = await generateKnowledge(req, res);
    return result;
  } catch (error) {
    console.error('[Continuous Learning Routes] Knowledge generation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Update existing knowledge
router.put('/update-knowledge/:entryId', async (req, res) => {
  try {
    const { entryId } = req.params;
    const { feedback, improvements } = req.body;
    
    if (!feedback || !improvements) {
      return res.status(400).json({ 
        error: 'Missing required fields: feedback, improvements' 
      });
    }
    
    // Add entryId to request body for controller
    req.body.entryId = entryId;
    
    const result = await updateKnowledge(req, res);
    return result;
  } catch (error) {
    console.error('[Continuous Learning Routes] Knowledge update error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

module.exports = router;
