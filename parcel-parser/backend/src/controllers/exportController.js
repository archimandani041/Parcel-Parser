import { dbService } from '../services/storage/supabaseService.js';
import { formatDocumentsForExport, generateCsvBuffer, generateExcelBuffer } from '../utils/exportUtils.js';

/**
 * Controller for exporting single or bulk document extractions to JSON, CSV, or Excel formats.
 */

export async function exportDocuments(req, res, next) {
  try {
    const { format = 'json', document_ids = [] } = req.body;

    // Fetch all or specific requested documents
    const allDocs = await dbService.getDocuments();
    let targetDocs = allDocs;

    if (Array.isArray(document_ids) && document_ids.length > 0) {
      targetDocs = allDocs.filter(d => document_ids.includes(d.id));
    }

    if (targetDocs.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No documents found to export.'
      });
    }

    // Fetch detailed extraction object for each document
    const docsWithDetails = await Promise.all(
      targetDocs.map(d => dbService.getDocumentDetail(d.id))
    );

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // 1. Export as JSON
    if (format.toLowerCase() === 'json') {
      const exportJson = docsWithDetails.map(d => ({
        id: d.id,
        file_name: d.file_name,
        file_url: d.file_url,
        status: d.status,
        overall_confidence: d.overall_confidence,
        processing_time: d.processing_time,
        created_at: d.created_at,
        structured_json: d.structured_json
      }));

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="parcel_labels_export_${timestamp}.json"`);
      return res.status(200).send(JSON.stringify(exportJson, null, 2));
    }

    const flattened = formatDocumentsForExport(docsWithDetails);

    // 2. Export as CSV
    if (format.toLowerCase() === 'csv') {
      const csvBuffer = generateCsvBuffer(flattened);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="parcel_labels_export_${timestamp}.csv"`);
      return res.status(200).send(csvBuffer);
    }

    // 3. Export as Excel XLSX
    if (format.toLowerCase() === 'excel' || format.toLowerCase() === 'xlsx') {
      const excelBuffer = generateExcelBuffer(flattened);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="parcel_labels_export_${timestamp}.xlsx"`);
      return res.status(200).send(excelBuffer);
    }

    res.status(400).json({
      success: false,
      error: `Unsupported export format: ${format}. Supported formats are: json, csv, excel`
    });

  } catch (err) {
    next(err);
  }
}
