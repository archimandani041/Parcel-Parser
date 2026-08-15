import express from 'express';
import { upload } from '../middleware/uploadMiddleware.js';
import { processUploads } from '../controllers/uploadController.js';

const router = express.Router();

// POST /api/upload - Accepts single or multi-file parcel label uploads
router.post('/', upload.array('files', 10), processUploads);

export default router;
