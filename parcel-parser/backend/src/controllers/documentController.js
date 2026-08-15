import { dbService } from '../services/storage/supabaseService.js';

/**
 * Controller for managing document records, dashboard statistics, detail views, and user field corrections.
 */

export async function getDocuments(req, res, next) {
  try {
    const docs = await dbService.getDocuments();

    // Calculate Dashboard Statistics (Requirement 19)
    const total = docs.length;
    const completed = docs.filter(d => d.status === 'COMPLETED').length;
    const needsReview = docs.filter(d => d.status === 'NEEDS_REVIEW').length;
    const failed = docs.filter(d => d.status === 'FAILED').length;

    const validConfidences = docs
      .map(d => parseFloat(d.overall_confidence))
      .filter(c => !isNaN(c) && c > 0);

    const avgConfidence = validConfidences.length > 0
      ? Number((validConfidences.reduce((a, b) => a + b, 0) / validConfidences.length).toFixed(2))
      : 0;

    res.status(200).json({
      success: true,
      stats: {
        total_documents: total,
        completed,
        needs_review: needsReview,
        failed,
        avg_confidence: avgConfidence
      },
      documents: docs
    });
  } catch (err) {
    next(err);
  }
}

export async function getDocumentById(req, res, next) {
  try {
    const { id } = req.params;
    const docDetail = await dbService.getDocumentDetail(id);

    if (!docDetail) {
      return res.status(404).json({
        success: false,
        error: `Document with ID ${id} not found.`
      });
    }

    res.status(200).json({
      success: true,
      document: docDetail
    });
  } catch (err) {
    next(err);
  }
}

export async function saveFieldCorrection(req, res, next) {
  try {
    const { id } = req.params;
    const { field_name, original_value, corrected_value } = req.body;

    if (!field_name) {
      return res.status(400).json({
        success: false,
        error: 'field_name is required for correction.'
      });
    }

    const docDetail = await dbService.getDocumentDetail(id);
    if (!docDetail) {
      return res.status(404).json({
        success: false,
        error: `Document with ID ${id} not found.`
      });
    }

    // Record manual correction log
    const correctionRecord = await dbService.saveCorrection(id, field_name, original_value, corrected_value);

    // Fetch updated document details
    const updatedDocDetail = await dbService.getDocumentDetail(id);

    res.status(200).json({
      success: true,
      message: 'Field correction saved successfully.',
      correction: correctionRecord,
      document: updatedDocDetail
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteDocument(req, res, next) {
  try {
    const { id } = req.params;
    await dbService.deleteDocument(id);

    res.status(200).json({
      success: true,
      message: `Document ${id} deleted successfully.`
    });
  } catch (err) {
    next(err);
  }
}
