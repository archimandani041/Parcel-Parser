import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { sanitizeExtractedJson } from '../gemini/geminiParser.js';
import { cleanOrphanedStock } from './stockService.js';

dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;
let isSupabaseConfigured = false;

if (supabaseUrl && supabaseUrl.trim() && !supabaseUrl.includes('your-supabase') &&
    supabaseKey && supabaseKey.trim() && !supabaseKey.includes('your-supabase')) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    isSupabaseConfigured = true;
    console.log('[Supabase Service] Connected to Supabase PostgreSQL & Storage');
  } catch (err) {
    console.error('[Supabase Service] Failed to initialize Supabase client:', err.message);
  }
} else {
  console.warn('[Supabase Service] Supabase credentials not found in environment.');
}

export const dbService = {

  isConfigured() {
    return isSupabaseConfigured;
  },

  async uploadFile(fileBuffer, originalFileName, mimeType) {
    const res = await this.uploadLabelFile(fileBuffer, originalFileName, mimeType);
    return typeof res === 'string' ? res : (res?.file_url || `/uploads/${originalFileName}`);
  },

  async createDocument(docData) {
    return this.createDocumentRecord(docData);
  },

  async uploadLabelFile(fileBuffer, originalFileName, mimeType) {
    // Always save local copy in uploads/ directory for guaranteed static serving
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const localPath = path.join(uploadsDir, originalFileName);
      fs.writeFileSync(localPath, fileBuffer);
    } catch (fsErr) {
      console.warn('[Supabase Storage] Local copy write error:', fsErr.message);
    }

    if (!isSupabaseConfigured) {
      return `/uploads/${encodeURIComponent(originalFileName)}`;
    }

    try {
      const timestamp = Date.now();
      const sanitizedName = originalFileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `labels/${timestamp}_${sanitizedName}`;

      const { data, error } = await supabase.storage
        .from('parcel-labels')
        .upload(storagePath, fileBuffer, {
          contentType: mimeType,
          upsert: true
        });

      if (error) {
        console.warn(`[Supabase Storage] Storage upload warning (${error.message}). Falling back to local serving.`);
        return `/uploads/${encodeURIComponent(originalFileName)}`;
      }

      const { data: publicUrlData } = supabase.storage
        .from('parcel-labels')
        .getPublicUrl(storagePath);

      return publicUrlData?.publicUrl || `/uploads/${encodeURIComponent(originalFileName)}`;
    } catch (err) {
      console.warn(`[Supabase Storage] Exception (${err.message}). Falling back to local serving.`);
      return `/uploads/${encodeURIComponent(originalFileName)}`;
    }
  },

  async createDocumentRecord(docData) {
    if (!isSupabaseConfigured) {
      throw new Error('[Supabase DB] Supabase credentials are not configured.');
    }

    try {
      const { data, error } = await supabase
        .from('documents')
        .insert({
          file_name: docData.file_name,
          file_url: docData.file_url,
          file_type: docData.file_type,
          file_size: docData.file_size,
          status: docData.status || 'ANALYZING',
          processing_time: docData.processing_time || 0,
          overall_confidence: docData.overall_confidence || 0.0,
          error_message: docData.error_message || null
        })
        .select()
        .single();

      if (error) {
        console.error('[Supabase DB] Error creating document record:', error.message);
        throw error;
      }

      return data;
    } catch (err) {
      console.error('[Supabase DB] Exception in createDocumentRecord:', err.message);
      throw err;
    }
  },

  async saveExtraction(documentId, rawResponse, structuredJson) {
    if (!isSupabaseConfigured) return null;

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
      throw err;
    }
  },

  async updateDocumentStatus(documentId, status, confidence, processingTime, errorMessage = null) {
    if (!isSupabaseConfigured) return null;

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
        console.error('[Supabase DB] Error updating status:', error.message);
      }

      return data;
    } catch (err) {
      console.error('[Supabase DB] Exception in updateDocumentStatus:', err.message);
      throw err;
    }
  },

  async getDocuments() {
    if (!isSupabaseConfigured) return [];

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Supabase DB] getDocuments error:', error.message);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('[Supabase DB] getDocuments exception:', err.message);
      return [];
    }
  },

  async getDocumentDetail(id) {
    if (!isSupabaseConfigured) return null;

    try {
      const { data: doc, error: docErr } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single();

      if (docErr || !doc) {
        console.error('[Supabase DB] getDocumentDetail error:', docErr?.message);
        return null;
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

      let structuredJson = extraction?.structured_json || null;

      // Reconstruct structured_json from extracted fields/items if structured_json is missing
      if (!structuredJson && ((fields && fields.length > 0) || (items && items.length > 0))) {
        const constructedObj = {
          document_type: 'shipping_label',
          order: {},
          customer: {},
          shipping: {},
          seller: {},
          financial: {},
          package: {},
          items: items || [],
          overall_confidence: doc.overall_confidence || 0.95
        };
        (fields || []).forEach(f => {
          const cat = f.field_category || 'order';
          if (!constructedObj[cat]) constructedObj[cat] = {};
          constructedObj[cat][f.field_name] = f.field_value;
        });
        structuredJson = constructedObj;
      }

      if (structuredJson) {
        structuredJson = sanitizeExtractedJson(structuredJson);
      }

      return {
        ...doc,
        raw_response: extraction?.raw_response || null,
        structured_json: structuredJson,
        items: items || [],
        fields: fields || [],
        corrections: corrections || []
      };
    } catch (err) {
      console.error('[Supabase DB] getDocumentDetail exception:', err.message);
      return null;
    }
  },

  async saveCorrection(documentId, fieldName, originalValue, correctedValue) {
    if (!isSupabaseConfigured) return null;

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

      if (error) console.error('[Supabase DB] saveCorrection error:', error.message);

      await supabase
        .from('extracted_fields')
        .update({ field_value: correctedValue })
        .eq('document_id', documentId)
        .eq('field_name', fieldName);

      return data;
    } catch (err) {
      console.error('[Supabase DB] saveCorrection exception:', err.message);
      throw err;
    }
  },

  async deleteDocument(id) {
    if (!isSupabaseConfigured) return false;

    try {
      await supabase.from('documents').delete().eq('id', id);
      await supabase.from('order_records').delete().or(`id.eq.${id},document_id.eq.${id}`);
      await supabase.from('extracted_fields').delete().eq('document_id', id);
      await supabase.from('extracted_items').delete().eq('document_id', id);
      await supabase.from('extraction_results').delete().eq('document_id', id);
      await supabase.from('corrections').delete().eq('document_id', id);

      // Trigger automatic stock & return cleanup to purge orphaned rows
      cleanOrphanedStock().catch(() => {});

      return true;
    } catch (err) {
      console.error('[Supabase DB] deleteDocument exception:', err.message);
      return false;
    }
  }
};

