/**
 * I-Pro Solutions — Image Export v4.0
 * Exports documents as high-resolution PNG images using html2canvas.
 * No more PDF — images work perfectly on WhatsApp, Email, and Print.
 */

const PDFExport = {

  /* ─── Build the full HTML string with embedded base64 images ── */
  _buildHTML(doc) {
    let html = Templates.generateDocumentHTML(doc);
    const logo = Storage.getLogo();
    const sig  = Storage.getSignature();
    const qr   = Storage.getQRCode();
    if (logo && html.includes('ipro_logo_placeholder')) html = html.replace(/ipro_logo_placeholder/g, logo);
    if (sig  && html.includes('ipro_signature_placeholder')) html = html.replace(/ipro_signature_placeholder/g, sig);
    if (qr   && html.includes('ipro_qr_placeholder'))   html = html.replace(/ipro_qr_placeholder/g, qr);
    return html;
  },

  /* ─── Attach content to DOM (needed for html2canvas) ──────── */
  _mount(html) {
    // Outer shell: zero height so nothing is visible to the user
    const shell = document.createElement('div');
    shell.style.cssText = [
      'position:absolute', 'top:0', 'left:0',
      'width:794px', 'height:0', 'overflow:visible',
      'visibility:hidden', 'pointer-events:none', 'z-index:-1',
    ].join(';');

    const inner = document.createElement('div');
    inner.style.cssText = 'width:794px; font-family:Inter,Arial,sans-serif; background:#fff;';
    inner.innerHTML = html;

    shell.appendChild(inner);
    document.body.appendChild(shell);
    return { shell, inner };
  },

  /* ─── Wait for all <img> tags to finish loading ───────────── */
  async _waitForImages(el) {
    const imgs = Array.from(el.querySelectorAll('img'));
    await Promise.all(imgs.map(img => new Promise(resolve => {
      if (img.complete && img.naturalWidth > 0) return resolve();
      img.onload = img.onerror = resolve;
    })));
    // Two animation frames to let the browser repaint
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  },

  /* ─── Core: render element → canvas ──────────────────────── */
  async _toCanvas(inner) {
    await this._waitForImages(inner);
    return html2canvas(inner, {
      scale:       2,           // 2× = high resolution (good for printing and sharing)
      useCORS:     true,
      logging:     false,
      width:       794,
      height:      inner.scrollHeight,
      windowWidth: 794,
      backgroundColor: '#ffffff',
    });
  },

  /* ─── PUBLIC: Download PNG ─────────────────────────────────── */
  async download(docId) {
    const doc = Storage.getDocumentById(docId);
    if (!doc) { Utils.showToast('Document not found.', 'error'); return; }

    Utils.showToast('Generating image…', 'info');
    window.scrollTo(0, 0);

    const { shell, inner } = this._mount(this._buildHTML(doc));
    try {
      const canvas = await this._toCanvas(inner);
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

  /* ─── PUBLIC: Generate Blob (for WhatsApp / Email share) ───── */
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

  /* ─── PUBLIC: Print ───────────────────────────────────────── */
  print(docId) {
    const doc = Storage.getDocumentById(docId);
    if (!doc) { Utils.showToast('Document not found.', 'error'); return; }

    Utils.showToast('Preparing print…', 'info');
    const { shell, inner } = this._mount(this._buildHTML(doc));

    this._toCanvas(inner).then(canvas => {
      document.body.removeChild(shell);
      const imgURL = canvas.toDataURL('image/png');
      const win = window.open('', '_blank');
      if (!win) { Utils.showToast('Pop-ups blocked — allow and retry.', 'error'); return; }
      win.document.write(`<!DOCTYPE html>
<html><head>
  <title>${doc.docNumber || 'Document'}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:#fff; }
    img  { display:block; max-width:100%; height:auto; }
    @media print {
      @page { margin:0; size:A4 portrait; }
      body  { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    }
  </style>
</head>
<body>
  <img src="${imgURL}" alt="${doc.docNumber}">
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 800);
    };
  <\/script>
</body></html>`);
      win.document.close();
    }).catch(err => {
      document.body.removeChild(shell);
      console.error('[Print] failed:', err);
      Utils.showToast('Print failed.', 'error');
    });
  },
};

window.PDFExport = PDFExport;
