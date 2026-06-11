/**
 * I-Pro Solutions - Settings Module v3.0
 * Brand settings, logo/signature/QR upload, full backup export/import
 * Fixes: clearAllData now wipes ALL keys including signature and QR code
 */

const Settings = {
  render() {
    const settings = Storage.getSettings();
    const logo = Storage.getLogo();
    const container = Utils.el('settings-view');
    if (!container) return;

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Settings</h1>
          <p class="page-subtitle">Configure brand, company info, and integrations</p>
        </div>
        <button onclick="Settings.save()" class="btn btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
          Save Settings
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- LOGO UPLOAD -->
        <div class="card lg:col-span-2">
          <h2 class="card-title mb-4">Brand Assets</h2>
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px,1fr)); gap:24px;">

            <!-- Logo -->
            <div style="padding:18px; background:#F8FAFC; border-radius:12px; border:1.5px solid #E5E7EB;">
              <div style="font-weight:700; font-size:13px; color:#0F2D52; margin-bottom:12px;">
                🏢 Company Logo
              </div>
              <div id="logo-preview" style="width:120px; height:70px; border-radius:10px; background:#fff; display:flex; align-items:center; justify-content:center; overflow:hidden; border:2px dashed #D1D5DB; margin-bottom:12px;">
                ${logo
                  ? `<img src="${logo}" alt="Logo" style="max-width:100%; max-height:100%; object-fit:contain; padding:4px;">`
                  : `<span style="font-size:11px; color:#9CA3AF; text-align:center; padding:4px;">No logo</span>`
                }
              </div>
              <label class="btn btn-outline cursor-pointer" style="font-size:12px; padding:6px 14px;">
                Upload Logo
                <input type="file" id="logo-upload" accept="image/png,image/jpeg,image/svg+xml" class="hidden" onchange="Settings.uploadLogo(this)">
              </label>
              ${logo ? `<button onclick="Settings.removeLogo()" class="btn btn-danger ml-2" style="font-size:12px; padding:6px 14px;">Remove</button>` : ''}
              <p style="font-size:10px; color:#9CA3AF; margin-top:8px;">PNG/JPG/SVG · max 2 MB<br>Shown in document header</p>
            </div>

            <!-- Signature -->
            <div style="padding:18px; background:#F8FAFC; border-radius:12px; border:1.5px solid #E5E7EB;">
              <div style="font-weight:700; font-size:13px; color:#0F2D52; margin-bottom:12px;">
                ✍️ Authorised Signature
              </div>
              <div id="sig-preview" style="width:160px; height:70px; border-radius:10px; background:#fff; display:flex; align-items:center; justify-content:center; overflow:hidden; border:2px dashed #D1D5DB; margin-bottom:12px;">
                ${Storage.getSignature()
                  ? `<img src="${Storage.getSignature()}" alt="Signature" style="max-width:100%; max-height:100%; object-fit:contain; padding:4px;">`
                  : `<span style="font-size:11px; color:#9CA3AF; text-align:center; padding:4px;">No signature</span>`
                }
              </div>
              <label class="btn btn-outline cursor-pointer" style="font-size:12px; padding:6px 14px;">
                Upload Signature
                <input type="file" id="sig-upload" accept="image/png,image/jpeg,image/svg+xml" class="hidden" onchange="Settings.uploadSignature(this)">
              </label>
              ${Storage.getSignature() ? `<button onclick="Settings.removeSignature()" class="btn btn-danger ml-2" style="font-size:12px; padding:6px 14px;">Remove</button>` : ''}
              <p style="font-size:10px; color:#9CA3AF; margin-top:8px;">PNG with transparent bg recommended<br>Auto-printed on all documents</p>
            </div>

            <!-- QR Code -->
            <div style="padding:18px; background:#F8FAFC; border-radius:12px; border:1.5px solid #E5E7EB;">
              <div style="font-weight:700; font-size:13px; color:#0F2D52; margin-bottom:12px;">
                📱 QR Code (UPI / Payment)
              </div>
              <div id="qr-preview" style="width:80px; height:80px; border-radius:10px; background:#fff; display:flex; align-items:center; justify-content:center; overflow:hidden; border:2px dashed #D1D5DB; margin-bottom:12px;">
                ${Storage.getQRCode()
                  ? `<img src="${Storage.getQRCode()}" alt="QR Code" style="max-width:100%; max-height:100%; object-fit:contain;">`
                  : `<span style="font-size:11px; color:#9CA3AF; text-align:center; padding:4px;">No QR</span>`
                }
              </div>
              <label class="btn btn-outline cursor-pointer" style="font-size:12px; padding:6px 14px;">
                Upload QR Code
                <input type="file" id="qr-upload" accept="image/png,image/jpeg" class="hidden" onchange="Settings.uploadQRCode(this)">
              </label>
              ${Storage.getQRCode() ? `<button onclick="Settings.removeQRCode()" class="btn btn-danger ml-2" style="font-size:12px; padding:6px 14px;">Remove</button>` : ''}
              <p style="font-size:10px; color:#9CA3AF; margin-top:8px;">UPI / bank QR code<br>Shown on invoices &amp; quotations</p>
            </div>

          </div>
        </div>

        <!-- COMPANY INFO -->
        <div class="card">
          <h2 class="card-title mb-4">Company Information</h2>
          <div class="space-y-4">
            <div class="form-group">
              <label class="form-label">Company Name</label>
              <input type="text" id="s-company" class="form-input" value="${settings.companyName}">
            </div>
            <div class="form-group">
              <label class="form-label">Tagline</label>
              <input type="text" id="s-tagline" class="form-input" value="${settings.tagline}">
            </div>
            <div class="form-group">
              <label class="form-label">Address</label>
              <textarea id="s-address" class="form-input form-textarea" rows="3">${settings.address}</textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" id="s-email" class="form-input" value="${settings.email}">
            </div>
            <div class="form-group">
              <label class="form-label">Primary Phone</label>
              <input type="text" id="s-phone" class="form-input" value="${settings.phone}">
            </div>
            <div class="form-group">
              <label class="form-label">Alternate Phone</label>
              <input type="text" id="s-altphone" class="form-input" value="${settings.altPhone}">
            </div>
            <div class="form-group">
              <label class="form-label">Website</label>
              <input type="text" id="s-website" class="form-input" value="${settings.website}">
            </div>
            <div class="form-group">
              <label class="form-label">GSTIN</label>
              <input type="text" id="s-gstin" class="form-input font-mono" value="${settings.gstin}" maxlength="15">
            </div>
            <div class="form-group">
              <label class="form-label">PAN</label>
              <input type="text" id="s-pan" class="form-input font-mono" value="${settings.pan}" maxlength="10">
            </div>
          </div>
        </div>

        <!-- BRAND COLORS + SIGNATORY -->
        <div class="space-y-6">
          <div class="card">
            <h2 class="card-title mb-4">Brand Colors</h2>
            <div class="space-y-4">
              <div class="form-group">
                <label class="form-label">Primary Color</label>
                <div class="flex gap-2 items-center">
                  <input type="color" id="s-primary-color" class="w-12 h-10 rounded-lg cursor-pointer border" value="${settings.primaryColor}">
                  <input type="text" id="s-primary-color-hex" class="form-input font-mono" value="${settings.primaryColor}" oninput="document.getElementById('s-primary-color').value=this.value">
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Accent Color</label>
                <div class="flex gap-2 items-center">
                  <input type="color" id="s-accent-color" class="w-12 h-10 rounded-lg cursor-pointer border" value="${settings.accentColor}">
                  <input type="text" id="s-accent-color-hex" class="form-input font-mono" value="${settings.accentColor}" oninput="document.getElementById('s-accent-color').value=this.value">
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <h2 class="card-title mb-4">Signatory</h2>
            <div class="space-y-4">
              <div class="form-group">
                <label class="form-label">Authorised Signatory Name</label>
                <input type="text" id="s-signatory" class="form-input" value="${settings.signatory}">
              </div>
              <div class="form-group">
                <label class="form-label">Designation</label>
                <input type="text" id="s-designation" class="form-input" value="${settings.designation}">
              </div>
            </div>
          </div>

          <div class="card">
            <h2 class="card-title mb-4">Footer Text</h2>
            <div class="form-group">
              <label class="form-label">Document Footer</label>
              <textarea id="s-footer" class="form-input form-textarea" rows="2">${settings.footerText}</textarea>
            </div>
          </div>
        </div>

        <!-- BANK DETAILS -->
        <div class="card">
          <h2 class="card-title mb-4">Bank Details (shown on Invoices)</h2>
          <div class="space-y-4">
            <div class="form-group">
              <label class="form-label">Bank Name</label>
              <input type="text" id="s-bank-name" class="form-input" value="${settings.bankName}">
            </div>
            <div class="form-group">
              <label class="form-label">Account Holder Name</label>
              <input type="text" id="s-bank-acc-name" class="form-input" value="${settings.bankAccountName}">
            </div>
            <div class="form-group">
              <label class="form-label">Account Number</label>
              <input type="text" id="s-bank-acc" class="form-input font-mono" value="${settings.bankAccount}">
            </div>
            <div class="form-group">
              <label class="form-label">IFSC Code</label>
              <input type="text" id="s-bank-ifsc" class="form-input font-mono" value="${settings.bankIfsc}">
            </div>
            <div class="form-group">
              <label class="form-label">Branch</label>
              <input type="text" id="s-bank-branch" class="form-input" value="${settings.bankBranch}">
            </div>
          </div>
        </div>

        <!-- DEFAULT TERMS -->
        <div class="card">
          <h2 class="card-title mb-4">Default Terms & Conditions</h2>
          <div class="space-y-4">
            <div class="form-group">
              <label class="form-label">Quotation Terms</label>
              <textarea id="s-terms-qt" class="form-input form-textarea" rows="3">${settings.termsQuotation}</textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Proforma Invoice Terms</label>
              <textarea id="s-terms-pi" class="form-input form-textarea" rows="3">${settings.termsProforma}</textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Tax Invoice Terms</label>
              <textarea id="s-terms-inv" class="form-input form-textarea" rows="3">${settings.termsInvoice}</textarea>
            </div>
          </div>
        </div>

        <!-- GOOGLE SHEETS -->
        <div class="card lg:col-span-2">
          <h2 class="card-title mb-4">Google Sheets Integration</h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div class="form-group sm:col-span-2">
              <label class="form-label">Google Apps Script Webhook URL</label>
              <input type="url" id="s-webhook" class="form-input font-mono text-sm"
                value="${settings.webhookUrl}"
                placeholder="https://script.google.com/macros/s/…/exec">
            </div>

            <!-- Toggle -->
            <div class="form-group">
              <label class="flex items-center gap-3 cursor-pointer">
                <div class="relative">
                  <input type="checkbox" id="s-webhook-enabled" class="sr-only"
                    ${settings.webhookEnabled ? 'checked' : ''}
                    onchange="Settings.toggleWebhook(this.checked)">
                  <div id="toggle-track" class="w-11 h-6 rounded-full transition-colors
                    ${settings.webhookEnabled ? 'bg-primary' : 'bg-gray-300'}"></div>
                  <div id="toggle-thumb" class="absolute top-0.5 left-0.5 w-5 h-5 bg-white
                    rounded-full shadow transition-transform
                    ${settings.webhookEnabled ? 'translate-x-5' : ''}"></div>
                </div>
                <span class="form-label mb-0">Auto-Sync on every Save</span>
              </label>
            </div>

            <!-- Action buttons -->
            <div class="flex gap-2 flex-wrap items-center">
              <button onclick="GoogleSheets.testWebhook()" class="btn btn-outline text-sm">
                🔗 Test Webhook
              </button>
              <button onclick="Settings.save();GoogleSheets.syncAll()" class="btn btn-primary text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0
                       0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                Sync All Data Now
              </button>
            </div>
          </div>

          <!-- Apps Script Setup Guide -->
          <div style="border:1px solid #E5E7EB; border-radius:12px; overflow:hidden;">
            <button onclick="Settings.toggleGuide()" id="guide-toggle-btn"
              style="width:100%; padding:14px 18px; background:#F8FAFC; border:none;
                     display:flex; justify-content:space-between; align-items:center;
                     cursor:pointer; font-weight:700; font-size:14px; color:#0F2D52;">
              <span>📋 Google Apps Script Setup Guide</span>
              <span id="guide-arrow">▼</span>
            </button>
            <div id="apps-script-guide" style="display:none; padding:20px; background:#fff;">

              <div style="display:flex; gap:12px; flex-wrap:wrap; margin-bottom:16px;">
                <div style="flex:1; min-width:200px; padding:14px; background:#EFF6FF;
                            border-radius:10px; border-left:4px solid #2563EB;">
                  <p style="font-weight:700; font-size:13px; color:#1D4ED8; margin-bottom:6px;">Step 1 — Create Google Sheet</p>
                  <p style="font-size:12px; color:#374151; line-height:1.6;">
                    Open <a href="https://sheets.google.com" target="_blank" style="color:#2563EB;">sheets.google.com</a>
                    → New Spreadsheet → rename it <strong>"I-Pro Solutions"</strong>.
                    Leave the first sheet as-is (the script creates all tabs automatically).
                  </p>
                </div>
                <div style="flex:1; min-width:200px; padding:14px; background:#ECFDF5;
                            border-radius:10px; border-left:4px solid #059669;">
                  <p style="font-weight:700; font-size:13px; color:#065F46; margin-bottom:6px;">Step 2 — Open Apps Script</p>
                  <p style="font-size:12px; color:#374151; line-height:1.6;">
                    Inside the Sheet → click <strong>Extensions</strong> → <strong>Apps Script</strong>.
                    Delete all existing code. Paste the complete script below.
                    Click <strong>Save</strong> (Ctrl+S).
                  </p>
                </div>
                <div style="flex:1; min-width:200px; padding:14px; background:#FFF7ED;
                            border-radius:10px; border-left:4px solid #F97316;">
                  <p style="font-weight:700; font-size:13px; color:#9A3412; margin-bottom:6px;">Step 3 — Run Setup Once</p>
                  <p style="font-size:12px; color:#374151; line-height:1.6;">
                    In Apps Script, select <strong>runOnce</strong> from the function dropdown
                    → click ▶ Run. Authorize when prompted.
                    This creates all sheet tabs with styled headers.
                  </p>
                </div>
                <div style="flex:1; min-width:200px; padding:14px; background:#F5F3FF;
                            border-radius:10px; border-left:4px solid #7C3AED;">
                  <p style="font-weight:700; font-size:13px; color:#5B21B6; margin-bottom:6px;">Step 4 — Deploy as Web App</p>
                  <p style="font-size:12px; color:#374151; line-height:1.6;">
                    Click <strong>Deploy → New Deployment</strong> → Type: <strong>Web App</strong>
                    → Execute as: <strong>Me</strong> → Access: <strong>Anyone</strong>
                    → Deploy → Copy URL → paste above.
                  </p>
                </div>
              </div>

              <!-- Script code box -->
              <div style="position:relative;">
                <div style="background:#0F2D52; border-radius:10px; padding:16px 18px;
                            font-family:monospace; font-size:11px; color:#93C5FD;
                            line-height:1.7; overflow-x:auto; max-height:280px; overflow-y:auto;">
                  <pre style="margin:0; white-space:pre-wrap; color:#E5E7EB;">// Paste this complete code into Google Apps Script\n// Then run runOnce() to create sheet headers\n// Then deploy as Web App\n\nconst SHEET_DOCUMENTS = 'Documents';\nconst SHEET_CLIENTS   = 'Clients';\nconst SHEET_SERVICES  = 'Services';\nconst SHEET_LOG       = 'Sync Log';\n\nfunction doPost(e) {\n  try {\n    var payload = JSON.parse(e.postData.contents);\n    var type = (payload.type || 'document').toLowerCase();\n    if (type === 'bulk') { handleBulk(payload); }\n    else if (type === 'client')  { handleClient(payload); }\n    else if (type === 'service') { handleService(payload); }\n    else { handleDocument(payload); }\n    return res({status:'ok'});\n  } catch(err) {\n    return res({status:'error', message:err.message});\n  }\n}\n\nfunction doGet(e) {\n  return res({status:'ok', message:'I-Pro webhook live'});\n}\n\nfunction handleDocument(p) {\n  var s = getSheet(SHEET_DOCUMENTS,\n    ['Timestamp','Doc No','Type','Client','Company','Date',\n     'Due Date','Subtotal','Tax','Total','Status','Remarks']);\n  s.appendRow([new Date().toISOString(), p.docNumber||'',\n    p.docType||'', p.clientName||'', p.clientCompany||'',\n    p.date||'', p.dueDate||'', p.subtotal||0,\n    p.taxAmount||0, p.grandTotal||0, p.status||'', p.remarks||'']);\n}\n\nfunction handleClient(p) {\n  var s = getSheet(SHEET_CLIENTS,\n    ['Timestamp','ID','Name','Company','Address','GSTIN','Email','Phone','State']);\n  s.appendRow([new Date().toISOString(), p.id||'',\n    p.name||'', p.company||'', p.address||'',\n    p.gstin||'', p.email||'', p.phone||'', p.state||'']);\n}\n\nfunction handleService(p) {\n  var s = getSheet(SHEET_SERVICES,\n    ['Timestamp','ID','Name','Description','Category','Price','GST%']);\n  s.appendRow([new Date().toISOString(), p.id||'',\n    p.name||'', p.description||'', p.category||'',\n    p.price||0, p.taxRate||18]);\n}\n\nfunction handleBulk(p) {\n  if(p.documents) p.documents.forEach(handleDocument);\n  if(p.clients)   p.clients.forEach(handleClient);\n  if(p.services)  p.services.forEach(handleService);\n}\n\nfunction runOnce() {\n  [\n    [SHEET_DOCUMENTS,'#0F2D52'],\n    [SHEET_CLIENTS,  '#065F46'],\n    [SHEET_SERVICES, '#1E40AF'],\n    [SHEET_LOG,      '#4B5563']\n  ].forEach(function(item) {\n    var sheet = getOrCreate(item[0]);\n    var hr = sheet.getRange(1,1,1,sheet.getLastColumn()||1);\n    hr.setBackground(item[1]);\n    hr.setFontColor('#FFFFFF');\n    hr.setFontWeight('bold');\n    sheet.setFrozenRows(1);\n  });\n  SpreadsheetApp.getActiveSpreadsheet()\n    .toast('Setup complete!','I-Pro Solutions',5);\n}\n\nfunction getSheet(name, headers) {\n  var s = getOrCreate(name);\n  if(s.getLastRow() === 0) s.appendRow(headers);\n  return s;\n}\n\nfunction getOrCreate(name) {\n  var ss = SpreadsheetApp.getActiveSpreadsheet();\n  return ss.getSheetByName(name) || ss.insertSheet(name);\n}\n\nfunction res(obj) {\n  return ContentService\n    .createTextOutput(JSON.stringify(obj))\n    .setMimeType(ContentService.MimeType.JSON);\n}</pre>
                </div>
                <button onclick="Settings.copyScript()"
                  style="position:absolute; top:10px; right:10px; padding:6px 14px;
                         background:rgba(255,255,255,0.15); color:#fff; border:1px solid rgba(255,255,255,0.3);
                         border-radius:7px; font-size:12px; cursor:pointer; font-weight:600;"
                  id="copy-script-btn">
                  📋 Copy
                </button>
              </div>

              <p style="margin-top:12px; font-size:11px; color:#6B7280;">
                ⚡ The full production script with upsert (update existing rows) is in
                <strong>google-apps-script.gs</strong> in your project folder.
                The version above is the minimal working version.
              </p>
            </div>
          </div>
        </div>

        <!-- DATA MANAGEMENT -->
        <div class="card lg:col-span-2">
          <h2 class="card-title mb-4">Data Management</h2>
          <div class="flex flex-wrap gap-3">
            <button onclick="Settings.exportData()" class="btn btn-outline">
              📤 Export All Data (JSON)
            </button>
            <label class="btn btn-outline cursor-pointer">
              📥 Import Data (JSON)
              <input type="file" accept=".json" class="hidden" onchange="Settings.importData(this)">
            </label>
            <button onclick="Settings.exportDocsCSV()" class="btn btn-outline">
              📊 Export Documents (CSV)
            </button>
            <button onclick="Settings.resetCounters()" class="btn btn-outline" style="color:#D97706;">
              🔄 Reset Doc Counters
            </button>
            <button onclick="Settings.clearAllData()" class="btn btn-danger">
              🗑 Clear All Data
            </button>
          </div>
        </div>

      </div>
    `;

    // Sync color inputs
    Utils.el('s-primary-color')?.addEventListener('input', (e) => {
      const hex = Utils.el('s-primary-color-hex');
      if (hex) hex.value = e.target.value;
    });
    Utils.el('s-accent-color')?.addEventListener('input', (e) => {
      const hex = Utils.el('s-accent-color-hex');
      if (hex) hex.value = e.target.value;
    });
  },

  /* ─── IMAGE COMPRESSION HELPER ──────────────────────────── */
  compressImage(file, maxSizeKB, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        // Scale down if larger than 800px
        const MAX_DIM = 800;
        if (width > height) {
          if (width > MAX_DIM) { height *= MAX_DIM / width; width = MAX_DIM; }
        } else {
          if (height > MAX_DIM) { width *= MAX_DIM / height; height = MAX_DIM; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        // Compress heavily to save localStorage quota
        callback(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  },

  uploadLogo(input) {
    const file = input.files[0];
    if (!file) return;
    this.compressImage(file, 200, (base64) => {
      try {
        Storage.saveLogo(base64);
        this.render();
        App.updateLogoInNav();
        Utils.showToast('Logo uploaded!', 'success');
      } catch (e) {
        Utils.showToast('Storage full! Clear old data.', 'error');
      }
    });
  },

  removeLogo() {
    Storage.saveLogo(null);
    this.render();
    App.updateLogoInNav();
    Utils.showToast('Logo removed.', 'info');
  },

  /* ─── SIGNATURE ─────────────────────────────────────────── */
  uploadSignature(input) {
    const file = input.files[0];
    if (!file) return;
    this.compressImage(file, 200, (base64) => {
      try {
        Storage.saveSignature(base64);
        this.render();
        Utils.showToast('✓ Signature uploaded!', 'success');
      } catch (e) {
        Utils.showToast('Storage full! Clear old data.', 'error');
      }
    });
  },

  removeSignature() {
    Storage.saveSignature(null);
    this.render();
    Utils.showToast('Signature removed.', 'info');
  },

  /* ─── QR CODE ───────────────────────────────────────────── */
  uploadQRCode(input) {
    const file = input.files[0];
    if (!file) return;
    this.compressImage(file, 200, (base64) => {
      try {
        Storage.saveQRCode(base64);
        this.render();
        Utils.showToast('✓ QR code uploaded!', 'success');
      } catch (e) {
        Utils.showToast('Storage full! Clear old data.', 'error');
      }
    });
  },

  removeQRCode() {
    Storage.saveQRCode(null);
    this.render();
    Utils.showToast('QR code removed.', 'info');
  },

  toggleWebhook(enabled) {
    const track = Utils.el('toggle-track');
    const thumb = Utils.el('toggle-thumb');
    if (track) track.className = `w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-primary' : 'bg-gray-300'}`;
    if (thumb) thumb.className = `absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-5' : ''}`;
  },

  save() {
    const g = (id) => Utils.el(id)?.value || '';
    const settings = {
      companyName: g('s-company'),
      tagline: g('s-tagline'),
      address: g('s-address'),
      email: g('s-email'),
      phone: g('s-phone'),
      altPhone: g('s-altphone'),
      website: g('s-website'),
      gstin: g('s-gstin').toUpperCase(),
      pan: g('s-pan').toUpperCase(),
      primaryColor: g('s-primary-color') || g('s-primary-color-hex'),
      accentColor: g('s-accent-color') || g('s-accent-color-hex'),
      bankName: g('s-bank-name'),
      bankAccountName: g('s-bank-acc-name'),
      bankAccount: g('s-bank-acc'),
      bankIfsc: g('s-bank-ifsc').toUpperCase(),
      bankBranch: g('s-bank-branch'),
      signatory: g('s-signatory'),
      designation: g('s-designation'),
      footerText: g('s-footer'),
      termsQuotation: g('s-terms-qt'),
      termsProforma: g('s-terms-pi'),
      termsInvoice: g('s-terms-inv'),
      webhookUrl: g('s-webhook'),
      webhookEnabled: Utils.el('s-webhook-enabled')?.checked || false,
    };
    Storage.saveSettings(settings);
    App.updateLogoInNav();
    Utils.showToast('Settings saved!', 'success');
  },

  exportData() {
    const data = {
      ...Storage.exportAll(),
      logo:      Storage.getLogo(),
      signature: Storage.getSignature(),
      qrCode:    Storage.getQRCode(),
      _version:  '2.0',
      _app:      'I-Pro Solutions Document Generator',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ipro-FULL-backup-${Utils.todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    Utils.showToast('✓ Full backup downloaded! Keep this file safe before redeployment.', 'success', 5000);
  },

  importData(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        Storage.importAll(data);
        // Restore brand assets if included in backup
        if (data.logo)      Storage.saveLogo(data.logo);
        if (data.signature) Storage.saveSignature(data.signature);
        if (data.qrCode)    Storage.saveQRCode(data.qrCode);
        const counts = [
          data.clients?.length   ? `${data.clients.length} clients`   : '',
          data.services?.length  ? `${data.services.length} services`  : '',
          data.documents?.length ? `${data.documents.length} documents` : '',
        ].filter(Boolean).join(', ');
        Utils.showToast(`✓ Restored: ${counts}. All settings and assets recovered!`, 'success', 5000);
        setTimeout(() => location.reload(), 1500);
      } catch (err) {
        Utils.showToast('Invalid backup file. Please use a file exported from this app.', 'error');
      }
    };
    reader.readAsText(file);
  },

  resetCounters() {
    Utils.showModal('Reset Counters', '<p>This will reset all document numbering (QT, PI, INV) back to 001. Existing documents keep their numbers.</p>', () => {
      Storage.set('ipro_counters', { QT: 0, PI: 0, INV: 0 });
      Utils.showToast('Counters reset!', 'info');
    }, 'Reset', 'btn-danger');
  },

  clearAllData() {
    Utils.showModal(
      'Clear All Data',
      '<p class="text-red-600 font-semibold">⚠ This will permanently delete ALL clients, services, documents, settings, logo, signature, and QR code. This cannot be undone! Export a backup first.</p>',
      () => {
        Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
        Utils.showToast('All data cleared.', 'warning');
        location.reload();
      },
      'Clear Everything', 'btn-danger'
    );
  },

  /* ─── Toggle Apps Script guide panel ─────────────────────── */
  toggleGuide() {
    const guide = document.getElementById('apps-script-guide');
    const arrow = document.getElementById('guide-arrow');
    if (!guide) return;
    const isOpen = guide.style.display !== 'none';
    guide.style.display = isOpen ? 'none' : 'block';
    if (arrow) arrow.textContent = isOpen ? '▼' : '▲';
  },

  /* ─── Copy Apps Script code to clipboard ─────────────────── */
  copyScript() {
    const pre = document.querySelector('#apps-script-guide pre');
    if (!pre) return;
    navigator.clipboard.writeText(pre.textContent).then(() => {
      const btn = document.getElementById('copy-script-btn');
      if (btn) { btn.textContent = '✓ Copied!'; setTimeout(() => { btn.textContent = '📋 Copy'; }, 2500); }
      Utils.showToast('Apps Script code copied!', 'success');
    }).catch(() => Utils.showToast('Copy failed — please select & copy manually.', 'warning'));
  },

  /* ─── Export Documents as CSV ─────────────────────────────── */
  exportDocsCSV() {
    const docs    = Storage.getDocuments();
    const clients = Storage.getClients();
    const clientMap = {};
    clients.forEach(c => { clientMap[c.id] = c; });

    const header = 'Doc Number,Type,Client Name,Client Company,Date,Due Date,Subtotal,Tax Amount,Grand Total,Status,Remarks';
    const rows   = docs.map(d => {
      const c = clientMap[d.clientId] || {};
      return [
        d.docNumber, Utils.docTypeName(d.type),
        c.name || '', c.company || '',
        d.date || '', d.dueDate || '',
        d.totals?.subtotal   || 0,
        d.totals?.taxAmount  || 0,
        d.totals?.grandTotal || 0,
        d.status || '', d.remarks || '',
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });

    const BOM  = '\uFEFF';
    const csv  = BOM + [header, ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `ipro-documents-${Utils.todayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    Utils.showToast(`Exported ${docs.length} documents as CSV!`, 'success');
  },
};

window.Settings = Settings;
