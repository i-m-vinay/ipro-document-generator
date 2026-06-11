/**
 * I-Pro Solutions - Documents Module v3.0
 * Builder: Govt Fee column, Duplicate, Share (WhatsApp/Email)
 * Fixes: Reference No. never undefined, PDF cache-bust
 */

const Documents = {
  searchTerm: '',
  filterType: '',
  filterStatus: '',
  lineItems: [],
  editingId: null,
  gstMode: 'intra', // 'intra' (CGST+SGST) or 'inter' (IGST)

  // ─── DOCUMENT LIST VIEW ──────────────────────────────────
  render() {
    const docs = Storage.getDocuments();
    let filtered = docs;
    if (this.searchTerm) {
      const q = this.searchTerm.toLowerCase();
      filtered = filtered.filter(d =>
        (d.docNumber || '').toLowerCase().includes(q) ||
        (d.clientName || '').toLowerCase().includes(q) ||
        (d.remarks || '').toLowerCase().includes(q)
      );
    }
    if (this.filterType) filtered = filtered.filter(d => d.type === this.filterType);
    if (this.filterStatus) filtered = filtered.filter(d => d.status === this.filterStatus);

    // Sort newest first
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const container = Utils.el('documents-view');
    if (!container) return;

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Documents</h1>
          <p class="page-subtitle">${docs.length} document${docs.length !== 1 ? 's' : ''} total</p>
        </div>
        <div class="flex gap-2 flex-wrap">
          <button onclick="Documents.openBuilder(null,null,'quotation')" class="btn btn-outline text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Quotation
          </button>
          <button onclick="Documents.openBuilder(null,null,'proforma')" class="btn btn-outline text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Proforma
          </button>
          <button onclick="Documents.openBuilder(null,null,'invoice')" class="btn btn-primary text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Tax Invoice
          </button>
        </div>
      </div>

      <div class="card mb-6">
        <div class="flex gap-3 flex-wrap">
          <div class="search-box flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="search-icon w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/></svg>
            <input type="text" id="doc-search" placeholder="Search by number, client, remarks…" class="search-input" value="${this.searchTerm}" oninput="Documents.search(this.value)">
          </div>
          <select class="form-input w-auto" onchange="Documents.setFilter('type', this.value)">
            <option value="">All Types</option>
            <option value="quotation" ${this.filterType === 'quotation' ? 'selected' : ''}>Quotation</option>
            <option value="proforma" ${this.filterType === 'proforma' ? 'selected' : ''}>Proforma</option>
            <option value="invoice" ${this.filterType === 'invoice' ? 'selected' : ''}>Invoice</option>
          </select>
          <select class="form-input w-auto" onchange="Documents.setFilter('status', this.value)">
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="paid">Paid</option>
            <option value="converted">Converted</option>
          </select>
        </div>
      </div>

      ${filtered.length === 0 ? this.listEmptyState() : `
      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Client</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(d => this.documentRow(d)).join('')}
            </tbody>
          </table>
        </div>
      </div>`}
    `;
  },

  documentRow(d) {
    const typeColors = { quotation: 'badge-info', proforma: 'badge-warning', invoice: 'badge-success' };
    return `
      <tr>
        <td>
          <div class="font-mono font-semibold text-primary">${Utils.sanitize(d.docNumber)}</div>
          <div class="text-xs text-muted">
            <span class="badge ${typeColors[d.type]} text-xs">${Utils.docTypeName(d.type)}</span>
            ${d.reference && d.reference !== 'undefined' ? `<span class="text-xs text-muted ml-1">· Ref: ${Utils.sanitize(d.reference)}</span>` : ''}
          </div>
        </td>
        <td>
          <div class="font-medium">${Utils.sanitize(d.clientName || '—')}</div>
          <div class="text-sm text-muted">${Utils.sanitize(d.clientCompany || '')}</div>
        </td>
        <td class="text-sm">${Utils.formatDateShort(d.date)}</td>
        <td class="font-mono font-semibold">${Utils.formatCurrency(d.totals?.grandTotal || 0)}</td>
        <td>${Utils.statusBadge(d.status)}</td>
        <td>
          <div class="flex items-center justify-end gap-1">
            <button onclick="Documents.preview('${d.id}')" class="icon-btn text-blue-500" title="Preview">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            </button>
            <button onclick="Documents.openBuilder('${d.id}')" class="icon-btn" title="Edit">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
            <button onclick="Documents.duplicateDocument('${d.id}')" class="icon-btn text-amber-500" title="Duplicate document">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            </button>
            <button onclick="PDFExport.download('${d.id}')" class="icon-btn text-emerald-500" title="Download PDF">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            </button>
            ${d.type !== 'invoice' ? `
            <button onclick="Documents.convert('${d.id}')" class="icon-btn text-purple-500" title="Convert to next stage">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
            </button>` : ''}
            <button onclick="Documents.confirmDelete('${d.id}', '${Utils.sanitize(d.docNumber)}')" class="icon-btn text-red-500" title="Delete">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  },

  listEmptyState() {
    return `
      <div class="empty-state">
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        </div>
        <h3 class="empty-title">No documents yet</h3>
        <p class="empty-desc">Create your first quotation, proforma, or invoice.</p>
        <button onclick="Documents.openBuilder(null,null,'quotation')" class="btn btn-primary mt-4">Create Quotation</button>
      </div>
    `;
  },

  search(term) { this.searchTerm = term.toLowerCase(); this.render(); },
  setFilter(key, val) {
    if (key === 'type') this.filterType = val;
    if (key === 'status') this.filterStatus = val;
    this.render();
  },

  // ─── DOCUMENT BUILDER ────────────────────────────────────
  openBuilder(id = null, clientId = null, type = 'quotation') {
    this.editingId = id;
    const doc = id ? Storage.getDocumentById(id) : null;
    const docType = doc?.type || type;
    this.lineItems = doc?.lineItems ? JSON.parse(JSON.stringify(doc.lineItems)) : [];
    this.gstMode = doc?.gstMode || 'intra';
    if (this.lineItems.length === 0) this.addEmptyRow();

    const clients = Storage.getClients();
    const settings = Storage.getSettings();

    const container = Utils.el('builder-view');
    if (!container) return;
    App.navigate('builder');

    const typeLabels = { quotation: 'Quotation', proforma: 'Proforma Invoice', invoice: 'Tax Invoice' };

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">${doc ? 'Edit ' : 'New '}${typeLabels[docType]}</h1>
          ${doc ? `<p class="page-subtitle font-mono">${doc.docNumber}</p>` : '<p class="page-subtitle">Fill in the details and add services</p>'}
        </div>
        <div class="flex gap-2">
          <button onclick="App.navigate('documents')" class="btn btn-secondary">← Back</button>
          <button onclick="Documents.saveDraft()" class="btn btn-outline">Save Draft</button>
          <button onclick="Documents.saveDocument()" class="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
            Save & Generate
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- LEFT: Form -->
        <div class="lg:col-span-2 space-y-6">

          <!-- Document Info -->
          <div class="card">
            <h2 class="card-title mb-4">Document Details</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="form-group">
                <label class="form-label">Document Type</label>
                <select id="doc-type" class="form-input form-select" onchange="Documents.changeType(this.value)">
                  <option value="quotation" ${docType === 'quotation' ? 'selected' : ''}>Quotation</option>
                  <option value="proforma" ${docType === 'proforma' ? 'selected' : ''}>Proforma Invoice</option>
                  <option value="invoice" ${docType === 'invoice' ? 'selected' : ''}>Tax Invoice</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Date <span class="text-red-500">*</span></label>
                <input type="date" id="doc-date" class="form-input" value="${doc?.date || Utils.todayISO()}" required>
              </div>
              <div class="form-group">
                <label class="form-label">Validity / Due Date</label>
                <input type="date" id="doc-due" class="form-input" value="${doc?.dueDate || Utils.addDays(Utils.todayISO(), 30)}">
              </div>
              <div class="form-group">
                <label class="form-label">
                  Reference No. / PO No.
                  ${doc?.docNumber
                    ? `<span style="margin-left:6px; font-size:10px; background:#EFF6FF; color:#2563EB; padding:2px 8px; border-radius:99px; font-weight:600; font-family:monospace;">${doc.docNumber}</span>`
                    : `<span style="margin-left:6px; font-size:10px; color:#6B7280; font-weight:400;">(auto-assigned on save)</span>`
                  }
                </label>
                <input type="text" id="doc-ref" class="form-input"
                  value="${(doc?.reference && doc.reference !== 'undefined') ? doc.reference : ''}"
                  placeholder="${doc?.docNumber ? doc.docNumber : 'Leave blank to auto-use Document No., or type your own'}">
                <div style="font-size:10px; color:#9CA3AF; margin-top:4px;">
                  💡 Leave blank to use the Document No. automatically, or type your own PO / reference number.
                </div>
              </div>
              <div class="form-group sm:col-span-2">
                <label class="form-label">Remarks / Subject</label>
                <input type="text" id="doc-remarks" class="form-input" value="${doc?.remarks || ''}" placeholder="e.g. Trademark Registration for ABC Brand">
              </div>
            </div>
          </div>

          <!-- Client -->
          <div class="card">
            <div class="flex items-center justify-between mb-4">
              <h2 class="card-title">Client Details</h2>
              <button onclick="Clients.openForm()" class="btn btn-outline text-xs">+ New Client</button>
            </div>
            <div class="form-group mb-4">
              <label class="form-label">Select Client <span class="text-red-500">*</span></label>
              <select id="doc-client" class="form-input form-select" onchange="Documents.onClientChange(this.value)" required>
                <option value="">— Select a client —</option>
                ${clients.map(c => `<option value="${c.id}" ${(doc?.clientId === c.id || clientId === c.id) ? 'selected' : ''}>${c.name}${c.company ? ' – ' + c.company : ''}</option>`).join('')}
              </select>
            </div>
            <div id="client-preview" class="hidden">
              <!-- Filled dynamically -->
            </div>
          </div>

          <!-- Service Table -->
          <div class="card">
            <div class="flex items-center justify-between mb-4">
              <h2 class="card-title">Services &amp; Fees</h2>
              <div class="flex gap-2 flex-wrap">
                <select id="service-picker" class="form-input form-select text-sm" style="width:220px;" onchange="Documents.addServiceFromPicker(this.value)">
                  <option value="">+ Add from Service Master</option>
                  ${Storage.getServices().map(s => `<option value="${s.id}">${s.name} – ${Utils.formatCurrency(s.price)}</option>`).join('')}
                </select>
                <button onclick="Documents.addEmptyRow(true,'service')" class="btn btn-outline text-sm">+ Custom Row</button>
              </div>
            </div>
            <div class="overflow-x-auto">
              <table class="data-table" id="line-items-table">
                <thead>
                  <tr>
                    <th class="w-8">#</th>
                    <th>Service / Description</th>
                    <th class="w-20">Qty</th>
                    <th class="w-28">Rate (₹)</th>
                    <th class="w-24">GST %</th>
                    <th class="w-32" style="color:#1D4ED8;">Govt Fee (₹) <span title="Government / statutory filing fee — added to total but NOT taxed" style="cursor:help; font-size:10px;">ℹ️</span></th>
                    <th class="w-28">Amount</th>
                    <th class="w-16"></th>
                  </tr>
                </thead>
                <tbody id="line-items-body">
                  <!-- Rendered by renderLineItems() -->
                </tbody>
              </table>
            </div>
          </div>

          <!-- Notes -->
          <div class="card">
            <h2 class="card-title mb-4">Additional Information</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="form-group sm:col-span-2">
                <label class="form-label">Terms & Conditions</label>
                <textarea id="doc-terms" class="form-input form-textarea" rows="4">${doc?.terms || settings[`terms${docType.charAt(0).toUpperCase() + docType.slice(1)}`] || ''}</textarea>
              </div>
              <div class="form-group sm:col-span-2">
                <label class="form-label">Internal Notes (not printed)</label>
                <textarea id="doc-internal" class="form-input form-textarea" rows="2">${doc?.internalNotes || ''}</textarea>
              </div>
            </div>
          </div>

        </div>

        <!-- RIGHT: Summary -->
        <div class="space-y-6">
          <div class="card sticky top-24">
            <h2 class="card-title mb-4">GST & Summary</h2>
            <div class="form-group mb-4">
              <label class="form-label">GST Type</label>
              <div class="flex gap-2">
                <button onclick="Documents.setGSTMode('intra')" id="gst-intra" class="btn ${this.gstMode === 'intra' ? 'btn-primary' : 'btn-outline'} flex-1 text-sm">
                  CGST + SGST
                </button>
                <button onclick="Documents.setGSTMode('inter')" id="gst-inter" class="btn ${this.gstMode === 'inter' ? 'btn-primary' : 'btn-outline'} flex-1 text-sm">
                  IGST
                </button>
              </div>
            </div>

            <div class="space-y-2 text-sm">
              <div class="flex justify-between py-1">
                <span class="text-muted">Prof. Fees Subtotal</span>
                <span id="sum-subtotal" class="font-mono">₹0.00</span>
              </div>
              <div id="sum-govtfee-row" class="flex justify-between py-1" style="display:none!important">
                <span class="text-muted" style="color:#1D4ED8;">🏛 Govt Fees</span>
                <span id="sum-govtfee" class="font-mono" style="color:#1D4ED8;">₹0.00</span>
              </div>
              <div id="gst-lines">
                <!-- GST breakdown -->
              </div>
              <div class="flex justify-between py-1">
                <span class="text-muted">Round Off</span>
                <span id="sum-roundoff" class="font-mono">₹0.00</span>
              </div>
              <div class="divider"></div>
              <div class="flex justify-between py-2 font-bold text-base">
                <span>Grand Total</span>
                <span id="sum-grand" class="font-mono text-primary">₹0.00</span>
              </div>
            </div>

            <div class="mt-4 p-3 rounded-lg bg-surface-2 text-xs text-muted leading-relaxed">
              <span class="font-semibold text-primary block mb-1">Amount in Words:</span>
              <span id="sum-words">—</span>
            </div>

            <div class="mt-4 space-y-2">
              <div class="form-group">
                <label class="form-label text-xs">Status</label>
                <select id="doc-status" class="form-input form-select text-sm">
                  <option value="draft" ${(doc?.status || 'draft') === 'draft' ? 'selected' : ''}>Draft</option>
                  <option value="sent" ${doc?.status === 'sent' ? 'selected' : ''}>Sent</option>
                  <option value="accepted" ${doc?.status === 'accepted' ? 'selected' : ''}>Accepted</option>
                  <option value="rejected" ${doc?.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                  ${docType === 'invoice' ? `
                  <option value="paid" ${doc?.status === 'paid' ? 'selected' : ''}>Paid</option>
                  <option value="partial" ${doc?.status === 'partial' ? 'selected' : ''}>Partial</option>
                  <option value="unpaid" ${doc?.status === 'unpaid' ? 'selected' : ''}>Unpaid</option>
                  ` : ''}
                </select>
              </div>
              <button onclick="Documents.saveDocument()" class="btn btn-primary w-full">Save Document</button>
              ${doc ? `<button onclick="PDFExport.download('${doc.id}')" class="btn btn-outline w-full">Download PDF</button>
              <button onclick="Documents.preview('${doc.id}')" class="btn btn-outline w-full">Preview Document</button>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;

    this.renderLineItems();
    this.recalculate();

    // Pre-fill client if specified
    const clientEl = Utils.el('doc-client');
    if (clientId && clientEl) {
      clientEl.value = clientId;
      this.onClientChange(clientId);
    } else if (doc?.clientId) {
      this.onClientChange(doc.clientId);
    }
  },

  changeType(type) {
    const settings = Storage.getSettings();
    const termKey = `terms${type.charAt(0).toUpperCase() + type.slice(1)}`;
    const termsEl = Utils.el('doc-terms');
    if (termsEl && !termsEl.dataset.modified) {
      termsEl.value = settings[termKey] || '';
    }
  },

  onClientChange(clientId) {
    if (!clientId) {
      const preview = Utils.el('client-preview');
      if (preview) { preview.classList.add('hidden'); preview.innerHTML = ''; }
      return;
    }
    const client = Storage.getClientById(clientId);
    if (!client) return;
    const preview = Utils.el('client-preview');
    if (preview) {
      preview.classList.remove('hidden');
      preview.innerHTML = `
        <div class="p-4 rounded-lg bg-surface-2 text-sm space-y-1">
          <div class="font-semibold text-primary">${Utils.sanitize(client.name)}</div>
          ${client.company ? `<div class="text-muted">${Utils.sanitize(client.company)}</div>` : ''}
          <div class="text-muted">${Utils.sanitize(client.address || '')}</div>
          ${client.gstin ? `<div class="font-mono text-xs">GSTIN: ${Utils.sanitize(client.gstin)}</div>` : ''}
          ${client.email ? `<div>${Utils.sanitize(client.email)}</div>` : ''}
          ${client.phone ? `<div>${Utils.sanitize(client.phone)}</div>` : ''}
        </div>
      `;
    }
  },

  // ─── LINE ITEMS ──────────────────────────────────────────
  addEmptyRow(render = false, rowType = 'service') {
    this.lineItems.push({
      id:          `LI-${Date.now()}-${Math.random().toString(36).substr(2,4)}`,
      rowType:     'service',
      name:        '',
      description: '',
      qty:         1,
      rate:        0,
      taxRate:     18,
      govtFee:     0,
    });
    if (render) { this.renderLineItems(); this.recalculate(); }
  },

  addServiceFromPicker(serviceId) {
    if (!serviceId) return;
    const svc = Storage.getServiceById(serviceId);
    if (!svc) return;
    this.lineItems.push({
      id:          `LI-${Date.now()}-${Math.random().toString(36).substr(2,4)}`,
      rowType:     'service',
      name:        svc.name,
      description: svc.description || '',
      qty:         1,
      rate:        svc.price,
      taxRate:     svc.taxRate,
      govtFee:     0,
    });
    this.renderLineItems();
    this.recalculate();
    const picker = Utils.el('service-picker');
    if (picker) picker.value = '';
  },

  deleteRow(idx) {
    this.lineItems.splice(idx, 1);
    if (this.lineItems.length === 0) this.addEmptyRow();
    this.renderLineItems();
    this.recalculate();
  },

  duplicateRow(idx) {
    const row = { ...this.lineItems[idx], id: `LI-${Date.now()}` };
    this.lineItems.splice(idx + 1, 0, row);
    this.renderLineItems();
    this.recalculate();
  },

  moveRow(idx, dir) {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= this.lineItems.length) return;
    [this.lineItems[idx], this.lineItems[newIdx]] = [this.lineItems[newIdx], this.lineItems[idx]];
    this.renderLineItems();
    this.recalculate();
  },

  updateRow(idx, field, value) {
    if (!this.lineItems[idx]) return;
    const numFields = ['qty', 'rate', 'taxRate', 'govtFee'];
    this.lineItems[idx][field] = numFields.includes(field) ? parseFloat(value) || 0 : value;
    this.recalculate();
    // Update the amount cell live
    const amountEl = document.querySelector(`[data-row="${idx}"][data-field="amount"]`);
    if (amountEl) {
      const item = this.lineItems[idx];
      const base    = item.qty * item.rate;
      const tax     = base * (item.taxRate || 0) / 100;
      const govtFee = item.govtFee || 0;
      amountEl.textContent = Utils.formatCurrency(base + tax + govtFee);
    }
  },

  renderLineItems() {
    const tbody = Utils.el('line-items-body');
    if (!tbody) return;
    tbody.innerHTML = this.lineItems.map((item, idx) => {
      const base    = (item.qty || 0) * (item.rate || 0);
      const tax     = base * (item.taxRate || 0) / 100;
      const govtFee = item.govtFee || 0;
      const rowTotal = base + tax + govtFee;

      return `
      <tr id="row-${idx}">
        <td class="text-muted text-sm">${idx + 1}</td>
        <td>
          <input type="text" class="form-input text-sm mb-1" placeholder="Service name"
            value="${Utils.sanitize(item.name)}"
            onchange="Documents.updateRow(${idx},'name',this.value)"
            oninput="Documents.updateRow(${idx},'name',this.value)">
          <input type="text" class="form-input text-xs text-muted" placeholder="Description (optional)"
            value="${Utils.sanitize(item.description)}"
            onchange="Documents.updateRow(${idx},'description',this.value)"
            oninput="Documents.updateRow(${idx},'description',this.value)">
        </td>
        <td><input type="number" class="form-input text-sm" min="0.01" step="0.01"
          value="${item.qty}"
          onchange="Documents.updateRow(${idx},'qty',this.value);Documents.recalculate()"
          oninput="Documents.updateRow(${idx},'qty',this.value);Documents.recalculate()"></td>
        <td><input type="number" class="form-input text-sm" min="0" step="0.01"
          value="${item.rate}"
          onchange="Documents.updateRow(${idx},'rate',this.value);Documents.recalculate()"
          oninput="Documents.updateRow(${idx},'rate',this.value);Documents.recalculate()"></td>
        <td>
          <select class="form-input form-select text-sm" onchange="Documents.updateRow(${idx},'taxRate',this.value);Documents.recalculate()">
            <option value="0"  ${item.taxRate === 0  ? 'selected':''}>0%</option>
            <option value="5"  ${item.taxRate === 5  ? 'selected':''}>5%</option>
            <option value="12" ${item.taxRate === 12 ? 'selected':''}>12%</option>
            <option value="18" ${item.taxRate === 18 ? 'selected':''}>18%</option>
            <option value="28" ${item.taxRate === 28 ? 'selected':''}>28%</option>
          </select>
        </td>
        <td>
          <input type="number" class="form-input text-sm" min="0" step="1" placeholder="0"
            value="${govtFee > 0 ? govtFee : ''}"
            style="border-color:#BFDBFE; background:#EFF6FF;"
            title="Govt / statutory filing fee — not taxed"
            onchange="Documents.updateRow(${idx},'govtFee',this.value);Documents.recalculate()"
            oninput="Documents.updateRow(${idx},'govtFee',this.value);Documents.recalculate()">
        </td>
        <td class="font-mono text-sm font-semibold" data-row="${idx}" data-field="amount">${Utils.formatCurrency(rowTotal)}</td>
        <td>
          <div class="flex gap-2">
            <button onclick="Documents.duplicateRow(${idx})" class="icon-btn text-xs" title="Duplicate">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            </button>
            <button onclick="Documents.deleteRow(${idx})" class="icon-btn text-red-500 text-xs" title="Delete">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </div>
        </td>
      </tr>`;
    }).join('');
  },

  setGSTMode(mode) {
    this.gstMode = mode;
    const intraBtn = Utils.el('gst-intra');
    const interBtn = Utils.el('gst-inter');
    if (intraBtn) intraBtn.className = `btn ${mode === 'intra' ? 'btn-primary' : 'btn-outline'} flex-1 text-sm`;
    if (interBtn) interBtn.className = `btn ${mode === 'inter' ? 'btn-primary' : 'btn-outline'} flex-1 text-sm`;
    this.recalculate();
  },

  recalculate() {
    let profSubtotal  = 0;   // sum of (qty × rate) — professional fees
    let govtFeesTotal = 0;   // sum of govtFee fields — not taxed
    let totalTax      = 0;
    const taxGroups   = {};

    this.lineItems.forEach(item => {
      const base    = (item.qty || 0) * (item.rate || 0);
      const gFee    = item.govtFee || 0;
      const tax     = base * ((item.taxRate || 0) / 100);
      profSubtotal  += base;
      govtFeesTotal += gFee;
      totalTax      += tax;

      if (item.taxRate > 0 && tax > 0) {
        if (!taxGroups[item.taxRate]) taxGroups[item.taxRate] = { base: 0, tax: 0 };
        taxGroups[item.taxRate].base += base;
        taxGroups[item.taxRate].tax  += tax;
      }
    });

    const beforeRound = profSubtotal + govtFeesTotal + totalTax;
    const roundOff    = Math.round(beforeRound) - beforeRound;
    const grandTotal  = beforeRound + roundOff;

    const set = (id, val) => { const el = Utils.el(id); if (el) el.textContent = val; };
    set('sum-subtotal', Utils.formatCurrency(profSubtotal));
    set('sum-govtfee',  Utils.formatCurrency(govtFeesTotal));
    set('sum-roundoff', (roundOff >= 0 ? '+' : '') + Utils.formatCurrency(Math.abs(roundOff)));
    set('sum-grand',    Utils.formatCurrency(grandTotal));
    set('sum-words',    Utils.numberToWords(grandTotal));

    // Show/hide govt fee row in summary
    const govtFeeRow = Utils.el('sum-govtfee-row');
    if (govtFeeRow) govtFeeRow.style.display = govtFeesTotal > 0 ? 'flex' : 'none';

    const gstLines = Utils.el('gst-lines');
    if (gstLines) {
      let html = '';
      Object.entries(taxGroups).forEach(([rate, g]) => {
        if (parseFloat(rate) === 0 || g.tax === 0) return;
        if (this.gstMode === 'intra') {
          html += `<div class="flex justify-between py-0.5 text-muted"><span>CGST @ ${parseFloat(rate)/2}%</span><span class="font-mono">${Utils.formatCurrency(g.tax/2)}</span></div>`;
          html += `<div class="flex justify-between py-0.5 text-muted"><span>SGST @ ${parseFloat(rate)/2}%</span><span class="font-mono">${Utils.formatCurrency(g.tax/2)}</span></div>`;
        } else {
          html += `<div class="flex justify-between py-0.5 text-muted"><span>IGST @ ${rate}%</span><span class="font-mono">${Utils.formatCurrency(g.tax)}</span></div>`;
        }
      });
      gstLines.innerHTML = html || '<div class="text-muted text-xs">No taxable items</div>';
    }

    this._totals = { subtotal: profSubtotal, govtFeesTotal, taxAmount: totalTax, roundOff, grandTotal, taxGroups };
  },

  // ─── SAVE DOCUMENT ───────────────────────────────────────
  saveDocument() {
    const clientId = Utils.el('doc-client')?.value;
    if (!clientId) { Utils.showToast('Please select a client.', 'error'); return; }
    const hasItems = this.lineItems.some(i => i.name.trim());
    if (!hasItems) { Utils.showToast('Please add at least one service.', 'error'); return; }

    const client = Storage.getClientById(clientId);
    const docType = Utils.el('doc-type')?.value || 'quotation';

    // Fetch existing doc so we can PRESERVE docNumber, createdAt etc. on edits
    const existingDoc = this.editingId ? Storage.getDocumentById(this.editingId) : null;

    const doc = {
      id:            this.editingId || null,
      docNumber:     existingDoc?.docNumber || null,   // ← CRITICAL: preserve on edit
      createdAt:     existingDoc?.createdAt || null,   // ← preserve original creation date
      type: docType,
      clientId,
      clientName:    client?.name || '',
      clientCompany: client?.company || '',
      date:          Utils.el('doc-date')?.value || Utils.todayISO(),
      dueDate:       Utils.el('doc-due')?.value || '',
      reference:     (Utils.el('doc-ref')?.value || '').trim().replace(/^undefined$/i, ''),
      remarks:       Utils.el('doc-remarks')?.value || '',
      terms:         Utils.el('doc-terms')?.value || '',
      internalNotes: Utils.el('doc-internal')?.value || '',
      lineItems:     this.lineItems.filter(i => i.name.trim()),
      totals:        this._totals || {},
      gstMode:       this.gstMode,
      status:        Utils.el('doc-status')?.value || 'draft',
    };

    // Auto-assign reference = docNumber if no reference set (for existing docs)
    if (!doc.reference && existingDoc?.docNumber) {
      doc.reference = existingDoc.docNumber;
    }

    const saved = Storage.saveDocument(doc);
    this.editingId = saved.id;

    // For new docs: if reference was blank, set reference = docNumber and re-save
    if (!saved.reference && saved.docNumber) {
      saved.reference = saved.docNumber;
      Storage.saveDocument(saved);
    }

    // Sync to Google Sheets
    GoogleSheets.sync(saved);

    Utils.showToast(`${Utils.docTypeName(docType)} saved successfully!`, 'success');
    this.render();

    // Show preview option
    setTimeout(() => {
      if (confirm('Document saved! Would you like to preview it now?')) {
        this.preview(saved.id);
      } else {
        App.navigate('documents');
      }
    }, 500);
  },

  saveDraft() {
    const clientId = Utils.el('doc-client')?.value || '';
    Storage.saveDraft('builder', {
      lineItems: this.lineItems,
      gstMode: this.gstMode,
      clientId,
      type: Utils.el('doc-type')?.value,
      date: Utils.el('doc-date')?.value,
    });
    Utils.showToast('Draft saved.', 'info');
  },

  // ─── CONVERSION ──────────────────────────────────────────
  convert(id) {
    const doc = Storage.getDocumentById(id);
    if (!doc) return;
    const nextType = doc.type === 'quotation' ? 'proforma' : 'invoice';
    const nextLabel = Utils.docTypeName(nextType);
    Utils.showModal(
      `Convert to ${nextLabel}`,
      `<p>Convert <strong>${doc.docNumber}</strong> to a <strong>${nextLabel}</strong>? A new document will be created with the same client and services.</p>`,
      () => {
        const newDoc = { ...doc, id: null, docNumber: null, type: nextType, status: 'draft', createdAt: null, sourceDocId: doc.id, sourceDocNumber: doc.docNumber };
        const saved = Storage.saveDocument(newDoc);
        // Mark original as converted
        doc.status = 'converted';
        doc.convertedTo = saved.id;
        Storage.saveDocument(doc);
        Utils.showToast(`Converted to ${nextLabel}: ${saved.docNumber}`, 'success');
        this.render();
      },
      `Convert to ${nextLabel}`, 'btn-primary'
    );
  },

  // ─── PREVIEW ─────────────────────────────────────────────
  preview(id) {
    const doc = Storage.getDocumentById(id);
    if (!doc) { Utils.showToast('Document not found.', 'error'); return; }
    const html = Templates.generateDocumentHTML(doc);
    const previewContainer = Utils.el('preview-view');
    if (!previewContainer) return;
    App.navigate('preview');
    previewContainer.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Preview: ${doc.docNumber}</h1>
          <p class="page-subtitle">${Utils.docTypeName(doc.type)} · ${Utils.formatDate(doc.date)}</p>
        </div>
        <div class="flex gap-2">
          <button onclick="App.navigate('documents')" class="btn btn-secondary">← Back</button>
          <button onclick="Documents.openBuilder('${doc.id}')" class="btn btn-outline">Edit</button>
          <button onclick="PDFExport.download('${doc.id}')" class="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            Download Image
          </button>
          <button onclick="PDFExport.print('${doc.id}')" class="btn btn-outline">🖨 Print</button>
          <!-- Share dropdown -->
          <div style="position:relative; display:inline-block;" id="share-menu-wrap">
            <button onclick="Documents.toggleShareMenu()" class="btn btn-outline" style="background:#25D366; color:#fff; border-color:#25D366; gap:6px;">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.532 5.845L.057 23.5l5.805-1.525A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.015-1.375l-.36-.213-3.444.904.921-3.352-.233-.374A9.818 9.818 0 1112 21.818z"/></svg>
              Share
            </button>
            <div id="share-menu" style="display:none; position:absolute; right:0; top:44px; background:#fff; border:1px solid #E5E7EB; border-radius:12px; box-shadow:0 8px 32px rgba(0,0,0,0.15); min-width:200px; z-index:1000; overflow:hidden;">
              <button onclick="Documents.shareDocument('${doc.id}', 'whatsapp')" style="display:flex; align-items:center; gap:10px; width:100%; padding:12px 16px; background:none; border:none; cursor:pointer; font-size:13px; font-weight:600; color:#111827;" onmouseover="this.style.background='#F0FDF4'" onmouseout="this.style.background='none'">
                <span style="font-size:18px;">📱</span> Share via WhatsApp
              </button>
              <div style="height:1px; background:#F3F4F6; margin:0 12px;"></div>
              <button onclick="Documents.shareDocument('${doc.id}', 'email')" style="display:flex; align-items:center; gap:10px; width:100%; padding:12px 16px; background:none; border:none; cursor:pointer; font-size:13px; font-weight:600; color:#111827;" onmouseover="this.style.background='#EFF6FF'" onmouseout="this.style.background='none'">
                <span style="font-size:18px;">📧</span> Share via Email
              </button>
            </div>
          </div>
      </div>
      <div id="document-preview-area" class="mt-6 bg-white shadow-2xl rounded-2xl overflow-hidden mx-auto" style="max-width:820px">
        ${html}
      </div>
    `;
  },

  confirmDelete(id, docNumber) {
    Utils.showModal(
      'Delete Document',
      `<p>Permanently delete <strong>${docNumber}</strong>? This cannot be undone.</p>`,
      () => { Storage.deleteDocument(id); this.render(); Utils.showToast('Document deleted.', 'info'); },
      'Delete', 'btn-danger'
    );
  },

  // ─── DUPLICATE DOCUMENT ───────────────────────────────────────
  duplicateDocument(id) {
    const original = Storage.getDocumentById(id);
    if (!original) { Utils.showToast('Document not found.', 'error'); return; }

    // Deep-copy everything, reset identity + status
    const duplicate = JSON.parse(JSON.stringify(original));
    duplicate.id              = null;
    duplicate.docNumber       = null;
    duplicate.createdAt       = null;
    duplicate.updatedAt       = null;
    duplicate.status          = 'draft';
    duplicate.sourceDocId     = original.id;
    duplicate.sourceDocNumber = original.docNumber;

    // Save as new document (gets new number)
    const saved = Storage.saveDocument(duplicate);
    Utils.showToast(`✓ Duplicated → ${saved.docNumber} — opening editor…`, 'success');

    // Open builder with new doc so user can edit before finalising
    setTimeout(() => this.openBuilder(saved.id), 350);
  },

  // ─── SHARE ───────────────────────────────────────────────────
  toggleShareMenu() {
    const menu = Utils.el('share-menu');
    if (menu) menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    setTimeout(() => {
      const close = (e) => {
        if (!Utils.el('share-menu-wrap')?.contains(e.target)) {
          const m = Utils.el('share-menu'); if (m) m.style.display = 'none';
          document.removeEventListener('click', close);
        }
      };
      document.addEventListener('click', close);
    }, 50);
  },

  async shareDocument(id, method) {
    const doc      = Storage.getDocumentById(id);
    if (!doc) return;
    const settings = Storage.getSettings();
    const client   = Storage.getClientById(doc.clientId) || {};
    const total    = Utils.formatCurrency(doc.totals?.grandTotal || 0);
    const type     = Utils.docTypeName(doc.type);
    const date     = Utils.formatDate(doc.date);

    // Hide menu immediately
    const menu = Utils.el('share-menu'); if (menu) menu.style.display = 'none';

    // Build Messages
    let subject = '';
    let msg = '';
    if (method === 'whatsapp') {
      msg = [
        `*${settings.companyName}*`,
        `${type}: *${doc.docNumber}*`,
        `Date: ${date}`,
        `Client: ${client.name || ''}${client.company ? ' (' + client.company + ')' : ''}`,
        doc.remarks ? `Subject: ${doc.remarks}` : '',
        `Amount: *${total}*`,
        '',
        `_${settings.tagline}_`,
        `📞 ${settings.phone}  |  ✉️ ${settings.email}`,
      ].filter(Boolean).join('\n');
    } else {
      subject = `${type} ${doc.docNumber} from ${settings.companyName}`;
      msg = [
        `Dear ${client.name || 'Sir/Madam'},`, '',
        `Please find attached the details of your ${type.toLowerCase()}.`, '',
        `Document No.: ${doc.docNumber}`,
        `Date: ${date}`,
        doc.dueDate ? `Valid Until / Due: ${Utils.formatDate(doc.dueDate)}` : '',
        doc.remarks ? `Subject: ${doc.remarks}` : '',
        `Grand Total: ${total}`, '',
        `Warm regards,`,
        `${settings.signatory || settings.companyName}`,
        `${settings.companyName}`,
        `📞 ${settings.phone}  |  ✉️ ${settings.email}`,
        settings.website ? `🌐 ${settings.website}` : '',
      ].filter(l => l !== undefined).join('\n');
    }

    Utils.showToast('Generating image for sharing…', 'info');

    try {
      // generateBlob now returns a PNG image blob
      const imgBlob = await PDFExport.generateBlob(doc);
      const filename = `${doc.docNumber}.png`;
      const file = new File([imgBlob], filename, { type: 'image/png' });

      // Try native share API (mobile — shares image file directly)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: doc.docNumber, text: msg, files: [file] });
        Utils.showToast('Shared successfully!', 'success');
      } else {
        // Desktop fallback: download image, then open WhatsApp/Email
        const url = URL.createObjectURL(imgBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);

        Utils.showToast('Image downloaded! Attach it to your message.', 'info');

        setTimeout(() => {
          if (method === 'whatsapp') {
            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
          } else {
            window.open(`mailto:${client.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(msg)}`, '_blank');
          }
        }, 800);
      }
    } catch (e) {
      console.error('Sharing failed:', e);
      Utils.showToast('Failed to generate image for sharing.', 'error');
    }
  },
};

window.Documents = Documents;
