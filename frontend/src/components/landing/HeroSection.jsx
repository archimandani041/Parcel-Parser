import React, { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Sparkles,
  Zap,
  Target,
  Clock
} from 'lucide-react';

function AnimatedCounter({ end, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [started, end, duration]);

  return <span ref={ref} className="stat-number">{count}{suffix}</span>;
}

export default function HeroSection() {
  const { t } = useTranslation();
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  const handleLearnMore = () => {
    const el = document.getElementById('how-it-works') || document.getElementById('features');
    if (el) {
      const navOffset = 76;
      const elementPosition = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - navOffset,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section id="hero" className="w-full pt-3 sm:pt-4 pb-8 px-4 sm:px-6 lg:px-8">
      <div
        className="max-w-7xl mx-auto relative rounded-2xl sm:rounded-[32px] overflow-hidden border border-[var(--color-navy)]/15 shadow-xl min-h-[420px] sm:min-h-[480px] lg:min-h-[540px] flex items-center justify-center py-8 sm:py-12"
        style={{
          background: 'var(--color-bg)',
          boxShadow: '0 16px 48px rgba(29, 26, 57, 0.09), 0 0 1px rgba(29, 26, 57, 0.2)'
        }}
      >
        {/* Background Video */}
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

        {/* Ambient Light Overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse 75% 65% at 50% 50%, rgba(253, 245, 244, 0.92) 0%, rgba(253, 245, 244, 0.65) 50%, transparent 85%),
              linear-gradient(180deg, rgba(253, 245, 244, 0.85) 0%, rgba(253, 245, 244, 0.4) 35%, rgba(253, 245, 244, 0.15) 65%, rgba(253, 245, 244, 0.4) 100%)
            `
          }}
        />

        {/* Decorative Glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full pointer-events-none -z-0 opacity-20 blur-3xl"
          style={{
            background: 'radial-gradient(ellipse, rgba(243, 159, 90, 0.3) 0%, rgba(174, 68, 90, 0.2) 50%, transparent 75%)'
          }}
        />

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center justify-center my-auto">

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif text-[var(--color-navy)] tracking-tight leading-[1.08] max-w-2xl mx-auto text-center animate-fade-in">
            {t('landing.heroSimplify', 'Simplify Your Business')}{' '}
            <br />
            <span
              className="font-serif-italic italic"
              style={{
                background: 'linear-gradient(135deg, var(--color-rose), var(--color-plum), var(--color-deep-purple))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              {t('landing.heroLogistics', 'Logistics')}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-4 sm:mt-5 text-sm sm:text-base md:text-lg text-[var(--color-text-secondary)] font-medium max-w-xl mx-auto leading-relaxed text-center animate-fade-in" style={{ animationDelay: '0.1s' }}>
            {t(
              'landing.heroSubtitle',
              'Track shipments, manage inventory, and gain clarity—all in one powerful AI platform.'
            )}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-row items-center justify-center gap-3 sm:gap-4 mt-7 sm:mt-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <button
              onClick={handleLearnMore}
              className="px-6 py-3 sm:px-8 sm:py-3.5 rounded-full text-xs sm:text-sm font-bold text-[var(--color-navy)] transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] cursor-pointer shadow-sm hover:shadow-lg border border-white/80 bg-white/90 hover:bg-white backdrop-blur-md"
            >
              {t('landing.learnMore', 'Learn more')}
            </button>

            <NavLink
              to="/upload"
              className="pill-button-dark px-6 py-3 sm:px-9 sm:py-3.5 rounded-full text-xs sm:text-sm font-extrabold text-white shadow-lg transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] cursor-pointer flex items-center justify-center gap-2 group"
              style={{
                background: 'linear-gradient(135deg, var(--color-navy) 0%, var(--color-deep-purple) 100%)',
                boxShadow: '0 6px 24px rgba(29, 26, 57, 0.28), 0 0 16px rgba(174, 68, 90, 0.15)'
              }}
            >
              <span>{t('landing.tryItFree', 'Try It Free Today')}</span>
              <ArrowRight className="w-4 h-4 text-blush-light group-hover:translate-x-1 transition-transform duration-200" />
            </NavLink>
          </div>

          {/* Animated Stats Row */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mt-8 sm:mt-10 animate-fade-in" style={{ animationDelay: '0.35s' }}>
            {[
              { icon: Zap, value: 500, suffix: '+', label: 'Labels Parsed' },
              { icon: Target, value: 99, suffix: '.2%', label: 'Accuracy' },
              { icon: Clock, value: 3, suffix: 's', label: 'Processing', prefix: '<' },
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="flex items-center gap-2.5 text-center group">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'var(--color-accent-light)', color: 'var(--color-rose)' }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-base sm:text-lg font-extrabold font-mono text-[var(--color-navy)] leading-tight">
                      {stat.prefix || ''}<AnimatedCounter end={stat.value} suffix={stat.suffix} />
                    </div>
                    <div className="text-[10px] sm:text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                      {stat.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live AI Engine Badge */}
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
