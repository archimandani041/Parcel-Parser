import { stockService } from '../services/storage/stockService.js';
import { generateStockWorkbook, generateReturnsWorkbook } from '../utils/excelGenerator.js';

/** GET /api/stock */
export async function getStockOverview(req, res, next) {
  try {
    const data = await stockService.getStockOverview();
    res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

/** GET /api/stock/dashboard-stats */
export async function getDashboardStats(req, res, next) {
  try {
    const range = req.query.range || '7';
    const data = await stockService.getDashboardStats(range);
    res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

/** GET /api/stock/export-excel */
export async function exportStockExcel(req, res, next) {
  try {
    const { products, summary } = await stockService.getStockOverview();
    const workbook = await generateStockWorkbook(products || [], summary || {});

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=stock_report_${Date.now()}.xlsx`);
    res.send(Buffer.from(buffer));
  } catch (err) { next(err); }
}

/** GET /api/stock/returns/export-excel */
export async function exportReturnsExcel(req, res, next) {
  try {
    const { returns, customerReturns, rtoReturns, summary } = await stockService.getReturnsOverview();
    const workbook = await generateReturnsWorkbook(returns || [], customerReturns || [], rtoReturns || [], summary || {});

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=returns_report_${Date.now()}.xlsx`);
    res.send(Buffer.from(buffer));
  } catch (err) { next(err); }
}

/** PUT /api/stock/products/:sku_id */
export async function updateProductPrice(req, res, next) {
  try {
    const sku_id = req.params.sku_id || req.body.sku_id;
    const { purchase_price, selling_price, product_name } = req.body;

    if (!sku_id) {
      return res.status(400).json({ success: false, error: 'SKU ID is required' });
    }

    const product = await stockService.updateProductPrice(sku_id, purchase_price, selling_price, product_name);
    res.status(200).json({ success: true, product });
  } catch (err) {
    next(err);
  }
}

/** GET /api/stock/returns */
export async function getReturnsOverview(req, res, next) {
  try {
    const data = await stockService.getReturnsOverview();
    res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/stock/returns/:order_id */
export async function updateReturnCharge(req, res, next) {
  try {
    const order_id = req.params.order_id || req.body.order_id;
    const { delivery_boy_charge, return_type } = req.body;

    if (!order_id) {
      return res.status(400).json({ success: false, error: 'Order ID is required' });
    }

    const returnRec = await stockService.updateReturnCharge(order_id, delivery_boy_charge, return_type);
    res.status(200).json({ success: true, returnRecord: returnRec });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/stock/products/:sku_id */
export async function deleteStockProduct(req, res, next) {
  try {
    const { sku_id } = req.params;
    if (!sku_id) {
      return res.status(400).json({ success: false, error: 'SKU ID is required' });
    }

    const result = await stockService.deleteProduct(sku_id);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/stock/returns/:order_id */
export async function deleteStockReturn(req, res, next) {
  try {
    const { order_id } = req.params;
    if (!order_id) {
      return res.status(400).json({ success: false, error: 'Order ID is required' });
    }

    const result = await stockService.deleteReturn(order_id);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}
