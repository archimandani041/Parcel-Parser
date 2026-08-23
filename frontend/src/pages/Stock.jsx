import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import {
  getStockOverview,
  updateStockProductPrice,
  deleteStockProduct
} from '../services/api';
import {
  Boxes,
  Package,
  Search,
  RefreshCw,
  Save,
  Check,
  TrendingUp,
  Coins,
  Inbox,
  Trash2
} from 'lucide-react';

export default function Stock() {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Stock State
  const [products, setProducts] = useState([]);
  const [stockSummary, setStockSummary] = useState({
    total_products: 0,
    total_quantity: 0,
    total_available_quantity: 0,
    total_returned_quantity: 0,
    total_inventory_cost: 0,
    total_inventory_value: 0,
    total_realized_sales_profit: 0,
    total_return_loss: 0,
    total_net_profit: 0
  });

  // Editing state map: { [sku_id]: { purchase_price, selling_price, saving, saved } }
  const [editPriceState, setEditPriceState] = useState({});

  const loadStockData = useCallback(async () => {
    setLoading(true);
    try {
      const stockRes = await getStockOverview();

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

      setEditPriceState(prev => ({
        ...prev,
        [skuId]: { ...prev[skuId], saving: false, saved: true }
      }));

      // Reload fresh calculations
      await loadStockData();
    } catch (err) {
      alert('Failed to save prices: ' + (err.response?.data?.error || err.message));
      setEditPriceState(prev => ({
        ...prev,
        [skuId]: { ...prev[skuId], saving: false }
      }));
    }
  };

  const handleDeleteStockProduct = async (skuId) => {
    if (!window.confirm(`Are you sure you want to delete stock product SKU "${skuId}"? This will permanently remove it and all associated order records from the database.`)) {
      return;
    }
    try {
      await deleteStockProduct(skuId);
      await loadStockData();
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const formatCurrency = (val) => {
    if (val == null || isNaN(val)) return '₹0';
    const num = Number(val);
    if (num < 0) {
      return `-₹${Math.abs(num).toLocaleString('en-IN')}`;
    }
    return `₹${num.toLocaleString('en-IN')}`;
  };

  // Filter products based on search query
  const filteredProducts = products.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (p.sku_id && p.sku_id.toLowerCase().includes(q)) ||
      (p.product_name && p.product_name.toLowerCase().includes(q))
    );
  });

  return (
    <Layout>
      <div className="space-y-6 w-full pb-12">

        {/* HEADER & CONTROLS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-purple-100/80 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 shadow-sm shrink-0">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Inventory & stock <span className="font-normal text-purple-700">auditing</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Manage SKU valuation, unit prices, and realized stock profit</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px] sm:w-64">
              <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="search-sku"
                type="text"
                placeholder="Search by SKU ID or product name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-purple-50/40 border border-purple-200/80 rounded-full pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-purple-300 outline-none focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-200 transition-all font-medium shadow-xs"
              />
            </div>

            {/* Refresh Button */}
            <button
              onClick={loadStockData}
              disabled={loading}
              className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-full border border-purple-200/80 transition-all shadow-xs disabled:opacity-50 shrink-0 cursor-pointer"
              title="Refresh Stock Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* SUMMARY METRICS (5 CARDS) */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          {/* Total Quantity */}
          <div className="ui-card p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Total Added Qty</span>
              <Package className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-900 font-mono">
              {stockSummary.total_quantity || 0}
            </p>
            <p className="text-[10px] text-slate-500 font-medium">Initial stock logged</p>
          </div>

          {/* Current Available Stock */}
          <div className="ui-card p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>selling q.</span>
              <Boxes className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-700 font-mono">
              {stockSummary.total_available_quantity != null ? stockSummary.total_available_quantity : stockSummary.total_available_stock || 0}
            </p>
            <p className="text-[10px] text-slate-500 font-medium">Physical stock in hand</p>
          </div>

          {/* Total Customer Returned Qty */}
          <div className="ui-card p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Cust. Returned Qty</span>
              <Inbox className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-700 font-mono">
              {stockSummary.total_customer_returned_quantity != null ? stockSummary.total_customer_returned_quantity : 0}
            </p>
            <p className="text-[10px] text-slate-500 font-medium">Customer return units</p>
          </div>

          {/* Total RTO Returned Qty */}
          <div className="ui-card p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>RTO Returned Qty</span>
              <Inbox className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-700 font-mono">
              {stockSummary.total_rto_returned_quantity || 0}
            </p>
            <p className="text-[10px] text-slate-500 font-medium">RTO return units</p>
          </div>

          {/* Inventory Cost */}
          <div className="ui-card p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Inventory Cost</span>
              <Coins className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 font-mono">
              {formatCurrency(stockSummary.total_inventory_cost != null ? stockSummary.total_inventory_cost : stockSummary.total_purchase_cost)}
            </p>
            <p className="text-[10px] text-slate-500 font-medium">Purchase cost of available stock</p>
          </div>
        </div>

        {/* STOCK DATA TABLE */}
        <div className="ui-card overflow-hidden shadow-xl border border-slate-200/80 rounded-3xl">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-600" />
              <p className="text-xs text-slate-500 font-mono font-medium">Loading stock records...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center space-y-3 bg-slate-50/50">
              <Inbox className="w-12 h-12 text-slate-400 mx-auto" />
              <h4 className="font-semibold text-slate-800 text-base">No stock products found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                {searchQuery
                  ? `No products match "${searchQuery}"`
                  : 'Order records will automatically aggregate into stock products here.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white">
              <table className="w-full text-left border-collapse text-xs min-w-[1250px]" id="stock-table">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                    <th className="py-4 px-3 border-r border-slate-100">SKU ID</th>
                    <th className="py-4 px-3 border-r border-slate-100">Product Name</th>
                    <th className="py-4 px-2 border-r border-slate-100 text-center" title="Initial/Total Stock Added">Total Qty</th>
                    <th className="py-4 px-2 border-r border-slate-100 text-center" title="Successfully Sold & Kept Quantity">Sold Qty.</th>
                    <th className="py-4 px-2 border-r border-slate-100 text-center" title="Customer Returned Quantity">Cust. Return</th>
                    <th className="py-4 px-2 border-r border-slate-100 text-center" title="RTO Returned Quantity">RTO Return</th>
                    <th className="py-4 px-2 border-r border-slate-100 text-center" title="Current Physical Available Stock in Hand">Current Stock</th>
                    <th className="py-4 px-2 border-r border-slate-100 text-center">Purchase Price</th>
                    <th className="py-4 px-2 border-r border-slate-100 text-center">Selling Price</th>
                    <th className="py-4 px-3 border-r border-slate-100 text-right">Inventory Cost</th>
                    <th className="py-4 px-3 border-r border-slate-100 text-right">Inventory Value</th>
                    <th className="py-4 px-3 border-r border-slate-100 text-right" title="Profit from sold items = (Selling Price - Purchase Price) * Sold Qty">Realized Profit</th>
                    <th className="py-4 px-3 border-r border-slate-100 text-right" title="Loss from Customer Return delivery charges">Return Loss</th>
                    <th className="py-4 px-3 border-r border-slate-100 text-right" title="Net Profit = Realized Profit - Return Loss">Net Profit</th>
                    <th className="py-4 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => {
                    const editState = editPriceState[p.sku_id] || {
                      purchase_price: p.purchase_price != null ? p.purchase_price : '',
                      selling_price: p.selling_price != null ? p.selling_price : '',
                      saving: false,
                      saved: false
                    };

                    const rawNet = p.net_profit != null ? p.net_profit : p.profit;
                    const netProfitVal = rawNet;
                    const soldQty = p.successfully_sold_quantity != null ? p.successfully_sold_quantity : (p.realized_sales_quantity || 0);

                    return (
                      <tr
                        key={p.sku_id}
                        className="hover:bg-sky-50/50 transition-colors"
                      >
                        {/* SKU ID */}
                        <td className="py-3.5 px-3 border-r border-slate-100">
                          <span className="font-mono text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                            {p.sku_id}
                          </span>
                        </td>

                        {/* Product Name */}
                        <td className="py-3.5 px-3 border-r border-slate-100">
                          <span className="text-xs text-slate-800 font-semibold line-clamp-2">
                            {p.product_name || '-'}
                          </span>
                        </td>

                        {/* Total Quantity */}
                        <td className="py-3.5 px-2 border-r border-slate-100 text-center">
                          <span className="font-mono text-xs text-slate-800 font-semibold">
                            {p.total_quantity}
                          </span>
                        </td>

                        {/* Successfully Sold Quantity */}
                        <td className="py-3.5 px-2 border-r border-slate-100 text-center">
                          <span className="font-mono text-xs text-blue-700 font-semibold">
                            {soldQty}
                          </span>
                        </td>

                        {/* Customer Return Quantity */}
                        <td className="py-3.5 px-2 border-r border-slate-100 text-center">
                          <span className="font-mono text-xs text-amber-700 font-semibold">
                            {p.customer_returned_quantity || 0}
                          </span>
                        </td>

                        {/* RTO Return Quantity */}
                        <td className="py-3.5 px-2 border-r border-slate-100 text-center">
                          <span className="font-mono text-xs text-purple-700 font-semibold">
                            {p.rto_returned_quantity || 0}
                          </span>
                        </td>

                        {/* Current Available Stock */}
                        <td className="py-3.5 px-2 border-r border-slate-100 text-center">
                          <span className="font-mono text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            {p.available_quantity != null ? p.available_quantity : p.current_available_stock}
                          </span>
                        </td>

                        {/* Purchase Price Input */}
                        <td className="py-2 px-2 border-r border-slate-100 text-center">
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
                              className="w-16 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-lg px-1.5 py-1 text-xs text-right font-mono text-slate-800 outline-none transition-all font-semibold"
                            />
                          </div>
                        </td>

                        {/* Selling Price Input + Save Action */}
                        <td className="py-2 px-2 border-r border-slate-100 text-center">
                          <div className="flex items-center justify-center gap-1">
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
                              className="w-16 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-lg px-1.5 py-1 text-xs text-right font-mono text-slate-800 outline-none transition-all font-semibold"
                            />
                            <button
                              onClick={() => handleSavePrice(p.sku_id, p.product_name)}
                              disabled={editState.saving}
                              title="Save price for SKU"
                              className={`p-1 rounded-full border transition-all cursor-pointer ${editState.saved
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-purple-100 hover:bg-purple-200 text-purple-900 border-purple-300 shadow-xs'
                                } disabled:opacity-50`}
                            >
                              {editState.saved ? (
                                <Check className="w-3 h-3" />
                              ) : editState.saving ? (
                                <RefreshCw className="w-3 h-3 animate-spin text-purple-700" />
                              ) : (
                                <Save className="w-3 h-3 text-purple-700" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Inventory Cost */}
                        <td className="py-3.5 px-3 border-r border-slate-100 text-right">
                          <span className="font-mono text-xs text-amber-700 font-semibold">
                            {formatCurrency(p.inventory_cost != null ? p.inventory_cost : p.product_cost)}
                          </span>
                        </td>

                        {/* Inventory Value */}
                        <td className="py-3.5 px-3 border-r border-slate-100 text-right">
                          <span className="font-mono text-xs text-emerald-700 font-semibold">
                            {formatCurrency(p.inventory_value != null ? p.inventory_value : p.selling_value)}
                          </span>
                        </td>

                        {/* Realized Sales Profit */}
                        <td className="py-3.5 px-3 border-r border-slate-100 text-right">
                          <span className={`font-mono text-xs font-semibold ${p.realized_sales_profit == null ? 'text-slate-400' : (p.realized_sales_profit >= 0 ? 'text-sky-700' : 'text-rose-600')}`}>
                            {formatCurrency(p.realized_sales_profit)}
                          </span>
                        </td>

                        {/* Return Loss (Always >= 0, displayed in rose red if > 0) */}
                        <td className="py-3.5 px-3 border-r border-slate-100 text-right">
                          <span className={`font-mono text-xs font-semibold ${p.return_loss > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                            {formatCurrency(p.customer_return_loss || p.return_loss)}
                          </span>
                        </td>

                        {/* Net Profit */}
                        <td className="py-3.5 px-3 border-r border-slate-100 text-right">
                          <span className={`font-mono text-xs font-semibold px-2 py-0.5 rounded-full border ${netProfitVal == null
                              ? 'text-slate-400 border-transparent'
                              : netProfitVal >= 0
                                ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                                : 'text-rose-800 bg-rose-50 border-rose-200'
                            }`}>
                            {formatCurrency(netProfitVal)}
                          </span>
                        </td>

                        {/* Action Delete */}
                        <td className="py-3.5 px-3 text-center">
                          <button
                            onClick={() => handleDeleteStockProduct(p.sku_id)}
                            className="p-1 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
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

      </div>
    </Layout>
  );
}
