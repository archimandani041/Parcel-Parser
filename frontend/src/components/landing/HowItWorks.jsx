import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  UploadCloud,
  Cpu,
  FileCheck2,
  Boxes,
  RotateCcw,
  Sparkles
} from 'lucide-react';

export default function HowItWorks() {
  const { t } = useTranslation();
  const sectionRef = useRef(null);
  const [visibleSteps, setVisibleSteps] = useState([]);

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

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          steps.forEach((_, index) => {
            setTimeout(() => {
              setVisibleSteps(prev => [...prev, index]);
            }, index * 150);
          });
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="how-it-works" className="py-20 sm:py-28 relative overflow-hidden scroll-mt-20" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className={`text-center max-w-3xl mx-auto space-y-4 mb-16 sm:mb-20 transition-all duration-700 ${
          visibleSteps.length > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider"
            style={{ background: 'var(--color-accent-light)', color: 'var(--color-rose)', border: '1px solid var(--color-accent-muted)' }}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>Workflow Automation</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-serif text-[var(--color-navy)]">
            How ParcelAI Works in <br />
            <span className="font-normal italic" style={{ color: 'var(--color-rose)' }}>
              Five Effortless Steps
            </span>
          </h2>

          <p className="text-sm sm:text-base font-medium leading-relaxed text-[var(--color-text-secondary)] max-w-lg mx-auto">
            From physical sticker to full financial reconciliation in less than five seconds.
          </p>
        </div>

        {/* Timeline Grid */}
        <div className="relative">
          {/* Desktop Connecting Line with Shimmer */}
          <div className="hidden lg:block absolute top-1/2 left-8 right-8 -translate-y-12 pointer-events-none -z-10">
            <div className="h-1 rounded-full timeline-shimmer opacity-60" />
          </div>

          {/* Mobile Vertical Connecting Line */}
          <div className="lg:hidden absolute top-0 bottom-0 left-[23px] w-0.5 pointer-events-none -z-10"
            style={{
              background: 'linear-gradient(180deg, var(--color-border-light) 0%, var(--color-rose) 30%, var(--color-rose) 70%, var(--color-border-light) 100%)'
            }}
          />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 lg:gap-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isVisible = visibleSteps.includes(index);
              return (
                <div
                  key={step.num}
                  className={`relative transition-all duration-700 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                >
                  {/* Mobile Step Connector Dot */}
                  <div className="lg:hidden absolute left-0 top-8 w-[11px] h-[11px] rounded-full border-2 border-white z-10 -translate-x-[1px]"
                    style={{ background: isVisible ? 'var(--color-rose)' : 'var(--color-border-light)' }}
                  />

                  {/* Step Card */}
                  <div
                    className="group relative flex flex-col justify-between p-7 ml-10 lg:ml-0 rounded-3xl transition-all duration-300 hover:-translate-y-2 hover:shadow-xl bg-white border border-[var(--color-border-light)] shadow-sm"
                    style={{
                      borderLeft: '3px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderLeftColor = index === 1 ? 'var(--color-rose)' : 'var(--color-navy)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderLeftColor = 'transparent';
                    }}
                  >
                    <div>
                      {/* Step Number & Icon Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105 shadow-md"
                          style={{
                            background: index === 1
                              ? 'linear-gradient(135deg, var(--color-rose), var(--color-plum))'
                              : 'linear-gradient(135deg, var(--color-navy), var(--color-deep-purple))',
                            color: 'var(--color-blush-light)'
                          }}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="font-mono text-2xl font-black text-[var(--color-border-strong)] group-hover:text-[var(--color-rose)] transition-colors duration-300">
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
                      <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md"
                        style={{ background: 'var(--color-surface-muted)', color: 'var(--color-navy)' }}>
                        {step.badge}
                      </span>
                    </div>
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
