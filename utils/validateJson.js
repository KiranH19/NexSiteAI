// utils/validateJson.js - Validate and repair AI-generated JSON

const REQUIRED_FIELDS = [
  'heroTitle', 'heroSubtitle', 'aboutTitle', 'aboutDescription',
  'services', 'faq', 'ctaTitle', 'ctaText', 'seoTitle', 'seoDescription'
];

/**
 * Extract JSON from a string that might contain markdown fences or extra text
 */
function extractJson(text) {
  if (!text || typeof text !== 'string') return null;

  // Try direct parse first
  try {
    return JSON.parse(text.trim());
  } catch (_) {}

  // Try extracting from markdown code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch (_) {}
  }

  // Try extracting the first { ... } block
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (_) {}
  }

  return null;
}

/**
 * Validate that JSON has all required fields with correct types
 */
function validateWebsiteJson(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Response is not a valid JSON object'] };
  }

  const errors = [];

  for (const field of REQUIRED_FIELDS) {
    if (data[field] === undefined || data[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (data.services && !Array.isArray(data.services)) {
    errors.push('services must be an array');
  }

  if (data.faq && !Array.isArray(data.faq)) {
    errors.push('faq must be an array');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Repair JSON by filling in missing fields with defaults
 */
function repairJson(data, businessData) {
  const name = businessData?.businessName || 'Our Business';
  const category = businessData?.category || 'Business';

  const repaired = {
    heroTitle:        data?.heroTitle        || `Welcome to ${name}`,
    heroSubtitle:     data?.heroSubtitle     || `Your trusted ${category} partner`,
    aboutTitle:       data?.aboutTitle       || `About ${name}`,
    aboutDescription: data?.aboutDescription || businessData?.description || `We are a professional ${category} dedicated to serving our customers.`,
    services: Array.isArray(data?.services) && data.services.length > 0
      ? data.services
      : [
          { title: 'Our Services', description: 'We provide top-quality services tailored to your needs.' },
          { title: 'Expert Team',  description: 'Our experienced team is here to help you succeed.' }
        ],
    faq: Array.isArray(data?.faq) && data.faq.length > 0
      ? data.faq
      : [
          { question: 'How can I contact you?', answer: `Call us at ${businessData?.phone || 'our number'} or email ${businessData?.email || 'us'}.` },
          { question: 'Where are you located?', answer: businessData?.address || 'Please contact us for location details.' }
        ],
    ctaTitle:       data?.ctaTitle       || 'Get In Touch Today',
    ctaText:        data?.ctaText        || 'Contact us now and let us help you achieve your goals.',
    seoTitle:       data?.seoTitle       || `${name} - ${category}`,
    seoDescription: data?.seoDescription || `${name} - Professional ${category} services. Contact us today.`
  };

  return repaired;
}

module.exports = { extractJson, validateWebsiteJson, repairJson };
