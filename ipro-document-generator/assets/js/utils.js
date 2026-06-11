/**
 * I-Pro Solutions - Utility Functions
 * Number-to-words, currency formatting, date helpers
 */

const Utils = {
  // ─── CURRENCY ─────────────────────────────────────────────
  formatCurrency(amount) {
    if (isNaN(amount)) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  },

  formatNumber(amount) {
    if (isNaN(amount)) return '0.00';
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  },

  // ─── AMOUNT IN WORDS ─────────────────────────────────────
  numberToWords(num) {
    if (num === 0) return 'Zero Rupees Only';
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
      'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convertGroup = (n) => {
      if (n === 0) return '';
      if (n < 20) return ones[n] + ' ';
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '') + ' ';
      return ones[Math.floor(n / 100)] + ' Hundred ' + convertGroup(n % 100);
    };

    const convert = (n) => {
      if (n === 0) return 'Zero';
      let result = '';
      if (n >= 10000000) {
        result += convertGroup(Math.floor(n / 10000000)) + 'Crore ';
        n %= 10000000;
      }
      if (n >= 100000) {
        result += convertGroup(Math.floor(n / 100000)) + 'Lakh ';
        n %= 100000;
      }
      if (n >= 1000) {
        result += convertGroup(Math.floor(n / 1000)) + 'Thousand ';
        n %= 1000;
      }
      result += convertGroup(n);
      return result.trim();
    };

    const rounded = Math.round(num * 100) / 100;
    const intPart = Math.floor(rounded);
    const decPart = Math.round((rounded - intPart) * 100);

    let result = convert(intPart) + ' Rupees';
    if (decPart > 0) {
      result += ' and ' + convert(decPart) + ' Paise';
    }
    return result + ' Only';
  },

  // ─── DATE HELPERS ────────────────────────────────────────
  formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  },

  formatDateShort(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  },

  todayISO() {
    return new Date().toISOString().split('T')[0];
  },

  addDays(dateStr, days) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  },

  timeAgo(dateStr) {
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return this.formatDateShort(dateStr);
  },

  // ─── GST CALC ────────────────────────────────────────────
  calcGST(amount, rate, type = 'intra') {
    const total = amount * (rate / 100);
    if (type === 'intra') {
      return { cgst: total / 2, sgst: total / 2, igst: 0, total };
    }
    return { cgst: 0, sgst: 0, igst: total, total };
  },

  roundOff(amount) {
    return Math.round(amount) - amount;
  },

  // ─── DOM HELPERS ─────────────────────────────────────────
  el(id) { return document.getElementById(id); },
  qs(selector) { return document.querySelector(selector); },
  qsa(selector) { return document.querySelectorAll(selector); },

  showToast(message, type = 'success', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const icons = {
      success: `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`,
      error: `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`,
      warning: `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>`,
      info: `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    };
    const colors = {
      success: 'bg-emerald-500',
      error: 'bg-red-500',
      warning: 'bg-amber-500',
      info: 'bg-blue-500',
    };
    const toast = document.createElement('div');
    toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl text-white shadow-2xl transform translate-x-0 transition-all duration-500 ${colors[type]} min-w-[280px] max-w-sm`;
    toast.innerHTML = `<span class="shrink-0">${icons[type]}</span><span class="text-sm font-medium">${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100%)'; setTimeout(() => toast.remove(), 500); }, duration);
  },

  showModal(title, content, onConfirm, confirmText = 'Confirm', confirmClass = 'btn-primary') {
    const modal = document.getElementById('global-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const confirmBtn = document.getElementById('modal-confirm');
    const cancelBtn = document.getElementById('modal-cancel');
    if (!modal) return;
    modalTitle.textContent = title;
    modalBody.innerHTML = content;
    confirmBtn.textContent = confirmText;
    confirmBtn.className = `btn ${confirmClass}`;
    const closeModal = () => { modal.classList.add('hidden'); };
    confirmBtn.onclick = () => { onConfirm(); closeModal(); };
    cancelBtn.onclick = closeModal;
    modal.onclick = (e) => { if (e.target === modal) closeModal(); };
    modal.classList.remove('hidden');
  },

  debounce(fn, delay = 300) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
  },

  sanitize(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  },

  generateColor(str) {
    const colors = ['#0F2D52', '#2563EB', '#7C3AED', '#DC2626', '#D97706', '#059669', '#0891B2'];
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  },

  initials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
  },

  docTypeName(type) {
    const names = { quotation: 'Quotation', proforma: 'Proforma Invoice', invoice: 'Tax Invoice' };
    return names[type] || type;
  },

  docTypePrefix(type) {
    const p = { quotation: 'QT', proforma: 'PI', invoice: 'INV' };
    return p[type] || 'DOC';
  },

  statusBadge(status) {
    const cfg = {
      draft: { cls: 'badge-draft', label: 'Draft' },
      sent: { cls: 'badge-sent', label: 'Sent' },
      accepted: { cls: 'badge-success', label: 'Accepted' },
      rejected: { cls: 'badge-danger', label: 'Rejected' },
      paid: { cls: 'badge-success', label: 'Paid' },
      partial: { cls: 'badge-warning', label: 'Partial' },
      unpaid: { cls: 'badge-danger', label: 'Unpaid' },
      converted: { cls: 'badge-info', label: 'Converted' },
      cancelled: { cls: 'badge-draft', label: 'Cancelled' },
    };
    const c = cfg[status] || { cls: 'badge-draft', label: status };
    return `<span class="badge ${c.cls}">${c.label}</span>`;
  },
};

window.Utils = Utils;
