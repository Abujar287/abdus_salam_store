/**
 * Google Apps Script for Abdus Salam Store
 * Copy this code and paste it into Extensions > Apps Script in your Google Sheet.
 * Then click "Deploy" > "New Deployment" > "Web App".
 * Set "Execute as" to "Me" and "Who has access" to "Anyone".
 */

function doGet(e) {
  const action = e.parameter.action;
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  
  if (action === 'getData') {
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      stock: getSheetData(sheet, 'stock'),
      bikri: getSheetData(sheet, 'bikri'),
      bakir_khata: getSheetData(sheet, 'bakir khata'),
      category: getSheetData(sheet, 'category'),
      units: getSheetData(sheet, 'units')
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const sheet = SpreadsheetApp.getActiveSpreadsheet();
    
    if (action === 'syncData') {
      if (data.bikri) updateSheet(sheet, 'bikri', data.bikri);
      if (data.stock) updateSheet(sheet, 'stock', data.stock);
      if (data['bakir khata']) updateSheet(sheet, 'bakir khata', data['bakir khata']);
      if (data.category) updateSheet(sheet, 'category', data.category);
      if (data.units) updateSheet(sheet, 'units', data.units);
      
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Invalid action' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getSheetData(ss, sheetName) {
  let sheet = ss.getSheetByName(sheetName);
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
      // Convert Date objects to ISO strings to avoid timezone issues during JSON transfer
      if (val instanceof Date) {
        val = val.toISOString();
      }
      obj[header.toString().toLowerCase().trim()] = val;
    });
    return obj;
  });
}

function updateSheet(ss, sheetName, data) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  sheet.clear();
  
  if (data.length === 0) return;
  
  // Extract all unique keys as headers
  const headers = Object.keys(data[0]);
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
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
