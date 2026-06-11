/**
 * I-Pro Solutions - Services Module v3.0
 * Service Master CRUD + Duplicate + CSV Import/Export, auto-refresh builder
 */

const Services = {
  searchTerm: '',
  filterCategory: '',

  /* CSV column order (must match template) */
  CSV_COLUMNS: ['name', 'description', 'category', 'price', 'taxRate'],

  getCategories() {
    const services = Storage.getServices();
    return [...new Set(services.map(s => s.category).filter(Boolean))].sort();
  },

  render() {
    const services = Storage.getServices();
    let filtered = services;
    if (this.searchTerm) {
      const q = this.searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q) ||
        (s.category || '').toLowerCase().includes(q)
      );
    }
    if (this.filterCategory) {
      filtered = filtered.filter(s => s.category === this.filterCategory);
    }

    const categories = this.getCategories();
    const container  = Utils.el('services-view');
    if (!container) return;

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Service Master</h1>
          <p class="page-subtitle">${services.length} service${services.length !== 1 ? 's' : ''} configured</p>
        </div>
        <div class="flex gap-2 flex-wrap">
          <!-- CSV Upload -->
          <label class="btn btn-outline cursor-pointer text-sm" id="csv-upload-btn" title="Import services from CSV">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
            Import CSV
            <input type="file" accept=".csv,text/csv" class="hidden" onchange="Services.importCSV(this)">
          </label>

          <!-- CSV Download Template -->
          <button onclick="Services.downloadCSVTemplate()" class="btn btn-outline text-sm" title="Download blank CSV template">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            CSV Template
          </button>

          <!-- Export All as CSV -->
          <button onclick="Services.exportCSV()" class="btn btn-outline text-sm" title="Export all services as CSV">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Export CSV
          </button>

          <!-- Add New -->
          <button onclick="Services.openForm()" class="btn btn-primary text-sm" id="add-service-btn">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Add Service
          </button>
        </div>
      </div>

      <!-- CSV Format Info Banner -->
      <div id="csv-info" class="card mb-4" style="border-left:4px solid #2563EB; background:#EFF6FF; padding:14px 20px; display:none;">
        <div class="flex items-start justify-between">
          <div>
            <p class="font-semibold text-sm" style="color:#1D4ED8;">CSV Format Guide</p>
            <p class="text-xs mt-1" style="color:#3B82F6; font-family:monospace;">
              name, description, category, price, taxRate<br>
              "Trademark Registration","Filing under TM Act",Trademark,7500,18
            </p>
            <p class="text-xs mt-2" style="color:#6B7280;">
              Categories: Trademark · Copyright · Patent · Design · ISO · MSME · Startup · Legal · IP · Other<br>
              Tax Rates: 0 · 5 · 12 · 18 · 28
            </p>
          </div>
          <button onclick="document.getElementById('csv-info').style.display='none'" class="text-xs text-muted ml-4">✕</button>
        </div>
      </div>

      <div class="card mb-6">
        <div class="flex gap-3 flex-wrap">
          <div class="search-box flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="search-icon w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
            </svg>
            <input type="text" id="service-search" placeholder="Search services…" class="search-input"
              value="${this.searchTerm}" oninput="Services.search(this.value)">
          </div>
          <select class="form-input w-auto" onchange="Services.filterBy(this.value)">
            <option value="">All Categories</option>
            ${categories.map(c => `<option value="${c}" ${c === this.filterCategory ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
      </div>

      ${filtered.length === 0 ? this.emptyState() : `
      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Category</th>
                <th>Rate (excl. tax)</th>
                <th>GST %</th>
                <th>Rate (incl. GST)</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(s => this.serviceRow(s)).join('')}
            </tbody>
          </table>
        </div>
      </div>`}
    `;
  },

  serviceRow(s) {
    const incl    = s.price * (1 + s.taxRate / 100);
    const safeName = (s.name || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    return `
      <tr>
        <td>
          <div class="font-semibold text-primary">${Utils.sanitize(s.name)}</div>
          <div class="text-sm text-muted max-w-xs truncate">${Utils.sanitize(s.description || '—')}</div>
        </td>
        <td><span class="badge badge-info">${Utils.sanitize(s.category || '—')}</span></td>
        <td class="font-mono">${Utils.formatCurrency(s.price)}</td>
        <td><span class="badge badge-warning">${s.taxRate}%</span></td>
        <td class="font-mono font-semibold">${Utils.formatCurrency(incl)}</td>
        <td>
          <div class="flex items-center justify-end gap-2">
            <!-- Edit -->
            <button onclick="Services.openForm('${s.id}')" class="icon-btn" title="Edit">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </button>
            <!-- Duplicate -->
            <button onclick="Services.duplicate('${s.id}')" class="icon-btn text-blue-500" title="Duplicate service">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
            </button>
            <!-- Delete -->
            <button onclick="Services.confirmDelete('${s.id}', '${safeName}')" class="icon-btn text-red-500" title="Delete">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  },

  emptyState() {
    return `
      <div class="empty-state">
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
        </div>
        <h3 class="empty-title">No services found</h3>
        <p class="empty-desc">Add services manually or import from CSV.</p>
        <div class="flex gap-3 mt-4">
          <button onclick="Services.openForm()" class="btn btn-primary">Add Service</button>
          <button onclick="Services.downloadCSVTemplate()" class="btn btn-outline">Download CSV Template</button>
        </div>
      </div>
    `;
  },

  search(term) {
    this.searchTerm = term.toLowerCase();
    this.render();
  },

  filterBy(category) {
    this.filterCategory = category;
    this.render();
  },

  /* ─── ADD / EDIT FORM ────────────────────────────────────────── */
  openForm(id = null) {
    const svc        = id ? Storage.getServiceById(id) : null;
    const title      = svc ? 'Edit Service' : 'Add New Service';
    const categories = ['Trademark','Copyright','Patent','Design','ISO','MSME','Startup','Legal','IP','Other'];

    const formHTML = `
      <form id="service-form" class="grid grid-cols-1 gap-4 sm:grid-cols-2" onsubmit="Services.save(event)">
        <div class="form-group sm:col-span-2">
          <label class="form-label">Service Name <span class="text-red-500">*</span></label>
          <input type="text" id="sf-name" class="form-input" value="${Utils.sanitize(svc?.name || '')}"
            placeholder="e.g. Trademark Registration" required>
        </div>
        <div class="form-group sm:col-span-2">
          <label class="form-label">Description</label>
          <textarea id="sf-desc" class="form-input form-textarea" rows="3"
            placeholder="Brief description of the service…">${Utils.sanitize(svc?.description || '')}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Unit Price (₹) <span class="text-red-500">*</span></label>
          <input type="number" id="sf-price" class="form-input" value="${svc?.price || ''}"
            placeholder="7500" min="0" step="0.01" required>
        </div>
        <div class="form-group">
          <label class="form-label">GST Rate (%) <span class="text-red-500">*</span></label>
          <select id="sf-tax" class="form-input form-select" required>
            <option value="0"  ${svc?.taxRate === 0  ? 'selected' : ''}>0% (Exempt)</option>
            <option value="5"  ${svc?.taxRate === 5  ? 'selected' : ''}>5%</option>
            <option value="12" ${svc?.taxRate === 12 ? 'selected' : ''}>12%</option>
            <option value="18" ${(!svc || svc?.taxRate === 18) ? 'selected' : ''}>18%</option>
            <option value="28" ${svc?.taxRate === 28 ? 'selected' : ''}>28%</option>
          </select>
        </div>
        <div class="form-group sm:col-span-2">
          <label class="form-label">Category</label>
          <select id="sf-category" class="form-input form-select">
            ${categories.map(c => `<option value="${c}" ${c === (svc?.category || 'Trademark') ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <input type="hidden" id="sf-id" value="${svc?.id || ''}">
        <div class="sm:col-span-2 flex justify-end gap-3 pt-2">
          <button type="button" onclick="App.closeSlidePanel()" class="btn btn-secondary">Cancel</button>
          <button type="submit" class="btn btn-primary">${svc ? 'Update Service' : 'Save Service'}</button>
        </div>
      </form>
    `;
    App.openSlidePanel(title, formHTML);
  },

  save(e) {
    e.preventDefault();
    const id = Utils.el('sf-id')?.value;
    const service = {
      id:          id || null,
      name:        Utils.el('sf-name').value.trim(),
      description: Utils.el('sf-desc').value.trim(),
      price:       parseFloat(Utils.el('sf-price').value),
      taxRate:     parseInt(Utils.el('sf-tax').value),
      category:    Utils.el('sf-category').value,
    };
    Storage.saveService(service);
    App.closeSlidePanel();
    this.render();
    if (App.currentView === 'builder' && window.Documents) {
      Documents.renderBuilder(); // Update dropdowns instantly
    }
    Utils.showToast(id ? 'Service updated!' : 'Service added!', 'success');
  },

  /* ─── DUPLICATE ─────────────────────────────────────────────── */
  duplicate(id) {
    const svc = Storage.getServiceById(id);
    if (!svc) return;
    const copy = {
      ...svc,
      id:   null,
      name: svc.name + ' (Copy)',
      createdAt: new Date().toISOString(),
    };
    Storage.saveService(copy);
    this.render();
    Utils.showToast(`"${svc.name}" duplicated!`, 'success');
  },

  /* ─── DELETE ─────────────────────────────────────────────────── */
  confirmDelete(id, name) {
    Utils.showModal(
      'Delete Service',
      `<p>Delete <strong>${name}</strong>? This cannot be undone.</p>`,
      () => { Storage.deleteService(id); this.render(); Utils.showToast('Service deleted.', 'info'); },
      'Delete', 'btn-danger'
    );
  },

  /* ─── CSV EXPORT ─────────────────────────────────────────────── */
  exportCSV() {
    const services = Storage.getServices();
    const header   = 'name,description,category,price,taxRate';
    const rows     = services.map(s =>
      [s.name, s.description || '', s.category || '', s.price, s.taxRate]
        .map(v => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    this._downloadCSV([header, ...rows].join('\r\n'), 'ipro-services.csv');
    Utils.showToast(`Exported ${services.length} services.`, 'success');
  },

  /* ─── CSV TEMPLATE ───────────────────────────────────────────── */
  downloadCSVTemplate() {
    const lines = [
      'name,description,category,price,taxRate',
      '"Trademark Registration","Application filing under Trade Marks Act 1999",Trademark,7500,18',
      '"Copyright Registration","Registration of literary/artistic works",Copyright,4500,18',
      '"Patent Filing (Provisional)","Provisional specification filing",Patent,15000,18',
      '"ISO Certification Consultancy","End-to-end ISO 9001 certification support",ISO,20000,18',
      '"MSME Registration","Udyam portal registration",MSME,1500,18',
      '"Legal Notice","IP infringement legal notice drafting",Legal,5000,18',
    ];
    this._downloadCSV(lines.join('\r\n'), 'ipro-services-template.csv');
    Utils.showToast('CSV template downloaded!', 'success');

    // Show the format banner
    const info = document.getElementById('csv-info');
    if (info) info.style.display = 'block';
  },

  /* ─── CSV IMPORT ─────────────────────────────────────────────── */
  importCSV(input) {
    const file = input.files[0];
    if (!file) return;
    input.value = ''; // reset so same file can be re-imported

    const reader = new FileReader();
    reader.onload = (e) => {
      const text   = e.target.result;
      const result = this._parseCSV(text);

      if (result.errors.length > 0 && result.rows.length === 0) {
        Utils.showToast(`CSV error: ${result.errors[0]}`, 'error');
        return;
      }

      if (result.rows.length === 0) {
        Utils.showToast('No valid rows found in CSV.', 'warning');
        return;
      }

      /* Show preview modal */
      const preview = result.rows.slice(0, 5).map(r =>
        `<tr>
          <td style="padding:6px 10px; border-bottom:1px solid #E5E7EB; font-size:13px;">${Utils.sanitize(r.name)}</td>
          <td style="padding:6px 10px; border-bottom:1px solid #E5E7EB; font-size:13px;">${Utils.sanitize(r.category)}</td>
          <td style="padding:6px 10px; border-bottom:1px solid #E5E7EB; font-size:13px; text-align:right;">₹${r.price.toLocaleString('en-IN')}</td>
          <td style="padding:6px 10px; border-bottom:1px solid #E5E7EB; font-size:13px; text-align:center;">${r.taxRate}%</td>
        </tr>`
      ).join('');

      const errorNote = result.errors.length
        ? `<p class="mt-2" style="color:#EF4444;font-size:12px;">⚠ ${result.errors.length} row(s) skipped due to errors.</p>` : '';

      Utils.showModal(
        `Import ${result.rows.length} Service${result.rows.length !== 1 ? 's' : ''}`,
        `<p style="font-size:13px;color:#6B7280;margin-bottom:12px;">
          Preview (first 5 shown)${result.rows.length > 5 ? ` of ${result.rows.length}` : ''}:
        </p>
        <div style="overflow-x:auto;border:1px solid #E5E7EB;border-radius:8px;">
          <table style="width:100%;border-collapse:collapse;">
            <thead style="background:#F9FAFB;">
              <tr>
                <th style="padding:8px 10px;text-align:left;font-size:11px;color:#6B7280;">Name</th>
                <th style="padding:8px 10px;text-align:left;font-size:11px;color:#6B7280;">Category</th>
                <th style="padding:8px 10px;text-align:right;font-size:11px;color:#6B7280;">Price</th>
                <th style="padding:8px 10px;text-align:center;font-size:11px;color:#6B7280;">GST</th>
              </tr>
            </thead>
            <tbody>${preview}</tbody>
          </table>
        </div>
        ${errorNote}`,
        () => {
          let imported = 0;
          result.rows.forEach(row => {
            Storage.saveService({ id: null, ...row });
            imported++;
          });
          this.render();
          Utils.showToast(`✓ ${imported} services imported!`, 'success');
          Storage.logActivity(`Imported ${imported} services via CSV`);
        },
        `Import ${result.rows.length} Services`,
        'btn-primary'
      );
    };
    reader.readAsText(file, 'UTF-8');
  },

  /* ─── CSV PARSER ─────────────────────────────────────────────── */
  _parseCSV(text) {
    const lines  = text.split(/\r?\n/).filter(l => l.trim());
    const rows   = [];
    const errors = [];
    const validTaxRates = [0, 5, 12, 18, 28];
    const validCategories = ['Trademark','Copyright','Patent','Design','ISO','MSME','Startup','Legal','IP','Other'];

    /* Detect and skip header row */
    const startIdx = lines[0]?.toLowerCase().includes('name') ? 1 : 0;

    for (let i = startIdx; i < lines.length; i++) {
      const cols = this._splitCSVLine(lines[i]);
      if (cols.length < 4) {
        errors.push(`Row ${i + 1}: not enough columns (got ${cols.length}, need 5)`);
        continue;
      }

      const [name, description, category, priceStr, taxStr] = cols.map(c => c.trim());

      if (!name) { errors.push(`Row ${i + 1}: name is empty`); continue; }

      const price   = parseFloat(priceStr) || 0;
      const taxRate = parseInt(taxStr) || 18;

      if (price < 0) { errors.push(`Row ${i + 1}: invalid price`); continue; }

      const resolvedCategory = validCategories.find(
        vc => vc.toLowerCase() === (category || '').toLowerCase()
      ) || 'Other';

      const resolvedTax = validTaxRates.includes(taxRate) ? taxRate : 18;

      rows.push({
        name:        name.substring(0, 200),
        description: (description || '').substring(0, 500),
        category:    resolvedCategory,
        price,
        taxRate:     resolvedTax,
      });
    }

    return { rows, errors };
  },

  /* RFC 4180 CSV line splitter (handles quoted commas & embedded quotes) */
  _splitCSVLine(line) {
    const result = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch   = line[i];
      const next = line[i + 1];
      if (inQ) {
        if (ch === '"' && next === '"') { cur += '"'; i++; }
        else if (ch === '"') { inQ = false; }
        else { cur += ch; }
      } else {
        if (ch === '"') { inQ = true; }
        else if (ch === ',') { result.push(cur); cur = ''; }
        else { cur += ch; }
      }
    }
    result.push(cur);
    return result;
  },

  /* ─── INTERNAL: download a CSV string ───────────────────────── */
  _downloadCSV(csvString, filename) {
    const BOM  = '\uFEFF';  // BOM for Excel UTF-8 compatibility
    const blob = new Blob([BOM + csvString], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};

window.Services = Services;
