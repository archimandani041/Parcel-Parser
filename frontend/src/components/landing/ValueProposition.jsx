import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  Boxes,
  RotateCcw,
  TrendingUp,
  Sparkles
} from 'lucide-react';

export default function ValueProposition() {
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
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const values = [
    {
      icon: Clock,
      stat: '95%',
      title: '95% Less Manual Typing',
      desc: 'Instead of manually transcribing 16-digit order numbers, customer names, and addresses, an AI scan takes under 3 seconds with zero typographical mistakes.',
      badge: 'Operational Speed'
    },
    {
      icon: Boxes,
      stat: '0',
      title: 'Accurate Physical Inventory',
      desc: 'Every scanned parcel immediately marks items as sold or restocked, ensuring your physical warehouse stock matches your digital catalog with zero drift.',
      badge: 'Stock Integrity'
    },
    {
      icon: RotateCcw,
      stat: '2x',
      title: 'Customer Returns vs. RTO Auditing',
      desc: 'Never confuse courier delivery failures (RTO) with customer dissatisfaction. Track return reasons, verify condition, and recover courier loss claims.',
      badge: 'Return Transparency'
    },
    {
      icon: TrendingUp,
      stat: '₹',
      title: 'True Net Profit Per SKU',
      desc: 'Get immediate clarity on whether high-volume products are actually profitable once return freight penalties and purchase costs are factored in.',
      badge: 'Financial Control'
    }
  ];

  return (
    <section
      id="value"
      ref={sectionRef}
      className="py-20 sm:py-28 relative overflow-hidden bg-white/40 border-t border-[var(--color-border-light)] scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div
          className={`text-center max-w-3xl mx-auto space-y-4 mb-16 sm:mb-20 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider"
            style={{ background: 'var(--color-accent-light)', color: 'var(--color-rose)', border: '1px solid var(--color-accent-muted)' }}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>Measurable Value</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-serif text-[var(--color-navy)]">
            Built Directly For The Realities Of <br />
            <span className="font-normal italic" style={{ color: 'var(--color-rose)' }}>
              High-Volume E-Commerce Sellers
            </span>
          </h2>

          <p className="text-sm sm:text-base font-medium leading-relaxed text-[var(--color-text-secondary)] max-w-lg mx-auto">
            Designed to solve the daily operational friction of warehouse shipping and returns without complex enterprise ERP software.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {values.map((v, idx) => {
            const Icon = v.icon;
            const isWarm = idx === 1 || idx === 3;
            return (
              <div
                key={idx}
                className={`transition-all duration-700 ease-out p-8 rounded-3xl border border-[var(--color-border-light)] flex flex-col items-start gap-6 hover:-translate-y-2 hover:shadow-xl shadow-xs group ${
                  isWarm 
                    ? 'bg-gradient-to-br from-[var(--color-blush-lighter)] to-white' 
                    : 'bg-white'
                }`}
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
                  transitionDelay: `${idx * 150}ms`
                }}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm bg-[var(--color-accent-light)] text-[var(--color-rose)] border border-[var(--color-accent-muted)] group-hover:scale-105 transition-transform duration-300">
                  <Icon className="w-7 h-7" />
                </div>
                
                <div className="space-y-3">
                  <div className="text-4xl sm:text-5xl font-black font-mono"
                    style={{
                      background: 'linear-gradient(135deg, var(--color-rose), var(--color-plum))',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    {v.stat}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-[var(--color-navy)] font-serif">
                      {v.title}
                    </h3>
                    <span className="inline-flex text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--color-surface-muted)] text-[var(--color-navy)] border border-[var(--color-border-light)]">
                      {v.badge}
                    </span>
                  </div>
                  
                  <p className="text-xs sm:text-sm font-medium text-[var(--color-text-secondary)] leading-relaxed">
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
