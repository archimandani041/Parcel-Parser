import React from 'react';
import { Sparkles, ShieldCheck } from 'lucide-react';

export default function Navbar({ title = 'Parcel Information Extractor' }) {
  return (
    <header className="h-16 bg-slate-900/60 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Template-Independent Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-semibold text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" /> Template-Independent Parser
        </div>

        {/* Gemini Multimodal Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-semibold text-indigo-300">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Powered by Gemini Multimodal AI
        </div>
      </div>
    </header>
  );
}
