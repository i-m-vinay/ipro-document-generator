/**
 * I-Pro Solutions — Image Export v4.1
 *
 * Key insight: html2canvas REQUIRES the target element to be:
 *  1. Attached to the real DOM
 *  2. NOT visibility:hidden (inherited visibility hides child rendering)
 *  3. NOT opacity:0 (transparent = blank canvas)
 *
 * Solution: position the shell far off-screen to the LEFT (left:-9999px)
 *  with no visibility/opacity hiding — the user can't see it, but html2canvas can render it.
 */

const PDFExport = {

  /* ─── Build HTML string with embedded images ──────────────── */
  _buildHTML(doc) {
    let html = Templates.generateDocumentHTML(doc);
    const logo = Storage.getLogo();
    const sig  = Storage.getSignature();
    const qr   = Storage.getQRCode();
    if (logo && html.includes('ipro_logo_placeholder')) html = html.replace(/ipro_logo_placeholder/g, logo);
    if (sig  && html.includes('ipro_signature_placeholder')) html = html.replace(/ipro_signature_placeholder/g, sig);
    if (qr   && html.includes('ipro_qr_placeholder'))        html = html.replace(/ipro_qr_placeholder/g, qr);
    return html;
  },

  /* ─── Attach content to real DOM, off-screen (no visibility:hidden!) ── */
  _mount(html) {
    // position:fixed; left:-9999px puts it off-screen so user can't see it
    // NO visibility:hidden / opacity:0 — those make html2canvas render blank
    const shell = document.createElement('div');
    shell.setAttribute('aria-hidden', 'true');
    shell.style.cssText = [
      'position:fixed',
      'top:0',
      'left:-9999px',
      'width:794px',
      'z-index:-9999',
      'background:#fff',
    ].join(';');

    const inner = document.createElement('div');
    inner.style.cssText = 'width:794px; background:#fff; font-family:Inter,Arial,sans-serif;';
    inner.innerHTML = html;

    shell.appendChild(inner);
    document.body.appendChild(shell);
    return { shell, inner };
  },

  /* ─── Wait for every <img> to load ───────────────────────── */
  async _waitForImages(el) {
    const imgs = Array.from(el.querySelectorAll('img'));
    await Promise.all(imgs.map(img => new Promise(resolve => {
      if (img.complete && img.naturalWidth > 0) return resolve();
      img.onload = img.onerror = resolve;
    })));
    // Two frames so the browser has time to repaint everything
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  },

  /* ─── Capture element → canvas ───────────────────────────── */
  async _toCanvas(inner) {
    await this._waitForImages(inner);
    return html2canvas(inner, {
      scale:           2,          // 2× = high-res, perfect for printing/sharing
      useCORS:         true,
      logging:         false,
      width:           794,
      height:          inner.scrollHeight,
      windowWidth:     794,
      backgroundColor: '#ffffff',
    });
  },

  /* ─── PUBLIC: Download PNG ────────────────────────────────── */
  async download(docId) {
    const doc = Storage.getDocumentById(docId);
    if (!doc) { Utils.showToast('Document not found.', 'error'); return; }

    Utils.showToast('Generating image…', 'info');
    window.scrollTo(0, 0);

    const { shell, inner } = this._mount(this._buildHTML(doc));
    try {
      const canvas = await this._toCanvas(inner);

      // Trigger download
      canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = `${doc.docNumber}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        Utils.showToast(`✓ ${doc.docNumber}.png saved!`, 'success');
      }, 'image/png');

    } catch (err) {
      console.error('[IMG] export failed:', err);
      Utils.showToast('Image export failed — try Print instead.', 'error');
    } finally {
      document.body.removeChild(shell);
    }
  },

  /* ─── PUBLIC: Generate Blob (for share) ──────────────────── */
  async generateBlob(doc) {
    const { shell, inner } = this._mount(this._buildHTML(doc));
    try {
      const canvas = await this._toCanvas(inner);
      return new Promise((resolve, reject) => {
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('Canvas empty')), 'image/png');
      });
    } finally {
      document.body.removeChild(shell);
    }
  },

  /* ─── PUBLIC: Print — simple raw HTML window (no canvas needed) ── */
  print(docId) {
    const doc = Storage.getDocumentById(docId);
    if (!doc) { Utils.showToast('Document not found.', 'error'); return; }

    const html = this._buildHTML(doc);
    const win  = window.open('', '_blank');
    if (!win) { Utils.showToast('Pop-ups blocked — please allow pop-ups and retry.', 'error'); return; }

    win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${doc.docNumber || 'Document'}</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 794px; background: #fff; font-family: 'Inter', Arial, sans-serif; }
    img  { display: block; max-width: 100%; }
    table { border-collapse: collapse; width: 100%; }
    @media print {
      @page { margin: 0; size: A4 portrait; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#fff;">
${html}
<script>
  window.onload = function() { setTimeout(function() { window.print(); }, 1200); };
<\/script>
</body>
</html>`);
    win.document.close();
  },
};

window.PDFExport = PDFExport;
