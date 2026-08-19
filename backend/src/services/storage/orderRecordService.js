import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load .env from backend folder or root folder
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });
dotenv.config();

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (supabaseUrl && supabaseUrl.trim() && !supabaseUrl.includes('your-supabase') &&
      supabaseKey && supabaseKey.trim() && !supabaseKey.includes('your-supabase')) {
    try {
      return createClient(supabaseUrl, supabaseKey);
    } catch (e) {
      console.error('[OrderRecords] Supabase init error:', e.message);
    }
  }
  return null;
}

function getOrderDbPath() {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join('/tmp', 'order_records.json');
  }
  let rootDir = process.cwd();
  try {
    if (fs.existsSync(path.join(process.cwd(), '..', 'order_records.json'))) {
      rootDir = path.resolve(process.cwd(), '..');
    }
  } catch {}
  return path.join(rootDir, 'order_records.json');
}

function loadDb() {
  const dbPath = getOrderDbPath();
  if (!fs.existsSync(dbPath)) {
    try { fs.writeFileSync(dbPath, JSON.stringify([], null, 2)); } catch {}
    return [];
  }
  try { return JSON.parse(fs.readFileSync(dbPath, 'utf-8')); }
  catch { return []; }
}

function saveDb(records) {
  const dbPath = getOrderDbPath();
  try { fs.writeFileSync(dbPath, JSON.stringify(records, null, 2)); } catch {}
}

// ===== SERVICE =====
export const orderRecordService = {

  /** 
   * Insert or Upsert order records from Gemini extraction.
   * Supports single-label and multi-label/multi-page extractions (structuredJson.labels).
   */
  async createFromExtraction(structuredJson, documentId) {
    if (!structuredJson) return [];

    // Check for multi-label extraction array or single object
    let labelObjects = [];
    if (Array.isArray(structuredJson.labels) && structuredJson.labels.length > 0) {
      labelObjects = structuredJson.labels;
    } else {
      labelObjects = [structuredJson];
    }

    const savedRecords = [];
    const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    for (let index = 0; index < labelObjects.length; index++) {
      const labelObj = labelObjects[index];
      const order = labelObj.order || {};
      const customer = labelObj.customer || (index === 0 ? structuredJson.customer : {}) || {};
      const financial = labelObj.financial || (index === 0 ? structuredJson.financial : {}) || {};
      const items = Array.isArray(labelObj.items) && labelObj.items.length > 0
        ? labelObj.items
        : (index === 0 && Array.isArray(structuredJson.items) ? structuredJson.items : []);

      // Derive unique order_id per label (never fallback to top-level order_id on index > 0)
      let orderId = order.order_id || order.order_number || null;
      if (!orderId) {
        if (index === 0 && structuredJson.order?.order_id) {
          orderId = structuredJson.order.order_id;
        } else {
          orderId = `ORD_${documentId ? documentId.slice(0, 8) : Date.now()}_P${index + 1}`;
        }
      }

      const customerName = customer.name || null;

      // Aggregate SKUs and Product Names
      const skuList = items.map(i => {
        let s = i.sku_id ? String(i.sku_id).trim() : '';
        if (s.includes('|')) s = s.split('|')[0].trim();
        s = s.replace(/^\d+[\.\s]+/, '').trim();
        const words = s.split(/\s+/);
        if (words.length >= 2 && /^([A-Za-z0-9_-]+)$/.test(words[0])) return words[0];
        return s;
      }).filter(Boolean);

      const productNameList = items.map(i => {
        let p = i.product_name ? String(i.product_name).trim() : '';
        if ((!p || p === i.sku_id) && i.sku_id) {
          let s = String(i.sku_id).trim();
          if (s.includes('|')) s = s.split('|')[0].trim();
          s = s.replace(/^\d+[\.\s]+/, '').trim();
          const words = s.split(/\s+/);
          if (words.length >= 2 && /^([A-Za-z0-9_-]+)$/.test(words[0])) p = words.slice(1).join(' ');
        }
        if (p.includes('|')) p = p.split('|')[0].trim();
        return p;
      }).filter(Boolean);

      const skuIdStr = skuList.length > 0 ? skuList.join(' | ') : null;
      const productNameStr = productNameList.length > 0 ? productNameList.join(' | ') : null;

      // Total quantity calculation
      let totalQty = 0;
      items.forEach(i => {
        const q = parseInt(i.quantity, 10);
        totalQty += (!isNaN(q) && q > 0) ? q : 1;
      });
      if (totalQty === 0) totalQty = 1;

      // Prices — only set selling_price if explicitly specified on item
      const purchasePrice = items.find(i => i.purchase_price != null)?.purchase_price ?? null;
      const sellingPrice = items.find(i => i.selling_price != null)?.selling_price ?? items.find(i => i.price != null)?.price ?? null;

      const recordData = {
        order_id: orderId,
        customer_name: customerName,
        sku_id: skuIdStr,
        product_name: productNameStr,
        purchase_price: purchasePrice != null ? parseFloat(purchasePrice) : null,
        selling_price: sellingPrice != null ? parseFloat(sellingPrice) : null,
        quantity: totalQty,
        is_returned: false,
        document_id: isUUID(documentId) ? documentId : null,
        updated_at: new Date().toISOString()
      };

      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          console.log(`[OrderRecords] Upserting to Supabase for order_id: ${orderId}...`);
          const { data, error } = await supabase
            .from('order_records')
            .upsert(recordData, { onConflict: 'order_id' })
            .select()
            .single();

          if (!error && data) {
            console.log(`[OrderRecords] Saved to Supabase: ${data.order_id}`);
          } else if (error) {
            console.error('[OrderRecords] Supabase upsert error:', error.message);
          }
        } catch (e) {
          console.error('[OrderRecords] Supabase exception:', e.message);
        }
      }

      // Always perform local fallback persistence
      const db = loadDb();
      const existingIndex = db.findIndex(r => r.order_id === orderId);

      let savedRecord;
      if (existingIndex >= 0) {
        db[existingIndex] = {
          ...db[existingIndex],
          ...recordData,
          is_returned: db[existingIndex].is_returned || false
        };
        savedRecord = db[existingIndex];
      } else {
        savedRecord = {
          id: `or_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          ...recordData,
          created_at: new Date().toISOString()
        };
        db.unshift(savedRecord);
      }
      saveDb(db);
      savedRecords.push(savedRecord);
    }

    return savedRecords;
  },

  /** Get all order records (with optional search by order_id) */
  async getAll(search = null) {
    const supabase = getSupabaseClient();
    let supabaseRecords = [];
    const localDb = loadDb();

    if (supabase) {
      try {
        let query = supabase.from('order_records').select('*').order('created_at', { ascending: false });
        if (search && search.trim()) {
          query = query.ilike('order_id', `%${search.trim()}%`);
        }
        const { data, error } = await query;
        if (!error && data) {
          supabaseRecords = data;
        }
      } catch (e) {
        console.error('[OrderRecords] Supabase getAll exception:', e.message);
      }
    }

    // Combine local DB and Supabase records by order_id
    const map = new Map();
    localDb.forEach(r => { if (r.order_id) map.set(r.order_id, r); });
    supabaseRecords.forEach(r => { if (r.order_id) map.set(r.order_id, { ...map.get(r.order_id), ...r }); });

    let combined = Array.from(map.values());
    console.log(`[OrderRecords] getAll found ${combined.length} combined records (local: ${localDb.length}, supabase: ${supabaseRecords.length})`);

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      combined = combined.filter(r => r.order_id && r.order_id.toLowerCase().includes(q));
    }

    return combined;
  },

  /** Mark a record as returned */
  async markReturned(id) {
    let orderId = id;
    let targetId = id;

    const all = await this.getAll();
    const match = all.find(r => r.id === id || r.order_id === id);
    if (match) {
      orderId = match.order_id || id;
      targetId = match.id || id;
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('order_records')
          .update({ is_returned: true, updated_at: new Date().toISOString() })
          .or(`id.eq.${targetId},order_id.eq.${orderId}`)
          .select()
          .single();

        if (error) {
          console.error('[OrderRecords] Supabase return update error:', error.message);
          throw new Error(`Supabase return update error: ${error.message}`);
        }
      } catch (e) {
        console.error('[OrderRecords] Supabase return exception:', e.message);
        throw e;
      }
    }

    // Local fallback
    const db = loadDb();
    const rec = db.find(r => r.id === targetId || r.order_id === orderId);
    if (!rec) throw new Error('Record not found');
    rec.is_returned = true;
    rec.updated_at = new Date().toISOString();
    saveDb(db);
    return rec;
  },

  /** Undo return / restore record as normal (not returned) */
  async unmarkReturned(id) {
    let orderId = id;
    let targetId = id;

    const all = await this.getAll();
    const match = all.find(r => r.id === id || r.order_id === id);
    if (!match) throw new Error('Record not found');

    orderId = match.order_id || id;
    targetId = match.id || id;

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('order_records')
          .update({ is_returned: false, updated_at: new Date().toISOString() })
          .or(`id.eq.${targetId},order_id.eq.${orderId}`)
          .select()
          .single();

        if (error) {
          console.error('[OrderRecords] Supabase return undo error:', error.message);
          throw new Error(`Supabase return undo error: ${error.message}`);
        }

        // Delete return delivery charge record from stock_returns table in Supabase if present
        if (orderId) {
          await supabase.from('stock_returns').delete().eq('order_id', orderId);
        }
      } catch (e) {
        console.error('[OrderRecords] Supabase return undo exception:', e.message);
        throw e;
      }
    }

    // Local fallback persistence
    const db = loadDb();
    const rec = db.find(r => r.id === targetId || r.order_id === orderId);
    if (rec) {
      rec.is_returned = false;
      rec.updated_at = new Date().toISOString();
      saveDb(db);
    }

    // Delete from local stock_returns.json fallback if present
    if (orderId) {
      try {
        let rootDir = process.cwd();
        if (fs.existsSync(path.join(process.cwd(), '..', 'stock_returns.json'))) {
          rootDir = path.resolve(process.cwd(), '..');
        }
        const returnsPath = path.join(rootDir, 'stock_returns.json');
        if (fs.existsSync(returnsPath)) {
          const returnsData = JSON.parse(fs.readFileSync(returnsPath, 'utf-8'));
          const updatedData = returnsData.filter(r => r.order_id !== orderId);
          fs.writeFileSync(returnsPath, JSON.stringify(updatedData, null, 2));
        }
      } catch (err) {
        console.error('[OrderRecords] Error updating local stock_returns.json:', err.message);
      }
    }

    return rec || match;
  },

  /** Delete an order record permanently from Supabase & local storage */
  async deleteRecord(id) {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('order_records')
          .delete()
          .or(`id.eq.${id},order_id.eq.${id}`)
          .select();

        if (!error) {
          console.log(`[OrderRecords] Deleted record from Supabase: ${id}`);
          // Also remove from local db if present
          const db = loadDb();
          const filtered = db.filter(r => r.id !== id && r.order_id !== id);
          saveDb(filtered);
          return { success: true };
        }
        console.error('[OrderRecords] Supabase delete error:', error?.message);
      } catch (e) {
        console.error('[OrderRecords] Supabase delete exception:', e.message);
      }
    }

    // Local fallback deletion
    const db = loadDb();
    const initialLength = db.length;
    const filtered = db.filter(r => r.id !== id && r.order_id !== id);

    if (filtered.length === initialLength) {
      throw new Error('Record not found');
    }

    saveDb(filtered);
    return { success: true };
  },

  /** Sync existing local JSON records into Supabase when connected */
  async syncLocalToSupabase() {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase credentials are not configured in backend/.env');
    }

    const db = loadDb();
    if (db.length === 0) return { count: 0 };

    const recordsToInsert = db.map(r => ({
      order_id: r.order_id,
      customer_name: r.customer_name,
      sku_id: r.sku_id,
      product_name: r.product_name,
      purchase_price: r.purchase_price,
      selling_price: r.selling_price,
      quantity: r.quantity || 1,
      is_returned: Boolean(r.is_returned),
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('order_records')
      .upsert(recordsToInsert, { onConflict: 'order_id' })
      .select();

    if (error) throw new Error(`Supabase sync failed: ${error.message}`);
    return { count: data ? data.length : 0, data };
  },

  /** Get all records for XLSX export */
  async getAllForExport() {
    return this.getAll(null);
  }
};
