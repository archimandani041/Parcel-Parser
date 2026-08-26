import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Download, FileJson, FileSpreadsheet, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { exportDocumentsData } from '../services/api';

export default function ExportModal({ isOpen, onClose, selectedDocumentIds = [] }) {
  const { t } = useTranslation();
  const [format, setFormat] = useState('json');
  const [includeRaw, setIncludeRaw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setLoading(true);
    setDownloadSuccess(false);
    try {
      const response = await exportDocumentsData(format, selectedDocumentIds);
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/octet-stream'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const extension = format === 'excel' ? 'xlsx' : format;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.setAttribute('download', `parcel_labels_export_${timestamp}.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => {
        setDownloadSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Export Error:', err);
      alert('Export failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };


  const formats = [
    { id: 'json', label: 'Structured JSON', desc: 'Hierarchical JSON schema object', icon: FileJson },
    { id: 'csv', label: 'CSV Spreadsheet', desc: 'Standard tabular CSV format', icon: FileText },
    { id: 'excel', label: 'Excel (XLSX)', desc: 'Formatted Microsoft Excel workbook', icon: FileSpreadsheet }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-md p-4 animate-fade-in font-sans">
      <div className="bg-white border border-amber-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Glow Background */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-200 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Download className="w-4 h-4 text-amber-700" /> {t('export.title', { defaultValue: 'Export Shipping Label Data' })}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              {selectedDocumentIds.length > 0
                ? t('export.selectedCount', { count: selectedDocumentIds.length, defaultValue: `Exporting ${selectedDocumentIds.length} selected document(s)` })
                : t('export.allDocs', { defaultValue: 'Exporting all documents in catalog' })}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 p-1.5 rounded-full hover:bg-amber-50 transition-colors">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Format Selection List */}
        <div className="space-y-2.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">{t('export.selectFormat', { defaultValue: 'Select Target Format' })}</label>
          <div className="space-y-2">
            {formats.map((f) => {
              const Icon = f.icon;
              const isSelected = format === f.id;
              return (
                <div
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  className={`flex items-center gap-3.5 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-200 shadow-sm'
                      : 'bg-amber-50/15 border-amber-200/80 hover:border-amber-300 hover:bg-amber-50/30'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-amber-700 text-white shadow-sm' : 'bg-amber-100 border border-amber-300 text-amber-800'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className={`text-xs font-extrabold ${isSelected ? 'text-amber-950' : 'text-slate-800'}`}>
                      {f.label}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Options */}
        <div className="bg-amber-50/30 p-4 rounded-2xl border border-amber-200 space-y-2">
          <label className="flex items-center gap-3 text-xs text-slate-700 font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={includeRaw}
              onChange={(e) => setIncludeRaw(e.target.checked)}
              className="rounded border-amber-400 text-amber-700 focus:ring-0 bg-white cursor-pointer"
            />
            {t('export.includeRaw', { defaultValue: 'Include Raw Unstructured Gemini Responses' })}
          </label>
          <p className="text-[10px] text-slate-500 font-mono pl-6">
            {t('export.includeRawDesc', { defaultValue: 'Appends original raw AI payloads to output document' })}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-amber-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-full transition-colors border border-amber-300/80"
          >
            {t('common.cancel')}
          </button>
          
          <button
            type="button"
            onClick={handleExport}
            disabled={loading}
            className="pill-button-dark flex items-center gap-2 px-6 py-2.5 text-xs font-extrabold shadow-md"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> {t('export.preparing', { defaultValue: 'Preparing File...' })}
              </>
            ) : downloadSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {t('export.exported', { defaultValue: 'Exported!' })}
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-amber-300" /> {t('common.export')} {format.toUpperCase()}
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

