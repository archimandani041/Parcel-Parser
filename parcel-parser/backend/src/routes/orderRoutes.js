import express from 'express';
import { getOrderRecords, returnOrderRecord, deleteOrderRecord, exportOrdersExcel, syncOrdersToSupabase } from '../controllers/orderController.js';

const router = express.Router();

// GET /api/orders/export-excel — Download XLSX
router.get('/export-excel', exportOrdersExcel);

// POST /api/orders/sync — Sync local orders to Supabase
router.post('/sync', syncOrdersToSupabase);

// GET /api/orders?search=... — List all order records
router.get('/', getOrderRecords);

// POST /api/orders/:id/return — Mark record as returned
router.post('/:id/return', returnOrderRecord);

// DELETE /api/orders/:id — Delete an order record permanently
router.delete('/:id', deleteOrderRecord);

export default router;
