import express from 'express';
import { exportDocuments } from '../controllers/exportController.js';

const router = express.Router();

// POST /api/export - Export documents to JSON, CSV, or Excel
router.post('/', exportDocuments);

export default router;
