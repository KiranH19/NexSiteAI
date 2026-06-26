/**
 * Generates a clean URL slug from a business name.
 * Handles special characters, spaces, and lowercase conversion.
 * Optionally appends a random short string to prevent conflicts.
 * 
 * @param {string} text - The input business name
 * @param {boolean} [addRandomSuffix=false] - Whether to append a unique 4-character suffix
 * @returns {string} The slugified string
 */
function slugify(text, addRandomSuffix = false) {
  if (!text) return 'site';
  
  let slug = text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text

  if (addRandomSuffix) {
    const randomHex = Math.random().toString(36).substring(2, 6);
    slug = `${slug}-${randomHex}`;
  }

  return slug || 'site';
}

module.exports = slugify;
