import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { localStorageService } from './localStorageFallback.js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
let isSupabaseConfigured = false;

if (
  supabaseUrl &&
  supabaseUrl.trim() !== '' &&
  !supabaseUrl.includes('your-supabase') &&
  supabaseKey &&
  supabaseKey.trim() !== '' &&
  !supabaseKey.includes('your-supabase')
) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    isSupabaseConfigured = true;
    console.log('[Supabase Service] Connected to Supabase PostgreSQL & Storage');
  } catch (err) {
    console.warn('[Supabase Service] Failed to initialize Supabase client:', err.message);
  }
} else {
  console.log('[Supabase Service] Supabase credentials not set or using placeholders. Defaulting to persistent local storage engine.');
}

export const dbService = {
  isConfigured() {
    return isSupabaseConfigured;
  },

  async uploadFile(fileBuffer, fileName, mimeType) {
    if (!isSupabaseConfigured) {
      return localStorageService.saveUploadedFile(fileBuffer, fileName);
    }

    try {
      const timestamp = Date.now();
      const safeName = `${timestamp}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const filePath = `labels/${safeName}`;

      const { data, error } = await supabase.storage
        .from('parcel-labels')
        .upload(filePath, fileBuffer, {
          contentType: mimeType,
          upsert: true
        });

      if (error) {
        console.error('[Supabase Storage] Upload error:', error.message);
        return localStorageService.saveUploadedFile(fileBuffer, fileName);
      }

      const { data: publicUrlData } = supabase.storage
        .from('parcel-labels')
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } catch (err) {
      console.error('[Supabase Storage] Exception:', err.message);
      return localStorageService.saveUploadedFile(fileBuffer, fileName);
    }
  },

  async createDocument(docData) {
    if (!isSupabaseConfigured) {
      return localStorageService.insertDocumentRecord(docData);
    }

    try {
      const { data, error } = await supabase
        .from('documents')
        .insert({
          file_name: docData.file_name,
          file_url: docData.file_url,
          file_type: docData.file_type,
          file_size: docData.file_size,
          status: docData.status || 'UPLOADING',
          processing_time: docData.processing_time || 0,
          overall_confidence: docData.overall_confidence || 0,
          error_message: docData.error_message || null
        })
        .select()
        .single();

      if (error) {
        console.error('[Supabase DB] Error creating document:', error.message);
        return localStorageService.insertDocumentRecord(docData);
      }

      return data;
    } catch (err) {
      console.error('[Supabase DB] Exception:', err.message);
      return localStorageService.insertDocumentRecord(docData);
    }
  },

  async saveExtraction(documentId, rawResponse, structuredJson) {
    if (!isSupabaseConfigured) {
      return localStorageService.saveExtractionResults(documentId, rawResponse, structuredJson);
    }

    try {
      // 1. Insert extraction_results record
      const { data: resultRecord, error: resErr } = await supabase
        .from('extraction_results')
        .insert({
          document_id: documentId,
          raw_response: rawResponse,
          structured_json: structuredJson
        })
        .select()
        .single();

      if (resErr) {
        console.error('[Supabase DB] Error inserting extraction result:', resErr.message);
      }

      // 2. Insert items
      if (Array.isArray(structuredJson.items) && structuredJson.items.length > 0) {
        const itemRows = structuredJson.items.map(item => ({
          document_id: documentId,
          sku_id: item.sku_id || null,
          product_name: item.product_name || null,
          description: item.description || null,
          quantity: item.quantity !== undefined ? item.quantity : null,
          unit: item.unit || null,
          price: item.price !== undefined ? item.price : null,
          confidence: item.confidence || structuredJson.overall_confidence || 0.9
        }));

        await supabase.from('extracted_items').insert(itemRows);
      }

      // 3. Insert flattened key-value extracted_fields
      const fieldRows = [];
      const extractRecursive = (obj, cat = 'general') => {
        if (!obj || typeof obj !== 'object') return;
        for (const [k, v] of Object.entries(obj)) {
          if (v !== null && typeof v !== 'object') {
            fieldRows.push({
              document_id: documentId,
              field_category: cat,
              field_name: k,
              field_value: String(v),
              confidence: structuredJson.overall_confidence || 0.9
            });
          } else if (v && typeof v === 'object' && !Array.isArray(v)) {
            extractRecursive(v, k);
          }
        }
      };
      extractRecursive(structuredJson);

      if (fieldRows.length > 0) {
        await supabase.from('extracted_fields').insert(fieldRows);
      }

      return resultRecord;
    } catch (err) {
      console.error('[Supabase DB] Exception in saveExtraction:', err.message);
      return localStorageService.saveExtractionResults(documentId, rawResponse, structuredJson);
    }
  },

  async updateDocumentStatus(documentId, status, confidence, processingTime, errorMessage = null) {
    if (!isSupabaseConfigured) {
      return localStorageService.updateDocumentStatus(documentId, status, confidence, processingTime, errorMessage);
    }

    try {
      const { data, error } = await supabase
        .from('documents')
        .update({
          status,
          overall_confidence: confidence,
          processing_time: processingTime,
          error_message: errorMessage,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .select()
        .single();

      if (error) {
        return localStorageService.updateDocumentStatus(documentId, status, confidence, processingTime, errorMessage);
      }
      return data;
    } catch (err) {
      return localStorageService.updateDocumentStatus(documentId, status, confidence, processingTime, errorMessage);
    }
  },

  async getDocuments() {
    if (!isSupabaseConfigured) {
      return localStorageService.getAllDocuments();
    }

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) {
        return localStorageService.getAllDocuments();
      }
      return data;
    } catch (err) {
      return localStorageService.getAllDocuments();
    }
  },

  async getDocumentDetail(id) {
    if (!isSupabaseConfigured) {
      return localStorageService.getDocumentById(id);
    }

    try {
      const { data: doc, error: docErr } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single();

      if (docErr || !doc) {
        return localStorageService.getDocumentById(id);
      }

      const { data: extraction } = await supabase
        .from('extraction_results')
        .select('*')
        .eq('document_id', id)
        .maybeSingle();

      const { data: items } = await supabase
        .from('extracted_items')
        .select('*')
        .eq('document_id', id);

      const { data: fields } = await supabase
        .from('extracted_fields')
        .select('*')
        .eq('document_id', id);

      const { data: corrections } = await supabase
        .from('corrections')
        .select('*')
        .eq('document_id', id)
        .order('created_at', { ascending: false });

      return {
        ...doc,
        raw_response: extraction?.raw_response || null,
        structured_json: extraction?.structured_json || null,
        items: items || [],
        fields: fields || [],
        corrections: corrections || []
      };
    } catch (err) {
      return localStorageService.getDocumentById(id);
    }
  },

  async saveCorrection(documentId, fieldName, originalValue, correctedValue) {
    if (!isSupabaseConfigured) {
      return localStorageService.addCorrection(documentId, fieldName, originalValue, correctedValue);
    }

    try {
      const { data, error } = await supabase
        .from('corrections')
        .insert({
          document_id: documentId,
          field_name: fieldName,
          original_value: originalValue,
          corrected_value: correctedValue
        })
        .select()
        .single();

      // Update extracted fields table
      await supabase
        .from('extracted_fields')
        .update({ field_value: correctedValue })
        .eq('document_id', documentId)
        .eq('field_name', fieldName);

      return data;
    } catch (err) {
      return localStorageService.addCorrection(documentId, fieldName, originalValue, correctedValue);
    }
  },

  async deleteDocument(id) {
    if (!isSupabaseConfigured) {
      return localStorageService.deleteDocument(id);
    }

    try {
      await supabase.from('documents').delete().eq('id', id);
      return true;
    } catch (err) {
      return localStorageService.deleteDocument(id);
    }
  }
};
