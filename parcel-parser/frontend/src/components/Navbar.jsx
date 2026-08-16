import React from 'react';
import { Sparkles, ShieldCheck, Cpu } from 'lucide-react';

export default function Navbar({ title = 'Parcel Information Extractor' }) {
  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-slate-400">Platform</span>
        <span className="text-slate-600 font-mono text-xs">/</span>
        <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Template-Independent Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[11px] font-semibold text-emerald-400 shadow-sm">
          <ShieldCheck className="w-3.5 h-3.5" /> Zero-Template Parsing
        </div>

        {/* Gemini Multimodal Badge */}
        <div className="flex items-center gap-1.5 px-3.5 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[11px] font-semibold text-indigo-300 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/30" /> Powered by Gemini Vision AI
        </div>
      </div>
    </header>
  );
}

