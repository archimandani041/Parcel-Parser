import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Scan,
  Package,
  Boxes,
  RotateCcw,
  TrendingUp,
  FileSpreadsheet,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import TiltCard from '../animations/TiltCard';

export default function FeatureGrid() {
  const { t } = useTranslation();

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
    <section id="features" className="py-16 sm:py-24 relative overflow-hidden bg-white/50 border-t border-[var(--color-border-light)] scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider"
            style={{ background: 'var(--color-accent-light)', color: 'var(--color-rose)', border: '1px solid var(--color-accent-muted)' }}>
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Built for Modern Logistics</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-serif text-[var(--color-navy)]">
            Engineered to Solve Your <br />
            <span className="font-normal italic" style={{ color: 'var(--color-rose)' }}>
              Daily E-Commerce Bottlenecks
            </span>
          </h2>

          <p className="text-xs sm:text-sm font-medium leading-relaxed text-[var(--color-text-secondary)]">
            Everything you need to transform paper parcel stickers into structured inventory and financial clarity.
          </p>
        </div>

        {/* 6 Feature Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <TiltCard
                key={item.title}
                maxTilt={6}
                glare={true}
                className="p-7 rounded-3xl transition-all duration-300 bg-white border border-[var(--color-border-light)] shadow-xs flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar with Icon and Tag */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md"
                      style={{
                        background: 'linear-gradient(135deg, var(--color-navy), var(--color-deep-purple))',
                        boxShadow: '0 4px 14px rgba(29,26,57,0.2)'
                      }}>
                      <Icon className="w-6 h-6 text-blush-light" />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full"
                      style={{ background: 'var(--color-surface-muted)', color: 'var(--color-navy)', border: '1px solid var(--color-border-light)' }}>
                      {item.tag}
                    </span>
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
                <div className="pt-4 border-t border-[var(--color-border-light)] space-y-1.5">
                  {item.points.map((pt, pIdx) => (
                    <div key={pIdx} className="flex items-center gap-2 text-[11px] font-bold text-[var(--color-navy)]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-rose)] shrink-0" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </TiltCard>
            );
          })}
        </div>

      </div>
    </section>
  );
}
