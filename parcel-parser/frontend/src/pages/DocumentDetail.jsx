import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  ArrowLeft, 
  RefreshCw, 
  Download, 
  Trash2, 
  Eye, 
  FileText, 
  Code, 
  Terminal, 
  Zap, 
  Clock, 
  ShieldCheck,
  History,
  Sparkles
} from 'lucide-react';

export default function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [documentData, setDocumentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('extracted'); // 'extracted' | 'json' | 'debug' | 'corrections'
  const [editingField, setEditingField] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const fetchDetail = () => {
    setLoading(true);
    getDocumentById(id)
      .then(res => setDocumentData(res.document))
      .catch(err => console.error('Error fetching document detail:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleSaveCorrection = async (fieldName, originalVal, correctedVal) => {
    await updateFieldCorrection(id, fieldName, originalVal, correctedVal);
    fetchDetail();
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this document extraction record?')) {
      await deleteDocument(id);
      navigate('/documents');
    }
  };

  if (loading) {
    return (
      <Layout title="Document Details">
        <div className="py-24 text-center text-slate-400 space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-400" />
          <p className="font-mono text-xs text-slate-400">Loading document extraction workspace...</p>
        </div>
      </Layout>
    );
  }

  if (!documentData) {
    return (
      <Layout title="Document Not Found">
        <div className="py-20 text-center space-y-4">
          <p className="text-slate-400">Document record not found or deleted.</p>
          <Link to="/documents" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">
            <ArrowLeft className="w-4 h-4" /> Back to Documents
          </Link>
        </div>
      </Layout>
    );
  }

  const badge = getStatusBadgeConfig(documentData.status);

  return (
    <Layout title={`Document: ${documentData.file_name}`}>
      <div className="space-y-6 pb-12">
        
        {/* Detail Page Header */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 shadow-2xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/documents')}
                className="p-2.5 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl transition-colors shadow-sm"
                title="Back to All Documents"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-lg font-extrabold text-white tracking-tight truncate max-w-sm">{documentData.file_name}</h1>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.bgClass}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
                    {badge.label}
                  </span>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-3 mt-1 font-mono">
                  <span>Created: {formatDate(documentData.created_at)}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-sky-400"><Clock className="w-3.5 h-3.5" /> {documentData.processing_time || 0}ms</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-emerald-400"><Zap className="w-3.5 h-3.5" /> {formatConfidence(documentData.overall_confidence)}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-extrabold rounded-xl transition-all shadow-lg shadow-indigo-600/30 border border-indigo-400/30"
              >
                <Download className="w-3.5 h-3.5" /> Export Data
              </button>
              <button
                onClick={handleDelete}
                className="p-2.5 text-slate-400 hover:text-rose-400 bg-slate-950 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 rounded-xl transition-colors"
                title="Delete Document"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

        {/* Split Screen Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Screen: Original Document Preview */}
          <div className="lg:col-span-5 h-[720px] sticky top-20 bg-slate-900/90 border border-slate-800/90 rounded-3xl p-4 shadow-2xl">
            <DocumentViewer
              fileUrl={documentData.file_url}
              fileName={documentData.file_name}
              fileType={documentData.file_type}
            />
          </div>

          {/* Right Screen: Extraction Tabs & Details */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 shadow-2xl space-y-5">
            
            {/* View Tabs */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 overflow-x-auto">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('extracted')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                    activeTab === 'extracted'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <FileText className="w-4 h-4" /> Extracted Information
                </button>

                <button
                  onClick={() => setActiveTab('json')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                    activeTab === 'json'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Code className="w-4 h-4" /> JSON View
                </button>

                <button
                  onClick={() => setActiveTab('debug')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                    activeTab === 'debug'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Terminal className="w-4 h-4 text-amber-400" /> Developer / Gemini Debug
                </button>

                {documentData.corrections && documentData.corrections.length > 0 && (
                  <button
                    onClick={() => setActiveTab('corrections')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                      activeTab === 'corrections'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <History className="w-4 h-4 text-emerald-400" /> Corrections ({documentData.corrections.length})
                  </button>
                )}
              </div>
            </div>

            {/* Tab Contents */}
            <div>
              {activeTab === 'extracted' && (
                <ExtractionFields
                  structuredJson={documentData.structured_json}
                  warnings={documentData.error_message ? documentData.error_message.split('; ') : []}
                  onEditField={(name, val) => setEditingField({ name, val })}
                />
              )}

              {activeTab === 'json' && (
                <JsonViewer
                  jsonData={documentData.structured_json}
                  fileName={documentData.file_name}
                />
              )}

              {activeTab === 'debug' && (
                <RawResponseViewer
                  rawResponse={documentData.raw_response}
                  processingTime={documentData.processing_time}
                  warnings={documentData.error_message ? documentData.error_message.split('; ') : []}
                  structuredJson={documentData.structured_json}
                />
              )}

              {activeTab === 'corrections' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                    Manual Field Correction Log ({documentData.corrections.length})
                  </h4>
                  <div className="space-y-2">
                    {documentData.corrections.map((corr) => (
                      <div key={corr.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs font-mono">
                        <div className="flex items-center justify-between text-indigo-400 font-bold mb-1.5">
                          <span>Field: {corr.field_name}</span>
                          <span className="text-[10px] text-slate-500 font-sans">{formatDate(corr.created_at)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-slate-300">
                          <div>
                            <span className="text-[10px] text-rose-400 block uppercase font-bold">Original</span>
                            <span className="line-through text-slate-500">{corr.original_value || 'null'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-emerald-400 block uppercase font-bold">Corrected</span>
                            <span className="text-emerald-300 font-semibold">{corr.corrected_value}</span>
                          </div>
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
        {editingField && (
          <EditFieldModal
            isOpen={!!editingField}
            onClose={() => setEditingField(null)}
            fieldName={editingField.name}
            currentValue={editingField.val}
            onSave={handleSaveCorrection}
          />
        )}

        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          selectedDocumentIds={[documentData.id]}
        />

      </div>
    </Layout>
  );
}
