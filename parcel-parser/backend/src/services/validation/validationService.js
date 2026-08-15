/**
 * Validation Service for Gemini Extracted Shipping Label Information.
 * Works with the expanded free-form schema that includes financial, package,
 * and extended customer/shipping sections.
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

  // === 1. GSTIN Validation ===
  const gstin = validated.seller?.gstin;
  if (gstin) {
    maxPoints += 10;
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
    const cleanedGstin = gstin.trim().toUpperCase();
    if (gstinRegex.test(cleanedGstin)) {
      validated.seller.gstin = cleanedGstin;
      scorePoints += 10;
    } else {
      warnings.push(`Seller GSTIN '${gstin}' does not match standard 15-character GSTIN format`);
      scorePoints += 4;
    }
  }

  // === 2. Pincode Validation ===
  const pincode = validated.customer?.pincode;
  if (pincode) {
    maxPoints += 10;
    const pincodeStr = String(pincode).trim();
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

  // === 3. Items / Line Items Validation ===
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
        item.price = !isNaN(priceNum) && priceNum >= 0 ? priceNum : null;
      }
      // Validate total
      if (item.total !== null && item.total !== undefined) {
        const totalNum = parseFloat(String(item.total).replace(/[^0-9.]/g, ''));
        item.total = !isNaN(totalNum) && totalNum >= 0 ? totalNum : null;
      }
      return item;
    });

    if (itemsValid) scorePoints += 15;
    else scorePoints += 8;
  } else {
    warnings.push("No line items / products extracted from document");
  }

  // === 4. Order ID Validation ===
  const orderId = validated.order?.order_id;
  if (orderId) {
    maxPoints += 10;
    const orderIdStr = String(orderId).trim();
    if (orderIdStr.length >= 4) {
      validated.order.order_id = orderIdStr;
      scorePoints += 10;
    } else {
      warnings.push(`Order ID '${orderIdStr}' is unusually short`);
      scorePoints += 5;
    }
  } else {
    warnings.push("Order ID is missing from document");
  }

  // === 5. AWB / Tracking Number ===
  if (validated.shipping?.awb || validated.shipping?.tracking_number) {
    maxPoints += 10;
    scorePoints += 10;
  } else {
    warnings.push("Neither AWB Number nor Tracking Number was detected");
  }

  // === 6. Customer Name & Address ===
  if (validated.customer) {
    maxPoints += 15;
    const hasName = !!(validated.customer.name);
    const hasAddress = !!(validated.customer.address);
    if (hasName && hasAddress) {
      scorePoints += 15;
    } else if (hasName || hasAddress) {
      scorePoints += 8;
      warnings.push("Customer details are partial (missing name or address)");
    } else {
      warnings.push("Customer recipient information is missing");
    }
  }

  // === 7. Seller Name ===
  if (validated.seller?.name) {
    maxPoints += 10;
    scorePoints += 10;
  } else {
    warnings.push("Seller / Merchant name is missing");
  }

  // === 8. Financial / Amounts Normalization ===
  if (validated.financial) {
    const fin = validated.financial;
    // Normalize numeric financial fields
    for (const key of ['subtotal', 'discount', 'tax', 'shipping_charge', 'cod_amount', 'total_amount']) {
      if (fin[key] !== null && fin[key] !== undefined) {
        const num = parseFloat(String(fin[key]).replace(/[^0-9.]/g, ''));
        fin[key] = !isNaN(num) ? num : null;
      }
    }
    validated.financial = fin;
  }

  // === 9. Date Normalization ===
  if (validated.order?.order_date) {
    const normalized = tryNormalizeDate(validated.order.order_date);
    if (normalized) validated.order.order_date = normalized;
  }
  if (validated.financial?.invoice_date) {
    const normalized = tryNormalizeDate(validated.financial.invoice_date);
    if (normalized) validated.financial.invoice_date = normalized;
  }
  if (validated.shipping?.expected_delivery) {
    const normalized = tryNormalizeDate(validated.shipping.expected_delivery);
    if (normalized) validated.shipping.expected_delivery = normalized;
  }

  // === 10. Barcode values — ensure it's an array ===
  if (validated.package?.barcode_values && !Array.isArray(validated.package.barcode_values)) {
    validated.package.barcode_values = [String(validated.package.barcode_values)];
  }

  // === Compute Final Confidence ===
  const geminiConfidence = typeof validated.overall_confidence === 'number'
    ? Math.min(1, Math.max(0, validated.overall_confidence))
    : 0.80;

  const validationRatio = maxPoints > 0 ? (scorePoints / maxPoints) : 0.75;

  // Weighted: 60% Gemini self-report + 40% deterministic score
  const finalConfidence = Math.min(1.0, Math.max(0.1,
    Number((0.6 * geminiConfidence + 0.4 * validationRatio).toFixed(2))
  ));
  validated.overall_confidence = finalConfidence;

  // === Determine Status ===
  let status = "COMPLETED";
  if (finalConfidence < 0.75 || warnings.length >= 2) {
    status = "NEEDS_REVIEW";
  }
  // Hard FAILED: missing all three critical identifiers
  const missingCritical = !validated.order?.order_id && !validated.shipping?.awb && !validated.customer?.name;
  if (missingCritical) {
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
 * Attempts to convert various date strings into standard YYYY-MM-DD format.
 */
function tryNormalizeDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return trimmed;
}
