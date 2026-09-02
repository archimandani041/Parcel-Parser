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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" style={{ background: 'rgba(29,26,57,0.5)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md p-6 shadow-2xl space-y-5 relative overflow-hidden font-sans rounded-3xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
          <div>
            <h3 className="text-base font-extrabold flex items-center gap-2" style={{ color: 'var(--color-navy)' }}>
              <Edit3 className="w-4 h-4" style={{ color: 'var(--color-rose)' }} /> Manual Field Correction
            </h3>
            <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Updating field: <span className="font-mono font-bold" style={{ color: 'var(--color-plum)' }}>{fieldName}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full transition-colors" style={{ color: 'var(--color-text-muted)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="p-3.5 rounded-2xl" style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border-light)' }}>
            <span className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--color-text-muted)' }}>Extracted Value</span>
            <span className="font-mono text-xs block line-through" style={{ color: 'var(--color-text-muted)' }}>
              {currentValue || '<empty / null>'}
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold block" style={{ color: 'var(--color-navy)' }}>Corrected Value</label>
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Enter corrected value..."
              className="w-full rounded-2xl px-4 py-2.5 text-xs font-mono transition-all outline-none"
              style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border-light)', color: 'var(--color-text-primary)' }}
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3" style={{ borderTop: '1px solid var(--color-border-light)' }}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold rounded-full transition-colors"
              style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-light)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="pill-button-dark flex items-center gap-2 px-6 py-2.5 text-xs font-extrabold shadow-md"
            >
              <Save className="w-4 h-4" style={{ color: 'var(--color-blush)' }} />
              {saving ? 'Saving...' : 'Save Correction'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
