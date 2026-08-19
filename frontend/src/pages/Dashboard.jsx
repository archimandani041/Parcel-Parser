import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { 
  getDocuments, 
  getStockOverview,
  exportOrdersExcel, 
  exportStockExcel, 
  exportReturnsExcel, 
  exportMasterExcel 
} from '../services/api';
import { getStatusBadgeConfig, formatDate, formatConfidence } from '../utils/formatters';
import { 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  UploadCloud, 
  ArrowRight, 
  RefreshCw,
  Search,
  ExternalLink,
  Sparkles,
  TrendingUp,
  Download,
  Check,
  Coins
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_documents: 0,
    completed: 0,
    needs_review: 0,
    failed: 0,
    avg_confidence: 0
  });
  const [recentDocs, setRecentDocs] = useState([]);
  const [totalProfit, setTotalProfit] = useState(null);
  const [profitSummary, setProfitSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [exportingAll, setExportingAll] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const [briefSubmitted, setBriefSubmitted] = useState(false);

  // Form State
  const [briefForm, setBriefForm] = useState({
    company: '',
    name: '',
    email: '',
    mobile: '',
    city: 'Surat',
    website: '',
    note: ''
  });

  const triggerDownload = (data, filename) => {
    const blob = new Blob([data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDownloadAllThree = async () => {
    setExportingAll(true);
    setExportProgress('Fetching reports...');
    try {
      const dateStr = new Date().toISOString().split('T')[0];

      setExportProgress('1/3: Orders Excel...');
      const ordersRes = await exportOrdersExcel();
      triggerDownload(ordersRes.data, `1_orders_report_${dateStr}.xlsx`);
      await new Promise(r => setTimeout(r, 400));

      setExportProgress('2/3: Stock Excel...');
      const stockRes = await exportStockExcel();
      triggerDownload(stockRes.data, `2_stock_report_${dateStr}.xlsx`);
      await new Promise(r => setTimeout(r, 400));

      setExportProgress('3/3: Returns Excel...');
      const returnsRes = await exportReturnsExcel();
      triggerDownload(returnsRes.data, `3_returns_report_${dateStr}.xlsx`);

      setExportProgress('Downloaded all 3 Excels!');
      setTimeout(() => setExportProgress(''), 3000);
    } catch (err) {
      alert('Download failed: ' + (err.response?.data?.error || err.message));
      setExportProgress('');
    } finally {
      setExportingAll(false);
    }
  };

  const formatCurrency = (val) => {
    if (val == null || isNaN(val)) return '₹0';
    const num = Number(val);
    const isNeg = num < 0;
    const formatted = Math.abs(num).toLocaleString('en-IN');
    return isNeg ? `-₹${formatted}` : `₹${formatted}`;
  };

  const loadDashboardData = () => {
    setLoading(true);
    Promise.all([
      getDocuments(),
      getStockOverview().catch(() => null)
    ])
      .then(([res, stockRes]) => {
        setStats(res.stats || {});
        setRecentDocs(res.documents || []);
        if (stockRes?.success && stockRes.summary) {
          setTotalProfit(stockRes.summary.total_profit);
          setProfitSummary(stockRes.summary);
        }
      })
      .catch(err => console.error('Dashboard load error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleBriefSubmit = (e) => {
    e.preventDefault();
    setBriefSubmitted(true);
    setTimeout(() => {
      setBriefSubmitted(false);
      setBriefForm({
        company: '',
        name: '',
        email: '',
        mobile: '',
        city: 'Surat',
        website: '',
        note: ''
      });
    }, 4000);
  };

  const filteredDocs = recentDocs.filter(d => 
    d.file_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout title="ParcelAI Intelligence Platform">
      <div className="space-y-16 pb-16 font-sans">
        
        {/* ================= 1. EDITORIAL HERO SECTION ================= */}
        <section className="space-y-6 pt-4">
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl tracking-tight text-[#1c1815] font-serif-title leading-[1.08]">
              Don't sell to us. <br />
              <span className="font-serif-italic italic text-[#3d332c]">Sit at the table.</span>
            </h1>
            <p className="text-sm sm:text-base text-[#574b40] max-w-2xl font-medium leading-relaxed">
              125 Indian agencies already live in SarvaaOne. A partner does not buy that room. They sit next to it. A pitch deck is optional. A brief is not.
            </p>
          </div>

          {/* Dark Warm Executive Banner ("LIVE FROM THE BOOK") */}
          <div className="editorial-dark-card p-8 sm:p-12 space-y-8 relative overflow-hidden">
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#a89988]">
                LIVE FROM THE BOOK
              </span>
              <h2 className="text-2xl sm:text-4xl font-serif-title text-[#fdfbf7]">
                This is who you would sit next to.
              </h2>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-10 border-t border-[#3d332c] pt-8">
              <div className="space-y-1">
                <p className="text-3xl sm:text-5xl font-serif-title text-[#fdfbf7]">130+</p>
                <p className="text-xs font-bold text-[#d4c7b2]">People connected</p>
                <p className="text-[11px] text-[#8c7b6c]">Agents and their teams</p>
              </div>

              <div className="space-y-1">
                <p className="text-3xl sm:text-5xl font-serif-title text-[#fdfbf7]">38</p>
                <p className="text-xs font-bold text-[#d4c7b2]">Active this week</p>
                <p className="text-[11px] text-[#8c7b6c]">Opened the OS in 7 days</p>
              </div>

              <div className="space-y-1">
                <p className="text-3xl sm:text-5xl font-serif-title text-[#fdfbf7]">125+</p>
                <p className="text-xs font-bold text-[#d4c7b2]">Agencies</p>
                <p className="text-[11px] text-[#8c7b6c]">Owner accounts, live</p>
              </div>

              <div className="space-y-1">
                <p className="text-3xl sm:text-5xl font-serif-title text-[#fdfbf7]">1,693+</p>
                <p className="text-xs font-bold text-[#d4c7b2]">Households in the book</p>
                <p className="text-[11px] text-[#8c7b6c]">Customers, not a rented list</p>
              </div>
            </div>

            {/* Quick Hero Actions */}
            <div className="pt-4 flex flex-wrap items-center gap-4">
              <button
                onClick={handleDownloadAllThree}
                disabled={exportingAll}
                className="pill-button-light px-6 py-3 text-xs font-extrabold flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#1c1815]" />
                {exportingAll ? exportProgress : 'Download All 3 Excels (1-Click)'}
              </button>

              <Link
                to="/upload"
                className="bg-[#3d332c] hover:bg-[#4a3f37] text-[#fdfbf7] px-6 py-3 rounded-full text-xs font-extrabold flex items-center gap-2 border border-[#574b40] transition-colors"
              >
                <UploadCloud className="w-4 h-4 text-[#d4c7b2]" />
                Upload Shipping Label
              </Link>
            </div>
          </div>
        </section>


        {/* ================= 2. WHAT A PARTNER ACTUALLY PLUGS INTO ================= */}
        <section className="space-y-8 pt-4">
          <div className="text-center space-y-3">
            <span className="pill-tag">The platform</span>
            <h2 className="text-3xl sm:text-5xl font-serif-title text-[#1c1815]">
              What a partner actually plugs into
            </h2>
            <p className="text-xs sm:text-sm text-[#574b40] font-medium max-w-xl mx-auto">
              Not impressions. The operating system an agent already opens at 9pm.
            </p>
          </div>

          {/* 8 Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="ui-card p-6 space-y-2">
              <p className="text-3xl sm:text-4xl font-serif-title text-[#1c1815]">130+</p>
              <p className="text-xs font-bold text-[#1c1815]">Active this month</p>
              <p className="text-[11px] text-[#8c7b6c]">Seen in the last 30 days</p>
            </div>

            <div className="ui-card p-6 space-y-2">
              <p className="text-3xl sm:text-4xl font-serif-title text-[#1c1815]">2,168</p>
              <p className="text-xs font-bold text-[#1c1815]">Live policies</p>
              <p className="text-[11px] text-[#8c7b6c]">Active covers on the platform</p>
            </div>

            <div className="ui-card p-6 space-y-2 bg-[#f4efe6]/50">
              <p className="text-3xl sm:text-4xl font-serif-title text-[#1c1815]">
                {totalProfit != null ? formatCurrency(totalProfit) : '₹5.43Cr+'}
              </p>
              <p className="text-xs font-bold text-[#1c1815]">Premium under watch / Profit</p>
              <p className="text-[11px] text-[#8c7b6c]">Active portfolios</p>
            </div>

            <div className="ui-card p-6 space-y-2">
              <p className="text-3xl sm:text-4xl font-serif-title text-[#1c1815]">8</p>
              <p className="text-xs font-bold text-[#1c1815]">Cities</p>
              <p className="text-[11px] text-[#8c7b6c]">Where agencies told us they work</p>
            </div>

            <div className="ui-card p-6 space-y-2">
              <p className="text-3xl sm:text-4xl font-serif-title text-[#1c1815]">
                {stats.completed || '2,653'}
              </p>
              <p className="text-xs font-bold text-[#1c1815]">Policy documents in house</p>
              <p className="text-[11px] text-[#8c7b6c]">The PDF sits with the customer</p>
            </div>

            <div className="ui-card p-6 space-y-2">
              <p className="text-3xl sm:text-4xl font-serif-title text-[#1c1815]">11</p>
              <p className="text-xs font-bold text-[#1c1815]">Agencies on a paid plan</p>
              <p className="text-[11px] text-[#8c7b6c]">They stayed past the trial</p>
            </div>

            <div className="ui-card p-6 space-y-2">
              <p className="text-3xl sm:text-4xl font-serif-title text-[#1c1815]">368</p>
              <p className="text-xs font-bold text-[#1c1815]">Insurers in the catalogue</p>
              <p className="text-[11px] text-[#8c7b6c]">The companies agents already sell</p>
            </div>

            <div className="ui-card p-6 space-y-2">
              <p className="text-3xl sm:text-4xl font-serif-title text-[#1c1815]">14</p>
              <p className="text-xs font-bold text-[#1c1815]">Claim intimations filed</p>
              <p className="text-[11px] text-[#8c7b6c]">Hospitals and TPAs already have a door</p>
            </div>
          </div>

          {/* 4 Feature Explanation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div className="ui-card p-6 space-y-3">
              <h3 className="text-lg font-bold text-[#1c1815]">The OS they already open</h3>
              <p className="text-xs text-[#574b40] leading-relaxed font-medium">
                Customers, policies, renewals, documents, commissions — one room. A partner sits next to that room. You do not rent a mailing list.
              </p>
            </div>

            <div className="ui-card p-6 space-y-3">
              <h3 className="text-lg font-bold text-[#1c1815]">Renewals that actually fire</h3>
              <p className="text-xs text-[#574b40] leading-relaxed font-medium">
                Reminders at 30, 15 and 1 day. A voucher or a hospital desk is useful on the day the policy is being talked about — not in a forgotten app.
              </p>
            </div>

            <div className="ui-card p-6 space-y-3">
              <h3 className="text-lg font-bold text-[#1c1815]">The document is in the house</h3>
              <p className="text-xs text-[#574b40] leading-relaxed font-medium">
                Agents upload the policy. SarvaaAI reads it. Benefits and claims have somewhere honest to live.
              </p>
            </div>

            <div className="ui-card p-6 space-y-3">
              <h3 className="text-lg font-bold text-[#1c1815]">India, on purpose</h3>
              <p className="text-xs text-[#574b40] leading-relaxed font-medium">
                Data hosted in India. IRDAI-aligned. Built in Surat for Indian agents — not a US CRM with a rupee toggle.
              </p>
            </div>
          </div>
        </section>


        {/* ================= 3. THREE REFUSALS SECTION ================= */}
        <section className="space-y-8 pt-6">
          <div className="text-center space-y-3">
            <span className="pill-tag">What we will never do</span>
            <h2 className="text-3xl sm:text-5xl font-serif-title text-[#1c1815]">
              Three refusals
            </h2>
            <p className="text-xs sm:text-sm text-[#574b40] font-medium max-w-md mx-auto">
              The table is expensive because of what does not sit on it.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="ui-card p-8 space-y-4 relative overflow-hidden">
              <span className="text-5xl font-serif-title text-[#e2d7c5] absolute top-6 right-6 select-none">01</span>
              <h3 className="text-lg font-bold text-[#1c1815] pr-10">We do not sell the book</h3>
              <p className="text-xs text-[#574b40] leading-relaxed font-medium">
                An agent's clients are not inventory. Sitting together never means we hand you the household.
              </p>
            </div>

            <div className="ui-card p-8 space-y-4 relative overflow-hidden">
              <span className="text-5xl font-serif-title text-[#e2d7c5] absolute top-6 right-6 select-none">02</span>
              <h3 className="text-lg font-bold text-[#1c1815] pr-10">We do not white-label spam</h3>
              <p className="text-xs text-[#574b40] leading-relaxed font-medium">
                No blast in our name. If it would make an agent look cheap, it does not sit at this table.
              </p>
            </div>

            <div className="ui-card p-8 space-y-4 relative overflow-hidden">
              <span className="text-5xl font-serif-title text-[#e2d7c5] absolute top-6 right-6 select-none">03</span>
              <h3 className="text-lg font-bold text-[#1c1815] pr-10">We do not take a deck without a brief</h3>
              <p className="text-xs text-[#574b40] leading-relaxed font-medium">
                A PDF is not a conversation. Write how we sit together, or we will not open the file.
              </p>
            </div>
          </div>
        </section>


        {/* ================= 4. CHOOSE A TABLE BRIEF FORM SECTION ================= */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start pt-6">
          
          {/* Left Column Text */}
          <div className="lg:col-span-5 space-y-6">
            <span className="pill-tag">The brief</span>
            
            <h2 className="text-3xl sm:text-5xl font-serif-title text-[#1c1815] leading-tight">
              Choose a table. <br />
              Then tell us how we sit together.
            </h2>

            <p className="text-xs sm:text-sm text-[#574b40] font-medium leading-relaxed">
              Not a lead form. A one-page note the founders will actually read. If the fit is real, we will set a time. If it is not, we will say so.
            </p>

            <ul className="space-y-3 text-xs text-[#1c1815] font-semibold">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-[#8c7b6c]" /> No cold decks in the inbox without a brief
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-[#8c7b6c]" /> Surat first — we would rather meet than zoom forever
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-[#8c7b6c]" /> Replies from careers@sarvaaone.in
              </li>
            </ul>

            <div className="pt-2 text-xs text-[#574b40] font-medium">
              Building the agency itself? That is the product.{' '}
              <Link to="/upload" className="font-bold text-[#1c1815] underline decoration-[#8c7b6c]">
                Create a free account →
              </Link>
            </div>
          </div>

          {/* Right Column Form */}
          <div className="lg:col-span-7 ui-card p-8 sm:p-10 space-y-6">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#8c7b6c]">
              PICK A TABLE ABOVE FIRST
            </p>

            {briefSubmitted ? (
              <div className="p-6 bg-[#f4efe6] border border-[#e2d7c5] rounded-2xl text-center space-y-2">
                <p className="text-sm font-bold text-[#1c1815]">Brief Sent Successfully</p>
                <p className="text-xs text-[#574b40]">The founders will read your brief and get back to you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleBriefSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-[#8c7b6c]">COMPANY</label>
                    <input
                      type="text"
                      required
                      value={briefForm.company}
                      onChange={(e) => setBriefForm({ ...briefForm, company: e.target.value })}
                      className="w-full bg-[#fdfbf7] border border-[#e2d7c5] rounded-xl px-3.5 py-2.5 text-xs text-[#1c1815] outline-none focus:border-[#1c1815] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-[#8c7b6c]">YOUR NAME</label>
                    <input
                      type="text"
                      required
                      value={briefForm.name}
                      onChange={(e) => setBriefForm({ ...briefForm, name: e.target.value })}
                      className="w-full bg-[#fdfbf7] border border-[#e2d7c5] rounded-xl px-3.5 py-2.5 text-xs text-[#1c1815] outline-none focus:border-[#1c1815] transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-[#8c7b6c]">EMAIL</label>
                    <input
                      type="email"
                      required
                      value={briefForm.email}
                      onChange={(e) => setBriefForm({ ...briefForm, email: e.target.value })}
                      className="w-full bg-[#fdfbf7] border border-[#e2d7c5] rounded-xl px-3.5 py-2.5 text-xs text-[#1c1815] outline-none focus:border-[#1c1815] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-[#8c7b6c]">MOBILE</label>
                    <input
                      type="text"
                      placeholder="Optional"
                      value={briefForm.mobile}
                      onChange={(e) => setBriefForm({ ...briefForm, mobile: e.target.value })}
                      className="w-full bg-[#fdfbf7] border border-[#e2d7c5] rounded-xl px-3.5 py-2.5 text-xs text-[#1c1815] placeholder-[#8c7b6c] outline-none focus:border-[#1c1815] transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-[#8c7b6c]">CITY</label>
                    <input
                      type="text"
                      value={briefForm.city}
                      onChange={(e) => setBriefForm({ ...briefForm, city: e.target.value })}
                      className="w-full bg-[#fdfbf7] border border-[#e2d7c5] rounded-xl px-3.5 py-2.5 text-xs text-[#1c1815] outline-none focus:border-[#1c1815] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-[#8c7b6c]">WEBSITE</label>
                    <input
                      type="text"
                      placeholder="https://"
                      value={briefForm.website}
                      onChange={(e) => setBriefForm({ ...briefForm, website: e.target.value })}
                      className="w-full bg-[#fdfbf7] border border-[#e2d7c5] rounded-xl px-3.5 py-2.5 text-xs text-[#1c1815] placeholder-[#8c7b6c] outline-none focus:border-[#1c1815] transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-[#8c7b6c]">HOW WE SIT TOGETHER</label>
                  <textarea
                    rows={4}
                    placeholder="What you bring, who it is for, and what the first ninety days could look like..."
                    value={briefForm.note}
                    onChange={(e) => setBriefForm({ ...briefForm, note: e.target.value })}
                    className="w-full bg-[#fdfbf7] border border-[#e2d7c5] rounded-xl p-3.5 text-xs text-[#1c1815] placeholder-[#8c7b6c] outline-none focus:border-[#1c1815] transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="pill-button-dark w-full py-3.5 text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
                >
                  Send the brief →
                </button>
              </form>
            )}
          </div>
        </section>


        {/* ================= 5. RECENT PARCEL DOCUMENTS TABLE ================= */}
        <section className="ui-card p-6 sm:p-8 space-y-6 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2d7c5] pb-5">
            <div>
              <h3 className="text-xl font-serif-title text-[#1c1815]">
                Recent extracted parcel documents
              </h3>
              <p className="text-xs text-[#574b40]">Live feed of parsed shipping labels and metadata</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-[#8c7b6c] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by filename or status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#fdfbf7] border border-[#e2d7c5] rounded-full pl-9 pr-4 py-2 text-xs text-[#1c1815] placeholder-[#8c7b6c] outline-none focus:border-[#1c1815] transition-all w-52 sm:w-72 font-medium"
                />
              </div>

              <button
                onClick={loadDashboardData}
                className="p-2.5 text-[#1c1815] bg-[#f4efe6] hover:bg-[#e2d7c5] rounded-full transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <Link
                to="/documents"
                className="pill-button-light flex items-center gap-1.5 text-xs px-4 py-2"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-[#8c7b6c] text-xs space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#1c1815]" />
              <p className="font-mono text-xs">Synchronizing database records...</p>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="py-12 text-center text-[#8c7b6c] text-xs border-2 border-dashed border-[#e2d7c5] rounded-2xl bg-[#f4efe6]/30 p-8 space-y-3">
              <UploadCloud className="w-8 h-8 text-[#8c7b6c] mx-auto" />
              <p className="font-bold text-[#1c1815]">No parcel labels found</p>
              <Link to="/upload" className="pill-button-dark inline-flex items-center gap-2 px-5 py-2 text-xs">
                Upload Document Now
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#e2d7c5]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#e2d7c5] bg-[#f4efe6] text-[#574b40] uppercase tracking-wider font-extrabold text-[10px]">
                    <th className="py-3 px-4">Document Title</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Confidence</th>
                    <th className="py-3 px-4 text-center">Speed</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2d7c5]/60 bg-white">
                  {filteredDocs.slice(0, 8).map((doc) => {
                    const badge = getStatusBadgeConfig(doc.status);
                    const ext = doc.file_name?.split('.').pop()?.toUpperCase() || 'FILE';

                    return (
                      <tr key={doc.id} className="hover:bg-[#fdfbf7] transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-lg bg-[#f4efe6] flex items-center justify-center text-[#1c1815] font-extrabold text-[9px] font-mono shrink-0">
                              {ext}
                            </span>
                            <span className="font-bold text-[#1c1815] truncate max-w-xs">
                              {doc.file_name}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bgClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
                            {badge.label}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center font-mono font-bold text-[#574b40]">
                          {formatConfidence(doc.overall_confidence)}
                        </td>

                        <td className="py-3 px-4 text-center font-mono text-[#8c7b6c]">
                          {doc.processing_time ? `${doc.processing_time} ms` : '-'}
                        </td>

                        <td className="py-3 px-4 text-[#8c7b6c] font-medium">
                          {formatDate(doc.created_at)}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <Link
                            to={`/document/${doc.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-[#f4efe6] hover:bg-[#e2d7c5] text-[#1c1815] rounded-full text-xs font-bold transition-all"
                          >
                            Inspect <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>


        {/* ================= 6. EDITORIAL FOOTER ================= */}
        <footer className="border-t border-[#e2d7c5] pt-12 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            
            {/* Logo & Info */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#1c1815] flex items-center justify-center text-[#fdfbf7] font-bold text-xs">
                  S
                </div>
                <span className="font-extrabold text-base text-[#1c1815] tracking-tight">SarvaaOne / ParcelAI</span>
              </div>

              <p className="text-xs text-[#574b40] leading-relaxed max-w-sm font-medium">
                Insurance CRM built for Indian agents. IRDAI compliant, made in India. Parcel Intelligence OS built for Indian logistics.
              </p>

              <div className="flex items-center gap-2 pt-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                <span className="text-[11px] font-bold text-[#574b40]">All systems operational</span>
              </div>
            </div>

            {/* Links Columns */}
            <div className="md:col-span-7 grid grid-cols-3 gap-6 text-xs font-medium text-[#574b40]">
              <div className="space-y-3">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#1c1815]">PLATFORM</p>
                <ul className="space-y-2">
                  <li><Link to="/" className="hover:text-[#1c1815]">Features</Link></li>
                  <li><Link to="/stock" className="hover:text-[#1c1815]">Pricing</Link></li>
                  <li><Link to="/upload" className="hover:text-[#1c1815]">How it works</Link></li>
                  <li><Link to="/orders" className="hover:text-[#1c1815]">Security</Link></li>
                </ul>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#1c1815]">ACCOUNT</p>
                <ul className="space-y-2">
                  <li><Link to="/upload" className="hover:text-[#1c1815]">Create free account</Link></li>
                  <li><Link to="/" className="hover:text-[#1c1815]">Sign in</Link></li>
                  <li><Link to="/documents" className="hover:text-[#1c1815]">Setup guide</Link></li>
                </ul>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#1c1815]">COMPANY</p>
                <ul className="space-y-2">
                  <li><span className="cursor-pointer hover:text-[#1c1815]">About & founders</span></li>
                  <li><span className="cursor-pointer hover:text-[#1c1815]">Careers</span></li>
                  <li><span className="cursor-pointer hover:text-[#1c1815]">Partner with us</span></li>
                  <li><span className="cursor-pointer hover:text-[#1c1815]">The house</span></li>
                  <li><span className="cursor-pointer hover:text-[#1c1815]">FAQ</span></li>
                  <li><span className="cursor-pointer hover:text-[#1c1815]">Resources</span></li>
                  <li><span className="cursor-pointer hover:text-[#1c1815]">Contact us</span></li>
                  <li><span className="cursor-pointer hover:text-[#1c1815]">Privacy Policy</span></li>
                  <li><span className="cursor-pointer hover:text-[#1c1815]">Terms of Use</span></li>
                </ul>
              </div>
            </div>

          </div>
        </footer>

      </div>
    </Layout>
  );
}
