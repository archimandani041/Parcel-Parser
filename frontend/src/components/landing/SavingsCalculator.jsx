import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Calculator,
  Clock,
  CheckCircle2,
  TrendingUp,
  Zap,
  ArrowRight,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export default function SavingsCalculator() {
  const { t } = useTranslation();
  const [dailyParcels, setDailyParcels] = useState(150);

  // Mathematical calculations (assuming 2.5 mins manual per parcel vs 2.5s AI scan, 26 working days)
  const monthlyParcels = dailyParcels * 26;
  const manualHoursMonth = Math.round((monthlyParcels * 2.5) / 60);
  const aiHoursMonth = Math.round((monthlyParcels * 0.04) / 60);
  const hoursSaved = Math.max(1, manualHoursMonth - aiHoursMonth);
  const errorsAvoided = Math.round(monthlyParcels * 0.042); // 4.2% average typo rate in manual entry
  const moneySaved = Math.round(hoursSaved * 150); // standard warehouse labor value

  return (
    <section className="py-20 sm:py-28 relative overflow-hidden bg-white/60 border-t border-[var(--color-border-light)] scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider"
            style={{ background: 'var(--color-accent-light)', color: 'var(--color-rose)', border: '1px solid var(--color-accent-muted)' }}>
            <Calculator className="w-3.5 h-3.5" />
            <span>Interactive Operational ROI</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-serif text-[var(--color-navy)]">
            Calculate How Much Time You'll Save <br />
            <span className="font-normal italic" style={{ color: 'var(--color-rose)' }}>
              In Your Warehouse Every Month
            </span>
          </h2>

          <p className="text-sm sm:text-base font-medium leading-relaxed text-[var(--color-text-secondary)] max-w-lg mx-auto">
            Drag the slider to your daily shipping volume and see instant operational savings.
          </p>
        </div>

        {/* Calculator Main Box */}
        <div className="max-w-4xl mx-auto p-6 sm:p-10 lg:p-12 rounded-3xl bg-white border border-[var(--color-border-light)] shadow-xl relative overflow-hidden">
          
          {/* Subtle Ambient Background Accent */}
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-10 pointer-events-none"
            style={{ background: 'var(--color-rose)' }} />

          {/* Slider Control Row */}
          <div className="space-y-4 mb-10 pb-8 border-b border-[var(--color-border-light)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-sm font-extrabold text-[var(--color-navy)] uppercase tracking-wider font-mono">
                  Daily Shipping Volume
                </span>
                <p className="text-xs text-[var(--color-text-muted)]">Number of parcels packed or returned per day</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-3xl sm:text-4xl font-black font-mono text-[var(--color-rose)]">
                  {dailyParcels.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase">
                  labels / day
                </span>
              </div>
            </div>

            {/* Custom Range Slider */}
            <input
              type="range"
              min="20"
              max="1000"
              step="10"
              value={dailyParcels}
              onChange={(e) => setDailyParcels(Number(e.target.value))}
              className="w-full h-3 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, var(--color-rose) 0%, var(--color-plum) ${((dailyParcels - 20) / 980) * 100}%, var(--color-surface-muted) ${((dailyParcels - 20) / 980) * 100}%, var(--color-surface-muted) 100%)`,
                accentColor: 'var(--color-rose)'
              }}
            />

            <div className="flex justify-between text-[11px] font-bold text-[var(--color-text-muted)] font-mono">
              <span>20 labels</span>
              <span>250 labels</span>
              <span>500 labels</span>
              <span>750 labels</span>
              <span>1,000+ labels</span>
            </div>
          </div>

          {/* Computed Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            {/* Metric 1: Hours Saved */}
            <div className="p-6 rounded-2xl bg-[var(--color-surface-muted)]/60 border border-[var(--color-border-light)] text-center relative group hover:border-[var(--color-rose)] transition-colors">
              <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center shadow-xs"
                style={{ background: 'var(--color-accent-light)', color: 'var(--color-rose)' }}>
                <Clock className="w-5 h-5" />
              </div>
              <div className="text-3xl sm:text-4xl font-black font-mono text-[var(--color-navy)] mb-1">
                {hoursSaved} hrs
              </div>
              <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block">
                Saved Every Month
              </span>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                ~{(hoursSaved / 26).toFixed(1)} hours of typing saved every single day
              </p>
            </div>

            {/* Metric 2: Errors Avoided */}
            <div className="p-6 rounded-2xl bg-[var(--color-surface-muted)]/60 border border-[var(--color-border-light)] text-center relative group hover:border-[var(--color-rose)] transition-colors">
              <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center shadow-xs"
                style={{ background: 'rgba(61,122,82,0.1)', color: '#3D7A52' }}>
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-700 mb-1">
                {errorsAvoided.toLocaleString()}
              </div>
              <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block">
                Typo Errors Prevented
              </span>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                Zero misrouted parcels or missing customer phone digits
              </p>
            </div>

            {/* Metric 3: Value Saved */}
            <div className="p-6 rounded-2xl bg-[var(--color-surface-muted)]/60 border border-[var(--color-border-light)] text-center relative group hover:border-[var(--color-rose)] transition-colors">
              <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center shadow-xs"
                style={{ background: 'rgba(243,159,90,0.15)', color: '#F39F5A' }}>
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="text-3xl sm:text-4xl font-black font-mono text-[var(--color-navy)] mb-1">
                ₹{moneySaved.toLocaleString('en-IN')}
              </div>
              <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block">
                Estimated Labor Value
              </span>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                Redirect warehouse effort to fast packing & customer support
              </p>
            </div>
          </div>

          {/* Comparison Bar: Manual vs ParcelAI */}
          <div className="p-5 rounded-2xl bg-white border border-[var(--color-border-light)] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-extrabold text-[var(--color-navy)] uppercase tracking-wider">
                  Speed Comparison
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Manual entry takes ~150 seconds per parcel. ParcelAI multimodal scan takes ~2.4 seconds.
              </p>
            </div>

            <NavLink
              to="/upload"
              className="pill-button-dark px-6 py-2.5 rounded-full text-xs font-extrabold text-white flex items-center gap-2 shrink-0 shadow-md group"
              style={{
                background: 'linear-gradient(135deg, var(--color-navy), var(--color-deep-purple))'
              }}
            >
              <span>Test It With A Label</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </NavLink>
          </div>

        </div>

      </div>
    </section>
  );
}
