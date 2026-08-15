import express from 'express';
import { getDocuments, getDocumentById, saveFieldCorrection, deleteDocument } from '../controllers/documentController.js';

const router = express.Router();

// GET /api/documents - Fetch list of documents with stats
router.get('/', getDocuments);

// GET /api/documents/:id - Fetch document details, extracted JSON, items, & raw response
router.get('/:id', getDocumentById);

// PUT /api/documents/:id/corrections - Save manual user field corrections
router.put('/:id/corrections', saveFieldCorrection);

// DELETE /api/documents/:id - Delete document and all associated records
router.delete('/:id', deleteDocument);

export default router;
