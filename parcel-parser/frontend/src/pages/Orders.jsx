import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { getOrderRecords, returnOrderRecord, deleteOrderRecord, exportOrdersExcel, syncOrdersToSupabase } from '../services/api';
import {
  Search,
  RefreshCw,
  Download,
  RotateCcw,
  Package,
  Inbox,
  Trash2,
  Database
} from 'lucide-react';

export default function Orders() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [returningId, setReturningId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [syncing, setSyncing] = useState(false);

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

  const handleReturn = async (id) => {
    setReturningId(id);
    try {
      await returnOrderRecord(id);
      setRecords(prev =>
        prev.map(r => r.id === id ? { ...r, is_returned: true } : r)
      );
    } catch (err) {
      alert('Return failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setReturningId(null);
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

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await syncOrdersToSupabase();
      alert(`Successfully synced ${res.synced_count} record(s) to Supabase database!`);
      loadRecords();
    } catch (err) {
      alert('Supabase Sync Failed: ' + (err.response?.data?.error || err.message || 'Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in backend/.env'));
    } finally {
      setSyncing(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await exportOrdersExcel();
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setExporting(false);
    }
  };

  return (
    <Layout title="Orders">
      <div className="space-y-5 pb-10">

        {/* Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-tight">Orders</h1>
              <p className="text-xs text-slate-400">Extracted parcel order records</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="search-order-id"
                  type="text"
                  placeholder="Search by Order ID"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-all w-60"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/20"
              >
                Search
              </button>
            </form>

            {/* Sync to Supabase */}
            <button
              onClick={handleSync}
              disabled={syncing}
              title="Sync local data to Supabase PostgreSQL"
              className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-sky-600/20 disabled:opacity-50"
            >
              <Database className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync to Supabase'}
            </button>

            {/* Export Excel */}
            <button
              id="export-excel-btn"
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Exporting...' : 'Export Excel'}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-400" />
              <p className="text-xs text-slate-400 font-mono">Loading orders...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <Inbox className="w-12 h-12 text-slate-600 mx-auto" />
              <h4 className="font-bold text-slate-300">No orders found</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchQuery
                  ? `No orders match "${searchQuery}"`
                  : 'Upload a parcel label to create your first order.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" id="orders-table">
                <thead>
                  <tr className="bg-slate-950 border-b-2 border-slate-700">
                    <th className="py-3 px-4 text-[11px] font-extrabold text-slate-300 uppercase tracking-wider whitespace-nowrap border-r border-slate-800/60">Order ID</th>
                    <th className="py-3 px-4 text-[11px] font-extrabold text-slate-300 uppercase tracking-wider whitespace-nowrap border-r border-slate-800/60">Customer Name</th>
                    <th className="py-3 px-4 text-[11px] font-extrabold text-slate-300 uppercase tracking-wider whitespace-nowrap border-r border-slate-800/60">SKU ID</th>
                    <th className="py-3 px-4 text-[11px] font-extrabold text-slate-300 uppercase tracking-wider whitespace-nowrap border-r border-slate-800/60">Product Name</th>
                    <th className="py-3 px-4 text-[11px] font-extrabold text-slate-300 uppercase tracking-wider whitespace-nowrap border-r border-slate-800/60 text-right">Purchase Price</th>
                    <th className="py-3 px-4 text-[11px] font-extrabold text-slate-300 uppercase tracking-wider whitespace-nowrap border-r border-slate-800/60 text-right">Selling Price</th>
                    <th className="py-3 px-4 text-[11px] font-extrabold text-slate-300 uppercase tracking-wider whitespace-nowrap border-r border-slate-800/60 text-center">Quantity</th>
                    <th className="py-3 px-4 text-[11px] font-extrabold text-slate-300 uppercase tracking-wider whitespace-nowrap border-r border-slate-800/60 text-center">Return</th>
                    <th className="py-3 px-4 text-[11px] font-extrabold text-slate-300 uppercase tracking-wider whitespace-nowrap text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec, idx) => (
                    <tr
                      key={rec.id}
                      className={`border-b border-slate-800/50 transition-colors ${
                        idx % 2 === 0 ? 'bg-slate-900/80' : 'bg-slate-950/60'
                      } hover:bg-indigo-500/5`}
                    >
                      {/* Order ID */}
                      <td className="py-3 px-4 border-r border-slate-800/40">
                        <span className="font-mono text-xs font-bold text-indigo-300 select-all">
                          {rec.order_id || '-'}
                        </span>
                      </td>

                      {/* Customer Name */}
                      <td className="py-3 px-4 border-r border-slate-800/40">
                        <span className="text-sm text-slate-200 font-medium">
                          {rec.customer_name || '-'}
                        </span>
                      </td>

                      {/* SKU ID */}
                      <td className="py-3 px-4 border-r border-slate-800/40">
                        <span className="font-mono text-xs text-slate-400">
                          {rec.sku_id || '-'}
                        </span>
                      </td>

                      {/* Product Name */}
                      <td className="py-3 px-4 border-r border-slate-800/40">
                        <span className="text-sm text-slate-200">
                          {rec.product_name || '-'}
                        </span>
                      </td>

                      {/* Purchase Price */}
                      <td className="py-3 px-4 border-r border-slate-800/40 text-right">
                        <span className="font-mono text-sm text-slate-400">
                          {rec.purchase_price != null ? `₹${Number(rec.purchase_price).toLocaleString('en-IN')}` : '-'}
                        </span>
                      </td>

                      {/* Selling Price */}
                      <td className="py-3 px-4 border-r border-slate-800/40 text-right">
                        <span className="font-mono text-sm text-slate-200">
                          {rec.selling_price != null ? `₹${Number(rec.selling_price).toLocaleString('en-IN')}` : '-'}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="py-3 px-4 border-r border-slate-800/40 text-center">
                        <span className="font-mono text-sm text-slate-200 font-semibold">
                          {rec.quantity || 1}
                        </span>
                      </td>

                      {/* Return */}
                      <td className="py-3 px-4 border-r border-slate-800/40 text-center">
                        {rec.is_returned ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            <RotateCcw className="w-3 h-3" />
                            Returned
                          </span>
                        ) : (
                          <button
                            onClick={() => handleReturn(rec.id)}
                            disabled={returningId === rec.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 hover:text-amber-300 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <RotateCcw className={`w-3 h-3 ${returningId === rec.id ? 'animate-spin' : ''}`} />
                            {returningId === rec.id ? 'Returning...' : 'Return'}
                          </button>
                        )}
                      </td>

                      {/* Delete Action */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDelete(rec.id, rec.order_id)}
                          disabled={deletingId === rec.id}
                          title="Delete record from database"
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all border border-transparent hover:border-rose-500/30 disabled:opacity-50"
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
            <div className="px-4 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">
                {records.length} record{records.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={loadRecords}
                className="text-xs text-slate-400 hover:text-indigo-400 font-semibold flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
