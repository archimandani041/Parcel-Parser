import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  UploadCloud,
  Cpu,
  FileCheck2,
  Boxes,
  RotateCcw,
  Sparkles,
  ArrowDown
} from 'lucide-react';

export default function HowItWorks() {
  const { t } = useTranslation();

  const steps = [
    {
      num: '01',
      title: 'Upload Label',
      desc: 'Drag & drop single or batch shipping labels in JPG, PNG, WEBP, or PDF format directly into the browser.',
      icon: UploadCloud,
      badge: 'Zero Configuration'
    },
    {
      num: '02',
      title: 'Gemini Vision AI Reads Label',
      desc: 'Multimodal vision processes tilted scans, messy courier fonts, damaged barcodes, and multi-lingual text.',
      icon: Cpu,
      badge: 'Multimodal OCR'
    },
    {
      num: '03',
      title: 'Structured Data Extracted',
      desc: 'Order IDs, SKUs, customer details, courier AWBs, and item quantities are mapped into clean data fields.',
      icon: FileCheck2,
      badge: 'Instant Validation'
    },
    {
      num: '04',
      title: 'Manage Orders & Inventory',
      desc: 'Inventory records automatically deduct sold quantities and link customer tracking numbers in real time.',
      icon: Boxes,
      badge: 'Real-Time Sync'
    },
    {
      num: '05',
      title: 'Track Returns & Profit',
      desc: 'Differentiate Customer Returns from courier RTOs, restock returned units, and monitor net profit margins.',
      icon: RotateCcw,
      badge: 'Profit & Loss Audit'
    }
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-24 relative overflow-hidden scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider"
            style={{ background: 'var(--color-accent-light)', color: 'var(--color-rose)', border: '1px solid var(--color-accent-muted)' }}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>Workflow Automation</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-serif text-[var(--color-navy)]">
            How ParcelAI Works in <br />
            <span className="font-normal italic" style={{ color: 'var(--color-rose)' }}>
              Five Effortless Steps
            </span>
          </h2>

          <p className="text-xs sm:text-sm font-medium leading-relaxed text-[var(--color-text-secondary)]">
            From physical sticker to full financial reconciliation in less than five seconds.
          </p>
        </div>

        {/* Connected Timeline Grid */}
        <div className="relative">
          {/* Connecting Line across Desktop */}
          <div className="hidden lg:block absolute top-1/2 left-8 right-8 h-0.5 -translate-y-12 pointer-events-none -z-10"
            style={{
              background: 'linear-gradient(90deg, var(--color-border-light) 0%, var(--color-rose) 50%, var(--color-border-light) 100%)'
            }} />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="group relative flex flex-col justify-between p-6 rounded-3xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl bg-white border border-[var(--color-border-light)] shadow-xs"
                >
                  <div>
                    {/* Step Number & Icon Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:rotate-6 shadow-md"
                        style={{
                          background: index === 1
                            ? 'linear-gradient(135deg, var(--color-rose), var(--color-plum))'
                            : 'linear-gradient(135deg, var(--color-navy), var(--color-deep-purple))',
                          color: 'var(--color-blush-light)'
                        }}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="font-mono text-2xl font-black text-[var(--color-border-strong)] group-hover:text-[var(--color-rose)] transition-colors">
                        {step.num}
                      </span>
                    </div>

                    {/* Step Content */}
                    <h3 className="text-sm font-extrabold tracking-tight text-[var(--color-navy)] mb-2 font-serif">
                      {step.title}
                    </h3>
                    <p className="text-xs font-medium text-[var(--color-text-secondary)] leading-relaxed">
                      {step.desc}
                    </p>
                  </div>

                  {/* Step Bottom Badge */}
                  <div className="pt-4 mt-4 border-t border-[var(--color-border-light)]">
                    <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md"
                      style={{ background: 'var(--color-surface-muted)', color: 'var(--color-navy)' }}>
                      {step.badge}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
