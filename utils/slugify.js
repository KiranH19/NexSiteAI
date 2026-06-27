// utils/slugify.js - Convert business name to URL-safe slug

/**
 * Convert a string to a URL-safe slug
 * Example: "Ravi's Dental Clinic!" → "ravis-dental-clinic"
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')   // Remove special chars except hyphens
    .replace(/[\s_]+/g, '-')    // Replace spaces/underscores with hyphens
    .replace(/--+/g, '-')       // Collapse multiple hyphens
    .replace(/^-+|-+$/g, '');   // Trim leading/trailing hyphens
}

/**
 * Generate a unique slug by appending random suffix if needed
 * @param {string} businessName 
 * @returns {string} slug
 */
function generateSlug(businessName) {
  const base = slugify(businessName);
  const suffix = Math.random().toString(36).substring(2, 7); // 5-char random
  return `${base}-${suffix}`;
}

module.exports = { slugify, generateSlug };
