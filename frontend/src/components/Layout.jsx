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
    <div className="min-h-screen text-slate-800 flex flex-col font-sans selection:bg-purple-200 selection:text-purple-900 relative overflow-x-hidden">
      {/* Decorative Ambient Light Pastel Glow Orbs (Each Page Background) */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-purple-200/35 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed top-1/3 -right-20 w-[450px] h-[450px] bg-indigo-200/30 rounded-full blur-[110px] pointer-events-none -z-10" />
      <div className="fixed -bottom-10 left-10 w-[500px] h-[500px] bg-teal-200/25 rounded-full blur-[130px] pointer-events-none -z-10" />
      <div className="fixed top-2/3 left-1/3 w-[400px] h-[400px] bg-rose-200/25 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Top Floating Navbar Header */}
      <Navbar title={title} healthInfo={healthInfo} />

      {/* Main Content Viewport with minor light background wrapper */}
      <main className="flex-1 w-full px-2 sm:px-4 lg:px-6 pt-4 sm:pt-6 pb-8">
        <div className="page-pastel-bg p-3.5 sm:p-7 relative overflow-hidden transition-all duration-300">
          {children}
        </div>
      </main>
    </div>
  );
}


