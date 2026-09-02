import React from 'react';
import LanguageSelector from './LanguageSelector';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  UploadCloud,
  FileText,
  Boxes,
  Package,
  RotateCcw,
  Sparkles,
  Globe,
  Scan
} from 'lucide-react';

export default function Navbar({ title = 'Parcel Information Extractor', healthInfo }) {
  const { t, i18n } = useTranslation();
  const location = useLocation();

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
        <div className="floating-navbar rounded-2xl px-5 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between gap-4 transition-all duration-300 shadow-lg"
          style={{
            background: 'rgba(253, 245, 244, 0.96)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--color-border-light)',
            boxShadow: '0 8px 32px rgba(29, 26, 57, 0.08)'
          }}>

          {/* Left: Brand Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 group shrink-0 transition-transform duration-200 hover:scale-102">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md group-hover:rotate-3 transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, var(--color-navy) 0%, var(--color-deep-purple) 100%)',
                boxShadow: '0 4px 14px rgba(29,26,57,0.3)'
              }}>
              <Boxes className="w-5 h-5 text-blush-light group-hover:scale-110 transition-transform duration-200" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight font-serif" style={{ color: 'var(--color-navy)' }}>
                {t('nav.parcelAI')}
              </span>
              <span className="hidden xs:inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full"
                style={{ background: 'var(--color-accent-light)', color: 'var(--color-rose)', border: '1px solid var(--color-accent-muted)' }}>
                <Sparkles className="w-2.5 h-2.5 animate-pulse" /> AI
              </span>
            </div>
          </NavLink>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5 p-1.5 rounded-2xl"
            style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border-light)' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 relative group cursor-pointer ${isActive ? 'shadow-md scale-102' : 'hover:bg-white/80'
                    }`}
                  style={isActive ? {
                    background: 'linear-gradient(135deg, var(--color-navy) 0%, var(--color-deep-purple) 100%)',
                    color: 'var(--color-blush-light)',
                    boxShadow: '0 4px 14px rgba(29, 26, 57, 0.25), 0 0 12px rgba(174, 68, 90, 0.2)'
                  } : {
                    color: 'var(--color-text-secondary)'
                  }}
                >
                  <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'text-blush-light scale-110' : 'group-hover:-translate-y-0.5 group-hover:scale-110'}`} />
                  <span className="transition-transform duration-200 group-hover:translate-x-0.5">{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider"
                      style={isActive ? {
                        background: 'rgba(232,188,185,0.2)',
                        color: 'var(--color-blush-light)'
                      } : {
                        background: 'var(--color-accent-light)',
                        color: 'var(--color-rose)'
                      }}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Right: Language Switcher & Quick Action */}
          <div className="flex items-center gap-2.5">
            {/* Custom Language Switcher Dropdown */}
            <LanguageSelector />

            {/* Prominent Parse Label CTA Button */}
            <NavLink
              to="/upload"
              className="pill-button-dark flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shrink-0 relative overflow-hidden group"
              style={{
                boxShadow: '0 4px 16px rgba(29,26,57,0.3), 0 0 14px rgba(174,68,90,0.25)'
              }}
            >
              {/* Animated scan beam overlay on hover */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
              <Scan className="w-4 h-4 text-blush-light group-hover:rotate-90 transition-transform duration-300" />
              <span>{t('nav.parseLabel')}</span>
            </NavLink>
          </div>

        </div>
      </header>

      {/* ===== FIXED MOBILE Navigation Bar ===== */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-3 py-2 flex items-center justify-around"
        style={{
          background: 'rgba(253,245,244,0.98)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--color-border-light)',
          boxShadow: '0 -4px 20px rgba(29,26,57,0.08)'
        }}>
        {navItems.filter(item => item.path !== '/documents').map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 relative ${isActive ? 'font-extrabold scale-105' : 'font-semibold'
                }`}
            >
              <div className="p-1.5 rounded-lg transition-all"
                style={isActive ? {
                  background: 'linear-gradient(135deg, var(--color-rose), var(--color-plum))',
                  color: 'var(--color-blush-light)',
                  boxShadow: '0 4px 12px rgba(174,68,90,0.3)'
                } : {
                  background: 'var(--color-surface-muted)',
                  color: 'var(--color-text-muted)'
                }}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-extrabold"
                style={{ color: isActive ? 'var(--color-rose)' : 'var(--color-text-muted)' }}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
