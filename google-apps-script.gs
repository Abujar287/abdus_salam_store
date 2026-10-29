/**
 * Google Apps Script for Abdus Salam Store (আব্দুস সালাম স্টোর)
 * 
 * ধাপসমূহ (Setup Steps):
 * ১. আপনার গুগল শিট ওপেন করে উপরের Extensions > Apps Script এ যান।
 * ২. পূর্বের সব কোড মুছে দিয়ে নিচের সম্পূর্ণ কোডটি পেস্ট করুন।
 * ৩. উপরে Save (💾) আইকনে ক্লিক করুন।
 * ৪. ফাংশন ড্রপডাউনে "setupAllSheets" সিলেক্ট করে "Run" চাপুন (প্রয়োজনে পারমিশন দিন)।
 *    এতে 'protinidhi'-সহ সব প্রয়োজনীয় ট্যাব ও হেডার স্বয়ংক্রিয়ভাবে তৈরি হয়ে যাবে!
 * ৫. এরপর উপরে Deploy > Manage Deployments এ যান।
 *    পেন্সিল (Edit) আইকনে ক্লিক করে Version এ "New Version" সিলেক্ট করুন এবং Deploy চাপুন।
 */

const REQUIRED_SHEETS = {
  'bikri': ['invoice no', 'date', 'customer name', 'customer mobile', 'location', 'product name', 'category', 'cost', 'sales', 'discount', 'baki', 'payment method', 'profit', 'datetime'],
  'stock': ['id', 'name', 'category', 'stock', 'unit', 'buyPrice', 'sellPrice', 'barcode', 'repName', 'repPhone', 'datetime'],
  'bakir khata': ['id', 'name', 'phone', 'address', 'dueAmount', 'lastPurchaseDate', 'createdAt', 'status', 'datetime'],
  'category': ['category_name', 'datetime'],
  'units': ['unit_name', 'datetime'],
  'joma': ['id', 'customerName', 'customerPhone', 'amount', 'method', 'date', 'timestamp', 'datetime'],
  'protinidhi': ['id', 'date', 'rep_name', 'phone', 'product_name', 'amount', 'payment_method', 'memo_no', 'notes', 'datetime']
};

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('আব্দুস সালাম স্টোর')
    .addItem('সবগুলো শিট ও প্রতিনিধি ট্যাব তৈরি করুন', 'setupAllSheets')
    .addToUi();
}

function setupAllSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureAllRequiredSheets(ss);
  try {
    SpreadsheetApp.getUi().alert('সাফল্য: protinidhi-সহ সবগুলো শিট ও হেডার সফলভাবে তৈরি ও সাজানো হয়েছে!');
  } catch (e) {
    // When run headlessly
  }
}

function ensureAllRequiredSheets(ss) {
  Object.keys(REQUIRED_SHEETS).forEach(sheetName => {
    let sheet = getSheetByNameLoose(ss, sheetName);
    const headers = REQUIRED_SHEETS[sheetName];
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#E8F5E9');
      sheet.setFrozenRows(1);
    } else {
      // Check if header exists
      const data = sheet.getDataRange().getValues();
      if (data.length === 0 || data[0].length === 0 || !data[0][0]) {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#E8F5E9');
        sheet.setFrozenRows(1);
      }
    }
  });
}

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureAllRequiredSheets(ss);

  const action = e && e.parameter ? e.parameter.action : 'getData';
  
  if (action === 'getData' || action === 'setup') {
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      stock: getSheetData(ss, 'stock'),
      bikri: getSheetData(ss, 'bikri'),
      bakir_khata: getSheetData(ss, 'bakir khata'),
      category: getSheetData(ss, 'category'),
      units: getSheetData(ss, 'units'),
      joma: getSheetData(ss, 'joma'),
      protinidhi: getSheetData(ss, 'protinidhi')
    })).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'Abdus Salam Store API is Live'
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ensureAllRequiredSheets(ss);

    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    if (action === 'syncData') {
      if (data.bikri && data.bikri.length > 0) updateSheet(ss, 'bikri', data.bikri);
      if (data.stock && data.stock.length > 0) updateSheet(ss, 'stock', data.stock);
      if (data['bakir khata'] && data['bakir khata'].length > 0) updateSheet(ss, 'bakir khata', data['bakir khata']);
      if (data.category && data.category.length > 0) updateSheet(ss, 'category', data.category);
      if (data.units && data.units.length > 0) updateSheet(ss, 'units', data.units);
      if (data.joma && data.joma.length > 0) updateSheet(ss, 'joma', data.joma);
      if (data.protinidhi && data.protinidhi.length > 0) updateSheet(ss, 'protinidhi', data.protinidhi);
      
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'setupSheets') {
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'All sheets ensured' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Invalid action' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function getSheetByNameLoose(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (sheet) return sheet;
  
  const allSheets = ss.getSheets();
  for (let s of allSheets) {
    const sName = s.getName().trim().toLowerCase();
    if (sName === name.toLowerCase()) return s;
    if (name === 'category' && (sName === 'catgeory' || sName === 'categories')) return s;
    if (name === 'bakir khata' && (sName === 'bakir_khata' || sName === 'baki' || sName === 'customers')) return s;
    if (name === 'protinidhi' && (sName === 'representative' || sName === 'rep')) return s;
  }
  return null;
}

function getSheetData(ss, sheetName) {
  let sheet = getSheetByNameLoose(ss, sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    return [];
  }
  
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  
  const headers = data[0];
  const rows = data.slice(1);
  
  return rows.map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      let val = row[i];
      if (val instanceof Date) {
        val = val.toISOString();
      }
      const key = header ? header.toString().toLowerCase().trim() : `col_${i}`;
      obj[key] = val;
    });
    return obj;
  });
}

function updateSheet(ss, sheetName, data) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return;
  }

  let sheet = getSheetByNameLoose(ss, sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  sheet.clear();
  
  const headers = Object.keys(data[0]);
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#E8F5E9');
  sheet.setFrozenRows(1);
  
  const values = data.map(row => {
    return headers.map(header => {
      let val = row[header];
      if (Array.isArray(val)) return JSON.stringify(val);
      if (typeof val === 'object' && val !== null) return JSON.stringify(val);
      return val;
    });
  });
  
  sheet.getRange(2, 1, values.length, headers.length).setValues(values);
}
