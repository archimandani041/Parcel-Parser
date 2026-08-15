import { getGeminiClient, getGeminiModelName, FALLBACK_MODELS } from './geminiClient.js';
import { extractionResponseSchema } from './geminiSchema.js';
import { PARCEL_PARSER_SYSTEM_INSTRUCTION, PARCEL_PARSER_USER_PROMPT } from './geminiPrompt.js';

/**
 * Sends uploaded document (image or PDF) to Gemini API using multimodal document understanding.
 * Returns structured JSON conforming to the extraction schema.
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
          responseMimeType: 'application/json',
          responseSchema: extractionResponseSchema,
          temperature: 0.1 // Low temperature for high extraction fidelity
        }
      });

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      let rawResponseText = response.text || '';
      let structuredJson = {};

      try {
        structuredJson = JSON.parse(rawResponseText);
      } catch (parseErr) {
        console.error('[Gemini Parser] Failed to parse JSON text from response:', parseErr);
        // Attempt clean substring extraction if model added code blocks
        const jsonMatch = rawResponseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          structuredJson = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Gemini response could not be parsed as valid JSON');
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

  // If all live API attempts failed, log error and throw or provide diagnostic fallback
  console.error('[Gemini Parser] All Gemini model attempts failed:', lastError);
  throw new Error(`Gemini API document extraction failed: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Sanitizes JSON output ensuring nulls instead of missing or empty string placeholders
 */
function sanitizeExtractedJson(json) {
  if (!json || typeof json !== 'object') return {};

  const cleanObj = (obj) => {
    if (obj === null || obj === undefined) return null;
    if (typeof obj === 'string') {
      const trimmed = obj.trim();
      return (trimmed === '' || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'n/a') ? null : trimmed;
    }
    if (Array.isArray(obj)) {
      return obj.map(cleanObj);
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
 * Fallback generator for local offline demonstration if API key is not supplied
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
      platform: "Flipkart"
    },
    shipping: {
      carrier: "E-Kart Logistics",
      awb: "SF3317828943F",
      tracking_number: "TRK-99081245",
      shipment_id: "SHP-88273"
    },
    customer: {
      name: "Dr Jayakumar Sharma",
      address: "Shaktheya mantrika peedom, Naattukal po valara, Palakkad, Kozhinjapaara, Palakkad District - 678554, IN-KL",
      city: "Palakkad",
      state: "Kerala",
      district: "Palakkad",
      pincode: "678554",
      country: "India",
      phone: "+91 98471 23456",
      email: "jayakumar.sharma@example.com"
    },
    items: [
      {
        sku_id: "D01",
        product_name: "White Sadi",
        description: "Outzy Printed, Floral Print, Paisley, Digital Print",
        quantity: 1,
        unit: "Pcs",
        price: 899.00,
        confidence: 0.98
      }
    ],
    seller: {
      name: "YPD Enterprise",
      address: "101, FIRST FLOOR, Rajdeep Complex, Rajdeep Society, SURAT - 395004",
      phone: "+91 98250 11223",
      email: "support@ypdenterprise.com",
      gstin: "24EVWPM4891Q1Z8"
    },
    other: {
      hbd: "PLK/HUB-04",
      cpd: "CPD-99",
      invoice_number: "INV-2026-00412",
      reference_number: "REF-55412",
      package_number: "PKG-1/1",
      weight: "0.45 kg",
      dimensions: "25 x 18 x 5 cm",
      cod_amount: 0,
      shipping_charge: 0,
      total_amount: 899.00
    },
    additional_fields: [
      { field_name: "Return Hub", value: "Surat Central Sorting Hub", confidence: 0.95 },
      { field_name: "Handling Instruction", value: "Fragile - Handle with Care", confidence: 0.92 }
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
