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

/** GET /api/stock/dashboard-stats */
export async function getDashboardStats(req, res, next) {
  try {
    const range = req.query.range || '30';
    const data = await stockService.getDashboardStats(range);
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
      'Successfully Sold Qty': p.successfully_sold_quantity != null ? p.successfully_sold_quantity : (p.realized_sales_quantity || 0),
      'Customer Returned Qty': p.customer_returned_quantity || 0,
      'RTO Returned Qty': p.rto_returned_quantity || 0,
      'Total Returned Qty': p.returned_quantity || 0,
      'Current Physical Stock': p.available_quantity || 0,
      'Purchase Price (₹)': p.purchase_price != null ? Number(p.purchase_price) : '',
      'Selling Price (₹)': p.selling_price != null ? Number(p.selling_price) : '',
      'Inventory Cost (₹)': p.inventory_cost != null ? Number(p.inventory_cost) : '',
      'Inventory Value (₹)': p.inventory_value != null ? Number(p.inventory_value) : '',
      'Realized Sales Profit (₹)': p.realized_sales_profit != null ? Number(p.realized_sales_profit) : 0,
      'Sales Loss (₹)': p.sales_loss != null ? Number(p.sales_loss) : 0,
      'Return Loss (₹)': p.return_loss != null ? Number(p.return_loss) : 0,
      'Net Profit (₹)': p.net_profit != null ? Number(p.net_profit) : ''
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stock');

    ws['!cols'] = [
      { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 18 }, { wch: 18 },
      { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 22 },
      { wch: 16 }, { wch: 16 }
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
    const { returns, customerReturns, rtoReturns } = await stockService.getReturnsOverview();

    const formatReturnRow = (r) => ({
      'Order ID': r.order_id || '',
      'Customer Name': r.customer_name || '',
      'SKU ID': r.sku_id || '',
      'Product Name': r.product_name || '',
      'Quantity': r.quantity || 1,
      'Return Type': r.return_type === 'RTO_RETURN' ? 'RTO Return' : 'Customer Return',
      'Purchase Price (₹)': r.purchase_price != null ? Number(r.purchase_price) : '',
      'Selling Price (₹)': r.selling_price != null ? Number(r.selling_price) : '',
      'Delivery Charge (₹)': r.return_type === 'RTO_RETURN' ? 0 : (r.delivery_boy_charge != null ? Number(r.delivery_boy_charge) : 0),
      'Return Loss (₹)': r.return_type === 'RTO_RETURN' ? 0 : (r.return_loss != null ? Number(r.return_loss) : 0)
    });

    const cols = [
      { wch: 25 }, { wch: 22 }, { wch: 14 }, { wch: 24 },
      { wch: 10 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 16 }
    ];

    const wb = XLSX.utils.book_new();

    // Sheet 1: All Returns
    const allRows = (returns || []).map(formatReturnRow);
    const wsAll = XLSX.utils.json_to_sheet(allRows);
    wsAll['!cols'] = cols;
    XLSX.utils.book_append_sheet(wb, wsAll, 'All Returns');

    // Sheet 2: Customer Returns
    const custRows = (customerReturns || (returns || []).filter(r => r.return_type === 'CUSTOMER_RETURN')).map(formatReturnRow);
    const wsCust = XLSX.utils.json_to_sheet(custRows);
    wsCust['!cols'] = cols;
    XLSX.utils.book_append_sheet(wb, wsCust, 'Customer Returns');

    // Sheet 3: RTO Returns
    const rtoRows = (rtoReturns || (returns || []).filter(r => r.return_type === 'RTO_RETURN')).map(formatReturnRow);
    const wsRto = XLSX.utils.json_to_sheet(rtoRows);
    wsRto['!cols'] = cols;
    XLSX.utils.book_append_sheet(wb, wsRto, 'RTO Returns');

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
    const { delivery_boy_charge, return_type } = req.body;

    if (!order_id) {
      return res.status(400).json({ success: false, error: 'Order ID is required' });
    }

    const returnRec = await stockService.updateReturnCharge(order_id, delivery_boy_charge, return_type);
    res.status(200).json({ success: true, returnRecord: returnRec });
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
