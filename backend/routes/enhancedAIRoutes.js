const express = require('express');
const router = express.Router();
const { 
  generateEnhancedResponse, 
  analyzeModelPaper, 
  analyzeNotes, 
  generateStudentAnswer 
} = require('../controllers/enhancedAIController');

// Enhanced AI Chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, role, userProfile, context } = req.body;
    
    if (!message || !role || !userProfile) {
      return res.status(400).json({ 
        error: 'Missing required fields: message, role, userProfile' 
      });
    }
    
    const result = await generateEnhancedResponse(message, role, userProfile, context);
    
    res.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('[Enhanced AI Chat] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Model Paper Analysis endpoint
router.post('/analyze-model-paper', async (req, res) => {
  try {
    const { paperContent, subject, year } = req.body;
    
    if (!paperContent || !subject || !year) {
      return res.status(400).json({ 
        error: 'Missing required fields: paperContent, subject, year' 
      });
    }
    
    const result = await analyzeModelPaper(paperContent, subject, year);
    
    res.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('[Model Paper Analysis] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Notes Analysis endpoint
router.post('/analyze-notes', async (req, res) => {
  try {
    const { notesContent, subject, topic } = req.body;
    
    if (!notesContent || !subject || !topic) {
      return res.status(400).json({ 
        error: 'Missing required fields: notesContent, subject, topic' 
      });
    }
    
    const result = await analyzeNotes(notesContent, subject, topic);
    
    res.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('[Notes Analysis] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Student Answer Generation endpoint
router.post('/generate-answer', async (req, res) => {
  try {
    const { question, subject, marks, context } = req.body;
    
    if (!question || !subject || !marks) {
      return res.status(400).json({ 
        error: 'Missing required fields: question, subject, marks' 
      });
    }
    
    const result = await generateStudentAnswer(question, subject, marks, context);
    
    res.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('[Answer Generation] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

module.exports = router;
