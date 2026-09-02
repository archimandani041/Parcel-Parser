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
      <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
        <div className="flex items-center gap-2 font-extrabold text-xs uppercase tracking-wider" style={{ color: 'var(--color-navy)' }}>
          <Code2 className="w-4 h-4" style={{ color: 'var(--color-rose)' }} /> Structured JSON Output Schema
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-xs"
            style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border-light)', color: 'var(--color-navy)' }}
          >
            {copied ? <Check className="w-3.5 h-3.5" style={{ color: 'var(--color-success)' }} /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy JSON'}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-xs"
            style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border-light)', color: 'var(--color-navy)' }}
          >
            <Download className="w-3.5 h-3.5" style={{ color: 'var(--color-rose)' }} /> Download
          </button>
        </div>
      </div>

      <div className="rounded-2xl p-4 font-mono text-xs overflow-x-auto max-h-[600px] shadow-inner" style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border-light)', color: 'var(--color-text-primary)' }}>
        <pre className="leading-relaxed whitespace-pre-wrap">{formattedJson}</pre>
      </div>
    </div>
  );
}
