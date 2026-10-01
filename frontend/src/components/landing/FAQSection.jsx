import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HelpCircle,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

const FAQS = [
  {
    q: 'Which courier formats and shipping labels are supported?',
    a: 'ParcelAI supports standard 4×6 thermal labels, A4 multi-label sheets, and mobile photo captures across Ekart (Flipkart), Delhivery, Amazon Shipping, Blue Dart, XpressBees, Shadowfax, DTDC, and India Post. Upload single files or batch drop multiple JPG, PNG, WEBP, or PDF scans simultaneously.'
  },
  {
    q: 'Can Gemini Vision AI process tilted, folded, or low-contrast thermal prints?',
    a: 'Yes. Powered by Google Gemini multimodal vision, the AI does not rely on rigid coordinates or template matching. It recognizes text at arbitrary angles (rotated 90°, 180°, or skewed scans), deciphers thermal fading, and correctly normalizes damaged barcode text strings.'
  },
  {
    q: 'How does real-time stock deduction and inventory sync work?',
    a: 'When an outgoing shipping label is scanned, the parsed SKU is matched against your inventory table in Supabase. The sold quantity is automatically decremented from Available Stock, keeping warehouse totals accurately reconciled without manual spreadsheet logging.'
  },
  {
    q: 'How does ParcelAI handle Customer Returns vs. Courier RTOs?',
    a: 'Courier delivery failures (RTO - Return To Origin) are strictly isolated from customer-initiated return disputes. You can mark items as restocked to return the unit back into available inventory, calculate freight return penalties, and maintain a clear audit trail for loss claims.'
  },
  {
    q: 'Can I export parsed shipments and financial summaries to Microsoft Excel?',
    a: 'Absolutely. With one click, download complete order registries, return breakdowns, and stock valuation spreadsheets in .xlsx format. Pre-calculated formulas for total revenues, cost of goods, and net profit margins are ready for immediate accounting review.'
  },
  {
    q: 'How is customer personal information protected?',
    a: 'All label scans are processed in-memory through secure encrypted API endpoints. Your image files and customer personal details are never stored on public servers or shared with third parties. Database records are stored securely in your private Supabase cloud.'
  }
];

export default function FAQSection() {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState(0); // first item open by default

  const toggle = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-20 sm:py-28 relative overflow-hidden bg-white/40 border-t border-[var(--color-border-light)] scroll-mt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider"
            style={{ background: 'var(--color-accent-light)', color: 'var(--color-rose)', border: '1px solid var(--color-accent-muted)' }}>
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Got Questions?</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-serif text-[var(--color-navy)]">
            Frequently Asked <br />
            <span className="font-normal italic" style={{ color: 'var(--color-rose)' }}>
              Questions
            </span>
          </h2>

          <p className="text-sm sm:text-base font-medium leading-relaxed text-[var(--color-text-secondary)]">
            Everything you need to know about label extraction, inventory synchronization, and return audits.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3.5">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl transition-all duration-300 border ${
                  isOpen
                    ? 'bg-white border-[var(--color-rose)]/40 shadow-md'
                    : 'bg-white/80 border-[var(--color-border-light)] hover:border-[var(--color-border-strong)] shadow-xs'
                }`}
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full py-4 sm:py-5 px-5 sm:px-6 text-left flex items-center justify-between gap-4 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-extrabold text-[var(--color-navy)] font-serif">
                    {faq.q}
                  </span>
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 ${
                    isOpen ? 'rotate-180 bg-[var(--color-accent-light)] text-[var(--color-rose)]' : 'bg-[var(--color-surface-muted)] text-[var(--color-navy)]'
                  }`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 pt-1 text-xs sm:text-sm font-medium text-[var(--color-text-secondary)] leading-relaxed border-t border-[var(--color-border-light)]/50 animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
