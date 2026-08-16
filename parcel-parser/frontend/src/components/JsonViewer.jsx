import React, { useState } from 'react';
import { Copy, Check, Code2, Download } from 'lucide-react';

export default function JsonViewer({ json, jsonData, fileName = 'document.json' }) {
  const data = json || jsonData || {};
  const [copied, setCopied] = useState(false);

  const formattedJson = JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([formattedJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2 font-extrabold text-xs text-slate-200 uppercase tracking-wider">
          <Code2 className="w-4 h-4 text-purple-400" /> Structured JSON Output Schema
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy JSON'}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" /> Download
          </button>
        </div>
      </div>

      <div className="bg-slate-950 rounded-2xl border border-slate-800/90 p-4 font-mono text-xs text-indigo-200 overflow-x-auto max-h-[600px] shadow-inner">
        <pre className="leading-relaxed whitespace-pre-wrap">{formattedJson}</pre>
      </div>
    </div>
  );
}
