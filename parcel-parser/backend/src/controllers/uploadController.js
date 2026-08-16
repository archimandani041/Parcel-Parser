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

      console.log(`[Upload Controller] Processing uploaded file: ${fileName} (${fileType}, ${fileSize} bytes)`);

      // 1. Upload file to Supabase Storage (or local storage fallback)
      const fileUrl = await dbService.uploadFile(file.buffer, fileName, fileType);

      // 2. Create initial document record with 'ANALYZING' status
      const docRecord = await dbService.createDocument({
        file_name: fileName,
        file_url: fileUrl,
        file_type: fileType,
        file_size: fileSize,
        status: 'ANALYZING'
      });

      try {
        // 3. Call Gemini API Multimodal Parser
        const geminiResult = await parseDocumentWithGemini(file.buffer, fileType, fileName);

        // 4. Perform Deterministic Validation & Scoring
        const validation = validateExtractionResult(geminiResult.structured_json);

        // 5. Store Extraction Results in Supabase DB
        await dbService.saveExtraction(
          docRecord.id,
          geminiResult.raw_response,
          validation.validatedJson
        );

        // 6. Update Document Status & Metrics
        const updatedDoc = await dbService.updateDocumentStatus(
          docRecord.id,
          validation.status,
          validation.overallConfidence,
          geminiResult.processing_time,
          validation.warnings.length > 0 ? validation.warnings.join('; ') : null
        );

        // 7. Create order records from extraction
        try {
          await orderRecordService.createFromExtraction(validation.validatedJson, docRecord.id);
          console.log(`[Upload Controller] Order records created for ${fileName}`);
        } catch (orderErr) {
          console.warn(`[Upload Controller] Order record creation failed:`, orderErr.message);
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
