import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import {
  getReturnsOverview,
  exportReturnsExcel,
  updateReturnDeliveryCharge,
  undoReturnOrderRecord
} from '../services/api';
import {
  RotateCcw,
  Package,
  Search,
  RefreshCw,
  Save,
  Check,
  TrendingDown,
  Truck,
  Inbox,
  AlertTriangle,
  Download
} from 'lucide-react';

export default function Return() {
  const [activeCategory, setActiveCategory] = useState('customer'); // 'customer' | 'rto'
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [exportingReturns, setExportingReturns] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Data states
  const [customerReturns, setCustomerReturns] = useState([]);
  const [rtoReturns, setRtoReturns] = useState([]);
  const [summary, setSummary] = useState({
    total_customer_returns: 0,
    total_customer_returned_quantity: 0,
    total_customer_delivery_charges: 0,
    total_customer_return_loss: 0,
    total_rto_returns: 0,
    total_rto_returned_quantity: 0,
    total_rto_delivery_charges: 0,
    total_rto_return_loss: 0
  });

  // Delivery charge editing state for Customer Returns
  const [editChargeState, setEditChargeState] = useState({});
  // Confirmation state for Undo Return
  const [confirmUndoOrder, setConfirmUndoOrder] = useState(null);
  const [undoingId, setUndoingId] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadReturnData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getReturnsOverview();
      if (data.success) {
        const custRet = data.customerReturns || (data.returns || []).filter(r => r.return_type === 'CUSTOMER_RETURN');
        const rtoRet = data.rtoReturns || (data.returns || []).filter(r => r.return_type === 'RTO_RETURN');
        
        setCustomerReturns(custRet);
        setRtoReturns(rtoRet);
        if (data.summary) {
          setSummary(data.summary);
        }

        // Initialize editChargeState for customer returns
        const chargeStateObj = {};
        custRet.forEach(r => {
          chargeStateObj[r.order_id] = {
            delivery_boy_charge: r.delivery_boy_charge != null ? r.delivery_boy_charge : '',
            saving: false,
            saved: false
          };
        });
        setEditChargeState(chargeStateObj);
      }
    } catch (err) {
      console.error('Failed to load returns overview:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReturnData();
  }, [loadReturnData]);

  const handleChargeChange = (orderId, val) => {
    setEditChargeState(prev => ({
      ...prev,
      [orderId]: {
        ...(prev[orderId] || {}),
        delivery_boy_charge: val,
        saved: false
      }
    }));
  };

  const handleSaveCharge = async (orderId) => {
    const itemState = editChargeState[orderId];
    if (!itemState) return;

    setEditChargeState(prev => ({
      ...prev,
      [orderId]: { ...prev[orderId], saving: true }
    }));

    try {
      await updateReturnDeliveryCharge(orderId, itemState.delivery_boy_charge, 'CUSTOMER_RETURN');
      setEditChargeState(prev => ({
        ...prev,
        [orderId]: { ...prev[orderId], saving: false, saved: true }
      }));
      showToast(`Updated delivery charge for order #${orderId}`);
      await loadReturnData();
    } catch (err) {
      alert('Failed to update delivery charge: ' + (err.response?.data?.error || err.message));
      setEditChargeState(prev => ({
        ...prev,
        [orderId]: { ...prev[orderId], saving: false }
      }));
    }
  };

  const handleExportReturns = async () => {
    setExportingReturns(true);
    try {
      const response = await exportReturnsExcel();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `returns_report_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast("Return Excel report downloaded successfully.");
    } catch (err) {
      alert('Export failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setExportingReturns(false);
    }
  };

  const handleConfirmUndoReturn = async () => {
    if (!confirmUndoOrder) return;
    const targetId = confirmUndoOrder.id || confirmUndoOrder.order_id;
    setConfirmUndoOrder(null);
    setUndoingId(targetId);
    try {
      await undoReturnOrderRecord(targetId);
      showToast(`Return undone for order #${confirmUndoOrder.order_id}. Restored to stock.`);
      await loadReturnData();
    } catch (err) {
      alert('Undo Return failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setUndoingId(null);
    }
  };

  const formatCurrency = (val) => {
    if (val == null || isNaN(val)) return '₹0';
    return `₹${Number(val).toLocaleString('en-IN')}`;
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return isoString;
    }
  };

  // Filter returns based on search query
  const filteredCustomerReturns = customerReturns.filter(r => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (r.order_id && r.order_id.toLowerCase().includes(q)) ||
      (r.sku_id && r.sku_id.toLowerCase().includes(q)) ||
      (r.customer_name && r.customer_name.toLowerCase().includes(q)) ||
      (r.product_name && r.product_name.toLowerCase().includes(q))
    );
  });

  const filteredRtoReturns = rtoReturns.filter(r => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (r.order_id && r.order_id.toLowerCase().includes(q)) ||
      (r.sku_id && r.sku_id.toLowerCase().includes(q)) ||
      (r.customer_name && r.customer_name.toLowerCase().includes(q)) ||
      (r.product_name && r.product_name.toLowerCase().includes(q))
    );
  });

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* HEADER & CONTROLS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-purple-100/80 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shadow-sm shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Return <span className="font-serif-italic font-normal text-amber-700">management</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Track Customer Returns and Logistics RTO Returns with distinct financial rules</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="search-return-input"
                type="text"
                placeholder="Search Order ID, SKU or Customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-purple-50/40 border border-purple-200/80 rounded-full pl-9 pr-4 py-2.5 text-xs text-slate-800 placeholder-purple-300 outline-none focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-200 transition-all w-64 shadow-xs font-medium"
              />
            </div>

            {/* Refresh Button */}
            <button
              onClick={loadReturnData}
              disabled={loading}
              className="p-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-full border border-purple-200/80 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              title="Refresh return data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Export Excel Button */}
            <button
              id="export-return-excel-btn"
              onClick={handleExportReturns}
              disabled={exportingReturns}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-100/90 hover:bg-amber-200 text-amber-950 font-extrabold text-xs rounded-full border border-amber-300 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-700" />
              {exportingReturns ? 'Exporting...' : 'Export Return Excel'}
            </button>

            {/* Category Switcher Pill [ Customer Return ] [ RTO Return ] */}
            <div className="bg-purple-100/60 p-1 rounded-full border border-purple-200/80 flex items-center gap-1 shadow-inner">
              <button
                id="customer-return-tab-btn"
                onClick={() => setActiveCategory('customer')}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                  activeCategory === 'customer'
                    ? 'bg-amber-200/90 text-amber-950 border border-amber-300 shadow-xs'
                    : 'text-purple-800/80 hover:text-purple-950 hover:bg-white/60'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-800" />
                Customer Return
              </button>

              <button
                id="rto-return-tab-btn"
                onClick={() => setActiveCategory('rto')}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                  activeCategory === 'rto'
                    ? 'bg-purple-200/90 text-purple-950 border border-purple-300 shadow-xs'
                    : 'text-purple-800/80 hover:text-purple-950 hover:bg-white/60'
                }`}
              >
                <Truck className="w-3.5 h-3.5 text-purple-700" />
                RTO Return
              </button>
            </div>
          </div>
        </div>

        {/* DYNAMIC SUMMARY CARDS DEPENDING ON CATEGORY */}
        {activeCategory === 'customer' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Customer Returns */}
            <div className="ui-card p-4 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-extrabold">
                <span>Total Customer Returns</span>
                <RotateCcw className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-extrabold text-amber-700 font-mono">
                {summary.total_customer_returns || customerReturns.length || 0}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">Customer return parcels</p>
            </div>

            {/* Total Returned Quantity */}
            <div className="ui-card p-4 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-extrabold">
                <span>Total Returned Qty</span>
                <Package className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 font-mono">
                {summary.total_customer_returned_quantity || customerReturns.reduce((acc, r) => acc + (r.quantity || 1), 0)}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">Units added back to stock</p>
            </div>

            {/* Total Customer Return Charges */}
            <div className="ui-card p-4 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-extrabold">
                <span>Total Return Charges</span>
                <Truck className="w-4 h-4 text-sky-600" />
              </div>
              <p className="text-2xl font-extrabold text-sky-700 font-mono">
                {formatCurrency(summary.total_customer_delivery_charges)}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">Delivery charges incurred</p>
            </div>

            {/* Total Customer Return Loss */}
            <div className="ui-card p-4 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-extrabold">
                <span>Total Return Loss</span>
                <TrendingDown className="w-4 h-4 text-rose-600" />
              </div>
              <p className="text-2xl font-extrabold text-rose-600 font-mono">
                -{formatCurrency(summary.total_customer_return_loss)}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">Deducted from realized profit</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total RTO Returns */}
            <div className="ui-card p-4 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-extrabold">
                <span>Total RTO Returns</span>
                <Truck className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-extrabold text-purple-700 font-mono">
                {summary.total_rto_returns || rtoReturns.length || 0}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">Return To Origin parcels</p>
            </div>

            {/* Total RTO Quantity */}
            <div className="ui-card p-4 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-extrabold">
                <span>Total RTO Quantity</span>
                <Package className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 font-mono">
                {summary.total_rto_returned_quantity || rtoReturns.reduce((acc, r) => acc + (r.quantity || 1), 0)}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">Restored to available stock</p>
            </div>

            {/* Total RTO Charges */}
            <div className="ui-card p-4 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-extrabold">
                <span>Total RTO Charges</span>
                <Truck className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-extrabold text-emerald-700 font-mono">
                ₹0
              </p>
              <p className="text-[10px] text-slate-500 font-medium">Logistics neutral (No charge)</p>
            </div>

            {/* Total RTO Return Loss */}
            <div className="ui-card p-4 space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-extrabold">
                <span>Total RTO Loss</span>
                <TrendingDown className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-extrabold text-emerald-600 font-mono">
                ₹0
              </p>
              <p className="text-[10px] text-slate-500 font-medium">Zero financial loss</p>
            </div>
          </div>
        )}

        {/* TABLE VIEW FOR ACTIVE CATEGORY */}
        {activeCategory === 'customer' ? (
          /* CUSTOMER RETURNS TABLE */
          <div className="ui-card overflow-hidden shadow-xl border border-slate-200/80 rounded-3xl">
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-600" />
                <p className="text-xs text-slate-500 font-mono font-medium">Loading customer returns...</p>
              </div>
            ) : filteredCustomerReturns.length === 0 ? (
              <div className="py-20 text-center space-y-3 bg-slate-50/50">
                <Inbox className="w-12 h-12 text-slate-400 mx-auto" />
                <h4 className="font-extrabold text-slate-800 text-base">No customer returns found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                  {searchQuery
                    ? `No customer returns match "${searchQuery}"`
                    : 'Mark an order as "Customer Return" on the Orders page to see it listed here.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto bg-white">
                <table className="w-full text-left border-collapse text-xs" id="customer-returns-table">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[11px]">
                      <th className="py-4 px-3 border-r border-slate-100">Order ID</th>
                      <th className="py-4 px-3 border-r border-slate-100">SKU ID</th>
                      <th className="py-4 px-3 border-r border-slate-100">Product Name</th>
                      <th className="py-4 px-2 border-r border-slate-100 text-center">Quantity</th>
                      <th className="py-4 px-3 border-r border-slate-100 text-center">Purchase Price</th>
                      <th className="py-4 px-3 border-r border-slate-100 text-center">Selling Price</th>
                      <th className="py-4 px-3 border-r border-slate-100 text-center">Delivery Charge</th>
                      <th className="py-4 px-3 border-r border-slate-100 text-right">Return Loss</th>
                      <th className="py-4 px-3 border-r border-slate-100 text-center">Return Date</th>
                      <th className="py-4 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCustomerReturns.map((r) => {
                      const itemState = editChargeState[r.order_id] || {
                        delivery_boy_charge: r.delivery_boy_charge != null ? r.delivery_boy_charge : '',
                        saving: false,
                        saved: false
                      };

                      return (
                        <tr key={r.id || r.order_id} className="hover:bg-amber-50/40 transition-colors">
                          {/* Order ID */}
                          <td className="py-3.5 px-3 border-r border-slate-100 font-mono text-xs font-bold text-amber-900 select-all">
                            {r.order_id}
                          </td>

                          {/* SKU ID */}
                          <td className="py-3.5 px-3 border-r border-slate-100">
                            <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                              {r.sku_id}
                            </span>
                          </td>

                          {/* Product Name */}
                          <td className="py-3.5 px-3 border-r border-slate-100">
                            <span className="text-xs text-slate-800 font-semibold line-clamp-2">
                              {r.product_name}
                            </span>
                          </td>

                          {/* Quantity */}
                          <td className="py-3.5 px-2 border-r border-slate-100 text-center font-mono text-xs font-extrabold text-slate-800">
                            {r.quantity}
                          </td>

                          {/* Purchase Price */}
                          <td className="py-3.5 px-3 border-r border-slate-100 text-center font-mono text-xs text-slate-600">
                            {formatCurrency(r.purchase_price)}
                          </td>

                          {/* Selling Price */}
                          <td className="py-3.5 px-3 border-r border-slate-100 text-center font-mono text-xs text-slate-600">
                            {formatCurrency(r.selling_price)}
                          </td>

                          {/* Delivery Charge Input */}
                          <td className="py-3.5 px-3 border-r border-slate-100 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="text-slate-400 font-mono font-bold">₹</span>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                placeholder="0"
                                value={itemState.delivery_boy_charge}
                                onChange={(e) => handleChargeChange(r.order_id, e.target.value)}
                                className="w-16 bg-amber-50/50 border border-amber-200 rounded-lg px-2 py-1 text-xs text-slate-800 font-mono text-center outline-none focus:border-amber-400 focus:bg-white transition-all font-semibold"
                              />
                              <button
                                onClick={() => handleSaveCharge(r.order_id)}
                                disabled={itemState.saving}
                                title="Save delivery charge"
                                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                  itemState.saved
                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                    : 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                                }`}
                              >
                                {itemState.saving ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : itemState.saved ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : (
                                  <Save className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Return Loss */}
                          <td className="py-3.5 px-3 border-r border-slate-100 text-right">
                            <span className="font-mono text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              -{formatCurrency(r.return_loss)}
                            </span>
                          </td>

                          {/* Return Date */}
                          <td className="py-3.5 px-3 border-r border-slate-100 text-center text-[11px] text-slate-500 font-medium">
                            {formatDate(r.return_date)}
                          </td>

                          {/* Action (Undo Return) */}
                          <td className="py-3.5 px-3 text-center">
                            <button
                              onClick={() => setConfirmUndoOrder(r)}
                              disabled={undoingId === (r.id || r.order_id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200 transition-all cursor-pointer disabled:opacity-50"
                            >
                              <RotateCcw className={`w-3 h-3 ${undoingId === (r.id || r.order_id) ? 'animate-spin' : ''}`} />
                              Undo Return
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
          /* RTO RETURNS TABLE */
          <div className="ui-card overflow-hidden shadow-xl border border-slate-200/80 rounded-3xl">
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-600" />
                <p className="text-xs text-slate-500 font-mono font-medium">Loading RTO returns...</p>
              </div>
            ) : filteredRtoReturns.length === 0 ? (
              <div className="py-20 text-center space-y-3 bg-slate-50/50">
                <Inbox className="w-12 h-12 text-slate-400 mx-auto" />
                <h4 className="font-extrabold text-slate-800 text-base">No RTO returns found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                  {searchQuery
                    ? `No RTO returns match "${searchQuery}"`
                    : 'Mark an order as "RTO Return" on the Orders page to see it listed here.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto bg-white">
                <table className="w-full text-left border-collapse text-xs" id="rto-returns-table">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[11px]">
                      <th className="py-4 px-3 border-r border-slate-100">Order ID</th>
                      <th className="py-4 px-3 border-r border-slate-100">SKU ID</th>
                      <th className="py-4 px-3 border-r border-slate-100">Product Name</th>
                      <th className="py-4 px-2 border-r border-slate-100 text-center">Quantity</th>
                      <th className="py-4 px-3 border-r border-slate-100 text-center">Purchase Price</th>
                      <th className="py-4 px-3 border-r border-slate-100 text-center">Selling Price</th>
                      <th className="py-4 px-3 border-r border-slate-100 text-center">Return Type</th>
                      <th className="py-4 px-3 border-r border-slate-100 text-center">Return Date</th>
                      <th className="py-4 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRtoReturns.map((r) => (
                      <tr key={r.id || r.order_id} className="hover:bg-purple-50/40 transition-colors">
                        {/* Order ID */}
                        <td className="py-3.5 px-3 border-r border-slate-100 font-mono text-xs font-bold text-purple-900 select-all">
                          {r.order_id}
                        </td>

                        {/* SKU ID */}
                        <td className="py-3.5 px-3 border-r border-slate-100">
                          <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                            {r.sku_id}
                          </span>
                        </td>

                        {/* Product Name */}
                        <td className="py-3.5 px-3 border-r border-slate-100">
                          <span className="text-xs text-slate-800 font-semibold line-clamp-2">
                            {r.product_name}
                          </span>
                        </td>

                        {/* Quantity */}
                        <td className="py-3.5 px-2 border-r border-slate-100 text-center font-mono text-xs font-extrabold text-slate-800">
                          {r.quantity}
                        </td>

                        {/* Purchase Price */}
                        <td className="py-3.5 px-3 border-r border-slate-100 text-center font-mono text-xs text-slate-600">
                          {formatCurrency(r.purchase_price)}
                        </td>

                        {/* Selling Price */}
                        <td className="py-3.5 px-3 border-r border-slate-100 text-center font-mono text-xs text-slate-600">
                          {formatCurrency(r.selling_price)}
                        </td>

                        {/* Return Type Badge */}
                        <td className="py-3.5 px-3 border-r border-slate-100 text-center">
                          <span className="font-extrabold text-[10px] tracking-wider uppercase text-purple-800 bg-purple-100 px-3 py-1 rounded-full border border-purple-300">
                            RTO
                          </span>
                        </td>

                        {/* Return Date */}
                        <td className="py-3.5 px-3 border-r border-slate-100 text-center text-[11px] text-slate-500 font-medium">
                          {formatDate(r.return_date)}
                        </td>

                        {/* Action (Undo Return) */}
                        <td className="py-3.5 px-3 text-center">
                          <button
                            onClick={() => setConfirmUndoOrder(r)}
                            disabled={undoingId === (r.id || r.order_id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <RotateCcw className={`w-3 h-3 ${undoingId === (r.id || r.order_id) ? 'animate-spin' : ''}`} />
                            Undo Return
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* CONFIRMATION MODAL FOR UNDO RETURN */}
        {confirmUndoOrder && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white border border-purple-100 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 shadow-xs">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Undo Return Confirmation</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Are you sure you want to undo return for Order <span className="font-mono font-bold text-slate-800">#{confirmUndoOrder.order_id}</span>?
                  </p>
                </div>
              </div>

              <div className="bg-purple-50/60 rounded-2xl p-3.5 border border-purple-100 space-y-1.5 text-xs text-slate-600 font-medium">
                <div className="flex justify-between">
                  <span>SKU ID:</span>
                  <span className="font-mono font-bold text-purple-950">{confirmUndoOrder.sku_id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Returned Category:</span>
                  <span className="font-bold text-amber-800">
                    {confirmUndoOrder.return_type === 'RTO_RETURN' ? 'RTO Return' : 'Customer Return'}
                  </span>
                </div>
                <p className="text-[11px] text-purple-900/80 pt-1 border-t border-purple-200/50">
                  This action will restore the returned quantity to active available inventory and recalculate stock metrics.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setConfirmUndoOrder(null)}
                  className="px-4 py-2 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmUndoReturn}
                  className="px-5 py-2 rounded-full text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md transition-all cursor-pointer"
                >
                  Confirm Undo Return
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
