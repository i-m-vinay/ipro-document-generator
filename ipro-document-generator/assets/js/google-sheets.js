/**
 * I-Pro Solutions - Google Sheets Integration Module (v2)
 * Supports document sync, client sync, service sync, and full bulk sync
 */

const GoogleSheets = {

  /* ─── SINGLE DOCUMENT SYNC ────────────────────────────────── */
  async sync(doc) {
    const settings = Storage.getSettings();
    if (!settings.webhookEnabled || !settings.webhookUrl) return;

    const client  = Storage.getClientById(doc.clientId) || {};
    const payload = {
      type:          'document',
      docNumber:     doc.docNumber,
      docType:       Utils.docTypeName(doc.type),
      clientName:    client.name    || '',
      clientCompany: client.company || '',
      date:          doc.date       || '',
      dueDate:       doc.dueDate    || '',
      subtotal:      doc.totals?.subtotal   || 0,
      taxAmount:     doc.totals?.taxAmount  || 0,
      grandTotal:    doc.totals?.grandTotal || 0,
      status:        doc.status     || 'draft',
      remarks:       doc.remarks    || '',
      source:        'I-Pro App',
      timestamp:     new Date().toISOString(),
    };

    await this._post(payload, doc.docNumber);
  },

  /* ─── SINGLE CLIENT SYNC ──────────────────────────────────── */
  async syncClient(client) {
    const settings = Storage.getSettings();
    if (!settings.webhookEnabled || !settings.webhookUrl) return;

    await this._post({
      type:      'client',
      id:        client.id,
      name:      client.name    || '',
      company:   client.company || '',
      address:   client.address || '',
      gstin:     client.gstin   || '',
      email:     client.email   || '',
      phone:     client.phone   || '',
      state:     client.state   || '',
      notes:     client.notes   || '',
      timestamp: new Date().toISOString(),
    }, client.id);
  },

  /* ─── SINGLE SERVICE SYNC ─────────────────────────────────── */
  async syncService(service) {
    const settings = Storage.getSettings();
    if (!settings.webhookEnabled || !settings.webhookUrl) return;

    await this._post({
      type:        'service',
      id:          service.id,
      name:        service.name        || '',
      description: service.description || '',
      category:    service.category    || '',
      price:       service.price       || 0,
      taxRate:     service.taxRate     || 18,
      timestamp:   new Date().toISOString(),
    }, service.id);
  },

  /* ─── FULL BULK SYNC ──────────────────────────────────────── */
  async syncAll() {
    const settings = Storage.getSettings();
    if (!settings.webhookUrl) {
      Utils.showToast('Please enter a webhook URL in Settings first.', 'error');
      return;
    }

    const docs     = Storage.getDocuments();
    const clients  = Storage.getClients();
    const services = Storage.getServices();

    // Show progress toast
    Utils.showToast(
      `Syncing ${docs.length} docs, ${clients.length} clients, ${services.length} services…`,
      'info', 8000
    );

    const payload = {
      type: 'bulk',
      documents: docs.map(doc => {
        const client = Storage.getClientById(doc.clientId) || {};
        return {
          type:          'document',
          docNumber:     doc.docNumber,
          docType:       Utils.docTypeName(doc.type),
          clientName:    client.name    || '',
          clientCompany: client.company || '',
          date:          doc.date       || '',
          dueDate:       doc.dueDate    || '',
          subtotal:      doc.totals?.subtotal   || 0,
          taxAmount:     doc.totals?.taxAmount  || 0,
          grandTotal:    doc.totals?.grandTotal || 0,
          status:        doc.status     || 'draft',
          remarks:       doc.remarks    || '',
          source:        'I-Pro Bulk Sync',
        };
      }),
      clients: clients.map(c => ({
        type: 'client', id: c.id, name: c.name || '',
        company: c.company || '', address: c.address || '',
        gstin: c.gstin || '', email: c.email || '',
        phone: c.phone || '', state: c.state || '', notes: c.notes || '',
      })),
      services: services.map(s => ({
        type: 'service', id: s.id, name: s.name || '',
        description: s.description || '', category: s.category || '',
        price: s.price || 0, taxRate: s.taxRate || 18,
      })),
      timestamp: new Date().toISOString(),
    };

    try {
      await fetch(settings.webhookUrl, {
        method:  'POST',
        mode:    'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      Storage.logActivity(
        `Bulk sync: ${docs.length} docs, ${clients.length} clients, ${services.length} services`
      );
      Utils.showToast('✓ Full sync complete! Check your Google Sheet.', 'success');
    } catch (err) {
      console.warn('[Sheets] Bulk sync failed:', err);
      Utils.showToast('Sync failed. Check webhook URL and connectivity.', 'error');
    }
  },

  /* ─── TEST WEBHOOK ────────────────────────────────────────── */
  async testWebhook() {
    const settings = Storage.getSettings();
    if (!settings.webhookUrl) {
      Utils.showToast('Please enter a webhook URL first.', 'error');
      return;
    }

    Utils.showToast('Sending test ping…', 'info', 3000);

    try {
      await fetch(settings.webhookUrl, {
        method:  'POST',
        mode:    'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:      'document',
          docNumber: 'TEST-001',
          docType:   'Test Connection',
          clientName:'I-Pro Solutions Test',
          date:      Utils.todayISO(),
          grandTotal: 0,
          status:    'test',
          remarks:   'Webhook test from I-Pro Document Generator',
          source:    'I-Pro App Test',
          timestamp: new Date().toISOString(),
        }),
      });
      Utils.showToast('✓ Test ping sent! Check your Google Sheet → Sync Log tab.', 'success');
    } catch (err) {
      Utils.showToast('Webhook test failed. Verify the URL.', 'error');
    }
  },

  /* ─── INTERNAL POST ───────────────────────────────────────── */
  async _post(payload, label) {
    const settings = Storage.getSettings();
    try {
      await fetch(settings.webhookUrl, {
        method:  'POST',
        mode:    'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      Storage.logActivity(`Synced to Sheets: ${label}`);
    } catch (err) {
      console.warn(`[Sheets] sync failed for ${label}:`, err);
      // Silent fail — app continues working offline
    }
  },
};

window.GoogleSheets = GoogleSheets;
