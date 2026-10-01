import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Scan,
  Package,
  Boxes,
  RotateCcw,
  TrendingUp,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import TiltCard from '../animations/TiltCard';

export default function FeatureGrid() {
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
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const features = [
    {
      title: 'AI Label Parsing',
      desc: 'Multimodal Gemini Vision extracts structured records from diverse label layouts, thermal prints, and courier formats with high OCR fidelity.',
      icon: Scan,
      tag: 'Core Intelligence',
      points: ['Multi-courier support', 'Rotated & skewed scans', 'Instant field normalization']
    },
    {
      title: 'Order Management',
      desc: 'Search, filter, and audit all processed parcel shipments with real-time query matching across Customer, SKU, Order ID, and Courier AWB.',
      icon: Package,
      tag: 'Unified Directory',
      points: ['Instant multi-field search', 'Quick status presets', 'One-click order audit']
    },
    {
      title: 'Smart Inventory',
      desc: 'Automatic inventory reconciliation tracking total added stock, sold quantities, customer returns, courier RTOs, and live available units.',
      icon: Boxes,
      tag: 'Zero Overselling',
      points: ['Automatic stock deduction', 'Low stock alerts', 'Live stock balance tracking']
    },
    {
      title: 'Return Management',
      desc: 'Isolate customer-initiated returns from logistics RTO delivery failures with automated inventory restock and undo verification.',
      icon: RotateCcw,
      tag: 'Return Auditing',
      points: ['Customer vs RTO breakdown', 'One-click restock return', 'Return loss accounting']
    },
    {
      title: 'Profit & Loss Valuation',
      desc: 'Real-time financial tracking calculating purchase costs, selling revenues, courier return losses, and net realized profit per SKU.',
      icon: TrendingUp,
      tag: 'Financial Clarity',
      points: ['Inline price editing', 'Margin & profit calculations', 'Delivery charge deduction']
    },
    {
      title: 'Excel Data Export',
      desc: 'Export your complete order registry and inventory valuations into clean, beautifully formatted Excel spreadsheets for accounting and ERP sync.',
      icon: FileSpreadsheet,
      tag: 'Instant Reporting',
      points: ['One-click .xlsx download', 'Pre-calculated formulas', 'ERP ready formatting']
    }
  ];

  return (
    <section
      id="features"
      ref={sectionRef}
      className="py-20 sm:py-28 relative overflow-hidden bg-white/50 border-t border-[var(--color-border-light)] scroll-mt-20"
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
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Built for Modern Logistics</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-serif text-[var(--color-navy)]">
            Engineered to Solve Your <br />
            <span className="font-normal italic" style={{ color: 'var(--color-rose)' }}>
              Daily E-Commerce Bottlenecks
            </span>
          </h2>

          <p className="text-sm sm:text-base font-medium leading-relaxed text-[var(--color-text-secondary)] max-w-lg mx-auto">
            Everything you need to transform paper parcel stickers into structured inventory and financial clarity.
          </p>
        </div>

        {/* Bento Feature Grid — first card spans 2 cols */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((item, idx) => {
            const Icon = item.icon;
            const isHero = idx === 0;
            return (
              <div
                key={item.title}
                className={`transition-all duration-700 ${isHero ? 'md:col-span-2 lg:col-span-2' : ''}`}
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
                  transitionDelay: `${idx * 100}ms`
                }}
              >
                <TiltCard
                  maxTilt={6}
                  glare={true}
                  className="p-7 rounded-3xl transition-all duration-300 bg-white border border-[var(--color-border-light)] shadow-sm flex flex-col justify-between group h-full hover:shadow-lg"
                >
                  <div>
                    {/* Top Bar with Icon and Tag */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md relative overflow-hidden group-hover:scale-105 transition-transform duration-300"
                        style={{
                          background: 'linear-gradient(135deg, var(--color-navy), var(--color-deep-purple))',
                          boxShadow: '0 4px 14px rgba(29,26,57,0.2)'
                        }}>
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <Icon className="w-6 h-6 text-[var(--color-blush)] relative z-10" />
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full"
                          style={{ background: 'var(--color-surface-muted)', color: 'var(--color-navy)', border: '1px solid var(--color-border-light)' }}>
                          {item.tag}
                        </span>
                        <ArrowRight className="w-4 h-4 text-[var(--color-rose)] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                      </div>
                    </div>

                    {/* Title & Desc */}
                    <h3 className="text-base font-extrabold tracking-tight text-[var(--color-navy)] mb-2 font-serif">
                      {item.title}
                    </h3>
                    <p className="text-xs font-medium text-[var(--color-text-secondary)] leading-relaxed mb-5">
                      {item.desc}
                    </p>
                  </div>

                  {/* Bullets */}
                  <div className="pt-4 border-t border-[var(--color-border-light)] space-y-1.5 mt-auto">
                    {item.points.map((pt, pIdx) => (
                      <div key={pIdx} className="flex items-center gap-2 text-[11px] font-bold text-[var(--color-navy)]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-rose)] shrink-0" />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </TiltCard>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
