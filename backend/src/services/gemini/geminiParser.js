import { getGeminiClient, getGeminiModelName, FALLBACK_MODELS } from './geminiClient.js';
import {
  PARCEL_PARSER_SYSTEM_INSTRUCTION,
  PARCEL_PARSER_USER_PROMPT,
  PDF_PARSER_USER_PROMPT
} from './geminiPrompt.js';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PDF TEXT EXTRACTOR
 * Pre-extracts embedded text from PDF using pdf-parse (lazy-loaded).
 * Uses dynamic import() so the server doesn't crash if pdf-parse has issues
 * in certain deployment environments (Render, Docker, CI).
 * Returns { text, pageCount } or { text: '', pageCount: null } on failure.
 * ─────────────────────────────────────────────────────────────────────────────
 */
let cachedPdfParse = null;
async function extractPdfText(pdfBuffer) {
  try {
    if (!cachedPdfParse) {
      const pdfParseModule = await import('pdf-parse');
      cachedPdfParse = pdfParseModule.default || pdfParseModule;
    }
    const pdfParse = cachedPdfParse;

    const pageTexts = [];
    const render_page = (pageData) => {
      const render_options = { normalizeWhitespace: true, disableCombineTextItems: false };
      return pageData.getTextContent(render_options).then((textContent) => {
        let text = '';
        for (let item of textContent.items) {
          text += item.str + ' ';
        }
        const trimmed = text.trim();
        pageTexts[pageData.pageIndex] = trimmed;
        return `\n=== PDF PAGE ${pageData.pageIndex + 1} ===\n${trimmed}\n`;
      });
    };

    const data = await pdfParse(pdfBuffer, { pagerender: render_page });
    const text = (data.text || '').trim();
    const pageCount = data.numpages || null;
    console.log(`[PDF Extractor] Extracted ${text.length} chars from ${pageCount} page(s)`);
    return { text, pageCount, pageTexts };
  } catch (err) {
    console.warn('[PDF Extractor] pdf-parse failed — will use vision-only:', err.message);
    return { text: '', pageCount: null, pageTexts: [] };
  }
}

/**
 * ROBUST PDF PAGE COUNT DETECTOR
 * Resolves page count using pdf-parse and binary structure inspection.
 */
function detectPdfPageCount(pdfBuffer, extractedPageCount) {
  let countFromBinary = null;
  if (pdfBuffer && Buffer.isBuffer(pdfBuffer)) {
    try {
      const pdfStr = pdfBuffer.toString('binary');

      // Scan for /Count N in catalog/pages objects
      const countMatches = [...pdfStr.matchAll(/\/Count\s+(\d+)/g)];
      if (countMatches.length > 0) {
        const counts = countMatches.map(m => parseInt(m[1], 10)).filter(n => !isNaN(n) && n > 0);
        if (counts.length > 0) countFromBinary = Math.max(...counts);
      }

      // Scan for /Type /Page occurrences
      if (!countFromBinary) {
        const pageMatches = pdfStr.match(/\/Type\s*\/Page\b/g);
        if (pageMatches && pageMatches.length > 0) {
          countFromBinary = pageMatches.length;
        }
      }
    } catch (e) {
      console.warn('[PDF Page Counter] Binary inspection error:', e.message);
    }
  }

  const candidateCounts = [extractedPageCount, countFromBinary].filter(n => typeof n === 'number' && n > 0);
  const finalCount = candidateCounts.length > 0 ? Math.max(...candidateCounts) : null;
  console.log(`[PDF Page Counter] pdf-parse: ${extractedPageCount}, binary: ${countFromBinary} => Final: ${finalCount}`);
  return finalCount;
}

/**
 * TIMEOUT WRAPPER
 * Prevents Gemini API calls from hanging indefinitely.
 */
function withTimeout(promise, ms = 25000, errorMsg = 'Operation timed out') {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(errorMsg)), ms))
  ]);
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * JSON REPAIR UTILITY
 * Attempts to salvage truncated JSON caused by maxOutputTokens cutoff.
 * ─────────────────────────────────────────────────────────────────────────────
 */
function repairTruncatedJson(text) {
  let cleaned = text.trim();

  cleaned = cleaned
    .replace(/,\s*$/, '')
    .replace(/:\s*"[^"]*$/, ': null')
    .replace(/:\s*[0-9.]+$/, ': null')
    .replace(/,?\s*"[^"]*$/, '');

  const opens = [];
  let inString = false;
  let escape = false;

  for (let i = 0; i < cleaned.length; i++) {
    const c = cleaned[i];
    if (escape) { escape = false; continue; }
    if (c === '\\' && inString) { escape = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (c === '{' || c === '[') opens.push(c);
    if (c === '}') { if (opens[opens.length - 1] === '{') opens.pop(); }
    if (c === ']') { if (opens[opens.length - 1] === '[') opens.pop(); }
  }

  for (let i = opens.length - 1; i >= 0; i--) {
    cleaned += opens[i] === '{' ? '}' : ']';
  }

  return cleaned;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SANITIZE & NORMALIZE EXTRACTED JSON
 * - Strips empty/placeholder values
 * - Splits combined SKU strings
 * - Ensures correct types for prices and quantities
 * - NEVER inserts default/dummy data
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function sanitizeExtractedJson(json, documentText = '') {
  if (!json || typeof json !== 'object') return {};

  const EMPTY_VALUES = new Set([
    '', 'null', 'n/a', 'na', 'none', 'not available', 'not found',
    'not visible', 'not applicable', '-', '--', '–', '___', '...',
    'nil', 'no data', 'no value', 'unknown'
  ]);

  const cleanString = (val) => {
    if (val === null || val === undefined) return null;
    if (typeof val !== 'string') return val;
    const trimmed = val.trim();
    return EMPTY_VALUES.has(trimmed.toLowerCase()) ? null : trimmed;
  };

  const cleanNumber = (val) => {
    if (val === null || val === undefined) return null;
    if (typeof val === 'number') return isNaN(val) ? null : val;
    if (typeof val === 'string') {
      const numStr = val.replace(/[₹Rs,\s]/gi, '').replace(/[^0-9.]/g, '');
      const num = parseFloat(numStr);
      return !isNaN(num) && num >= 0 ? num : null;
    }
    return null;
  };

  const verifyPriceInDocument = (price) => {
    if (price === null || price === undefined) return null;
    if (!documentText || typeof documentText !== 'string' || documentText.trim() === '') return price;
    const priceInt = Math.round(price);
    const priceStr = String(priceInt);
    if (priceInt >= 10 && !documentText.includes(priceStr)) {
      console.warn(`[Gemini Parser] Price ${price} not found in document text — setting to null.`);
      return null;
    }
    return price;
  };

  const cleanInt = (val) => {
    if (val === null || val === undefined) return null;
    const n = parseInt(String(val).replace(/[^0-9]/g, ''), 10);
    return !isNaN(n) && n > 0 ? n : null;
  };

  const sanitized = { ...json };

  // Sanitize labels array
  if (Array.isArray(sanitized.labels)) {
    sanitized.labels = sanitized.labels.map(label => {
      if (!label || typeof label !== 'object') return null;

      const cleanedLabel = {
        order_id: cleanString(label.order_id),
        customer_name: cleanString(label.customer_name),
        items: []
      };

      // Handle items array
      const items = Array.isArray(label.items) ? label.items : [];
      cleanedLabel.items = items.map(item => {
        if (!item || typeof item !== 'object') return null;

        let rawSku = cleanString(item.sku_id) || '';
        let rawProd = cleanString(item.product_name) || '';

        // Clean pipe from rawProd
        if (rawProd && rawProd.includes('|')) {
          rawProd = rawProd.split('|')[0].trim();
        }

        // Clean pipe from rawSku
        if (rawSku && rawSku.includes('|')) {
          const pipeParts = rawSku.split('|').map(p => p.trim()).filter(Boolean);
          rawSku = pipeParts[0] || '';
        }

        // 1. Detect glued row number + SKU code like "1D01" or "1 D01"
        if (/^\d+[\s.\-_]*([A-Za-z][A-Za-z0-9_\-]+)$/.test(rawSku)) {
          const match = rawSku.match(/^\d+[\s.\-_]*([A-Za-z][A-Za-z0-9_\-]+)$/);
          if (match && match[1]) rawSku = match[1];
        }

        // 2. Reject pure row indices (e.g. "1", "2", "3") - table row numbers are NOT SKUs!
        if (/^\d{1,2}$/.test(rawSku.trim())) {
          rawSku = '';
        }

        // 3. Inspect rawProd if it has glued row number or SKU prefix
        if (rawProd) {
          // If rawProd is like "1D01 White Sadi" or "1 D01 White Sadi"
          const gluedMatch = rawProd.match(/^\d+[\s.\-_]*([A-Za-z][A-Za-z0-9_\-]+)\s+(.+)$/);
          if (gluedMatch) {
            if (!rawSku) rawSku = gluedMatch[1];
            rawProd = gluedMatch[2];
          } else {
            // Strip leading table row numbers like "1 mobile holder" or "1. ajrakh wine"
            rawProd = rawProd.replace(/^\d+[\.\s]+/, '').trim();
            const words = rawProd.split(/\s+/);
            if (words.length >= 2 && /^[A-Za-z0-9_\-]+$/.test(words[0]) && /[A-Za-z]/.test(words[0]) && /\d/.test(words[0])) {
              if (!rawSku) rawSku = words[0];
              rawProd = words.slice(1).join(' ');
            }
          }
        }

        // 4. Split combined rawSku like "D01 White Sadi"
        if (rawSku && rawSku.includes(' ')) {
          const words = rawSku.split(/\s+/);
          if (words.length >= 2 && /^[A-Za-z0-9_\-]+$/.test(words[0])) {
            rawSku = words[0];
            if (!rawProd) rawProd = words.slice(1).join(' ');
          }
        }

        // 5. If no SKU code but product name exists, derive a unique product SKU slug so items never merge
        if (!rawSku && rawProd) {
          rawSku = rawProd
            .replace(/[^a-zA-Z0-9\s_-]/g, '')
            .trim()
            .split(/\s+/)
            .slice(0, 4)
            .join('-')
            .toUpperCase();
        }

        const purchase = verifyPriceInDocument(cleanNumber(item.purchase_price));
        const selling = verifyPriceInDocument(cleanNumber(item.selling_price));

        return {
          sku_id: rawSku || null,
          product_name: rawProd || null,
          purchase_price: purchase,
          selling_price: selling,
          quantity: cleanInt(item.quantity)
        };
      }).filter(Boolean);

      return cleanedLabel;
    }).filter(Boolean);
  }

  return sanitized;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * MAIN PARSER  — parseDocumentWithGemini
 *
 * Handles: PNG, JPG, JPEG, WEBP, BMP, TIFF, PDF
 * For PDFs: two-stage (text extract → augmented prompt)
 * For images: vision-only path with focused prompt
 *
 * NEVER returns dummy/fabricated data. If extraction fails, returns empty labels
 * with an error flag.
 * ─────────────────────────────────────────────────────────────────────────────
 * @param {Buffer} fileBuffer  - Raw file bytes
 * @param {string} mimeType    - MIME type e.g. image/jpeg, application/pdf
 * @param {string} fileName    - Original filename for logging
 * @returns {Promise<Object>}
 */
/**
 * Process a raw Gemini API response into a structured result.
 * Returns null if parsing completely fails (caller should throw/retry).
 */
function processGeminiResponse(response, modelName, startTime, isPdf, mimeType, pdfPageCount, pdfText) {
  const processingTime = Date.now() - startTime;
  const candidate = response.candidates?.[0];
  const finishReason = candidate?.finishReason;

  let rawResponseText = response.text || '';

  // Strip markdown code fences
  let cleanedText = rawResponseText.trim();
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
  }

  // Parse JSON
  let structuredJson = {};
  let parseSuccess = false;

  try { structuredJson = JSON.parse(cleanedText); parseSuccess = true; } catch (_) { /* fall through */ }

  if (!parseSuccess) {
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try { structuredJson = JSON.parse(jsonMatch[0]); parseSuccess = true; } catch (_) { /* fall through */ }
    }
  }

  if (!parseSuccess) {
    const repaired = repairTruncatedJson(cleanedText);
    try { structuredJson = JSON.parse(repaired); parseSuccess = true; } catch (_) { return null; }
  }

  const fileType = isPdf ? 'application/pdf' : (mimeType || 'image/jpeg');

  // Handle invalid document
  if (structuredJson.is_valid_document === false) {
    return {
      raw_response: { model: modelName, text: rawResponseText, finish_reason: finishReason || null },
      structured_json: {
        is_valid_document: false,
        rejection_reason: structuredJson.rejection_reason || 'This image/PDF does not contain any recognizable order, invoice, or shipping label information.',
        labels: []
      },
      processing_time: processingTime, model_used: modelName,
      file_type: fileType, is_pdf: isPdf, pdf_pages: pdfPageCount
    };
  }

  // Ensure labels array exists
  if (!Array.isArray(structuredJson.labels) || structuredJson.labels.length === 0) {
    if (structuredJson.order_id || structuredJson.customer_name || structuredJson.items) {
      structuredJson.labels = [{
        order_id: structuredJson.order_id || structuredJson.order?.order_id || null,
        customer_name: structuredJson.customer_name || structuredJson.customer?.name || null,
        items: structuredJson.items || []
      }];
    }
  }

  // Multi-page PDF check
  if (isPdf && pdfPageCount && pdfPageCount > 1) {
    const labelsLen = structuredJson.labels?.length || 0;
    if (labelsLen < pdfPageCount) {
      console.warn(`[Gemini Parser] Expected ${pdfPageCount} labels but got ${labelsLen}`);
    }
    structuredJson.label_count = structuredJson.labels?.length || 0;
  }

  // Sanitize output
  const sanitized = sanitizeExtractedJson(structuredJson, pdfText);
  sanitized.is_valid_document = true;

  console.log(`[Gemini Parser] ✓ Done in ${processingTime}ms using '${modelName}' | Labels: ${sanitized.labels?.length || 0}`);

  return {
    raw_response: { model: modelName, text: rawResponseText, finish_reason: finishReason || null,
      candidates: response.candidates || null, usageMetadata: response.usageMetadata || null },
    structured_json: sanitized,
    processing_time: processingTime, model_used: modelName,
    file_type: fileType, is_pdf: isPdf, pdf_pages: pdfPageCount
  };
}

export async function parseDocumentWithGemini(fileBuffer, mimeType, fileName = '') {
  const startTime = Date.now();
  const apiKey = process.env.GEMINI_API_KEY;

  // Detect file type
  const isPdf = mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
  let pdfText = '';
  let pdfPageCount = null;

  if (isPdf) {
    const extracted = await extractPdfText(fileBuffer);
    pdfText = extracted.text;
    const extractedPageCount = extracted.pageCount;
    pdfPageCount = detectPdfPageCount(fileBuffer, extractedPageCount);
  }

  // If no API key → return error (no more fake fallback data)
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your-gemini-api-key')) {
    console.error('[Gemini Parser] No API key configured — cannot extract data.');
    return {
      raw_response: { model: 'none', text: '', note: 'No Gemini API key configured.' },
      structured_json: {
        is_valid_document: false,
        rejection_reason: 'Gemini API key is not configured. Please set GEMINI_API_KEY in your environment.',
        labels: []
      },
      processing_time: Date.now() - startTime,
      model_used: 'none',
      file_type: isPdf ? 'application/pdf' : (mimeType || 'image/jpeg'),
      is_pdf: isPdf,
      pdf_pages: pdfPageCount
    };
  }

  const ai = getGeminiClient();
  const primaryModel = getGeminiModelName();

  // Build the appropriate user prompt
  const userPrompt = isPdf
    ? PDF_PARSER_USER_PROMPT(pdfText, pdfPageCount)
    : PARCEL_PARSER_USER_PROMPT;

  // Pre-compute base64 data ONCE (avoid re-encoding on each model attempt)
  const base64Data = fileBuffer.toString('base64');
  const parts = [
    { inlineData: { mimeType: isPdf ? 'application/pdf' : (mimeType || 'image/jpeg'), data: base64Data } },
    { text: userPrompt }
  ];

  // ── 2-TIER ULTRA-FAST MODEL EXECUTION ──
  // Tier 1: Race the top ultra-fast lite models (gemini-3.5-flash-lite, gemini-flash-lite-latest)
  // These return in 1.5s - 3.5s without 503 high-demand errors.
  // Tier 2: Fallback to other available models if Tier 1 has issues.
  const tier1Models = Array.from(new Set([primaryModel, 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest']));
  const tier2Models = ['gemini-3.1-flash-lite', 'gemini-3.6-flash', 'gemini-3.5-flash'].filter(m => !tier1Models.includes(m));

  const executeBatch = async (modelList, timeoutMs = 25000) => {
    const promises = modelList.map(async (modelName) => {
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model: modelName,
            contents: [{ role: 'user', parts }],
            config: {
              systemInstruction: PARCEL_PARSER_SYSTEM_INSTRUCTION,
              responseMimeType: 'application/json',
              temperature: 0.0,
              maxOutputTokens: 4096
            }
          }),
          timeoutMs,
          `Gemini API timed out after ${Math.round(timeoutMs / 1000)}s for '${modelName}'`
        );

        const result = processGeminiResponse(response, modelName, startTime, isPdf, mimeType, pdfPageCount, pdfText);
        if (result) return result;
        throw new Error(`Model '${modelName}' returned unparseable response`);
      } catch (err) {
        console.warn(`[Gemini Parser] Model '${modelName}' failed: ${err.message}`);

        // 401 Auth error — propagate immediately
        if (err.status === 401 || err.message?.includes('401') || err.message?.includes('UNAUTHENTICATED') ||
            err.message?.includes('API_KEY_INVALID') || err.message?.includes('invalid authentication credentials')) {
          const authErr = new Error('AUTH_401');
          authErr.modelName = modelName;
          throw authErr;
        }

        throw err;
      }
    });

    return await Promise.any(promises);
  };

  let finalResult = null;
  let allErrors = [];

  try {
    console.log(`[Gemini Parser] Tier 1: Racing fast lite models (${tier1Models.join(', ')})`);
    finalResult = await executeBatch(tier1Models, 25000);
  } catch (tier1Err) {
    const errors = tier1Err.errors || [tier1Err];
    allErrors.push(...errors);

    const authError = errors.find(e => e.message === 'AUTH_401');
    if (authError) {
      return {
        raw_response: { model: authError.modelName || 'unknown', text: '', error: 'Gemini API authentication failed (401)' },
        structured_json: {
          is_valid_document: false,
          rejection_reason: 'Gemini API authentication failed (401). Please check GEMINI_API_KEY in backend/.env. Obtain a free key from Google AI Studio (https://aistudio.google.com/app/apikey).',
          labels: []
        },
        processing_time: Date.now() - startTime,
        model_used: authError.modelName || 'unknown',
        file_type: isPdf ? 'application/pdf' : (mimeType || 'image/jpeg'),
        is_pdf: isPdf,
        pdf_pages: pdfPageCount
      };
    }

    if (tier2Models.length > 0) {
      try {
        console.log(`[Gemini Parser] Tier 1 failed. Tier 2: Trying backup models (${tier2Models.join(', ')})`);
        finalResult = await executeBatch(tier2Models, 25000);
      } catch (tier2Err) {
        allErrors.push(...(tier2Err.errors || [tier2Err]));
      }
    }
  }

  if (finalResult) {
    return finalResult;
  }

  // All models failed — extract cleanest error message
  let cleanErrMsg = 'All AI models failed to process this document.';
  const lastErr = allErrors[allErrors.length - 1];
  if (lastErr?.message) {
    try {
      const parsed = JSON.parse(lastErr.message);
      if (parsed.error?.message) cleanErrMsg = parsed.error.message;
    } catch (_) {
      cleanErrMsg = lastErr.message;
    }
  }

  console.error(`[Gemini Parser] All models failed.`, cleanErrMsg);
  return {
    raw_response: { model: 'none', text: '', error: cleanErrMsg },
    structured_json: {
      is_valid_document: false,
      rejection_reason: `Extraction failed: ${cleanErrMsg}`,
      labels: []
    },
    processing_time: Date.now() - startTime,
    model_used: 'none',
    file_type: isPdf ? 'application/pdf' : (mimeType || 'image/jpeg'),
    is_pdf: isPdf,
    pdf_pages: pdfPageCount
  };
}
