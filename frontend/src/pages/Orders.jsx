import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { getOrderRecords, returnOrderRecord, undoReturnOrderRecord, deleteOrderRecord } from '../services/api';
import {
  Search,
  RefreshCw,
  RotateCcw,
  Package,
  Inbox,
  Trash2,
  AlertTriangle
} from 'lucide-react';

export default function Orders() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [returningId, setReturningId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Return modal state
  const [returnModalOrder, setReturnModalOrder] = useState(null);
  const [confirmUndoOrder, setConfirmUndoOrder] = useState(null);
  const [undoingId, setUndoingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOrderRecords(searchQuery);
      setRecords(res.records || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
  };

  const executeReturn = async (rec, returnType) => {
    const targetId = rec.order_id || rec.id;
    setReturningId(rec.id);
    setReturnModalOrder(null);
    try {
      await returnOrderRecord(targetId, returnType);
      showToast(`Order #${rec.order_id || rec.id} marked as ${returnType === 'RTO_RETURN' ? 'RTO Return' : 'Customer Return'}.`);
      await loadRecords();
    } catch (err) {
      alert('Return failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setReturningId(null);
    }
  };

  const handleOpenUndoModal = (rec) => {
    setConfirmUndoOrder(rec);
  };

  const handleConfirmUndoReturn = async () => {
    if (!confirmUndoOrder) return;
    const targetId = confirmUndoOrder.id;
    setConfirmUndoOrder(null);
    setUndoingId(targetId);
    try {
      await undoReturnOrderRecord(targetId);
      showToast("Return undone successfully.");
      await loadRecords();
    } catch (err) {
      alert('Undo Return failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setUndoingId(null);
    }
  };

  const handleDelete = async (id, orderId) => {
    if (!window.confirm(`Are you sure you want to delete order "${orderId || id}"? This will permanently remove it from the database.`)) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteOrderRecord(id);
      setRecords(prev => prev.filter(r => r.id !== id && r.order_id !== id));
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Layout title="Orders">
      <div className="space-y-6 pb-10">

        {/* Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-400 via-violet-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-300/40 shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Parcel order <span className="font-normal text-purple-600">records</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Extracted parcel customer orders and SKU logistics</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search Form */}
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="search-order-id"
                  type="text"
                  placeholder="Search Order ID, SKU or Customer..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="bg-purple-50/40 border border-purple-200/80 rounded-full pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-purple-300 outline-none focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-200 transition-all w-64 shadow-xs font-medium"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-semibold rounded-full border border-purple-200 transition-all shadow-xs cursor-pointer"
              >
                Search
              </button>
            </form>

            {/* Refresh Button */}
            <button
              onClick={loadRecords}
              disabled={loading}
              className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-full border border-purple-200/80 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              title="Refresh order records"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* ORDERS TABLE */}
        <div className="ui-card overflow-hidden shadow-xl border border-purple-100/80 rounded-3xl">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-600" />
              <p className="text-xs text-slate-500 font-mono font-medium">Loading extracted orders...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="py-20 text-center space-y-3 bg-purple-50/20">
              <Inbox className="w-12 h-12 text-purple-300 mx-auto" />
              <h4 className="font-semibold text-slate-800 text-base">No orders found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                {searchQuery
                  ? `No orders match "${searchQuery}"`
                  : 'Upload a parcel label to create your first order record.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white">
              <table className="w-full text-left border-collapse text-xs" id="orders-table">
                <thead>
                  <tr className="bg-purple-50/50 border-b border-purple-100 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                    <th className="py-4 px-4 border-r border-purple-50">Order ID</th>
                    <th className="py-4 px-4 border-r border-purple-50">Customer Name</th>
                    <th className="py-4 px-4 border-r border-purple-50">SKU ID</th>
                    <th className="py-4 px-4 border-r border-purple-50">Product Name</th>
                    <th className="py-4 px-4 border-r border-purple-50 text-center">Quantity</th>
                    <th className="py-4 px-4 border-r border-purple-50 text-center">Return Status</th>
                    <th className="py-4 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((rec) => (
                    <tr
                      key={rec.id}
                      className="hover:bg-purple-50/40 transition-colors"
                    >
                      {/* Order ID */}
                      <td className="py-3.5 px-4 border-r border-slate-100">
                        <span className="font-mono text-xs font-semibold text-purple-700 select-all">
                          {rec.order_id || '-'}
                        </span>
                      </td>

                      {/* Customer Name */}
                      <td className="py-3.5 px-4 border-r border-slate-100">
                        <span className="text-xs text-slate-800 font-semibold">
                          {rec.customer_name || '-'}
                        </span>
                      </td>

                      {/* SKU ID */}
                      <td className="py-3.5 px-4 border-r border-slate-100">
                        <span className="font-mono text-xs text-slate-500 font-semibold">
                          {rec.sku_id || '-'}
                        </span>
                      </td>

                      {/* Product Name */}
                      <td className="py-3.5 px-4 border-r border-slate-100">
                        <span className="text-xs text-slate-700 font-medium">
                          {rec.product_name || '-'}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="py-3.5 px-4 border-r border-slate-100 text-center">
                        <span className="font-mono text-xs text-slate-800 font-bold">
                          {rec.quantity || 1}
                        </span>
                      </td>

                      {/* Return */}
                      <td className="py-3.5 px-4 border-r border-slate-100 text-center">
                        {rec.is_returned ? (
                          <button
                            onClick={() => handleOpenUndoModal(rec)}
                            disabled={undoingId === rec.id}
                            title="Click to undo return and restore stock"
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-100/90 text-rose-800 border border-rose-300 hover:bg-rose-200 hover:border-rose-400 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                          >
                            <RotateCcw className={`w-3 h-3 text-rose-700 ${undoingId === rec.id ? 'animate-spin' : ''}`} />
                            {undoingId === rec.id ? 'Undoing...' : 'Returned'}
                          </button>
                        ) : (
                          <button
                            onClick={() => setReturnModalOrder(rec)}
                            disabled={returningId === rec.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100/90 text-amber-800 border border-amber-200 hover:bg-amber-200 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <RotateCcw className={`w-3 h-3 ${returningId === rec.id ? 'animate-spin' : ''}`} />
                            {returningId === rec.id ? 'Returning...' : 'Return'}
                          </button>
                        )}
                      </td>

                      {/* Delete Action */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDelete(rec.id, rec.order_id)}
                          disabled={deletingId === rec.id}
                          title="Delete record from database"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all border border-transparent hover:border-rose-200 disabled:opacity-50"
                        >
                          <Trash2 className={`w-4 h-4 ${deletingId === rec.id ? 'animate-spin' : ''}`} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer count */}
          {!loading && records.length > 0 && (
            <div className="px-5 py-3.5 border-t border-purple-100 bg-purple-50/40 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-semibold">
                Showing {records.length} record{records.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={loadRecords}
                className="text-xs text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh List
              </button>
            </div>
          )}
        </div>

        {/* Modal: Select Return Type (Customer Return vs RTO Return) */}
        {returnModalOrder && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white border border-purple-100 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 shadow-xs">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Select Return Type</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Choose category for returned Order <span className="font-mono font-bold text-slate-800">#{returnModalOrder.order_id}</span>
                  </p>
                </div>
              </div>

              <div className="bg-purple-50/60 rounded-2xl p-3.5 border border-purple-100 space-y-1.5 text-xs text-slate-600 font-medium">
                <div className="flex justify-between">
                  <span>SKU ID:</span>
                  <span className="font-mono font-bold text-purple-950">{returnModalOrder.sku_id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span className="font-bold text-slate-800">{returnModalOrder.customer_name || '-'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => executeReturn(returnModalOrder, 'CUSTOMER_RETURN')}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-950 transition-all group cursor-pointer"
                >
                  <RotateCcw className="w-6 h-6 text-amber-700 mb-1.5 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold">Customer Return</span>
                  <span className="text-[10px] text-amber-800/80 font-medium text-center mt-0.5">Delivery charge applies</span>
                </button>

                <button
                  onClick={() => executeReturn(returnModalOrder, 'RTO_RETURN')}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-950 transition-all group cursor-pointer"
                >
                  <Package className="w-6 h-6 text-purple-700 mb-1.5 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold">RTO Return</span>
                  <span className="text-[10px] text-purple-800/80 font-medium text-center mt-0.5">Return to origin (₹0 loss)</span>
                </button>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  onClick={() => setReturnModalOrder(null)}
                  className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal for Undo Return */}
        {confirmUndoOrder && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white border border-purple-100 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 shadow-xs">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">Undo Return?</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    This parcel is currently marked as returned. Do you want to undo the return and restore it to normal stock?
                  </p>
                  {confirmUndoOrder.order_id && (
                    <div className="pt-1 text-[11px] font-mono font-semibold text-purple-700">
                      Order ID: {confirmUndoOrder.order_id}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setConfirmUndoOrder(null)}
                  className="px-4 py-2 rounded-full text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmUndoReturn}
                  className="px-5 py-2 rounded-full text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Undo Return
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Notification Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 border border-slate-700 animate-in slide-in-from-bottom-4 duration-200">
            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">
              ✓
            </div>
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </Layout>
  );
}


