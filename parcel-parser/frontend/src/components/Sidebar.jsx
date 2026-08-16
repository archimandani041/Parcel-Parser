import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UploadCloud, 
  FileText, 
  Sparkles, 
  Boxes, 
  Database,
  Cpu,
  Activity,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({ healthInfo }) {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { path: '/upload', label: 'Upload Label', icon: UploadCloud, badge: 'AI' },
    { path: '/documents', label: 'All Documents', icon: FileText, badge: null },
  ];

  return (
    <aside className="w-64 bg-slate-900/95 border-r border-slate-800/80 flex flex-col justify-between p-4 min-h-screen relative z-20 shrink-0">
      <div>
        {/* Brand Header */}
        <div className="px-3 py-3 mb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 flex items-center justify-center shadow-lg shadow-indigo-500/30 ring-1 ring-white/20">
                <Boxes className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-slate-900"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-base text-white tracking-tight">
                  ParcelAI
                </h1>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                <Sparkles className="w-3 h-3 text-indigo-400" /> Label Intelligence
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
            Main Navigation
          </p>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group relative ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/25 border border-indigo-500/40'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`} />
                        <span>{item.label}</span>
                      </div>

                      {item.badge ? (
                        <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-indigo-400/20 text-indigo-300 rounded border border-indigo-400/30">
                          {item.badge}
                        </span>
                      ) : (
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform opacity-0 group-hover:opacity-100 ${isActive ? 'opacity-100 text-indigo-200' : 'text-slate-500'}`} />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* System Operational Widget */}
      <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800/90 text-xs space-y-3 shadow-inner">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" /> System Status
          </span>
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Online
          </span>
        </div>

        <div className="space-y-2 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" /> AI Engine
            </span>
            <span className="text-indigo-300 font-mono font-bold bg-indigo-500/15 px-2 py-0.5 rounded border border-indigo-500/30 text-[10px]">
              {healthInfo?.model || 'Gemini 3.6 Flash'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-sky-400" /> Database
            </span>
            <span className={`font-semibold px-2 py-0.5 rounded text-[10px] font-mono ${
              healthInfo?.supabase_connected
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
            }`}>
              {healthInfo?.supabase_connected ? 'Supabase' : 'Local SQLite'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

