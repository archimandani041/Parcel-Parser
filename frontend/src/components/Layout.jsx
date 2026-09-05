import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { getHealthStatus } from '../services/api';
import Ambient3DElements from './3d/Ambient3DElements';

export default function Layout({ children, title }) {
  const [healthInfo, setHealthInfo] = useState(null);

  useEffect(() => {
    getHealthStatus()
      .then(res => setHealthInfo(res))
      .catch(err => console.warn('Health check warning:', err.message));
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans relative" style={{ background: 'var(--color-bg)' }}>
      {/* Background Floating Ambient Particles */}
      <Ambient3DElements />

      {/* Warm Ambient Glow Orbs — palette-derived, contained safely without causing scrollbars */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(174,68,90,0.05) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(232,188,185,0.4) 0%, transparent 70%)' }} />
        <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(69,25,82,0.04) 0%, transparent 70%)' }} />
      </div>

      {/* Top Floating Navbar Header */}
      <Navbar title={title} healthInfo={healthInfo} />

      {/* Main Content Viewport with Animated Page Enter */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-in-up">
        {children}
      </main>
    </div>
  );
}
