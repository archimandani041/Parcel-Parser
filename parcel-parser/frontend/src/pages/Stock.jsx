import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import {
  getStockOverview,
  exportStockExcel,
  updateStockProductPrice,
  getReturnsOverview,
  exportReturnsExcel,
  updateReturnDeliveryCharge,
  deleteStockProduct,
  deleteStockReturn
} from '../services/api';
import {
  Boxes,
  RotateCcw,
  Package,
  Search,
  RefreshCw,
  Save,
  Check,
  TrendingUp,
  TrendingDown,
  Coins,
  Truck,
  Inbox,
  AlertCircle,
  Trash2,
  Download
} from 'lucide-react';

export default function Stock() {
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' | 'return'
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [exportingStock, setExportingStock] = useState(false);
  const [exportingReturns, setExportingReturns] = useState(false);

  // Stock State
  const [products, setProducts] = useState([]);
  const [stockSummary, setStockSummary] = useState({
    total_products: 0,
    total_quantity: 0,
    total_product_cost: 0,
    total_selling_value: 0,
    total_profit: 0
  });

  // Returns State
  const [returns, setReturns] = useState([]);
  const [returnSummary, setReturnSummary] = useState({
    total_returned_parcels: 0,
    total_returned_quantity: 0,
    total_delivery_boy_charges: 0,
    total_profit_lost_from_returns: 0
  });

  // Editing state maps: { [sku_id]: { purchase_price, selling_price, saving, saved } }
  const [editPriceState, setEditPriceState] = useState({});
  // Editing state maps for returns: { [order_id]: { delivery_boy_charge, saving, saved } }
  const [editChargeState, setEditChargeState] = useState({});

  const loadStockData = useCallback(async () => {
    setLoading(true);
    try {
      const [stockRes, returnRes] = await Promise.all([
        getStockOverview(),
        getReturnsOverview()
      ]);

      if (stockRes?.success) {
        setProducts(stockRes.products || []);
        setStockSummary(stockRes.summary || {});

        // Initialize local edit state for prices
        const priceMap = {};
        (stockRes.products || []).forEach(p => {
          priceMap[p.sku_id] = {
            purchase_price: p.purchase_price != null ? p.purchase_price : '',
            selling_price: p.selling_price != null ? p.selling_price : '',
            saving: false,
            saved: false
          };
        });
        setEditPriceState(priceMap);
      }

      if (returnRes?.success) {
        setReturns(returnRes.returns || []);
        setReturnSummary(returnRes.summary || {});

        // Initialize local edit state for charges
        const chargeMap = {};
        (returnRes.returns || []).forEach(r => {
          chargeMap[r.order_id] = {
            delivery_boy_charge: r.delivery_boy_charge != null ? r.delivery_boy_charge : '0',
            saving: false,
            saved: false
          };
        });
        setEditChargeState(chargeMap);
      }
    } catch (err) {
      console.error('Failed to load stock data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStockData();
  }, [loadStockData]);

  // Handle Save Price for a SKU
  const handleSavePrice = async (skuId, productName) => {
    const currentState = editPriceState[skuId];
    if (!currentState) return;

    setEditPriceState(prev => ({
      ...prev,
      [skuId]: { ...prev[skuId], saving: true, saved: false }
    }));

    try {
      await updateStockProductPrice(
        skuId,
        currentState.purchase_price,
        currentState.selling_price,
        productName
      );

      // Trigger recalculation reload
      const [stockRes, returnRes] = await Promise.all([
        getStockOverview(),
        getReturnsOverview()
      ]);

      if (stockRes?.success) {
        setProducts(stockRes.products || []);
        setStockSummary(stockRes.summary || {});
      }
      if (returnRes?.success) {
        setReturns(returnRes.returns || []);
        setReturnSummary(returnRes.summary || {});
      }

      setEditPriceState(prev => ({
        ...prev,
        [skuId]: { ...prev[skuId], saving: false, saved: true }
      }));

      setTimeout(() => {
        setEditPriceState(prev => ({
          ...prev,
          [skuId]: { ...prev[skuId], saved: false }
        }));
      }, 2000);
    } catch (err) {
      alert('Failed to save prices: ' + (err.response?.data?.error || err.message));
      setEditPriceState(prev => ({
        ...prev,
        [skuId]: { ...prev[skuId], saving: false }
      }));
    }
  };

  // Handle Save Delivery Charge for a returned order
  const handleSaveCharge = async (orderId) => {
    const currentState = editChargeState[orderId];
    if (!currentState) return;

    setEditChargeState(prev => ({
      ...prev,
      [orderId]: { ...prev[orderId], saving: true, saved: false }
    }));

    try {
      await updateReturnDeliveryCharge(orderId, currentState.delivery_boy_charge);

      // Trigger recalculation reload
      const [stockRes, returnRes] = await Promise.all([
        getStockOverview(),
        getReturnsOverview()
      ]);

      if (stockRes?.success) {
        setProducts(stockRes.products || []);
        setStockSummary(stockRes.summary || {});
      }
      if (returnRes?.success) {
        setReturns(returnRes.returns || []);
        setReturnSummary(returnRes.summary || {});
      }

      setEditChargeState(prev => ({
        ...prev,
        [orderId]: { ...prev[orderId], saving: false, saved: true }
      }));

      setTimeout(() => {
        setEditChargeState(prev => ({
          ...prev,
          [orderId]: { ...prev[orderId], saved: false }
        }));
      }, 2000);
    } catch (err) {
      alert('Failed to save return delivery charge: ' + (err.response?.data?.error || err.message));
      setEditChargeState(prev => ({
        ...prev,
        [orderId]: { ...prev[orderId], saving: false }
      }));
    }
  };

  // Handle Delete Stock Product
  const handleDeleteStockProduct = async (skuId) => {
    if (!window.confirm(`Are you sure you want to delete product SKU "${skuId}" and all associated order records from database?`)) {
      return;
    }
    try {
      await deleteStockProduct(skuId);
      await loadStockData();
    } catch (err) {
      alert('Failed to delete stock product: ' + (err.response?.data?.error || err.message));
    }
  };

  // Handle Delete Return Record
  const handleDeleteStockReturn = async (orderId) => {
    if (!window.confirm(`Are you sure you want to delete returned order "${orderId}" from database?`)) {
      return;
    }
    try {
      await deleteStockReturn(orderId);
      await loadStockData();
    } catch (err) {
      alert('Failed to delete return record: ' + (err.response?.data?.error || err.message));
    }
  };

  // Handle Excel Exports
  const handleExportStock = async () => {
    setExportingStock(true);
    try {
      const response = await exportStockExcel();
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stock_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Stock Export failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setExportingStock(false);
    }
  };

  const handleExportReturns = async () => {
    setExportingReturns(true);
    try {
      const response = await exportReturnsExcel();
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `returns_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Returns Export failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setExportingReturns(false);
    }
  };

  // Helper currency formatter
  const formatCurrency = (val) => {
    if (val == null || isNaN(val)) return '-';
    const num = Number(val);
    const isNeg = num < 0;
    const formatted = Math.abs(num).toLocaleString('en-IN');
    return isNeg ? `-₹${formatted}` : `₹${formatted}`;
  };

  // Filtered lists based on search query
  const filteredProducts = products.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.sku_id && p.sku_id.toLowerCase().includes(q)) ||
      (p.product_name && p.product_name.toLowerCase().includes(q))
    );
  });

  const filteredReturns = returns.filter(r => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (r.order_id && r.order_id.toLowerCase().includes(q)) ||
      (r.sku_id && r.sku_id.toLowerCase().includes(q)) ||
      (r.product_name && r.product_name.toLowerCase().includes(q))
    );
  });

  return (
    <Layout title="Stock Management">
      <div className="space-y-6 pb-12">

        {/* Top Header & Navigation Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Boxes className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-tight">Stock</h1>
              <p className="text-xs text-slate-400">Manage product stock, prices and profitability</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="search-stock-input"
                type="text"
                placeholder={activeTab === 'stock' ? "Search SKU or Product" : "Search Order ID or SKU"}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-all w-64"
              />
            </div>

            {/* Refresh Button */}
            <button
              onClick={loadStockData}
              disabled={loading}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700 transition-all disabled:opacity-50"
              title="Refresh stock data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Dynamic Export Excel Button for active tab */}
            {activeTab === 'stock' ? (
              <button
                id="export-stock-excel-btn"
                onClick={handleExportStock}
                disabled={exportingStock}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                {exportingStock ? 'Exporting...' : 'Export Stock Excel'}
              </button>
            ) : (
              <button
                id="export-return-excel-btn"
                onClick={handleExportReturns}
                disabled={exportingReturns}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-amber-600/20 disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                {exportingReturns ? 'Exporting...' : 'Export Return Excel'}
              </button>
            )}

            {/* Tab Buttons [ Stock ] [ Return ] */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 shadow-inner">
              <button
                id="stock-tab-btn"
                onClick={() => setActiveTab('stock')}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                  activeTab === 'stock'
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Boxes className="w-4 h-4" />
                Stock
              </button>

              <button
                id="return-tab-btn"
                onClick={() => setActiveTab('return')}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                  activeTab === 'return'
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                Return
              </button>
            </div>
          </div>
        </div>

        {/* SUMMARY CARDS (DYNAMIC BASED ON TAB) */}
        {activeTab === 'stock' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Total Products */}
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
                <span>Total Products</span>
                <Boxes className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-xl font-extrabold text-white font-mono">
                {stockSummary.total_products || 0}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Unique SKU records</p>
            </div>

            {/* Total Quantity */}
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
                <span>Total Quantity</span>
                <Package className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-xl font-extrabold text-sky-300 font-mono">
                {stockSummary.total_quantity || 0}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Items across orders</p>
            </div>

            {/* Total Product Cost */}
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
                <span>Total Product Cost</span>
                <Coins className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-xl font-extrabold text-amber-300 font-mono">
                {formatCurrency(stockSummary.total_product_cost)}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Purchase cost value</p>
            </div>

            {/* Total Selling Value */}
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
                <span>Total Selling Value</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xl font-extrabold text-emerald-300 font-mono">
                {formatCurrency(stockSummary.total_selling_value)}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Gross revenue potential</p>
            </div>

            {/* Total Profit */}
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-xl col-span-2 md:col-span-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
                <span>Total Profit</span>
                <TrendingUp className={`w-4 h-4 ${stockSummary.total_profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`} />
              </div>
              <p className={`text-xl font-extrabold font-mono ${stockSummary.total_profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCurrency(stockSummary.total_profit)}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Net after return charges</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Total Returned Parcels */}
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
                <span>Returned Parcels</span>
                <RotateCcw className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-xl font-extrabold text-rose-300 font-mono">
                {returnSummary.total_returned_parcels || 0}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Orders marked returned</p>
            </div>

            {/* Total Returned Quantity */}
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
                <span>Returned Qty</span>
                <Package className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-xl font-extrabold text-amber-300 font-mono">
                {returnSummary.total_returned_quantity || 0}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Total items returned</p>
            </div>

            {/* Total Delivery Charges */}
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
                <span>Delivery Boy Charges</span>
                <Truck className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-xl font-extrabold text-sky-300 font-mono">
                {formatCurrency(returnSummary.total_delivery_boy_charges)}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Paid on return shipping</p>
            </div>

            {/* Total Profit Lost */}
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
                <span>Profit Reduction</span>
                <TrendingDown className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-xl font-extrabold text-rose-400 font-mono">
                -{formatCurrency(returnSummary.total_profit_lost_from_returns)}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Deducted from stock profit</p>
            </div>
          </div>
        )}

        {/* MAIN DATA TABLES */}
        {activeTab === 'stock' ? (
          /* STOCK TABLE */
          <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl">
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-400" />
                <p className="text-xs text-slate-400 font-mono">Loading stock records...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <Inbox className="w-12 h-12 text-slate-600 mx-auto" />
                <h4 className="font-bold text-slate-300">No stock products found</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {searchQuery
                    ? `No products match "${searchQuery}"`
                    : 'Order records will automatically aggregate into stock products here.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" id="stock-table">
                  <thead>
                    <tr className="bg-slate-950 border-b-2 border-slate-700">
                      <th className="py-3 px-4 text-[11px] font-extrabold text-slate-300 uppercase tracking-wider border-r border-slate-800/60">SKU ID</th>
                      <th className="py-3 px-4 text-[11px] font-extrabold text-slate-300 uppercase tracking-wider border-r border-slate-800/60">Product Name</th>
                      <th className="py-3 px-4 text-[11px] font-extrabold text-slate-300 uppercase tracking-wider border-r border-slate-800/60 text-center">Total Qty</th>
                      <th className="py-3 px-4 text-[11px] font-extrabold text-slate-300 uppercase tracking-wider border-r border-slate-800/60 text-center">Returned Qty</th>
                      <th className="py-3 px-4 text-[11px] font-extrabold text-slate-300 uppercase tracking-wider border-r border-slate-800/60 text-center">Available Qty</th>
                      <th className="py-3 px-4 text-[11px] font-extrabold text-slate-300 uppercase tracking-wider border-r border-slate-800/60 text-center">Purchase Price</th>
                      <th className="py-3 px-4 text-[11px] font-extrabold text-slate-300 uppercase tracking-wider border-r border-slate-800/60 text-center">Selling Price</th>
                      <th className="py-3 px-4 text-[11px] font-extrabold text-slate-300 uppercase tracking-wider border-r border-slate-800/60 text-right">Product Cost</th>
                      <th className="py-3 px-4 text-[11px] font-extrabold text-slate-300 uppercase tracking-wider border-r border-slate-800/60 text-right">Selling Value</th>
                      <th className="py-3 px-4 text-[11px] font-extrabold text-slate-300 uppercase tracking-wider border-r border-slate-800/60 text-right">Total Profit</th>
                      <th className="py-3 px-4 text-[11px] font-extrabold text-slate-300 uppercase tracking-wider text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p, idx) => {
                      const editState = editPriceState[p.sku_id] || {
                        purchase_price: p.purchase_price != null ? p.purchase_price : '',
                        selling_price: p.selling_price != null ? p.selling_price : '',
                        saving: false,
                        saved: false
                      };

                      return (
                        <tr
                          key={p.sku_id}
                          className={`border-b border-slate-800/50 transition-colors ${
                            idx % 2 === 0 ? 'bg-slate-900/80' : 'bg-slate-950/60'
                          } hover:bg-indigo-500/5`}
                        >
                          {/* SKU ID */}
                          <td className="py-3 px-4 border-r border-slate-800/40">
                            <span className="font-mono text-xs font-bold text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20">
                              {p.sku_id}
                            </span>
                          </td>

                          {/* Product Name */}
                          <td className="py-3 px-4 border-r border-slate-800/40">
                            <span className="text-xs text-slate-200 font-medium line-clamp-2">
                              {p.product_name || '-'}
                            </span>
                          </td>

                          {/* Total Quantity */}
                          <td className="py-3 px-4 border-r border-slate-800/40 text-center">
                            <span className="font-mono text-xs text-slate-200 font-bold">
                              {p.total_quantity}
                            </span>
                          </td>

                          {/* Returned Quantity */}
                          <td className="py-3 px-4 border-r border-slate-800/40 text-center">
                            {p.returned_quantity > 0 ? (
                              <span className="font-mono text-xs text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                                {p.returned_quantity}
                              </span>
                            ) : (
                              <span className="font-mono text-xs text-slate-500">0</span>
                            )}
                          </td>

                          {/* Available Quantity */}
                          <td className="py-3 px-4 border-r border-slate-800/40 text-center">
                            <span className="font-mono text-xs text-emerald-300 font-bold">
                              {p.available_quantity}
                            </span>
                          </td>

                          {/* Purchase Price Input */}
                          <td className="py-2 px-3 border-r border-slate-800/40 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <span className="text-slate-500 text-xs font-mono">₹</span>
                              <input
                                type="number"
                                step="any"
                                placeholder="0"
                                value={editState.purchase_price}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setEditPriceState(prev => ({
                                    ...prev,
                                    [p.sku_id]: { ...prev[p.sku_id], purchase_price: val }
                                  }));
                                }}
                                className="w-20 bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-lg px-2 py-1 text-xs text-right font-mono text-slate-200 outline-none transition-all"
                              />
                            </div>
                          </td>

                          {/* Selling Price Input & Save */}
                          <td className="py-2 px-3 border-r border-slate-800/40 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="text-slate-500 text-xs font-mono">₹</span>
                              <input
                                type="number"
                                step="any"
                                placeholder="0"
                                value={editState.selling_price}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setEditPriceState(prev => ({
                                    ...prev,
                                    [p.sku_id]: { ...prev[p.sku_id], selling_price: val }
                                  }));
                                }}
                                className="w-20 bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-lg px-2 py-1 text-xs text-right font-mono text-slate-200 outline-none transition-all"
                              />
                              <button
                                onClick={() => handleSavePrice(p.sku_id, p.product_name)}
                                disabled={editState.saving}
                                title="Save price for SKU"
                                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                  editState.saved
                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500/40 shadow-sm'
                                } disabled:opacity-50`}
                              >
                                {editState.saved ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : editState.saving ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Save className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Product Cost */}
                          <td className="py-3 px-4 border-r border-slate-800/40 text-right">
                            <span className="font-mono text-xs text-amber-300 font-semibold">
                              {formatCurrency(p.product_cost)}
                            </span>
                          </td>

                          {/* Selling Value */}
                          <td className="py-3 px-4 border-r border-slate-800/40 text-right">
                            <span className="font-mono text-xs text-emerald-300 font-semibold">
                              {formatCurrency(p.selling_value)}
                            </span>
                          </td>

                          {/* Profit */}
                          <td className="py-3 px-4 border-r border-slate-800/40 text-right">
                            <span className={`font-mono text-xs font-bold px-2 py-1 rounded-md border ${
                              p.profit == null
                                ? 'text-slate-500 border-transparent'
                                : p.profit >= 0
                                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                            }`}>
                              {formatCurrency(p.profit)}
                            </span>
                          </td>

                          {/* Action Delete */}
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleDeleteStockProduct(p.sku_id)}
                              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-all cursor-pointer"
                              title="Delete stock product and orders from database"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* RETURN TABLE */
          <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl">
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-400" />
                <p className="text-xs text-slate-400 font-mono">Loading return records...</p>
              </div>
            ) : filteredReturns.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <Inbox className="w-12 h-12 text-slate-600 mx-auto" />
                <h4 className="font-bold text-slate-300">No returned parcels found</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {searchQuery
                    ? `No returned orders match "${searchQuery}"`
                    : 'Mark an order as Returned on the Orders page to manage its charges here.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" id="return-table">
                  <thead>
                    <tr className="bg-slate-950 border-b-2 border-slate-700">
                      <th className="py-3 px-4 text-[11px] font-extrabold text-slate-300 uppercase tracking-wider border-r border-slate-800/60">Order ID</th>
                      <th className="py-3 px-4 text-[11px] font-extrabold text-slate-300 uppercase tracking-wider border-r border-slate-800/60">SKU ID</th>
                      <th className="py-3 px-4 text-[11px] font-extrabold text-slate-300 uppercase tracking-wider border-r border-slate-800/60">Product Name</th>
                      <th className="py-3 px-4 text-[11px] font-extrabold text-slate-300 uppercase tracking-wider border-r border-slate-800/60 text-center">Quantity</th>
                      <th className="py-3 px-4 text-[11px] font-extrabold text-slate-300 uppercase tracking-wider border-r border-slate-800/60 text-right">Purchase Price</th>
                      <th className="py-3 px-4 text-[11px] font-extrabold text-slate-300 uppercase tracking-wider border-r border-slate-800/60 text-right">Selling Price</th>
                      <th className="py-3 px-4 text-[11px] font-extrabold text-slate-300 uppercase tracking-wider border-r border-slate-800/60 text-center">Delivery Boy Charge</th>
                      <th className="py-3 px-4 text-[11px] font-extrabold text-slate-300 uppercase tracking-wider border-r border-slate-800/60 text-right">Profit After Return</th>
                      <th className="py-3 px-4 text-[11px] font-extrabold text-slate-300 uppercase tracking-wider border-r border-slate-800/60 text-center">Return Date</th>
                      <th className="py-3 px-4 text-[11px] font-extrabold text-slate-300 uppercase tracking-wider text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReturns.map((r, idx) => {
                      const editState = editChargeState[r.order_id] || {
                        delivery_boy_charge: r.delivery_boy_charge != null ? r.delivery_boy_charge : '0',
                        saving: false,
                        saved: false
                      };

                      return (
                        <tr
                          key={r.order_id}
                          className={`border-b border-slate-800/50 transition-colors ${
                            idx % 2 === 0 ? 'bg-slate-900/80' : 'bg-slate-950/60'
                          } hover:bg-rose-500/5`}
                        >
                          {/* Order ID */}
                          <td className="py-3 px-4 border-r border-slate-800/40">
                            <span className="font-mono text-xs font-bold text-indigo-300 select-all">
                              {r.order_id}
                            </span>
                          </td>

                          {/* SKU ID */}
                          <td className="py-3 px-4 border-r border-slate-800/40">
                            <span className="font-mono text-xs text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                              {r.sku_id}
                            </span>
                          </td>

                          {/* Product Name */}
                          <td className="py-3 px-4 border-r border-slate-800/40">
                            <span className="text-xs text-slate-200 font-medium">
                              {r.product_name || '-'}
                            </span>
                          </td>

                          {/* Quantity */}
                          <td className="py-3 px-4 border-r border-slate-800/40 text-center">
                            <span className="font-mono text-xs text-slate-200 font-bold">
                              {r.quantity}
                            </span>
                          </td>

                          {/* Purchase Price */}
                          <td className="py-3 px-4 border-r border-slate-800/40 text-right">
                            <span className="font-mono text-xs text-slate-400">
                              {formatCurrency(r.purchase_price)}
                            </span>
                          </td>

                          {/* Selling Price */}
                          <td className="py-3 px-4 border-r border-slate-800/40 text-right">
                            <span className="font-mono text-xs text-slate-200">
                              {formatCurrency(r.selling_price)}
                            </span>
                          </td>

                          {/* Delivery Boy Charge Input */}
                          <td className="py-2 px-3 border-r border-slate-800/40 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="text-slate-500 text-xs font-mono">₹</span>
                              <input
                                type="number"
                                step="any"
                                placeholder="0"
                                value={editState.delivery_boy_charge}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setEditChargeState(prev => ({
                                    ...prev,
                                    [r.order_id]: { ...prev[r.order_id], delivery_boy_charge: val }
                                  }));
                                }}
                                className="w-20 bg-slate-950 border border-slate-700 focus:border-rose-500 rounded-lg px-2 py-1 text-xs text-right font-mono text-rose-300 outline-none transition-all"
                              />
                              <button
                                onClick={() => handleSaveCharge(r.order_id)}
                                disabled={editState.saving}
                                title="Save Delivery Boy Charge"
                                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                  editState.saved
                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                    : 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500/40 shadow-sm'
                                } disabled:opacity-50`}
                              >
                                {editState.saved ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : editState.saving ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Save className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Profit After Return */}
                          <td className="py-3 px-4 border-r border-slate-800/40 text-right">
                            <span className={`font-mono text-xs font-bold px-2 py-1 rounded-md border ${
                              r.profit_after_return == null
                                ? 'text-slate-500 border-transparent'
                                : r.profit_after_return >= 0
                                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                            }`}>
                              {formatCurrency(r.profit_after_return)}
                            </span>
                          </td>

                          {/* Return Date */}
                          <td className="py-3 px-4 border-r border-slate-800/40 text-center">
                            <span className="text-[11px] font-mono text-slate-400">
                              {r.return_date ? new Date(r.return_date).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              }) : '-'}
                            </span>
                          </td>

                          {/* Action Delete */}
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleDeleteStockReturn(r.order_id)}
                              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-all cursor-pointer"
                              title="Delete return record from database"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </Layout>
  );
}
