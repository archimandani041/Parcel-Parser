import fs from 'fs';
import path from 'path';

/**
 * Local JSON file storage fallback when Supabase connection is not initialized.
 * Ensures the application runs seamlessly out of the box in local dev/demo environments.
 */

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === 'production' || !process.env.PORT);
const baseDir = isServerless ? '/tmp' : process.cwd();
const DB_FILE = path.join(baseDir, 'uploads_db.json');
const UPLOADS_DIR = path.join(baseDir, 'uploads');

try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('[LocalStorage] Could not create uploads dir:', e.message);
}

function loadLocalDb() {
  if (!fs.existsSync(DB_FILE)) {
    const initial = { documents: [], extraction_results: [], extracted_items: [], extracted_fields: [], corrections: [] };
    try { fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2)); } catch {}
    return initial;
  }
  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    console.error('Error reading local storage DB:', e);
    return { documents: [], extraction_results: [], extracted_items: [], extracted_fields: [], corrections: [] };
  }
}

function saveLocalDb(db) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error('[LocalStorage] Could not write DB file:', e.message);
  }
}

export const localStorageService = {
  async saveUploadedFile(fileBuffer, fileName) {
    const timestamp = Date.now();
    const safeFileName = `${timestamp}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.join(UPLOADS_DIR, safeFileName);
    fs.writeFileSync(filePath, fileBuffer);
    return `/uploads/${safeFileName}`;
  },

  async uploadFileLocally(fileBuffer, fileName) {
    return this.saveUploadedFile(fileBuffer, fileName);
  },

  async insertDocumentRecord(docData) {
    const db = loadLocalDb();
    const now = new Date().toISOString();
    const newDoc = {
      id: docData.id || `doc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      file_name: docData.file_name,
      file_url: docData.file_url,
      file_type: docData.file_type,
      file_size: docData.file_size,
      status: docData.status || 'ANALYZING',
      processing_time: docData.processing_time || 0,
      overall_confidence: docData.overall_confidence || 0,
      error_message: docData.error_message || null,
      created_at: now,
      updated_at: now
    };
    db.documents.unshift(newDoc);
    saveLocalDb(db);
    return newDoc;
  },

  async saveExtractionResults(documentId, rawResponse, structuredJson) {
    const db = loadLocalDb();
    const now = new Date().toISOString();
    
    // Save or update extraction results
    const resultRecord = {
      id: `res_${Date.now()}`,
      document_id: documentId,
      raw_response: rawResponse,
      structured_json: structuredJson,
      created_at: now,
      updated_at: now
    };
    db.extraction_results = db.extraction_results.filter(r => r.document_id !== documentId);
    db.extraction_results.push(resultRecord);

    // Save line items
    if (Array.isArray(structuredJson.items)) {
      db.extracted_items = db.extracted_items.filter(i => i.document_id !== documentId);
      structuredJson.items.forEach(item => {
        db.extracted_items.push({
          id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          document_id: documentId,
          sku_id: item.sku_id || null,
          product_name: item.product_name || null,
          description: item.description || null,
          quantity: item.quantity !== undefined ? item.quantity : null,
          unit: item.unit || null,
          price: item.price !== undefined ? item.price : null,
          confidence: item.confidence || structuredJson.overall_confidence || 0.9,
          created_at: now
        });
      });
    }

    // Save flattened fields
    db.extracted_fields = db.extracted_fields.filter(f => f.document_id !== documentId);
    const extractFieldsRecursive = (obj, category = 'general') => {
      if (!obj || typeof obj !== 'object') return;
      for (const [key, value] of Object.entries(obj)) {
        if (value !== null && typeof value !== 'object') {
          db.extracted_fields.push({
            id: `fld_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            document_id: documentId,
            field_category: category,
            field_name: key,
            field_value: String(value),
            confidence: structuredJson.overall_confidence || 0.9,
            created_at: now
          });
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
          extractFieldsRecursive(value, key);
        }
      }
    };
    extractFieldsRecursive(structuredJson);

    saveLocalDb(db);
    return resultRecord;
  },

  async updateDocumentStatus(documentId, status, confidence, processingTime, errorMessage = null) {
    const db = loadLocalDb();
    const doc = db.documents.find(d => d.id === documentId);
    if (doc) {
      doc.status = status;
      if (confidence !== undefined) doc.overall_confidence = confidence;
      if (processingTime !== undefined) doc.processing_time = processingTime;
      if (errorMessage !== undefined) doc.error_message = errorMessage;
      doc.updated_at = new Date().toISOString();
      saveLocalDb(db);
    }
    return doc;
  },

  async getAllDocuments() {
    const db = loadLocalDb();
    return db.documents;
  },

  async getDocumentById(id) {
    const db = loadLocalDb();
    const doc = db.documents.find(d => d.id === id);
    if (!doc) return null;

    const extraction = db.extraction_results.find(r => r.document_id === id) || null;
    const items = db.extracted_items.filter(i => i.document_id === id) || [];
    const fields = db.extracted_fields.filter(f => f.document_id === id) || [];
    const corrections = db.corrections.filter(c => c.document_id === id) || [];

    return {
      ...doc,
      raw_response: extraction?.raw_response || null,
      structured_json: extraction?.structured_json || null,
      items,
      fields,
      corrections
    };
  },

  async addCorrection(documentId, fieldName, originalValue, correctedValue) {
    const db = loadLocalDb();
    const now = new Date().toISOString();
    const corr = {
      id: `corr_${Date.now()}`,
      document_id: documentId,
      field_name: fieldName,
      original_value: originalValue,
      corrected_value: correctedValue,
      created_at: now
    };
    db.corrections.push(corr);

    // Update field value in extracted_fields
    const targetField = db.extracted_fields.find(f => f.document_id === documentId && f.field_name === fieldName);
    if (targetField) {
      targetField.field_value = correctedValue;
    }

    // Update structured_json value dynamically
    const extraction = db.extraction_results.find(r => r.document_id === documentId);
    if (extraction && extraction.structured_json) {
      const updateDeepKey = (obj, targetKey, newVal) => {
        if (!obj || typeof obj !== 'object') return;
        for (const k in obj) {
          if (k === targetKey) {
            obj[k] = newVal;
          } else if (typeof obj[k] === 'object' && obj[k] !== null) {
            updateDeepKey(obj[k], targetKey, newVal);
          }
        }
      };
      updateDeepKey(extraction.structured_json, fieldName, correctedValue);
    }

    saveLocalDb(db);
    return corr;
  },

  async deleteDocument(id) {
    const db = loadLocalDb();
    db.documents = db.documents.filter(d => d.id !== id);
    db.extraction_results = db.extraction_results.filter(r => r.document_id !== id);
    db.extracted_items = db.extracted_items.filter(i => i.document_id !== id);
    db.extracted_fields = db.extracted_fields.filter(f => f.document_id !== id);
    db.corrections = db.corrections.filter(c => c.document_id !== id);
    saveLocalDb(db);
    return true;
  }
};
