// services/grokService.js - AI content generation via Grok API

const axios = require('axios');
const { extractJson, validateWebsiteJson, repairJson } = require('../utils/validateJson');

// ─── Config ───────────────────────────────────────────────────────────────────
// Supported Grok models (in priority order — update if xAI changes names)
const GROK_API_URL = process.env.GROK_API_URL || 'https://api.x.ai/v1/chat/completions';
const GROK_MODEL   = process.env.GROK_MODEL   || 'grok-3-latest';

/**
 * Build the system prompt
 */
function buildSystemPrompt() {
  return `You are a professional website content writer for small businesses in India.
You ONLY return valid JSON. No markdown. No explanation. No code blocks. No backticks.
Start your response directly with { and end with }.
The JSON must be complete and properly formatted.`;
}

/**
 * Build the user prompt with business details
 */
function buildUserPrompt(businessData) {
  // Safely handle optional fields
  const name        = businessData.businessName || 'Our Business';
  const category    = businessData.category     || 'Business';
  const description = businessData.description  || '';
  const services    = businessData.services     || '';
  const phone       = businessData.phone        || '';
  const email       = businessData.email        || '';
  const address     = businessData.address      || '';
  const style       = businessData.designStyle  || 'Modern';

  return `Generate professional website content for this Indian small business.
Return ONLY valid JSON. No markdown. No explanation. No text before or after JSON.
Do NOT wrap in backticks or code blocks. Start directly with { and end with }.

Required JSON structure (fill ALL fields):
{
  "heroTitle": "catchy headline",
  "heroSubtitle": "supporting tagline",
  "aboutTitle": "about section heading",
  "aboutDescription": "2-3 sentences about the business",
  "services": [
    { "title": "service name", "description": "service description" },
    { "title": "service name", "description": "service description" },
    { "title": "service name", "description": "service description" },
    { "title": "service name", "description": "service description" }
  ],
  "faq": [
    { "question": "question?", "answer": "answer" },
    { "question": "question?", "answer": "answer" },
    { "question": "question?", "answer": "answer" },
    { "question": "question?", "answer": "answer" }
  ],
  "ctaTitle": "call to action heading",
  "ctaText": "call to action description",
  "seoTitle": "SEO page title under 60 chars",
  "seoDescription": "meta description under 160 chars"
}

Business Details:
- Name: ${name}
- Category: ${category}
- Description: ${description}
- Services: ${services}
- Phone: ${phone}
- Email: ${email}
- Address: ${address}
- Style: ${style}`;
}

/**
 * Make a single Grok API call
 */
async function callGrok(messages) {
  const apiKey = process.env.GROK_API_KEY;

  if (!apiKey) {
    throw new Error('GROK_API_KEY is not set in environment variables');
  }

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type':  'application/json'
  };

  const payload = {
    model:       GROK_MODEL,
    messages:    messages,
    temperature: 0.7,
    max_tokens:  2000
  };

  console.log(`📡 Calling Grok API — model: ${GROK_MODEL}, url: ${GROK_API_URL}`);

  try {
    const response = await axios.post(GROK_API_URL, payload, {
      headers,
      timeout: 45000  // 45 second timeout
    });

    const content = response.data?.choices?.[0]?.message?.content;

    if (!content) {
      console.error('❌ Grok response structure:', JSON.stringify(response.data, null, 2));
      throw new Error('Grok API returned empty content');
    }

    console.log(`✅ Grok responded — ${content.length} chars`);
    return content;

  } catch (err) {
    if (err.response) {
      // HTTP error from Grok
      const status  = err.response.status;
      const errBody = err.response.data;
      console.error(`❌ Grok HTTP ${status}:`, JSON.stringify(errBody, null, 2));

      if (status === 401) throw new Error('Grok API key is invalid or expired. Please check GROK_API_KEY in Railway variables.');
      if (status === 429) throw new Error('Grok API rate limit exceeded. Please wait a minute and try again.');
      if (status === 400) throw new Error(`Grok bad request: ${errBody?.error?.message || 'Invalid request'}`);
      if (status === 404) throw new Error(`Grok model "${GROK_MODEL}" not found. Try setting GROK_MODEL=grok-2-1212 in Railway variables.`);
      if (status >= 500)  throw new Error(`Grok server error (${status}). Please try again in a moment.`);

      throw new Error(`Grok API error ${status}: ${errBody?.error?.message || err.message}`);
    }

    if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
      throw new Error('Grok API timed out after 45 seconds. Please try again.');
    }

    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      throw new Error('Cannot reach Grok API. Check server internet connection.');
    }

    throw err; // Re-throw if already a clean Error
  }
}

/**
 * Generate website content — with retry + fallback repair
 */
async function generateWebsiteContent(businessData) {

  const baseMessages = [
    { role: 'system', content: buildSystemPrompt() },
    { role: 'user',   content: buildUserPrompt(businessData) }
  ];

  // ── Attempt 1 ─────────────────────────────────────────────────────────────
  let rawResponse;
  try {
    rawResponse = await callGrok(baseMessages);
  } catch (err) {
    throw err; // Propagate clean error message to route handler
  }

  let parsed = extractJson(rawResponse);
  let { valid, errors } = parsed
    ? validateWebsiteJson(parsed)
    : { valid: false, errors: ['Could not parse JSON from response'] };

  if (valid) {
    console.log('✅ Valid JSON on first attempt');
    return parsed;
  }

  console.warn('⚠️  First attempt JSON invalid:', errors.join(', '), '— retrying...');

  // ── Attempt 2 (retry with correction prompt) ───────────────────────────────
  try {
    const retryMessages = [
      ...baseMessages,
      { role: 'assistant', content: rawResponse },
      { role: 'user',      content: 'Your previous response was not valid JSON. Return ONLY the corrected JSON object. No text before or after. Start with { and end with }.' }
    ];
    const retryRaw = await callGrok(retryMessages);
    const retryParsed = extractJson(retryRaw);
    if (retryParsed && validateWebsiteJson(retryParsed).valid) {
      console.log('✅ Valid JSON on retry');
      return retryParsed;
    }
    // Use retry result even if partial — repair will fix it
    if (retryParsed) parsed = retryParsed;
  } catch (retryErr) {
    console.warn('⚠️  Retry call failed:', retryErr.message);
  }

  // ── Fallback: repair whatever we have ─────────────────────────────────────
  console.warn('🔧 Using repaired/fallback JSON');
  return repairJson(parsed, businessData);
}

module.exports = { generateWebsiteContent };
