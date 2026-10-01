import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

export default function DashboardPreview() {
  const { t } = useTranslation();
  const [tilt, setTilt] = useState({ x: 6, y: -2 });
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      x: 6 - y * 8,
      y: -2 + x * 8
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 6, y: -2 });
    setIsHovered(false);
  };

  const annotations = [
    { label: 'Real-time sync', top: '12%', right: '-6%', delay: '0s' },
    { label: 'Auto-calculated', bottom: '25%', left: '-5%', delay: '0.5s' },
    { label: 'Live data', top: '35%', right: '-7%', delay: '1s' },
  ];

  return (
    <section id="preview" className="py-20 sm:py-28 relative overflow-hidden scroll-mt-20" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className={`text-center max-w-3xl mx-auto space-y-4 mb-14 sm:mb-16 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider"
            style={{ background: 'var(--color-accent-light)', color: 'var(--color-rose)', border: '1px solid var(--color-accent-muted)' }}>
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Interactive Operational Suite</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-serif text-[var(--color-navy)]">
            A Live Dashboard Built For <br />
            <span className="font-normal italic" style={{ color: 'var(--color-rose)' }}>
              Speed, Clarity & Profit Auditing
            </span>
          </h2>

          <p className="text-sm sm:text-base font-medium leading-relaxed text-[var(--color-text-secondary)] max-w-lg mx-auto">
            Every label you scan automatically reflects across real-time inventory balances, customer return registries, and net profit calculations.
          </p>
        </div>

        {/* 3D Perspective Preview Canvas */}
        <div
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={handleMouseLeave}
          className={`relative max-w-5xl mx-auto transition-all duration-800 ease-out ${
            isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-[0.92] translate-y-8'
          }`}
          style={{ perspective: '1400px' }}
        >
          {/* Ambient Glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-rose)] to-[var(--color-plum)] rounded-3xl opacity-15 blur-2xl -z-10 transform scale-95" />

          {/* Floating Annotation Badges */}
          {annotations.map((ann, idx) => (
            <div
              key={idx}
              className={`absolute hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold shadow-lg z-20 transition-all duration-500 animate-annotation-float ${
                isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
              }`}
              style={{
                top: ann.top,
                bottom: ann.bottom,
                left: ann.left,
                right: ann.right,
                background: 'rgba(253, 245, 244, 0.95)',
                border: '1px solid var(--color-border-light)',
                color: 'var(--color-navy)',
                backdropFilter: 'blur(8px)',
                animationDelay: ann.delay,
                transitionDelay: ann.delay
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {ann.label}
            </div>
          ))}

          {/* Perspective Container */}
          <div
            className="rounded-3xl p-4 sm:p-7 shadow-2xl transition-transform duration-200 ease-out border border-[var(--color-border-light)] overflow-hidden"
            style={{
              background: 'var(--color-bg)',
              transformStyle: 'preserve-3d',
              transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
              boxShadow: '0 25px 60px -15px rgba(29, 26, 57, 0.25), 0 0 30px rgba(174, 68, 90, 0.1)'
            }}
          >
            {/* Window Top Bar */}
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-[var(--color-border-light)]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-2 font-mono text-[11px] font-bold text-[var(--color-text-muted)]">
                  app.parcelai.io/stock
                </span>
              </div>
              <NavLink
                to="/dashboard"
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl bg-white border border-[var(--color-border-light)] text-[var(--color-navy)] shadow-xs hover:bg-[var(--color-accent-light)] transition-colors cursor-pointer"
              >
                <span>Launch App</span>
                <ExternalLink className="w-3 h-3 text-[var(--color-rose)]" />
              </NavLink>
            </div>

            {/* KPI Cards Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
              {[
                { label: 'TOTAL STOCK', val: '4 Units', gradient: 'var(--color-accent-light)' },
                { label: 'SOLD QTY', val: '2 Units', gradient: 'rgba(61,122,82,0.1)' },
                { label: 'CUST. RETURN', val: '1 Unit', gradient: 'rgba(243,159,90,0.15)' },
                { label: 'RTO RETURN', val: '1 Unit', gradient: 'rgba(174,68,90,0.12)' },
                { label: 'NET PROFIT', val: '+₹400', gradient: 'rgba(61,122,82,0.15)', text: 'text-emerald-700', highlight: true }
              ].map((kpi, idx) => (
                <div key={idx} className={`p-3 rounded-2xl border border-[var(--color-border-light)] shadow-xs ${
                  kpi.highlight ? 'bg-emerald-50/60' : 'bg-white'
                }`}>
                  <span className="block text-[9px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">{kpi.label}</span>
                  <span className={`text-sm sm:text-base font-extrabold font-mono ${kpi.text || 'text-[var(--color-navy)]'}`}>{kpi.val}</span>
                  {/* Mini gradient bar */}
                  <div className="mt-1.5 h-0.5 rounded-full w-full" style={{ background: kpi.gradient }} />
                </div>
              ))}
            </div>

            {/* Table Mockup */}
            <div className="rounded-2xl border border-[var(--color-border-light)] bg-white overflow-hidden shadow-xs">
              {/* Table Header */}
              <div className="grid grid-cols-12 bg-[#2B122A] text-white py-2.5 px-4 text-[10px] font-extrabold uppercase tracking-wider">
                <span className="col-span-2">SKU ID</span>
                <span className="col-span-3">Product Name</span>
                <span className="col-span-2 text-center">Total Qty</span>
                <span className="col-span-2 text-center">Purchase</span>
                <span className="col-span-2 text-center">Selling</span>
                <span className="col-span-1 text-right">Net</span>
              </div>

              {/* Row 1 */}
              <div className="grid grid-cols-12 py-3 px-4 text-xs items-center border-b border-[var(--color-border-light)]">
                <span className="col-span-2 font-mono font-bold text-[var(--color-rose)]">D01</span>
                <span className="col-span-3 font-bold text-[var(--color-navy)]">White Sadi</span>
                <span className="col-span-2 text-center font-mono font-semibold">3</span>
                <span className="col-span-2 text-center font-mono text-[var(--color-text-secondary)]">₹300</span>
                <span className="col-span-2 text-center font-mono text-[var(--color-text-secondary)]">₹500</span>
                <span className="col-span-1 text-right font-mono font-extrabold text-emerald-600">+₹400</span>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-12 py-3 px-4 text-xs items-center bg-[#FFF0F3] border-b border-[var(--color-border-light)]">
                <span className="col-span-2 font-mono font-bold text-[var(--color-rose)]">DPS24SIDU0838</span>
                <span className="col-span-3 font-bold text-[var(--color-navy)]">Barcode Scanner Pro</span>
                <span className="col-span-2 text-center font-mono font-semibold">1</span>
                <span className="col-span-2 text-center font-mono text-[var(--color-text-secondary)]">₹570</span>
                <span className="col-span-2 text-center font-mono text-[var(--color-text-secondary)]">₹800</span>
                <span className="col-span-1 text-right font-mono font-extrabold text-rose-600">-₹40</span>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-12 py-3 px-4 text-xs items-center">
                <span className="col-span-2 font-mono font-bold text-[var(--color-rose)]">MHRTN-445</span>
                <span className="col-span-3 font-bold text-[var(--color-navy)]">Premium Gift Box Set</span>
                <span className="col-span-2 text-center font-mono font-semibold">5</span>
                <span className="col-span-2 text-center font-mono text-[var(--color-text-secondary)]">₹180</span>
                <span className="col-span-2 text-center font-mono text-[var(--color-text-secondary)]">₹350</span>
                <span className="col-span-1 text-right font-mono font-extrabold text-emerald-600">+₹850</span>
              </div>
            </div>

            {/* Bottom Status Bar */}
            <div className="mt-5 flex items-center justify-between">
              <span className="flex items-center gap-2 text-[11px] font-bold text-[var(--color-text-muted)]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Real-time synchronized with Supabase database
              </span>
              <NavLink
                to="/stock"
                className="inline-flex items-center gap-2 text-xs font-extrabold text-[var(--color-rose)] hover:underline cursor-pointer group"
              >
                <span>View Full Stock Audit</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </NavLink>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
