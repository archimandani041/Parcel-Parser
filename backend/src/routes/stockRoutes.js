import express from 'express';
import {
  getStockOverview,
  exportStockExcel,
  updateProductPrice,
  getReturnsOverview,
  exportReturnsExcel,
  updateReturnCharge,
  deleteStockProduct,
  deleteStockReturn
} from '../controllers/stockController.js';

const router = express.Router();

// GET /api/stock/export-excel — Stock XLSX Export
router.get('/export-excel', exportStockExcel);

// GET /api/stock/returns/export-excel — Returns XLSX Export
router.get('/returns/export-excel', exportReturnsExcel);

// GET /api/stock — Stock overview grouped by SKU ID
router.get('/', getStockOverview);

// PUT /api/stock/products/:sku_id — Update purchase price & selling price for SKU
router.put('/products/:sku_id', updateProductPrice);
router.post('/products', updateProductPrice);
router.delete('/products/:sku_id', deleteStockProduct);

// GET /api/stock/returns — Returned parcels list and charges
router.get('/returns', getReturnsOverview);

// PUT /api/stock/returns/:order_id — Update delivery boy charge for returned order
router.put('/returns/:order_id', updateReturnCharge);
router.post('/returns', updateReturnCharge);
router.delete('/returns/:order_id', deleteStockReturn);

export default router;
