import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import {
  getDocuments,
  getDashboardStats,
  exportOrdersExcel,
  exportStockExcel,
  exportReturnsExcel,
  exportMasterExcel
} from '../services/api';
import { getStatusBadgeConfig, formatDate, formatConfidence } from '../utils/formatters';
import {
  FileText,
  TrendingUp,
  TrendingDown,
  UploadCloud,
  ArrowRight,
  RefreshCw,
  Search,
  ExternalLink,
  Download,
  Layers,
  Boxes,
  RotateCcw,
  Coins,
  IndianRupee,
  PackageCheck,
  BarChart3,
  Calendar
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_profit: 0,
    total_selling: 0,
    total_return: 0,
    total_stock_items: 0,
    total_labels: 0,
    total_orders: 0
  });
  const [graphData, setGraphData] = useState([]);
  const [selectedRange, setSelectedRange] = useState('30');
  const [recentDocs, setRecentDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [exportingAll, setExportingAll] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const [hoveredDataPoint, setHoveredDataPoint] = useState(null);

  // Helper function to trigger browser file download from Blob
  const triggerDownload = (data, filename) => {
    const blob = new Blob([data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Single Click Download for Master Excel (Contains 3 Sheets: Orders, Stock, Return)
  const handleDownloadAllThree = async () => {
    setExportingAll(true);
    setExportProgress('Downloading Master Excel (3-in-1)...');

    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const masterRes = await exportMasterExcel();
      triggerDownload(masterRes.data, `master_report_orders_stock_returns_${dateStr}.xlsx`);

      setExportProgress('Master Excel Downloaded!');
      setTimeout(() => {
        setExportProgress('');
      }, 4000);

    } catch (err) {
      alert('Master Excel Download failed: ' + (err.response?.data?.error || err.message));
      setExportProgress('');
    } finally {
      setExportingAll(false);
    }
  };

  const formatCurrency = (val) => {
    if (val == null || isNaN(val)) return '₹0';
    const num = Number(val);
    const isNeg = num < 0;
    const formatted = Math.abs(num).toLocaleString('en-IN');
    return isNeg ? `-₹${formatted}` : `₹${formatted}`;
  };

  const loadDashboardData = (range = selectedRange) => {
    setLoading(true);
    Promise.all([
      getDashboardStats(range).catch(() => null),
      getDocuments().catch(() => null)
    ])
      .then(([statsRes, docsRes]) => {
        if (statsRes?.success && statsRes.stats) {
          setStats(statsRes.stats);
          setGraphData(statsRes.graph_data || []);
        }
        if (docsRes?.documents) {
          setRecentDocs(docsRes.documents);
        }
      })
      .catch(err => console.error('Dashboard data load error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboardData(selectedRange);
  }, [selectedRange]);

  const filteredDocs = recentDocs.filter(d =>
    d.file_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Profit/Loss graph calculations
  const maxGraphVal = Math.max(
    ...graphData.flatMap(d => [d.profit || 0, d.loss || 0]),
    100
  ) * 1.25;
  const hasGraphData = graphData.some(d => (d.profit || 0) > 0 || (d.loss || 0) > 0);

  return (
    <Layout title="Business Intelligence Dashboard">
      <div className="space-y-8 pb-10">

        {/* Action Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 border border-purple-100 p-5 rounded-2xl shadow-xs">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Real-Time Business Intelligence
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Live operational metrics, returns tracking, and profit analytics
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              id="download-all-3-excels-btn"
              onClick={handleDownloadAllThree}
              disabled={exportingAll}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs px-5 py-2.5 rounded-full shadow-md shadow-emerald-500/15 transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 cursor-pointer"
              title="Download 1. Orders, 2. Stock, and 3. Return Excel files"
            >
              <Download className={`w-3.5 h-3.5 text-white ${exportingAll ? 'animate-bounce' : ''}`} />
              {exportingAll ? exportProgress : 'Download All 3 Excels (1-Click)'}
            </button>

            <Link
              to="/upload"
              className="pill-button-dark flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold shadow-xs"
            >
              <UploadCloud className="w-3.5 h-3.5 text-purple-400" />
              Upload New Label
            </Link>
          </div>
        </div>

        {/* TOP STATISTICS CARDS (6 CARDS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">

          {/* 1. Total Profit Card */}
          <div className="ui-card ui-card-hover p-5 space-y-2 bg-gradient-to-br from-emerald-50/80 via-teal-50/30 to-white border border-emerald-200/90 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">Total Profit</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-xs">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <p className={`text-2xl font-extrabold font-mono tracking-tight ${stats.total_profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {formatCurrency(stats.total_profit)}
            </p>
            <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
              <TrendingUp className="w-3 h-3 text-emerald-600" /> Matches Stock Net Profit
            </div>
          </div>

          {/* 2. Total Selling Card */}
          <div className="ui-card ui-card-hover p-5 space-y-2 bg-gradient-to-br from-purple-50/60 via-violet-50/20 to-white border border-purple-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-800">Total Selling</span>
              <div className="w-8 h-8 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 shadow-xs">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-purple-900 font-mono tracking-tight">
              {formatCurrency(stats.total_selling)}
            </p>
            <div className="flex items-center gap-1 text-[10px] text-purple-700 font-semibold">
              <TrendingUp className="w-3 h-3 text-purple-600" /> Realized sold revenue
            </div>
          </div>

          {/* 3. Total Return Card */}
          <div className="ui-card ui-card-hover p-5 space-y-2 bg-gradient-to-br from-rose-50/60 via-amber-50/20 to-white border border-rose-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-800">Total Return</span>
              <div className="w-8 h-8 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shadow-xs">
                <RotateCcw className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-rose-700 font-mono tracking-tight">
              {stats.total_return || 0}
            </p>
            <div className="flex items-center gap-1 text-[10px] text-rose-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Customer + RTO Returns
            </div>
          </div>

          {/* 4. Total Stock Items Card */}
          <div className="ui-card ui-card-hover p-5 space-y-2 bg-gradient-to-br from-blue-50/60 via-sky-50/20 to-white border border-blue-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-800">Total Stock Items</span>
              <div className="w-8 h-8 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 shadow-xs">
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-blue-900 font-mono tracking-tight">
              {stats.total_stock_items || 0}
            </p>
            <div className="flex items-center gap-1 text-[10px] text-blue-700 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Available inventory
            </div>
          </div>

          {/* 5. Total Labels Card */}
          <div className="ui-card ui-card-hover p-5 space-y-2 bg-gradient-to-br from-violet-50/60 via-indigo-50/20 to-white border border-violet-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-violet-800">Total Labels</span>
              <div className="w-8 h-8 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-700 shadow-xs">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-violet-900 font-mono tracking-tight">
              {stats.total_labels || 0}
            </p>
            <div className="flex items-center gap-1 text-[10px] text-violet-700 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500" /> Extracted documents
            </div>
          </div>

          {/* 6. Total Orders Card */}
          <div className="ui-card ui-card-hover p-5 space-y-2 bg-gradient-to-br from-amber-50/60 via-orange-50/20 to-white border border-amber-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800">Total Orders</span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shadow-xs">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-amber-900 font-mono tracking-tight">
              {stats.total_orders || 0}
            </p>
            <div className="flex items-center gap-1 text-[10px] text-amber-700 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Unique Order IDs
            </div>
          </div>

        </div>


        {/* PROFIT & LOSS GRAPH SECTION */}
        <div className="ui-card p-6 sm:p-8 space-y-6">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100/80 pb-5">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Profit & Loss
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Real-time tracking of sales profits and return delivery losses over time
              </p>
            </div>

            {/* Range Selector & Legend */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 bg-purple-50/50 px-3 py-1.5 rounded-full border border-purple-100">
                <span className="flex items-center gap-1 text-emerald-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Profit
                </span>
                <span className="flex items-center gap-1 text-rose-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Loss
                </span>
              </div>

              <div className="inline-flex items-center bg-purple-50/70 p-1 rounded-full border border-purple-200/80">
                {[
                  { label: '7 Days', value: '7' },
                  { label: '30 Days', value: '30' },
                  { label: '90 Days', value: '90' },
                  { label: 'All', value: 'all' }
                ].map(r => (
                  <button
                    key={r.value}
                    onClick={() => setSelectedRange(r.value)}
                    className={`px-3.5 py-1 text-xs font-extrabold rounded-full transition-all cursor-pointer ${
                      selectedRange === r.value
                        ? 'bg-purple-700 text-white shadow-xs'
                        : 'text-purple-700 hover:bg-purple-100/80'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Visual Graph Container */}
          {!hasGraphData ? (
            <div className="py-20 text-center text-slate-400 text-sm border-2 border-dashed border-purple-200/60 rounded-3xl bg-purple-50/20 p-8 space-y-2">
              <BarChart3 className="w-10 h-10 text-purple-300 mx-auto" />
              <h4 className="font-bold text-slate-700">No profit or loss data available yet.</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Upload parcel documents or record customer returns to generate real-time profit and loss trends.
              </p>
            </div>
          ) : (
            <div className="relative pt-4 pb-2">
              {/* Active Hover Data Banner */}
              <div className="mb-4 p-3 bg-slate-900 text-white rounded-xl text-xs flex items-center justify-between shadow-md max-w-md transition-all">
                <span className="font-bold text-purple-200">
                  {hoveredDataPoint ? hoveredDataPoint.displayDate : 'Hover over bars for daily breakdown'}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-emerald-400 font-mono font-bold">
                    Profit: {formatCurrency(hoveredDataPoint ? hoveredDataPoint.profit : graphData.reduce((a, b) => a + (b.profit || 0), 0))}
                  </span>
                  <span className="text-rose-400 font-mono font-bold">
                    Loss: {formatCurrency(hoveredDataPoint ? hoveredDataPoint.loss : graphData.reduce((a, b) => a + (b.loss || 0), 0))}
                  </span>
                </div>
              </div>

              {/* Responsive Bar Chart Visualization with Grid lines */}
              <div className="relative h-64 w-full pt-8 pb-6 px-2 border-b border-purple-100 bg-gradient-to-b from-purple-50/20 to-transparent rounded-2xl">
                {/* Horizontal Guide Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none px-4 py-8">
                  <div className="border-b border-purple-100/60 w-full text-[10px] text-slate-400 font-mono flex justify-between">
                    <span>{formatCurrency(Math.round(maxGraphVal))}</span>
                  </div>
                  <div className="border-b border-purple-100/40 w-full text-[10px] text-slate-400 font-mono flex justify-between">
                    <span>{formatCurrency(Math.round(maxGraphVal / 2))}</span>
                  </div>
                  <div className="border-b border-purple-200/80 w-full text-[10px] text-slate-400 font-mono flex justify-between">
                    <span>₹0</span>
                  </div>
                </div>

                {/* Bars Container */}
                <div className="relative z-10 h-full flex items-end justify-around gap-2 sm:gap-6 px-6">
                  {graphData.map((d, idx) => {
                    const profitHeightPercent = Math.max(Math.round(((d.profit || 0) / maxGraphVal) * 100), (d.profit > 0 ? 10 : 0));
                    const lossHeightPercent = Math.max(Math.round(((d.loss || 0) / maxGraphVal) * 100), (d.loss > 0 ? 10 : 0));

                    return (
                      <div
                        key={idx}
                        onMouseEnter={() => setHoveredDataPoint(d)}
                        onMouseLeave={() => setHoveredDataPoint(null)}
                        className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer max-w-[80px]"
                      >
                        {/* Bar Pair */}
                        <div className="w-full flex items-end justify-center gap-2 h-full">
                          {/* Profit Bar (Emerald) */}
                          <div className="w-full max-w-[24px] flex flex-col items-center h-full justify-end">
                            {d.profit > 0 && (
                              <span className="text-[10px] font-mono font-bold text-emerald-700 mb-1 leading-none">
                                {formatCurrency(d.profit)}
                              </span>
                            )}
                            <div
                              className={`w-full rounded-t-md transition-all duration-300 ${
                                d.profit > 0
                                  ? 'bg-gradient-to-t from-emerald-600 via-teal-500 to-emerald-400 shadow-xs shadow-emerald-500/20 group-hover:scale-y-105'
                                  : 'bg-slate-100 h-1'
                              }`}
                              style={{ height: d.profit > 0 ? `${profitHeightPercent}%` : '2px' }}
                            />
                          </div>

                          {/* Loss Bar (Rose) */}
                          <div className="w-full max-w-[24px] flex flex-col items-center h-full justify-end">
                            {d.loss > 0 && (
                              <span className="text-[10px] font-mono font-bold text-rose-700 mb-1 leading-none">
                                {formatCurrency(d.loss)}
                              </span>
                            )}
                            <div
                              className={`w-full rounded-t-md transition-all duration-300 ${
                                d.loss > 0
                                  ? 'bg-gradient-to-t from-rose-600 via-pink-500 to-rose-400 shadow-xs shadow-rose-500/20 group-hover:scale-y-105'
                                  : 'bg-slate-100 h-1'
                              }`}
                              style={{ height: d.loss > 0 ? `${lossHeightPercent}%` : '2px' }}
                            />
                          </div>
                        </div>

                        {/* Date Label */}
                        <span className="text-[11px] font-bold text-slate-600 mt-3 truncate w-full text-center group-hover:text-purple-900 transition-colors">
                          {d.displayDate}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>


        {/* RECENT EXTRACTED PARCEL DOCUMENTS SECTION */}
        <div className="ui-card p-6 sm:p-8 space-y-6">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100/80 pb-5">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-purple-600" />
                Recent extracted parcel <span className="font-serif-italic font-normal text-purple-600">documents</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Live feed of parsed shipping labels and metadata</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by filename or status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-purple-50/40 border border-purple-200/80 rounded-full pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-purple-300 outline-none focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-200 transition-all w-52 sm:w-72 font-medium"
                />
              </div>

              <button
                onClick={() => loadDashboardData(selectedRange)}
                title="Refresh Table Data"
                className="p-2.5 text-purple-600 hover:text-purple-900 bg-purple-50 border border-purple-200/80 hover:bg-purple-100 rounded-full transition-all shadow-xs cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <Link
                to="/documents"
                className="flex items-center gap-1.5 text-xs font-extrabold text-purple-700 bg-purple-50 hover:bg-purple-100 px-4 py-2.5 rounded-full border border-purple-200 transition-all shadow-xs"
              >
                View Repository <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Documents Table */}
          {loading ? (
            <div className="py-20 text-center text-slate-400 text-sm space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-600" />
              <p className="font-mono text-xs text-slate-500">Synchronizing database records...</p>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm border-2 border-dashed border-purple-200/70 rounded-3xl bg-purple-50/20 p-8 space-y-3">
              <UploadCloud className="w-10 h-10 text-purple-300 mx-auto" />
              <h4 className="font-bold text-slate-800">No parcel labels found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Upload your first parcel label or invoice to extract shipping details automatically.
              </p>
              <Link
                to="/upload"
                className="pill-button-dark inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold"
              >
                Upload Document Now
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-purple-100 bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-purple-100 bg-purple-50/40 text-slate-500 uppercase tracking-wider font-extrabold text-[11px]">
                    <th className="py-3.5 px-4">Document Title</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-center">Confidence Score</th>
                    <th className="py-3.5 px-4 text-center">Processing Speed</th>
                    <th className="py-3.5 px-4">Created Date</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredDocs.slice(0, 8).map((doc) => {
                    const badge = getStatusBadgeConfig(doc.status);
                    const ext = doc.file_name?.split('.').pop()?.toUpperCase() || 'FILE';

                    return (
                      <tr key={doc.id} className="hover:bg-purple-50/30 transition-colors group">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 font-extrabold text-[10px] shrink-0 font-mono">
                              {ext}
                            </div>
                            <span className="font-bold text-slate-800 group-hover:text-purple-700 transition-colors truncate max-w-sm">
                              {doc.file_name}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${badge.bgClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
                            {badge.label}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="font-mono font-bold text-slate-700">
                            {formatConfidence(doc.overall_confidence)}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                          {doc.processing_time ? `${doc.processing_time} ms` : '-'}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 font-medium">
                          {formatDate(doc.created_at)}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <Link
                            to={`/document/${doc.id}`}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-900 border border-purple-200/80 rounded-full text-xs font-bold transition-all shadow-xs"
                          >
                            Inspect <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
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
