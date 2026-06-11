/**
 * I-Pro Solutions - Storage Module v3.0
 * Handles all LocalStorage CRUD operations
 * Keys: clients, services, documents, settings, logo, signature, QR code
 */

const STORAGE_KEYS = {
  CLIENTS:   'ipro_clients',
  SERVICES:  'ipro_services',
  DOCUMENTS: 'ipro_documents',
  SETTINGS:  'ipro_settings',
  COUNTERS:  'ipro_counters',
  ACTIVITY:  'ipro_activity',
  DRAFTS:    'ipro_drafts',
  LOGO:      'ipro_logo',
  SIGNATURE: 'ipro_signature',
  QR_CODE:   'ipro_qr_code',
  DARK_MODE: 'ipro_dark_mode',
};

const Storage = {
  // Generic get/set
  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error(`Storage.get error for key ${key}:`, e);
      return null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`Storage.set error for key ${key}:`, e);
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      return false;
    }
  },

  // ─── CLIENTS ───────────────────────────────────────────────
  getClients() {
    return this.get(STORAGE_KEYS.CLIENTS) || [];
  },

  saveClient(client) {
    const clients = this.getClients();
    if (!client.id) {
      client.id = this.generateId('CLT');
      client.createdAt = new Date().toISOString();
      clients.push(client);
    } else {
      const idx = clients.findIndex(c => c.id === client.id);
      if (idx !== -1) {
        client.updatedAt = new Date().toISOString();
        clients[idx] = client;
      }
    }
    this.set(STORAGE_KEYS.CLIENTS, clients);
    return client;
  },

  deleteClient(id) {
    const clients = this.getClients().filter(c => c.id !== id);
    this.set(STORAGE_KEYS.CLIENTS, clients);
  },

  getClientById(id) {
    return this.getClients().find(c => c.id === id) || null;
  },

  // ─── SERVICES ──────────────────────────────────────────────
  getServices() {
    return this.get(STORAGE_KEYS.SERVICES) || this.getDefaultServices();
  },

  saveService(service) {
    const services = this.getServices();
    if (!service.id) {
      service.id = this.generateId('SVC');
      service.createdAt = new Date().toISOString();
      services.push(service);
    } else {
      const idx = services.findIndex(s => s.id === service.id);
      if (idx !== -1) {
        service.updatedAt = new Date().toISOString();
        services[idx] = service;
      }
    }
    this.set(STORAGE_KEYS.SERVICES, services);
    return service;
  },

  deleteService(id) {
    const services = this.getServices().filter(s => s.id !== id);
    this.set(STORAGE_KEYS.SERVICES, services);
  },

  getServiceById(id) {
    return this.getServices().find(s => s.id === id) || null;
  },

  getDefaultServices() {
    return [
      { id: 'SVC001', name: 'Trademark Registration', description: 'Application filing for trademark registration under Trade Marks Act, 1999', price: 7500, taxRate: 18, category: 'Trademark', createdAt: new Date().toISOString() },
      { id: 'SVC002', name: 'Trademark Objection Reply', description: 'Drafting and filing of reply to trademark examination report/objection', price: 5000, taxRate: 18, category: 'Trademark', createdAt: new Date().toISOString() },
      { id: 'SVC003', name: 'Trademark Hearing', description: 'Representation at trademark hearing before Registrar of Trade Marks', price: 8000, taxRate: 18, category: 'Trademark', createdAt: new Date().toISOString() },
      { id: 'SVC004', name: 'Trademark Renewal', description: 'Renewal of registered trademark for a period of 10 years', price: 5000, taxRate: 18, category: 'Trademark', createdAt: new Date().toISOString() },
      { id: 'SVC005', name: 'Copyright Registration', description: 'Registration of copyright for literary, artistic, musical, or software works', price: 4500, taxRate: 18, category: 'Copyright', createdAt: new Date().toISOString() },
      { id: 'SVC006', name: 'Patent Filing (Provisional)', description: 'Filing of provisional patent application with complete specification', price: 15000, taxRate: 18, category: 'Patent', createdAt: new Date().toISOString() },
      { id: 'SVC007', name: 'Patent Filing (Complete)', description: 'Filing of complete patent application with full specification and claims', price: 25000, taxRate: 18, category: 'Patent', createdAt: new Date().toISOString() },
      { id: 'SVC008', name: 'Design Registration', description: 'Registration of industrial design under Designs Act, 2000', price: 6000, taxRate: 18, category: 'Design', createdAt: new Date().toISOString() },
      { id: 'SVC009', name: 'ISO Certification Consultancy', description: 'End-to-end consultancy for ISO 9001/14001/27001 certification', price: 20000, taxRate: 18, category: 'ISO', createdAt: new Date().toISOString() },
      { id: 'SVC010', name: 'MSME Registration (Udyam)', description: 'Registration on Udyam portal for MSME/SSI certificate', price: 1500, taxRate: 18, category: 'MSME', createdAt: new Date().toISOString() },
      { id: 'SVC011', name: 'Startup India Registration', description: 'DPIIT recognition for Startup India scheme benefits', price: 3500, taxRate: 18, category: 'Startup', createdAt: new Date().toISOString() },
      { id: 'SVC012', name: 'Legal Notice Drafting', description: 'Drafting and sending legal notice for IP infringement or contract disputes', price: 5000, taxRate: 18, category: 'Legal', createdAt: new Date().toISOString() },
      { id: 'SVC013', name: 'IP Due Diligence', description: 'Comprehensive IP audit and due diligence report for businesses', price: 35000, taxRate: 18, category: 'Legal', createdAt: new Date().toISOString() },
      { id: 'SVC014', name: 'Geographical Indication Filing', description: 'Application for GI Tag registration under GI Act, 1999', price: 10000, taxRate: 18, category: 'IP', createdAt: new Date().toISOString() },
    ];
  },

  // ─── DOCUMENTS ─────────────────────────────────────────────
  getDocuments() {
    return this.get(STORAGE_KEYS.DOCUMENTS) || [];
  },

  saveDocument(doc) {
    const docs = this.getDocuments();
    if (!doc.id) {
      doc.id        = this.generateId('DOC');
      doc.docNumber = this.generateDocNumber(doc.type);
      doc.createdAt = new Date().toISOString();
      doc.status    = doc.status || 'draft';
      docs.push(doc);
      this.logActivity(`Created ${doc.type} ${doc.docNumber}`);
    } else {
      const idx = docs.findIndex(d => d.id === doc.id);
      if (idx !== -1) {
        // Safety guard: if docNumber was wiped by a previous bug, restore it
        if (!doc.docNumber || doc.docNumber === 'undefined') {
          doc.docNumber = docs[idx].docNumber || this.generateDocNumber(doc.type);
        }
        // Safety guard: preserve original createdAt
        if (!doc.createdAt) {
          doc.createdAt = docs[idx].createdAt;
        }
        doc.updatedAt = new Date().toISOString();
        docs[idx] = doc;
        this.logActivity(`Updated ${doc.type} ${doc.docNumber}`);
      }
    }
    this.set(STORAGE_KEYS.DOCUMENTS, docs);
    return doc;
  },

  deleteDocument(id) {
    const docs = this.getDocuments().filter(d => d.id !== id);
    this.set(STORAGE_KEYS.DOCUMENTS, docs);
  },

  getDocumentById(id) {
    return this.getDocuments().find(d => d.id === id) || null;
  },

  // ─── DOCUMENT NUMBERING ─────────────────────────────────────
  getCounters() {
    return this.get(STORAGE_KEYS.COUNTERS) || { QT: 0, PI: 0, INV: 0 };
  },

  generateDocNumber(type) {
    const counters = this.getCounters();
    const year = new Date().getFullYear();
    let prefix, key;
    switch (type) {
      case 'quotation': prefix = 'QT'; key = 'QT'; break;
      case 'proforma': prefix = 'PI'; key = 'PI'; break;
      case 'invoice': prefix = 'INV'; key = 'INV'; break;
      default: prefix = 'DOC'; key = 'QT';
    }
    counters[key] = (counters[key] || 0) + 1;
    this.set(STORAGE_KEYS.COUNTERS, counters);
    return `${prefix}-${year}-${String(counters[key]).padStart(3, '0')}`;
  },

  // ─── SETTINGS ──────────────────────────────────────────────
  getSettings() {
    return this.get(STORAGE_KEYS.SETTINGS) || this.getDefaultSettings();
  },

  saveSettings(settings) {
    this.set(STORAGE_KEYS.SETTINGS, settings);
  },

  getDefaultSettings() {
    return {
      companyName: 'I-Pro Solutions',
      tagline: 'Protecting Innovation. Empowering Businesses.',
      address: '102, Ahmed Manor, Mazgaon, Mumbai – 400010, Maharashtra, India',
      email: 'vinay@iprosolutions.co.in',
      phone: '+91 87797 35598',
      altPhone: '+91 93240 90425',
      website: 'www.iprosolutions.co.in',
      gstin: '27AAAAA0000A1Z5',
      pan: 'AAAAA0000A',
      primaryColor: '#0F2D52',
      secondaryColor: '#2563EB',
      accentColor: '#F97316',
      bankName: 'HDFC Bank',
      bankAccount: '50200012345678',
      bankIfsc: 'HDFC0001234',
      bankBranch: 'Mazgaon, Mumbai',
      bankAccountName: 'I-Pro Solutions',
      termsQuotation: 'This quotation is valid for 30 days from the date of issue. Government fees are not included and will be charged at actuals. All amounts are in Indian Rupees.',
      termsProforma: 'Payment to be made within 7 days of receipt of this proforma invoice. Work will commence only after receipt of full payment.',
      termsInvoice: 'Payment is due within 15 days. Late payment will attract interest at 18% per annum. Subject to Mumbai jurisdiction.',
      footerText: 'Thank you for choosing I-Pro Solutions. We are committed to protecting your intellectual property rights.',
      webhookUrl: '',
      webhookEnabled: false,
      signatory: 'Vinay Sharma',
      designation: 'Founder & Managing Partner',
    };
  },

  // ─── LOGO ──────────────────────────────────────────────────
  getLogo() {
    return this.get(STORAGE_KEYS.LOGO) || null;
  },

  saveLogo(base64) {
    return this.set(STORAGE_KEYS.LOGO, base64);
  },

  // ─── SIGNATURE ─────────────────────────────────────────────
  getSignature() {
    return this.get(STORAGE_KEYS.SIGNATURE) || null;
  },

  saveSignature(base64) {
    return this.set(STORAGE_KEYS.SIGNATURE, base64);
  },

  // ─── QR CODE ───────────────────────────────────────────────
  getQRCode() {
    return this.get(STORAGE_KEYS.QR_CODE) || null;
  },

  saveQRCode(base64) {
    return this.set(STORAGE_KEYS.QR_CODE, base64);
  },

  // ─── ACTIVITY LOG ──────────────────────────────────────────
  getActivity() {
    return this.get(STORAGE_KEYS.ACTIVITY) || [];
  },

  logActivity(message) {
    const log = this.getActivity();
    log.unshift({ message, timestamp: new Date().toISOString() });
    if (log.length > 50) log.pop();
    this.set(STORAGE_KEYS.ACTIVITY, log);
  },

  // ─── DRAFTS ────────────────────────────────────────────────
  getDraft(key) {
    const drafts = this.get(STORAGE_KEYS.DRAFTS) || {};
    return drafts[key] || null;
  },

  saveDraft(key, data) {
    const drafts = this.get(STORAGE_KEYS.DRAFTS) || {};
    drafts[key] = data;
    this.set(STORAGE_KEYS.DRAFTS, drafts);
  },

  clearDraft(key) {
    const drafts = this.get(STORAGE_KEYS.DRAFTS) || {};
    delete drafts[key];
    this.set(STORAGE_KEYS.DRAFTS, drafts);
  },

  // ─── DARK MODE ─────────────────────────────────────────────
  getDarkMode() {
    return this.get(STORAGE_KEYS.DARK_MODE) || false;
  },

  setDarkMode(value) {
    this.set(STORAGE_KEYS.DARK_MODE, value);
  },

  // ─── UTILITIES ─────────────────────────────────────────────
  generateId(prefix = 'ID') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  },

  // Export all data as JSON
  exportAll() {
    return {
      clients: this.getClients(),
      services: this.getServices(),
      documents: this.getDocuments(),
      settings: this.getSettings(),
      counters: this.getCounters(),
      exportedAt: new Date().toISOString(),
    };
  },

  // Import data from JSON
  importAll(data) {
    if (data.clients)   this.set(STORAGE_KEYS.CLIENTS, data.clients);
    if (data.services)  this.set(STORAGE_KEYS.SERVICES, data.services);
    if (data.documents) this.set(STORAGE_KEYS.DOCUMENTS, data.documents);
    if (data.settings)  this.set(STORAGE_KEYS.SETTINGS, data.settings);
    if (data.counters)  this.set(STORAGE_KEYS.COUNTERS, data.counters);
  },
};

window.Storage = Storage;
