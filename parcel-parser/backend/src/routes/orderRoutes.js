import express from 'express';
import { getOrderRecords, returnOrderRecord, undoReturnOrderRecord, deleteOrderRecord, exportOrdersExcel, exportMasterExcel, syncOrdersToSupabase } from '../controllers/orderController.js';

const router = express.Router();

// GET /api/orders/export-excel — Download Orders XLSX
router.get('/export-excel', exportOrdersExcel);

// GET /api/orders/export-master — Download All 3 (Orders, Stock, Returns) in 1 Master Excel
router.get('/export-master', exportMasterExcel);

// POST /api/orders/sync — Sync local orders to Supabase
router.post('/sync', syncOrdersToSupabase);

// GET /api/orders?search=... — List all order records
router.get('/', getOrderRecords);

// POST /api/orders/:id/return — Mark record as returned
router.post('/:id/return', returnOrderRecord);

// POST /api/orders/:id/undo-return — Undo record returned status
router.post('/:id/undo-return', undoReturnOrderRecord);

// DELETE /api/orders/:id — Delete an order record permanently
router.delete('/:id', deleteOrderRecord);

export default router;
