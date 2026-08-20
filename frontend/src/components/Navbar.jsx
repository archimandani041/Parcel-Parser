import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UploadCloud,
  FileText,
  Boxes,
  Package,
  RotateCcw,
  Sparkles
} from 'lucide-react';

export default function Navbar({ title = 'Parcel Information Extractor', healthInfo }) {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/upload', label: 'Upload', icon: UploadCloud, badge: 'AI' },
    { path: '/orders', label: 'Orders', icon: Package },
    { path: '/stock', label: 'Stock', icon: Boxes },
    { path: '/return', label: 'Return', icon: RotateCcw },
    { path: '/documents', label: 'Docs', icon: FileText },
  ];

  return (
    <>
      {/* ===== TOP NAVIGATION HEADER ===== */}
      <header className="sticky top-3 z-40 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="floating-navbar rounded-full px-4 py-2 sm:px-5 sm:py-2.5 flex items-center justify-between gap-4 transition-all duration-300">

          {/* Left: Brand Logo Capsule */}
          <NavLink to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 via-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-300/50 group-hover:scale-105 transition-transform">
              <Boxes className="w-4.5 h-4.5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-sm text-slate-900 tracking-tight">ParcelAI</span>
              <span className="hidden xs:inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100/80 text-purple-800 border border-purple-200">
                <Sparkles className="w-2.5 h-2.5 text-purple-600" /> AI
              </span>
            </div>
          </NavLink>

          {/* Center: Desktop Floating Navigation Pills (hidden on mobile) */}
          <nav className="hidden md:flex items-center gap-1 bg-purple-100/50 p-1.5 rounded-full border border-purple-200/80 shadow-inner">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 relative ${
                      isActive
                        ? 'bg-purple-200/90 text-purple-950 border border-purple-300/90 shadow-xs'
                        : 'text-purple-800/80 hover:text-purple-950 hover:bg-white/80'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-purple-800' : 'text-purple-500'}`} />
                      <span>{item.label === 'Upload' ? 'Upload Label' : item.label}</span>
                      {item.badge && (
                        <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ${
                          isActive ? 'bg-purple-300/80 text-purple-950' : 'bg-purple-200/60 text-purple-800'
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

          {/* Right: Quick Upload Action Button */}
          <div className="flex items-center gap-2">
            <NavLink
              to="/upload"
              className="flex items-center gap-1.5 bg-gradient-to-r from-purple-500 via-violet-600 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white text-xs font-extrabold px-4 py-2 rounded-full shadow-md shadow-purple-300/40 transition-all hover:scale-105"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Parse Label</span>
            </NavLink>
          </div>

        </div>
      </header>

      {/* ===== FIXED MOBILE BOTTOM NAVIGATION BAR ===== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-2xl border-t border-purple-200/90 shadow-[0_-8px_25px_-5px_rgba(147,112,219,0.2)] px-2 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all duration-200 relative ${
                  isActive
                    ? 'text-purple-950 font-extrabold scale-105'
                    : 'text-slate-500 hover:text-purple-800 font-semibold'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-gradient-to-tr from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-300/50' 
                      : 'bg-purple-50/60 text-purple-700'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? 'text-purple-950 font-bold' : 'text-slate-600 font-medium'}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}



