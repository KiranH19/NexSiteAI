// services/grokService.js - AI content generation via Grok API

const axios = require('axios');
const { extractJson, validateWebsiteJson, repairJson } = require('../utils/validateJson');

const GROK_API_URL = process.env.GROK_API_URL || 'https://api.x.ai/v1/chat/completions';
const GROK_MODEL   = process.env.GROK_MODEL   || 'grok-2-latest';

/**
 * Build the system prompt for website content generation
 */
function buildSystemPrompt() {
  return `You are a professional website content writer for small businesses in India.
You ONLY return valid JSON. No markdown. No explanation. No code blocks.
Start your response directly with { and end with }.
The JSON must be complete and properly formatted.`;
}

/**
 * Build the user prompt with business details
 */
function buildUserPrompt(businessData) {
  return `Generate professional website content for this small business.
Return ONLY valid JSON. No markdown. No explanation. No text before or after JSON.

Required JSON structure:
{
  "heroTitle": "catchy headline for the business",
  "heroSubtitle": "supporting tagline",
  "aboutTitle": "about section heading",
  "aboutDescription": "2-3 paragraph about the business",
  "services": [
    { "title": "service name", "description": "service description" }
  ],
  "faq": [
    { "question": "common question", "answer": "helpful answer" }
  ],
  "ctaTitle": "call to action heading",
  "ctaText": "call to action description",
  "seoTitle": "SEO page title",
  "seoDescription": "SEO meta description under 160 chars"
}

Include at least 4 services and 4 FAQs. Make content professional and relevant.

Business Details:
- Name: ${businessData.businessName}
- Category: ${businessData.category}
- Description: ${businessData.description}
- Services offered: ${businessData.services}
- Phone: ${businessData.phone}
- Email: ${businessData.email}
- Address: ${businessData.address}
- Design style preference: ${businessData.designStyle}`;
}

/**
 * Call Grok API to generate website content
 * Retries once if JSON is invalid
 */
async function generateWebsiteContent(businessData) {
  const headers = {
    'Authorization': `Bearer ${process.env.GROK_API_KEY}`,
    'Content-Type': 'application/json'
  };

  const payload = {
    model: GROK_MODEL,
    messages: [
      { role: 'system', content: buildSystemPrompt() },
      { role: 'user',   content: buildUserPrompt(businessData) }
    ],
    temperature: 0.7,
    max_tokens: 2000
  };

  // ── First attempt ──────────────────────────────────────────────────────────
  let rawResponse;
  try {
    const response = await axios.post(GROK_API_URL, payload, { headers, timeout: 30000 });
    rawResponse = response.data?.choices?.[0]?.message?.content;
  } catch (err) {
    throw new Error(`Grok API call failed: ${err.response?.data?.error?.message || err.message}`);
  }

  if (!rawResponse) {
    throw new Error('Grok API returned empty response');
  }

  // ── Parse & validate ───────────────────────────────────────────────────────
  let parsed = extractJson(rawResponse);
  let { valid, errors } = parsed ? validateWebsiteJson(parsed) : { valid: false, errors: ['Could not parse JSON'] };

  if (!valid) {
    console.warn('⚠️  First Grok response invalid. Errors:', errors, '— Retrying...');

    // ── Retry with stricter prompt ───────────────────────────────────────────
    const retryPayload = {
      ...payload,
      messages: [
        ...payload.messages,
        { role: 'assistant', content: rawResponse },
        { role: 'user',      content: 'The JSON you returned was invalid or incomplete. Return ONLY the corrected valid JSON object. Nothing else.' }
      ]
    };

    try {
      const retryRes = await axios.post(GROK_API_URL, retryPayload, { headers, timeout: 30000 });
      const retryRaw = retryRes.data?.choices?.[0]?.message?.content;
      parsed = extractJson(retryRaw);
    } catch (retryErr) {
      console.error('⚠️  Retry also failed. Using repaired fallback.');
    }
  }

  // ── Repair if still invalid ────────────────────────────────────────────────
  if (!parsed || !validateWebsiteJson(parsed).valid) {
    console.warn('🔧 Using repaired/fallback JSON');
    parsed = repairJson(parsed, businessData);
  }

  return parsed;
}

module.exports = { generateWebsiteContent };
