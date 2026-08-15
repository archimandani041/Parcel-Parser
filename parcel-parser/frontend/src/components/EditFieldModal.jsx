import React, { useState, useEffect } from 'react';
import { X, Save, Edit2 } from 'lucide-react';

export default function EditFieldModal({ isOpen, onClose, fieldName, currentValue, onSave }) {
  const [newValue, setNewValue] = useState(currentValue || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setNewValue(currentValue || '');
  }, [currentValue]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(fieldName, currentValue, newValue);
      onClose();
    } catch (err) {
      console.error('Error saving field correction:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-indigo-400" /> Edit Extracted Field
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              Field Identifier
            </label>
            <input
              type="text"
              readOnly
              value={fieldName}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-indigo-300 font-bold outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              Original Extracted Value
            </label>
            <input
              type="text"
              readOnly
              value={currentValue || 'null'}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-400 italic outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-indigo-300 uppercase mb-1">
              Corrected Value
            </label>
            <textarea
              rows={3}
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Enter corrected value..."
              className="w-full bg-slate-950 border border-indigo-500/50 focus:border-indigo-400 rounded-lg px-3 py-2 text-sm font-mono text-white outline-none ring-2 ring-indigo-500/20"
              autoFocus
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Correction'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
