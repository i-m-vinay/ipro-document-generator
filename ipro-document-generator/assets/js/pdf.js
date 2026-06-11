/**
 * I-Pro Solutions — PDF Export v3.0
 * Fixed blank PDF generation issue
 */

const PDFExport = {

  /* ─── PUBLIC: download ─────────────────────────────────────────── */
  async download(docId) {
    const doc = Storage.getDocumentById(docId);
    if (!doc) { Utils.showToast('Document not found.', 'error'); return; }

    /* 1 ─ Overlay to hide the app while we render */
    const overlay = document.createElement('div');
    overlay.style.cssText = [
      'position:fixed','inset:0','background:rgba(15,45,82,0.85)',
      'z-index:9998','display:flex','align-items:center',
      'justify-content:center','backdrop-filter:blur(4px)',
    ].join(';');
    overlay.innerHTML = `
      <div style="background:#fff;padding:28px 48px;border-radius:16px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.35);">
        <div style="font-size:32px;margin-bottom:12px;">📄</div>
        <div style="font-size:15px;font-weight:700;color:#0F2D52;">Generating PDF…</div>
        <div style="font-size:12px;color:#6B7280;margin-top:6px;">${doc.docNumber}</div>
      </div>`;
    document.body.appendChild(overlay);

    /* 2 ─ Generate template HTML */
    let html = Templates.generateDocumentHTML(doc);

    /* 3 ─ Force-inline base64 assets to avoid blank image gaps */
    const logo = Storage.getLogo();
    const sig  = Storage.getSignature();
    const qr   = Storage.getQRCode();

    if (logo && html.includes('ipro_logo_placeholder')) html = html.replace(/ipro_logo_placeholder/g, logo);
    if (sig && html.includes('ipro_signature_placeholder')) html = html.replace(/ipro_signature_placeholder/g, sig);
    if (qr && html.includes('ipro_qr_placeholder')) html = html.replace(/ipro_qr_placeholder/g, qr);

    /* 4 ─ Mount securely for html2canvas (no display:none, opacity 0.001) */
    const container = document.createElement('div');
    container.style.cssText = [
      'position:absolute', 'top:0', 'left:0',
      'width:794px', 'background:#fff',
      'z-index:-100', 'opacity:0.001'
    ].join(';');
    container.innerHTML = html;
    document.body.appendChild(container);

    /* 5 ─ Wait for layout + all images to fully paint */
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    await new Promise(r => setTimeout(r, 500));

    // Extra: wait for any <img> tags that might still be loading
    const imgs = Array.from(container.querySelectorAll('img'));
    if (imgs.length) {
      await Promise.all(imgs.map(img =>
        img.complete ? Promise.resolve()
          : new Promise(r => { img.onload = r; img.onerror = r; })
      ));
      await new Promise(r => setTimeout(r, 200));
    }

    /* 6 ─ html2pdf options */
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
        onclone: (clonedDoc) => {
          // Ensure cloned images have the same src
          const clonedImgs = clonedDoc.querySelectorAll('img');
          const origImgs   = container.querySelectorAll('img');
          clonedImgs.forEach((ci, i) => {
            if (origImgs[i]) ci.src = origImgs[i].src;
          });
        },
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
      Storage.logActivity?.(`PDF downloaded: ${doc.docNumber}`);
    } catch (err) {
      console.error('[PDF] generation failed:', err);
      Utils.showToast('PDF failed — opening print dialog.', 'warning');
      this._printFallback(doc, html);
    } finally {
      document.body.removeChild(container);
      document.body.removeChild(overlay);
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
