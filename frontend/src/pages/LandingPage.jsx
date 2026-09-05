import React, { useEffect } from 'react';
import LandingNavbar from '../components/landing/LandingNavbar';
import HeroSection from '../components/landing/HeroSection';
import AIParsingDemo from '../components/landing/AIParsingDemo';
import HowItWorks from '../components/landing/HowItWorks';
import FeatureGrid from '../components/landing/FeatureGrid';
import DashboardPreview from '../components/landing/DashboardPreview';
import ValueProposition from '../components/landing/ValueProposition';
import FinalCTA from '../components/landing/FinalCTA';
import LandingFooter from '../components/landing/LandingFooter';
import Ambient3DElements from '../components/3d/Ambient3DElements';

export default function LandingPage() {
  useEffect(() => {
    document.title = 'ParcelAI — AI-Powered Parcel Label Intelligence & Inventory Management';
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col font-sans relative selection:bg-[var(--color-rose)] selection:text-white"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* 3D Background Floating Ambient Canvas Particles */}
      <Ambient3DElements />

      {/* Palette-Derived Ambient Glow Spheres */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div
          className="absolute top-[-5%] right-[-5%] w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(174,68,90,0.06) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(232,188,185,0.35) 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-[40%] left-[30%] w-[450px] h-[450px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(69,25,82,0.04) 0%, transparent 70%)' }}
        />
      </div>

      {/* 1. Compacting Sticky Navbar */}
      <LandingNavbar />

      {/* 2. Main Page Content Sections */}
      <main className="flex-1 w-full animate-fade-in">
        {/* Hero Section with 3D Parcel & Floating Extracted Cards */}
        <HeroSection />

        {/* Interactive AI Parsing Transformation Demo */}
        <AIParsingDemo />

        {/* 5-Step Connected Timeline */}
        <HowItWorks />

        {/* 6-Card Bento Feature Grid */}
        <FeatureGrid />

        {/* Realistic 3D Perspective Dashboard Preview */}
        <DashboardPreview />

        {/* Honest Value Proposition & Operational Pillars */}
        <ValueProposition />

        {/* Final Conversion Call To Action */}
        <FinalCTA />
      </main>

      {/* 3. Comprehensive Footer */}
      <LandingFooter />
    </div>
  );
}
