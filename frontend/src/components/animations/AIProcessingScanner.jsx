import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, CheckCircle2, Cpu, Scan, FileCheck, Layers, ArrowRight } from 'lucide-react';
import ParcelModel from '../3d/ParcelModel';

export default function AIProcessingScanner({
  processingState = 'ANALYZING',
  uploadProgress = 50,
  extractedData = null,
  onComplete = null,
  compact = false
}) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState(1); // 1: ENTERS, 2: SCANNING & BLAST, 3: EXTRACTION, 4: SUCCESS

  useEffect(() => {
    if (processingState === 'UPLOADING') setPhase(1);
    else if (processingState === 'ANALYZING') setPhase(2);
    else if (processingState === 'EXTRACTING' || processingState === 'VALIDATING') setPhase(3);
    else if (processingState === 'COMPLETED') {
      setPhase(4);
      if (onComplete) {
        const timer = setTimeout(() => onComplete(), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [processingState, onComplete]);

  // Particle positions generator for Material Blast
  const particles = Array.from({ length: 24 }).map((_, i) => ({
    id: i,
    tx: (Math.sin(i * 0.5) * 140).toFixed(0),
    ty: (Math.cos(i * 0.5) * 100).toFixed(0),
    delay: (i * 0.04).toFixed(2),
    size: Math.floor(Math.random() * 6) + 4
  }));

  const mockFields = [
    { label: t('fields.orderId') || 'Order ID', value: extractedData?.order_id || '#ORD-89241', icon: '📦' },
    { label: t('fields.skuId') || 'SKU ID', value: extractedData?.sku_id || 'SKU-7708-AI', icon: '🏷️' },
    { label: t('fields.productName') || 'Product', value: extractedData?.product_name || 'ParcelAI Smart Terminal', icon: '✨' },
    { label: t('fields.customerName') || 'Customer', value: extractedData?.customer_name || 'Alexander Wright', icon: '👤' },
    { label: t('fields.quantity') || 'Quantity', value: extractedData?.quantity || '1 Units', icon: '🔢' },
    { label: t('fields.awb') || 'AWB Number', value: extractedData?.awb_number || '98745120PCL', icon: '🚚' }
  ];

  return (
    <div className={`w-full overflow-hidden rounded-3xl p-6 sm:p-8 space-y-6 relative ${compact ? 'max-w-2xl mx-auto' : ''}`}
      style={{
        background: 'linear-gradient(145deg, var(--color-navy) 0%, var(--color-deep-purple) 100%)',
        border: '1px solid rgba(232,188,185,0.15)',
        boxShadow: '0 20px 50px rgba(29,26,57,0.4)',
        color: 'var(--color-blush-light)'
      }}>

      {/* Decorative Scanner Glow Mesh Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: 'var(--color-rose)' }} />
      </div>

      {/* Header Status Badge */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: 'rgba(174,68,90,0.25)', border: '1px solid rgba(174,68,90,0.4)', color: 'var(--color-blush-light)' }}>
            {phase === 4 ? <CheckCircle2 className="w-5 h-5 text-emerald-300" /> : <Cpu className="w-5 h-5 animate-pulse" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold tracking-tight font-serif">
                {phase === 1 && (t('upload.step1') || '1. LABEL ENTERS SCANNER')}
                {phase === 2 && (t('upload.step2') || '2. AI SCAN & MATERIAL BLAST')}
                {phase === 3 && (t('upload.step3') || '3. DATA FIELD EXTRACTION')}
                {phase === 4 && (t('upload.step5') || '✓ LABEL PROCESSED')}
              </h3>
            </div>
            <p className="text-xs font-mono opacity-80">
              {phase === 4 ? 'Gemini 2.5 Flash Engine Verified' : `Processing Pipeline: ${uploadProgress}%`}
            </p>
          </div>
        </div>

        {/* Progress Pill */}
        <div className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold flex items-center gap-2"
          style={{ background: 'rgba(232,188,185,0.1)', border: '1px solid rgba(232,188,185,0.2)' }}>
          <Scan className="w-3.5 h-3.5 animate-spin" />
          <span>{uploadProgress}%</span>
        </div>
      </div>

      {/* Main Visual Arena: 3D Parcel & Scanning Field */}
      <div className="relative min-h-[260px] rounded-2xl flex flex-col items-center justify-center p-4 overflow-hidden"
        style={{ background: 'rgba(15,13,32,0.6)', border: '1px solid rgba(232,188,185,0.1)' }}>

        {/* 3D Parcel Canvas */}
        <div className="relative z-10 w-full flex justify-center">
          <ParcelModel height="220px" isScanning={phase >= 2} interactive={phase === 4} />
        </div>

        {/* Laser Scanning Line Bar */}
        {phase >= 2 && phase <= 3 && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-400 shadow-[0_0_20px_#AE445A] animate-bounce pointer-events-none z-20"
            style={{ animationDuration: '1.4s' }} />
        )}

        {/* Material Blast Particle Burst Effect */}
        {phase === 2 && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
            {particles.map((p) => (
              <div
                key={p.id}
                className="absolute rounded-full animate-ping"
                style={{
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  background: 'var(--color-blush)',
                  boxShadow: '0 0 12px var(--color-rose)',
                  transform: `translate(${p.tx}px, ${p.ty}px)`,
                  animationDuration: '1.2s',
                  animationDelay: `${p.delay}s`
                }}
              />
            ))}
          </div>
        )}

        {/* Success Banner Overlay */}
        {phase === 4 && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 bg-navy/80 backdrop-blur-sm animate-fade-in text-center space-y-3">
            <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl animate-bounce"
              style={{ background: 'var(--color-rose)', color: 'var(--color-blush-light)' }}>
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-extrabold tracking-tight font-serif text-white">✓ Label Processed</h4>
            <p className="text-xs font-mono text-blush-light">All fields extracted & validated with Supabase DB</p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-navy-light rounded-full h-2 overflow-hidden p-0.5" style={{ border: '1px solid rgba(232,188,185,0.15)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${uploadProgress}%`,
            background: 'linear-gradient(90deg, var(--color-rose) 0%, var(--color-amber) 100%)',
            boxShadow: '0 0 12px var(--color-rose)'
          }}
        />
      </div>

      {/* Real-time Extracted Field Cards Stream (Phase 3 & 4) */}
      {phase >= 3 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-fade-in-up">
          {mockFields.map((field, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl space-y-1 transition-all duration-300 transform hover:scale-102"
              style={{
                background: 'rgba(232,188,185,0.08)',
                border: '1px solid rgba(232,188,185,0.15)',
                animationDelay: `${idx * 0.08}s`
              }}
            >
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-blush">
                <span>{field.label}</span>
                <span>{field.icon}</span>
              </div>
              <p className="font-mono text-xs font-bold truncate text-white">{field.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
