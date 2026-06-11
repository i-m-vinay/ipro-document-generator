/**
 * I-Pro Solutions Logo Loader
 * Loads the actual company logo into LocalStorage on first run.
 * The logo is fetched from the assets/images folder and stored as base64.
 */

(function() {
  // If logo already set by user, don't override
  const existing = localStorage.getItem('ipro_logo');
  if (existing && existing !== 'null' && existing.startsWith('data:')) return;

  // Load the logo from the assets directory
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = function() {
    try {
      const canvas = document.createElement('canvas');
      // Scale to reasonable size for storage (max 600px wide)
      const maxW = 600;
      const scale = img.naturalWidth > maxW ? maxW / img.naturalWidth : 1;
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png', 0.92);
      localStorage.setItem('ipro_logo', dataUrl);
      // Update nav logo if app is already loaded
      if (window.App) window.App.updateLogoInNav();
    } catch(e) {
      console.warn('Logo auto-load failed (likely CORS):', e);
    }
  };
  img.onerror = function() {
    console.warn('Could not load logo from assets. Please upload via Settings.');
  };

  // Use relative path — works on GitHub Pages and locally
  const base = window.location.pathname.replace(/\/[^/]*$/, '');
  img.src = 'assets/images/logo.png';
})();
