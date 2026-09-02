import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import ExportModal from '../components/ExportModal';
import { getDocuments, deleteDocument } from '../services/api';
import { getStatusBadgeConfig, formatDate, formatConfidence } from '../utils/formatters';
import { FileText, Search, Download, Trash2, RefreshCw, ExternalLink, UploadCloud, CheckSquare, Square, Filter, Layers, Sparkles } from 'lucide-react';

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

  const loadDocs = () => { setLoading(true); getDocuments().then(res => setDocuments(res.documents || [])).catch(err => console.error('Failed to load documents:', err)).finally(() => setLoading(false)); };
  useEffect(() => { loadDocs(); }, []);

  const handleSelectAll = (e) => { if (e.target.checked) setSelectedIds(filteredDocs.map(d => d.id)); else setSelectedIds([]); };
  const handleToggleSelect = (id) => { setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]); };

  const handleSingleDelete = async (id, fileName) => {
    if (!window.confirm(t('documents.deleteConfirm', { name: fileName || t('documents.documentFile') }))) return;
    setDeletingId(id);
    try { await deleteDocument(id); setSelectedIds(prev => prev.filter(item => item !== id)); loadDocs(); }
    catch (err) { alert(t('documents.failedDelete') + (err.response?.data?.error || err.message)); }
    finally { setDeletingId(null); }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(t('documents.bulkDeleteConfirm', { count: selectedIds.length }))) {
      setBulkDeleting(true);
      try { for (const id of selectedIds) await deleteDocument(id); setSelectedIds([]); loadDocs(); }
      catch (err) { alert(t('documents.failedBulkDelete') + (err.response?.data?.error || err.message)); }
      finally { setBulkDeleting(false); }
    }
  };

  const filteredDocs = documents.filter(d => {
    const matchesSearch = d.file_name?.toLowerCase().includes(searchQuery.toLowerCase()) || d.status?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const S = { accent: 'var(--color-rose)', navy: 'var(--color-navy)', border: 'var(--color-border-light)', muted: 'var(--color-text-muted)', surface: 'var(--color-surface-muted)', text: 'var(--color-text-primary)', secondary: 'var(--color-text-secondary)' };

  return (
    <Layout title={t('nav.documents')}>
      <div className="space-y-6 pb-12">
        {/* Top Control */}
        <div className="ui-card p-6 space-y-6" style={{ boxShadow: 'var(--shadow-lg)' }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm shrink-0" style={{ background: 'var(--color-accent-light)', border: '1px solid var(--color-accent-muted)', color: S.accent }}><Layers className="w-5 h-5" /></div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight font-serif" style={{ color: S.navy }}>{t('documents.title')} <span className="font-normal" style={{ color: S.accent }}>{t('documents.titleHighlight')}</span></h1>
                <p className="text-xs font-medium mt-0.5" style={{ color: S.muted }}>{t('documents.subtitle')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/upload" className="pill-button-dark flex items-center gap-2 px-6 py-2.5 text-xs font-extrabold"><UploadCloud className="w-4 h-4" /> {t('documents.uploadLabel')}</Link>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4" style={{ borderTop: `1px solid ${S.border}` }}>
            <div className="flex items-center gap-1 p-1 rounded-xl overflow-x-auto" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
              {['ALL', 'COMPLETED', 'NEEDS_REVIEW', 'FAILED'].map((st) => (
                <button key={st} id={st === 'ALL' ? 'status-filter' : undefined} onClick={() => setStatusFilter(st)}
                  className="px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer"
                  style={statusFilter === st ? { background: 'linear-gradient(135deg, var(--color-navy), var(--color-deep-purple))', color: 'var(--color-blush-light)', boxShadow: 'var(--shadow-xs)' } : { color: S.secondary }}>
                  {st === 'ALL' ? t('documents.allRecords') : st === 'COMPLETED' ? t('status.completed') : st === 'NEEDS_REVIEW' ? t('status.needsReview') : t('status.failed')}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <div className="relative flex-1 min-w-[180px] sm:w-64">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
                <input id="search-input" type="text" placeholder={t('documents.searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl pl-9 pr-4 py-2.5 text-xs transition-all font-medium" style={{ background: S.surface, border: `1px solid ${S.border}`, color: S.text }} />
              </div>
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <button id="master-export-btn" onClick={() => setIsExportModalOpen(true)} className="pill-button-dark flex items-center gap-1.5 px-4 py-2 text-xs font-bold"><Download className="w-3.5 h-3.5" /> {t('documents.exportSelected')} ({selectedIds.length})</button>
                  <button onClick={handleBulkDelete} disabled={bulkDeleting} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                    style={{ background: 'var(--color-danger-light)', color: 'var(--color-rose)', border: '1px solid var(--color-danger-border)' }}>
                    <Trash2 className="w-3.5 h-3.5" /> {bulkDeleting ? t('documents.deleting') : `${t('documents.deleteSelected')} (${selectedIds.length})`}
                  </button>
                </div>
              )}
              <button onClick={loadDocs} className="p-2.5 rounded-xl transition-all shrink-0 cursor-pointer" style={{ background: S.surface, border: `1px solid ${S.border}`, color: S.secondary }}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="ui-card overflow-hidden rounded-3xl" style={{ boxShadow: 'var(--shadow-lg)', border: `1px solid ${S.border}` }}>
          {loading ? (
            <div className="py-20 text-center text-xs space-y-3 font-mono"><RefreshCw className="w-6 h-6 animate-spin mx-auto" style={{ color: S.accent }} /> {t('documents.loadingCatalog')}</div>
          ) : filteredDocs.length === 0 ? (
            <div className="py-20 text-center text-xs font-medium" style={{ background: S.surface, color: S.muted }}>{t('documents.noMatchingDocs')}</div>
          ) : (
            <div className="overflow-x-auto" style={{ background: 'var(--color-surface)' }}>
              <table className="w-full text-left text-xs border-collapse min-w-[700px]" id="documents-table">
                <thead><tr style={{ background: S.surface, borderBottom: `1px solid ${S.border}`, color: S.muted }} className="uppercase tracking-wider font-extrabold text-[11px]">
                  <th className="py-4 px-4 w-10"><input type="checkbox" onChange={handleSelectAll} checked={selectedIds.length > 0 && selectedIds.length === filteredDocs.length} className="rounded cursor-pointer" /></th>
                  <th className="py-4 px-4">{t('documents.documentFile')}</th><th className="py-4 px-4">{t('fields.status')}</th>
                  <th className="py-4 px-4 text-center">{t('documents.confidenceScore')}</th><th className="py-4 px-4 text-center">{t('documents.processingSpeed')}</th>
                  <th className="py-4 px-4">{t('documents.createdDate')}</th><th className="py-4 px-4 text-right">{t('documents.actions')}</th>
                </tr></thead>
                <tbody className="divide-y" style={{ borderColor: S.border }}>
                  {filteredDocs.map((doc) => {
                    const badge = getStatusBadgeConfig(doc.status);
                    const isSelected = selectedIds.includes(doc.id);
                    const ext = doc.file_name?.split('.').pop()?.toUpperCase() || 'FILE';
                    return (
                      <tr key={doc.id} className="transition-colors" style={isSelected ? { background: 'var(--color-accent-light)' } : {}}>
                        <td className="py-3.5 px-4"><input type="checkbox" checked={isSelected} onChange={() => handleToggleSelect(doc.id)} className="rounded cursor-pointer" /></td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold uppercase text-[10px] shrink-0 font-mono"
                              style={{ background: 'var(--color-surface-warm)', border: `1px solid ${S.border}`, color: S.accent }}>{ext}</div>
                            <span className="font-extrabold truncate max-w-xs" style={{ color: S.text }}>{doc.file_name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4"><span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${badge.bgClass}`}><span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />{badge.label}</span></td>
                        <td className="py-3.5 px-4 text-center font-mono font-extrabold" style={{ color: S.text }}>{formatConfidence(doc.overall_confidence)}</td>
                        <td className="py-3.5 px-4 text-center font-mono font-medium" style={{ color: S.muted }}>{doc.processing_time ? `${doc.processing_time} ms` : '-'}</td>
                        <td className="py-3.5 px-4 font-medium" style={{ color: S.muted }}>{formatDate(doc.created_at)}</td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link to={`/document/${doc.id}`} className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all"
                              style={{ background: 'var(--color-surface-muted)', color: S.navy, border: '1px solid var(--color-border-light)' }}>
                              {t('documents.inspect')} <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                            <button onClick={() => handleSingleDelete(doc.id, doc.file_name)} disabled={deletingId === doc.id} className="p-1.5 rounded-full transition-all disabled:opacity-50" style={{ color: S.muted }}>
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

        <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} selectedDocumentIds={selectedIds} />
      </div>
    </Layout>
  );
}
