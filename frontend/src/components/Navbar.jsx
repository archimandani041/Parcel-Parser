import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  UploadCloud,
  FileText,
  Boxes,
  Package,
  RotateCcw,
  Sparkles,
  Globe
} from 'lucide-react';

export default function Navbar({ title = 'Parcel Information Extractor', healthInfo }) {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const navItems = [
    { path: '/', label: t('nav.dashboard'), icon: LayoutDashboard },
    { path: '/upload', label: t('nav.uploadLabel'), icon: UploadCloud, badge: 'AI' },
    { path: '/orders', label: t('nav.orders'), icon: Package },
    { path: '/stock', label: t('nav.stock'), icon: Boxes },
    { path: '/return', label: t('nav.return'), icon: RotateCcw },
    { path: '/documents', label: t('nav.docs'), icon: FileText },
  ];

  return (
    <>
      {/* ===== TOP NAVIGATION HEADER ===== */}
      <header className="sticky top-4 z-40 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="floating-navbar rounded-2xl px-5 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between gap-4 transition-all duration-300">

          {/* Left: Brand Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform"
              style={{ background: 'var(--color-brown-dark)', boxShadow: '0 4px 12px rgba(61,35,20,0.25)' }}>
              <Boxes className="w-4.5 h-4.5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-sm tracking-tight" style={{ color: 'var(--color-brown-dark)' }}>
                {t('nav.parcelAI')}
              </span>
              <span className="hidden xs:inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full"
                style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent)', border: '1px solid var(--color-accent-muted)' }}>
                <Sparkles className="w-2.5 h-2.5" /> AI
              </span>
            </div>
          </NavLink>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 p-1.5 rounded-xl"
            style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border-light)' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 relative ${isActive
                      ? 'text-white shadow-sm'
                      : 'hover:bg-white/80'
                    }`
                  }
                  style={({ isActive }) => isActive ? {
                    background: 'var(--color-brown-dark)',
                    color: '#ffffff'
                  } : {
                    color: 'var(--color-text-secondary)'
                  }}
                >
                  {({ isActive }) => (
                    <>
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold"
                          style={isActive ? {
                            background: 'rgba(255,255,255,0.2)',
                            color: '#ffffff'
                          } : {
                            background: 'var(--color-accent-light)',
                            color: 'var(--color-accent)'
                          }}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Right: Language Switcher & Quick Action */}
          <div className="flex items-center gap-2.5">
            {/* Language Switcher */}
            <div className="relative flex items-center rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all"
              style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border-light)', color: 'var(--color-text-secondary)' }}>
              <Globe className="w-3.5 h-3.5 mr-1.5 shrink-0" style={{ color: 'var(--color-brown-light)' }} />
              <select
                id="language-switcher"
                value={i18n.language || 'en'}
                onChange={(e) => changeLanguage(e.target.value)}
                className="bg-transparent font-extrabold text-xs outline-none cursor-pointer pr-1 py-0.5"
                style={{ color: 'var(--color-brown-dark)' }}
              >
                <option value="en" className="font-sans">English</option>
                <option value="gu" className="font-sans">ગુજરાતી</option>
                <option value="hi" className="font-sans">हिंदी</option>
              </select>
            </div>

            <NavLink
              to="/upload"
              className="pill-button-dark flex items-center gap-1.5 px-5 py-2.5 text-xs font-extrabold shadow-md transition-all hover:scale-105 shrink-0"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{t('nav.parseLabel')}</span>
            </NavLink>
          </div>

        </div>
      </header>

      {/* ===== FIXED MOBILE & TABLET BOTTOM NAVIGATION BAR ===== */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-2 py-2 flex items-center justify-around"
        style={{
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--color-border-light)',
          boxShadow: '0 -4px 20px rgba(61,35,20,0.08)'
        }}>
        {navItems.filter(item => item.path !== '/documents').map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl transition-all duration-200 relative ${isActive ? 'font-extrabold scale-105' : 'font-semibold'
                }`
              }
              style={({ isActive }) => ({
                color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)'
              })}
            >
              {({ isActive }) => (
                <>
                  <div className="p-1.5 rounded-lg transition-all"
                    style={isActive ? {
                      background: 'var(--color-accent)',
                      color: '#ffffff',
                      boxShadow: '0 4px 12px rgba(150,62,27,0.25)'
                    } : {
                      background: 'var(--color-surface-muted)',
                      color: 'var(--color-text-muted)'
                    }}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] mt-0.5 tracking-tight"
                    style={{ color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="absolute -top-0.5 w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ background: 'var(--color-accent)' }} />
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
