import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import ExportModal from '../components/ExportModal';
import { getDocuments, deleteDocument } from '../services/api';
import { getStatusBadgeConfig, formatDate, formatConfidence } from '../utils/formatters';
import { 
  FileText, 
  Search, 
  Download, 
  Trash2, 
  RefreshCw, 
  ExternalLink, 
  UploadCloud,
  CheckSquare,
  Square
} from 'lucide-react';

export default function DocumentsList() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const loadDocs = () => {
    setLoading(true);
    getDocuments()
      .then(res => setDocuments(res.documents || []))
      .catch(err => console.error('Failed to load documents:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredDocs.map(d => d.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} document(s)?`)) {
      for (const id of selectedIds) {
        await deleteDocument(id);
      }
      setSelectedIds([]);
      loadDocs();
    }
  };

  const filteredDocs = documents.filter(d => {
    const matchesSearch = (
      d.file_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.status?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Layout title="All Shipping Label Documents">
      <div className="space-y-6">
        
        {/* Top Control Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Parsed Parcel Document Repository</h1>
              <p className="text-xs text-slate-400">Search, filter, export, or audit extracted parcel labels</p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/upload"
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
              >
                <UploadCloud className="w-4 h-4" /> Upload Label
              </Link>
            </div>
          </div>

          {/* Filters & Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-800">
            
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 border border-slate-800 rounded-xl overflow-x-auto">
              {['ALL', 'COMPLETED', 'NEEDS_REVIEW', 'FAILED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    statusFilter === st
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st === 'ALL' ? 'All Documents' : st.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Search and Bulk Controls */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search file name or status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsExportModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" /> Export ({selectedIds.length})
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="p-2 text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 rounded-xl transition-colors"
                    title="Delete Selected"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              <button
                onClick={loadDocs}
                title="Refresh Table"
                className="p-2 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-xl transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

          </div>
        </div>

        {/* Table View */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              Loading document catalog...
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              No matching documents found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-3.5 px-4 w-10">
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={selectedIds.length > 0 && selectedIds.length === filteredDocs.length}
                        className="rounded border-slate-800 text-indigo-600 focus:ring-0 bg-slate-900 cursor-pointer"
                      />
                    </th>
                    <th className="py-3.5 px-4">Document</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-center">Confidence</th>
                    <th className="py-3.5 px-4 text-center">Processing Speed</th>
                    <th className="py-3.5 px-4">Created Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredDocs.map((doc) => {
                    const badge = getStatusBadgeConfig(doc.status);
                    const isSelected = selectedIds.includes(doc.id);

                    return (
                      <tr key={doc.id} className={`hover:bg-slate-800/40 transition-colors ${isSelected ? 'bg-indigo-600/10' : ''}`}>
                        <td className="py-3.5 px-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(doc.id)}
                            className="rounded border-slate-800 text-indigo-600 focus:ring-0 bg-slate-900 cursor-pointer"
                          />
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold uppercase text-[10px] shrink-0">
                              {doc.file_type?.split('/')[1] || 'DOC'}
                            </div>
                            <span className="font-semibold text-slate-200 truncate max-w-sm">{doc.file_name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badge.bgClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-200">
                          {formatConfidence(doc.overall_confidence)}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                          {doc.processing_time ? `${doc.processing_time} ms` : '-'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {formatDate(doc.created_at)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            to={`/document/${doc.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-lg text-xs font-semibold transition-colors"
                          >
                            Inspect <ExternalLink className="w-3 h-3" />
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

        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          selectedDocumentIds={selectedIds}
        />

      </div>
    </Layout>
  );
}
