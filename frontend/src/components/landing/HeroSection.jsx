import React, { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Check,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function HeroSection() {
  const { t } = useTranslation();
  const videoRef = useRef(null);

  // Ensure seamless continuous playback in infinite loop
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  const handleLearnMore = () => {
    const el = document.getElementById('how-it-works') || document.getElementById('features') || document.getElementById('demo');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="hero" className="w-full pt-3 sm:pt-4 pb-6 px-4 sm:px-6 lg:px-8">
      {/* Outer Framed Showcase Card — Full width max-w-7xl matching navbar, compact height */}
      <div
        className="max-w-7xl mx-auto relative rounded-2xl sm:rounded-[32px] overflow-hidden border border-[var(--color-navy)]/15 shadow-xl min-h-[360px] sm:min-h-[390px] lg:min-h-[420px] flex items-center justify-center py-6 sm:py-8"
        style={{
          background: 'var(--color-bg)',
          boxShadow: '0 16px 48px rgba(29, 26, 57, 0.09), 0 0 1px rgba(29, 26, 57, 0.2)'
        }}
      >
        {/* 1. Cinematic Background Video — Infinite Seamless Loop */}
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onEnded={() => {
            if (videoRef.current) {
              videoRef.current.currentTime = 0;
              videoRef.current.play().catch(() => {});
            }
          }}
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none transition-opacity duration-700"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* 2. Tuned Ambient Light Overlay: centered spotlight for 100% crisp typography */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse 75% 65% at 50% 50%, rgba(253, 245, 244, 0.9) 0%, rgba(253, 245, 244, 0.62) 50%, transparent 85%),
              linear-gradient(180deg, rgba(253, 245, 244, 0.8) 0%, rgba(253, 245, 244, 0.35) 35%, rgba(253, 245, 244, 0.1) 65%, rgba(253, 245, 244, 0.35) 100%)
            `
          }}
        />

        {/* Subtle decorative radial glow aligned with theme colors */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[260px] rounded-full pointer-events-none -z-0 opacity-25 blur-3xl"
          style={{
            background: 'radial-gradient(ellipse, rgba(243, 159, 90, 0.25) 0%, rgba(174, 68, 90, 0.15) 50%, transparent 75%)'
          }}
        />

        {/* 3. Hero Content — True Center Alignment (Vertically & Horizontally) */}
        <div className="relative z-10 w-full max-w-2xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center justify-center my-auto">
          
          {/* Feature Checkmark Row (Clean, subtle, matching Arbor reference) */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 sm:gap-6 md:gap-7 pb-3 sm:pb-4 animate-fade-in">
            <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold tracking-wide text-[var(--color-navy)]/80">
              <div className="w-3.5 h-3.5 rounded-full border border-[var(--color-navy)]/50 flex items-center justify-center text-[var(--color-navy)] shrink-0">
                <Check className="w-2.5 h-2.5 stroke-[2.5]" />
              </div>
              <span>{t('landing.featureExtraction', 'AI Label Extraction')}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold tracking-wide text-[var(--color-navy)]/80">
              <div className="w-3.5 h-3.5 rounded-full border border-[var(--color-navy)]/50 flex items-center justify-center text-[var(--color-navy)] shrink-0">
                <Check className="w-2.5 h-2.5 stroke-[2.5]" />
              </div>
              <span>{t('landing.featureStock', 'Smart Stock Sync')}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold tracking-wide text-[var(--color-navy)]/80">
              <div className="w-3.5 h-3.5 rounded-full border border-[var(--color-navy)]/50 flex items-center justify-center text-[var(--color-navy)] shrink-0">
                <Check className="w-2.5 h-2.5 stroke-[2.5]" />
              </div>
              <span>{t('landing.featureReconciliation', 'Team Collaboration')}</span>
            </div>
          </div>

          {/* Main Headline: Centered, Beautiful Proportional Editorial Serif */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[50px] font-serif text-[var(--color-navy)] tracking-tight leading-[1.1] max-w-xl mx-auto text-center">
            {t('landing.heroSimplify', 'Simplify Your Business')}{' '}
            <br />
            <span className="font-serif-italic italic text-[var(--color-navy)]">
              {t('landing.heroLogistics', 'Logistics')}
            </span>
          </h1>

          {/* Supporting Subtitle: Balanced & Centered */}
          <p className="mt-3 text-xs sm:text-sm md:text-base text-[var(--color-text-secondary)] font-medium max-w-lg mx-auto leading-relaxed text-center">
            {t(
              'landing.heroSubtitle',
              'Track shipments, manage inventory, and gain clarity—all in one powerful AI platform.'
            )}
          </p>

          {/* Action Call-to-Action Pill Buttons */}
          <div className="flex flex-row items-center justify-center gap-3 mt-5">
            {/* Light / Frosted Glass Pill Button */}
            <button
              onClick={handleLearnMore}
              className="px-5 py-2.5 sm:px-6 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold text-[var(--color-navy)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-xs hover:shadow-md border border-white/80 bg-white/85 hover:bg-white backdrop-blur-md"
            >
              {t('landing.learnMore', 'Learn more')}
            </button>

            {/* Dark Brand Pill Button */}
            <NavLink
              to="/upload"
              className="pill-button-dark px-5 py-2.5 sm:px-7 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold text-white shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 group"
              style={{
                background: 'linear-gradient(135deg, var(--color-navy) 0%, var(--color-deep-purple) 100%)',
                boxShadow: '0 4px 16px rgba(29, 26, 57, 0.22), 0 0 10px rgba(174, 68, 90, 0.12)'
              }}
            >
              <span>{t('landing.tryItFree', 'Try It Free Today')}</span>
              <ArrowRight className="w-3 h-3 text-blush-light group-hover:translate-x-0.5 transition-transform duration-200" />
            </NavLink>
          </div>
        </div>

        {/* 4. Subtle Live Status Badge */}
        <div className="absolute bottom-3 left-4 sm:bottom-4 sm:left-6 pointer-events-none z-20">
          <div className="pointer-events-auto hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-[var(--color-navy)] bg-white/65 backdrop-blur-md border border-[var(--color-border-light)]/60 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ background: 'var(--color-rose)' }} />
            <Sparkles className="w-2.5 h-2.5 text-[var(--color-rose)]" />
            <span>Gemini Vision AI Engine Active</span>
          </div>
        </div>

      </div>
    </section>
  );
}
