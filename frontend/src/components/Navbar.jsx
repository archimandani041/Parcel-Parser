import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UploadCloud,
  FileText,
  Sparkles,
  Boxes,
  Package,
  RotateCcw,
  Activity,
  Menu,
  X,
  Cpu,
  Database
} from 'lucide-react';

export default function Navbar({ title = 'Parcel Information Extractor', healthInfo }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/upload', label: 'Upload Label', icon: UploadCloud, badge: 'AI' },
    { path: '/orders', label: 'Orders', icon: Package },
    { path: '/stock', label: 'Stock', icon: Boxes },
    { path: '/return', label: 'Return', icon: RotateCcw },
    { path: '/documents', label: 'All Documents', icon: FileText },
  ];

  return (
    <header className="sticky top-3 z-50 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="floating-navbar rounded-full px-4 py-2 sm:px-5 sm:py-2.5 flex items-center justify-between gap-4 transition-all duration-300">

        {/* Left: Brand Logo Capsule */}
        <NavLink to="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-400 via-violet-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-300/40 group-hover:scale-105 transition-transform">
            <Boxes className="w-4 h-4" />
          </div>
          <div className="hidden sm:block">
            <span className="font-extrabold text-sm text-slate-800 tracking-tight">ParcelAI</span>
          </div>
        </NavLink>

        {/* Center: Desktop Floating Navigation Pills */}
        <nav className="hidden md:flex items-center gap-1 bg-purple-100/50 p-1.5 rounded-full border border-purple-200/80 shadow-inner">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 relative ${isActive
                    ? 'bg-purple-200/90 text-purple-950 border border-purple-300/90 shadow-xs'
                    : 'text-purple-800/80 hover:text-purple-950 hover:bg-white/80'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-purple-800' : 'text-purple-500'}`} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ${isActive ? 'bg-purple-300/80 text-purple-950' : 'bg-purple-200/60 text-purple-800'
                        }`}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Right: Quick Action Button & Mobile Toggle */}
        <div className="flex items-center gap-2.5">
          {/* Quick Upload Action Button (Light Pastel) */}
          <NavLink
            to="/upload"
            className="flex items-center gap-1.5 bg-gradient-to-r from-purple-200 via-violet-200 to-indigo-200 hover:from-purple-300 hover:to-indigo-300 text-purple-950 text-xs font-extrabold px-4.5 py-2 rounded-full border border-purple-300/80 shadow-xs transition-all hover:scale-105"
          >
            <UploadCloud className="w-3.5 h-3.5 text-purple-700" />
            <span className="hidden xs:inline">Parse Label</span>
          </NavLink>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 bg-purple-50 hover:bg-purple-100 rounded-full transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Nav Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 p-3 bg-white/95 backdrop-blur-xl border border-purple-100 rounded-3xl shadow-2xl space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all ${isActive
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-700 hover:bg-purple-50'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-purple-500" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 text-[10px] font-extrabold bg-purple-100 text-purple-700 rounded-full">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}

          <div className="pt-2 mt-2 border-t border-purple-100 flex items-center justify-between px-4 py-2 text-[11px] font-medium text-slate-500">
            <span className="flex items-center gap-1.5 text-purple-700 font-bold">
              <Sparkles className="w-3.5 h-3.5" /> AI Parser
            </span>
            <span className="flex items-center gap-1 text-emerald-600 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Online
            </span>
          </div>
        </div>
      )}
    </header>
  );
}



