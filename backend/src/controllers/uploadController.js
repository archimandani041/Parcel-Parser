import fs from 'fs';
import path from 'path';
import { dbService } from '../services/storage/supabaseService.js';
import { parseDocumentWithGemini } from '../services/gemini/geminiParser.js';
import { validateExtractionResult } from '../services/validation/validationService.js';
import { orderRecordService } from '../services/storage/orderRecordService.js';

/**
 * Controller for handling single or multi-file label uploads & AI extraction workflow.
 */

export async function processUploads(req, res, next) {
  try {
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files were uploaded. Please select one or more parcel label images or PDFs.'
      });
    }

    const processedResults = [];

    for (const file of files) {
      const fileName = file.originalname;
      const fileType = file.mimetype;
      const fileSize = file.size;
      const isPdf = fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');

      console.log(`[Upload Controller] Processing: ${fileName} (${fileType}, ${fileSize} bytes, PDF: ${isPdf})`);

      // Save local disk copy for guaranteed static serving
      try {
        const uploadsDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        fs.writeFileSync(path.join(uploadsDir, fileName), file.buffer);
      } catch (fsErr) {
        console.warn(`[Upload Controller] Failed to write local upload copy: ${fsErr.message}`);
      }

      // 1. Upload file to Supabase Storage (or local storage fallback)
      let fileUrl = `/uploads/${encodeURIComponent(fileName)}`;
      try {
        fileUrl = await dbService.uploadFile(file.buffer, fileName, fileType);
      } catch (uploadErr) {
        console.warn(`[Upload Controller] File upload warning: ${uploadErr.message}`);
      }

      // 2. Create initial document record with 'ANALYZING' status
      let docRecord;
      try {
        docRecord = await dbService.createDocument({
          file_name: fileName,
          file_url: fileUrl,
          file_type: fileType,
          file_size: fileSize,
          status: 'ANALYZING'
        });
      } catch (createErr) {
        console.error(`[Upload Controller] Failed to create document record: ${createErr.message}`);
        docRecord = { id: `doc_${Date.now()}` };
      }

      try {
        // 3. Call Gemini API Multimodal Parser
        const geminiResult = await parseDocumentWithGemini(file.buffer, fileType, fileName);

        // 4. Check if document was rejected (invalid/unrecognizable document)
        if (geminiResult.structured_json?.is_valid_document === false) {
          const rejectionMsg = geminiResult.structured_json.rejection_reason ||
            'This file does not contain any recognizable order, invoice, or shipping label information.';

          console.warn(`[Upload Controller] Document rejected: ${fileName} — ${rejectionMsg}`);

          await dbService.updateDocumentStatus(
            docRecord.id,
            'FAILED',
            0,
            geminiResult.processing_time,
            rejectionMsg
          );

          processedResults.push({
            id: docRecord.id,
            file_name: fileName,
            file_url: fileUrl,
            status: 'FAILED',
            error_message: rejectionMsg,
            is_invalid_document: true,
            structured_json: geminiResult.structured_json
          });
          continue;
        }

        // 5. Perform Deterministic Validation & Scoring
        const validation = validateExtractionResult(geminiResult.structured_json);

        // 6. Store Extraction Results in Supabase DB
        await dbService.saveExtraction(
          docRecord.id,
          geminiResult.raw_response,
          validation.validatedJson
        );

        // 7. Update Document Status & Metrics
        await dbService.updateDocumentStatus(
          docRecord.id,
          validation.status,
          validation.overallConfidence,
          geminiResult.processing_time,
          validation.warnings.length > 0 ? validation.warnings.join('; ') : null
        );

        // 8. Create order records from extraction (only if extraction succeeded)
        if (validation.status !== 'FAILED') {
          try {
            await orderRecordService.createFromExtraction(validation.validatedJson, docRecord.id);
            console.log(`[Upload Controller] Order records created for ${fileName}`);
          } catch (orderErr) {
            console.warn(`[Upload Controller] Order record creation failed:`, orderErr.message);
          }
        } else {
          console.warn(`[Upload Controller] Skipping order creation for ${fileName} — extraction FAILED`);
        }

        processedResults.push({
          id: docRecord.id,
          file_name: fileName,
          file_url: fileUrl,
          status: validation.status,
          confidence: validation.overallConfidence,
          processing_time: geminiResult.processing_time,
          warnings: validation.warnings,
          structured_json: validation.validatedJson
        });

      } catch (extractionErr) {
        console.error(`[Upload Controller] Processing failed for ${fileName}:`, extractionErr.message);

        // Update document as FAILED
        await dbService.updateDocumentStatus(
          docRecord.id,
          'FAILED',
          0,
          0,
          extractionErr.message || 'Gemini extraction failed'
        );

        processedResults.push({
          id: docRecord.id,
          file_name: fileName,
          file_url: fileUrl,
          status: 'FAILED',
          error_message: extractionErr.message
        });
      }
    }

    res.status(200).json({
      success: true,
      count: processedResults.length,
      documents: processedResults
    });

  } catch (err) {
    next(err);
  }
}

/**
 * Controller for scanning a return label image for Order ID matching ONLY.
 * Does NOT persist document records or create order records in the database.
 */
export async function scanReturnLabel(req, res, next) {
  try {
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded for return label scan.'
      });
    }

    const file = files[0];
    const fileName = file.originalname;
    const fileType = file.mimetype;

    console.log(`[Upload Controller] Scanning return label in-memory: ${fileName} (${fileType})`);

    // Call Gemini API Multimodal Parser purely in memory
    const geminiResult = await parseDocumentWithGemini(file.buffer, fileType, fileName);

    // Check for invalid document
    if (geminiResult.structured_json?.is_valid_document === false) {
      return res.status(200).json({
        success: false,
        error: geminiResult.structured_json.rejection_reason ||
          'This image does not contain a recognizable shipping label or order document.',
        documents: [{
          file_name: fileName,
          status: 'FAILED',
          confidence: 0,
          is_invalid_document: true,
          structured_json: geminiResult.structured_json
        }]
      });
    }

    // Perform Deterministic Validation & Scoring
    const validation = validateExtractionResult(geminiResult.structured_json);

    // Return extracted JSON without saving to DB or creating order records
    res.status(200).json({
      success: true,
      count: 1,
      documents: [{
        file_name: fileName,
        status: validation.status,
        confidence: validation.overallConfidence,
        processing_time: geminiResult.processing_time,
        structured_json: validation.validatedJson
      }]
    });

  } catch (err) {
    console.error(`[Upload Controller] Return label scan failed:`, err);
    next(err);
  }
}
