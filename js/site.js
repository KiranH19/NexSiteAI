/**
 * NexSite - Public Website Dynamic Router and Renderer
 */

window.onload = async function() {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');
  const publishedSuccess = urlParams.get('published') === 'true';

  const loader = document.getElementById('loading-container');
  const errorContainer = document.getElementById('error-container');

  if (!slug) {
    loader.style.display = 'none';
    errorContainer.style.display = 'flex';
    return;
  }

  try {
    // Fetch website database entry
    const response = await API.getWebsiteBySlug(slug);

    if (!response.success || !response.website) {
      throw new Error('Website not found');
    }

    const website = response.website;

    // Render template via dynamic rendering script
    const renderedHtml = window.nexsiteTemplates.render(website.template, website.content_json, website);

    // Overwrite page document contents
    document.open();
    document.write(renderedHtml);
    document.close();

    // After document is overwritten, insert congratulatory success banner if flag is present
    if (publishedSuccess) {
      const banner = document.createElement('div');
      banner.id = 'congrats-banner';
      banner.style.cssText = 'background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-align: center; padding: 16px 24px; position: sticky; top: 0; z-index: 10000; box-shadow: 0 4px 15px rgba(0,0,0,0.15); font-family: "Inter", sans-serif;';
      banner.innerHTML = `
        <h3 style="font-size: 1.1rem; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 700; margin: 0;">
          <span style="font-size: 1.4rem;">🎉</span> Congratulations! Your website is officially live!
        </h3>
        <p style="font-size: 0.9rem; margin-top: 4px; margin-bottom: 0; opacity: 0.95;">
          Your public site URL is: <b>${window.location.href}</b>. 
          <a href="login.html" style="color: white; font-weight: 700; text-decoration: underline; margin-left: 8px;">Log In to your Dashboard</a> to modify content and view customer leads.
        </p>
        <button onclick="document.getElementById('congrats-banner').remove()" style="position: absolute; right: 20px; top: 50%; transform: translateY(-50%); background: transparent; border: none; color: white; cursor: pointer; font-size: 1.5rem; display: flex; align-items: center;">
          &times;
        </button>
      `;
      document.body.insertBefore(banner, document.body.firstChild);
    }

  } catch (error) {
    console.error('Failed to load website:', error);
    loader.style.display = 'none';
    errorContainer.style.display = 'flex';
  }
};
