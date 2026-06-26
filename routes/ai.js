const express = require('express');
const rateLimit = require('express-rate-limit');
const grokService = require('../services/grokService');
const supabaseService = require('../services/supabaseService');

const router = express.Router();

// Rate limiter for AI generation: Max 5 generations per IP per hour
const generateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    success: false,
    message: 'Too many websites generated from this IP. Please try again in an hour.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * POST /api/generate
 * Expects businessData in body: { name, category, description, services, phone, email, address, logoUrl, designStyle }
 */
router.post('/generate', generateLimiter, async (req, res) => {
  try {
    const { businessData } = req.body;
    
    if (!businessData || !businessData.name || !businessData.category) {
      return res.status(400).json({
        success: false,
        message: 'Invalid business data. Business name and category are required.'
      });
    }

    console.log(`Generating website for: "${businessData.name}" (${businessData.category})`);

    // Call Grok service (or Heuristic Mock)
    const generatedContent = await grokService.generateWebsiteContent(businessData);

    // Save temporary session in Supabase (or mock memory)
    const { data: session, error } = await supabaseService.createSession({
      business_data: businessData,
      generated_content: generatedContent
    });

    if (error) {
      console.error('Error saving generation session:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to initialize session. Please try again.'
      });
    }

    res.json({
      success: true,
      sessionId: session.id,
      generatedContent
    });

  } catch (error) {
    console.error('API /generate error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error occurred during AI generation.'
    });
  }
});

module.exports = router;
