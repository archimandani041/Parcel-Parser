import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
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
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar healthInfo={healthInfo} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title={title} />
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
