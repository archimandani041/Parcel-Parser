import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  Scan,
  ArrowRight,
  Package,
  CheckCircle2,
  Cpu,
  Layers,
  TrendingUp,
  Tag,
  User,
  Hash
} from 'lucide-react';
import Hero3DParcel from './Hero3DParcel';

export default function HeroSection() {
  const { t } = useTranslation();
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  return (
    <section id="hero" className="relative w-full pt-6 sm:pt-10 pb-16 lg:pb-24 overflow-hidden">
      {/* Background Decorative Ambient Radials */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] rounded-full pointer-events-none -z-10 opacity-60"
        style={{ background: 'radial-gradient(circle, rgba(174,68,90,0.08) 0%, transparent 70%)' }} />
      <div className="absolute top-1/3 left-[-100px] w-[500px] h-[500px] rounded-full pointer-events-none -z-10 opacity-50"
        style={{ background: 'radial-gradient(circle, rgba(69,25,82,0.06) 0%, transparent 70%)' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* ================= LEFT COLUMN ================= */}
          <div className="lg:col-span-6 space-y-6 text-left">
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-xs transition-transform duration-300 hover:scale-105"
              style={{
                background: 'rgba(255, 255, 255, 0.85)',
                border: '1px solid var(--color-border-light)',
                color: 'var(--color-navy)',
                backdropFilter: 'blur(12px)'
              }}>
              <span className="flex h-2 w-2 rounded-full animate-ping" style={{ background: 'var(--color-rose)' }} />
              <span className="flex items-center gap-1.5" style={{ color: 'var(--color-rose)' }}>
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{t('landing.heroBadge', 'AI-Powered Parcel Intelligence')}</span>
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-serif text-[var(--color-navy)] leading-[1.12]">
              Turn Parcel Labels <br />
              <span className="font-normal italic" style={{ color: 'var(--color-rose)' }}>
                Into Actionable Data.
              </span>
            </h1>

            {/* Supporting Subtitle */}
            <p className="text-sm sm:text-base lg:text-lg font-medium leading-relaxed max-w-xl text-[var(--color-text-secondary)]">
              {t(
                'landing.heroSubtitle',
                'Extract orders, SKUs, customers, quantities, shipping details and more from any parcel label using AI.'
              )}
            </p>

            {/* Action CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <NavLink
                to="/upload"
                className="group relative inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-extrabold text-white shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, var(--color-navy) 0%, var(--color-deep-purple) 100%)',
                  boxShadow: '0 8px 24px rgba(29, 26, 57, 0.28), 0 0 16px rgba(174, 68, 90, 0.25)'
                }}
              >
                {/* Animated shimmer beam on hover */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                <Scan className="w-4 h-4 text-blush-light group-hover:rotate-90 transition-transform duration-300" />
                <span>{t('landing.heroPrimaryCta', 'Parse Your First Label')}</span>
              </NavLink>

              <NavLink
                to="/dashboard"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all duration-200 hover:bg-white/80 active:scale-[0.98] cursor-pointer shadow-xs"
                style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  border: '1px solid var(--color-border-light)',
                  color: 'var(--color-navy)',
                  backdropFilter: 'blur(8px)'
                }}
              >
                <span>{t('landing.heroSecondaryCta', 'Explore Dashboard')}</span>
                <ArrowRight className="w-4 h-4 text-[var(--color-rose)] transition-transform group-hover:translate-x-1" />
              </NavLink>
            </div>

            {/* Value Highlights Pills */}
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-[var(--color-border-light)] text-[11px] font-bold text-[var(--color-text-secondary)]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero Manual Typing</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Gemini Vision AI</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Stock & RTO Sync</span>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: 3D PARCEL & FLOATING CARDS ================= */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            {/* Ambient Background Aura */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
              <div className="w-[360px] sm:w-[460px] h-[360px] sm:h-[460px] rounded-full blur-3xl opacity-35"
                style={{ background: 'radial-gradient(circle, var(--color-rose) 0%, transparent 70%)' }} />
            </div>

            {/* 3D Parcel Canvas Wrapper */}
            <div className="w-full max-w-[500px] h-[440px] sm:h-[480px] relative">
              <Hero3DParcel onMouseCoords={setMouseOffset} />

              {/* --- Floating Extracted Card 1: Order ID (Top Left) --- */}
              <div
                className="absolute -top-3 -left-2 sm:-left-6 p-2.5 sm:p-3 rounded-2xl shadow-lg transition-transform duration-300 pointer-events-none select-none animate-float"
                style={{
                  background: 'rgba(255, 255, 255, 0.94)',
                  border: '1px solid var(--color-border-light)',
                  backdropFilter: 'blur(16px)',
                  transform: `translate3d(${mouseOffset.x * -18}px, ${mouseOffset.y * -18}px, 0)`,
                  boxShadow: '0 10px 30px rgba(29, 26, 57, 0.12)'
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-[10px] font-bold shadow-xs"
                    style={{ background: 'linear-gradient(135deg, var(--color-navy), var(--color-deep-purple))' }}>
                    <Hash className="w-3.5 h-3.5 text-blush-light" />
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider font-extrabold text-[var(--color-text-muted)]">Order ID</span>
                    <span className="font-mono text-xs font-bold text-[var(--color-navy)]">#OD3379524675</span>
                  </div>
                </div>
              </div>

              {/* --- Floating Extracted Card 2: SKU & Product (Top Right) --- */}
              <div
                className="absolute -top-2 -right-2 sm:-right-6 p-2.5 sm:p-3 rounded-2xl shadow-lg transition-transform duration-300 pointer-events-none select-none animate-float"
                style={{
                  animationDelay: '1.2s',
                  background: 'rgba(255, 255, 255, 0.94)',
                  border: '1px solid var(--color-border-light)',
                  backdropFilter: 'blur(16px)',
                  transform: `translate3d(${mouseOffset.x * 22}px, ${mouseOffset.y * 22}px, 0)`,
                  boxShadow: '0 10px 30px rgba(29, 26, 57, 0.12)'
                }}
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ color: 'var(--color-rose)', background: 'var(--color-accent-light)', border: '1px solid var(--color-accent-muted)' }}>
                    D01
                  </span>
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider font-extrabold text-[var(--color-text-muted)]">Verified SKU</span>
                    <span className="text-xs font-bold text-[var(--color-navy)]">White Sadi</span>
                  </div>
                </div>
              </div>

              {/* --- Floating Extracted Card 3: Customer (Middle Right) --- */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -right-4 sm:-right-8 p-2.5 sm:p-3 rounded-2xl shadow-lg transition-transform duration-300 pointer-events-none select-none animate-float"
                style={{
                  animationDelay: '0.6s',
                  background: 'rgba(255, 255, 255, 0.94)',
                  border: '1px solid var(--color-border-light)',
                  backdropFilter: 'blur(16px)',
                  transform: `translate3d(${mouseOffset.x * 16}px, ${mouseOffset.y * 16}px, 0)`,
                  boxShadow: '0 10px 30px rgba(29, 26, 57, 0.12)'
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs" style={{ background: 'var(--color-accent-light)' }}>
                    <User className="w-3.5 h-3.5 text-[var(--color-rose)]" />
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider font-extrabold text-[var(--color-text-muted)]">Customer</span>
                    <span className="text-xs font-bold text-[var(--color-navy)]">Dr Jayakumar Sharma</span>
                  </div>
                </div>
              </div>

              {/* --- Floating Extracted Card 4: Quantity & Live Stock (Bottom Left) --- */}
              <div
                className="absolute -bottom-3 -left-2 sm:-left-6 p-2.5 sm:p-3 rounded-2xl shadow-lg transition-transform duration-300 pointer-events-none select-none animate-float"
                style={{
                  animationDelay: '1.8s',
                  background: 'rgba(255, 255, 255, 0.94)',
                  border: '1px solid var(--color-border-light)',
                  backdropFilter: 'blur(16px)',
                  transform: `translate3d(${mouseOffset.x * -20}px, ${mouseOffset.y * -20}px, 0)`,
                  boxShadow: '0 10px 30px rgba(29, 26, 57, 0.12)'
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold"
                    style={{ background: 'var(--color-success-light)', color: 'var(--color-success)', border: '1px solid var(--color-success-border)' }}>
                    1×
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider font-extrabold text-[var(--color-text-muted)]">Qty / Inventory</span>
                    <span className="text-xs font-bold text-emerald-700">Stock Deducted: 1 Unit</span>
                  </div>
                </div>
              </div>

              {/* --- Floating Extracted Card 5: Return / Realized Profit (Bottom Right) --- */}
              <div
                className="absolute -bottom-4 -right-2 sm:-right-4 p-2.5 sm:p-3 rounded-2xl shadow-lg transition-transform duration-300 pointer-events-none select-none animate-float"
                style={{
                  animationDelay: '2.4s',
                  background: 'rgba(255, 255, 255, 0.94)',
                  border: '1px solid var(--color-border-light)',
                  backdropFilter: 'blur(16px)',
                  transform: `translate3d(${mouseOffset.x * 14}px, ${mouseOffset.y * 14}px, 0)`,
                  boxShadow: '0 10px 30px rgba(29, 26, 57, 0.12)'
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{ color: 'var(--color-rose)', background: 'var(--color-danger-light)', border: '1px solid var(--color-danger-border)' }}>
                    Customer Return
                  </span>
                  <span className="text-xs font-mono font-bold text-[var(--color-navy)]">Net: +₹400</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
