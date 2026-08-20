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

// ===== SERVICE =====
export const orderRecordService = {

  /** 
   * Insert or Upsert order records from Gemini extraction directly into Supabase.
   * Supports single-label and multi-label/multi-page extractions.
   */
  async createFromExtraction(structuredJson, documentId) {
    if (!structuredJson) return [];

    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('[OrderRecords] Supabase client is not configured.');
    }

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
      const items = Array.isArray(labelObj.items) && labelObj.items.length > 0
        ? labelObj.items
        : (index === 0 && Array.isArray(structuredJson.items) ? structuredJson.items : []);

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

      let totalQty = 0;
      items.forEach(i => {
        const q = parseInt(i.quantity, 10);
        totalQty += (!isNaN(q) && q > 0) ? q : 1;
      });
      if (totalQty === 0) totalQty = 1;

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

      try {
        console.log(`[OrderRecords] Upserting to Supabase for order_id: ${orderId}...`);
        const { data, error } = await supabase
          .from('order_records')
          .upsert(recordData, { onConflict: 'order_id' })
          .select()
          .single();

        if (!error && data) {
          console.log(`[OrderRecords] Saved to Supabase: ${data.order_id}`);
          savedRecords.push(data);
        } else if (error) {
          console.error('[OrderRecords] Supabase upsert error:', error.message);
          savedRecords.push(recordData);
        }
      } catch (e) {
        console.error('[OrderRecords] Supabase exception:', e.message);
      }
    }

    return savedRecords;
  },

  /** Get all order records directly from Supabase */
  async getAll(search = null) {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    try {
      let query = supabase.from('order_records').select('*').order('created_at', { ascending: false });
      if (search && search.trim()) {
        query = query.ilike('order_id', `%${search.trim()}%`);
      }
      const { data, error } = await query;
      if (error) {
        console.error('[OrderRecords] Supabase getAll error:', error.message);
        return [];
      }
      return data || [];
    } catch (e) {
      console.error('[OrderRecords] Supabase getAll exception:', e.message);
      return [];
    }
  },

  /** Mark a record as returned in Supabase */
  async markReturned(id, return_type = 'CUSTOMER_RETURN') {
    let orderId = id;
    let targetId = id;
    const cleanReturnType = return_type === 'RTO_RETURN' ? 'RTO_RETURN' : 'CUSTOMER_RETURN';
    const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('[OrderRecords] Supabase client is not configured.');

    const all = await this.getAll();
    const match = all.find(r => r.id === id || r.order_id === id);
    if (match) {
      orderId = match.order_id || id;
      targetId = match.id || id;
    }

    try {
      let query = supabase
        .from('order_records')
        .update({ is_returned: true, updated_at: new Date().toISOString() });

      if (isUUID(targetId)) {
        query = query.or(`id.eq.${targetId},order_id.eq.${orderId}`);
      } else {
        query = query.eq('order_id', orderId);
      }

      const { data, error } = await query.select();
      if (error) {
        console.error('[OrderRecords] Supabase return update error:', error.message);
      } else {
        console.log(`[OrderRecords] Supabase marked returned: ${orderId} (${cleanReturnType})`);
      }

      // Upsert stock_returns entry in local fallback file and Supabase if present
      if (orderId) {
        try {
          const rootDir = (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
            ? '/tmp'
            : (fs.existsSync(path.join(process.cwd(), '..', 'package.json')) ? path.resolve(process.cwd(), '..') : process.cwd());
          const returnsDbPath = path.join(rootDir, 'stock_returns.json');
          let retDb = [];
          if (fs.existsSync(returnsDbPath)) {
            try { retDb = JSON.parse(fs.readFileSync(returnsDbPath, 'utf-8')); } catch {}
          }
          const existingIdx = retDb.findIndex(r => r.order_id === orderId);
          if (existingIdx >= 0) {
            retDb[existingIdx].return_type = cleanReturnType;
          } else {
            retDb.push({
              id: `sr_${Date.now()}`,
              order_id: orderId,
              return_type: cleanReturnType,
              delivery_boy_charge: 0,
              returned_at: new Date().toISOString()
            });
          }
          fs.writeFileSync(returnsDbPath, JSON.stringify(retDb, null, 2));
        } catch (e) {}

        try {
          await supabase.from('stock_returns').upsert({
            order_id: orderId,
            return_type: cleanReturnType,
            delivery_boy_charge: 0,
            updated_at: new Date().toISOString()
          }, { onConflict: 'order_id' });
        } catch (e) {
          // ignore if table doesn't exist
        }
      }

      if (data && data.length > 0) return data[0];
      if (match) return { ...match, is_returned: true };
      return { id: targetId, order_id: orderId, is_returned: true };

    } catch (e) {
      console.error('[OrderRecords] Supabase return exception:', e.message);
      throw e;
    }
  },

  /** Undo return in Supabase */
  async unmarkReturned(id) {
    let orderId = id;
    let targetId = id;
    const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('[OrderRecords] Supabase client is not configured.');

    const all = await this.getAll();
    const match = all.find(r => r.id === id || r.order_id === id);
    if (match) {
      orderId = match.order_id || id;
      targetId = match.id || id;
    }

    try {
      let query = supabase
        .from('order_records')
        .update({ is_returned: false, updated_at: new Date().toISOString() });

      if (isUUID(targetId)) {
        query = query.or(`id.eq.${targetId},order_id.eq.${orderId}`);
      } else {
        query = query.eq('order_id', orderId);
      }

      const { data, error } = await query.select();
      if (error) {
        console.error('[OrderRecords] Supabase return undo error:', error.message);
      }

      if (orderId) {
        try {
          const rootDir = (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
            ? '/tmp'
            : (fs.existsSync(path.join(process.cwd(), '..', 'package.json')) ? path.resolve(process.cwd(), '..') : process.cwd());
          const returnsDbPath = path.join(rootDir, 'stock_returns.json');
          if (fs.existsSync(returnsDbPath)) {
            let retDb = JSON.parse(fs.readFileSync(returnsDbPath, 'utf-8'));
            retDb = retDb.filter(r => r.order_id !== orderId);
            fs.writeFileSync(returnsDbPath, JSON.stringify(retDb, null, 2));
          }
        } catch (e) {}

        try {
          await supabase.from('stock_returns').delete().eq('order_id', orderId);
        } catch (e) {}
      }

      if (data && data.length > 0) return data[0];
      return { id: targetId, order_id: orderId, is_returned: false };
    } catch (e) {
      console.error('[OrderRecords] Supabase return undo exception:', e.message);
      throw e;
    }
  },

  /** Delete an order record permanently from Supabase */
  async deleteRecord(id) {
    let orderId = id;
    let targetId = id;
    const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('[OrderRecords] Supabase client is not configured.');

    const all = await this.getAll();
    const match = all.find(r => r.id === id || r.order_id === id);
    if (match) {
      orderId = match.order_id || id;
      targetId = match.id || id;
    }

    try {
      let query = supabase.from('order_records').delete();
      if (isUUID(targetId)) {
        query = query.or(`id.eq.${targetId},order_id.eq.${orderId}`);
      } else {
        query = query.eq('order_id', orderId);
      }

      const { error } = await query;
      if (error) {
        console.error('[OrderRecords] Supabase delete error:', error.message);
        throw error;
      }
      return { success: true };
    } catch (e) {
      console.error('[OrderRecords] Supabase delete exception:', e.message);
      throw e;
    }
  },

  /** Sync existing records */
  async syncLocalToSupabase() {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase credentials are not configured');
    }
    const all = await this.getAll();
    return { count: all.length, data: all };
  },

  /** Get all records for XLSX export */
  async getAllForExport() {
    return this.getAll(null);
  }
};

