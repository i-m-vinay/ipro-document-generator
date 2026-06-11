/**
 * I-Pro Solutions — PDF Export v3.1
 * Bulletproof PDF generation
 */

const PDFExport = {

  /* ─── PUBLIC: download ─────────────────────────────────────────── */
  async download(docId) {
    const doc = Storage.getDocumentById(docId);
    if (!doc) { Utils.showToast('Document not found.', 'error'); return; }

    // 1. Scroll to top to prevent html2canvas cropping issues
    const originalScroll = window.scrollY;
    window.scrollTo(0, 0);

    // 2. Solid, completely opaque overlay to hide the render process
    const overlay = document.createElement('div');
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'background:#ffffff',
      'z-index:9998', 'display:flex', 'align-items:center',
      'justify-content:center'
    ].join(';');
    overlay.innerHTML = `
      <div style="text-align:center;">
        <div style="font-size:40px;margin-bottom:16px;animation:pulse 1.5s infinite;">📄</div>
        <div style="font-size:18px;font-weight:700;color:#0F2D52;">Generating PDF…</div>
        <div style="font-size:13px;color:#6B7280;margin-top:6px;">${doc.docNumber}</div>
        <div style="font-size:11px;color:#9CA3AF;margin-top:12px;">Please wait, processing layout...</div>
      </div>`;
    document.body.appendChild(overlay);

    /* 3 ─ Generate template HTML and embed base64 images */
    let html = Templates.generateDocumentHTML(doc);
    const logo = Storage.getLogo();
    const sig  = Storage.getSignature();
    const qr   = Storage.getQRCode();

    if (logo && html.includes('ipro_logo_placeholder')) html = html.replace(/ipro_logo_placeholder/g, logo);
    if (sig && html.includes('ipro_signature_placeholder')) html = html.replace(/ipro_signature_placeholder/g, sig);
    if (qr && html.includes('ipro_qr_placeholder')) html = html.replace(/ipro_qr_placeholder/g, qr);

    /* 4 ─ Mount IN PLAIN SIGHT but perfectly hidden behind the opaque overlay */
    // Opacity is exactly 1, display is block. The browser engine MUST render this!
    const container = document.createElement('div');
    container.style.cssText = [
      'position:absolute', 'top:0', 'left:0',
      'width:794px', 'background:#fff',
      'z-index:1', 'opacity:1', 'display:block'
    ].join(';');
    container.innerHTML = html;
    document.body.appendChild(container);

    /* 5 ─ Wait heavily for DOM layout, painting, and image decoding */
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    await new Promise(r => setTimeout(r, 600)); // Crucial delay for webfonts and styles to apply

    const options = {
      margin:      0,
      filename:    `${doc.docNumber}.pdf`,
      image:       { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale:           2,
        useCORS:         true,
        logging:         false,
        letterRendering: true,
        windowWidth:     794,
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
      // Race condition: if html2pdf hangs for more than 10 seconds, throw an error to trigger fallback
      const pdfPromise = html2pdf().from(container).set(options).save();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("PDF generation timed out")), 10000)
      );

      await Promise.race([pdfPromise, timeoutPromise]);

      Utils.showToast(`✓ ${doc.docNumber}.pdf downloaded!`, 'success');
      Storage.logActivity?.(`PDF downloaded: ${doc.docNumber}`);
    } catch (err) {
      console.error('[PDF] generation failed:', err);
      Utils.showToast('PDF failed — opening print dialog.', 'warning');
      this._printFallback(doc, html);
    } finally {
      if (document.body.contains(container)) document.body.removeChild(container);
      if (document.body.contains(overlay)) document.body.removeChild(overlay);
      window.scrollTo(0, originalScroll);
    }
  },

  /* ─── Print fallback ───────────────────────────────────────────── */
  _printFallback(doc, html) {
    const win = window.open('', '_blank', 'width=900,height=750');
    if (!win) { Utils.showToast('Pop-ups blocked — allow and retry.', 'error'); return; }
    win.document.write(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<title>${doc.docNumber}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body{width:794px;background:#fff;font-family:'Inter',Arial,sans-serif}
  @media print{@page{margin:0;size:A4}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}}
  table{border-collapse:collapse}img{max-width:100%;display:block}
</style></head><body style="margin:0;padding:0;background:#fff;">
${html}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 1500);
  },

  /* ─── Open print dialog directly ──────────────────────────────── */
  print(docId) {
    const doc = Storage.getDocumentById(docId);
    if (!doc) return;
    this._printFallback(doc, Templates.generateDocumentHTML(doc));
  },
};

window.PDFExport = PDFExport;
