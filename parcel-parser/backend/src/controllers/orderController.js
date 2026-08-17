import { orderRecordService } from '../services/storage/orderRecordService.js';
import { stockService } from '../services/storage/stockService.js';
import XLSX from 'xlsx';

/** GET /api/orders?search=... */
export async function getOrderRecords(req, res, next) {
  try {
    const { search } = req.query;
    const records = await orderRecordService.getAll(search || null);
    res.status(200).json({ success: true, records });
  } catch (err) { next(err); }
}

/** POST /api/orders/:id/return */
export async function returnOrderRecord(req, res, next) {
  try {
    const { id } = req.params;
    const record = await orderRecordService.markReturned(id);
    res.status(200).json({ success: true, record });
  } catch (err) {
    if (err.message === 'Record not found') {
      return res.status(404).json({ success: false, error: err.message });
    }
    next(err);
  }
}

/** DELETE /api/orders/:id */
export async function deleteOrderRecord(req, res, next) {
  try {
    const { id } = req.params;
    await orderRecordService.deleteRecord(id);
    res.status(200).json({ success: true, message: 'Record deleted successfully' });
  } catch (err) {
    if (err.message === 'Record not found') {
      return res.status(404).json({ success: false, error: err.message });
    }
    next(err);
  }
}

/** POST /api/orders/sync */
export async function syncOrdersToSupabase(req, res, next) {
  try {
    const result = await orderRecordService.syncLocalToSupabase();
    res.status(200).json({ success: true, synced_count: result.count, data: result.data });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

/** GET /api/orders/export-excel */
export async function exportOrdersExcel(req, res, next) {
  try {
    const records = await orderRecordService.getAllForExport();

    const rows = records.map(r => ({
      'Order ID': r.order_id || '',
      'Customer Name': r.customer_name || '',
      'SKU ID': r.sku_id || '',
      'Product Name': r.product_name || '',
      'Quantity': r.quantity || 1,
      'Return Status': r.is_returned ? 'Returned' : 'Active'
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Orders');

    // Set column widths
    ws['!cols'] = [
      { wch: 25 }, { wch: 22 }, { wch: 12 }, { wch: 22 }, { wch: 10 }, { wch: 14 }
    ];

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=orders_${Date.now()}.xlsx`);
    res.send(Buffer.from(buf));
  } catch (err) { next(err); }
}

/** GET /api/orders/export-master (Single click download for Orders + Stock + Returns in 1 Excel) */
export async function exportMasterExcel(req, res, next) {
  try {
    const ordersRecords = await orderRecordService.getAllForExport();
    const { products: stockProducts } = await stockService.getStockOverview();
    const { returns: returnRecords } = await stockService.getReturnsOverview();

    const wb = XLSX.utils.book_new();

    // 1. Orders Sheet
    const orderRows = (ordersRecords || []).map(r => ({
      'Order ID': r.order_id || '',
      'Customer Name': r.customer_name || '',
      'SKU ID': r.sku_id || '',
      'Product Name': r.product_name || '',
      'Quantity': r.quantity || 1,
      'Return Status': r.is_returned ? 'Returned' : 'Active'
    }));
    const wsOrders = XLSX.utils.json_to_sheet(orderRows);
    wsOrders['!cols'] = [
      { wch: 25 }, { wch: 22 }, { wch: 12 }, { wch: 22 }, { wch: 10 }, { wch: 14 }
    ];
    XLSX.utils.book_append_sheet(wb, wsOrders, 'Orders');

    // 2. Stock Sheet
    const stockRows = (stockProducts || []).map(p => ({
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
    const wsStock = XLSX.utils.json_to_sheet(stockRows);
    wsStock['!cols'] = [
      { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 },
      { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 16 },
      { wch: 22 }, { wch: 16 }, { wch: 14 }
    ];
    XLSX.utils.book_append_sheet(wb, wsStock, 'Stock');

    // 3. Returns Sheet
    const returnRows = (returnRecords || []).map(r => ({
      'Order ID': r.order_id || '',
      'Customer Name': r.customer_name || '',
      'SKU ID': r.sku_id || '',
      'Product Name': r.product_name || '',
      'Delivery Boy Charge (₹)': r.delivery_boy_charge != null ? Number(r.delivery_boy_charge) : 0,
      'Profit Lost from Return (₹)': r.profit_lost != null ? Number(r.profit_lost) : 0,
      'Return Status': r.status || 'Returned'
    }));
    const wsReturns = XLSX.utils.json_to_sheet(returnRows);
    wsReturns['!cols'] = [
      { wch: 25 }, { wch: 22 }, { wch: 12 }, { wch: 22 },
      { wch: 24 }, { wch: 26 }, { wch: 14 }
    ];
    XLSX.utils.book_append_sheet(wb, wsReturns, 'Returns');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=master_report_orders_stock_returns_${Date.now()}.xlsx`);
    res.send(Buffer.from(buf));
  } catch (err) { next(err); }
}
