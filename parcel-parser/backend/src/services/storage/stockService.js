import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { orderRecordService } from './orderRecordService.js';

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
      console.error('[StockService] Supabase init error:', e.message);
    }
  }
  return null;
}

function getRootDir() {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) return '/tmp';
  try {
    if (fs.existsSync(path.join(process.cwd(), '..', 'package.json'))) {
      return path.resolve(process.cwd(), '..');
    }
  } catch {}
  return process.cwd();
}

function getProductsDbPath() {
  return path.join(getRootDir(), 'stock_products.json');
}

function getReturnsDbPath() {
  return path.join(getRootDir(), 'stock_returns.json');
}

function loadProductsDb() {
  const dbPath = getProductsDbPath();
  if (!fs.existsSync(dbPath)) {
    try { fs.writeFileSync(dbPath, JSON.stringify([], null, 2)); } catch {}
    return [];
  }
  try { return JSON.parse(fs.readFileSync(dbPath, 'utf-8')); }
  catch { return []; }
}

function saveProductsDb(data) {
  const dbPath = getProductsDbPath();
  try { fs.writeFileSync(dbPath, JSON.stringify(data, null, 2)); } catch {}
}

function loadReturnsDb() {
  const dbPath = getReturnsDbPath();
  if (!fs.existsSync(dbPath)) {
    try { fs.writeFileSync(dbPath, JSON.stringify([], null, 2)); } catch {}
    return [];
  }
  try { return JSON.parse(fs.readFileSync(dbPath, 'utf-8')); }
  catch { return []; }
}

function saveReturnsDb(data) {
  const dbPath = getReturnsDbPath();
  try { fs.writeFileSync(dbPath, JSON.stringify(data, null, 2)); } catch {}
}

// ===== HELPER FUNCTIONS =====

export function normalizeSku(skuId, productName) {
  let raw = (skuId || productName || '').trim();
  if (!raw) return 'UNSPECIFIED';
  if (raw.includes('|')) raw = raw.split('|')[0].trim();
  raw = raw.replace(/^\d+[\.\s]+/, '').trim();
  const parts = raw.split(/\s+/);
  if (parts.length >= 1 && /^([A-Za-z0-9_-]+)$/.test(parts[0])) {
    return parts[0].toUpperCase();
  }
  return raw.toUpperCase();
}

export function cleanProductName(skuId, productName) {
  if (productName && productName.trim()) {
    let p = productName.trim();
    if (p.includes('|')) p = p.split('|')[0].trim();
    return p;
  }
  if (skuId) {
    let s = String(skuId).trim();
    if (s.includes('|')) s = s.split('|')[0].trim();
    s = s.replace(/^\d+[\.\s]+/, '').trim();
    const parts = s.split(/\s+/);
    if (parts.length >= 2 && /^([A-Za-z0-9_-]+)$/.test(parts[0])) {
      return parts.slice(1).join(' ');
    }
  }
  return 'Product';
}

// ===== SERVICE DEFINITION =====

export const stockService = {
  
  /** Fetch all SKU stock product settings from Supabase or local DB */
  async getStockProductsMap() {
    const map = new Map();
    const localRecords = loadProductsDb();
    localRecords.forEach(r => {
      if (r.sku_id) map.set(r.sku_id.toUpperCase(), r);
    });

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('stock_products').select('*');
        if (!error && data) {
          data.forEach(r => {
            if (r.sku_id) {
              const existing = map.get(r.sku_id.toUpperCase()) || {};
              map.set(r.sku_id.toUpperCase(), { ...existing, ...r });
            }
          });
        }
      } catch (e) {
        console.error('[StockService] Supabase stock_products fetch error:', e.message);
      }
    }

    return map;
  },

  /** Fetch all return delivery charges from Supabase or local DB */
  async getStockReturnsMap() {
    const map = new Map();
    const localRecords = loadReturnsDb();
    localRecords.forEach(r => {
      if (r.order_id) map.set(r.order_id, r);
    });

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('stock_returns').select('*');
        if (!error && data) {
          data.forEach(r => {
            if (r.order_id) {
              const existing = map.get(r.order_id) || {};
              map.set(r.order_id, { ...existing, ...r });
            }
          });
        }
      } catch (e) {
        console.error('[StockService] Supabase stock_returns fetch error:', e.message);
      }
    }

    return map;
  },

  /** Get complete aggregated Stock overview grouped by SKU ID */
  async getStockOverview() {
    const allOrders = await orderRecordService.getAll();
    const productsMap = await this.getStockProductsMap();
    const returnsMap = await this.getStockReturnsMap();

    // Group order records by normalized SKU ID
    const skuGroupMap = new Map();

    allOrders.forEach(order => {
      const sku = normalizeSku(order.sku_id, order.product_name);
      const qty = parseInt(order.quantity, 10) || 1;
      const isReturned = Boolean(order.is_returned);

      if (!skuGroupMap.has(sku)) {
        skuGroupMap.set(sku, {
          sku_id: sku,
          product_name: cleanProductName(order.sku_id, order.product_name),
          total_quantity: 0,
          returned_quantity: 0,
          orders: [],
          order_purchase_price: order.purchase_price != null ? Number(order.purchase_price) : null,
          order_selling_price: order.selling_price != null ? Number(order.selling_price) : null
        });
      }

      const group = skuGroupMap.get(sku);
      group.total_quantity += qty;
      if (isReturned) {
        group.returned_quantity += qty;
      }
      group.orders.push(order);

      // Keep product name updated if currently generic
      if ((!group.product_name || group.product_name === 'Product') && order.product_name) {
        group.product_name = cleanProductName(order.sku_id, order.product_name);
      }
      if (group.order_purchase_price == null && order.purchase_price != null) {
        group.order_purchase_price = Number(order.purchase_price);
      }
      if (group.order_selling_price == null && order.selling_price != null) {
        group.order_selling_price = Number(order.selling_price);
      }
    });

    const products = [];

    skuGroupMap.forEach((group, sku) => {
      const storedConfig = productsMap.get(sku);

      const purchase_price = storedConfig?.purchase_price != null
        ? Number(storedConfig.purchase_price)
        : group.order_purchase_price;

      const selling_price = storedConfig?.selling_price != null
        ? Number(storedConfig.selling_price)
        : group.order_selling_price;

      const product_name = storedConfig?.product_name || group.product_name;

      const available_quantity = group.total_quantity - group.returned_quantity;

      const product_cost = purchase_price != null ? purchase_price * group.total_quantity : null;
      const selling_value = selling_price != null ? selling_price * group.total_quantity : null;

      const base_profit = (purchase_price != null && selling_price != null)
        ? (selling_price - purchase_price) * group.total_quantity
        : null;

      // Calculate return delivery charges for returned parcels of this SKU
      let total_return_delivery_charges = 0;
      group.orders.forEach(ord => {
        if (ord.is_returned) {
          const retConfig = returnsMap.get(ord.order_id);
          if (retConfig && retConfig.delivery_boy_charge != null) {
            total_return_delivery_charges += Number(retConfig.delivery_boy_charge);
          }
        }
      });

      const profit = base_profit != null ? base_profit - total_return_delivery_charges : null;

      products.push({
        sku_id: sku,
        product_name,
        total_quantity: group.total_quantity,
        returned_quantity: group.returned_quantity,
        available_quantity,
        purchase_price,
        selling_price,
        product_cost,
        selling_value,
        total_return_delivery_charges,
        profit
      });
    });

    // Summary calculations
    const summary = {
      total_products: products.length,
      total_quantity: products.reduce((acc, p) => acc + p.total_quantity, 0),
      total_product_cost: products.reduce((acc, p) => acc + (p.product_cost || 0), 0),
      total_selling_value: products.reduce((acc, p) => acc + (p.selling_value || 0), 0),
      total_profit: products.reduce((acc, p) => acc + (p.profit || 0), 0)
    };

    return { products, summary };
  },

  /** Update or insert product price for a SKU */
  async updateProductPrice(sku_id, purchase_price, selling_price, product_name) {
    const cleanSku = sku_id.trim().toUpperCase();
    const purchasePriceNum = purchase_price !== '' && purchase_price != null ? parseFloat(purchase_price) : null;
    const sellingPriceNum = selling_price !== '' && selling_price != null ? parseFloat(selling_price) : null;

    const payload = {
      sku_id: cleanSku,
      purchase_price: purchasePriceNum,
      selling_price: sellingPriceNum,
      updated_at: new Date().toISOString()
    };
    if (product_name) payload.product_name = product_name;

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('stock_products')
          .upsert(payload, { onConflict: 'sku_id' })
          .select()
          .single();

        if (!error && data) {
          console.log(`[StockService] Updated stock product in Supabase: ${cleanSku}`);
        } else if (error) {
          console.error('[StockService] Supabase stock_products upsert error:', error.message);
        }
      } catch (e) {
        console.error('[StockService] Supabase stock_products exception:', e.message);
      }
    }

    // Always update local DB fallback
    const db = loadProductsDb();
    const idx = db.findIndex(p => p.sku_id && p.sku_id.toUpperCase() === cleanSku);
    let saved;
    if (idx >= 0) {
      db[idx] = { ...db[idx], ...payload };
      saved = db[idx];
    } else {
      saved = { id: `sp_${Date.now()}`, created_at: new Date().toISOString(), ...payload };
      db.push(saved);
    }
    saveProductsDb(db);

    return saved;
  },

  /** Get Return overview of all returned orders */
  async getReturnsOverview() {
    const allOrders = await orderRecordService.getAll();
    const returnedOrders = allOrders.filter(o => Boolean(o.is_returned));
    const productsMap = await this.getStockProductsMap();
    const returnsMap = await this.getStockReturnsMap();

    const returns = returnedOrders.map(order => {
      const sku = normalizeSku(order.sku_id, order.product_name);
      const storedSkuConfig = productsMap.get(sku);
      const storedReturnConfig = returnsMap.get(order.order_id);

      const purchase_price = storedSkuConfig?.purchase_price != null
        ? Number(storedSkuConfig.purchase_price)
        : (order.purchase_price != null ? Number(order.purchase_price) : null);

      const selling_price = storedSkuConfig?.selling_price != null
        ? Number(storedSkuConfig.selling_price)
        : (order.selling_price != null ? Number(order.selling_price) : null);

      const product_name = storedSkuConfig?.product_name || cleanProductName(order.sku_id, order.product_name);
      const quantity = parseInt(order.quantity, 10) || 1;
      const delivery_boy_charge = storedReturnConfig?.delivery_boy_charge != null
        ? Number(storedReturnConfig.delivery_boy_charge)
        : 0;

      let profit_after_return = null;
      if (selling_price != null && purchase_price != null) {
        const baseProfit = (selling_price - purchase_price) * quantity;
        profit_after_return = baseProfit - delivery_boy_charge;
      }

      return {
        id: order.id,
        order_id: order.order_id,
        sku_id: sku,
        product_name,
        quantity,
        purchase_price,
        selling_price,
        delivery_boy_charge,
        profit_after_return,
        return_date: storedReturnConfig?.returned_at || order.updated_at || order.created_at || new Date().toISOString()
      };
    });

    const summary = {
      total_returned_parcels: returns.length,
      total_returned_quantity: returns.reduce((acc, r) => acc + r.quantity, 0),
      total_delivery_boy_charges: returns.reduce((acc, r) => acc + r.delivery_boy_charge, 0),
      total_profit_lost_from_returns: returns.reduce((acc, r) => acc + r.delivery_boy_charge, 0)
    };

    return { returns, summary };
  },

  /** Update or insert delivery boy charge for a returned order */
  async updateReturnCharge(order_id, delivery_boy_charge) {
    const chargeNum = delivery_boy_charge !== '' && delivery_boy_charge != null ? parseFloat(delivery_boy_charge) : 0;

    const payload = {
      order_id,
      delivery_boy_charge: chargeNum,
      updated_at: new Date().toISOString()
    };

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('stock_returns')
          .upsert(payload, { onConflict: 'order_id' })
          .select()
          .single();

        if (!error && data) {
          console.log(`[StockService] Updated stock return in Supabase for order: ${order_id}`);
        } else if (error) {
          console.error('[StockService] Supabase stock_returns upsert error:', error.message);
        }
      } catch (e) {
        console.error('[StockService] Supabase stock_returns exception:', e.message);
      }
    }

    // Always update local DB fallback
    const db = loadReturnsDb();
    const idx = db.findIndex(r => r.order_id === order_id);
    let saved;
    if (idx >= 0) {
      db[idx] = { ...db[idx], ...payload };
      saved = db[idx];
    } else {
      saved = { id: `sr_${Date.now()}`, returned_at: new Date().toISOString(), ...payload };
      db.push(saved);
    }
    saveReturnsDb(db);

    return saved;
  },

  /** Delete a stock product SKU and all associated order records from database */
  async deleteProduct(sku_id) {
    const cleanSku = sku_id.trim().toUpperCase();

    // 1. Delete from stock_products table in Supabase
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('stock_products').delete().ilike('sku_id', cleanSku);
        console.log(`[StockService] Deleted stock product from Supabase: ${cleanSku}`);
      } catch (e) {
        console.error('[StockService] Supabase delete stock_product error:', e.message);
      }
    }
    // Delete from local file
    const pDb = loadProductsDb();
    const updatedPDb = pDb.filter(p => !p.sku_id || p.sku_id.toUpperCase() !== cleanSku);
    saveProductsDb(updatedPDb);

    // 2. Delete all matching order records from database
    const allOrders = await orderRecordService.getAll();
    const ordersToDelete = allOrders.filter(o => normalizeSku(o.sku_id, o.product_name) === cleanSku);

    for (const ord of ordersToDelete) {
      if (ord.id) {
        await orderRecordService.deleteRecord(ord.id);
      }
    }

    return { success: true, deletedSku: cleanSku, deletedOrdersCount: ordersToDelete.length };
  },

  /** Delete a returned order record from database */
  async deleteReturn(order_id) {
    // 1. Delete from stock_returns table in Supabase
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('stock_returns').delete().eq('order_id', order_id);
        console.log(`[StockService] Deleted stock return from Supabase for order: ${order_id}`);
      } catch (e) {
        console.error('[StockService] Supabase delete stock_return error:', e.message);
      }
    }
    // Delete from local file
    const rDb = loadReturnsDb();
    const updatedRDb = rDb.filter(r => r.order_id !== order_id);
    saveReturnsDb(updatedRDb);

    // 2. Delete the order record from order_records
    const allOrders = await orderRecordService.getAll();
    const match = allOrders.find(o => o.order_id === order_id);
    if (match && match.id) {
      await orderRecordService.deleteRecord(match.id);
    }

    return { success: true, deletedOrderId: order_id };
  }
};
