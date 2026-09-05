import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Scan,
  Cpu,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  FileText,
  Boxes,
  Truck,
  User,
  Hash,
  MapPin,
  TrendingUp,
  RefreshCw
} from 'lucide-react';

const SAMPLES = [
  {
    id: 'saree',
    title: 'Apparel Logistics Label',
    courier: 'Ekart Logistics',
    awb: 'FMPC-0982-3114',
    orderId: 'OD3379524675247100',
    sku: 'D01',
    product: 'White Sadi (Chiffon Embroidery)',
    customer: 'Dr Jayakumar Sharma',
    address: 'Flat 402, Royal Palms, Sector 18, Navi Mumbai, MH - 400705',
    qty: 1,
    sellingPrice: 500,
    costPrice: 300,
    returnType: 'Customer Return'
  },
  {
    id: 'electronics',
    title: 'Electronics Priority Express',
    courier: 'Delhivery Surface',
    awb: 'DEL-8874-9021',
    orderId: '38590586814875392_1',
    sku: 'DPS24SIDU0838',
    product: 'Smart Wireless Barcode Scanner Pro',
    customer: 'Sandeep Verma',
    address: 'B-12, Industrial Area Phase 2, Okhla, New Delhi - 110020',
    qty: 2,
    sellingPrice: 800,
    costPrice: 570,
    returnType: 'None (Delivered)'
  },
  {
    id: 'cosmetics',
    title: 'Fast-Track Fashion Parcel',
    courier: 'Bluedart Air',
    awb: 'BD-4412-8870',
    orderId: 'OD437952660555734100',
    sku: 'SKU-FASH-99',
    product: 'Designer Silk Dupatta (Maroon)',
    customer: 'Sushma Kumar',
    address: 'Plot 77, Jubilee Hills Road No 36, Hyderabad, TS - 500033',
    qty: 1,
    sellingPrice: 750,
    costPrice: 420,
    returnType: 'RTO Return'
  }
];

export default function AIParsingDemo() {
  const { t } = useTranslation();
  const [activeSampleIndex, setActiveSampleIndex] = useState(0);
  const [highlightField, setHighlightField] = useState(null);

  const sample = SAMPLES[activeSampleIndex];

  return (
    <section id="demo" className="py-16 sm:py-24 relative overflow-hidden bg-white/40 border-y border-[var(--color-border-light)] scroll-mt-20">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none -z-10 opacity-30"
        style={{ background: 'radial-gradient(circle, rgba(174,68,90,0.08) 0%, transparent 70%)' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider"
            style={{ background: 'var(--color-accent-light)', color: 'var(--color-rose)', border: '1px solid var(--color-accent-muted)' }}>
            <Cpu className="w-3.5 h-3.5" />
            <span>AI Transformation Engine</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-serif text-[var(--color-navy)]">
            From Messy Physical Label <br />
            <span className="font-normal italic" style={{ color: 'var(--color-rose)' }}>
              To Clean Structured Intelligence
            </span>
          </h2>

          <p className="text-xs sm:text-sm font-medium leading-relaxed text-[var(--color-text-secondary)]">
            Watch Gemini Vision AI detect barcodes, courier numbers, seller identifiers, and messy address lines in seconds with 99%+ accuracy.
          </p>

          {/* Sample Selector Tabs */}
          <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#F5E7E5] border border-[var(--color-border-light)] shadow-xs">
            {SAMPLES.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setActiveSampleIndex(idx)}
                className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  activeSampleIndex === idx
                    ? 'bg-[#1D1A39] text-white shadow-sm'
                    : 'text-[var(--color-text-secondary)] hover:bg-white/60'
                }`}
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>

        {/* Transformation Pipeline Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* ================= LEFT: STYLIZED PHYSICAL LABEL ================= */}
          <div className="lg:col-span-6">
            <div className="relative rounded-3xl p-6 sm:p-8 bg-[#FAF0EF] border border-[var(--color-border-light)] shadow-lg overflow-hidden">
              {/* Top Badge */}
              <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-light)]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#1D1A39] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    <Truck className="w-4 h-4 text-[var(--color-blush-light)]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-navy)]">{sample.courier}</h4>
                    <span className="text-[10px] font-mono text-[var(--color-text-muted)]">Standard Surface Delivery</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white border border-[var(--color-border-light)] text-[var(--color-navy)]">
                  AWB: {sample.awb}
                </span>
              </div>

              {/* Scanning Laser Animation Line */}
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[var(--color-rose)] to-transparent opacity-80 animate-scan pointer-events-none shadow-[0_0_12px_var(--color-rose)]" />

              {/* Physical Barcode Area */}
              <div
                onMouseEnter={() => setHighlightField('awb')}
                onMouseLeave={() => setHighlightField(null)}
                className="my-5 p-3 rounded-2xl bg-white border border-[var(--color-border-light)] text-center cursor-pointer transition-all hover:border-[var(--color-rose)] hover:shadow-md"
              >
                <div className="h-12 w-full flex items-center justify-center gap-1 overflow-hidden px-4">
                  {Array.from({ length: 48 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-10 bg-[#1D1A39]"
                      style={{ width: i % 4 === 0 ? '4px' : i % 3 === 0 ? '2px' : '1px' }}
                    />
                  ))}
                </div>
                <span className="block mt-1 font-mono text-xs font-bold text-[var(--color-navy)] tracking-widest">{sample.awb}</span>
              </div>

              {/* Label Information Grid */}
              <div className="space-y-3 text-xs">
                {/* Order ID & Customer */}
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onMouseEnter={() => setHighlightField('orderId')}
                    onMouseLeave={() => setHighlightField(null)}
                    className="p-3 rounded-xl bg-white/80 border border-[var(--color-border-light)] transition-all hover:border-[var(--color-rose)]"
                  >
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Order Number</span>
                    <span className="font-mono text-xs font-bold text-[var(--color-navy)] break-all">{sample.orderId}</span>
                  </div>
                  <div
                    onMouseEnter={() => setHighlightField('customer')}
                    onMouseLeave={() => setHighlightField(null)}
                    className="p-3 rounded-xl bg-white/80 border border-[var(--color-border-light)] transition-all hover:border-[var(--color-rose)]"
                  >
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Recipient</span>
                    <span className="text-xs font-bold text-[var(--color-navy)]">{sample.customer}</span>
                  </div>
                </div>

                {/* SKU & Product Details */}
                <div
                  onMouseEnter={() => setHighlightField('product')}
                  onMouseLeave={() => setHighlightField(null)}
                  className="p-3 rounded-xl bg-white/80 border border-[var(--color-border-light)] transition-all hover:border-[var(--color-rose)] flex items-center justify-between"
                >
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Item Description</span>
                    <span className="text-xs font-bold text-[var(--color-navy)]">{sample.product}</span>
                  </div>
                  <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg"
                    style={{ background: 'var(--color-accent-light)', color: 'var(--color-rose)', border: '1px solid var(--color-accent-muted)' }}>
                    SKU: {sample.sku}
                  </span>
                </div>

                {/* Shipping Address */}
                <div
                  onMouseEnter={() => setHighlightField('address')}
                  onMouseLeave={() => setHighlightField(null)}
                  className="p-3 rounded-xl bg-white/80 border border-[var(--color-border-light)] transition-all hover:border-[var(--color-rose)]"
                >
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Shipping Address</span>
                  <span className="text-xs font-medium text-[var(--color-text-secondary)] leading-relaxed">{sample.address}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ================= RIGHT: EXTRACTED STRUCTURED DATA ================= */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--color-rose)]" />
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[var(--color-navy)]">
                  Normalized Database Schema
                </h3>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                100% Parsed & Validated
              </span>
            </div>

            {/* Extracted Field Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              
              {/* Field 1: Order ID */}
              <div className={`p-3.5 rounded-2xl transition-all duration-200 border ${
                highlightField === 'orderId'
                  ? 'bg-rose-50 border-[var(--color-rose)] shadow-md scale-[1.02]'
                  : 'bg-white border-[var(--color-border-light)] shadow-xs'
              }`}>
                <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)] font-bold uppercase">
                  <span>order_id</span>
                  <Hash className="w-3 h-3 text-[var(--color-rose)]" />
                </div>
                <div className="mt-1 font-mono text-xs font-bold text-[var(--color-navy)] truncate" title={sample.orderId}>
                  {sample.orderId}
                </div>
              </div>

              {/* Field 2: SKU ID */}
              <div className={`p-3.5 rounded-2xl transition-all duration-200 border ${
                highlightField === 'product'
                  ? 'bg-rose-50 border-[var(--color-rose)] shadow-md scale-[1.02]'
                  : 'bg-white border-[var(--color-border-light)] shadow-xs'
              }`}>
                <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)] font-bold uppercase">
                  <span>sku_id</span>
                  <Boxes className="w-3 h-3 text-[var(--color-rose)]" />
                </div>
                <div className="mt-1 font-mono text-xs font-bold text-[var(--color-rose)]">
                  {sample.sku}
                </div>
              </div>

              {/* Field 3: Product Name */}
              <div className={`p-3.5 rounded-2xl transition-all duration-200 border sm:col-span-2 ${
                highlightField === 'product'
                  ? 'bg-rose-50 border-[var(--color-rose)] shadow-md scale-[1.02]'
                  : 'bg-white border-[var(--color-border-light)] shadow-xs'
              }`}>
                <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)] font-bold uppercase">
                  <span>product_name</span>
                  <FileText className="w-3 h-3 text-[var(--color-rose)]" />
                </div>
                <div className="mt-1 text-xs font-bold text-[var(--color-navy)]">
                  {sample.product}
                </div>
              </div>

              {/* Field 4: Customer Name */}
              <div className={`p-3.5 rounded-2xl transition-all duration-200 border ${
                highlightField === 'customer'
                  ? 'bg-rose-50 border-[var(--color-rose)] shadow-md scale-[1.02]'
                  : 'bg-white border-[var(--color-border-light)] shadow-xs'
              }`}>
                <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)] font-bold uppercase">
                  <span>customer_name</span>
                  <User className="w-3 h-3 text-[var(--color-rose)]" />
                </div>
                <div className="mt-1 text-xs font-bold text-[var(--color-navy)]">
                  {sample.customer}
                </div>
              </div>

              {/* Field 5: Quantity & Inventory Action */}
              <div className="p-3.5 rounded-2xl bg-white border border-[var(--color-border-light)] shadow-xs">
                <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)] font-bold uppercase">
                  <span>quantity_sold</span>
                  <span className="text-emerald-700 font-bold">Auto-Deducted</span>
                </div>
                <div className="mt-1 font-mono text-xs font-bold text-[var(--color-navy)]">
                  {sample.qty} Unit (Inventory Synced)
                </div>
              </div>

              {/* Field 6: Financial Valuation */}
              <div className="p-3.5 rounded-2xl bg-white border border-[var(--color-border-light)] shadow-xs sm:col-span-2 flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Realized SKU Valuation</span>
                  <span className="text-xs font-mono font-bold text-[var(--color-navy)]">
                    Purchase: ₹{sample.costPrice} · Selling: ₹{sample.sellingPrice}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700">Net Profit</span>
                  <span className="font-mono text-xs font-extrabold text-emerald-600">
                    +₹{sample.sellingPrice - sample.costPrice}
                  </span>
                </div>
              </div>

            </div>

            {/* Direct Link to Upload Page */}
            <div className="pt-2">
              <NavLink
                to="/upload"
                className="inline-flex items-center gap-2 text-xs font-extrabold text-[var(--color-rose)] hover:text-[var(--color-navy)] transition-colors group cursor-pointer"
              >
                <span>Upload your own parcel label to test live extraction</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </NavLink>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
