import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Scan,
  ArrowRight,
  Sparkles,
  Boxes,
  CheckCircle2
} from 'lucide-react';

export default function FinalCTA() {
  const { t } = useTranslation();

  return (
    <section className="py-16 sm:py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main CTA Card */}
        <div
          className="relative rounded-3xl p-8 sm:p-14 text-center overflow-hidden shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, var(--color-navy) 0%, var(--color-deep-purple) 60%, var(--color-plum) 100%)',
            border: '1px solid rgba(232,188,185,0.2)',
            boxShadow: '0 25px 60px -15px rgba(29, 26, 57, 0.4), 0 0 30px rgba(174, 68, 90, 0.25)'
          }}
        >
          {/* Ambient Lighting Orbs */}
          <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full blur-3xl opacity-30 pointer-events-none"
            style={{ background: 'var(--color-rose)' }} />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full blur-3xl opacity-25 pointer-events-none"
            style={{ background: 'var(--color-amber)' }} />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(232, 188, 185, 0.25)',
                color: 'var(--color-blush-light)',
                backdropFilter: 'blur(8px)'
              }}>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Instant AI Verification · No Credit Card Required</span>
            </div>

            {/* Headline */}
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-serif text-white leading-tight">
              Ready to Simplify Your <br />
              <span className="font-normal italic" style={{ color: 'var(--color-blush)' }}>
                Parcel Operations?
              </span>
            </h2>

            {/* Subtitle */}
            <p className="text-xs sm:text-base font-medium text-[var(--color-blush-light)] max-w-lg mx-auto leading-relaxed opacity-90">
              {t(
                'landing.finalCtaSubtitle',
                'Upload a label and let ParcelAI turn it into structured, actionable data for orders, stock, and returns.'
              )}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <NavLink
                to="/upload"
                className="group relative inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-xs sm:text-sm font-extrabold text-[#1D1A39] bg-white shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden cursor-pointer"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-rose-100/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                <Scan className="w-4 h-4 text-[var(--color-rose)] group-hover:rotate-90 transition-transform duration-300" />
                <span>{t('landing.uploadLabelNow', 'Upload Label Now')}</span>
              </NavLink>

              <NavLink
                to="/dashboard"
                className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-xs sm:text-sm font-extrabold text-white transition-all duration-200 hover:bg-white/10 active:scale-95 cursor-pointer"
                style={{
                  border: '1px solid rgba(232, 188, 185, 0.3)'
                }}
              >
                <span>{t('landing.viewDashboard', 'Explore Dashboard')}</span>
                <ArrowRight className="w-4 h-4 text-[var(--color-blush)]" />
              </NavLink>
            </div>

            {/* Highlights */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-[11px] font-bold text-[var(--color-blush-light)] opacity-80">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Compatible with all courier stickers</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Multi-lingual Gujarati & Hindi support</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Excel & Supabase export ready</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
