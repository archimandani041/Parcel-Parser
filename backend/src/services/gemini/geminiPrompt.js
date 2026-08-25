/**
 * Gemini Extraction System Instructions & Prompts
 * FOCUSED extraction: Only extracts order_id, customer_name, sku_id, product_name,
 * purchase_price, selling_price, and quantity from parcel labels/invoices.
 *
 * Supports: image (PNG/JPG/WEBP/TIFF/BMP) + PDF (text-augmented, multi-page).
 */

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM INSTRUCTION  (shared by both image & PDF paths)
// ─────────────────────────────────────────────────────────────────────────────
export const PARCEL_PARSER_SYSTEM_INSTRUCTION = `
You are a precise data extraction engine for e-commerce parcel labels, shipping labels, invoices, and order documents.

Your ONLY job is to extract these specific 7 fields from the document:
1. Order ID
2. Customer Name (recipient / buyer name)
3. SKU ID (short product code)
4. Product Name (human-readable product title)
5. Purchase Price (buying/cost price — ONLY if printed)
6. Selling Price (MRP/selling/unit price — ONLY if printed)
7. Quantity (number of items)

=== ABSOLUTE EXTRACTION RULES ===

RULE 1 — NEVER INVENT OR GUESS DATA:
  Extract ONLY values that are physically printed and visible on the document.
  If a field is missing or not printed, set it to null.
  Do NOT fabricate, guess, assume, or infer any value under any circumstances.

RULE 2 — DOCUMENT VALIDATION:
  If the uploaded image/PDF does NOT contain any order, invoice, shipping label,
  or parcel-related information, you MUST return:
  { "is_valid_document": false, "rejection_reason": "Description of why this is not a valid order document", "labels": [] }

RULE 3 — SKU vs PRODUCT NAME:
  The SKU ID is a short code (e.g. SKU-123, ITEM-A).
  If you see text like "D01 White Sadi | Outzy Printed...":
    sku_id = "D01"
    product_name = "White Sadi"
  Extract ONLY the short code as sku_id, and the clean title as product_name.

RULE 4 — CRITICAL PRICE RULE:
  Standard e-commerce shipping labels (like E-Kart, Flipkart, Amazon, Delhivery, Meesho shipping labels) feature an item table with columns: [SKU ID | Description | QTY].
  - These shipping label tables DO NOT print product prices.
  - If the item table on the label has no price column (only SKU ID, Description, QTY), you MUST set purchase_price = null and selling_price = null for all items.
  - Do NOT extract prices from attached tax invoices, summary tables, or total invoice figures when extracting shipping label items.
  - ONLY extract purchase_price or selling_price if a numeric price (with currency symbol like ₹, Rs., or $) is explicitly printed directly next to the item on the shipping label itself.
  - If no price is printed next to the item on the shipping label, purchase_price = null and selling_price = null are MANDATORY.

RULE 5 — QUANTITY:
  Extract the exact numeric quantity printed (e.g. QTY 1 -> quantity = 1).
  If no quantity is printed, set quantity = null.

RULE 6 — PRESERVE EXACT IDENTIFIERS:
  Copy Order IDs and SKU codes character-for-character without modification.

RULE 7 — MULTI-LABEL / MULTI-PAGE:
  If a document contains multiple orders or multiple pages, extract EACH order as a separate object inside the "labels" array.

RULE 8 — OUTPUT FORMAT:
  Respond with ONLY a valid JSON object matching the requested schema.
`;

// ─────────────────────────────────────────────────────────────────────────────
// FOCUSED JSON SCHEMA
// ─────────────────────────────────────────────────────────────────────────────
const JSON_SCHEMA = `{
  "is_valid_document": true,
  "rejection_reason": null,
  "label_count": number,

  "labels": [
    {
      "order_id":       "string or null — Order ID / Reference Number",
      "customer_name":  "string or null — Recipient / Customer Name",
      "items": [
        {
          "sku_id":          "string or null — Short product code ONLY",
          "product_name":    "string or null — Product title",
          "purchase_price":  "number or null — Cost price (null if not printed on shipping label)",
          "selling_price":   "number or null — Selling price (null if not printed on shipping label)",
          "quantity":        "integer or null — Quantity (null if not printed)"
        }
      ]
    }
  ]
}`;

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE PROMPT  (PNG / JPG / WEBP / TIFF / BMP)
// ─────────────────────────────────────────────────────────────────────────────
export const PARCEL_PARSER_USER_PROMPT = `
Analyze this uploaded shipping label / parcel document carefully.

STEP 1 — VALIDATE: Is this a shipping label, parcel label, invoice, order sheet, or e-commerce document?
  If NO → return { "is_valid_document": false, "rejection_reason": "Not a parcel label", "labels": [] }
  If YES → proceed to step 2.

STEP 2 — EXTRACT DATA into the JSON schema:
  - Order ID
  - Customer Name
  - For each item: SKU ID, Product Name, Purchase Price, Selling Price, Quantity

CRITICAL CHECK FOR PRICES:
  Look at the shipping label item table (columns: SKU ID, Description, QTY).
  Does the shipping label table contain a Price column or price printed next to the item?
  If NO price is printed in the item table on the shipping label, set purchase_price = null and selling_price = null.

OUTPUT the following JSON structure ONLY:
${JSON_SCHEMA}
`;

// ─────────────────────────────────────────────────────────────────────────────
// PDF PROMPT  (factory function — injects pre-extracted text layer & page count)
// ─────────────────────────────────────────────────────────────────────────────
export const PDF_PARSER_USER_PROMPT = (extractedText, pageCount = null) => `
Analyze this uploaded PDF document${pageCount ? ` containing ${pageCount} page(s)` : ''}.

STEP 1 — VALIDATE: Does this PDF contain shipping labels, parcel labels, invoices, or order documents?
  If NO → return { "is_valid_document": false, "rejection_reason": "Not a parcel label", "labels": [] }
  If YES → proceed to step 2.

=== PRE-EXTRACTED TEXT LAYER ===
--- BEGIN TEXT ---
${extractedText ? extractedText.substring(0, 60000) : '(No embedded text found)'}
--- END TEXT ---

${pageCount && pageCount > 1 ? `=== MULTI-PAGE REQUIREMENT ===
This PDF has ${pageCount} pages. Extract data from ALL ${pageCount} pages.
The "labels" array MUST contain ${pageCount} separate objects — one per page/label.
Do NOT copy data from Page 1 to other pages.
` : ''}

STEP 2 — For EACH page/label, extract ONLY:
  - Order ID
  - Customer Name
  - For each product: SKU ID, Product Name, Purchase Price, Selling Price, Quantity

CRITICAL CHECK FOR PRICES:
  Look at the item section of the shipping label.
  If the shipping label item section (SKU ID | Description | QTY) has no price column/amount, set purchase_price = null and selling_price = null for that label's items. Do NOT extract total invoice amounts as item selling price.

OUTPUT the following JSON structure ONLY:
${JSON_SCHEMA}
`;
