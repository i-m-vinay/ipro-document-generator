# I-Pro Solutions — Business Document Generator

> **Protecting Innovation. Empowering Businesses.**

A complete, production-ready web application for generating professional **Quotations**, **Proforma Invoices**, and **Tax Invoices** — deployable on GitHub Pages with zero backend.

---

## ✨ Features

| Module | Capabilities |
|---|---|
| **Dashboard** | Stats, revenue summary, activity log, quick actions |
| **Client Master** | CRUD with search, state-wise GST info |
| **Service Master** | 14 pre-loaded IP/Legal services, category filter |
| **Document Builder** | Quotation / Proforma / Tax Invoice with line items |
| **GST Calculator** | CGST+SGST (intra-state) or IGST (inter-state), auto totals |
| **PDF Export** | A4 portrait with letterhead, logo, signature, bank details |
| **Conversion** | Quotation → Proforma → Tax Invoice workflow |
| **Settings** | Logo upload, brand colors, bank details, Google Sheets |
| **Dark Mode** | Full dark/light theme |
| **Google Sheets** | Optional webhook sync via Google Apps Script |

---

## 🏢 Company Details Pre-loaded

```
Company:      I-Pro Solutions
Tagline:      Protecting Innovation. Empowering Businesses.
Address:      102, Ahmed Manor, Mazgaon, Mumbai – 400010, Maharashtra, India
Email:        vinay@iprosolutions.co.in
Phone:        +91 87797 35598 / +91 93240 90425
```

---

## 📁 Project Structure

```
ipro-document-generator/
├── index.html                  ← Main SPA entry point
├── assets/
│   ├── css/
│   │   └── styles.css          ← Custom CSS (dark mode, animations, cards)
│   ├── js/
│   │   ├── app.js              ← Router, Dashboard, dark mode, search
│   │   ├── storage.js          ← LocalStorage CRUD abstraction
│   │   ├── utils.js            ← Currency, number-to-words, toast, modal
│   │   ├── documents.js        ← Document builder, line items, GST calc
│   │   ├── clients.js          ← Client master CRUD
│   │   ├── services.js         ← Service master CRUD
│   │   ├── settings.js         ← Brand settings, logo upload, data mgmt
│   │   ├── pdf.js              ← PDF generation via html2pdf.js
│   │   ├── google-sheets.js    ← Webhook integration
│   │   ├── templates.js        ← Professional letterhead HTML templates
│   │   └── logo-loader.js      ← Auto-loads logo on first visit
│   └── images/
│       └── logo.png            ← I-Pro Solutions logo
└── README.md
```

---

## 🚀 Quick Start (Local)

### Option 1: Open directly in browser

Simply double-click `index.html` or open it in any modern browser.

> ⚠️ **Note:** Due to browser security (CORS), the logo may not auto-load when opened as `file://`. Use a local server instead.

### Option 2: Local server (recommended)

**Using Python:**
```bash
cd ipro-document-generator
python -m http.server 8080
# Open: http://localhost:8080
```

**Using Node.js (npx):**
```bash
cd ipro-document-generator
npx serve .
# Open: http://localhost:3000
```

**Using VS Code:**
Install the "Live Server" extension → Right-click `index.html` → Open with Live Server.

---

## 🌐 GitHub Pages Deployment

### Step 1: Create a GitHub Repository

```bash
cd ipro-document-generator
git init
git add .
git commit -m "Initial commit: I-Pro Solutions Document Generator"
```

### Step 2: Create GitHub repo and push

```bash
# Create a new repo on GitHub named: ipro-document-generator
git remote add origin https://github.com/YOUR_USERNAME/ipro-document-generator.git
git branch -M main
git push -u origin main
```

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages** (left sidebar)
3. Under **Source**, select **Deploy from a branch**
4. Select **main** branch, **/ (root)** folder
5. Click **Save**
6. Your app will be live at: `https://YOUR_USERNAME.github.io/ipro-document-generator/`

### Step 4: Custom Domain (optional)

1. In Pages settings, enter your custom domain (e.g., `docs.iprosolutions.co.in`)
2. Add a `CNAME` file in the repo root with the domain
3. Configure DNS with your domain registrar

---

## 📊 Google Sheets Integration Setup

### Step 1: Create Google Sheet

Create a new Google Sheet with these columns in Row 1:
```
A: Doc Number | B: Doc Type | C: Client Name | D: Client Company | E: Date | F: Due Date | G: Subtotal | H: Tax Amount | I: Grand Total | J: Status | K: Timestamp | L: Remarks
```

### Step 2: Create Apps Script

1. In your Google Sheet, click **Extensions → Apps Script**
2. Replace all existing code with:

```javascript
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.appendRow([
      data.docNumber,
      data.docType,
      data.clientName,
      data.clientCompany,
      data.date,
      data.dueDate,
      data.subtotal,
      data.taxAmount,
      data.grandTotal,
      data.status,
      data.timestamp,
      data.remarks
    ]);
    return ContentService
      .createTextOutput(JSON.stringify({result: 'success'}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({result: 'error', message: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

### Step 3: Deploy

1. Click **Deploy → New deployment**
2. Click the gear icon next to **Type** → Select **Web app**
3. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy** → Authorize → Copy the **Web App URL**

### Step 4: Configure in App

1. Open your I-Pro Document Generator
2. Go to **Settings → Google Sheets Integration**
3. Paste the Web App URL in the **Webhook URL** field
4. Enable the **Auto-Sync** toggle
5. Click **Test Webhook** to verify

---

## 📄 Document Numbering

| Type | Format | Example |
|---|---|---|
| Quotation | QT-YYYY-NNN | QT-2026-001 |
| Proforma Invoice | PI-YYYY-NNN | PI-2026-001 |
| Tax Invoice | INV-YYYY-NNN | INV-2026-001 |

Numbers auto-increment and are stored in LocalStorage. Reset via **Settings → Reset Document Counters**.

---

## 🎨 Brand Configuration

All brand settings are configurable via **Settings**:
- **Logo:** Upload PNG/JPG/SVG (stored in LocalStorage)
- **Primary Color:** Default `#0F2D52` (Navy)
- **Accent Color:** Default `#F97316` (Orange)
- **Bank Details:** Shown on Tax Invoices
- **Terms:** Separate default terms for each document type

---

## 🔒 Data Privacy

All data is stored **100% locally** in your browser's LocalStorage:
- No server, no database, no cloud sync (unless you enable Sheets)
- Export all data as JSON via **Settings → Export All Data**
- Import data on another browser via **Settings → Import Data**

---

## 💾 Pre-loaded Sample Services

| Service | Category | Rate |
|---|---|---|
| Trademark Registration | Trademark | ₹7,500 |
| Trademark Objection Reply | Trademark | ₹5,000 |
| Copyright Registration | Copyright | ₹4,500 |
| Patent Filing (Provisional) | Patent | ₹15,000 |
| Patent Filing (Complete) | Patent | ₹25,000 |
| ISO Certification | ISO | ₹20,000 |
| MSME Registration | MSME | ₹1,500 |
| Startup India Registration | Startup | ₹3,500 |
| Legal Notice Drafting | Legal | ₹5,000 |
| + 5 more | Various | — |

All services include 18% GST by default.

---

## 🖥️ Browser Compatibility

| Browser | Status |
|---|---|
| Chrome 90+ | ✅ Full support |
| Firefox 88+ | ✅ Full support |
| Edge 90+ | ✅ Full support |
| Safari 14+ | ✅ Full support |

---

## 📞 Support

**I-Pro Solutions**  
📧 vinay@iprosolutions.co.in  
📱 +91 87797 35598  
📍 102, Ahmed Manor, Mazgaon, Mumbai – 400010

---

*Built with HTML5, Vanilla JavaScript, and ❤️ for Indian IP professionals.*
