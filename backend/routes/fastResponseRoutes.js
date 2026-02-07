const express = require('express');
const router = express.Router();
const { 
  generateFastResponse, 
  updateFastKnowledge, 
  checkFastKnowledgeHealth,
  clearFastCache 
} = require('../controllers/fastResponseController');

// Fast response endpoint
router.post('/chat', async (req, res) => {
  try {
    const { query, role, userProfile } = req.body;
    
    if (!query || !role || !userProfile) {
      return res.status(400).json({ 
        error: 'Missing required fields: query, role, userProfile' 
      });
    }
    
    const result = await generateFastResponse(query, role, userProfile);
    
    res.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('[Fast Response Routes] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Update fast knowledge database
router.post('/update-knowledge', async (req, res) => {
  try {
    const { knowledgeData } = req.body;
    
    if (!knowledgeData) {
      return res.status(400).json({ 
        error: 'Missing required field: knowledgeData' 
      });
    }
    
    const result = await updateFastKnowledge(knowledgeData);
    
    res.json(result);
    
  } catch (error) {
    console.error('[Fast Knowledge Update Routes] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Check fast knowledge health
router.get('/health', async (req, res) => {
  try {
    const health = await checkFastKnowledgeHealth();
    
    res.json(health);
    
  } catch (error) {
    console.error('[Fast Health Check Routes] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Clear fast cache
router.post('/clear-cache', async (req, res) => {
  try {
    const result = clearFastCache();
    
    res.json(result);
    
  } catch (error) {
    console.error('[Clear Cache Routes] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

module.exports = router;
