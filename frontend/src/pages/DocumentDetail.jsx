import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import DocumentViewer from '../components/DocumentViewer';
import ExtractionFields from '../components/ExtractionFields';
import JsonViewer from '../components/JsonViewer';
import RawResponseViewer from '../components/RawResponseViewer';
import EditFieldModal from '../components/EditFieldModal';
import ExportModal from '../components/ExportModal';
import { getDocumentById, updateFieldCorrection, deleteDocument } from '../services/api';
import { getStatusBadgeConfig, formatDate, formatConfidence } from '../utils/formatters';
import { 
  ArrowLeft, RefreshCw, Download, Trash2, Eye, FileText, Code, Terminal,
  Zap, Clock, ShieldCheck, History, Sparkles
} from 'lucide-react';

export default function DocumentDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [documentData, setDocumentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('extracted');
  const [editingField, setEditingField] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedLabelIdx, setSelectedLabelIdx] = useState(0);

  const fetchDetail = () => {
    setLoading(true);
    getDocumentById(id).then(res => setDocumentData(res.document)).catch(err => console.error('Error fetching document detail:', err)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchDetail(); }, [id]);

  const handleSaveCorrection = async (fieldName, originalVal, correctedVal) => { await updateFieldCorrection(id, fieldName, originalVal, correctedVal); fetchDetail(); };
  const handleDelete = async () => { if (window.confirm(t('documents.deleteConfirmRecord', { defaultValue: 'Are you sure you want to delete this document extraction record?' }))) { await deleteDocument(id); navigate('/documents'); } };

  const S = { accent: 'var(--color-accent)', brown: 'var(--color-brown-dark)', border: 'var(--color-border-light)', muted: 'var(--color-text-muted)', surface: 'var(--color-surface-muted)', text: 'var(--color-text-primary)', secondary: 'var(--color-text-secondary)' };

  if (loading) {
    return (
      <Layout title={t('documents.detailTitle', { defaultValue: 'Document Details' })}>
        <div className="py-24 text-center space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto" style={{ color: S.accent }} />
          <p className="font-mono text-xs font-medium" style={{ color: S.muted }}>{t('documents.loadingWorkspace', { defaultValue: 'Loading document extraction workspace...' })}</p>
        </div>
      </Layout>
    );
  }

  if (!documentData) {
    return (
      <Layout title={t('documents.notFound', { defaultValue: 'Document Not Found' })}>
        <div className="py-20 text-center space-y-4">
          <p className="font-medium" style={{ color: S.muted }}>{t('documents.notFoundSubtitle', { defaultValue: 'Document record not found or deleted.' })}</p>
          <Link to="/documents" className="inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-xs font-bold shadow-md"
            style={{ background: S.brown }}><ArrowLeft className="w-4 h-4" /> {t('documents.backToDocs', { defaultValue: 'Back to Documents' })}</Link>
        </div>
      </Layout>
    );
  }

  const badge = getStatusBadgeConfig(documentData.status);

  const tabConfig = [
    { id: 'extracted', icon: FileText, label: t('documents.extractedInfo', { defaultValue: 'Extracted Info' }) },
    { id: 'json', icon: Code, label: t('documents.jsonView', { defaultValue: 'JSON View' }) },
    { id: 'debug', icon: Terminal, label: t('documents.developerDebug', { defaultValue: 'Developer Debug' }) },
  ];

  if (documentData.corrections?.length > 0) {
    tabConfig.push({ id: 'corrections', icon: History, label: `${t('documents.corrections', { defaultValue: 'Corrections' })} (${documentData.corrections.length})` });
  }

  return (
    <Layout title={`${t('documents.documentFile')}: ${documentData.file_name}`}>
      <div className="space-y-6 pb-12">
        
        {/* Header */}
        <div className="ui-card p-6 space-y-5" style={{ boxShadow: 'var(--shadow-lg)' }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/documents')} className="p-2.5 rounded-xl transition-colors"
                style={{ background: 'var(--color-surface)', border: `1px solid ${S.border}`, color: S.secondary, boxShadow: 'var(--shadow-xs)' }}>
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl font-extrabold tracking-tight truncate max-w-sm font-serif" style={{ color: S.brown }}>{documentData.file_name}</h1>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold border ${badge.bgClass}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />{badge.label}
                  </span>
                </div>
                <p className="text-xs flex items-center gap-3 mt-1 font-mono font-medium" style={{ color: S.muted }}>
                  <span>{t('documents.createdDate')}: {formatDate(documentData.created_at)}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-bold" style={{ color: S.accent }}><Clock className="w-3.5 h-3.5" /> {documentData.processing_time || 0}ms</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-bold" style={{ color: 'var(--color-success)' }}><Zap className="w-3.5 h-3.5" /> {formatConfidence(documentData.overall_confidence)}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => setIsExportModalOpen(true)} className="pill-button-dark flex items-center gap-2 px-6 py-2.5 text-xs font-extrabold">
                <Download className="w-3.5 h-3.5" /> {t('documents.exportData', { defaultValue: 'Export Data' })}
              </button>
              <button onClick={handleDelete} className="p-2.5 rounded-xl transition-colors"
                style={{ background: 'var(--color-surface)', border: `1px solid ${S.border}`, color: S.muted }}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left: Document Viewer */}
          <div className="lg:col-span-5 h-[480px] sm:h-[560px] lg:h-[720px] lg:sticky lg:top-24 ui-card p-4 rounded-3xl"
            style={{ boxShadow: 'var(--shadow-lg)', border: `1px solid ${S.border}` }}>
            <DocumentViewer fileUrl={documentData.file_url} fileName={documentData.file_name} fileType={documentData.file_type} activePage={selectedLabelIdx + 1} />
          </div>

          {/* Right: Tabs & Details */}
          <div className="lg:col-span-7 ui-card p-6 rounded-3xl space-y-6" style={{ boxShadow: 'var(--shadow-lg)', border: `1px solid ${S.border}` }}>
            
            {/* Tab Bar */}
            <div className="flex items-center justify-between pb-4 overflow-x-auto" style={{ borderBottom: `1px solid ${S.border}` }}>
              <div className="flex items-center gap-1.5 p-1 rounded-xl" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
                {tabConfig.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer"
                      style={activeTab === tab.id
                        ? { background: S.brown, color: '#fff', boxShadow: 'var(--shadow-xs)' }
                        : { color: S.secondary }}>
                      <Icon className="w-4 h-4" /> {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div>
              {activeTab === 'extracted' && (
                <ExtractionFields structuredJson={documentData.structured_json} warnings={documentData.error_message ? documentData.error_message.split('; ') : []}
                  onEditField={(name, val) => setEditingField({ name, val })} selectedLabelIdx={selectedLabelIdx} onSelectLabel={setSelectedLabelIdx} />
              )}
              {activeTab === 'json' && <JsonViewer jsonData={documentData.structured_json} fileName={documentData.file_name} />}
              {activeTab === 'debug' && <RawResponseViewer rawResponse={documentData.raw_response} processingTime={documentData.processing_time} warnings={documentData.error_message ? documentData.error_message.split('; ') : []} structuredJson={documentData.structured_json} />}
              {activeTab === 'corrections' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider mb-2" style={{ color: S.muted }}>
                    {t('documents.manualCorrectionLog', { defaultValue: 'Manual Field Correction Log' })} ({documentData.corrections.length})
                  </h4>
                  <div className="space-y-2">
                    {documentData.corrections.map((corr) => (
                      <div key={corr.id} className="p-4 rounded-2xl text-xs font-mono" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
                        <div className="flex items-center justify-between font-bold mb-1.5" style={{ color: S.accent }}>
                          <span>Field: {corr.field_name}</span>
                          <span className="text-[10px] font-sans" style={{ color: S.muted }}>{formatDate(corr.created_at)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2" style={{ color: S.secondary }}>
                          <div><span className="text-[10px] block uppercase font-bold" style={{ color: 'var(--color-danger)' }}>{t('documents.original', { defaultValue: 'Original' })}</span><span className="line-through" style={{ color: S.muted }}>{corr.original_value || 'null'}</span></div>
                          <div><span className="text-[10px] block uppercase font-bold" style={{ color: 'var(--color-success)' }}>{t('documents.corrected', { defaultValue: 'Corrected' })}</span><span className="font-bold" style={{ color: 'var(--color-success)' }}>{corr.corrected_value}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modals */}
        {editingField && <EditFieldModal isOpen={!!editingField} onClose={() => setEditingField(null)} fieldName={editingField.name} currentValue={editingField.val} onSave={handleSaveCorrection} />}
        <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} selectedDocumentIds={[documentData.id]} />
      </div>
    </Layout>
  );
}
