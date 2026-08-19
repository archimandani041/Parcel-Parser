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
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 shadow-sm shrink-0">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Inventory & stock <span className="font-serif-italic font-normal text-purple-700">auditing</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Manage SKU valuation, unit prices, and return logistics loss</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="search-stock-input"
                type="text"
                placeholder={activeTab === 'stock' ? "Search SKU or Product..." : "Search Order ID or SKU..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-purple-50/40 border border-purple-200/80 rounded-full pl-9 pr-4 py-2.5 text-xs text-slate-800 placeholder-purple-300 outline-none focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-200 transition-all w-64 shadow-xs font-medium"
              />
            </div>

            {/* Refresh Button */}
            <button
              onClick={loadStockData}
              disabled={loading}
              className="p-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-full border border-purple-200/80 transition-all shadow-xs disabled:opacity-50"
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
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-100/90 hover:bg-emerald-200 text-emerald-950 font-extrabold text-xs rounded-full border border-emerald-300 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                {exportingStock ? 'Exporting...' : 'Export Stock Excel'}
              </button>
            ) : (
              <button
                id="export-return-excel-btn"
                onClick={handleExportReturns}
                disabled={exportingReturns}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-100/90 hover:bg-amber-200 text-amber-950 font-extrabold text-xs rounded-full border border-amber-300 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-700" />
                {exportingReturns ? 'Exporting...' : 'Export Return Excel'}
              </button>
            )}

            {/* Tab Buttons [ Stock ] [ Return ] Capsule */}
            <div className="bg-purple-100/60 p-1 rounded-full border border-purple-200/80 flex items-center gap-1 shadow-inner">
              <button
                id="stock-tab-btn"
                onClick={() => setActiveTab('stock')}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                  activeTab === 'stock'
                    ? 'bg-purple-200/90 text-purple-950 border border-purple-300 shadow-xs'
                    : 'text-purple-800/80 hover:text-purple-950 hover:bg-white/60'
                }`}
              >
                <Boxes className="w-3.5 h-3.5 text-purple-700" />
                Stock
              </button>

              <button
                id="return-tab-btn"
                onClick={() => setActiveTab('return')}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                  activeTab === 'return'
                    ? 'bg-purple-200/90 text-purple-950 border border-purple-300 shadow-xs'
                    : 'text-purple-800/80 hover:text-purple-950 hover:bg-white/60'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5 text-purple-700" />
                Return
              </button>
            </div>
          </div>
        </div>

        {/* SUMMARY CARDS (DYNAMIC BASED ON TAB) */}
        {activeTab === 'stock' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Total Products */}
            <div className="ui-card p-4 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-extrabold">
                <span>Total Products</span>
                <Boxes className="w-4 h-4 text-sky-600" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 font-mono">
                {stockSummary.total_products || 0}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">Unique SKU records</p>
            </div>

            {/* Total Quantity */}
            <div className="ui-card p-4 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-extrabold">
                <span>Total Quantity</span>
                <Package className="w-4 h-4 text-sky-600" />
              </div>
              <p className="text-2xl font-extrabold text-sky-700 font-mono">
                {stockSummary.total_quantity || 0}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">Items across orders</p>
            </div>

            {/* Total Product Cost */}
            <div className="ui-card p-4 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-extrabold">
                <span>Total Product Cost</span>
                <Coins className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-extrabold text-amber-700 font-mono">
                {formatCurrency(stockSummary.total_product_cost)}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">Purchase cost value</p>
            </div>

            {/* Total Selling Value */}
            <div className="ui-card p-4 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-extrabold">
                <span>Total Selling Value</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-extrabold text-emerald-700 font-mono">
                {formatCurrency(stockSummary.total_selling_value)}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">Gross revenue potential</p>
            </div>

            {/* Total Profit */}
            <div className="ui-card p-4 space-y-1 col-span-2 md:col-span-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-extrabold">
                <span>Total Profit</span>
                <TrendingUp className={`w-4 h-4 ${stockSummary.total_profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
              </div>
              <p className={`text-2xl font-extrabold font-mono ${stockSummary.total_profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(stockSummary.total_profit)}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">Net after return charges</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Returned Parcels */}
            <div className="ui-card p-4 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-extrabold">
                <span>Returned Parcels</span>
                <RotateCcw className="w-4 h-4 text-rose-600" />
              </div>
              <p className="text-2xl font-extrabold text-rose-700 font-mono">
                {returnSummary.total_returned_parcels || 0}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">Orders marked returned</p>
            </div>

            {/* Total Returned Quantity */}
            <div className="ui-card p-4 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-extrabold">
                <span>Returned Qty</span>
                <Package className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-extrabold text-amber-700 font-mono">
                {returnSummary.total_returned_quantity || 0}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">Total items returned</p>
            </div>

            {/* Total Delivery Charges */}
            <div className="ui-card p-4 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-extrabold">
                <span>Delivery Boy Charges</span>
                <Truck className="w-4 h-4 text-sky-600" />
              </div>
              <p className="text-2xl font-extrabold text-sky-700 font-mono">
                {formatCurrency(returnSummary.total_delivery_boy_charges)}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">Paid on return shipping</p>
            </div>

            {/* Total Profit Lost */}
            <div className="ui-card p-4 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-extrabold">
                <span>Profit Reduction</span>
                <TrendingDown className="w-4 h-4 text-rose-600" />
              </div>
              <p className="text-2xl font-extrabold text-rose-600 font-mono">
                -{formatCurrency(returnSummary.total_profit_lost_from_returns)}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">Deducted from stock profit</p>
            </div>
          </div>
        )}

        {/* MAIN DATA TABLES */}
        {activeTab === 'stock' ? (
          /* STOCK TABLE */
          <div className="ui-card overflow-hidden shadow-xl border border-slate-200/80 rounded-3xl">
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-600" />
                <p className="text-xs text-slate-500 font-mono font-medium">Loading stock records...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-20 text-center space-y-3 bg-slate-50/50">
                <Inbox className="w-12 h-12 text-slate-400 mx-auto" />
                <h4 className="font-extrabold text-slate-800 text-base">No stock products found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                  {searchQuery
                    ? `No products match "${searchQuery}"`
                    : 'Order records will automatically aggregate into stock products here.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto bg-white">
                <table className="w-full text-left border-collapse text-xs" id="stock-table">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[11px]">
                      <th className="py-4 px-4 border-r border-slate-100">SKU ID</th>
                      <th className="py-4 px-4 border-r border-slate-100">Product Name</th>
                      <th className="py-4 px-4 border-r border-slate-100 text-center">Total Qty</th>
                      <th className="py-4 px-4 border-r border-slate-100 text-center">Returned Qty</th>
                      <th className="py-4 px-4 border-r border-slate-100 text-center">Available Qty</th>
                      <th className="py-4 px-4 border-r border-slate-100 text-center">Purchase Price</th>
                      <th className="py-4 px-4 border-r border-slate-100 text-center">Selling Price</th>
                      <th className="py-4 px-4 border-r border-slate-100 text-right">Product Cost</th>
                      <th className="py-4 px-4 border-r border-slate-100 text-right">Selling Value</th>
                      <th className="py-4 px-4 border-r border-slate-100 text-right">Total Profit</th>
                      <th className="py-4 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
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
                          className="hover:bg-sky-50/50 transition-colors"
                        >
                          {/* SKU ID */}
                          <td className="py-3.5 px-4 border-r border-slate-100">
                            <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
                              {p.sku_id}
                            </span>
                          </td>

                          {/* Product Name */}
                          <td className="py-3.5 px-4 border-r border-slate-100">
                            <span className="text-xs text-slate-800 font-semibold line-clamp-2">
                              {p.product_name || '-'}
                            </span>
                          </td>

                          {/* Total Quantity */}
                          <td className="py-3.5 px-4 border-r border-slate-100 text-center">
                            <span className="font-mono text-xs text-slate-800 font-extrabold">
                              {p.total_quantity}
                            </span>
                          </td>

                          {/* Returned Quantity */}
                          <td className="py-3.5 px-4 border-r border-slate-100 text-center">
                            {p.returned_quantity > 0 ? (
                              <span className="font-mono text-xs text-rose-700 font-bold bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                                {p.returned_quantity}
                              </span>
                            ) : (
                              <span className="font-mono text-xs text-slate-400">0</span>
                            )}
                          </td>

                          {/* Available Quantity */}
                          <td className="py-3.5 px-4 border-r border-slate-100 text-center">
                            <span className="font-mono text-xs text-emerald-700 font-extrabold">
                              {p.available_quantity}
                            </span>
                          </td>

                          {/* Purchase Price Input */}
                          <td className="py-2 px-3 border-r border-slate-100 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <span className="text-slate-400 text-xs font-mono">₹</span>
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
                                className="w-20 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-lg px-2 py-1 text-xs text-right font-mono text-slate-800 outline-none transition-all"
                              />
                            </div>
                          </td>

                          {/* Selling Price Input & Save */}
                          <td className="py-2 px-3 border-r border-slate-100 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="text-slate-400 text-xs font-mono">₹</span>
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
                                className="w-20 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-lg px-2 py-1 text-xs text-right font-mono text-slate-800 outline-none transition-all"
                              />
                              <button
                                onClick={() => handleSavePrice(p.sku_id, p.product_name)}
                                disabled={editState.saving}
                                title="Save price for SKU"
                                className={`p-1.5 rounded-full border transition-all cursor-pointer ${
                                  editState.saved
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : 'bg-purple-100 hover:bg-purple-200 text-purple-900 border-purple-300 shadow-xs'
                                } disabled:opacity-50`}
                              >
                                {editState.saved ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : editState.saving ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-700" />
                                ) : (
                                  <Save className="w-3.5 h-3.5 text-purple-700" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Product Cost */}
                          <td className="py-3.5 px-4 border-r border-slate-100 text-right">
                            <span className="font-mono text-xs text-amber-700 font-extrabold">
                              {formatCurrency(p.product_cost)}
                            </span>
                          </td>

                          {/* Selling Value */}
                          <td className="py-3.5 px-4 border-r border-slate-100 text-right">
                            <span className="font-mono text-xs text-emerald-700 font-extrabold">
                              {formatCurrency(p.selling_value)}
                            </span>
                          </td>

                          {/* Profit */}
                          <td className="py-3.5 px-4 border-r border-slate-100 text-right">
                            <span className={`font-mono text-xs font-extrabold px-2.5 py-1 rounded-full border ${
                              p.profit == null
                                ? 'text-slate-400 border-transparent'
                                : p.profit >= 0
                                ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                                : 'text-rose-800 bg-rose-50 border-rose-200'
                            }`}>
                              {formatCurrency(p.profit)}
                            </span>
                          </td>

                          {/* Action Delete */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleDeleteStockProduct(p.sku_id)}
                              className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
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
          <div className="ui-card overflow-hidden shadow-xl border border-slate-200/80 rounded-3xl">
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-600" />
                <p className="text-xs text-slate-500 font-mono font-medium">Loading return records...</p>
              </div>
            ) : filteredReturns.length === 0 ? (
              <div className="py-20 text-center space-y-3 bg-slate-50/50">
                <Inbox className="w-12 h-12 text-slate-400 mx-auto" />
                <h4 className="font-extrabold text-slate-800 text-base">No returned parcels found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                  {searchQuery
                    ? `No returned orders match "${searchQuery}"`
                    : 'Mark an order as Returned on the Orders page to manage its charges here.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto bg-white">
                <table className="w-full text-left border-collapse text-xs" id="return-table">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[11px]">
                      <th className="py-4 px-4 border-r border-slate-100">Order ID</th>
                      <th className="py-4 px-4 border-r border-slate-100">SKU ID</th>
                      <th className="py-4 px-4 border-r border-slate-100">Product Name</th>
                      <th className="py-4 px-4 border-r border-slate-100 text-center">Quantity</th>
                      <th className="py-4 px-4 border-r border-slate-100 text-right">Purchase Price</th>
                      <th className="py-4 px-4 border-r border-slate-100 text-right">Selling Price</th>
                      <th className="py-4 px-4 border-r border-slate-100 text-center">Delivery Charge</th>
                      <th className="py-4 px-4 border-r border-slate-100 text-right">Profit After Return</th>
                      <th className="py-4 px-4 border-r border-slate-100 text-center">Return Date</th>
                      <th className="py-4 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredReturns.map((r, idx) => {
                      const editState = editChargeState[r.order_id] || {
                        delivery_boy_charge: r.delivery_boy_charge != null ? r.delivery_boy_charge : '0',
                        saving: false,
                        saved: false
                      };

                      return (
                        <tr
                          key={r.order_id}
                          className="hover:bg-rose-50/40 transition-colors"
                        >
                          {/* Order ID */}
                          <td className="py-3.5 px-4 border-r border-slate-100">
                            <span className="font-mono text-xs font-bold text-sky-700 select-all">
                              {r.order_id}
                            </span>
                          </td>

                          {/* SKU ID */}
                          <td className="py-3.5 px-4 border-r border-slate-100">
                            <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 font-semibold">
                              {r.sku_id}
                            </span>
                          </td>

                          {/* Product Name */}
                          <td className="py-3.5 px-4 border-r border-slate-100">
                            <span className="text-xs text-slate-800 font-semibold">
                              {r.product_name || '-'}
                            </span>
                          </td>

                          {/* Quantity */}
                          <td className="py-3.5 px-4 border-r border-slate-100 text-center">
                            <span className="font-mono text-xs text-slate-800 font-extrabold">
                              {r.quantity}
                            </span>
                          </td>

                          {/* Purchase Price */}
                          <td className="py-3.5 px-4 border-r border-slate-100 text-right">
                            <span className="font-mono text-xs text-slate-500 font-semibold">
                              {formatCurrency(r.purchase_price)}
                            </span>
                          </td>

                          {/* Selling Price */}
                          <td className="py-3.5 px-4 border-r border-slate-100 text-right">
                            <span className="font-mono text-xs text-slate-700 font-semibold">
                              {formatCurrency(r.selling_price)}
                            </span>
                          </td>

                          {/* Delivery Boy Charge Input */}
                          <td className="py-2 px-3 border-r border-slate-100 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="text-slate-400 text-xs font-mono">₹</span>
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
                                className="w-20 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-lg px-2 py-1 text-xs text-right font-mono text-rose-700 font-bold outline-none transition-all"
                              />
                              <button
                                onClick={() => handleSaveCharge(r.order_id)}
                                disabled={editState.saving}
                                title="Save Delivery Boy Charge"
                                className={`p-1.5 rounded-full border transition-all cursor-pointer ${
                                  editState.saved
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : 'bg-rose-100 hover:bg-rose-200 text-rose-950 border-rose-300 shadow-xs'
                                } disabled:opacity-50`}
                              >
                                {editState.saved ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : editState.saving ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-700" />
                                ) : (
                                  <Save className="w-3.5 h-3.5 text-rose-700" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Profit After Return */}
                          <td className="py-3.5 px-4 border-r border-slate-100 text-right">
                            <span className={`font-mono text-xs font-extrabold px-2.5 py-1 rounded-full border ${
                              r.profit_after_return == null
                                ? 'text-slate-400 border-transparent'
                                : r.profit_after_return >= 0
                                ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                                : 'text-rose-800 bg-rose-50 border-rose-200'
                            }`}>
                              {formatCurrency(r.profit_after_return)}
                            </span>
                          </td>

                          {/* Return Date */}
                          <td className="py-3.5 px-4 border-r border-slate-100 text-center">
                            <span className="text-[11px] font-mono text-slate-500 font-semibold">
                              {r.return_date ? new Date(r.return_date).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              }) : '-'}
                            </span>
                          </td>

                          {/* Action Delete */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleDeleteStockReturn(r.order_id)}
                              className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
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

