/**
 * ═══════════════════════════════════════════════════════════════════
 *  I-PRO SOLUTIONS — Google Apps Script
 *  Document Generator → Google Sheets Sync
 * ═══════════════════════════════════════════════════════════════════
 *
 *  HOW TO DEPLOY:
 *  1. Open Google Sheets → Extensions → Apps Script
 *  2. Paste this entire file (replace existing code)
 *  3. Click "Run" → runOnce() to create sheet headers
 *  4. Deploy → New Deployment → Web App
 *     • Execute as: Me
 *     • Who has access: Anyone
 *  5. Copy the Web App URL → paste in I-Pro app → Settings → Webhook URL
 *
 * ═══════════════════════════════════════════════════════════════════
 */

// ── Sheet / Column Config ─────────────────────────────────────────
const SHEET_DOCUMENTS = 'Documents';
const SHEET_CLIENTS   = 'Clients';
const SHEET_SERVICES  = 'Services';
const SHEET_LOG       = 'Sync Log';

const DOC_HEADERS = [
  'Timestamp', 'Doc Number', 'Doc Type', 'Client Name',
  'Client Company', 'Date', 'Due Date', 'Subtotal (₹)',
  'Tax Amount (₹)', 'Grand Total (₹)', 'Status', 'Remarks',
  'Source',
];

const CLIENT_HEADERS = [
  'Timestamp', 'Client ID', 'Name', 'Company', 'Address',
  'GSTIN', 'Email', 'Phone', 'State', 'Notes',
];

const SERVICE_HEADERS = [
  'Timestamp', 'Service ID', 'Name', 'Description',
  'Category', 'Price (₹)', 'GST Rate (%)', 'Price incl. GST (₹)',
];

const LOG_HEADERS = [
  'Timestamp', 'Action', 'Payload Type', 'Doc Number / ID',
  'Status', 'Details',
];


// ═══════════════════════════════════════════════════════════════════
//  ENTRY POINT — receives POST from the web app
// ═══════════════════════════════════════════════════════════════════
function doPost(e) {
  try {
    const raw     = e.postData ? e.postData.contents : '{}';
    const payload = JSON.parse(raw);

    // Route by payload type
    const type = (payload.type || payload.syncType || 'document').toLowerCase();

    let result;
    switch (type) {
      case 'document': result = handleDocument(payload);  break;
      case 'client':   result = handleClient(payload);    break;
      case 'service':  result = handleService(payload);   break;
      case 'bulk':     result = handleBulkSync(payload);  break;
      default:         result = handleDocument(payload);  break;   // default → document
    }

    writeLog('doPost', type, payload.docNumber || payload.id || '—', 'OK', '');

    return jsonResponse({ status: 'ok', result });

  } catch (err) {
    writeLog('doPost', 'ERROR', '—', 'ERROR', err.message);
    return jsonResponse({ status: 'error', message: err.message }, 500);
  }
}

// Also handle GET (test ping from browser)
function doGet(e) {
  return jsonResponse({ status: 'ok', message: 'I-Pro Solutions webhook is live ✓', timestamp: new Date().toISOString() });
}


// ═══════════════════════════════════════════════════════════════════
//  HANDLERS
// ═══════════════════════════════════════════════════════════════════

function handleDocument(payload) {
  const sheet  = getOrCreateSheet(SHEET_DOCUMENTS, DOC_HEADERS);
  const now    = new Date().toISOString();

  // Check if doc number already exists → update row instead of append
  const docNum = payload.docNumber || '';
  const existing = findRowByValue(sheet, 'Doc Number', docNum);

  const row = [
    now,
    docNum,
    payload.docType      || '',
    payload.clientName   || '',
    payload.clientCompany|| '',
    payload.date         || '',
    payload.dueDate      || '',
    fmtNum(payload.subtotal),
    fmtNum(payload.taxAmount),
    fmtNum(payload.grandTotal),
    payload.status       || 'draft',
    payload.remarks      || '',
    payload.source       || 'I-Pro App',
  ];

  if (existing > 0) {
    sheet.getRange(existing, 1, 1, row.length).setValues([row]);
    return { action: 'updated', docNumber: docNum, row: existing };
  } else {
    sheet.appendRow(row);
    autoFormatDocSheet(sheet);
    return { action: 'inserted', docNumber: docNum };
  }
}

function handleClient(payload) {
  const sheet = getOrCreateSheet(SHEET_CLIENTS, CLIENT_HEADERS);
  const now   = new Date().toISOString();

  const existing = findRowByValue(sheet, 'Client ID', payload.id || '');

  const row = [
    now,
    payload.id      || '',
    payload.name    || '',
    payload.company || '',
    payload.address || '',
    payload.gstin   || '',
    payload.email   || '',
    payload.phone   || '',
    payload.state   || '',
    payload.notes   || '',
  ];

  if (existing > 0) {
    sheet.getRange(existing, 1, 1, row.length).setValues([row]);
    return { action: 'updated', id: payload.id };
  } else {
    sheet.appendRow(row);
    return { action: 'inserted', id: payload.id };
  }
}

function handleService(payload) {
  const sheet = getOrCreateSheet(SHEET_SERVICES, SERVICE_HEADERS);
  const now   = new Date().toISOString();
  const incl  = (payload.price || 0) * (1 + (payload.taxRate || 18) / 100);

  const existing = findRowByValue(sheet, 'Service ID', payload.id || '');
  const row = [
    now,
    payload.id          || '',
    payload.name        || '',
    payload.description || '',
    payload.category    || '',
    fmtNum(payload.price),
    payload.taxRate     || 18,
    fmtNum(incl),
  ];

  if (existing > 0) {
    sheet.getRange(existing, 1, 1, row.length).setValues([row]);
    return { action: 'updated', id: payload.id };
  } else {
    sheet.appendRow(row);
    return { action: 'inserted', id: payload.id };
  }
}

function handleBulkSync(payload) {
  const results = { documents: 0, clients: 0, services: 0 };

  if (Array.isArray(payload.documents)) {
    payload.documents.forEach(d => { handleDocument(d); results.documents++; });
  }
  if (Array.isArray(payload.clients)) {
    payload.clients.forEach(c => { handleClient(c); results.clients++; });
  }
  if (Array.isArray(payload.services)) {
    payload.services.forEach(s => { handleService(s); results.services++; });
  }
  return results;
}


// ═══════════════════════════════════════════════════════════════════
//  SETUP — run this ONCE to create all sheets with headers
// ═══════════════════════════════════════════════════════════════════
function runOnce() {
  setupSheet(SHEET_DOCUMENTS, DOC_HEADERS, '#0F2D52', '#F97316');
  setupSheet(SHEET_CLIENTS,   CLIENT_HEADERS, '#065F46', '#6EE7B7');
  setupSheet(SHEET_SERVICES,  SERVICE_HEADERS, '#1E40AF', '#93C5FD');
  setupSheet(SHEET_LOG,       LOG_HEADERS, '#4B5563', '#D1D5DB');
  SpreadsheetApp.getActiveSpreadsheet().toast(
    'I-Pro Solutions sheets created! Ready to sync.', '✓ Setup Complete', 5
  );
}

function setupSheet(name, headers, headerBg, headerFg) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let   sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
  }

  // Write headers
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }

  // Style header row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground(headerBg);
  headerRange.setFontColor(headerFg);
  headerRange.setFontWeight('bold');
  headerRange.setFontSize(11);
  headerRange.setFontFamily('Arial');

  // Freeze header
  sheet.setFrozenRows(1);

  // Auto-resize columns
  sheet.autoResizeColumns(1, headers.length);

  // Alternate row banding
  try {
    sheet.getBandings().forEach(b => b.remove());
    sheet.getRange(2, 1, Math.max(sheet.getMaxRows() - 1, 100), headers.length)
      .applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY);
  } catch (e) { /* banding not critical */ }

  return sheet;
}


// ═══════════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════════

function getOrCreateSheet(name, headers) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let   sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    const hr = sheet.getRange(1, 1, 1, headers.length);
    hr.setBackground('#0F2D52');
    hr.setFontColor('#FFFFFF');
    hr.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Find the row index (1-based) where the given column header has `value`.
 * Returns -1 if not found.
 */
function findRowByValue(sheet, headerName, value) {
  if (!value) return -1;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const colIdx  = headers.indexOf(headerName);
  if (colIdx < 0) return -1;

  const data = sheet.getRange(2, colIdx + 1, Math.max(sheet.getLastRow() - 1, 1), 1).getValues();
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]) === String(value)) return i + 2; // +2: header offset + 0-index
  }
  return -1;
}

function autoFormatDocSheet(sheet) {
  try {
    // Format currency columns (cols H, I, J = 8, 9, 10)
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      ['H', 'I', 'J'].forEach(col => {
        sheet.getRange(`${col}2:${col}${lastRow}`)
          .setNumberFormat('₹#,##0.00');
      });
    }
    sheet.autoResizeColumns(1, sheet.getLastColumn());
  } catch (e) { /* non-critical */ }
}

function writeLog(action, payloadType, docId, status, details) {
  try {
    const sheet = getOrCreateSheet(SHEET_LOG, LOG_HEADERS);
    sheet.appendRow([
      new Date().toISOString(), action, payloadType, docId, status, details
    ]);
  } catch (e) { /* ignore log failures */ }
}

function fmtNum(v) {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : Math.round(n * 100) / 100;
}

function jsonResponse(obj, code) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
