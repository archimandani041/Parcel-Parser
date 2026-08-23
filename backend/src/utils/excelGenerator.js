import ExcelJS from 'exceljs';

// Executive Color Tokens (ARGB Hex)
const COLORS = {
  NAVY_HEADER_BG: '1E293B',       // Deep Navy banner
  SLATE_HEADER_BG: '334155',      // Slate Navy for table headers
  STOCK_HEADER_BG: '1E40AF',      // Royal Blue for stock headers
  CUST_RETURN_BG: '92400E',       // Amber Dark for customer returns header
  RTO_RETURN_BG: '6B21A8',        // Executive Purple for RTO header
  MASTER_HEADER_BG: '0F766E',     // Deep Teal for Master report
  
  WHITE_TEXT: 'FFFFFF',
  DARK_SLATE_TEXT: '1E293B',
  MUTED_SLATE_TEXT: '64748B',

  // Fills & Texts for Highlights
  PROFIT_BG: 'DCFCE7',            // Soft Green
  PROFIT_TEXT: '15803D',          // Dark Green
  
  LOSS_BG: 'FEE2E2',              // Soft Red
  LOSS_TEXT: 'B91C1C',            // Dark Red

  CUST_BADGE_BG: 'FEF3C7',        // Soft Amber
  CUST_BADGE_TEXT: '92400E',      // Dark Amber

  RTO_BADGE_BG: 'F3E8FF',         // Soft Purple
  RTO_BADGE_TEXT: '6B21A8',       // Dark Purple

  ACTIVE_BADGE_BG: 'D1FAE5',      // Soft Emerald
  ACTIVE_BADGE_TEXT: '065F46',    // Dark Emerald

  STOCK_BADGE_BG: 'DBEAFE',       // Soft Blue
  STOCK_BADGE_TEXT: '1E40AF',     // Dark Blue

  SUMMARY_CARD_BG: 'F8FAFC',      // Soft Slate fill for KPI cards
  BORDER_COLOR: 'CBD5E1'          // Light border
};

/** Format date string nicely */
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
  } catch (e) {
    return String(dateStr);
  }
}

/** Helper: Add Styled Banner Header to Worksheet */
function addTitleBanner(sheet, title, subtitle, colCount) {
  sheet.mergeCells(1, 1, 1, colCount);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = title.toUpperCase();
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: COLORS.WHITE_TEXT } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.NAVY_HEADER_BG } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 36;

  sheet.mergeCells(2, 1, 2, colCount);
  const subCell = sheet.getCell(2, 1);
  subCell.value = subtitle;
  subCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: '94A3B8' } };
  subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.NAVY_HEADER_BG } };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(2).height = 20;

  // Empty spacer row
  sheet.getRow(3).height = 10;
}

/** Helper: Auto-fit Column Widths */
function autoFitColumns(sheet, minWidth = 14, maxWidth = 45) {
  sheet.columns.forEach(column => {
    let maxLen = minWidth;
    column.eachCell({ includeEmpty: false }, (cell, rowNumber) => {
      // Ignore merged title banner rows for width calculation
      if (rowNumber <= 3) return;
      const text = cell.value != null ? String(cell.value) : '';
      if (text.length > maxLen) {
        maxLen = text.length;
      }
    });
    column.width = Math.min(maxWidth, Math.max(minWidth, maxLen + 4));
  });
}

/** Apply default thin borders to a cell range */
function applyBorders(sheet, startRow, endRow, startCol, endCol) {
  for (let r = startRow; r <= endRow; r++) {
    const row = sheet.getRow(r);
    for (let c = startCol; c <= endCol; c++) {
      const cell = row.getCell(c);
      cell.border = {
        top: { style: 'thin', color: { argb: COLORS.BORDER_COLOR } },
        left: { style: 'thin', color: { argb: COLORS.BORDER_COLOR } },
        bottom: { style: 'thin', color: { argb: COLORS.BORDER_COLOR } },
        right: { style: 'thin', color: { argb: COLORS.BORDER_COLOR } }
      };
    }
  }
}

// ============================================================================
// 1. STOCK EXCEL GENERATOR
// ============================================================================
export async function generateStockWorkbook(products = [], summary = {}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ParcelAI Platform';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Stock Overview');
  const nowStr = formatDate(new Date().toISOString());

  const headers = [
    'SKU ID',
    'Product Name',
    'Total Qty',
    'Sold Qty',
    'Cust. Return Qty',
    'RTO Return Qty',
    'Total Returned Qty',
    'Current Stock',
    'Purchase Price (₹)',
    'Selling Price (₹)',
    'Inventory Cost (₹)',
    'Inventory Value (₹)',
    'Realized Profit (₹)',
    'Return Loss (₹)',
    'Net Profit (₹)'
  ];

  addTitleBanner(sheet, 'PARCELAI — STOCK & INVENTORY REPORT', `Generated: ${nowStr} | Source: Supabase PostgreSQL`, headers.length);

  // Summary Section (Rows 4-5)
  const kpis = [
    { label: 'Total Products', val: summary.total_products || products.length, num: true },
    { label: 'Total Quantity', val: summary.total_quantity || 0, num: true },
    { label: 'Sold Qty', val: summary.total_successfully_sold_quantity || 0, num: true, highlight: 'sold' },
    { label: 'Cust. Returned Qty', val: summary.total_customer_returned_quantity || 0, num: true, highlight: 'cust' },
    { label: 'RTO Returned Qty', val: summary.total_rto_returned_quantity || 0, num: true, highlight: 'rto' },
    { label: 'Current Stock', val: summary.total_available_quantity || 0, num: true, highlight: 'stock' },
    { label: 'Inventory Cost', val: summary.total_inventory_cost || 0, curr: true },
    { label: 'Inventory Value', val: summary.total_inventory_value || 0, curr: true },
    { label: 'Realized Profit', val: summary.total_realized_sales_profit || 0, curr: true, highlight: 'sold' },
    { label: 'Return Loss', val: summary.total_return_loss || 0, curr: true, highlight: 'loss' },
    { label: 'Net Profit', val: summary.total_net_profit || 0, curr: true, highlight: (summary.total_net_profit >= 0 ? 'sold' : 'loss') }
  ];

  // Render KPI Table Summary (Row 4 header, Row 5 values)
  sheet.getRow(4).height = 20;
  sheet.getRow(5).height = 24;

  kpis.forEach((kpi, i) => {
    const col = i + 1;
    if (col <= headers.length) {
      const lblCell = sheet.getCell(4, col);
      lblCell.value = kpi.label;
      lblCell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: '475569' } };
      lblCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.SUMMARY_CARD_BG } };
      lblCell.alignment = { horizontal: 'center', vertical: 'middle' };

      const valCell = sheet.getCell(5, col);
      valCell.value = kpi.val;
      valCell.font = { name: 'Calibri', size: 11, bold: true };
      valCell.alignment = { horizontal: 'center', vertical: 'middle' };

      if (kpi.curr) {
        valCell.numFmt = '"₹"#,##0';
        valCell.alignment = { horizontal: 'right', vertical: 'middle' };
      } else if (kpi.num) {
        valCell.numFmt = '#,##0';
      }

      if (kpi.highlight === 'sold') {
        valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.PROFIT_BG } };
        valCell.font.color = { argb: COLORS.PROFIT_TEXT };
      } else if (kpi.highlight === 'loss') {
        valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.LOSS_BG } };
        valCell.font.color = { argb: COLORS.LOSS_TEXT };
      } else if (kpi.highlight === 'cust') {
        valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.CUST_BADGE_BG } };
        valCell.font.color = { argb: COLORS.CUST_BADGE_TEXT };
      } else if (kpi.highlight === 'rto') {
        valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.RTO_BADGE_BG } };
        valCell.font.color = { argb: COLORS.RTO_BADGE_TEXT };
      } else if (kpi.highlight === 'stock') {
        valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.STOCK_BADGE_BG } };
        valCell.font.color = { argb: COLORS.STOCK_BADGE_TEXT };
      }
    }
  });
  applyBorders(sheet, 4, 5, 1, Math.min(kpis.length, headers.length));

  // Spacer row 6
  sheet.getRow(6).height = 12;

  // Table Headers (Row 7)
  const headerRow = sheet.getRow(7);
  headerRow.height = 30;
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.WHITE_TEXT } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.STOCK_HEADER_BG } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  });

  // Table Data (Row 8 onwards)
  let startDataRow = 8;
  products.forEach((p, idx) => {
    const rowNum = startDataRow + idx;
    const row = sheet.getRow(rowNum);
    row.height = 22;

    const soldQty = p.successfully_sold_quantity != null ? p.successfully_sold_quantity : (p.realized_sales_quantity || 0);
    const custRetQty = p.customer_returned_quantity || 0;
    const rtoRetQty = p.rto_returned_quantity || 0;
    const totalRetQty = custRetQty + rtoRetQty;
    const availQty = p.available_quantity != null ? p.available_quantity : 0;
    const purchasePrice = p.purchase_price != null ? Number(p.purchase_price) : 0;
    const sellingPrice = p.selling_price != null ? Number(p.selling_price) : 0;
    const invCost = purchasePrice * availQty;
    const invValue = sellingPrice * availQty;
    const realizedProfit = p.realized_sales_profit != null ? Number(p.realized_sales_profit) : (sellingPrice - purchasePrice) * soldQty;
    const returnLoss = p.return_loss != null ? Number(p.return_loss) : 0;
    const netProfit = realizedProfit - returnLoss;

    const values = [
      p.sku_id || '',
      p.product_name || '',
      p.total_quantity || 0,
      soldQty,
      custRetQty,
      rtoRetQty,
      totalRetQty,
      availQty,
      purchasePrice,
      sellingPrice,
      invCost,
      invValue,
      realizedProfit,
      returnLoss,
      netProfit
    ];

    values.forEach((v, cIdx) => {
      const cell = row.getCell(cIdx + 1);
      cell.value = v;
      cell.font = { name: 'Calibri', size: 10 };

      // Column specific alignment & formatting
      if (cIdx === 0) {
        // SKU ID
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { name: 'Calibri', size: 10, bold: true };
      } else if (cIdx === 1) {
        // Product Name
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      } else if (cIdx >= 2 && cIdx <= 7) {
        // Quantities
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.numFmt = '#,##0';

        if (cIdx === 3 && soldQty > 0) {
          // Sold Qty highlight
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.PROFIT_TEXT } };
        } else if (cIdx === 4 && custRetQty > 0) {
          // Cust Ret Qty highlight
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.CUST_BADGE_TEXT } };
        } else if (cIdx === 5 && rtoRetQty > 0) {
          // RTO Ret Qty highlight
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.RTO_BADGE_TEXT } };
        } else if (cIdx === 7 && availQty > 0) {
          // Available Stock highlight
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.STOCK_BADGE_TEXT } };
        }
      } else {
        // Currency values (cIdx 8 to 14)
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '"₹"#,##0';

        if (cIdx === 12 && realizedProfit > 0) {
          // Realized Profit
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.PROFIT_BG } };
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.PROFIT_TEXT } };
        } else if (cIdx === 13 && returnLoss > 0) {
          // Return Loss
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.LOSS_BG } };
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.LOSS_TEXT } };
        } else if (cIdx === 14) {
          // Net Profit
          if (netProfit > 0) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.PROFIT_BG } };
            cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.PROFIT_TEXT } };
          } else if (netProfit < 0) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.LOSS_BG } };
            cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.LOSS_TEXT } };
          }
        }
      }
    });
  });

  const endDataRow = startDataRow + products.length - 1;
  if (products.length > 0) {
    applyBorders(sheet, 7, endDataRow, 1, headers.length);
  }

  // Freeze Header & Enable AutoFilter
  sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 7, topLeftCell: 'A8', activeCell: 'A8' }];
  sheet.autoFilter = { from: { row: 7, column: 1 }, to: { row: Math.max(7, endDataRow), column: headers.length } };
  autoFitColumns(sheet);

  return workbook;
}

// ============================================================================
// 2. RETURNS EXCEL GENERATOR
// ============================================================================
export async function generateReturnsWorkbook(returns = [], customerReturns = [], rtoReturns = [], summary = {}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ParcelAI Platform';
  workbook.created = new Date();

  const nowStr = formatDate(new Date().toISOString());

  const headers = [
    'Order ID',
    'Customer Name',
    'SKU ID',
    'Product Name',
    'Quantity',
    'Return Type',
    'Purchase Price (₹)',
    'Selling Price (₹)',
    'Delivery Charge (₹)',
    'Return Loss (₹)',
    'Return Date'
  ];

  const buildReturnSheet = (sheetName, dataList, headerBgColor, isRtoOnly = false) => {
    const sheet = workbook.addWorksheet(sheetName);
    addTitleBanner(sheet, `PARCELAI — ${sheetName.toUpperCase()}`, `Generated: ${nowStr} | Source: Supabase PostgreSQL`, headers.length);

    // Summary Section (Row 4-5)
    const custCount = customerReturns.length;
    const rtoCount = rtoReturns.length;
    const totalCount = returns.length;
    const totalDeliveryCharges = customerReturns.reduce((acc, r) => acc + (r.delivery_boy_charge || 0), 0);

    const kpis = [
      { label: 'Total Returned Parcels', val: dataList.length, num: true },
      { label: 'Customer Returns', val: custCount, num: true, highlight: 'cust' },
      { label: 'RTO Returns', val: rtoCount, num: true, highlight: 'rto' },
      { label: 'Total Delivery Charges', val: isRtoOnly ? 0 : totalDeliveryCharges, curr: true, highlight: isRtoOnly ? null : 'loss' },
      { label: 'Total Return Loss', val: isRtoOnly ? 0 : totalDeliveryCharges, curr: true, highlight: isRtoOnly ? null : 'loss' }
    ];

    sheet.getRow(4).height = 20;
    sheet.getRow(5).height = 24;

    kpis.forEach((kpi, i) => {
      const col = i + 1;
      const lblCell = sheet.getCell(4, col);
      lblCell.value = kpi.label;
      lblCell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: '475569' } };
      lblCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.SUMMARY_CARD_BG } };
      lblCell.alignment = { horizontal: 'center', vertical: 'middle' };

      const valCell = sheet.getCell(5, col);
      valCell.value = kpi.val;
      valCell.font = { name: 'Calibri', size: 11, bold: true };
      valCell.alignment = { horizontal: 'center', vertical: 'middle' };

      if (kpi.curr) {
        valCell.numFmt = '"₹"#,##0';
        valCell.alignment = { horizontal: 'right', vertical: 'middle' };
      } else if (kpi.num) {
        valCell.numFmt = '#,##0';
      }

      if (kpi.highlight === 'cust') {
        valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.CUST_BADGE_BG } };
        valCell.font.color = { argb: COLORS.CUST_BADGE_TEXT };
      } else if (kpi.highlight === 'rto') {
        valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.RTO_BADGE_BG } };
        valCell.font.color = { argb: COLORS.RTO_BADGE_TEXT };
      } else if (kpi.highlight === 'loss' && kpi.val > 0) {
        valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.LOSS_BG } };
        valCell.font.color = { argb: COLORS.LOSS_TEXT };
      }
    });
    applyBorders(sheet, 4, 5, 1, kpis.length);

    sheet.getRow(6).height = 12;

    // Headers Row (Row 7)
    const headerRow = sheet.getRow(7);
    headerRow.height = 30;
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.WHITE_TEXT } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBgColor } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    });

    // Data Rows (Row 8+)
    let startDataRow = 8;
    dataList.forEach((r, idx) => {
      const rowNum = startDataRow + idx;
      const row = sheet.getRow(rowNum);
      row.height = 22;

      const isRto = r.return_type === 'RTO_RETURN';
      const charge = isRto ? 0 : (r.delivery_boy_charge != null ? Number(r.delivery_boy_charge) : 0);
      const loss = isRto ? 0 : charge;

      const values = [
        r.order_id || '',
        r.customer_name || '',
        r.sku_id || '',
        r.product_name || '',
        r.quantity || 1,
        isRto ? 'RTO RETURN' : 'CUSTOMER RETURN',
        r.purchase_price != null ? Number(r.purchase_price) : 0,
        r.selling_price != null ? Number(r.selling_price) : 0,
        charge,
        loss,
        formatDate(r.return_date || r.updated_at)
      ];

      values.forEach((v, cIdx) => {
        const cell = row.getCell(cIdx + 1);
        cell.value = v;
        cell.font = { name: 'Calibri', size: 10 };

        if (cIdx === 0 || cIdx === 2) {
          // Order ID / SKU ID
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.font = { name: 'Calibri', size: 10, bold: true };
        } else if (cIdx === 1 || cIdx === 3) {
          // Text fields
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        } else if (cIdx === 4) {
          // Quantity
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.numFmt = '#,##0';
        } else if (cIdx === 5) {
          // Return Type Badge
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.font = { name: 'Calibri', size: 10, bold: true };
          if (isRto) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.RTO_BADGE_BG } };
            cell.font.color = { argb: COLORS.RTO_BADGE_TEXT };
          } else {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.CUST_BADGE_BG } };
            cell.font.color = { argb: COLORS.CUST_BADGE_TEXT };
          }
        } else if (cIdx >= 6 && cIdx <= 9) {
          // Financials
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '"₹"#,##0';

          if (cIdx === 9 && loss > 0) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.LOSS_BG } };
            cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.LOSS_TEXT } };
          }
        } else if (cIdx === 10) {
          // Date
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });
    });

    const endDataRow = startDataRow + dataList.length - 1;
    if (dataList.length > 0) {
      applyBorders(sheet, 7, endDataRow, 1, headers.length);
    }

    sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 7, topLeftCell: 'A8', activeCell: 'A8' }];
    sheet.autoFilter = { from: { row: 7, column: 1 }, to: { row: Math.max(7, endDataRow), column: headers.length } };
    autoFitColumns(sheet);
  };

  buildReturnSheet('All Returns', returns, COLORS.SLATE_HEADER_BG);
  buildReturnSheet('Customer Returns', customerReturns, COLORS.CUST_RETURN_BG);
  buildReturnSheet('RTO Returns', rtoReturns, COLORS.RTO_RETURN_BG, true);

  return workbook;
}

// ============================================================================
// 3. ORDERS EXCEL GENERATOR
// ============================================================================
export async function generateOrdersWorkbook(records = []) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ParcelAI Platform';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Orders Ledger');
  const nowStr = formatDate(new Date().toISOString());

  const headers = [
    'Order ID',
    'Customer Name',
    'SKU ID',
    'Product Name',
    'Quantity',
    'Purchase Price (₹)',
    'Selling Price (₹)',
    'Return Status',
    'Order Date'
  ];

  addTitleBanner(sheet, 'PARCELAI — ORDERS LEDGER REPORT', `Generated: ${nowStr} | Source: Supabase PostgreSQL`, headers.length);

  // Summary KPI Section
  const totalOrders = records.length;
  const activeOrders = records.filter(r => !r.is_returned).length;
  const custReturns = records.filter(r => r.is_returned && r.return_type !== 'RTO_RETURN').length;
  const rtoReturns = records.filter(r => r.is_returned && r.return_type === 'RTO_RETURN').length;
  const totalQty = records.reduce((acc, r) => acc + (parseInt(r.quantity, 10) || 1), 0);

  const kpis = [
    { label: 'Total Orders', val: totalOrders, num: true },
    { label: 'Active Orders', val: activeOrders, num: true, highlight: 'active' },
    { label: 'Customer Returns', val: custReturns, num: true, highlight: 'cust' },
    { label: 'RTO Returns', val: rtoReturns, num: true, highlight: 'rto' },
    { label: 'Total Units', val: totalQty, num: true }
  ];

  sheet.getRow(4).height = 20;
  sheet.getRow(5).height = 24;

  kpis.forEach((kpi, i) => {
    const col = i + 1;
    const lblCell = sheet.getCell(4, col);
    lblCell.value = kpi.label;
    lblCell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: '475569' } };
    lblCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.SUMMARY_CARD_BG } };
    lblCell.alignment = { horizontal: 'center', vertical: 'middle' };

    const valCell = sheet.getCell(5, col);
    valCell.value = kpi.val;
    valCell.font = { name: 'Calibri', size: 11, bold: true };
    valCell.alignment = { horizontal: 'center', vertical: 'middle' };
    valCell.numFmt = '#,##0';

    if (kpi.highlight === 'active') {
      valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.ACTIVE_BADGE_BG } };
      valCell.font.color = { argb: COLORS.ACTIVE_BADGE_TEXT };
    } else if (kpi.highlight === 'cust') {
      valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.CUST_BADGE_BG } };
      valCell.font.color = { argb: COLORS.CUST_BADGE_TEXT };
    } else if (kpi.highlight === 'rto') {
      valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.RTO_BADGE_BG } };
      valCell.font.color = { argb: COLORS.RTO_BADGE_TEXT };
    }
  });
  applyBorders(sheet, 4, 5, 1, kpis.length);

  sheet.getRow(6).height = 12;

  // Header Row (Row 7)
  const headerRow = sheet.getRow(7);
  headerRow.height = 30;
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.WHITE_TEXT } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.SLATE_HEADER_BG } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  });

  // Data Rows (Row 8+)
  let startDataRow = 8;
  records.forEach((r, idx) => {
    const rowNum = startDataRow + idx;
    const row = sheet.getRow(rowNum);
    row.height = 22;

    let statusText = 'Active';
    let statusBadge = 'active';

    if (r.is_returned) {
      if (r.return_type === 'RTO_RETURN') {
        statusText = 'RTO Return';
        statusBadge = 'rto';
      } else {
        statusText = 'Customer Return';
        statusBadge = 'cust';
      }
    }

    const values = [
      r.order_id || '',
      r.customer_name || '',
      r.sku_id || '',
      r.product_name || '',
      r.quantity || 1,
      r.purchase_price != null ? Number(r.purchase_price) : 0,
      r.selling_price != null ? Number(r.selling_price) : 0,
      statusText,
      formatDate(r.created_at || r.updated_at)
    ];

    values.forEach((v, cIdx) => {
      const cell = row.getCell(cIdx + 1);
      cell.value = v;
      cell.font = { name: 'Calibri', size: 10 };

      if (cIdx === 0 || cIdx === 2) {
        // Order ID / SKU ID
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { name: 'Calibri', size: 10, bold: true };
      } else if (cIdx === 1 || cIdx === 3) {
        // Product / Customer
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      } else if (cIdx === 4) {
        // Qty
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.numFmt = '#,##0';
      } else if (cIdx === 5 || cIdx === 6) {
        // Financials
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '"₹"#,##0';
      } else if (cIdx === 7) {
        // Status Badge
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { name: 'Calibri', size: 10, bold: true };
        if (statusBadge === 'active') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.ACTIVE_BADGE_BG } };
          cell.font.color = { argb: COLORS.ACTIVE_BADGE_TEXT };
        } else if (statusBadge === 'cust') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.CUST_BADGE_BG } };
          cell.font.color = { argb: COLORS.CUST_BADGE_TEXT };
        } else if (statusBadge === 'rto') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.RTO_BADGE_BG } };
          cell.font.color = { argb: COLORS.RTO_BADGE_TEXT };
        }
      } else if (cIdx === 8) {
        // Date
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    });
  });

  const endDataRow = startDataRow + records.length - 1;
  if (records.length > 0) {
    applyBorders(sheet, 7, endDataRow, 1, headers.length);
  }

  sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 7, topLeftCell: 'A8', activeCell: 'A8' }];
  sheet.autoFilter = { from: { row: 7, column: 1 }, to: { row: Math.max(7, endDataRow), column: headers.length } };
  autoFitColumns(sheet);

  return workbook;
}

// ============================================================================
// 4. MASTER EXCEL GENERATOR (Combined Orders + Stock + Returns in 1 File)
// ============================================================================
export async function generateMasterWorkbook(ordersRecords = [], stockProducts = [], stockSummary = {}, returnRecords = [], returnsSummary = {}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ParcelAI Platform';
  workbook.created = new Date();

  // Create individual workbooks first and copy sheets / construct tabs cleanly
  const stockWb = await generateStockWorkbook(stockProducts, stockSummary);
  const returnsWb = await generateReturnsWorkbook(
    returnRecords,
    returnRecords.filter(r => r.return_type === 'CUSTOMER_RETURN'),
    returnRecords.filter(r => r.return_type === 'RTO_RETURN'),
    returnsSummary
  );
  const ordersWb = await generateOrdersWorkbook(ordersRecords);

  // We build a single workbook with tabs: 1. Orders Ledger, 2. Stock Overview, 3. Returns Overview
  const masterWb = new ExcelJS.Workbook();
  masterWb.creator = 'ParcelAI Platform';
  masterWb.created = new Date();

  // Re-generate sheets into single workbook
  // 1. Orders
  const ordersSheet = masterWb.addWorksheet('Orders Ledger');
  copySheetContent(ordersWb.getWorksheet('Orders Ledger'), ordersSheet);

  // 2. Stock
  const stockSheet = masterWb.addWorksheet('Stock Overview');
  copySheetContent(stockWb.getWorksheet('Stock Overview'), stockSheet);

  // 3. Returns
  const returnsSheet = masterWb.addWorksheet('Returns Overview');
  copySheetContent(returnsWb.getWorksheet('All Returns'), returnsSheet);

  return masterWb;
}

/** Helper: Copy rows, styling, merges, views & autoFilters from one worksheet to another */
function copySheetContent(sourceSheet, targetSheet) {
  if (!sourceSheet || !targetSheet) return;

  sourceSheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    const targetRow = targetSheet.getRow(rowNumber);
    targetRow.height = row.height;

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const targetCell = targetRow.getCell(colNumber);
      targetCell.value = cell.value;
      if (cell.font) targetCell.font = { ...cell.font };
      if (cell.fill) targetCell.fill = { ...cell.fill };
      if (cell.border) targetCell.border = { ...cell.border };
      if (cell.alignment) targetCell.alignment = { ...cell.alignment };
      if (cell.numFmt) targetCell.numFmt = cell.numFmt;
    });
  });

  // Copy merges
  if (sourceSheet.hasMerges) {
    const merges = sourceSheet._merges;
    for (const m in merges) {
      targetSheet.mergeCells(merges[m].range);
    }
  }

  // Copy column widths
  sourceSheet.columns.forEach((col, idx) => {
    if (targetSheet.getColumn(idx + 1)) {
      targetSheet.getColumn(idx + 1).width = col.width;
    }
  });

  // Copy views & autoFilter
  if (sourceSheet.views) targetSheet.views = sourceSheet.views;
  if (sourceSheet.autoFilter) targetSheet.autoFilter = sourceSheet.autoFilter;
}
