/**
 * I-Pro Solutions — PDF Export v3.7
 * Fixes:
 *  - QR code / logo never blank: pre-renders images into hidden real DOM element
 *  - PDF never splits header, table rows, totals block, or signature mid-block
 *  - Print opens proper document (not the whole UI page)
 *  - Reference No. always equals Document No.
 */

const PDFExport = {

  /* ─── Shared: build the render-ready element ──────────────────────── */
  async _buildElement(doc) {
    let html = Templates.generateDocumentHTML(doc);

    // Embed base64 images (already inline — these replace placeholder text tokens if any)
    const logo = Storage.getLogo();
    const sig  = Storage.getSignature();
    const qr   = Storage.getQRCode();
    if (logo && html.includes('ipro_logo_placeholder')) html = html.replace(/ipro_logo_placeholder/g, logo);
    if (sig  && html.includes('ipro_signature_placeholder')) html = html.replace(/ipro_signature_placeholder/g, sig);
    if (qr   && html.includes('ipro_qr_placeholder')) html = html.replace(/ipro_qr_placeholder/g, qr);

    // CSS injected into the element that prevents blocks from being split across pages
    const pageBreakCSS = `
      <style>
        * { box-sizing: border-box; }
        table { border-collapse: collapse; }
        img { display: block; max-width: 100%; }
        /* Prevent page-breaks inside key blocks */
        tr, .document-page > div, thead, tfoot,
        table thead tr, tbody tr {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        /* Keep the totals + bank details block together */
        [data-pdf-block] {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
      </style>
    `;

    // Wrap in a fixed-width container with the CSS
    // Attach to real DOM at top-left (invisible) — html2canvas requires the element
    // to be INSIDE the viewport to capture it correctly. visibility:hidden hides it from the user.
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'width:794px; position:fixed; top:0; left:0; visibility:hidden; pointer-events:none; z-index:-9999;';
    wrapper.innerHTML = pageBreakCSS + html;

    // Attach to real DOM — this is the key step that makes browsers decode images
    document.body.appendChild(wrapper);

    // Wait for ALL images to fully load and decode
    const images = Array.from(wrapper.querySelectorAll('img'));
    await Promise.all(images.map(img => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise(resolve => {
        img.onload  = resolve;
        img.onerror = resolve;
        // Force reload so browser definitely fires onload
        const src = img.src;
        img.src = '';
        img.src = src;
      });
    }));

    // One more repaint tick to let the browser flush
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    return wrapper;
  },

  /* ─── PUBLIC: download ─────────────────────────────────────────── */
  async download(docId) {
    const doc = Storage.getDocumentById(docId);
    if (!doc) { Utils.showToast('Document not found.', 'error'); return; }

    window.scrollTo(0, 0);
    Utils.showToast('Generating PDF, please wait...', 'info');

    let wrapper = null;
    try {
      wrapper = await this._buildElement(doc);

      const options = {
        margin:      0,
        filename:    `${doc.docNumber}.pdf`,
        image:       { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false, allowTaint: true },
        jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true }
      };

      const pdfPromise = html2pdf().from(wrapper).set(options).save();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('PDF generation timed out')), 15000)
      );

      await Promise.race([pdfPromise, timeoutPromise]);
      Utils.showToast(`✓ ${doc.docNumber}.pdf downloaded!`, 'success');
      Storage.logActivity?.(`PDF downloaded: ${doc.docNumber}`);
    } catch (err) {
      console.error('[PDF] generation failed:', err);
      Utils.showToast('PDF failed — opening print dialog instead.', 'warning');
      this._printFallback(doc);
    } finally {
      if (wrapper && document.body.contains(wrapper)) {
        document.body.removeChild(wrapper);
      }
    }
  },

  /* ─── PUBLIC: generate blob for sharing ───────────────────────── */
  async generateBlob(doc) {
    let wrapper = null;
    try {
      wrapper = await this._buildElement(doc);

      const options = {
        margin:      0,
        filename:    `${doc.docNumber}.pdf`,
        image:       { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false, allowTaint: true },
        jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true }
      };

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('PDF generation timed out')), 15000)
      );

      const blob = await Promise.race([
        html2pdf().from(wrapper).set(options).outputPdf('blob'),
        timeoutPromise
      ]);
      return blob;
    } finally {
      if (wrapper && document.body.contains(wrapper)) {
        document.body.removeChild(wrapper);
      }
    }
  },

  /* ─── Print fallback / direct print ────────────────────────────── */
  _printFallback(doc) {
    let html = Templates.generateDocumentHTML(doc);
    const logo = Storage.getLogo();
    const sig  = Storage.getSignature();
    const qr   = Storage.getQRCode();
    if (logo && html.includes('ipro_logo_placeholder')) html = html.replace(/ipro_logo_placeholder/g, logo);
    if (sig  && html.includes('ipro_signature_placeholder')) html = html.replace(/ipro_signature_placeholder/g, sig);
    if (qr   && html.includes('ipro_qr_placeholder')) html = html.replace(/ipro_qr_placeholder/g, qr);

    const win = window.open('', '_blank', 'width=900,height=750');
    if (!win) { Utils.showToast('Pop-ups blocked — allow pop-ups and retry.', 'error'); return; }
    win.document.write(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<title>${doc.docNumber}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body{width:794px;background:#fff;font-family:'Inter',Arial,sans-serif}
  @media print{
    @page{margin:0;size:A4}
    *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
    tr, thead, tbody tr, table, .document-page > div {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
  }
  table{border-collapse:collapse}img{max-width:100%;display:block}
</style></head><body style="margin:0;padding:0;background:#fff;">
${html}</body></html>`);
    win.document.close();
    win.focus();
    // 2.5s gives Google Fonts + base64 images time to decode before the print dialog opens
    setTimeout(() => { try { win.print(); } catch(e) {} }, 2500);
  },

  /* ─── Open print dialog directly ───────────────────────────────── */
  print(docId) {
    const doc = Storage.getDocumentById(docId);
    if (!doc) { Utils.showToast('Document not found.', 'error'); return; }
    this._printFallback(doc);
  },
};

window.PDFExport = PDFExport;
