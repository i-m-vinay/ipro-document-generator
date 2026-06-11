/**
 * I-Pro Solutions - Document Templates Module (v3)
 *
 * Changes:
 *  - QR code displayed bottom-right of document
 *  - Signature image replaces blank signature box
 *  - Electronic document note replaces manual signature section
 *  - Government Fee rows styled differently (no GST, blue label)
 *  - Blank signature box REMOVED
 */

const Templates = {

  generateDocumentHTML(doc) {
    const settings   = Storage.getSettings();
    const client     = Storage.getClientById(doc.clientId) || {};
    const logo       = Storage.getLogo();
    const signature  = Storage.getSignature();
    const qrCode     = Storage.getQRCode();
    const totals     = doc.totals || {};
    const gstMode    = doc.gstMode || 'intra';

    const docTypeLabels = {
      quotation: 'QUOTATION',
      proforma:  'PROFORMA INVOICE',
      invoice:   'TAX INVOICE',
    };
    const docLabel = docTypeLabels[doc.type] || 'DOCUMENT';

    const primary = settings.primaryColor || '#0F2D52';
    const accent  = settings.accentColor  || '#F97316';

    return `
    <div class="document-page" style="font-family:'Inter',Arial,sans-serif; color:#111827; background:#fff; padding:0; width:100%;">

      <!-- ── HEADER ──────────────────────────────────────────── -->
      <div style="background:${primary}; padding:26px 40px; display:flex; justify-content:space-between; align-items:flex-start;">
        <!-- Logo + Company -->
        <div style="display:flex; align-items:center; gap:16px;">
          ${logo
            ? `<img src="${logo}" alt="Logo" style="height:66px; width:auto; object-fit:contain; display:block;">`
            : `<div style="background:rgba(255,255,255,0.15); border-radius:12px; padding:10px 18px; font-size:26px; font-weight:900; color:#fff; letter-spacing:-0.5px;">i<span style="color:${accent}">P</span></div>`
          }
          <div>
            <div style="font-size:20px; font-weight:800; color:#fff; letter-spacing:-0.5px;">${settings.companyName}</div>
            <div style="font-size:10px; color:rgba(255,255,255,0.65); margin-top:3px; letter-spacing:0.8px; text-transform:uppercase;">${settings.tagline}</div>
          </div>
        </div>
        <!-- Contact block -->
        <div style="text-align:right; color:rgba(255,255,255,0.8); font-size:11px; line-height:1.75;">
          <div style="font-size:14px; font-weight:700; color:#fff; letter-spacing:2.5px; margin-bottom:8px;">${docLabel}</div>
          <div>${settings.address}</div>
          <div>${settings.email} | ${settings.phone}</div>
          ${settings.altPhone  ? `<div>${settings.altPhone}</div>`  : ''}
          ${settings.website   ? `<div>${settings.website}</div>`   : ''}
          ${settings.gstin     ? `<div style="margin-top:4px; font-weight:700; color:#fff; font-family:monospace; font-size:11px;">GSTIN: ${settings.gstin}</div>` : ''}
        </div>
      </div>

      <!-- ── DOCUMENT META STRIP ──────────────────────────────── -->
      <div style="background:${accent}; padding:11px 40px; display:flex; gap:40px; flex-wrap:wrap;">
        <div>
          <div style="font-size:8px; text-transform:uppercase; letter-spacing:1.2px; color:rgba(0,0,0,0.45); font-weight:700;">Document No.</div>
          <div style="font-size:14px; font-weight:900; color:#fff; letter-spacing:0.5px;">${doc.docNumber}</div>
        </div>
        <div>
          <div style="font-size:8px; text-transform:uppercase; letter-spacing:1.2px; color:rgba(0,0,0,0.45); font-weight:700;">Date</div>
          <div style="font-size:12px; font-weight:700; color:#fff;">${Utils.formatDate(doc.date)}</div>
        </div>
        ${doc.dueDate ? `<div>
          <div style="font-size:8px; text-transform:uppercase; letter-spacing:1.2px; color:rgba(0,0,0,0.45); font-weight:700;">${doc.type === 'quotation' ? 'Valid Until' : 'Due Date'}</div>
          <div style="font-size:12px; font-weight:700; color:#fff;">${Utils.formatDate(doc.dueDate)}</div>
        </div>` : ''}
        ${(doc.reference && doc.reference !== 'undefined' && doc.reference.trim()) ? `<div>
          <div style="font-size:8px; text-transform:uppercase; letter-spacing:1.2px; color:rgba(0,0,0,0.45); font-weight:700;">Ref / PO No.</div>
          <div style="font-size:12px; font-weight:700; color:#fff;">${doc.reference}</div>
        </div>` : ''}
      </div>

      <!-- ── BODY ────────────────────────────────────────────── -->
      <div style="padding:30px 40px;">

        <!-- Bill To + Remarks -->
        <div style="display:flex; gap:28px; margin-bottom:24px;">
          <div style="flex:1; padding:18px; background:#F8FAFC; border-radius:10px; border-left:4px solid ${primary};">
            <div style="font-size:8px; text-transform:uppercase; letter-spacing:1.5px; color:#6B7280; font-weight:700; margin-bottom:10px;">Bill To</div>
            <div style="font-size:14px; font-weight:700; color:${primary};">${client.name || '—'}</div>
            ${client.company ? `<div style="font-size:12px; color:#374151; margin-top:2px;">${client.company}</div>` : ''}
            ${client.address ? `<div style="font-size:11px; color:#6B7280; margin-top:6px; line-height:1.5;">${client.address}</div>` : ''}
            ${client.gstin   ? `<div style="font-size:11px; font-weight:600; color:#374151; margin-top:6px; font-family:monospace;">GSTIN: ${client.gstin}</div>` : ''}
            ${client.email   ? `<div style="font-size:11px; color:#6B7280; margin-top:4px;">${client.email}</div>` : ''}
            ${client.phone   ? `<div style="font-size:11px; color:#6B7280;">${client.phone}</div>` : ''}
          </div>
          ${doc.remarks ? `<div style="flex:1; padding:18px; background:#F8FAFC; border-radius:10px; border-left:4px solid ${accent};">
            <div style="font-size:8px; text-transform:uppercase; letter-spacing:1.5px; color:#6B7280; font-weight:700; margin-bottom:10px;">Subject / Remarks</div>
            <div style="font-size:13px; color:#374151; line-height:1.6;">${doc.remarks}</div>
          </div>` : ''}
        </div>

        <!-- ── SERVICE TABLE ──────────────────────────────────── -->
        <table style="width:100%; border-collapse:collapse; margin-bottom:24px; font-size:12px;">
          <thead>
            <tr style="background:${primary};">
              <th style="padding:10px 12px; text-align:left;   color:#fff; font-weight:700; font-size:10px; text-transform:uppercase; letter-spacing:0.8px;">#</th>
              <th style="padding:10px 12px; text-align:left;   color:#fff; font-weight:700; font-size:10px; text-transform:uppercase; letter-spacing:0.8px;">Service / Description</th>
              <th style="padding:10px 12px; text-align:center; color:#fff; font-weight:700; font-size:10px; text-transform:uppercase; letter-spacing:0.8px;">Qty</th>
              <th style="padding:10px 12px; text-align:right;  color:#fff; font-weight:700; font-size:10px; text-transform:uppercase; letter-spacing:0.8px;">Rate</th>
              <th style="padding:10px 12px; text-align:right;  color:#fff; font-weight:700; font-size:10px; text-transform:uppercase; letter-spacing:0.8px;">Amount</th>
              <th style="padding:10px 12px; text-align:center; color:#fff; font-weight:700; font-size:10px; text-transform:uppercase; letter-spacing:0.8px;">GST %</th>
              <th style="padding:10px 12px; text-align:right;  color:#fff; font-weight:700; font-size:10px; text-transform:uppercase; letter-spacing:0.8px;">Tax Amt</th>
              ${(doc.lineItems||[]).some(i => (i.govtFee||0) > 0)
                ? `<th style="padding:10px 12px; text-align:right; color:#93C5FD; font-weight:700; font-size:10px; text-transform:uppercase; letter-spacing:0.8px; border-left:1px solid rgba(255,255,255,0.2);">Govt Fee</th>`
                : ''}
              <th style="padding:10px 12px; text-align:right;  color:#fff; font-weight:700; font-size:10px; text-transform:uppercase; letter-spacing:0.8px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${(doc.lineItems || []).map((item, i) => {
              const isGovFee   = item.rowType === 'govfee';
              const hasAnyGovt = (doc.lineItems || []).some(li => (li.govtFee || 0) > 0);
              const base       = (item.qty || 0) * (item.rate || 0);
              const taxAmt     = isGovFee ? 0 : base * (item.taxRate || 0) / 100;
              const govtFee    = item.govtFee || 0;
              const rowTotal   = base + taxAmt + govtFee;
              const rowBg      = i % 2 === 0 ? '#fff' : '#F8FAFC';
              return `
              <tr style="background:${rowBg}; border-bottom:1px solid #E5E7EB;">
                <td style="padding:10px 12px; color:#6B7280; font-weight:600;">${i + 1}</td>
                <td style="padding:10px 12px;">
                  <div style="font-weight:600; color:#111827;">${item.name || ''}</div>
                  ${item.description ? `<div style="font-size:10px; color:#6B7280; margin-top:2px; line-height:1.4;">${item.description}</div>` : ''}
                </td>
                <td style="padding:10px 12px; text-align:center; color:#374151;">${item.qty}</td>
                <td style="padding:10px 12px; text-align:right; font-family:monospace; color:#374151;">${Utils.formatCurrency(item.rate)}</td>
                <td style="padding:10px 12px; text-align:right; font-family:monospace; color:#374151;">${Utils.formatCurrency(base)}</td>
                <td style="padding:10px 12px; text-align:center; color:#374151;">${isGovFee ? '—' : item.taxRate + '%'}</td>
                <td style="padding:10px 12px; text-align:right; font-family:monospace; color:#374151;">${isGovFee ? '—' : Utils.formatCurrency(taxAmt)}</td>
                ${hasAnyGovt
                  ? `<td style="padding:10px 12px; text-align:right; font-family:monospace; color:${govtFee > 0 ? '#1D4ED8' : '#9CA3AF'}; border-left:1px solid #E5E7EB; font-weight:${govtFee > 0 ? '700' : '400'};">${
                    govtFee > 0 ? Utils.formatCurrency(govtFee) : '—'
                  }</td>`
                  : ''}
                <td style="padding:10px 12px; text-align:right; font-family:monospace; font-weight:700; color:${primary};">${Utils.formatCurrency(rowTotal)}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>

        <!-- ── TOTALS + BANK DETAILS ──────────────────────────── -->
        <div style="display:flex; gap:28px; margin-bottom:24px; align-items:flex-start;">

          <!-- Bank Details (Tax Invoice only) -->
          <div style="flex:1;">
            ${doc.type === 'invoice' ? `
            <div style="background:#F8FAFC; border-radius:10px; padding:16px; font-size:11px; color:#374151; line-height:1.85; border:1px solid #E5E7EB; margin-bottom:12px;">
              <div style="font-weight:700; color:${primary}; font-size:11px; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.8px;">Bank Details</div>
              <div><span style="color:#6B7280; width:110px; display:inline-block;">Bank Name:</span>${settings.bankName}</div>
              <div><span style="color:#6B7280; width:110px; display:inline-block;">Account Name:</span>${settings.bankAccountName}</div>
              <div><span style="color:#6B7280; width:110px; display:inline-block;">Account No.:</span><strong style="font-family:monospace;">${settings.bankAccount}</strong></div>
              <div><span style="color:#6B7280; width:110px; display:inline-block;">IFSC Code:</span><strong style="font-family:monospace;">${settings.bankIfsc}</strong></div>
              <div><span style="color:#6B7280; width:110px; display:inline-block;">Branch:</span>${settings.bankBranch}</div>
            </div>` : ''}

            <!-- QR Code (shown if uploaded) -->
            ${qrCode ? `
            <div style="display:inline-block; padding:10px; border:1px solid #E5E7EB; border-radius:10px; background:#fff; text-align:center;">
              <img src="${qrCode}" alt="QR Code" style="width:96px; height:96px; object-fit:contain; display:block;">
              <div style="font-size:9px; color:#6B7280; margin-top:6px; letter-spacing:0.5px;">Scan to Pay / Verify</div>
            </div>` : ''}
          </div>

          <!-- Totals table -->
          <div style="width:290px; flex-shrink:0;">
            <table style="width:100%; font-size:12px; border-collapse:collapse;">
              <tr><td style="padding:6px 12px; color:#6B7280;">Prof. Fees Subtotal</td><td style="padding:6px 12px; text-align:right; font-family:monospace;">${Utils.formatCurrency(totals.subtotal || 0)}</td></tr>
              ${(totals.govtFeesTotal || 0) > 0
                ? `<tr><td style="padding:6px 12px; color:#1D4ED8; font-weight:600;">🏛 Govt Fees</td><td style="padding:6px 12px; text-align:right; font-family:monospace; color:#1D4ED8; font-weight:700;">${Utils.formatCurrency(totals.govtFeesTotal)}</td></tr>`
                : ''}
              ${this.renderTaxLines(totals, gstMode)}
              <tr><td style="padding:6px 12px; color:#6B7280;">Round Off</td><td style="padding:6px 12px; text-align:right; font-family:monospace;">${Utils.formatCurrency(totals.roundOff || 0)}</td></tr>
              <tr style="background:${primary};">
                <td style="padding:10px 12px; font-weight:800; font-size:14px; color:#fff;">Grand Total</td>
                <td style="padding:10px 12px; text-align:right; font-family:monospace; font-weight:800; font-size:16px; color:#fff;">${Utils.formatCurrency(totals.grandTotal || 0)}</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- ── AMOUNT IN WORDS ────────────────────────────────── -->
        <div style="background:linear-gradient(135deg,${primary}12 0%,${accent}12 100%); border:1px solid ${primary}25; border-radius:10px; padding:13px 20px; margin-bottom:22px;">
          <span style="font-size:9px; text-transform:uppercase; letter-spacing:1.5px; color:#6B7280; font-weight:700;">Amount in Words: </span>
          <span style="font-size:13px; font-weight:600; color:${primary};">${Utils.numberToWords(totals.grandTotal || 0)}</span>
        </div>

        <!-- ── TERMS ──────────────────────────────────────────── -->
        ${doc.terms ? `
        <div style="margin-bottom:22px;">
          <div style="font-size:9px; text-transform:uppercase; letter-spacing:1.5px; color:#6B7280; font-weight:700; margin-bottom:8px;">Terms &amp; Conditions</div>
          <div style="font-size:11px; color:#6B7280; line-height:1.75;">${doc.terms}</div>
        </div>` : ''}

        <!-- ── SIGNATURE SECTION ──────────────────────────────── -->
        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:24px; padding-top:20px; border-top:1px solid #E5E7EB;">

          <!-- Electronic note (left side) -->
          <div style="max-width:340px;">
            <div style="padding:10px 14px; background:#F0FDF4; border:1px solid #BBF7D0; border-radius:8px; display:flex; align-items:flex-start; gap:8px;">
              <span style="font-size:14px; flex-shrink:0;">✅</span>
              <div style="font-size:10px; color:#166534; line-height:1.6;">
                <strong>Electronically Generated Document</strong><br>
                This is a computer-generated document and is valid without a physical signature. Authenticated by ${settings.companyName}.
              </div>
            </div>
          </div>

          <!-- Signature block (right side) -->
          <div style="text-align:center; min-width:180px;">
            ${signature
              ? `<img src="${signature}" alt="Authorised Signature" style="height:60px; max-width:180px; object-fit:contain; display:block; margin:0 auto 8px;">`
              : `<div style="height:48px;"></div>`
            }
            <div style="border-top:1.5px solid ${primary}; padding-top:8px; margin-top:4px;">
              <div style="font-size:12px; font-weight:700; color:${primary};">${settings.companyName}</div>
              <div style="font-size:11px; color:#6B7280; margin-top:2px;">Authorised Signatory</div>
              <div style="font-size:11px; color:#374151; font-weight:600; margin-top:1px;">${settings.signatory || ''}</div>
              <div style="font-size:10px; color:#6B7280;">${settings.designation || ''}</div>
            </div>
          </div>
        </div>

      </div><!-- /body -->

      <!-- ── FOOTER ─────────────────────────────────────────── -->
      <div style="background:${primary}; padding:13px 40px; display:flex; justify-content:space-between; align-items:center;">
        <div style="font-size:10px; color:rgba(255,255,255,0.65);">${settings.footerText || ''}</div>
        <div style="font-size:10px; color:rgba(255,255,255,0.4);">${doc.docNumber} | Generated by I-Pro Solutions</div>
      </div>

    </div>
    `;
  },

  renderTaxLines(totals, gstMode) {
    if (!totals.taxGroups) {
      return `<tr><td style="padding:6px 12px; color:#6B7280;">Tax</td><td style="padding:6px 12px; text-align:right; font-family:monospace;">${Utils.formatCurrency(totals.taxAmount || 0)}</td></tr>`;
    }
    let html = '';
    Object.entries(totals.taxGroups).forEach(([rate, g]) => {
      if (parseFloat(rate) === 0 || g.tax === 0) return;
      if (gstMode === 'intra') {
        html += `<tr><td style="padding:6px 12px; color:#6B7280;">CGST @ ${parseFloat(rate)/2}%</td><td style="padding:6px 12px; text-align:right; font-family:monospace;">${Utils.formatCurrency(g.tax/2)}</td></tr>`;
        html += `<tr><td style="padding:6px 12px; color:#6B7280;">SGST @ ${parseFloat(rate)/2}%</td><td style="padding:6px 12px; text-align:right; font-family:monospace;">${Utils.formatCurrency(g.tax/2)}</td></tr>`;
      } else {
        html += `<tr><td style="padding:6px 12px; color:#6B7280;">IGST @ ${rate}%</td><td style="padding:6px 12px; text-align:right; font-family:monospace;">${Utils.formatCurrency(g.tax)}</td></tr>`;
      }
    });
    return html;
  },
};

window.Templates = Templates;
