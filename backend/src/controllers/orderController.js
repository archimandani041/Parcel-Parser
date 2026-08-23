import { orderRecordService } from '../services/storage/orderRecordService.js';
import { stockService } from '../services/storage/stockService.js';
import { generateOrdersWorkbook, generateMasterWorkbook } from '../utils/excelGenerator.js';

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
    const { return_type } = req.body || {};
    const record = await orderRecordService.markReturned(id, return_type);
    res.status(200).json({ success: true, record });
  } catch (err) {
    if (err.message === 'Record not found') {
      return res.status(404).json({ success: false, error: err.message });
    }
    next(err);
  }
}

/** POST /api/orders/:id/undo-return */
export async function undoReturnOrderRecord(req, res, next) {
  try {
    const { id } = req.params;
    const record = await orderRecordService.unmarkReturned(id);
    res.status(200).json({ success: true, record, message: 'Return undone successfully' });
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
    const workbook = await generateOrdersWorkbook(records || []);

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=orders_${Date.now()}.xlsx`);
    res.send(Buffer.from(buffer));
  } catch (err) { next(err); }
}

/** GET /api/orders/export-master (Single click download for Orders + Stock + Returns in 1 Excel) */
export async function exportMasterExcel(req, res, next) {
  try {
    const ordersRecords = await orderRecordService.getAllForExport();
    const { products: stockProducts, summary: stockSummary } = await stockService.getStockOverview();
    const { returns: returnRecords, summary: returnsSummary } = await stockService.getReturnsOverview();

    const workbook = await generateMasterWorkbook(
      ordersRecords || [],
      stockProducts || [],
      stockSummary || {},
      returnRecords || [],
      returnsSummary || {}
    );

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=master_report_orders_stock_returns_${Date.now()}.xlsx`);
    res.send(Buffer.from(buffer));
  } catch (err) { next(err); }
}
