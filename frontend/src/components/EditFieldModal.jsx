import React, { useState } from 'react';
import { Edit3, X, Save, AlertCircle } from 'lucide-react';

export default function EditFieldModal({ isOpen, onClose, fieldName, currentValue, onSave }) {
  const [newValue, setNewValue] = useState(currentValue || '');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(fieldName, currentValue, newValue);
      onClose();
    } catch (err) {
      console.error('Error saving field:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
      <div className="bg-white border border-purple-100 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 relative overflow-hidden font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-purple-600" /> Manual Field Correction
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Updating field: <span className="font-mono text-purple-700 font-bold">{fieldName}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 p-1.5 rounded-full hover:bg-purple-50 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="bg-purple-50/50 p-3.5 rounded-2xl border border-purple-100">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Extracted Value</span>
            <span className="font-mono text-xs text-slate-400 block line-through">
              {currentValue || '<empty / null>'}
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-800 block">Corrected Value</label>
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Enter corrected value..."
              className="w-full bg-purple-50/30 border border-purple-200/80 rounded-2xl px-4 py-2.5 text-xs text-slate-900 placeholder-purple-300 outline-none focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-200 font-mono transition-all"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold rounded-full transition-colors border border-purple-200/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="pill-button-dark flex items-center gap-2 px-6 py-2.5 text-xs font-extrabold shadow-md"
            >
              <Save className="w-4 h-4 text-purple-300" />
              {saving ? 'Saving...' : 'Save Correction'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
