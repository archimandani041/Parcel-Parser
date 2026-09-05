import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  UploadCloud,
  FileText,
  Sparkles,
  Boxes,
  RotateCcw,
  Database,
  Cpu,
  Activity,
  ChevronRight,
  Package
} from 'lucide-react';

export default function Sidebar({ healthInfo }) {
  const { t } = useTranslation();

  const navItems = [
    { path: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, badge: null },
    { path: '/upload', label: t('nav.uploadLabel'), icon: UploadCloud, badge: 'AI' },
    { path: '/orders', label: t('nav.orders'), icon: Package, badge: null },
    { path: '/stock', label: t('nav.stock'), icon: Boxes, badge: null },
    { path: '/return', label: t('nav.return'), icon: RotateCcw, badge: null },
    { path: '/documents', label: t('nav.allDocuments'), icon: FileText, badge: null },
  ];

  return (
    <aside className="w-64 flex flex-col justify-between p-4 min-h-screen relative z-20 shrink-0"
      style={{ background: 'var(--color-navy)', borderRight: '1px solid rgba(232,188,185,0.08)' }}>
      <div>
        {/* Brand Header */}
        <div className="px-3 py-3 mb-6" style={{ borderBottom: '1px solid rgba(232,188,185,0.1)' }}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                style={{ background: 'linear-gradient(135deg, var(--color-rose), var(--color-plum))', boxShadow: '0 4px 12px rgba(174,68,90,0.3)' }}>
                <Boxes className="w-5 h-5" style={{ color: 'var(--color-blush-light)' }} />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--color-amber)' }}></span>
                <span className="relative inline-flex rounded-full h-3 w-3" style={{ background: 'var(--color-amber)', border: '2px solid var(--color-navy)' }}></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-base tracking-tight" style={{ color: 'var(--color-blush-light)' }}>
                  {t('nav.parcelAI')}
                </h1>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                  style={{ background: 'rgba(174,68,90,0.25)', color: 'var(--color-blush)', border: '1px solid rgba(174,68,90,0.35)' }}>
                  PRO
                </span>
              </div>
              <p className="text-[11px] font-medium flex items-center gap-1 mt-0.5"
                style={{ color: 'rgba(232,188,185,0.5)' }}>
                <Sparkles className="w-3 h-3" style={{ color: 'var(--color-rose)' }} /> {t('nav.labelIntelligence')}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider mb-2"
            style={{ color: 'rgba(232,188,185,0.4)' }}>
            {t('sidebar.mainNavigation')}
          </p>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group border ${isActive
                      ? 'shadow-md'
                      : 'border-transparent hover:bg-white/5 hover:text-white'
                    }`
                  }
                  style={({ isActive }) => isActive ? {
                    background: 'linear-gradient(135deg, var(--color-rose), var(--color-plum))',
                    borderColor: 'rgba(232,188,185,0.15)',
                    boxShadow: '0 4px 14px rgba(174,68,90,0.3)'
                  } : {
                    color: 'rgba(232,188,185,0.55)'
                  }}
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 transition-transform group-hover:scale-110`}
                          style={{ color: isActive ? 'var(--color-blush-light)' : 'rgba(232,188,185,0.4)' }} />
                        <span style={{ color: isActive ? 'var(--color-blush-light)' : undefined }}>{item.label}</span>
                      </div>

                      {item.badge ? (
                        <span className="px-1.5 py-0.5 text-[9px] font-extrabold rounded"
                          style={isActive ? {
                            background: 'rgba(232,188,185,0.2)',
                            color: 'var(--color-blush-light)',
                            border: '1px solid rgba(232,188,185,0.2)'
                          } : {
                            background: 'rgba(174,68,90,0.2)',
                            color: 'var(--color-blush)',
                            border: '1px solid rgba(174,68,90,0.3)'
                          }}>
                          {item.badge}
                        </span>
                      ) : (
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform opacity-0 group-hover:opacity-100`}
                          style={{ color: isActive ? 'rgba(232,188,185,0.7)' : 'rgba(232,188,185,0.3)' }} />
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
      <div className="rounded-2xl p-4 text-xs space-y-3"
        style={{ background: 'rgba(69,25,82,0.25)', border: '1px solid rgba(232,188,185,0.06)' }}>
        <div className="flex items-center justify-between pb-2"
          style={{ borderBottom: '1px solid rgba(232,188,185,0.08)' }}>
          <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5"
            style={{ color: 'rgba(232,188,185,0.6)' }}>
            <Activity className="w-3.5 h-3.5" style={{ color: 'var(--color-amber)' }} /> {t('sidebar.systemStatus')}
          </span>
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ color: 'var(--color-amber)', background: 'rgba(243,159,90,0.15)', border: '1px solid rgba(243,159,90,0.2)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--color-amber)' }}></span>
            {t('sidebar.online')}
          </span>
        </div>

        <div className="space-y-2 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="font-medium flex items-center gap-1.5"
              style={{ color: 'rgba(232,188,185,0.5)' }}>
              <Cpu className="w-3.5 h-3.5" style={{ color: 'var(--color-rose)' }} /> {t('sidebar.aiEngine')}
            </span>
            <span className="font-mono font-bold px-2 py-0.5 rounded text-[10px]"
              style={{ background: 'rgba(174,68,90,0.2)', color: 'var(--color-blush)', border: '1px solid rgba(174,68,90,0.3)' }}>
              {healthInfo?.model || 'Gemini 3.6 Flash'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium flex items-center gap-1.5"
              style={{ color: 'rgba(232,188,185,0.5)' }}>
              <Database className="w-3.5 h-3.5" style={{ color: 'var(--color-amber)' }} /> {t('sidebar.database')}
            </span>
            <span className={`font-semibold px-2 py-0.5 rounded text-[10px] font-mono`}
              style={{
                color: healthInfo?.supabase_connected ? 'var(--color-amber)' : 'var(--color-blush)',
                background: healthInfo?.supabase_connected ? 'rgba(243,159,90,0.15)' : 'rgba(232,188,185,0.15)',
                border: healthInfo?.supabase_connected ? '1px solid rgba(243,159,90,0.2)' : '1px solid rgba(232,188,185,0.15)'
              }}>
              {healthInfo?.supabase_connected ? 'Supabase' : 'Local SQLite'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
