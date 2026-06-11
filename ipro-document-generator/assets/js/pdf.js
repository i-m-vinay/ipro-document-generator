/**
 * I-Pro Solutions — PDF Export v3.9
 *
 * Strategy that actually works in all browsers:
 *  1. Build full document HTML string with images embedded as base64
 *  2. Create an inner content div (NOT fixed/absolute — just a plain div)
 *  3. Wrap it in a hidden overlay div briefly attached to document.body
 *  4. Wait for images to decode
 *  5. Pass the INNER content div (not the wrapper) to html2pdf — this is the key
 *  6. Clean up
 */

const PDFExport = {

  /* ─── Build full HTML string with images embedded ──────────────── */
  _buildHTML(doc) {
    let html = Templates.generateDocumentHTML(doc);
    const logo = Storage.getLogo();
    const sig  = Storage.getSignature();
    const qr   = Storage.getQRCode();
    if (logo && html.includes('ipro_logo_placeholder')) html = html.replace(/ipro_logo_placeholder/g, logo);
    if (sig  && html.includes('ipro_signature_placeholder')) html = html.replace(/ipro_signature_placeholder/g, sig);
    if (qr   && html.includes('ipro_qr_placeholder')) html = html.replace(/ipro_qr_placeholder/g, qr);
    return html;
  },

  /* ─── Attach element to DOM so images decode, then detach ──────── */
  async _waitForImages(element) {
    const images = Array.from(element.querySelectorAll('img'));
    await Promise.all(images.map(img => new Promise(resolve => {
      if (img.complete && img.naturalWidth > 0) { resolve(); return; }
      img.onload = img.onerror = resolve;
    })));
    // Two animation frames so browser flushes paint
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  },

  /* ─── PDF options ────────────────────────────────────────────── */
  _opts(filename) {
    return {
      margin:      0,
      filename,
      image:       { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale:       2,
        useCORS:     true,
        logging:     false,
        // Tell html2canvas the full document width so it doesn't crop
        windowWidth: 794,
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
    };
  },

  /* ─── PUBLIC: Download PDF ───────────────────────────────────── */
  async download(docId) {
    const doc = Storage.getDocumentById(docId);
    if (!doc) { Utils.showToast('Document not found.', 'error'); return; }

    Utils.showToast('Generating PDF…', 'info');
    window.scrollTo(0, 0);

    // Create a simple hidden container
    const container = document.createElement('div');
    container.style.cssText = [
      'position:absolute',
      'top:0',
      'left:0',
      'width:794px',
      'overflow:hidden',
      'height:0',         // Zero height — hides it without clipping the content
      'visibility:hidden',
      'pointer-events:none',
      'z-index:-1',
    ].join(';');

    // The actual content element passed to html2pdf
    const content = document.createElement('div');
    content.style.width = '794px';
    content.innerHTML = this._buildHTML(doc);

    container.appendChild(content);
    document.body.appendChild(container);

    try {
      await this._waitForImages(content);

      await Promise.race([
        html2pdf().from(content).set(this._opts(`${doc.docNumber}.pdf`)).save(),
        new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 20000)),
      ]);

      Utils.showToast(`✓ ${doc.docNumber}.pdf downloaded!`, 'success');
    } catch (err) {
      console.error('[PDF] failed:', err);
      Utils.showToast('PDF failed — opening print dialog.', 'warning');
      this._openPrintWindow(doc);
    } finally {
      document.body.removeChild(container);
    }
  },

  /* ─── PUBLIC: Generate Blob (for sharing) ───────────────────── */
  async generateBlob(doc) {
    const container = document.createElement('div');
    container.style.cssText = [
      'position:absolute', 'top:0', 'left:0',
      'width:794px', 'overflow:hidden', 'height:0',
      'visibility:hidden', 'pointer-events:none', 'z-index:-1',
    ].join(';');

    const content = document.createElement('div');
    content.style.width = '794px';
    content.innerHTML = this._buildHTML(doc);

    container.appendChild(content);
    document.body.appendChild(container);

    try {
      await this._waitForImages(content);
      return await Promise.race([
        html2pdf().from(content).set(this._opts(`${doc.docNumber}.pdf`)).outputPdf('blob'),
        new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 20000)),
      ]);
    } finally {
      document.body.removeChild(container);
    }
  },

  /* ─── PUBLIC: Print ──────────────────────────────────────────── */
  print(docId) {
    const doc = Storage.getDocumentById(docId);
    if (!doc) { Utils.showToast('Document not found.', 'error'); return; }
    this._openPrintWindow(doc);
  },

  /* ─── Internal: open a clean print window ────────────────────── */
  _openPrintWindow(doc) {
    const html = this._buildHTML(doc);
    const win = window.open('', '_blank');
    if (!win) { Utils.showToast('Pop-ups are blocked — please allow and retry.', 'error'); return; }

    win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${doc.docNumber || 'Document'}</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 794px; background: #fff; font-family: 'Inter', Arial, sans-serif; }
    img { display: block; max-width: 100%; }
    table { border-collapse: collapse; width: 100%; }
    @media print {
      @page { margin: 0; size: A4; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      tr, thead, tfoot, .document-page > div {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#fff;">
${html}
<script>
  // Wait for all images and fonts to load, then print
  window.addEventListener('load', function() {
    setTimeout(function() { window.print(); }, 1000);
  });
  // Fallback in case load already fired
  setTimeout(function() { window.print(); }, 3000);
<\/script>
</body>
</html>`);
    win.document.close();
  },
};

window.PDFExport = PDFExport;
