import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Boxes,
  Sparkles,
  Cpu,
  ShieldCheck,
  Eye,
  TrendingUp,
  LayoutDashboard,
  ArrowRight,
  Menu,
  X
} from 'lucide-react';
import LanguageSelector from '../LanguageSelector';

export default function LandingNavbar() {
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const navContainerRef = useRef(null);
  const navItemRefs = useRef({});
  const [pillStyle, setPillStyle] = useState({});

  const landingNavItems = [
    { id: 'how-it-works', label: t('landingNav.howItWorks', 'How It Works'), icon: Sparkles },
    { id: 'demo', label: t('landingNav.demo', 'AI Demo'), icon: Cpu, badge: 'AI' },
    { id: 'features', label: t('landingNav.features', 'Features'), icon: ShieldCheck },
    { id: 'preview', label: t('landingNav.preview', 'Live Preview'), icon: Eye },
    { id: 'value', label: t('landingNav.value', 'Why ParcelAI'), icon: TrendingUp },
  ];

  // Scroll detection for compacting navbar & active section scroll-spy
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 20);

      // Scroll-spy across sections
      const sections = ['how-it-works', 'demo', 'features', 'preview', 'value'];
      let currentSection = '';

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const rect = el.getBoundingClientRect();
          // Active when section top is within top half of screen
          if (rect.top <= 250 && rect.bottom >= 150) {
            currentSection = sectionId;
            break;
          }
        }
      }

      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sliding pill indicator logic
  useEffect(() => {
    const updatePill = () => {
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
        setPillStyle({ opacity: 0 });
      }
    };

    updatePill();
    window.addEventListener('resize', updatePill);
    return () => window.removeEventListener('resize', updatePill);
  }, [activeSection]);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
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
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled ? 'py-2' : 'py-3.5'
      }`}
      style={{
        background: 'rgba(253, 245, 244, 0.95)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`floating-navbar rounded-2xl px-4 py-2.5 sm:px-6 sm:py-3 flex items-center justify-between gap-4 transition-all duration-300 shadow-md ${
            isScrolled ? 'shadow-lg' : ''
          }`}
          style={{
            background: 'rgba(253, 245, 244, 0.96)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--color-border-light)',
            boxShadow: '0 8px 32px rgba(29, 26, 57, 0.08)'
          }}
        >
          {/* Left: Brand Logo */}
          <button
            onClick={scrollToTop}
            className="flex items-center gap-2.5 group shrink-0 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-left"
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
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight font-serif" style={{ color: 'var(--color-navy)' }}>
                {t('nav.parcelAI', 'ParcelAI')}
              </span>
              <span
                className="hidden xs:inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full"
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
                      className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full"
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
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="hidden sm:block">
              <LanguageSelector />
            </div>

            {/* Primary CTA: Directly Enters Dashboard */}
            <NavLink
              to="/dashboard"
              className="pill-button-dark flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 text-xs font-extrabold shadow-lg transition-all duration-200 cursor-pointer shrink-0 relative overflow-hidden group rounded-xl"
              style={{
                background: 'linear-gradient(135deg, var(--color-navy) 0%, var(--color-deep-purple) 100%)',
                color: 'white',
                boxShadow: '0 4px 16px rgba(29,26,57,0.3), 0 0 14px rgba(174,68,90,0.25)'
              }}
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
              <LayoutDashboard className="w-3.5 h-3.5 text-blush-light group-hover:rotate-6 transition-transform duration-300" />
              <span>{t('landingNav.openDashboard', 'Open Dashboard')}</span>
              <ArrowRight className="w-3.5 h-3.5 text-blush-light group-hover:translate-x-1 transition-transform duration-200" />
            </NavLink>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-white border border-[var(--color-border-light)] text-[var(--color-navy)] cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Sheet */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-2 p-4 rounded-2xl bg-white border border-[var(--color-border-light)] shadow-xl space-y-3 animate-fade-in">
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
                        ? 'bg-[var(--color-surface-muted)] text-[var(--color-rose)]'
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

            <div className="pt-2 border-t border-[var(--color-border-light)] flex flex-col gap-2">
              <NavLink
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-extrabold text-white"
                style={{
                  background: 'linear-gradient(135deg, var(--color-navy) 0%, var(--color-deep-purple) 100%)',
                }}
              >
                <LayoutDashboard className="w-4 h-4 text-blush-light" />
                <span>{t('landingNav.openDashboard', 'Open Dashboard')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </NavLink>

              <div className="flex justify-between items-center px-1 pt-1">
                <span className="text-xs font-bold text-[var(--color-text-muted)]">Language</span>
                <LanguageSelector />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
