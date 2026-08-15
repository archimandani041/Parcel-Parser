import React from 'react';
import { Cpu, Clock, AlertTriangle, HelpCircle, CheckCircle2 } from 'lucide-react';

export default function RawResponseViewer({ rawResponse, processingTime, warnings = [], structuredJson = {} }) {
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
    checkObj(structuredJson);
    return missing;
  };

  const missingFields = findMissingFields(structuredJson);

  return (
    <div className="space-y-6">
      {/* Developer Overview Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Model Used</span>
            <p className="font-mono text-sm font-bold text-white">{rawResponse?.model || 'Gemini 2.5 Flash'}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Processing Speed</span>
            <p className="font-mono text-sm font-bold text-white">{processingTime || 0} ms</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Missing / Null Fields</span>
            <p className="font-mono text-sm font-bold text-white">{missingFields.length} fields</p>
          </div>
        </div>
      </div>

      {/* Validation Warnings List */}
      {warnings && warnings.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Validation Warnings Log ({warnings.length})
          </h4>
          <ul className="space-y-1 font-mono text-xs text-amber-200/90">
            {warnings.map((w, idx) => (
              <li key={idx} className="bg-amber-950/30 p-2 rounded border border-amber-900/40">
                • {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing Fields Details */}
      {missingFields.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-slate-400" /> Missing / Unextracted Field List
          </h4>
          <div className="flex flex-wrap gap-1.5 font-mono text-xs">
            {missingFields.map((field, idx) => (
              <span key={idx} className="bg-slate-950 text-slate-400 border border-slate-800 px-2 py-0.5 rounded">
                {field}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Raw Gemini Payload Text */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
        <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center justify-between">
          <span>Raw Gemini Payload & SDK Metadata</span>
          {rawResponse?.note && <span className="text-[10px] text-amber-400 normal-case">{rawResponse.note}</span>}
        </h4>
        <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs text-slate-300 overflow-auto max-h-96 leading-relaxed">
          <pre>{JSON.stringify(rawResponse, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
