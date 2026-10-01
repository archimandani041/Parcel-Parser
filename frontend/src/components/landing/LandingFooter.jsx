import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Boxes, Sparkles, Heart, ArrowUp } from 'lucide-react';
import LanguageSelector from '../LanguageSelector';

export default function LandingFooter() {
  const { t } = useTranslation();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full relative bg-white/80 backdrop-blur-md pt-14 pb-10">
      {/* Decorative Top Gradient Border Line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, var(--color-rose) 25%, var(--color-plum) 50%, var(--color-navy) 75%, transparent 100%)'
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-[var(--color-border-light)]">
          
          {/* Brand Col */}
          <div className="md:col-span-5 space-y-4">
            <NavLink to="/" onClick={scrollToTop} className="inline-flex items-center gap-2.5 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white shadow-md group-hover:rotate-3 transition-transform duration-300"
                style={{
                  background: 'linear-gradient(135deg, var(--color-navy) 0%, var(--color-deep-purple) 100%)',
                  boxShadow: '0 4px 14px rgba(29,26,57,0.25)'
                }}>
                <Boxes className="w-4 h-4 sm:w-5 sm:h-5 text-blush-light" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight font-serif" style={{ color: 'var(--color-navy)' }}>
                  ParcelAI
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--color-accent-light)', color: 'var(--color-rose)', border: '1px solid var(--color-accent-muted)' }}>
                  <Sparkles className="w-2.5 h-2.5 animate-pulse" /> AI
                </span>
              </div>
            </NavLink>
            <p className="text-xs sm:text-sm font-medium text-[var(--color-text-secondary)] leading-relaxed max-w-sm">
              Intelligent shipping label extraction and automated inventory reconciliation powered by Gemini Vision AI and Supabase.
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-4 grid grid-cols-2 gap-6 text-xs">
            <div>
              <h5 className="font-extrabold uppercase tracking-wider text-[var(--color-navy)] mb-3 text-[10px]">
                Product Features
              </h5>
              <ul className="space-y-2.5 font-semibold text-[var(--color-text-secondary)]">
                <li><NavLink to="/upload" className="hover:text-[var(--color-rose)] transition-colors">Upload & Parse</NavLink></li>
                <li><NavLink to="/orders" className="hover:text-[var(--color-rose)] transition-colors">Orders Directory</NavLink></li>
                <li><NavLink to="/stock" className="hover:text-[var(--color-rose)] transition-colors">Stock Management</NavLink></li>
                <li><NavLink to="/return" className="hover:text-[var(--color-rose)] transition-colors">Return Tracking</NavLink></li>
              </ul>
            </div>
            <div>
              <h5 className="font-extrabold uppercase tracking-wider text-[var(--color-navy)] mb-3 text-[10px]">
                Resources
              </h5>
              <ul className="space-y-2.5 font-semibold text-[var(--color-text-secondary)]">
                <li><NavLink to="/dashboard" className="hover:text-[var(--color-rose)] transition-colors">Executive Dashboard</NavLink></li>
                <li><NavLink to="/documents" className="hover:text-[var(--color-rose)] transition-colors">Parsed Documents</NavLink></li>
                <li><span className="opacity-50 cursor-not-allowed">API Docs</span></li>
                <li><span className="opacity-50 cursor-not-allowed">Changelog</span></li>
              </ul>
            </div>
          </div>

          {/* Language Selector in Footer */}
          <div className="md:col-span-3 space-y-3">
            <h5 className="font-extrabold uppercase tracking-wider text-[var(--color-navy)] text-[10px]">
              Platform Language
            </h5>
            <div className="inline-block">
              <LanguageSelector />
            </div>
            <p className="text-[11px] font-medium text-[var(--color-text-muted)] leading-relaxed">
              Full multi-language support for English, Hindi, and Gujarati.
            </p>
          </div>

        </div>

        {/* Bottom Copyright & Back to Top */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-[var(--color-text-muted)]">
          <p>© {new Date().getFullYear()} ParcelAI Inc. All rights reserved.</p>
          
          <div className="flex items-center gap-1.5">
            <span>Built with</span>
            <Heart className="w-3.5 h-3.5 text-[var(--color-rose)] fill-[var(--color-rose)] inline" />
            <span>for modern e-commerce logistics</span>
          </div>

          <button
            onClick={scrollToTop}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[var(--color-border-light)] text-[var(--color-navy)] shadow-xs hover:bg-[var(--color-surface-muted)] transition-colors cursor-pointer text-xs font-bold"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5 text-[var(--color-rose)]" />
          </button>
        </div>

      </div>
    </footer>
  );
}
