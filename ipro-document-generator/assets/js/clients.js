/**
 * I-Pro Solutions - Clients Module v3.0
 * Client Master CRUD, search, state selector, auto-refresh builder
 */

const Clients = {
  searchTerm: '',

  render() {
    const clients = Storage.getClients();
    const filtered = this.searchTerm
      ? clients.filter(c =>
          (c.name || '').toLowerCase().includes(this.searchTerm) ||
          (c.company || '').toLowerCase().includes(this.searchTerm) ||
          (c.email || '').toLowerCase().includes(this.searchTerm) ||
          (c.phone || '').toLowerCase().includes(this.searchTerm)
        )
      : clients;

    const container = Utils.el('clients-view');
    if (!container) return;

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Client Master</h1>
          <p class="page-subtitle">${clients.length} client${clients.length !== 1 ? 's' : ''} registered</p>
        </div>
        <button onclick="Clients.openForm()" class="btn btn-primary" id="add-client-btn">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Add Client
        </button>
      </div>

      <div class="card mb-6">
        <div class="flex gap-3 flex-wrap">
          <div class="search-box flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="search-icon w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/></svg>
            <input type="text" id="client-search" placeholder="Search clients by name, company, email…" class="search-input" value="${this.searchTerm}" oninput="Clients.search(this.value)">
          </div>
        </div>
      </div>

      ${filtered.length === 0 ? this.emptyState() : `
      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Contact</th>
                <th>GST No.</th>
                <th>Documents</th>
                <th>Added</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(c => this.clientRow(c)).join('')}
            </tbody>
          </table>
        </div>
      </div>`}
    `;
  },

  clientRow(c) {
    const docs = Storage.getDocuments().filter(d => d.clientId === c.id);
    const color = Utils.generateColor(c.name || c.company || '?');
    return `
      <tr>
        <td>
          <div class="flex items-center gap-3">
            <div class="avatar" style="background:${color}">${Utils.initials(c.name || c.company)}</div>
            <div>
              <div class="font-semibold text-primary">${Utils.sanitize(c.name)}</div>
              <div class="text-sm text-muted">${Utils.sanitize(c.company || '—')}</div>
            </div>
          </div>
        </td>
        <td>
          <div class="text-sm">${Utils.sanitize(c.email || '—')}</div>
          <div class="text-sm text-muted">${Utils.sanitize(c.phone || '—')}</div>
        </td>
        <td><span class="font-mono text-xs">${Utils.sanitize(c.gstin || '—')}</span></td>
        <td><span class="badge badge-info">${docs.length} docs</span></td>
        <td class="text-sm text-muted">${Utils.timeAgo(c.createdAt)}</td>
        <td>
          <div class="flex items-center justify-end gap-2">
            <button onclick="Clients.openForm('${c.id}')" class="icon-btn" title="Edit">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
            <button onclick="Clients.newDocumentFor('${c.id}')" class="icon-btn text-blue-500" title="Create Document">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </button>
            <button onclick="Clients.confirmDelete('${c.id}', '${Utils.sanitize(c.name)}')" class="icon-btn text-red-500" title="Delete">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
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
          <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        </div>
        <h3 class="empty-title">${this.searchTerm ? 'No clients found' : 'No clients yet'}</h3>
        <p class="empty-desc">${this.searchTerm ? 'Try a different search term.' : 'Add your first client to get started.'}</p>
        ${!this.searchTerm ? `<button onclick="Clients.openForm()" class="btn btn-primary mt-4">Add First Client</button>` : ''}
      </div>
    `;
  },

  search(term) {
    this.searchTerm = term.toLowerCase();
    this.render();
    Utils.el('client-search')?.focus();
  },

  openForm(id = null) {
    const client = id ? Storage.getClientById(id) : null;
    const title = client ? 'Edit Client' : 'Add New Client';

    const formHTML = `
      <form id="client-form" class="grid grid-cols-1 gap-4 sm:grid-cols-2" onsubmit="Clients.save(event)">
        <div class="form-group">
          <label class="form-label">Contact Person Name <span class="text-red-500">*</span></label>
          <input type="text" id="cf-name" class="form-input" value="${client?.name || ''}" placeholder="e.g. Rajesh Patel" required>
        </div>
        <div class="form-group">
          <label class="form-label">Company / Business Name</label>
          <input type="text" id="cf-company" class="form-input" value="${client?.company || ''}" placeholder="e.g. Patel Enterprises Pvt Ltd">
        </div>
        <div class="form-group sm:col-span-2">
          <label class="form-label">Address <span class="text-red-500">*</span></label>
          <textarea id="cf-address" class="form-input form-textarea" rows="3" placeholder="Full billing address…" required>${client?.address || ''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">GST Number</label>
          <input type="text" id="cf-gstin" class="form-input font-mono" value="${client?.gstin || ''}" placeholder="27AAAAA0000A1Z5" maxlength="15">
        </div>
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input type="email" id="cf-email" class="form-input" value="${client?.email || ''}" placeholder="client@example.com">
        </div>
        <div class="form-group">
          <label class="form-label">Phone Number</label>
          <input type="tel" id="cf-phone" class="form-input" value="${client?.phone || ''}" placeholder="+91 98765 43210">
        </div>
        <div class="form-group">
          <label class="form-label">State (for GST)</label>
          <select id="cf-state" class="form-input form-select">
            ${this.getStateOptions(client?.state)}
          </select>
        </div>
        <div class="form-group sm:col-span-2">
          <label class="form-label">Notes</label>
          <textarea id="cf-notes" class="form-input form-textarea" rows="2" placeholder="Internal notes about this client…">${client?.notes || ''}</textarea>
        </div>
        <input type="hidden" id="cf-id" value="${client?.id || ''}">
        <div class="sm:col-span-2 flex justify-end gap-3 pt-2">
          <button type="button" onclick="App.closeSlidePanel()" class="btn btn-secondary">Cancel</button>
          <button type="submit" class="btn btn-primary">${client ? 'Update Client' : 'Save Client'}</button>
        </div>
      </form>
    `;

    App.openSlidePanel(title, formHTML);
  },

  getStateOptions(selected = 'Maharashtra') {
    const states = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh','Chandigarh','Puducherry'];
    return states.map(s => `<option value="${s}" ${s === selected ? 'selected' : ''}>${s}</option>`).join('');
  },

  save(e) {
    e.preventDefault();
    const id = Utils.el('cf-id')?.value;
    const client = {
      id: id || null,
      name: Utils.el('cf-name').value.trim(),
      company: Utils.el('cf-company').value.trim(),
      address: Utils.el('cf-address').value.trim(),
      gstin: Utils.el('cf-gstin').value.trim().toUpperCase(),
      email: Utils.el('cf-email').value.trim(),
      phone: Utils.el('cf-phone').value.trim(),
      state: Utils.el('cf-state').value,
      notes: Utils.el('cf-notes').value.trim(),
    };
    Storage.saveClient(client);
    App.closeSlidePanel();
    this.render();
    if (App.currentView === 'builder' && window.Documents) {
      Documents.renderBuilder(); // Update dropdowns instantly
    }
    Utils.showToast(id ? 'Client updated successfully!' : 'Client added successfully!', 'success');
  },

  confirmDelete(id, name) {
    Utils.showModal(
      'Delete Client',
      `<p>Are you sure you want to delete <strong>${name}</strong>? This action cannot be undone.</p>`,
      () => { Storage.deleteClient(id); this.render(); Utils.showToast('Client deleted.', 'info'); },
      'Delete',
      'btn-danger'
    );
  },

  newDocumentFor(clientId) {
    Documents.openBuilder(null, clientId);
  },
};

window.Clients = Clients;
