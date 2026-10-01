import React, { useEffect } from 'react';
import LandingNavbar from '../components/landing/LandingNavbar';
import HeroSection from '../components/landing/HeroSection';
import SupportedCouriers from '../components/landing/SupportedCouriers';
import HowItWorks from '../components/landing/HowItWorks';
import FeatureGrid from '../components/landing/FeatureGrid';
import DashboardPreview from '../components/landing/DashboardPreview';
import SavingsCalculator from '../components/landing/SavingsCalculator';
import ValueProposition from '../components/landing/ValueProposition';
import FAQSection from '../components/landing/FAQSection';
import FinalCTA from '../components/landing/FinalCTA';
import LandingFooter from '../components/landing/LandingFooter';
import Ambient3DElements from '../components/3d/Ambient3DElements';

export default function LandingPage() {
  useEffect(() => {
    document.title = 'ParcelAI — AI-Powered Parcel Label Intelligence & Inventory Management';
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col font-sans relative selection:bg-[var(--color-rose)] selection:text-white overflow-x-hidden"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* 3D Background Floating Ambient Canvas Particles */}
      <Ambient3DElements />

      {/* Palette-Derived Ambient Glow Spheres */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div
          className="absolute top-[-8%] right-[-8%] w-[700px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(174,68,90,0.07) 0%, transparent 65%)' }}
        />
        <div
          className="absolute bottom-[-12%] left-[-8%] w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(232,188,185,0.3) 0%, transparent 65%)' }}
        />
        <div
          className="absolute top-[35%] left-[25%] w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(69,25,82,0.05) 0%, transparent 65%)' }}
        />
        <div
          className="absolute top-[60%] right-[15%] w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(243,159,90,0.06) 0%, transparent 65%)' }}
        />
      </div>

      {/* 1. Sticky Floating Navbar with Reading Progress Bar */}
      <LandingNavbar />

      {/* 2. Main Page Content Sections */}
      <main className="flex-1 w-full">
        {/* Hero Section — Full Impact Landing */}
        <HeroSection />

        {/* Multi-Courier & Marketplace Compatibility Infinite Marquee */}
        <SupportedCouriers />

        {/* 5-Step Connected Timeline */}
        <HowItWorks />

        {/* 6-Card Bento Feature Grid */}
        <FeatureGrid />

        {/* Realistic 3D Perspective Dashboard Preview */}
        <DashboardPreview />

        {/* Interactive Warehouse Time & Cost Savings ROI Calculator */}
        <SavingsCalculator />

        {/* Value Proposition with Big Metrics */}
        <ValueProposition />

        {/* Frequently Asked Questions Accordion */}
        <FAQSection />

        {/* Final Conversion Call To Action */}
        <FinalCTA />
      </main>

      {/* 3. Comprehensive Footer */}
      <LandingFooter />
    </div>
  );
}
