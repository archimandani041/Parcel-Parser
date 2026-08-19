/**
 * Validation Service for Gemini Extracted Shipping Label Data.
 *
 * Changes from original:
 *  - NEEDS_REVIEW threshold raised from warnings≥2 to warnings≥4
 *    (real-world labels routinely miss seller, financial, or items — that's normal)
 *  - FAILED only when ALL THREE critical identifiers are absent
 *  - Financial normalization now handles ₹ prefix and comma-separated amounts
 *  - Pincode validation accepts Indian ZIP (6-digit) and international (5-digit)
 *  - Date normalizer handles more formats including DD MMM YYYY
 */

export function validateExtractionResult(structuredJson) {
  const warnings = [];
  let scorePoints = 0;
  let maxPoints   = 0;

  if (!structuredJson || typeof structuredJson !== 'object') {
    return {
      validatedJson:     {},
      warnings:          ['Extraction output is empty or malformed'],
      overallConfidence: 0,
      status:            'FAILED'
    };
  }

  // Deep clone to avoid mutating the original
  const validated = JSON.parse(JSON.stringify(structuredJson));

  // ── 1. GSTIN Validation ───────────────────────────────────────────────────
  const gstin = validated.seller?.gstin;
  if (gstin) {
    maxPoints += 10;
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
    const cleanGstin = String(gstin).trim().toUpperCase();
    if (gstinRegex.test(cleanGstin)) {
      validated.seller.gstin = cleanGstin;
      scorePoints += 10;
    } else {
      warnings.push(`Seller GSTIN '${gstin}' does not match 15-character GSTIN format`);
      scorePoints += 4;
    }
  }

  // ── 2. Pincode Validation ─────────────────────────────────────────────────
  const pincode = validated.customer?.pincode;
  if (pincode) {
    maxPoints += 10;
    const pStr = String(pincode).trim().replace(/\s/g, '');
    if (/^[1-9][0-9]{5}$/.test(pStr)) {
      // Valid 6-digit Indian pincode
      validated.customer.pincode = pStr;
      scorePoints += 10;
    } else if (/^\d{5,6}$/.test(pStr)) {
      // 5-digit ZIP or partial — still usable
      validated.customer.pincode = pStr;
      scorePoints += 8;
    } else {
      warnings.push(`Customer pincode '${pStr}' may be incomplete or invalid`);
      scorePoints += 3;
    }
  }

  // ── 3. Line Items Validation & Coercion ───────────────────────────────────
  if (Array.isArray(validated.items) && validated.items.length > 0) {
    maxPoints += 15;
    let allValid = true;

    validated.items = validated.items.map((item, idx) => {
      // Coerce quantity to integer
      if (item.quantity !== null && item.quantity !== undefined) {
        const qty = parseInt(String(item.quantity).replace(/[^0-9]/g, ''), 10);
        if (!isNaN(qty) && qty > 0) {
          item.quantity = qty;
        } else {
          item.quantity = null;
          warnings.push(`Item #${idx + 1}: invalid quantity '${item.quantity}'`);
          allValid = false;
        }
      }

      // Coerce price to float
      if (item.price !== null && item.price !== undefined) {
        const p = parseFloat(String(item.price).replace(/[^0-9.]/g, ''));
        item.price = (!isNaN(p) && p >= 0) ? p : null;
      }

      // Coerce total to float
      if (item.total !== null && item.total !== undefined) {
        const t = parseFloat(String(item.total).replace(/[^0-9.]/g, ''));
        item.total = (!isNaN(t) && t >= 0) ? t : null;
      }

      return item;
    });

    scorePoints += allValid ? 15 : 8;
  }
  // NOTE: Do NOT add a warning for missing items — many valid shipping labels
  // don't have a product table, especially COD labels.

  // ── 4. Order ID ───────────────────────────────────────────────────────────
  const orderId = validated.order?.order_id;
  if (orderId) {
    maxPoints += 10;
    const oidStr = String(orderId).trim();
    if (oidStr.length >= 4) {
      validated.order.order_id = oidStr;
      scorePoints += 10;
    } else {
      warnings.push(`Order ID '${oidStr}' is unusually short`);
      scorePoints += 5;
    }
  } else {
    warnings.push('Order ID not found on document');
  }

  // ── 5. AWB / Tracking Number ──────────────────────────────────────────────
  const hasAwb = !!(validated.shipping?.awb || validated.shipping?.tracking_number);
  if (hasAwb) {
    maxPoints += 10;
    scorePoints += 10;
  } else {
    warnings.push('AWB / Tracking number not detected');
  }

  // ── 6. Customer Name & Address ────────────────────────────────────────────
  if (validated.customer) {
    maxPoints += 15;
    const hasName    = !!(validated.customer.name);
    const hasAddress = !!(validated.customer.address || validated.customer.city);
    if (hasName && hasAddress)  { scorePoints += 15; }
    else if (hasName || hasAddress) {
      scorePoints += 8;
      warnings.push('Customer details are partial (missing name or address)');
    } else {
      warnings.push('Customer recipient information missing');
    }
  }

  // ── 7. Seller Name ────────────────────────────────────────────────────────
  if (validated.seller?.name) {
    maxPoints += 10;
    scorePoints += 10;
  }
  // No warning for missing seller — many labels (especially return labels) omit it

  // ── 8. Financial Normalization ────────────────────────────────────────────
  if (validated.financial) {
    const fin = validated.financial;
    for (const key of ['subtotal', 'discount', 'tax', 'shipping_charge', 'cod_amount', 'total_amount']) {
      if (fin[key] !== null && fin[key] !== undefined) {
        // Handle ₹1,299.00 → 1299.0
        const numStr = String(fin[key]).replace(/[₹Rs,\s]/gi, '').replace(/[^0-9.]/g, '');
        const num = parseFloat(numStr);
        fin[key] = !isNaN(num) ? num : null;
      }
    }
    validated.financial = fin;
  }

  // ── 9. Date Normalization ─────────────────────────────────────────────────
  if (validated.order?.order_date) {
    validated.order.order_date = tryNormalizeDate(validated.order.order_date) || validated.order.order_date;
  }
  if (validated.financial?.invoice_date) {
    validated.financial.invoice_date = tryNormalizeDate(validated.financial.invoice_date) || validated.financial.invoice_date;
  }
  if (validated.shipping?.expected_delivery) {
    validated.shipping.expected_delivery = tryNormalizeDate(validated.shipping.expected_delivery) || validated.shipping.expected_delivery;
  }

  // ── 10. Barcode Values ────────────────────────────────────────────────────
  if (validated.package?.barcode_values && !Array.isArray(validated.package.barcode_values)) {
    validated.package.barcode_values = [String(validated.package.barcode_values)];
  }

  // ── Compute Final Confidence ──────────────────────────────────────────────
  const geminiConfidence = typeof validated.overall_confidence === 'number'
    ? Math.min(1, Math.max(0, validated.overall_confidence))
    : 0.80;

  const validationRatio = maxPoints > 0 ? (scorePoints / maxPoints) : 0.75;

  // 60% Gemini self-report + 40% deterministic validation
  const finalConfidence = Math.min(1.0, Math.max(0.1,
    Number((0.6 * geminiConfidence + 0.4 * validationRatio).toFixed(2))
  ));
  validated.overall_confidence = finalConfidence;

  // ── Determine Status ──────────────────────────────────────────────────────
  // Hard FAILED: ALL three critical identifiers missing
  const missingCritical =
    !validated.order?.order_id &&
    !validated.shipping?.awb &&
    !validated.customer?.name;

  if (missingCritical) {
    return {
      validatedJson:     validated,
      warnings,
      overallConfidence: finalConfidence,
      status:            'FAILED'
    };
  }

  // NEEDS_REVIEW: raised threshold from 2 → 4 warnings, or low confidence < 0.6
  // Real labels commonly miss seller/items/financial — that's NOT a review trigger
  let status = 'COMPLETED';
  if (finalConfidence < 0.60 || warnings.length >= 4) {
    status = 'NEEDS_REVIEW';
  }

  return {
    validatedJson:     validated,
    warnings,
    overallConfidence: finalConfidence,
    status
  };
}

/**
 * Normalizes various date string formats to YYYY-MM-DD.
 * Handles: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, DD MMM YYYY, MMM DD YYYY, etc.
 */
function tryNormalizeDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const s = dateStr.trim();

  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // DD MMM YYYY (e.g. 14 Aug 2026)
  const dMonY = s.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})$/);
  if (dMonY) {
    const parsed = new Date(`${dMonY[2]} ${dMonY[1]}, ${dMonY[3]}`);
    if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
  }

  // Native Date parse (catches many formats)
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];

  return s; // Return original if unparseable
}
