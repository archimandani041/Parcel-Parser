import React, { useState } from 'react';
import { X, Download, FileJson, FileSpreadsheet, FileText } from 'lucide-react';
import { exportDocumentsData } from '../services/api';

export default function ExportModal({ isOpen, onClose, selectedDocumentIds = [] }) {
  const [format, setFormat] = useState('json');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
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
      
      onClose();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const formats = [
    { id: 'json', label: 'Structured JSON', desc: 'Complete hierarchical document schema format', icon: FileJson },
    { id: 'csv', label: 'CSV Format', desc: 'Standard comma-separated table format', icon: FileText },
    { id: 'excel', label: 'Excel (XLSX)', desc: 'Formatted Microsoft Excel spreadsheet', icon: FileSpreadsheet }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-indigo-400" /> Export Shipping Label Data
            </h3>
            <p className="text-xs text-slate-400">
              {selectedDocumentIds.length > 0
                ? `Exporting ${selectedDocumentIds.length} selected document(s)`
                : 'Exporting all documents'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selection List */}
        <div className="space-y-2.5">
          {formats.map((f) => {
            const Icon = f.icon;
            const isSelected = format === f.id;
            return (
              <div
                key={f.id}
                onClick={() => setFormat(f.id)}
                className={`flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-indigo-600/15 border-indigo-500/60 ring-1 ring-indigo-500/30'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${isSelected ? 'text-indigo-300' : 'text-slate-200'}`}>
                    {f.label}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-indigo-600/30 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Generating Export...' : `Download ${format.toUpperCase()}`}
          </button>
        </div>

      </div>
    </div>
  );
}
