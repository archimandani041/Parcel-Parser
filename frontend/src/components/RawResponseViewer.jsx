import React, { useState } from 'react';
import { Terminal, Copy, Check, AlertCircle, Clock, Cpu, HelpCircle } from 'lucide-react';

export default function RawResponseViewer({ rawResponse, processingTime, warnings = [], structuredJson = {} }) {
  const [copied, setCopied] = useState(false);

  const rawText = typeof rawResponse === 'string' 
    ? rawResponse 
    : JSON.stringify(rawResponse || {}, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const findMissingFields = (obj) => {
    const missing = [];
    const checkObj = (target, prefix = '') => {
      if (!target || typeof target !== 'object') return;
      for (const [k, v] of Object.entries(target)) {
        const fullKey = prefix ? `${prefix}.${k}` : k;
        if (v === null || v === undefined || v === '') {
          missing.push(fullKey);
        } else if (typeof v === 'object' && !Array.isArray(v)) {
          checkObj(v, fullKey);
        }
      }
    };
    checkObj(obj);
    return missing;
  };

  const missingFields = findMissingFields(structuredJson);

  return (
    <div className="space-y-5 font-sans">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
        <div className="flex items-center gap-2 font-extrabold text-xs uppercase tracking-wider" style={{ color: 'var(--color-deep-purple)' }}>
          <Terminal className="w-4 h-4" style={{ color: 'var(--color-plum)' }} /> Gemini Vision Raw API Diagnostics & Payload
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-xs"
          style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border-light)', color: 'var(--color-navy)' }}
        >
          {copied ? <Check className="w-3.5 h-3.5" style={{ color: 'var(--color-success)' }} /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy Payload'}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl" style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border-light)' }}>
          <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--color-text-muted)' }}>API Latency</span>
          <span className="text-xs font-extrabold font-mono mt-1 block flex items-center gap-1.5" style={{ color: 'var(--color-navy)' }}>
            <Clock className="w-3.5 h-3.5" style={{ color: 'var(--color-rose)' }} /> {processingTime || 0} ms
          </span>
        </div>

        <div className="p-3.5 rounded-2xl" style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border-light)' }}>
          <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--color-text-muted)' }}>Vision Model</span>
          <span className="text-xs font-extrabold font-mono mt-1 block flex items-center gap-1.5 truncate" style={{ color: 'var(--color-deep-purple)' }}>
            <Cpu className="w-3.5 h-3.5" style={{ color: 'var(--color-plum)' }} /> {rawResponse?.metadata?.model || 'gemini-3.6-flash'}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl" style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border-light)' }}>
          <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--color-text-muted)' }}>Unextracted Fields</span>
          <span className="text-xs font-extrabold font-mono mt-1 block flex items-center gap-1.5" style={{ color: 'var(--color-amber)' }}>
            <HelpCircle className="w-3.5 h-3.5" style={{ color: 'var(--color-amber)' }} /> {missingFields.length} missing
          </span>
        </div>
      </div>

      {/* Missing Fields List */}
      {missingFields.length > 0 && (
        <div className="p-4 rounded-2xl space-y-2" style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border-light)' }}>
          <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--color-text-muted)' }}>Unextracted / Null Fields List</span>
          <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
            {missingFields.map((f, i) => (
              <span key={i} className="px-2 py-0.5 rounded-md" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', color: 'var(--color-text-secondary)' }}>
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Raw Payload Text */}
      <div className="rounded-2xl p-4 font-mono text-xs overflow-x-auto max-h-[500px] shadow-inner" style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border-light)', color: 'var(--color-text-primary)' }}>
        <pre className="leading-relaxed whitespace-pre-wrap">{rawText}</pre>
      </div>

    </div>
  );
}
