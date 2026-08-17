import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { getDocuments, exportMasterExcel } from '../services/api';
import { getStatusBadgeConfig, formatDate, formatConfidence } from '../utils/formatters';
import { 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Zap, 
  UploadCloud, 
  ArrowRight, 
  RefreshCw,
  Search,
  ExternalLink,
  Sparkles,
  TrendingUp,
  SlidersHorizontal,
  PackageCheck,
  Download,
  Layers
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_documents: 0,
    completed: 0,
    needs_review: 0,
    failed: 0,
    avg_confidence: 0
  });
  const [recentDocs, setRecentDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [exportingMaster, setExportingMaster] = useState(false);

  const handleExportMaster = async () => {
    setExportingMaster(true);
    try {
      const response = await exportMasterExcel();
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `master_report_orders_stock_returns_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Master Export failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setExportingMaster(false);
    }
  };

  const loadDashboardData = () => {
    setLoading(true);
    getDocuments()
      .then(res => {
        setStats(res.stats || {});
        setRecentDocs(res.documents || []);
      })
      .catch(err => console.error('Dashboard load error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const filteredDocs = recentDocs.filter(d => 
    d.file_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout title="Document Intelligence Dashboard">
      <div className="space-y-8 pb-10">
        
        {/* Executive Hero Banner with Light Pastel Card & Ambient Lavender Glow */}
        <div className="relative overflow-hidden rounded-3xl pastel-light-hero p-8 sm:p-10 shadow-lg shadow-purple-900/5 text-slate-900">
          {/* Subtle Ambient Background Pastel Blobs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-80 h-80 bg-blue-200/30 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-4 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/90 border border-purple-200/80 rounded-full text-xs font-extrabold text-purple-900 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Next-Gen Multimodal Vision Engine
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-slate-900">
                Discover high-accuracy parcel <span className="font-serif-italic font-normal text-purple-700 underline decoration-purple-300 decoration-wavy">extractions</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl font-medium">
                Extract AWB tracking codes, courier logistics, recipient addresses, line item SKUs, tax GSTIN, and monetary amounts automatically from any label layout without predefined pixel templates.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <button
                id="export-master-excel-btn"
                onClick={handleExportMaster}
                disabled={exportingMaster}
                className="flex items-center gap-2.5 bg-emerald-100/90 hover:bg-emerald-200/90 text-emerald-950 font-extrabold text-xs sm:text-sm px-6 py-3.5 rounded-full shadow-xs transition-all duration-200 hover:scale-[1.02] border border-emerald-300/80 disabled:opacity-50 cursor-pointer"
                title="Download single master Excel containing 3 sheets: Orders, Stock, and Returns"
              >
                <Download className={`w-4 h-4 text-emerald-700 ${exportingMaster ? 'animate-bounce' : ''}`} />
                {exportingMaster ? 'Generating...' : 'Master Excel (All 3)'}
              </button>

              <Link
                to="/upload"
                className="pill-button-dark flex items-center gap-2.5 px-7 py-3.5 text-xs sm:text-sm font-extrabold shadow-sm"
              >
                <UploadCloud className="w-4 h-4 text-purple-600" />
                Upload New Label
              </Link>
            </div>
          </div>
        </div>

        {/* Executive KPI Metric Cards (Uniform Professional Light Styling with Pastel Accents) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* Total Documents */}
          <div className="ui-card ui-card-hover p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Total Labels</span>
              <div className="w-9 h-9 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-xs">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">{stats.total_documents || 0}</p>
            <div className="flex items-center gap-1.5 text-[11px] text-purple-600 font-semibold">
              <TrendingUp className="w-3 h-3 text-purple-600" /> Processed across session
            </div>
          </div>

          {/* Completed */}
          <div className="ui-card ui-card-hover p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Successfully Parsed</span>
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-emerald-600 font-mono tracking-tight">{stats.completed || 0}</p>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Validated extraction
            </div>
          </div>

          {/* Needs Review */}
          <div className="ui-card ui-card-hover p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Needs Review</span>
              <div className="w-9 h-9 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-xs">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-amber-600 font-mono tracking-tight">{stats.needs_review || 0}</p>
            <div className="flex items-center gap-1 text-[11px] text-amber-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Low confidence fields
            </div>
          </div>

          {/* Failed */}
          <div className="ui-card ui-card-hover p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Failed / Errors</span>
              <div className="w-9 h-9 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-xs">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-rose-600 font-mono tracking-tight">{stats.failed || 0}</p>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span> Unreadable media
            </div>
          </div>

          {/* Average Confidence */}
          <div className="ui-card ui-card-hover p-5 space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Avg Confidence</span>
              <div className="w-9 h-9 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 shadow-xs">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-violet-700 font-mono tracking-tight">{formatConfidence(stats.avg_confidence)}</p>
            <div className="w-full bg-purple-100/70 h-1.5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-violet-600 rounded-full transition-all duration-500" 
                style={{ width: `${Math.round((stats.avg_confidence || 0) * 100)}%` }}
              />
            </div>
          </div>

        </div>

        {/* Recent Extracted Documents Section */}
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
                onClick={loadDashboardData}
                title="Refresh Table Data"
                className="p-2.5 text-purple-600 hover:text-purple-900 bg-purple-50 border border-purple-200/80 hover:bg-purple-100 rounded-full transition-all shadow-xs"
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

          {/* Table Container */}
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




