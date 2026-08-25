/**
 * Validation Service for Gemini Extracted Document Data.
 *
 * Validates the focused extraction output containing:
 * order_id, customer_name, sku_id, product_name, purchase_price, selling_price, quantity
 *
 * Key behaviors:
 *  - FAILED status if document is marked as invalid by Gemini
 *  - FAILED if ALL labels have zero useful data (no order_id, no customer_name, no items)
 *  - NEEDS_REVIEW if data is partial (e.g. missing order_id but has customer_name)
 *  - COMPLETED if extraction has meaningful data
 *  - Never injects dummy/placeholder values
 */

export function validateExtractionResult(structuredJson) {
  const warnings = [];

  if (!structuredJson || typeof structuredJson !== 'object') {
    return {
      validatedJson: {},
      warnings: ['Extraction output is empty or malformed'],
      overallConfidence: 0,
      status: 'FAILED'
    };
  }

  // Deep clone to avoid mutating the original
  const validated = JSON.parse(JSON.stringify(structuredJson));

  // ── CHECK: Invalid document flag from Gemini ──────────────────────────────
  if (validated.is_valid_document === false) {
    return {
      validatedJson: validated,
      warnings: [validated.rejection_reason || 'Document does not contain order/parcel information'],
      overallConfidence: 0,
      status: 'FAILED'
    };
  }

  // ── CHECK: Empty labels array ─────────────────────────────────────────────
  if (!Array.isArray(validated.labels) || validated.labels.length === 0) {
    return {
      validatedJson: validated,
      warnings: ['No order labels or data could be extracted from this document'],
      overallConfidence: 0,
      status: 'FAILED'
    };
  }

  // ── VALIDATE EACH LABEL ───────────────────────────────────────────────────
  let totalScore = 0;
  let totalMaxScore = 0;
  let labelsWithData = 0;

  validated.labels = validated.labels.map((label, idx) => {
    if (!label || typeof label !== 'object') return label;

    let labelScore = 0;
    let labelMax = 0;

    // 1. Order ID validation
    labelMax += 30;
    if (label.order_id) {
      const oidStr = String(label.order_id).trim();
      if (oidStr.length >= 4) {
        label.order_id = oidStr;
        labelScore += 30;
      } else {
        warnings.push(`Label #${idx + 1}: Order ID '${oidStr}' is unusually short`);
        labelScore += 10;
      }
    } else {
      warnings.push(`Label #${idx + 1}: Order ID not found`);
    }

    // 2. Customer Name validation
    labelMax += 20;
    if (label.customer_name) {
      label.customer_name = String(label.customer_name).trim();
      if (label.customer_name.length >= 2) {
        labelScore += 20;
      } else {
        warnings.push(`Label #${idx + 1}: Customer name '${label.customer_name}' is very short`);
        labelScore += 5;
      }
    } else {
      warnings.push(`Label #${idx + 1}: Customer name not found`);
    }

    // 3. Items validation
    labelMax += 30;
    if (Array.isArray(label.items) && label.items.length > 0) {
      let itemsValid = true;

      label.items = label.items.map((item, itemIdx) => {
        if (!item || typeof item !== 'object') return item;

        // Coerce quantity to integer
        if (item.quantity !== null && item.quantity !== undefined) {
          const qty = parseInt(String(item.quantity).replace(/[^0-9]/g, ''), 10);
          item.quantity = (!isNaN(qty) && qty > 0) ? qty : null;
        }

        // Coerce purchase_price to float
        if (item.purchase_price !== null && item.purchase_price !== undefined) {
          const p = parseFloat(String(item.purchase_price).replace(/[₹Rs,\s]/gi, '').replace(/[^0-9.]/g, ''));
          item.purchase_price = (!isNaN(p) && p >= 0) ? p : null;
        }

        // Coerce selling_price to float
        if (item.selling_price !== null && item.selling_price !== undefined) {
          const p = parseFloat(String(item.selling_price).replace(/[₹Rs,\s]/gi, '').replace(/[^0-9.]/g, ''));
          item.selling_price = (!isNaN(p) && p >= 0) ? p : null;
        }

        // Check if this item has any useful info
        if (!item.sku_id && !item.product_name) {
          itemsValid = false;
        }

        return item;
      });

      labelScore += itemsValid ? 30 : 15;
    }
    // Missing items is okay for some labels — don't warn

    // 4. Check if this label has any meaningful data at all
    const hasOrderId = !!label.order_id;
    const hasName = !!label.customer_name;
    const hasItems = Array.isArray(label.items) && label.items.length > 0 &&
      label.items.some(i => i.sku_id || i.product_name);

    if (hasOrderId || hasName || hasItems) {
      labelsWithData++;
    }

    totalScore += labelScore;
    totalMaxScore += labelMax;

    return label;
  });

  // ── COMPUTE CONFIDENCE ────────────────────────────────────────────────────
  const validationRatio = totalMaxScore > 0 ? (totalScore / totalMaxScore) : 0;
  const geminiConfidence = typeof validated.overall_confidence === 'number'
    ? Math.min(1, Math.max(0, validated.overall_confidence))
    : 0.80;

  const finalConfidence = Math.min(1.0, Math.max(0.1,
    Number((0.5 * geminiConfidence + 0.5 * validationRatio).toFixed(2))
  ));
  validated.overall_confidence = finalConfidence;

  // ── DETERMINE STATUS ──────────────────────────────────────────────────────
  if (labelsWithData === 0) {
    return {
      validatedJson: validated,
      warnings: ['No meaningful order data could be extracted from this document'],
      overallConfidence: finalConfidence,
      status: 'FAILED'
    };
  }

  let status = 'COMPLETED';
  if (finalConfidence < 0.50 || warnings.length >= 4) {
    status = 'NEEDS_REVIEW';
  }

  return {
    validatedJson: validated,
    warnings,
    overallConfidence: finalConfidence,
    status
  };
}
