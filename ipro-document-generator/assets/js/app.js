/**
 * I-Pro Solutions - Main Application
 * Router, Dashboard, Navigation, Dark Mode
 */

const Dashboard = {
  render() {
    const docs = Storage.getDocuments();
    const clients = Storage.getClients();
    const quotations = docs.filter(d => d.type === 'quotation');
    const proformas = docs.filter(d => d.type === 'proforma');
    const invoices = docs.filter(d => d.type === 'invoice');
    const totalRevenue = invoices.reduce((sum, d) => sum + (d.totals?.grandTotal || 0), 0);
    const pending = invoices.filter(d => ['unpaid', 'partial', 'sent'].includes(d.status)).reduce((sum, d) => sum + (d.totals?.grandTotal || 0), 0);

    const recentDocs = [...docs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);
    const activity = Storage.getActivity().slice(0, 10);

    const container = Utils.el('dashboard-view');
    if (!container) return;

    container.innerHTML = `
      <!-- STATS -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        ${this.statCard('Quotations', quotations.length, '#2563EB', `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>`, 'documents', 'quotation')}
        ${this.statCard('Proforma Inv.', proformas.length, '#7C3AED', `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>`, 'documents', 'proforma')}
        ${this.statCard('Tax Invoices', invoices.length, '#059669', `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>`, 'documents', 'invoice')}
        ${this.statCard('Total Clients', clients.length, '#F97316', `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>`, 'clients')}
      </div>

      <!-- REVENUE CARDS -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div class="card bg-gradient-primary text-white">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-sm opacity-75 mb-1">Total Invoice Revenue</p>
              <p class="text-3xl font-bold">${Utils.formatCurrency(totalRevenue)}</p>
              <p class="text-xs opacity-60 mt-1">${invoices.length} invoices generated</p>
            </div>
            <div class="p-3 rounded-xl" style="background:rgba(255,255,255,0.15)">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
          </div>
        </div>
        <div class="card" style="border-left:4px solid #F97316;">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-sm text-muted mb-1">Pending / Unpaid</p>
              <p class="text-3xl font-bold text-accent">${Utils.formatCurrency(pending)}</p>
              <p class="text-xs text-muted mt-1">${invoices.filter(d => ['unpaid','partial','sent'].includes(d.status)).length} invoices pending</p>
            </div>
            <div class="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
          </div>
        </div>
      </div>

      <!-- QUICK ACTIONS -->
      <div class="card mb-8">
        <h2 class="card-title mb-4">Quick Actions</h2>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button onclick="Documents.openBuilder(null,null,'quotation')" class="quick-action-btn" id="qa-quotation">
            <div class="qa-icon" style="background:#EFF6FF; color:#2563EB">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
            <span class="qa-label">New Quotation</span>
          </button>
          <button onclick="Documents.openBuilder(null,null,'proforma')" class="quick-action-btn" id="qa-proforma">
            <div class="qa-icon" style="background:#F5F3FF; color:#7C3AED">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
            </div>
            <span class="qa-label">New Proforma</span>
          </button>
          <button onclick="Documents.openBuilder(null,null,'invoice')" class="quick-action-btn" id="qa-invoice">
            <div class="qa-icon" style="background:#ECFDF5; color:#059669">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            </div>
            <span class="qa-label">New Invoice</span>
          </button>
          <button onclick="Clients.openForm()" class="quick-action-btn" id="qa-client">
            <div class="qa-icon" style="background:#FFF7ED; color:#F97316">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
            </div>
            <span class="qa-label">Add Client</span>
          </button>
        </div>
      </div>

      <!-- RECENT DOCS + ACTIVITY -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card">
          <div class="flex justify-between items-center mb-4">
            <h2 class="card-title">Recent Documents</h2>
            <button onclick="App.navigate('documents')" class="text-sm text-primary hover:underline">View All →</button>
          </div>
          ${recentDocs.length === 0 ? '<p class="text-muted text-sm">No documents yet.</p>' : `
          <div class="space-y-3">
            ${recentDocs.map(d => `
              <div class="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-2 transition-colors cursor-pointer" onclick="Documents.preview('${d.id}')">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style="background:${d.type==='quotation'?'#2563EB':d.type==='proforma'?'#7C3AED':'#059669'}">${d.type==='quotation'?'QT':d.type==='proforma'?'PI':'INV'}</div>
                <div class="flex-1 min-w-0">
                  <div class="font-semibold text-sm font-mono">${d.docNumber}</div>
                  <div class="text-xs text-muted truncate">${d.clientName || '—'}</div>
                </div>
                <div class="text-right flex-shrink-0">
                  <div class="font-mono text-sm font-semibold">${Utils.formatCurrency(d.totals?.grandTotal||0)}</div>
                  <div>${Utils.statusBadge(d.status)}</div>
                </div>
              </div>
            `).join('')}
          </div>`}
        </div>

        <div class="card">
          <h2 class="card-title mb-4">Activity Log</h2>
          ${activity.length === 0 ? '<p class="text-muted text-sm">No recent activity.</p>' : `
          <div class="space-y-3">
            ${activity.map(a => `
              <div class="flex items-start gap-3">
                <div class="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm">${a.message}</div>
                  <div class="text-xs text-muted">${Utils.timeAgo(a.timestamp)}</div>
                </div>
              </div>
            `).join('')}
          </div>`}
        </div>
      </div>
    `;
  },

  statCard(label, value, color, iconPath, navTarget, filterType) {
    return `
      <div class="card hover:shadow-xl transition-all cursor-pointer" onclick="App.navigate('${navTarget}')${filterType ? `;Documents.setFilter('type','${filterType}')` : ''}">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-sm text-muted mb-2">${label}</p>
            <p class="text-3xl font-bold" style="color:${color}">${value}</p>
          </div>
          <div class="p-3 rounded-xl" style="background:${color}20">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="color:${color}">${iconPath}</svg>
          </div>
        </div>
      </div>
    `;
  },
};

// ─── APPLICATION ROUTER ──────────────────────────────────────
const App = {
  currentView: 'dashboard',
  slidePanelOpen: false,

  init() {
    // Dark mode
    if (Storage.getDarkMode()) {
      document.documentElement.classList.add('dark');
    }

    // Initialize default services if none exist
    Storage.getServices();

    this.updateLogoInNav();
    this.navigate('dashboard');
    this.initGlobalSearch();
    this.initDarkMode();
    this.initMobileNav();
    Dashboard.render();
  },

  navigate(view) {
    this.currentView = view;
    const views = ['dashboard', 'documents', 'clients', 'services', 'settings', 'builder', 'preview'];
    views.forEach(v => {
      const el = Utils.el(`${v}-view`);
      if (el) el.classList.toggle('hidden', v !== view);
    });

    // Active nav
    document.querySelectorAll('[data-nav]').forEach(el => {
      el.classList.toggle('nav-active', el.dataset.nav === view);
    });

    // Render the view
    switch (view) {
      case 'dashboard': Dashboard.render(); break;
      case 'documents': Documents.render(); break;
      case 'clients': Clients.render(); break;
      case 'services': Services.render(); break;
      case 'settings': Settings.render(); break;
    }

    // Close mobile nav
    const mobileNav = Utils.el('mobile-nav-panel');
    if (mobileNav) mobileNav.classList.add('hidden');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  openSlidePanel(title, content) {
    const panel = Utils.el('slide-panel');
    const titleEl = Utils.el('slide-panel-title');
    const bodyEl = Utils.el('slide-panel-body');
    if (!panel) return;
    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.innerHTML = content;
    panel.classList.remove('translate-x-full');
    panel.classList.add('translate-x-0');
    Utils.el('slide-panel-overlay')?.classList.remove('hidden');
    this.slidePanelOpen = true;
  },

  closeSlidePanel() {
    const panel = Utils.el('slide-panel');
    if (!panel) return;
    panel.classList.add('translate-x-full');
    panel.classList.remove('translate-x-0');
    Utils.el('slide-panel-overlay')?.classList.add('hidden');
    this.slidePanelOpen = false;
  },

  updateLogoInNav() {
    const logo = Storage.getLogo();
    const navLogo = Utils.el('nav-logo');
    const navLogoText = Utils.el('nav-logo-text');
    if (navLogo) {
      if (logo) {
        navLogo.src = logo;
        navLogo.classList.remove('hidden');
        if (navLogoText) navLogoText.classList.add('hidden');
      } else {
        navLogo.classList.add('hidden');
        if (navLogoText) navLogoText.classList.remove('hidden');
      }
    }
  },

  initDarkMode() {
    const toggle = Utils.el('dark-mode-toggle');
    if (!toggle) return;
    toggle.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      Storage.setDarkMode(isDark);
      this.updateDarkIcon(isDark);
    });
    this.updateDarkIcon(Storage.getDarkMode());
  },

  updateDarkIcon(isDark) {
    const icon = Utils.el('dark-mode-icon');
    if (!icon) return;
    icon.innerHTML = isDark
      ? `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>`
      : `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>`;
  },

  initGlobalSearch() {
    const searchInput = Utils.el('global-search');
    if (!searchInput) return;
    searchInput.addEventListener('input', Utils.debounce((e) => {
      const q = e.target.value.trim().toLowerCase();
      if (!q) return;
      const docs = Storage.getDocuments().filter(d =>
        d.docNumber?.toLowerCase().includes(q) || d.clientName?.toLowerCase().includes(q)
      );
      const clients = Storage.getClients().filter(c =>
        c.name?.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q)
      );
      if (docs.length > 0) {
        this.navigate('documents');
        Documents.search(q);
      } else if (clients.length > 0) {
        this.navigate('clients');
        Clients.search(q);
      }
    }, 400));
  },

  initMobileNav() {
    const hamburger = Utils.el('mobile-menu-btn');
    const panel = Utils.el('mobile-nav-panel');
    if (!hamburger || !panel) return;
    hamburger.addEventListener('click', () => panel.classList.toggle('hidden'));
    panel.addEventListener('click', (e) => {
      if (e.target.dataset.nav) {
        this.navigate(e.target.dataset.nav);
        panel.classList.add('hidden');
      }
    });
  },
};

window.App = App;
window.Dashboard = Dashboard;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => App.init());
