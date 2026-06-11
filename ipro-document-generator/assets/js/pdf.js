/**
 * I-Pro Solutions - PDF Export Module (v4)
 *
 * Fix: Use position:fixed + z-index:9999 (visible to compositor) with a
 *      dark loading overlay so the user doesn't see the raw document flash.
 *      This is the only approach that reliably captures base64 images
 *      (logo, signature, QR code) with html2canvas cross-browser.
 */

const PDFExport = {

  async download(docId) {
    const doc = Storage.getDocumentById(docId);
    if (!doc) { Utils.showToast('Document not found.', 'error'); return; }

    const settings = Storage.getSettings();
    const html     = Templates.generateDocumentHTML(doc);

    /* ── 1. Full-screen loading overlay (hides app while we render) ── */
    const overlay = document.createElement('div');
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'background:rgba(15,45,82,0.82)',
      'z-index:9998', 'display:flex', 'align-items:center',
      'justify-content:center', 'backdrop-filter:blur(4px)',
    ].join(';');
    overlay.innerHTML = `
      <div style="background:#fff;padding:28px 48px;border-radius:16px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
        <div style="font-size:28px;margin-bottom:12px;">📄</div>
        <div style="font-size:15px;font-weight:700;color:#0F2D52;">Generating PDF…</div>
        <div style="font-size:12px;color:#6B7280;margin-top:6px;">${doc.docNumber}</div>
      </div>`;
    document.body.appendChild(overlay);

    /* ── 2. Document container — position:fixed at (0,0) so compositor
            renders it; z-index above overlay means html2canvas sees it ── */
    const container = document.createElement('div');
    container.style.cssText = [
      'position:fixed', 'top:0', 'left:0',
      'width:794px',
      'background:#fff',
      'z-index:9999',          // above overlay → compositor renders it
      'pointer-events:none',
      'overflow:hidden',
    ].join(';');
    container.innerHTML = html;
    document.body.appendChild(container);

    /* ── 3. Wait for layout + all images (logo, QR, signature are base64) ── */
    await new Promise(r => setTimeout(r, 400));

    const imgs = Array.from(container.querySelectorAll('img'));
    if (imgs.length) {
      await Promise.all(imgs.map(img =>
        img.complete
          ? Promise.resolve()
          : new Promise(r => { img.onload = r; img.onerror = r; })
      ));
      // Extra tick for paint
      await new Promise(r => setTimeout(r, 150));
    }

    const options = {
      margin:   0,
      filename: `${doc.docNumber}.pdf`,
      image:    { type: 'jpeg', quality: 0.97 },
      html2canvas: {
        scale:           2,
        useCORS:         true,
        allowTaint:      true,
        backgroundColor: '#ffffff',
        logging:         false,
        width:           794,
        windowWidth:     794,
        scrollX:         0,
        scrollY:         0,
      },
      jsPDF: {
        unit:        'mm',
        format:      'a4',
        orientation: 'portrait',
        compress:    true,
      },
      pagebreak: { mode: ['css', 'legacy'], avoid: 'tr' },
    };

    try {
      await html2pdf().from(container).set(options).save();
      Utils.showToast(`✓ ${doc.docNumber}.pdf downloaded!`, 'success');
      Storage.logActivity(`PDF downloaded: ${doc.docNumber}`);
    } catch (err) {
      console.error('[PDF] html2pdf failed:', err);
      Utils.showToast('PDF failed — opening print dialog.', 'warning');
      this._printFallback(doc, html, settings);
    } finally {
      document.body.removeChild(container);
      document.body.removeChild(overlay);
    }
  },

  /* ── Wrap in a standalone HTML page (for print fallback) ─────────── */
  _wrapHTML(bodyHTML, settings, doc) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${doc.docNumber}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 794px; background: #fff; font-family: 'Inter', Arial, sans-serif; }
    @media print {
      @page { margin: 0; size: A4; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
    table { border-collapse: collapse; }
    img   { max-width: 100%; display: block; }
  </style>
</head>
<body style="margin:0;padding:0;background:#fff;">
${bodyHTML}
</body>
</html>`;
  },

  /* ── Print fallback ────────────────────────────────────────────────── */
  _printFallback(doc, html, settings) {
    const win = window.open('', '_blank', 'width=900,height=750');
    if (!win) { Utils.showToast('Pop-up blocked — allow pop-ups and retry.', 'error'); return; }
    win.document.write(this._wrapHTML(html, settings, doc));
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 1500);
  },

  /* ── Open print dialog ─────────────────────────────────────────────── */
  print(docId) {
    const doc = Storage.getDocumentById(docId);
    if (!doc) return;
    const settings = Storage.getSettings();
    const html     = Templates.generateDocumentHTML(doc);
    this._printFallback(doc, html, settings);
  },
};

window.PDFExport = PDFExport;
