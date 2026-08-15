import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UploadCloud, 
  FileText, 
  Sparkles, 
  Boxes, 
  Database,
  Cpu
} from 'lucide-react';

export default function Sidebar({ healthInfo }) {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/upload', label: 'Upload Label', icon: UploadCloud },
    { path: '/documents', label: 'All Documents', icon: FileText },
  ];

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col justify-between p-4 min-h-screen">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Boxes className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white tracking-wide flex items-center gap-1.5">
              ParcelAI <Sparkles className="w-4 h-4 text-indigo-400 fill-indigo-400" />
            </h1>
            <p className="text-xs text-slate-400 font-medium">Document Intelligence</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Engine & DB System Status Widget */}
      <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800/80 text-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" /> AI Engine
          </span>
          <span className="text-indigo-300 font-mono font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
            {healthInfo?.model || 'Gemini 2.5'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-400" /> Storage
          </span>
          <span className={`font-semibold px-2 py-0.5 rounded-md text-[10px] ${
            healthInfo?.supabase_connected
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            {healthInfo?.supabase_connected ? 'Supabase DB' : 'Local Fallback'}
          </span>
        </div>
      </div>
    </aside>
  );
}
