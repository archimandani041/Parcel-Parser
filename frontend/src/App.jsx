import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import Upload from './pages/Upload';
import DocumentsList from './pages/DocumentsList';
import DocumentDetail from './pages/DocumentDetail';
import Orders from './pages/Orders';
import Stock from './pages/Stock';
import Return from './pages/Return';

/* Page transition wrapper — fades + slides each route on mount */
function PageTransition({ children }) {
  const location = useLocation();
  return (
    <div key={location.pathname} className="animate-page-enter">
      {children}
    </div>
  );
}

function AppRoutes() {
  return (
    <PageTransition>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/return" element={<Return />} />
        <Route path="/documents" element={<DocumentsList />} />
        <Route path="/document/:id" element={<DocumentDetail />} />
      </Routes>
    </PageTransition>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
