import { getGeminiClient, getGeminiModelName, FALLBACK_MODELS } from './geminiClient.js';
import { PARCEL_PARSER_SYSTEM_INSTRUCTION, PARCEL_PARSER_USER_PROMPT } from './geminiPrompt.js';

/**
 * Sends uploaded document (image or PDF) to Gemini API using multimodal document understanding.
 * Uses FREE-FORM JSON mode (no rigid responseSchema) so Gemini can return ALL extracted data
 * from any label format without being constrained to a predefined field list.
 *
 * @param {Buffer} fileBuffer - Raw buffer of uploaded file
 * @param {string} mimeType - File MIME type (e.g. image/jpeg, image/png, application/pdf)
 * @param {string} fileName - Original file name for fallback hints
 * @returns {Promise<Object>} Extracted structured response & metadata
 */
export async function parseDocumentWithGemini(fileBuffer, mimeType, fileName = '') {
  const startTime = Date.now();
  const apiKey = process.env.GEMINI_API_KEY;

  // Fallback to mock parser if API key is not configured (allows offline testing/evaluation)
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your-gemini-api-key')) {
    console.warn('[Gemini Parser] GEMINI_API_KEY missing or placeholder. Running fallback extraction generator.');
    return generateFallbackExtraction(fileBuffer, fileName, startTime);
  }

  const ai = getGeminiClient();
  const primaryModel = getGeminiModelName();
  const base64Data = fileBuffer.toString('base64');

  // Candidate models to try in sequence
  const modelsToTry = Array.from(new Set([primaryModel, ...FALLBACK_MODELS]));

  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`[Gemini Parser] Calling Gemini API model '${modelName}' for ${fileName} (${mimeType})...`);

      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || 'image/jpeg',
                  data: base64Data
                }
              },
              {
                text: PARCEL_PARSER_USER_PROMPT
              }
            ]
          }
        ],
        config: {
          systemInstruction: PARCEL_PARSER_SYSTEM_INSTRUCTION,
          // NOTE: We intentionally do NOT use responseSchema here.
          // Strict schema enforcement prevents Gemini from returning fields not in the schema,
          // causing data loss. We use responseMimeType: 'application/json' with a detailed
          // text prompt instead, giving Gemini freedom to return all extracted data.
          responseMimeType: 'application/json',
          temperature: 0.1 // Low temperature for high extraction fidelity
        }
      });

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      let rawResponseText = response.text || '';
      let structuredJson = {};

      // Strip any markdown code fences if model added them despite instructions
      let cleanedText = rawResponseText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
      }

      try {
        structuredJson = JSON.parse(cleanedText);
      } catch (parseErr) {
        console.error('[Gemini Parser] Failed to parse JSON text from response:', parseErr);
        // Attempt clean substring extraction — find first { to last }
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            structuredJson = JSON.parse(jsonMatch[0]);
          } catch (innerErr) {
            throw new Error('Gemini response could not be parsed as valid JSON: ' + innerErr.message);
          }
        } else {
          throw new Error('Gemini response contained no JSON object');
        }
      }

      console.log(`[Gemini Parser] Extraction completed successfully in ${processingTime}ms using '${modelName}'`);

      return {
        raw_response: {
          model: modelName,
          text: rawResponseText,
          candidates: response.candidates || null,
          usageMetadata: response.usageMetadata || null
        },
        structured_json: sanitizeExtractedJson(structuredJson),
        processing_time: processingTime,
        model_used: modelName
      };

    } catch (err) {
      console.warn(`[Gemini Parser] Model '${modelName}' failed: ${err.message}`);
      lastError = err;
      // If error is 404/NOT_FOUND or model unavailable, loop to try next model in fallback list
    }
  }

  // If all live API attempts failed, log error and throw
  console.error('[Gemini Parser] All Gemini model attempts failed:', lastError);
  throw new Error(`Gemini API document extraction failed: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Sanitizes JSON output ensuring nulls instead of missing or empty string placeholders.
 * Also normalizes common empty-value indicators to null.
 */
function sanitizeExtractedJson(json) {
  if (!json || typeof json !== 'object') return {};

  const EMPTY_VALUES = new Set(['', 'null', 'n/a', 'na', 'none', 'not available', 'not found', 'unknown', '-', '--', '–']);

  const cleanObj = (obj) => {
    if (obj === null || obj === undefined) return null;
    if (typeof obj === 'string') {
      const trimmed = obj.trim();
      return EMPTY_VALUES.has(trimmed.toLowerCase()) ? null : trimmed;
    }
    if (typeof obj === 'number') return isNaN(obj) ? null : obj;
    if (typeof obj === 'boolean') return obj;
    if (Array.isArray(obj)) {
      // Filter out null/empty elements from arrays, but keep structured objects
      return obj.map(cleanObj).filter(item => item !== null && item !== undefined);
    }
    if (typeof obj === 'object') {
      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        cleaned[key] = cleanObj(value);
      }
      return cleaned;
    }
    return obj;
  };

  return cleanObj(json);
}

/**
 * Fallback generator for local offline demonstration if API key is not supplied.
 * Returns realistic mock data that exercises the full new schema.
 */
function generateFallbackExtraction(fileBuffer, fileName, startTime) {
  const processingTime = Date.now() - startTime + 420;

  const mockData = {
    document_type: "shipping_label",
    order: {
      order_id: "OD337952754675247100",
      order_number: "ORD-2026-89412",
      order_date: "2026-08-14",
      payment_status: "PREPAID",
      platform: "Flipkart",
      return_policy: "10 Day Return Policy"
    },
    shipping: {
      carrier: "E-Kart Logistics",
      awb: "SF3317828943F",
      tracking_number: "TRK-99081245",
      shipment_id: "SHP-88273",
      service_type: "Standard Delivery",
      route_code: "PLK-04",
      sort_code: "SRT-KL-09",
      zone: "Zone C",
      bag_number: "BAG-1/3",
      expected_delivery: "2026-08-17"
    },
    customer: {
      name: "Dr Jayakumar Sharma",
      address: "Shaktheya mantrika peedom, Naattukal po valara, Palakkad, Kozhinjapaara, Palakkad District - 678554, IN-KL",
      building: null,
      street: "Naattukal po valara",
      locality: "Kozhinjapaara",
      landmark: "Shaktheya mantrika peedom",
      city: "Palakkad",
      district: "Palakkad",
      state: "Kerala",
      pincode: "678554",
      country: "India",
      phone: "+91 98471 23456",
      alternate_phone: null,
      email: null
    },
    items: [
      {
        sku_id: "D01",
        product_name: "White Sadi",
        description: "Outzy Printed, Floral Print, Paisley, Digital Print",
        category: "Clothing",
        quantity: 1,
        unit: "Pcs",
        price: 899.00,
        total: 899.00,
        hsn_code: "5208",
        confidence: 0.97
      }
    ],
    seller: {
      name: "YPD Enterprise",
      address: "101, FIRST FLOOR, Rajdeep Complex, Rajdeep Society, SURAT - 395004",
      city: "Surat",
      state: "Gujarat",
      pincode: "395004",
      phone: "+91 98250 11223",
      email: "support@ypdenterprise.com",
      gstin: "24EVWPM4891Q1Z8",
      pan: null,
      fssai: null
    },
    financial: {
      invoice_number: "INV-2026-00412",
      invoice_date: "2026-08-14",
      subtotal: 899.00,
      discount: null,
      tax: null,
      shipping_charge: 0,
      cod_amount: 0,
      total_amount: 899.00,
      currency: "INR"
    },
    package: {
      weight: "0.45 kg",
      dimensions: "25 x 18 x 5 cm",
      package_number: "1/1",
      hbd: "PLK/HUB-04",
      cpd: "CPD-99",
      reference_number: "REF-55412",
      barcode_values: ["SF3317828943F", "OD337952754675247100"],
      special_instructions: null,
      fragile: false,
      return_hub: "Surat Central Sorting Hub"
    },
    additional_fields: [
      { field_name: "Handling Instruction", value: "Fragile - Handle with Care", confidence: 0.92 },
      { field_name: "Delivery Attempt", value: "First Attempt", confidence: 0.88 }
    ],
    overall_confidence: 0.96
  };

  return {
    raw_response: {
      model: "gemini-2.5-flash-offline-demo",
      text: JSON.stringify(mockData, null, 2),
      note: "Offline demo fallback active. Provide GEMINI_API_KEY in backend/.env for live extraction."
    },
    structured_json: mockData,
    processing_time: processingTime,
    model_used: "gemini-2.5-flash (offline demo)"
  };
}
