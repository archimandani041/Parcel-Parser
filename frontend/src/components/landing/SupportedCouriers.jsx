import React from 'react';
import {
  Truck,
  Package,
  ShoppingBag,
  Send,
  Plane,
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

const COURIERS = [
  { name: 'Delhivery Express', tag: 'Direct API & Label OCR', icon: Truck, color: '#AE445A' },
  { name: 'Ekart Logistics', tag: 'Flipkart AWBs', icon: Package, color: '#F39F5A' },
  { name: 'Amazon Shipping', tag: 'FBA & EasyShip', icon: ShoppingBag, color: '#1D1A39' },
  { name: 'Blue Dart Express', tag: 'Aviation Air Waybills', icon: Plane, color: '#451952' },
  { name: 'XpressBees', tag: 'E-com Hyperlocal', icon: Send, color: '#662549' },
  { name: 'Shadowfax', tag: 'Quick Commerce & D2C', icon: Truck, color: '#AE445A' },
  { name: 'DTDC Courier', tag: 'Domestic & Regional', icon: Package, color: '#1D1A39' },
  { name: 'India Post Speed Post', tag: 'Government Pincodes', icon: Send, color: '#F39F5A' },
];

export default function SupportedCouriers() {
  return (
    <section className="py-10 sm:py-14 relative overflow-hidden border-b border-[var(--color-border-light)] bg-white/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Subtle Section Label */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 sm:mb-8 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-navy)]">
              Multi-Courier & Marketplace Compatibility
            </p>
          </div>
          <span className="text-[11px] font-semibold text-[var(--color-text-muted)]">
            Recognizes thermal 4×6, A4 laser sheets, damaged prints & rotated scans
          </span>
        </div>

        {/* Infinite Scrolling Marquee */}
        <div className="relative w-full overflow-hidden mask-gradient-marquee">
          {/* Edge fade gradients */}
          <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-[var(--color-bg)] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-[var(--color-bg)] to-transparent z-10 pointer-events-none" />

          {/* Marquee Track */}
          <div className="flex items-center gap-4 sm:gap-6 animate-marquee whitespace-nowrap will-change-transform py-2">
            {[...COURIERS, ...COURIERS].map((courier, idx) => {
              const Icon = courier.icon;
              return (
                <div
                  key={idx}
                  className="inline-flex items-center gap-3 px-4 sm:px-5 py-3 rounded-2xl bg-white border border-[var(--color-border-light)] shadow-xs transition-all duration-300 hover:shadow-md hover:border-[var(--color-border-strong)] shrink-0 group cursor-default"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 shadow-xs"
                    style={{ background: 'var(--color-surface-muted)', color: courier.color }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="block text-xs sm:text-sm font-extrabold text-[var(--color-navy)] font-serif group-hover:text-[var(--color-rose)] transition-colors">
                      {courier.name}
                    </span>
                    <span className="block text-[10px] font-semibold text-[var(--color-text-muted)]">
                      {courier.tag}
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
