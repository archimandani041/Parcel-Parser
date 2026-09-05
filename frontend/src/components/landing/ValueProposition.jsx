import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  Boxes,
  RotateCcw,
  TrendingUp,
  ShieldAlert,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export default function ValueProposition() {
  const { t } = useTranslation();

  const values = [
    {
      icon: Clock,
      title: '95% Less Manual Typing',
      desc: 'Instead of manually transcribing 16-digit order numbers, customer names, and addresses, an AI scan takes under 3 seconds with zero typographical mistakes.',
      badge: 'Operational Speed'
    },
    {
      icon: Boxes,
      title: 'Accurate Physical Inventory',
      desc: 'Every scanned parcel immediately marks items as sold or restocked, ensuring your physical warehouse stock matches your digital catalog with zero drift.',
      badge: 'Stock Integrity'
    },
    {
      icon: RotateCcw,
      title: 'Customer Returns vs. RTO Auditing',
      desc: 'Never confuse courier delivery failures (RTO) with customer dissatisfaction. Track return reasons, verify condition, and recover courier loss claims.',
      badge: 'Return Transparency'
    },
    {
      icon: TrendingUp,
      title: 'True Net Profit Per SKU',
      desc: 'Get immediate clarity on whether high-volume products are actually profitable once return freight penalties and purchase costs are factored in.',
      badge: 'Financial Control'
    }
  ];

  return (
    <section id="value" className="py-16 sm:py-24 relative overflow-hidden bg-white/40 border-t border-[var(--color-border-light)] scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider"
            style={{ background: 'var(--color-accent-light)', color: 'var(--color-rose)', border: '1px solid var(--color-accent-muted)' }}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>Measurable Value</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-serif text-[var(--color-navy)]">
            Built Directly For The Realities Of <br />
            <span className="font-normal italic" style={{ color: 'var(--color-rose)' }}>
              High-Volume E-Commerce Sellers
            </span>
          </h2>

          <p className="text-xs sm:text-sm font-medium leading-relaxed text-[var(--color-text-secondary)]">
            Designed to solve the daily operational friction of warehouse shipping and returns without complex enterprise ERP software.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {values.map((v, idx) => {
            const Icon = v.icon;
            return (
              <div
                key={idx}
                className="p-7 rounded-3xl bg-white border border-[var(--color-border-light)] shadow-xs transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex items-start gap-5"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                  style={{
                    background: 'var(--color-accent-light)',
                    color: 'var(--color-rose)',
                    border: '1px solid var(--color-accent-muted)'
                  }}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-extrabold tracking-tight text-[var(--color-navy)] font-serif">
                      {v.title}
                    </h3>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[var(--color-surface-muted)] text-[var(--color-navy)]">
                      {v.badge}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-[var(--color-text-secondary)] leading-relaxed">
                    {v.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
