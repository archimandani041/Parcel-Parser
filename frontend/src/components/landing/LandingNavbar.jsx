import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Boxes,
  Sparkles,
  ShieldCheck,
  Eye,
  TrendingUp,
  LayoutDashboard,
  ArrowRight,
  Menu,
  X,
  HelpCircle
} from 'lucide-react';
import LanguageSelector from '../LanguageSelector';

export default function LandingNavbar() {
  const { t, i18n } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const navContainerRef = useRef(null);
  const navItemRefs = useRef({});
  const mobileMenuRef = useRef(null);
  const toggleButtonRef = useRef(null);
  const [pillStyle, setPillStyle] = useState({ opacity: 0 });

  const landingNavItems = [
    { id: 'how-it-works', label: t('landingNav.howItWorks', 'How It Works'), icon: Sparkles },
    { id: 'features', label: t('landingNav.features', 'Features'), icon: ShieldCheck },
    { id: 'preview', label: t('landingNav.preview', 'Live Preview'), icon: Eye },
    { id: 'value', label: t('landingNav.value', 'Why ParcelAI'), icon: TrendingUp },
    { id: 'faq', label: t('landingNav.faq', 'FAQ'), icon: HelpCircle },
  ];

  // Update sliding active pill position and dimensions
  const updatePill = useCallback(() => {
    const activeRef = navItemRefs.current[activeSection];
    const container = navContainerRef.current;
    if (activeRef && container && activeSection) {
      const containerRect = container.getBoundingClientRect();
      const itemRect = activeRef.getBoundingClientRect();
      setPillStyle({
        left: `${itemRect.left - containerRect.left}px`,
        width: `${itemRect.width}px`,
        opacity: 1,
      });
    } else {
      setPillStyle((prev) => ({
        ...prev,
        opacity: 0,
      }));
    }
  }, [activeSection]);

  useEffect(() => {
    updatePill();
    const rafId = requestAnimationFrame(updatePill);
    window.addEventListener('resize', updatePill);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updatePill);
    };
  }, [updatePill, i18n.language]);

  // Scroll detection for compacting navbar, progress bar & active section scroll-spy
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 20);

      // Compute scroll progress percentage
      const totalScrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScrollHeight > 0) {
        setScrollProgress((scrollY / totalScrollHeight) * 100);
      }

      // Top of page (Hero section active)
      if (scrollY < 180) {
        setActiveSection('');
        return;
      }

      // Reached near bottom of page
      if (window.innerHeight + scrollY >= document.documentElement.scrollHeight - 80) {
        setActiveSection(landingNavItems[landingNavItems.length - 1].id);
        return;
      }

      // Focal point below sticky navbar
      const focalY = 200;
      let matched = '';

      for (const item of landingNavItems) {
        const el = document.getElementById(item.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= focalY && rect.bottom > focalY) {
            matched = item.id;
            break;
          }
        }
      }

      if (matched) {
        setActiveSection(matched);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [landingNavItems]);

  // Close mobile menu when clicking outside or pressing Escape
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleClickOutside = (event) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        toggleButtonRef.current &&
        !toggleButtonRef.current.contains(event.target)
      ) {
        setMobileMenuOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [mobileMenuOpen]);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const navOffset = 76;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - navOffset,
        behavior: 'smooth'
      });
      setActiveSection(id);
      setMobileMenuOpen(false);
    }
  };

  const scrollToTop = (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveSection('');
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* 1. Global Viewport Top Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 h-[2.5px] z-[60] pointer-events-none transition-all duration-75"
        style={{
          width: `${scrollProgress}%`,
          background: 'linear-gradient(90deg, var(--color-amber) 0%, var(--color-rose) 50%, var(--color-deep-purple) 100%)',
          boxShadow: '0 0 10px rgba(174, 68, 90, 0.4)'
        }}
      />

      {/* 2. Floating Navbar Header */}
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 pointer-events-none ${
          isScrolled ? 'py-2' : 'py-3 sm:py-3.5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div
            className={`floating-navbar pointer-events-auto rounded-2xl px-3.5 py-2.5 sm:px-6 sm:py-3 flex items-center justify-between gap-2 sm:gap-4 transition-all duration-300 ${
              isScrolled ? 'shadow-xl' : 'shadow-md'
            }`}
            style={{
              background: isScrolled ? 'rgba(253, 245, 244, 0.95)' : 'rgba(253, 245, 244, 0.9)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid var(--color-border-light)',
              boxShadow: isScrolled
                ? '0 12px 36px rgba(29, 26, 57, 0.12), 0 0 1px rgba(29, 26, 57, 0.15)'
                : '0 8px 32px rgba(29, 26, 57, 0.08)'
            }}
          >
            {/* Left: Brand Logo */}
            <button
              onClick={scrollToTop}
              className="flex items-center gap-2 sm:gap-2.5 group shrink-0 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-left"
            >
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white shadow-md group-hover:rotate-3 transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, var(--color-navy) 0%, var(--color-deep-purple) 100%)',
                  boxShadow: '0 4px 14px rgba(29,26,57,0.3)'
                }}
              >
                <Boxes className="w-4 h-4 sm:w-5 sm:h-5 text-blush-light group-hover:scale-110 transition-transform duration-200" />
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight font-serif" style={{ color: 'var(--color-navy)' }}>
                  {t('nav.parcelAI', 'ParcelAI')}
                </span>
                <span
                  className="hidden sm:inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full"
                  style={{
                    background: 'var(--color-accent-light)',
                    color: 'var(--color-rose)',
                    border: '1px solid var(--color-accent-muted)'
                  }}
                >
                  <Sparkles className="w-2.5 h-2.5 animate-pulse" /> AI
                </span>
              </div>
            </button>

            {/* Center: Landing Navigation Anchor Links with Sliding Pill Indicator */}
            <nav
              ref={navContainerRef}
              className="hidden lg:flex items-center gap-1 p-1 rounded-2xl relative"
              style={{
                background: 'var(--color-surface-muted)',
                border: '1px solid var(--color-border-light)'
              }}
            >
              {/* Sliding Active Pill Background */}
              <div
                className="absolute top-1 h-[calc(100%-8px)] rounded-xl transition-all duration-300 pointer-events-none"
                style={{
                  ...pillStyle,
                  background: 'linear-gradient(135deg, var(--color-navy) 0%, var(--color-deep-purple) 100%)',
                  boxShadow: '0 4px 14px rgba(29, 26, 57, 0.25), 0 0 12px rgba(174, 68, 90, 0.2)',
                  transitionTimingFunction: 'var(--ease-spring)',
                }}
              />

              {landingNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    ref={(el) => { navItemRefs.current[item.id] = el; }}
                    onClick={() => scrollToSection(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-200 relative z-10 group cursor-pointer ${
                      isActive ? '' : 'hover:bg-white/60'
                    }`}
                    style={isActive ? {
                      color: 'var(--color-blush-light)',
                    } : {
                      color: 'var(--color-text-secondary)'
                    }}
                  >
                    <Icon className={`w-3.5 h-3.5 transition-all duration-200 ${
                      isActive ? 'text-blush-light' : 'group-hover:scale-110 text-[var(--color-rose)]'
                    }`} />
                    <span>{item.label}</span>
                    {item.badge && !isActive && (
                      <span
                        className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full leading-none"
                        style={{ background: 'var(--color-rose)', color: 'white' }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Right: Language Selector & Open Dashboard CTA Button */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              <div className="hidden sm:block">
                <LanguageSelector />
              </div>

              {/* Primary CTA: Directly Enters Dashboard */}
              <NavLink
                to="/dashboard"
                className="pill-button-dark flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-5 sm:py-2.5 text-xs font-extrabold shadow-lg transition-all duration-200 cursor-pointer shrink-0 relative overflow-hidden group rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, var(--color-navy) 0%, var(--color-deep-purple) 100%)',
                  color: 'white',
                  boxShadow: '0 4px 16px rgba(29,26,57,0.3), 0 0 14px rgba(174,68,90,0.25)'
                }}
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                <LayoutDashboard className="w-3.5 h-3.5 text-blush-light group-hover:rotate-6 transition-transform duration-300 shrink-0" />
                <span className="hidden sm:inline">{t('landingNav.openDashboard', 'Open Dashboard')}</span>
                <span className="sm:hidden">Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5 text-blush-light group-hover:translate-x-1 transition-transform duration-200 shrink-0 hidden sm:inline" />
              </NavLink>

              {/* Mobile Hamburger Button */}
              <button
                ref={toggleButtonRef}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl bg-white/80 hover:bg-white border border-[var(--color-border-light)] text-[var(--color-navy)] transition-colors cursor-pointer shrink-0 shadow-xs"
                aria-label="Toggle Navigation Menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Mobile Dropdown Menu Sheet */}
          {mobileMenuOpen && (
            <div
              ref={mobileMenuRef}
              className="lg:hidden mt-2 p-4 rounded-2xl pointer-events-auto space-y-3 animate-fade-in shadow-2xl"
              style={{
                background: 'rgba(253, 245, 244, 0.98)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid var(--color-border-light)',
                boxShadow: '0 16px 40px rgba(29, 26, 57, 0.15)'
              }}
            >
              <div className="space-y-1">
                {landingNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[var(--color-surface-muted)] text-[var(--color-rose)] shadow-xs'
                          : 'text-[var(--color-navy)] hover:bg-[var(--color-surface-muted)]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-[var(--color-rose)]" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full"
                          style={{ background: 'var(--color-rose)', color: 'white' }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-[var(--color-border-light)] flex flex-col gap-2.5">
                <NavLink
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-md"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-navy) 0%, var(--color-deep-purple) 100%)',
                  }}
                >
                  <LayoutDashboard className="w-4 h-4 text-blush-light" />
                  <span>{t('landingNav.openDashboard', 'Open Dashboard')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </NavLink>

                <div className="flex justify-between items-center px-1 pt-1 sm:hidden">
                  <span className="text-xs font-bold text-[var(--color-text-muted)]">
                    {t('common.language', 'Language')}
                  </span>
                  <LanguageSelector />
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
