import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { getDocuments } from '../services/api';
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
  PackageCheck
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
        
        {/* Hero Card Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 p-8 shadow-2xl">
          {/* Ambient Lighting Gradients */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-10 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/15 border border-indigo-500/30 rounded-full text-xs font-semibold text-indigo-300">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" /> Next-Gen Multimodal OCR Engine
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                Template-Independent Shipping & Parcel Label Parsing
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed font-normal">
                Extract AWB tracking codes, courier logistics, recipient addresses, line item SKUs, tax GSTIN, and monetary amounts automatically from any label layout without predefined pixel templates.
              </p>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <Link
                to="/upload"
                className="flex items-center gap-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-xl shadow-indigo-600/30 transition-all duration-200 hover:scale-[1.02] border border-indigo-400/30"
              >
                <UploadCloud className="w-5 h-5" />
                Upload New Label
              </Link>
            </div>
          </div>
        </div>

        {/* Executive KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* Total Documents */}
          <div className="bg-slate-900/90 border border-slate-800/90 hover:border-indigo-500/40 rounded-2xl p-5 shadow-lg transition-all duration-200 hover:-translate-y-0.5 group">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Labels</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-white font-mono tracking-tight">{stats.total_documents || 0}</p>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
              <TrendingUp className="w-3 h-3 text-indigo-400" /> Processed across session
            </div>
          </div>

          {/* Completed */}
          <div className="bg-slate-900/90 border border-slate-800/90 hover:border-emerald-500/40 rounded-2xl p-5 shadow-lg transition-all duration-200 hover:-translate-y-0.5 group">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Successfully Parsed</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">{stats.completed || 0}</p>
            <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-400/90 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Validated extraction
            </div>
          </div>

          {/* Needs Review */}
          <div className="bg-slate-900/90 border border-slate-800/90 hover:border-amber-500/40 rounded-2xl p-5 shadow-lg transition-all duration-200 hover:-translate-y-0.5 group">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Needs Review</span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-amber-400 font-mono tracking-tight">{stats.needs_review || 0}</p>
            <div className="mt-2 flex items-center gap-1 text-[11px] text-amber-400/90 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Low confidence fields
            </div>
          </div>

          {/* Failed */}
          <div className="bg-slate-900/90 border border-slate-800/90 hover:border-rose-500/40 rounded-2xl p-5 shadow-lg transition-all duration-200 hover:-translate-y-0.5 group">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Failed / Errors</span>
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-rose-400 font-mono tracking-tight">{stats.failed || 0}</p>
            <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span> Unreadable media
            </div>
          </div>

          {/* Average Confidence */}
          <div className="bg-slate-900/90 border border-slate-800/90 hover:border-sky-500/40 rounded-2xl p-5 shadow-lg transition-all duration-200 hover:-translate-y-0.5 group">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Avg Confidence</span>
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-sky-400 font-mono tracking-tight">{formatConfidence(stats.avg_confidence)}</p>
            <div className="mt-2 w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="h-full bg-sky-400 rounded-full transition-all duration-500" 
                style={{ width: `${Math.round((stats.avg_confidence || 0) * 100)}%` }}
              />
            </div>
          </div>

        </div>

        {/* Recent Processed Labels Section */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 shadow-2xl space-y-5">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-indigo-400" /> Recent Extracted Parcel Documents
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Live feed of parsed shipping labels and metadata</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by filename or status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all w-52 sm:w-72"
                />
              </div>

              <button
                onClick={loadDashboardData}
                title="Refresh Table Data"
                className="p-2.5 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl transition-all shadow-sm"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <Link
                to="/documents"
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3.5 py-2 rounded-xl border border-indigo-500/20 transition-all"
              >
                View Repository <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Table Container */}
          {loading ? (
            <div className="py-20 text-center text-slate-400 text-sm space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-400" />
              <p className="font-mono text-xs text-slate-400">Synchronizing database records...</p>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/40 p-8 space-y-3">
              <UploadCloud className="w-10 h-10 text-slate-600 mx-auto" />
              <h4 className="font-bold text-slate-300">No parcel labels found</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Upload your first parcel label or invoice to extract shipping details automatically.
              </p>
              <Link
                to="/upload"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all"
              >
                Upload Document Now
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/50">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 uppercase tracking-wider font-bold text-[11px]">
                    <th className="py-3.5 px-4">Document Title</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-center">Confidence Score</th>
                    <th className="py-3.5 px-4 text-center">Processing Speed</th>
                    <th className="py-3.5 px-4">Created Date</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredDocs.slice(0, 8).map((doc) => {
                    const badge = getStatusBadgeConfig(doc.status);
                    const ext = doc.file_name?.split('.').pop()?.toUpperCase() || 'FILE';

                    return (
                      <tr key={doc.id} className="hover:bg-slate-900/60 transition-colors group">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-extrabold text-[10px] shrink-0 font-mono">
                              {ext}
                            </div>
                            <span className="font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors truncate max-w-sm">
                              {doc.file_name}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badge.bgClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
                            {badge.label}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-mono font-bold text-slate-200">
                              {formatConfidence(doc.overall_confidence)}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                          {doc.processing_time ? `${doc.processing_time} ms` : '-'}
                        </td>

                        <td className="py-3.5 px-4 text-slate-400 font-medium">
                          {formatDate(doc.created_at)}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <Link
                            to={`/document/${doc.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/25 text-indigo-300 hover:text-white border border-indigo-500/25 hover:border-indigo-500/40 rounded-xl text-xs font-semibold transition-all shadow-sm"
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

