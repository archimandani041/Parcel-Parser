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
    <div className="space-y-5">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2 font-extrabold text-xs text-amber-400 uppercase tracking-wider">
          <Terminal className="w-4 h-4" /> Gemini Vision Raw API Diagnostics & Payload
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all shadow-sm"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy Payload'}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">API Latency</span>
          <span className="text-xs font-extrabold text-indigo-300 font-mono mt-1 block flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" /> {processingTime || 0} ms
          </span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Vision Model</span>
          <span className="text-xs font-extrabold text-emerald-400 font-mono mt-1 block flex items-center gap-1.5 truncate">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" /> {rawResponse?.metadata?.model || 'gemini-3.6-flash'}
          </span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Unextracted Fields</span>
          <span className="text-xs font-extrabold text-amber-400 font-mono mt-1 block flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" /> {missingFields.length} missing
          </span>
        </div>
      </div>

      {/* Missing Fields List */}
      {missingFields.length > 0 && (
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Unextracted / Null Fields List</span>
          <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
            {missingFields.map((f, i) => (
              <span key={i} className="bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-md">
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Raw Payload Text */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800/90 p-4 font-mono text-xs text-amber-200/90 overflow-x-auto max-h-[500px] shadow-inner">
        <pre className="leading-relaxed whitespace-pre-wrap">{rawText}</pre>
      </div>

    </div>
  );
}
