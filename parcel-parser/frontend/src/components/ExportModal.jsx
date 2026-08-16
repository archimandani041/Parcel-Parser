import React, { useState } from 'react';
import { X, Download, FileJson, FileSpreadsheet, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { exportDocumentsData } from '../services/api';

export default function ExportModal({ isOpen, onClose, selectedDocumentIds = [] }) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800/90 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Glow Background */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-indigo-400" /> Export Shipping Label Data
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedDocumentIds.length > 0
                ? `Exporting ${selectedDocumentIds.length} selected document(s)`
                : 'Exporting all documents in catalog'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Format Selection List */}
        <div className="space-y-2.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Select Target Format</label>
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
                      ? 'bg-indigo-600/20 border-indigo-500/80 ring-1 ring-indigo-500/40 shadow-lg'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-900 border border-slate-800 text-slate-400'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className={`text-xs font-extrabold ${isSelected ? 'text-indigo-200' : 'text-slate-200'}`}>
                      {f.label}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Options */}
        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-2">
          <label className="flex items-center gap-3 text-xs text-slate-300 font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={includeRaw}
              onChange={(e) => setIncludeRaw(e.target.checked)}
              className="rounded border-slate-700 text-indigo-600 focus:ring-0 bg-slate-900 cursor-pointer"
            />
            Include Raw Unstructured Gemini Responses
          </label>
          <p className="text-[10px] text-slate-500 font-mono pl-6">
            Appends original raw AI payloads to output document
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleExport}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-extrabold text-xs rounded-xl shadow-xl shadow-indigo-600/30 transition-all border border-indigo-400/30"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Preparing File...
              </>
            ) : downloadSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Exported!
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Export {format.toUpperCase()} Data
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
