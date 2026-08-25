import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  Square,
  Filter,
  Layers,
  Sparkles
} from 'lucide-react';

export default function DocumentsList() {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

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

  const handleSingleDelete = async (id, fileName) => {
    if (!window.confirm(t('documents.deleteConfirm', { name: fileName || t('documents.documentFile') }))) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteDocument(id);
      setSelectedIds(prev => prev.filter(item => item !== id));
      loadDocs();
    } catch (err) {
      alert(t('documents.failedDelete') + (err.response?.data?.error || err.message));
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(t('documents.bulkDeleteConfirm', { count: selectedIds.length }))) {
      setBulkDeleting(true);
      try {
        for (const id of selectedIds) {
          await deleteDocument(id);
        }
        setSelectedIds([]);
        loadDocs();
      } catch (err) {
        alert(t('documents.failedBulkDelete') + (err.response?.data?.error || err.message));
      } finally {
        setBulkDeleting(false);
      }
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
    <Layout title={t('nav.documents')}>
      <div className="space-y-6 pb-12">
        
        {/* Top Control Bar */}
        <div className="ui-card p-6 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 shadow-sm shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {t('documents.title')} <span className="font-normal text-purple-700">{t('documents.titleHighlight')}</span>
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{t('documents.subtitle')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/upload"
                className="pill-button-dark flex items-center gap-2 px-6 py-2.5 text-xs font-extrabold shadow-md"
              >
                <UploadCloud className="w-4 h-4 text-purple-300" /> {t('documents.uploadLabel')}
              </Link>
            </div>
          </div>

          {/* Filters & Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-purple-100/80">
            
            {/* Status Tabs */}
            <div className="flex items-center gap-1 bg-purple-100/60 p-1 border border-purple-200/80 rounded-full overflow-x-auto">
              {['ALL', 'COMPLETED', 'NEEDS_REVIEW', 'FAILED'].map((st) => (
                <button
                  key={st}
                  id={st === 'ALL' ? 'status-filter' : undefined}
                  onClick={() => setStatusFilter(st)}
                  className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all whitespace-nowrap ${
                    statusFilter === st
                      ? 'bg-purple-200/90 text-purple-950 border border-purple-300 shadow-xs'
                      : 'text-purple-800/80 hover:text-purple-950 hover:bg-white/80'
                  }`}
                >
                  {st === 'ALL' ? t('documents.allRecords') : st === 'COMPLETED' ? t('status.completed') : st === 'NEEDS_REVIEW' ? t('status.needsReview') : t('status.failed')}
                </button>
              ))}
            </div>

            {/* Search and Bulk Controls */}
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <div className="relative flex-1 min-w-[180px] sm:w-64">
                <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="search-input"
                  type="text"
                  placeholder={t('documents.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-purple-50/40 border border-purple-200/80 rounded-full pl-9 pr-4 py-2.5 text-xs text-slate-800 placeholder-purple-300 outline-none focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-200 transition-all font-medium shadow-xs"
                />
              </div>

              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    id="master-export-btn"
                    onClick={() => setIsExportModalOpen(true)}
                    className="pill-button-dark flex items-center gap-1.5 px-4 py-2 text-xs font-bold shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5 text-purple-300" /> {t('documents.exportSelected')} ({selectedIds.length})
                  </button>

                  <button
                    onClick={handleBulkDelete}
                    disabled={bulkDeleting}
                    className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200 rounded-full text-xs font-bold transition-colors shadow-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> {bulkDeleting ? t('documents.deleting') : `${t('documents.deleteSelected')} (${selectedIds.length})`}
                  </button>
                </div>
              )}

              <button
                onClick={loadDocs}
                title={t('common.refresh')}
                className="p-2.5 text-purple-600 hover:text-purple-900 bg-purple-50 border border-purple-200/80 hover:bg-purple-100 rounded-full transition-all shadow-xs shrink-0 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

          </div>
        </div>

        {/* Table View */}
        <div className="ui-card overflow-hidden shadow-xl border border-purple-100 rounded-3xl">
          {loading ? (
            <div className="py-20 text-center text-slate-500 text-xs space-y-3 font-mono">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-600" />
              {t('documents.loadingCatalog')}
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="py-20 text-center text-slate-500 text-xs bg-purple-50/20 font-medium">
              {t('documents.noMatchingDocs')}
            </div>
          ) : (
            <div className="overflow-x-auto bg-white">
              <table className="w-full text-left text-xs border-collapse min-w-[700px]" id="documents-table">
                <thead>
                  <tr className="bg-purple-50/50 border-b border-purple-100 text-slate-500 uppercase tracking-wider font-extrabold text-[11px]">
                    <th className="py-4 px-4 w-10 border-r border-purple-100/60">
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={selectedIds.length > 0 && selectedIds.length === filteredDocs.length}
                        className="rounded border-purple-300 text-purple-600 focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="py-4 px-4 border-r border-purple-100/60">{t('documents.documentFile')}</th>
                    <th className="py-4 px-4 border-r border-purple-100/60">{t('fields.status')}</th>
                    <th className="py-4 px-4 border-r border-purple-100/60 text-center">{t('documents.confidenceScore')}</th>
                    <th className="py-4 px-4 border-r border-purple-100/60 text-center">{t('documents.processingSpeed')}</th>
                    <th className="py-4 px-4 border-r border-purple-100/60">{t('documents.createdDate')}</th>
                    <th className="py-4 px-4 text-right">{t('common.action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredDocs.map((doc) => {
                    const badge = getStatusBadgeConfig(doc.status);
                    const isSelected = selectedIds.includes(doc.id);
                    const ext = doc.file_name?.split('.').pop()?.toUpperCase() || 'FILE';

                    return (
                      <tr key={doc.id} className={`hover:bg-purple-50/30 transition-colors ${isSelected ? 'bg-purple-50/60' : ''}`}>
                        <td className="py-3.5 px-4 border-r border-purple-100/60">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(doc.id)}
                            className="rounded border-purple-300 text-purple-600 focus:ring-0 cursor-pointer"
                          />
                        </td>
                        <td className="py-3.5 px-4 border-r border-purple-100/60">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 font-bold uppercase text-[10px] shrink-0 font-mono">
                              {ext}
                            </div>
                            <span className="font-extrabold text-slate-800 truncate max-w-xs">{doc.file_name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 border-r border-purple-100/60">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${badge.bgClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 border-r border-purple-100/60 text-center font-mono font-extrabold text-slate-800">
                          {formatConfidence(doc.overall_confidence)}
                        </td>
                        <td className="py-3.5 px-4 border-r border-purple-100/60 text-center font-mono text-slate-500 font-medium">
                          {doc.processing_time ? `${doc.processing_time} ms` : '-'}
                        </td>
                        <td className="py-3.5 px-4 border-r border-purple-100/60 text-slate-500 font-medium">
                          {formatDate(doc.created_at)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/document/${doc.id}`}
                              className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 rounded-full text-xs font-bold transition-all shadow-xs"
                            >
                              {t('documents.inspect')} <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              onClick={() => handleSingleDelete(doc.id, doc.file_name)}
                              disabled={deletingId === doc.id}
                              title={t('common.delete')}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all border border-transparent hover:border-rose-200 disabled:opacity-50"
                            >
                              <Trash2 className={`w-4 h-4 ${deletingId === doc.id ? 'animate-spin' : ''}`} />
                            </button>
                          </div>
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

