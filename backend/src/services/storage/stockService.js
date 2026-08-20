import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { orderRecordService } from './orderRecordService.js';
import { dbService } from './supabaseService.js';

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
    const supabase = getSupabaseClient();

    // 1. Primary: Fetch from Supabase stock_products table
    if (supabase) {
      try {
        const { data, error } = await supabase.from('stock_products').select('*');
        if (!error && data) {
          data.forEach(r => {
            if (r.sku_id) {
              map.set(r.sku_id.toUpperCase(), r);
            }
          });
        }
      } catch (e) {
        console.error('[StockService] Supabase stock_products fetch error:', e.message);
      }

      // 2. Also populate prices saved directly on order_records table in Supabase
      try {
        const { data } = await supabase
          .from('order_records')
          .select('sku_id, product_name, purchase_price, selling_price')
          .not('sku_id', 'is', null);

        if (data) {
          data.forEach(r => {
            if (r.sku_id) {
              const sku = r.sku_id.toUpperCase();
              const existing = map.get(sku) || {};
              const updated = { ...existing };
              if (updated.purchase_price == null && r.purchase_price != null) updated.purchase_price = r.purchase_price;
              if (updated.selling_price == null && r.selling_price != null) updated.selling_price = r.selling_price;
              if (!updated.product_name && r.product_name) updated.product_name = r.product_name;
              map.set(sku, updated);
            }
          });
        }
      } catch (e) {}
    }

    // 3. Fallback: Merge local file records
    const localRecords = loadProductsDb();
    localRecords.forEach(r => {
      if (r.sku_id) {
        const sku = r.sku_id.toUpperCase();
        if (!map.has(sku)) {
          map.set(sku, r);
        } else {
          const existing = map.get(sku);
          if (existing.purchase_price == null && r.purchase_price != null) existing.purchase_price = r.purchase_price;
          if (existing.selling_price == null && r.selling_price != null) existing.selling_price = r.selling_price;
        }
      }
    });

    return map;
  },

  /** Fetch all return delivery charges from Supabase or local DB */
  async getStockReturnsMap() {
    const map = new Map();
    const supabase = getSupabaseClient();

    // 1. Primary: Fetch from Supabase stock_returns table
    if (supabase) {
      try {
        const { data, error } = await supabase.from('stock_returns').select('*');
        if (!error && data) {
          data.forEach(r => {
            if (r.order_id) map.set(r.order_id, r);
          });
        }
      } catch (e) {
        console.error('[StockService] Supabase stock_returns fetch error:', e.message);
      }

      // 2. Also populate return charges stored directly on order_records table in Supabase
      try {
        const { data } = await supabase
          .from('order_records')
          .select('order_id, return_type, delivery_boy_charge')
          .eq('is_returned', true);

        if (data) {
          data.forEach(r => {
            if (r.order_id) {
              const existing = map.get(r.order_id) || {};
              const updated = { ...existing };
              if (updated.delivery_boy_charge == null && r.delivery_boy_charge != null) {
                updated.delivery_boy_charge = r.delivery_boy_charge;
              }
              if (!updated.return_type && r.return_type) {
                updated.return_type = r.return_type;
              }
              map.set(r.order_id, updated);
            }
          });
        }
      } catch (e) {}
    }

    // 3. Fallback: Merge local file records
    const localRecords = loadReturnsDb();
    localRecords.forEach(r => {
      if (r.order_id) {
        if (!map.has(r.order_id)) {
          map.set(r.order_id, r);
        } else {
          const existing = map.get(r.order_id);
          if (existing.delivery_boy_charge == null && r.delivery_boy_charge != null) {
            existing.delivery_boy_charge = r.delivery_boy_charge;
          }
          if (!existing.return_type && r.return_type) {
            existing.return_type = r.return_type;
          }
        }
      }
    });

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
      const retConfig = returnsMap.get(order.order_id);
      const isReturned = Boolean(order.is_returned);
      const return_type = retConfig?.return_type || order.return_type || 'CUSTOMER_RETURN';

      if (!skuGroupMap.has(sku)) {
        skuGroupMap.set(sku, {
          sku_id: sku,
          product_name: cleanProductName(order.sku_id, order.product_name),
          total_quantity: 0,
          customer_returned_quantity: 0,
          rto_returned_quantity: 0,
          returned_quantity: 0,
          orders: [],
          order_purchase_price: order.purchase_price != null ? Number(order.purchase_price) : null,
          order_selling_price: order.selling_price != null ? Number(order.selling_price) : null
        });
      }

      const group = skuGroupMap.get(sku);
      group.total_quantity += qty;
      if (isReturned) {
        if (return_type === 'RTO_RETURN') {
          group.rto_returned_quantity += qty;
        } else {
          group.customer_returned_quantity += qty;
        }
        group.returned_quantity += qty;
      }
      group.orders.push({ ...order, return_type });

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

      const total_quantity = group.total_quantity;
      const customer_returned_quantity = group.customer_returned_quantity;
      const rto_returned_quantity = group.rto_returned_quantity;
      const returned_quantity = customer_returned_quantity + rto_returned_quantity;

      // Successfully Sold Quantity: Sadi units actually sold and NOT returned
      const successfully_sold_quantity = Math.max(0, total_quantity - returned_quantity);

      // Current Available Stock: Actual physical sarees currently available in hand
      const available_quantity = Math.max(0, total_quantity - successfully_sold_quantity);

      const inventory_cost = purchase_price != null ? purchase_price * available_quantity : null;
      const inventory_value = selling_price != null ? selling_price * available_quantity : null;

      // 1. If Selling Price > Purchase Price:
      //    Profit per sold item = Selling Price - Purchase Price, Loss per sold item = 0
      // 2. If Purchase Price > Selling Price:
      //    This is a LOSS, not negative profit! Profit per sold item = 0, Loss per sold item = Purchase Price - Selling Price
      let profit_per_unit = 0;
      let sales_loss_per_unit = 0;

      if (selling_price != null && purchase_price != null) {
        if (selling_price > purchase_price) {
          profit_per_unit = selling_price - purchase_price;
        } else if (purchase_price > selling_price) {
          sales_loss_per_unit = purchase_price - selling_price;
        }
      }

      // Realized Sales Profit is ONLY from profitable sales (always >= 0)
      const realized_sales_profit = (selling_price != null && purchase_price != null)
        ? profit_per_unit * successfully_sold_quantity
        : null;

      // Sales Loss is ONLY from loss-making sales (always >= 0)
      const sales_loss = (selling_price != null && purchase_price != null)
        ? sales_loss_per_unit * successfully_sold_quantity
        : 0;

      // Calculate return delivery charges ONLY for CUSTOMER_RETURN parcels of this SKU
      let customer_return_loss = 0;
      group.orders.forEach(ord => {
        if (ord.is_returned) {
          const retConfig = returnsMap.get(ord.order_id);
          const rType = retConfig?.return_type || ord.return_type || 'CUSTOMER_RETURN';
          if (rType === 'CUSTOMER_RETURN' && retConfig && retConfig.delivery_boy_charge != null) {
            customer_return_loss += Number(retConfig.delivery_boy_charge);
          }
        }
      });

      // RTO Return Loss is strictly ₹0
      const rto_return_loss = 0;
      const return_loss = customer_return_loss;

      // Total Loss = Sales Loss (from selling below purchase price) + Customer Return Loss (delivery charges)
      const total_loss = sales_loss + customer_return_loss;

      // Net Profit = Realized Sales Profit - Sales Loss - Customer Return Loss
      // Per user instruction: If Net Profit < 0, set to 0 (loss is already represented in Sales Loss & Return Loss fields)
      const raw_net_profit = realized_sales_profit != null ? realized_sales_profit - sales_loss - customer_return_loss : null;
      const net_profit = (raw_net_profit != null && raw_net_profit < 0) ? 0 : raw_net_profit;

      products.push({
        sku_id: sku,
        product_name,
        total_quantity,
        successfully_sold_quantity,
        customer_returned_quantity,
        rto_returned_quantity,
        returned_quantity,
        available_quantity,
        current_available_stock: available_quantity,
        realized_sales_quantity: successfully_sold_quantity,
        purchase_price,
        selling_price,
        inventory_cost,
        inventory_value,
        realized_sales_profit,
        sales_loss,
        customer_return_loss,
        rto_return_loss: 0,
        return_loss: customer_return_loss,
        total_loss,
        net_profit,
        raw_net_profit,
        profit: net_profit,
        // Backward compatibility aliases
        product_cost: inventory_cost,
        selling_value: inventory_value,
        total_return_delivery_charges: customer_return_loss
      });
    });

    // Summary calculations
    const summary = {
      total_products: products.length,
      total_quantity: products.reduce((acc, p) => acc + p.total_quantity, 0),
      total_successfully_sold_quantity: products.reduce((acc, p) => acc + p.successfully_sold_quantity, 0),
      total_customer_returned_quantity: products.reduce((acc, p) => acc + p.customer_returned_quantity, 0),
      total_rto_returned_quantity: products.reduce((acc, p) => acc + p.rto_returned_quantity, 0),
      total_returned_quantity: products.reduce((acc, p) => acc + p.returned_quantity, 0),
      total_available_quantity: products.reduce((acc, p) => acc + p.available_quantity, 0),
      total_inventory_cost: products.reduce((acc, p) => acc + (p.inventory_cost || 0), 0),
      total_inventory_value: products.reduce((acc, p) => acc + (p.inventory_value || 0), 0),
      total_realized_sales_profit: products.reduce((acc, p) => acc + (p.realized_sales_profit || 0), 0),
      total_sales_loss: products.reduce((acc, p) => acc + (p.sales_loss || 0), 0),
      total_customer_return_loss: products.reduce((acc, p) => acc + (p.customer_return_loss || 0), 0),
      total_return_loss: products.reduce((acc, p) => acc + (p.customer_return_loss || 0), 0),
      total_loss: products.reduce((acc, p) => acc + (p.total_loss || 0), 0),
      total_net_profit: Math.max(0, products.reduce((acc, p) => acc + (p.realized_sales_profit || 0), 0) - products.reduce((acc, p) => acc + (p.total_loss || 0), 0)),
      total_profit: Math.max(0, products.reduce((acc, p) => acc + (p.realized_sales_profit || 0), 0) - products.reduce((acc, p) => acc + (p.total_loss || 0), 0)),
      // Backward compatibility aliases
      total_product_cost: products.reduce((acc, p) => acc + (p.inventory_cost || 0), 0),
      total_selling_value: products.reduce((acc, p) => acc + (p.inventory_value || 0), 0)
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

    // 1. Save to local DB fallback
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

    const supabase = getSupabaseClient();
    if (supabase) {
      // 2. Update order_records in Supabase for matching SKU
      try {
        const updateObj = { updated_at: new Date().toISOString() };
        if (purchasePriceNum != null) updateObj.purchase_price = purchasePriceNum;
        if (sellingPriceNum != null) updateObj.selling_price = sellingPriceNum;
        if (product_name) updateObj.product_name = product_name;

        await supabase.from('order_records').update(updateObj).eq('sku_id', cleanSku);
      } catch (e) {}

      // 3. Upsert into stock_products table in Supabase if exists
      try {
        const { data, error } = await supabase
          .from('stock_products')
          .upsert(payload, { onConflict: 'sku_id' })
          .select()
          .single();

        if (!error && data) {
          return data;
        }
      } catch (e) {}
    }

    return saved;
  },

  /** Get Return overview of all returned orders */
  async getReturnsOverview() {
    const allOrders = await orderRecordService.getAll();
    const productsMap = await this.getStockProductsMap();
    const returnsMap = await this.getStockReturnsMap();
    const returnedOrders = allOrders.filter(o => Boolean(o.is_returned));

    const returns = returnedOrders.map(order => {
      const sku = normalizeSku(order.sku_id, order.product_name);
      const storedSkuConfig = productsMap.get(sku);
      const storedReturnConfig = returnsMap.get(order.order_id);

      const return_type = storedReturnConfig?.return_type || order.return_type || 'CUSTOMER_RETURN';

      const purchase_price = storedSkuConfig?.purchase_price != null
        ? Number(storedSkuConfig.purchase_price)
        : (order.purchase_price != null ? Number(order.purchase_price) : null);

      const selling_price = storedSkuConfig?.selling_price != null
        ? Number(storedSkuConfig.selling_price)
        : (order.selling_price != null ? Number(order.selling_price) : null);

      const product_name = storedSkuConfig?.product_name || cleanProductName(order.sku_id, order.product_name);
      const quantity = parseInt(order.quantity, 10) || 1;
      const delivery_boy_charge = return_type === 'RTO_RETURN'
        ? 0
        : (storedReturnConfig?.delivery_boy_charge != null ? Number(storedReturnConfig.delivery_boy_charge) : 0);

      const return_loss = return_type === 'RTO_RETURN' ? 0 : delivery_boy_charge;

      return {
        id: order.id,
        order_id: order.order_id,
        customer_name: order.customer_name || '',
        sku_id: sku,
        product_name,
        quantity,
        purchase_price,
        selling_price,
        return_type,
        delivery_boy_charge,
        return_loss,
        profit_after_return: return_loss,
        return_date: storedReturnConfig?.returned_at || order.updated_at || order.created_at || new Date().toISOString()
      };
    });

    const customerReturns = returns.filter(r => r.return_type === 'CUSTOMER_RETURN');
    const rtoReturns = returns.filter(r => r.return_type === 'RTO_RETURN');

    const summary = {
      total_returned_parcels: returns.length,
      total_returned_quantity: returns.reduce((acc, r) => acc + r.quantity, 0),

      // Customer Return Category Summary
      total_customer_returns: customerReturns.length,
      total_customer_returned_quantity: customerReturns.reduce((acc, r) => acc + r.quantity, 0),
      total_customer_delivery_charges: customerReturns.reduce((acc, r) => acc + r.delivery_boy_charge, 0),
      total_customer_return_loss: customerReturns.reduce((acc, r) => acc + r.return_loss, 0),

      // RTO Return Category Summary
      total_rto_returns: rtoReturns.length,
      total_rto_returned_quantity: rtoReturns.reduce((acc, r) => acc + r.quantity, 0),
      total_rto_delivery_charges: 0,
      total_rto_return_loss: 0,

      // Combined
      total_delivery_boy_charges: customerReturns.reduce((acc, r) => acc + r.delivery_boy_charge, 0),
      total_return_loss: customerReturns.reduce((acc, r) => acc + r.return_loss, 0),
      total_profit_lost_from_returns: customerReturns.reduce((acc, r) => acc + r.return_loss, 0)
    };

    return { returns, customerReturns, rtoReturns, summary };
  },

  /** Update or insert delivery boy charge for a returned order */
  async updateReturnCharge(order_id, delivery_boy_charge, return_type) {
    const chargeNum = delivery_boy_charge !== '' && delivery_boy_charge != null ? parseFloat(delivery_boy_charge) : 0;

    const payload = {
      order_id,
      delivery_boy_charge: chargeNum,
      updated_at: new Date().toISOString()
    };
    if (return_type) payload.return_type = return_type;

    const supabase = getSupabaseClient();
    let supabaseResult = null;

    if (supabase) {
      try {
        // Update core order_records table in Supabase directly
        const orderUpdate = { delivery_boy_charge: chargeNum, updated_at: new Date().toISOString() };
        if (return_type) orderUpdate.return_type = return_type;

        await supabase
          .from('order_records')
          .update(orderUpdate)
          .eq('order_id', order_id);

        // Upsert stock_returns table in Supabase
        const { data, error } = await supabase
          .from('stock_returns')
          .upsert(payload, { onConflict: 'order_id' })
          .select()
          .single();

        if (!error && data) {
          supabaseResult = data;
        }
      } catch (e) {
        console.error('[StockService] Supabase stock_returns exception:', e.message);
      }
    }

    // Always keep local file fallback in sync
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

    return supabaseResult || saved;
  },

  /** Delete a stock product SKU and all associated order records */
  async deleteProduct(sku_id) {
    const cleanSku = sku_id.trim().toUpperCase();

    // 1. Delete from local file
    const pDb = loadProductsDb();
    const updatedPDb = pDb.filter(p => !p.sku_id || p.sku_id.toUpperCase() !== cleanSku);
    saveProductsDb(updatedPDb);

    // 2. Delete from Supabase if table exists
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('stock_products').delete().ilike('sku_id', cleanSku);
      } catch (e) {}
    }

    // 3. Delete matching order records
    const allOrders = await orderRecordService.getAll();
    const ordersToDelete = allOrders.filter(o => normalizeSku(o.sku_id, o.product_name) === cleanSku);

    for (const ord of ordersToDelete) {
      if (ord.id) {
        await orderRecordService.deleteRecord(ord.id);
      }
    }

    return { success: true, deletedSku: cleanSku, deletedOrdersCount: ordersToDelete.length };
  },

  /** Delete a returned order record */
  async deleteReturn(order_id) {
    // 1. Delete from local file
    const rDb = loadReturnsDb();
    const updatedRDb = rDb.filter(r => r.order_id !== order_id);
    saveReturnsDb(updatedRDb);

    // 2. Delete from Supabase if table exists
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('stock_returns').delete().eq('order_id', order_id);
      } catch (e) {}
    }

    // 3. Delete the order record from order_records
    const allOrders = await orderRecordService.getAll();
    const match = allOrders.find(o => o.order_id === order_id);
    if (match && match.id) {
      await orderRecordService.deleteRecord(match.id);
    }

    return { success: true, deletedOrderId: order_id };
  },

  /** Get aggregated dashboard metrics & Profit/Loss graph data */
  async getDashboardStats(range = '30') {
    const { products, summary: stockSummary } = await this.getStockOverview();
    const { returns, summary: returnsSummary } = await this.getReturnsOverview();
    const productsMap = await this.getStockProductsMap();
    const returnsMap = await this.getStockReturnsMap();
    const allOrders = await orderRecordService.getAll();
    const docs = await dbService.getDocuments().catch(() => []);

    // 1. Total Profit: Matches Net Profit from Stock page
    const totalProfit = stockSummary.total_net_profit || 0;

    // 1.5 Total Loss: Matches total loss from stock summary (Sales Loss + Return Loss)
    const totalLoss = stockSummary.total_loss || 0;

    // 2. Total Selling: SUM(Selling Price * Successfully Sold Quantity)
    const totalSelling = products.reduce((acc, p) => {
      const price = p.selling_price != null ? Number(p.selling_price) : 0;
      const soldQty = p.realized_sales_quantity || 0;
      return acc + (price * soldQty);
    }, 0);

    // 3. Total Return: Total returned parcels (Customer Returns + RTO Returns)
    const totalReturn = returnsSummary.total_returned_parcels || 0;

    // 4. Total Stock Items: SUM(Available Quantity)
    const totalStockItems = stockSummary.total_available_quantity || 0;

    // 5. Total Labels: Successfully processed / extracted labels from documents database
    const totalLabels = docs.filter(d => d.status !== 'FAILED').length;

    // 6. Total Orders: Count of unique Order IDs
    const uniqueOrders = new Set(allOrders.map(o => o.order_id).filter(Boolean));
    const totalOrders = uniqueOrders.size;

    // PROFIT & LOSS GRAPH DATA (Aggregated by Day)
    const now = new Date();
    const dateMap = new Map();

    const getLocalDateStr = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    let daysCount = 30;
    if (range === '7') daysCount = 7;
    else if (range === '30') daysCount = 30;
    else if (range === '90') daysCount = 90;
    else if (range === 'all') daysCount = 30;

    // Pre-populate continuous daily dates for the selected window
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dateStr = getLocalDateStr(d);
      const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dateMap.set(dateStr, { date: dateStr, displayDate, profit: 0, loss: 0 });
    }

    const productPriceMap = new Map();
    (products || []).forEach(p => {
      if (p.sku_id) productPriceMap.set(p.sku_id, p);
    });

    // Aggregate order sales profit & sales loss by date
    allOrders.forEach(o => {
      const rawDate = o.order_date || o.created_at || o.updated_at || new Date().toISOString();
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return;

      const dateStr = getLocalDateStr(d);

      if (!dateMap.has(dateStr)) {
        if (range === 'all') {
          const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          dateMap.set(dateStr, { date: dateStr, displayDate, profit: 0, loss: 0 });
        } else {
          return;
        }
      }

      const entry = dateMap.get(dateStr);
      const isReturned = Boolean(o.is_returned);

      if (!isReturned) {
        const sku = normalizeSku(o.sku_id, o.product_name);
        const prod = productPriceMap.get(sku);

        const pPrice = prod?.purchase_price != null 
          ? Number(prod.purchase_price) 
          : (o.purchase_price != null ? Number(o.purchase_price) : null);

        const sPrice = prod?.selling_price != null 
          ? Number(prod.selling_price) 
          : (o.selling_price != null ? Number(o.selling_price) : null);

        const qty = parseInt(o.quantity, 10) || 1;

        if (sPrice != null && pPrice != null) {
          if (sPrice > pPrice) {
            entry.profit += (sPrice - pPrice) * qty;
          } else if (pPrice > sPrice) {
            entry.loss += (pPrice - sPrice) * qty;
          }
        }
      }
    });

    // Aggregate customer return delivery charge loss by date
    (returns || []).forEach(r => {
      const rawDate = r.return_date || r.returned_at || r.created_at || r.updated_at || new Date().toISOString();
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return;

      const dateStr = getLocalDateStr(d);
      if (!dateMap.has(dateStr)) {
        if (range === 'all') {
          const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          dateMap.set(dateStr, { date: dateStr, displayDate, profit: 0, loss: 0 });
        } else {
          return;
        }
      }

      const entry = dateMap.get(dateStr);
      if (r.return_type === 'CUSTOMER_RETURN') {
        entry.loss += Number(r.delivery_boy_charge || 0);
      }
    });

    const graphData = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    return {
      stats: {
        total_profit: totalProfit,
        total_loss: totalLoss,
        total_selling: totalSelling,
        total_return: totalReturn,
        total_stock_items: totalStockItems,
        total_labels: totalLabels,
        total_orders: totalOrders
      },
      graph_data: graphData
    };
  }
};

