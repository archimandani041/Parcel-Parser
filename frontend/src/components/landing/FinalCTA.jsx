import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Scan,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Zap
} from 'lucide-react';

export default function FinalCTA() {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 sm:py-28 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main CTA Card with Pulsing Glow */}
        <div
          className={`relative rounded-3xl sm:rounded-[36px] p-8 sm:p-14 lg:p-16 text-center overflow-hidden animate-cta-glow transition-all duration-800 ${
            isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-[0.96] translate-y-8'
          }`}
          style={{
            background: 'linear-gradient(135deg, var(--color-navy) 0%, var(--color-deep-purple) 50%, var(--color-plum) 100%)',
            border: '1px solid rgba(232, 188, 185, 0.25)',
          }}
        >
          {/* Ambient Lighting Orbs */}
          <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full blur-3xl opacity-35 pointer-events-none"
            style={{ background: 'var(--color-rose)' }} />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full blur-3xl opacity-30 pointer-events-none"
            style={{ background: 'var(--color-amber)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-15 pointer-events-none"
            style={{ background: 'var(--color-rose-light)' }} />

          {/* Floating Subtle Particles */}
          <div className="absolute top-10 left-[15%] w-3 h-3 rounded-full bg-white/20 animate-float-particle pointer-events-none" />
          <div className="absolute top-20 right-[20%] w-2 h-2 rounded-full bg-amber-300/30 animate-float-particle pointer-events-none" style={{ animationDelay: '1.5s' }} />
          <div className="absolute bottom-12 left-[25%] w-2.5 h-2.5 rounded-full bg-rose-300/25 animate-float-particle pointer-events-none" style={{ animationDelay: '3s' }} />
          <div className="absolute bottom-16 right-[15%] w-2 h-2 rounded-full bg-white/25 animate-float-particle pointer-events-none" style={{ animationDelay: '4.5s' }} />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide"
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(232, 188, 185, 0.3)',
                color: 'var(--color-blush-light)',
                backdropFilter: 'blur(10px)'
              }}>
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Instant AI Verification · Zero Setup Required</span>
            </div>

            {/* Headline */}
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-serif text-white leading-tight">
              Ready to Simplify Your <br />
              <span className="font-normal italic" style={{ color: 'var(--color-blush)' }}>
                Parcel Operations?
              </span>
            </h2>

            {/* Subtitle */}
            <p className="text-sm sm:text-base font-medium text-[var(--color-blush-light)] max-w-lg mx-auto leading-relaxed opacity-90">
              {t(
                'landing.finalCtaSubtitle',
                'Upload a label and let ParcelAI turn it into structured, actionable data for orders, stock, and returns.'
              )}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3 sm:pt-4">
              <NavLink
                to="/upload"
                className="group relative inline-flex items-center justify-center gap-2.5 px-8 sm:px-10 py-4 rounded-2xl text-xs sm:text-sm font-extrabold text-[#1D1A39] bg-white shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden cursor-pointer"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-rose-100/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                <Scan className="w-4 h-4 text-[var(--color-rose)] group-hover:rotate-90 transition-transform duration-300" />
                <span>{t('landing.uploadLabelNow', 'Upload Label Now')}</span>
              </NavLink>

              <NavLink
                to="/dashboard"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl text-xs sm:text-sm font-extrabold text-white transition-all duration-200 hover:bg-white/15 active:scale-95 cursor-pointer"
                style={{
                  border: '1px solid rgba(232, 188, 185, 0.35)',
                  background: 'rgba(255, 255, 255, 0.05)'
                }}
              >
                <span>{t('landing.viewDashboard', 'Explore Dashboard')}</span>
                <ArrowRight className="w-4 h-4 text-[var(--color-blush)]" />
              </NavLink>
            </div>

            {/* Highlights */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-5 sm:gap-7 text-[11px] sm:text-xs font-bold text-[var(--color-blush-light)] opacity-85">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Compatible with all courier stickers</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Multi-lingual Gujarati & Hindi support</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Excel & Supabase export ready</span>
              </div>
            </div>

            {/* Trust Signal */}
            <div className="pt-2 text-[10px] font-semibold text-white/50 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/80" />
              <span>Your images are processed securely in-memory and never shared</span>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
