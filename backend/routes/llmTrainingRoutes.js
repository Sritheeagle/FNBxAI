const express = require('express');
const router = express.Router();
const { 
  trainModel, 
  getTrainingProgress, 
  generateTrainedResponse 
} = require('../controllers/llmTrainingController');

// Train LLM model
router.post('/train', async (req, res) => {
  try {
    const result = await trainModel(req, res);
    return result;
  } catch (error) {
    console.error('[LLM Training Routes] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get training progress
router.get('/progress', async (req, res) => {
  try {
    const result = await getTrainingProgress(req, res);
    return result;
  } catch (error) {
    console.error('[Training Progress Routes] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Generate response with trained model
router.post('/generate', async (req, res) => {
  try {
    const result = await generateTrainedResponse(req, res);
    return result;
  } catch (error) {
    console.error('[Trained Response Routes] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

module.exports = router;
