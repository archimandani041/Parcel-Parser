import { orderRecordService } from '../services/storage/orderRecordService.js';
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
      'Product Purchase Price': r.purchase_price != null ? Number(r.purchase_price) : '',
      'Product Selling Price': r.selling_price != null ? Number(r.selling_price) : '',
      'Quantity': r.quantity || 1,
      'Return': r.is_returned ? 'Returned' : 'Not Returned'
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Orders');

    // Set column widths
    ws['!cols'] = [
      { wch: 25 }, { wch: 22 }, { wch: 10 }, { wch: 20 },
      { wch: 22 }, { wch: 20 }, { wch: 10 }, { wch: 14 }
    ];

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=orders_${Date.now()}.xlsx`);
    res.send(Buffer.from(buf));
  } catch (err) { next(err); }
}
