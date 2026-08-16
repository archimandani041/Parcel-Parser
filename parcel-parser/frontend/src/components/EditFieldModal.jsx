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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800/90 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-indigo-400" /> Manual Field Correction
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Updating field: <span className="font-mono text-indigo-300 font-bold">{fieldName}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Extracted Value</span>
            <span className="font-mono text-xs text-slate-400 block line-through">
              {currentValue || '<empty / null>'}
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-200 block">Corrected Value</label>
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Enter corrected value..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500 font-mono transition-all"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-extrabold text-xs rounded-xl shadow-xl shadow-indigo-600/30 transition-all border border-indigo-400/30"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Correction'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
