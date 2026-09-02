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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in font-sans" style={{ background: 'rgba(29,26,57,0.5)', backdropFilter: 'blur(8px)' }}>
      <div className="rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6 relative overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
        
        {/* Glow Background */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(174,68,90,0.06)' }} />

        {/* Header */}
        <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
          <div>
            <h3 className="text-base font-extrabold flex items-center gap-2" style={{ color: 'var(--color-navy)' }}>
              <Download className="w-4 h-4" style={{ color: 'var(--color-rose)' }} /> {t('export.title', { defaultValue: 'Export Shipping Label Data' })}
            </h3>
            <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--color-text-muted)' }}>
              {selectedDocumentIds.length > 0
                ? t('export.selectedCount', { count: selectedDocumentIds.length, defaultValue: `Exporting ${selectedDocumentIds.length} selected document(s)` })
                : t('export.allDocs', { defaultValue: 'Exporting all documents in catalog' })}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full transition-colors" style={{ color: 'var(--color-text-muted)' }}>
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Format Selection List */}
        <div className="space-y-2.5">
          <label className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: 'var(--color-text-muted)' }}>{t('export.selectFormat', { defaultValue: 'Select Target Format' })}</label>
          <div className="space-y-2">
            {formats.map((f) => {
              const Icon = f.icon;
              const isSelected = format === f.id;
              return (
                <div
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  className="flex items-center gap-3.5 p-3.5 rounded-2xl border cursor-pointer transition-all"
                  style={isSelected ? {
                    background: 'var(--color-accent-light)', border: '2px solid var(--color-rose)', boxShadow: '0 0 0 3px rgba(174,68,90,0.08)'
                  } : {
                    background: 'var(--color-surface-muted)', border: '1px solid var(--color-border-light)'
                  }}
                >
                  <div className="p-2.5 rounded-xl shadow-sm" style={isSelected ? { background: 'linear-gradient(135deg, var(--color-navy), var(--color-deep-purple))', color: 'var(--color-blush-light)' } : { background: 'var(--color-surface-warm)', border: '1px solid var(--color-border-light)', color: 'var(--color-plum)' }}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold" style={{ color: isSelected ? 'var(--color-navy)' : 'var(--color-text-primary)' }}>
                      {f.label}
                    </h4>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Options */}
        <div className="p-4 rounded-2xl space-y-2" style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border-light)' }}>
          <label className="flex items-center gap-3 text-xs font-semibold cursor-pointer" style={{ color: 'var(--color-text-secondary)' }}>
            <input
              type="checkbox"
              checked={includeRaw}
              onChange={(e) => setIncludeRaw(e.target.checked)}
              className="rounded cursor-pointer"
            />
            {t('export.includeRaw', { defaultValue: 'Include Raw Unstructured Gemini Responses' })}
          </label>
          <p className="text-[10px] font-mono pl-6" style={{ color: 'var(--color-text-muted)' }}>
            {t('export.includeRawDesc', { defaultValue: 'Appends original raw AI payloads to output document' })}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2" style={{ borderTop: '1px solid var(--color-border-light)' }}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold rounded-full transition-colors"
            style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-light)' }}
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
                <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--color-amber)' }} /> {t('export.exported', { defaultValue: 'Exported!' })}
              </>
            ) : (
              <>
                <Download className="w-4 h-4" style={{ color: 'var(--color-blush)' }} /> {t('common.export')} {format.toUpperCase()}
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
