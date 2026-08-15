/**
 * Validation Service for Gemini Extracted Shipping Label Information
 * Combines LLM extraction with deterministic regex & sanity validations
 * to produce validated structured JSON, validation warnings, field-level confidence,
 * and overall document status ('COMPLETED' | 'NEEDS_REVIEW' | 'FAILED').
 */

export function validateExtractionResult(structuredJson) {
  const warnings = [];
  let scorePoints = 0;
  let maxPoints = 0;

  if (!structuredJson || typeof structuredJson !== 'object') {
    return {
      validatedJson: {},
      warnings: ["Extraction output is empty or malformed"],
      overallConfidence: 0,
      status: "FAILED"
    };
  }

  // Create clean copy of structured JSON
  const validated = JSON.parse(JSON.stringify(structuredJson));

  // --- 1. GSTIN Validation ---
  if (validated.seller && validated.seller.gstin) {
    maxPoints += 10;
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
    const cleanedGstin = validated.seller.gstin.trim().toUpperCase();
    if (gstinRegex.test(cleanedGstin)) {
      validated.seller.gstin = cleanedGstin;
      scorePoints += 10;
    } else {
      warnings.push(`Seller GSTIN '${validated.seller.gstin}' does not match standard 15-character GSTIN format`);
      scorePoints += 4;
    }
  }

  // --- 2. Pincode Validation ---
  if (validated.customer && validated.customer.pincode) {
    maxPoints += 10;
    const pincodeStr = String(validated.customer.pincode).trim();
    // Indian 6-digit PIN code regex or standard 5-6 digit postal code
    const pinRegex = /^[1-9][0-9]{5}$/;
    if (pinRegex.test(pincodeStr)) {
      validated.customer.pincode = pincodeStr;
      scorePoints += 10;
    } else if (/^\d{5,6}$/.test(pincodeStr)) {
      validated.customer.pincode = pincodeStr;
      scorePoints += 8;
    } else {
      warnings.push(`Customer Pincode '${pincodeStr}' may be invalid or incomplete`);
      scorePoints += 3;
    }
  }

  // --- 3. Quantity & Items Validation ---
  if (Array.isArray(validated.items) && validated.items.length > 0) {
    maxPoints += 15;
    let itemsValid = true;
    validated.items = validated.items.map((item, idx) => {
      // Validate quantity
      if (item.quantity !== null && item.quantity !== undefined) {
        const qtyNum = parseInt(item.quantity, 10);
        if (!isNaN(qtyNum) && qtyNum > 0) {
          item.quantity = qtyNum;
        } else {
          item.quantity = null;
          warnings.push(`Item #${idx + 1} (${item.product_name || 'unnamed'}) has non-numeric or zero quantity`);
          itemsValid = false;
        }
      }

      // Validate price
      if (item.price !== null && item.price !== undefined) {
        const priceNum = parseFloat(String(item.price).replace(/[^0-9.]/g, ''));
        if (!isNaN(priceNum) && priceNum >= 0) {
          item.price = priceNum;
        } else {
          item.price = null;
        }
      }

      return item;
    });

    if (itemsValid) scorePoints += 15;
    else scorePoints += 8;
  } else {
    warnings.push("No line items / products extracted from document");
  }

  // --- 4. Order ID Validation ---
  if (validated.order && validated.order.order_id) {
    maxPoints += 10;
    const orderId = String(validated.order.order_id).trim();
    if (orderId.length >= 4) {
      validated.order.order_id = orderId;
      scorePoints += 10;
    } else {
      warnings.push(`Order ID '${orderId}' is unusually short`);
      scorePoints += 5;
    }
  } else {
    warnings.push("Order ID is missing from document");
  }

  // --- 5. AWB / Tracking Number Validation ---
  if (validated.shipping && (validated.shipping.awb || validated.shipping.tracking_number)) {
    maxPoints += 10;
    scorePoints += 10;
  } else {
    warnings.push("Neither AWB Number nor Tracking Number was detected");
  }

  // --- 6. Customer Name & Address Check ---
  if (validated.customer) {
    maxPoints += 15;
    if (validated.customer.name && validated.customer.address) {
      scorePoints += 15;
    } else if (validated.customer.name || validated.customer.address) {
      scorePoints += 8;
      warnings.push("Customer details are partial (missing name or address)");
    } else {
      warnings.push("Customer recipient information is missing");
    }
  }

  // --- 7. Seller Name Check ---
  if (validated.seller && validated.seller.name) {
    maxPoints += 10;
    scorePoints += 10;
  } else {
    warnings.push("Seller / Merchant name is missing");
  }

  // --- 8. Date Normalization ---
  if (validated.order && validated.order.order_date) {
    const rawDate = validated.order.order_date;
    const parsedDate = tryNormalizeDate(rawDate);
    if (parsedDate) {
      validated.order.order_date = parsedDate;
    }
  }

  // Calculate composite confidence score (0.0 to 1.0)
  const baseConfidence = validated.overall_confidence ? parseFloat(validated.overall_confidence) : 0.85;
  const validationRatio = maxPoints > 0 ? (scorePoints / maxPoints) : 0.8;
  
  // Weighted final confidence (60% Gemini self-report + 40% deterministic validation score)
  const finalConfidence = Math.min(1.0, Math.max(0.1, Number((0.6 * baseConfidence + 0.4 * validationRatio).toFixed(2))));
  validated.overall_confidence = finalConfidence;

  // Determine Document Status:
  // COMPLETED: Confidence >= 0.80 and no critical warnings
  // NEEDS_REVIEW: Confidence < 0.80 or warnings present
  // FAILED: Missing crucial order/shipping/customer info completely
  let status = "COMPLETED";
  if (finalConfidence < 0.75 || warnings.length >= 2) {
    status = "NEEDS_REVIEW";
  }
  if (!validated.order?.order_id && !validated.shipping?.awb && !validated.customer?.name) {
    status = "FAILED";
  }

  return {
    validatedJson: validated,
    warnings,
    overallConfidence: finalConfidence,
    status
  };
}

/**
 * Attempts to convert various date strings into standard YYYY-MM-DD format
 */
function tryNormalizeDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  
  // Check if already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return trimmed;
}
