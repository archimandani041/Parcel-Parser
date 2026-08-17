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
  Database,
  Sparkles
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
      <div className="space-y-6 pb-10">

        {/* Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-400 via-violet-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-300/40 shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Parcel order <span className="font-serif-italic font-normal text-purple-600">records</span>
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
                  placeholder="Search by Order ID..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="bg-white border border-purple-200/80 rounded-full pl-9 pr-4 py-2.5 text-xs text-slate-800 placeholder-purple-300 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all w-60 shadow-xs font-medium"
                />
              </div>
              <button
                type="submit"
                className="pill-button-pastel px-5 py-2.5 text-xs font-extrabold shadow-md"
              >
                Search
              </button>
            </form>

            {/* Sync to Supabase */}
            <button
              onClick={handleSync}
              disabled={syncing}
              title="Sync local data to Supabase PostgreSQL"
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-200/90 hover:bg-purple-300 text-purple-950 font-extrabold text-xs rounded-full transition-all border border-purple-300 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Database className={`w-3.5 h-3.5 text-purple-700 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Supabase'}
            </button>

            {/* Export Excel */}
            <button
              id="export-excel-btn"
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-100/90 hover:bg-emerald-200 text-emerald-950 font-extrabold text-xs rounded-full transition-all border border-emerald-300 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              {exporting ? 'Exporting...' : 'Export Excel'}
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="ui-card overflow-hidden shadow-xl border border-purple-100 rounded-3xl">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-600" />
              <p className="text-xs text-slate-500 font-mono font-medium">Loading extracted orders...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="py-20 text-center space-y-3 bg-purple-50/20">
              <Inbox className="w-12 h-12 text-purple-300 mx-auto" />
              <h4 className="font-extrabold text-slate-800 text-base">No orders found</h4>
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
                  <tr className="bg-purple-50/50 border-b border-purple-100 text-slate-500 uppercase tracking-wider font-extrabold text-[11px]">
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
                        <span className="font-mono text-xs font-extrabold text-purple-700 select-all">
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
                        <span className="font-mono text-xs text-slate-800 font-extrabold">
                          {rec.quantity || 1}
                        </span>
                      </td>

                      {/* Return */}
                      <td className="py-3.5 px-4 border-r border-slate-100 text-center">
                        {rec.is_returned ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <RotateCcw className="w-3 h-3" />
                            Returned
                          </span>
                        ) : (
                          <button
                            onClick={() => handleReturn(rec.id)}
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
      </div>
    </Layout>
  );
}


