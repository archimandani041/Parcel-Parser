import { stockService } from '../services/storage/stockService.js';
import XLSX from 'xlsx';

/** GET /api/stock */
export async function getStockOverview(req, res, next) {
  try {
    const data = await stockService.getStockOverview();
    res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

/** GET /api/stock/export-excel */
export async function exportStockExcel(req, res, next) {
  try {
    const { products } = await stockService.getStockOverview();

    const rows = (products || []).map(p => ({
      'SKU ID': p.sku_id || '',
      'Product Name': p.product_name || '',
      'Total Quantity': p.total_quantity || 0,
      'Active Quantity': p.active_quantity || 0,
      'Returned Quantity': p.returned_quantity || 0,
      'Purchase Price (₹)': p.purchase_price != null ? Number(p.purchase_price) : '',
      'Selling Price (₹)': p.selling_price != null ? Number(p.selling_price) : '',
      'Total Cost (₹)': p.total_cost != null ? Number(p.total_cost) : '',
      'Total Selling Value (₹)': p.total_selling_value != null ? Number(p.total_selling_value) : '',
      'Est. Profit (₹)': p.profit != null ? Number(p.profit) : '',
      'Stock Status': p.status || 'In Stock'
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stock');

    ws['!cols'] = [
      { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 },
      { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 16 },
      { wch: 22 }, { wch: 16 }, { wch: 14 }
    ];

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=stock_report_${Date.now()}.xlsx`);
    res.send(Buffer.from(buf));
  } catch (err) { next(err); }
}

/** GET /api/stock/returns/export-excel */
export async function exportReturnsExcel(req, res, next) {
  try {
    const { returns } = await stockService.getReturnsOverview();

    const rows = (returns || []).map(r => ({
      'Order ID': r.order_id || '',
      'Customer Name': r.customer_name || '',
      'SKU ID': r.sku_id || '',
      'Product Name': r.product_name || '',
      'Delivery Boy Charge (₹)': r.delivery_boy_charge != null ? Number(r.delivery_boy_charge) : 0,
      'Profit Lost from Return (₹)': r.profit_lost != null ? Number(r.profit_lost) : 0,
      'Return Status': r.status || 'Returned'
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Returns');

    ws['!cols'] = [
      { wch: 25 }, { wch: 22 }, { wch: 12 }, { wch: 22 },
      { wch: 24 }, { wch: 26 }, { wch: 14 }
    ];

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=returns_report_${Date.now()}.xlsx`);
    res.send(Buffer.from(buf));
  } catch (err) { next(err); }
}

/** PUT /api/stock/products/:sku_id */
export async function updateProductPrice(req, res, next) {
  try {
    const sku_id = req.params.sku_id || req.body.sku_id;
    const { purchase_price, selling_price, product_name } = req.body;

    if (!sku_id) {
      return res.status(400).json({ success: false, error: 'SKU ID is required' });
    }

    const product = await stockService.updateProductPrice(sku_id, purchase_price, selling_price, product_name);
    res.status(200).json({ success: true, product });
  } catch (err) {
    next(err);
  }
}

/** GET /api/stock/returns */
export async function getReturnsOverview(req, res, next) {
  try {
    const data = await stockService.getReturnsOverview();
    res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/stock/returns/:order_id */
export async function updateReturnCharge(req, res, next) {
  try {
    const order_id = req.params.order_id || req.body.order_id;
    const { delivery_boy_charge } = req.body;

    if (!order_id) {
      return res.status(400).json({ success: false, error: 'Order ID is required' });
    }

    const returnRecord = await stockService.updateReturnCharge(order_id, delivery_boy_charge);
    res.status(200).json({ success: true, returnRecord });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/stock/products/:sku_id */
export async function deleteStockProduct(req, res, next) {
  try {
    const { sku_id } = req.params;
    if (!sku_id) {
      return res.status(400).json({ success: false, error: 'SKU ID is required' });
    }

    const result = await stockService.deleteProduct(sku_id);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/stock/returns/:order_id */
export async function deleteStockReturn(req, res, next) {
  try {
    const { order_id } = req.params;
    if (!order_id) {
      return res.status(400).json({ success: false, error: 'Order ID is required' });
    }

    const result = await stockService.deleteReturn(order_id);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}
