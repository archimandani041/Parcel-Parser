import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UploadCloud, 
  FileText, 
  Sparkles, 
  Boxes, 
  Package, 
  Menu, 
  X
} from 'lucide-react';

export default function Navbar({ title = 'Parcel Information Extractor', healthInfo }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/upload', label: 'Upload Label', icon: UploadCloud, badge: 'AI' },
    { path: '/orders', label: 'Orders', icon: Package },
    { path: '/stock', label: 'Stock', icon: Boxes },
    { path: '/documents', label: 'All Documents', icon: FileText },
  ];

  return (
    <header className="sticky top-3 z-50 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="floating-navbar rounded-full px-4 py-2 sm:px-5 sm:py-2.5 flex items-center justify-between gap-4 transition-all duration-300">
        
        {/* Left: Brand Logo Capsule */}
        <NavLink to="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-9 h-9 rounded-full bg-[#1c1815] flex items-center justify-center text-[#fdfbf7] shadow-sm group-hover:scale-105 transition-transform">
            <Boxes className="w-4 h-4 text-[#e2d7c5]" />
          </div>
          <div className="hidden sm:block">
            <span className="font-extrabold text-sm text-[#1c1815] tracking-tight">ParcelAI</span>
          </div>
        </NavLink>

        {/* Center: Desktop Floating Navigation Pills */}
        <nav className="hidden md:flex items-center gap-1 bg-[#f4efe6] p-1.5 rounded-full border border-[#e2d7c5]">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 relative ${
                    isActive
                      ? 'bg-[#1c1815] text-[#fdfbf7] shadow-xs'
                      : 'text-[#574b40] hover:text-[#1c1815] hover:bg-white/80'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#e2d7c5]' : 'text-[#8c7b6c]'}`} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ${
                        isActive ? 'bg-[#3d332c] text-[#fdfbf7]' : 'bg-[#e2d7c5] text-[#574b40]'
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
          <NavLink
            to="/upload"
            className="pill-button-dark flex items-center gap-1.5 text-xs font-bold px-4.5 py-2"
          >
            <UploadCloud className="w-3.5 h-3.5 text-[#e2d7c5]" />
            <span className="hidden xs:inline">Parse Label</span>
          </NavLink>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#1c1815] hover:bg-[#f4efe6] rounded-full transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Nav Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 p-3 bg-[#fdfbf7] border border-[#e2d7c5] rounded-3xl shadow-xl space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#1c1815] text-[#fdfbf7]'
                      : 'text-[#574b40] hover:bg-[#f4efe6]'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-[#8c7b6c]" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 text-[10px] font-extrabold bg-[#e2d7c5] text-[#1c1815] rounded-full">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}

          <div className="pt-2 mt-2 border-t border-[#e2d7c5] flex items-center justify-between px-4 py-2 text-[11px] font-medium text-[#8c7b6c]">
            <span className="flex items-center gap-1.5 text-[#1c1815] font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#574b40]" /> AI Parser
            </span>
            <span className="flex items-center gap-1 text-emerald-700 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Online
            </span>
          </div>
        </div>
      )}
    </header>
  );
}
