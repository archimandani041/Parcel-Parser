import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import DocumentsList from './pages/DocumentsList';
import DocumentDetail from './pages/DocumentDetail';
import Orders from './pages/Orders';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/documents" element={<DocumentsList />} />
        <Route path="/document/:id" element={<DocumentDetail />} />
      </Routes>
    </Router>
  );
}
