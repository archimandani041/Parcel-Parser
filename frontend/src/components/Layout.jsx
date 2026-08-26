import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { getHealthStatus } from '../services/api';

export default function Layout({ children, title }) {
  const [healthInfo, setHealthInfo] = useState(null);

  useEffect(() => {
    getHealthStatus()
      .then(res => setHealthInfo(res))
      .catch(err => console.warn('Health check warning:', err.message));
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans relative overflow-x-hidden" style={{ background: 'var(--color-bg)' }}>
      {/* Warm Ambient Glow Orbs */}
      <div className="fixed top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full pointer-events-none -z-10"
        style={{ background: 'radial-gradient(circle, rgba(150,62,27,0.04) 0%, transparent 70%)' }} />
      <div className="fixed bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full pointer-events-none -z-10"
        style={{ background: 'radial-gradient(circle, rgba(245,230,211,0.5) 0%, transparent 70%)' }} />
      <div className="fixed top-[40%] left-[30%] w-[400px] h-[400px] rounded-full pointer-events-none -z-10"
        style={{ background: 'radial-gradient(circle, rgba(150,62,27,0.02) 0%, transparent 70%)' }} />

      {/* Top Floating Navbar Header */}
      <Navbar title={title} healthInfo={healthInfo} />

      {/* Main Content Viewport */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
