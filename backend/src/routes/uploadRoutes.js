import express from 'express';
import { upload } from '../middleware/uploadMiddleware.js';
import { processUploads, scanReturnLabel } from '../controllers/uploadController.js';

const router = express.Router();

// POST /api/upload - Accepts single or multi-file parcel label uploads (Creates DB Document & Orders)
router.post('/', upload.array('files', 10), processUploads);

// POST /api/upload/scan-only - In-memory scan for return matching ONLY (No DB persistence)
router.post('/scan-only', upload.array('files', 1), scanReturnLabel);

export default router;
