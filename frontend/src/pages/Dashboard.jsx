import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import {
  getDocuments,
  getDashboardStats,
  exportMasterExcel
} from '../services/api';
import { getStatusBadgeConfig, formatDate, formatConfidence } from '../utils/formatters';
import {
  FileText, TrendingUp, TrendingDown, UploadCloud, ArrowRight, RefreshCw,
  Search, ExternalLink, Download, Layers, Boxes, RotateCcw, Coins,
  IndianRupee, PackageCheck, BarChart3, Calendar
} from 'lucide-react';

export default function Dashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    total_profit: 0, total_loss: 0, total_selling: 0, total_return: 0,
    total_stock_items: 0, total_labels: 0, total_orders: 0
  });
  const [graphData, setGraphData] = useState([]);
  const [selectedRange, setSelectedRange] = useState('7');
  const [recentDocs, setRecentDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [exportingAll, setExportingAll] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const [hoveredDataPoint, setHoveredDataPoint] = useState(null);

  const triggerDownload = (data, filename) => {
    const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDownloadAllThree = async () => {
    setExportingAll(true);
    setExportProgress(t('dashboard.downloadingMaster'));
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const masterRes = await exportMasterExcel();
      triggerDownload(masterRes.data, `master_report_orders_stock_returns_${dateStr}.xlsx`);
      setExportProgress(t('dashboard.masterDownloaded'));
      setTimeout(() => setExportProgress(''), 4000);
    } catch (err) {
      alert(t('dashboard.masterExcelFailed') + (err.response?.data?.error || err.message));
      setExportProgress('');
    } finally { setExportingAll(false); }
  };

  const formatCurrency = (val) => {
    if (val == null || isNaN(val)) return '₹0';
    const num = Number(val);
    const isNeg = num < 0;
    return isNeg ? `-₹${Math.abs(num).toLocaleString('en-IN')}` : `₹${num.toLocaleString('en-IN')}`;
  };

  const loadDashboardData = (range = selectedRange) => {
    setLoading(true);
    Promise.all([getDashboardStats(range).catch(() => null), getDocuments().catch(() => null)])
      .then(([statsRes, docsRes]) => {
        if (statsRes?.success && statsRes.stats) { setStats(statsRes.stats); setGraphData(statsRes.graph_data || []); }
        if (docsRes?.documents) setRecentDocs(docsRes.documents);
      })
      .catch(err => console.error('Dashboard data load error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadDashboardData(selectedRange); }, [selectedRange]);

  const filteredDocs = recentDocs.filter(d =>
    d.file_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const maxGraphVal = Math.max(...graphData.flatMap(d => [d.profit || 0, d.loss || 0]), 100) * 1.25;
  const hasGraphData = graphData.length > 0;

  // Stat card configs
  const statCards = [
    {
      label: t('dashboard.totalProfit'), value: formatCurrency(stats.total_profit), icon: Coins, hint: t('dashboard.matchesStockNetProfit'),
      bg: 'var(--color-success-light)', border: 'var(--color-success-border)', iconBg: 'var(--color-success-light)', iconColor: 'var(--color-success)', valueColor: stats.total_profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)', labelColor: 'var(--color-success)'
    },
    {
      label: t('dashboard.totalLoss'), value: formatCurrency(stats.total_loss || 0), icon: TrendingDown, hint: t('dashboard.customerReturnLosses'),
      bg: 'var(--color-danger-light)', border: 'var(--color-danger-border)', iconBg: 'var(--color-danger-light)', iconColor: 'var(--color-danger)', valueColor: 'var(--color-danger)', labelColor: 'var(--color-danger)'
    },
    {
      label: t('dashboard.totalSelling'), value: formatCurrency(stats.total_selling), icon: IndianRupee, hint: t('dashboard.realizedSoldRevenue'),
      bg: 'var(--color-accent-light)', border: 'var(--color-accent-muted)', iconBg: 'var(--color-accent-light)', iconColor: 'var(--color-accent)', valueColor: 'var(--color-brown-dark)', labelColor: 'var(--color-accent)'
    },
    {
      label: t('dashboard.totalReturn'), value: stats.total_return || 0, icon: RotateCcw, hint: t('dashboard.customerPlusRtoReturns'),
      bg: 'var(--color-warning-light)', border: 'var(--color-warning-border)', iconBg: 'var(--color-warning-light)', iconColor: 'var(--color-warning)', valueColor: 'var(--color-warning)', labelColor: 'var(--color-warning)'
    },
    {
      label: t('dashboard.totalStockItems'), value: stats.total_stock_items || 0, icon: Boxes, hint: t('dashboard.availableInventory'),
      bg: 'var(--color-info-light)', border: 'var(--color-info-border)', iconBg: 'var(--color-info-light)', iconColor: 'var(--color-info)', valueColor: 'var(--color-info)', labelColor: 'var(--color-info)'
    },
    {
      label: t('dashboard.totalLabels'), value: stats.total_labels || 0, icon: FileText, hint: t('dashboard.extractedDocuments'),
      bg: '#F3E8FF', border: '#E9D5FF', iconBg: '#F3E8FF', iconColor: '#7C3AED', valueColor: '#5B21B6', labelColor: '#7C3AED'
    },
    {
      label: t('dashboard.totalOrders'), value: stats.total_orders || 0, icon: Layers, hint: t('dashboard.uniqueOrderIds'),
      bg: 'var(--color-surface-warm)', border: 'var(--color-border)', iconBg: 'var(--color-surface-warm)', iconColor: 'var(--color-brown-medium)', valueColor: 'var(--color-brown-dark)', labelColor: 'var(--color-brown-medium)'
    },
  ];

  return (
    <Layout title={t('dashboard.title')}>
      <div className="space-y-8 pb-10">

        {/* Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-xs)' }}>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight font-serif" style={{ color: 'var(--color-brown-dark)' }}>
              {t('dashboard.title')}
            </h1>
            <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>{t('dashboard.subtitle')}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button id="download-all-3-excels-btn" onClick={handleDownloadAllThree} disabled={exportingAll}
              className="flex items-center gap-2 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 cursor-pointer"
              style={{ background: 'var(--color-brown-dark)', boxShadow: '0 4px 12px rgba(45,24,16,0.2)' }}>
              <Download className={`w-3.5 h-3.5 ${exportingAll ? 'animate-bounce' : ''}`} />
              {exportingAll ? exportProgress : t('dashboard.downloadAll3Excels')}
            </button>
            <Link to="/upload" className="pill-button-dark flex items-center gap-2 px-5 py-2.5 text-xs font-semibold">
              <UploadCloud className="w-3.5 h-3.5" /> {t('dashboard.uploadNewLabel')}
            </Link>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-3 sm:gap-4">
          {statCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={i} className={`ui-card ui-card-hover p-4 sm:p-5 space-y-2 animate-fade-in-up stagger-${i + 1}`}
                style={{ background: card.bg, borderColor: card.border }}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: card.labelColor }}>{card.label}</span>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: card.iconBg, border: `1px solid ${card.border}` }}>
                    <Icon className="w-4 h-4" style={{ color: card.iconColor }} />
                  </div>
                </div>
                <p className="text-2xl font-bold font-mono tracking-tight" style={{ color: card.valueColor }}>{card.value}</p>
                <div className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: card.labelColor }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: card.iconColor }} /> {card.hint}
                </div>
              </div>
            );
          })}
        </div>

        {/* Graph */}
        <div className="ui-card p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2 font-serif" style={{ color: 'var(--color-brown-dark)' }}>
                <BarChart3 className="w-5 h-5" style={{ color: 'var(--color-accent)' }} /> {t('dashboard.profitAndLoss')}
              </h3>
              <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--color-text-tertiary)' }}>{t('dashboard.profitLossSubtitle')}</p>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-3 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border-light)' }}>
                <span className="flex items-center gap-1" style={{ color: 'var(--color-success)' }}><span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--color-success)' }} /> {t('dashboard.profit')}</span>
                <span className="flex items-center gap-1" style={{ color: 'var(--color-danger)' }}><span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--color-danger)' }} /> {t('dashboard.loss')}</span>
              </div>
              <div className="inline-flex items-center p-1 rounded-xl" style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border-light)' }}>
                {[{ label: t('dashboard.days7'), value: '7' }, { label: t('dashboard.days30'), value: '30' }, { label: t('dashboard.days90'), value: '90' }, { label: t('dashboard.allTime'), value: 'all' }].map(r => (
                  <button key={r.value} onClick={() => setSelectedRange(r.value)}
                    className="px-3.5 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer"
                    style={selectedRange === r.value
                      ? { background: 'var(--color-brown-dark)', color: '#fff', boxShadow: 'var(--shadow-xs)' }
                      : { color: 'var(--color-text-secondary)' }}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {!hasGraphData ? (
            <div className="py-20 text-center text-sm rounded-3xl p-8 space-y-2" style={{ border: '2px dashed var(--color-border)', background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)' }}>
              <BarChart3 className="w-10 h-10 mx-auto" style={{ color: 'var(--color-border-strong)' }} />
              <h4 className="font-bold" style={{ color: 'var(--color-text-secondary)' }}>{t('dashboard.noGraphData')}</h4>
              <p className="text-xs max-w-sm mx-auto" style={{ color: 'var(--color-text-tertiary)' }}>{t('dashboard.noGraphDataHint')}</p>
            </div>
          ) : (
            <div className="relative pt-4 pb-2">
              <div className="mb-4 p-3 text-white rounded-xl text-xs flex items-center justify-between shadow-md max-w-md" style={{ background: 'var(--color-brown-dark)' }}>
                <span className="font-bold" style={{ color: 'var(--color-accent-muted)' }}>
                  {hoveredDataPoint ? hoveredDataPoint.displayDate : t('dashboard.hoverForBreakdown')}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-emerald-400 font-mono font-bold">{t('dashboard.profit')}: {formatCurrency(hoveredDataPoint ? hoveredDataPoint.profit : graphData.reduce((a, b) => a + (b.profit || 0), 0))}</span>
                  <span className="font-mono font-bold" style={{ color: '#FF8A80' }}>{t('dashboard.loss')}: {formatCurrency(hoveredDataPoint ? hoveredDataPoint.loss : graphData.reduce((a, b) => a + (b.loss || 0), 0))}</span>
                </div>
              </div>
              <div className="relative h-64 w-full pt-8 pb-6 px-2 rounded-2xl" style={{ borderBottom: '1px solid var(--color-border-light)', background: 'linear-gradient(to bottom, var(--color-surface-muted), transparent)' }}>
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none px-4 py-8">
                  {[maxGraphVal, maxGraphVal / 2, 0].map((v, i) => (
                    <div key={i} className="w-full text-[10px] font-mono flex justify-between" style={{ borderBottom: '1px solid var(--color-border-light)', color: 'var(--color-text-muted)' }}>
                      <span>{formatCurrency(Math.round(v))}</span>
                    </div>
                  ))}
                </div>
                <div className="relative z-10 h-full flex items-end justify-between gap-1 sm:gap-2 px-4 overflow-x-auto min-w-full">
                  {graphData.map((d, idx) => {
                    const pH = Math.max(Math.round(((d.profit || 0) / maxGraphVal) * 100), d.profit > 0 ? 10 : 0);
                    const lH = Math.max(Math.round(((d.loss || 0) / maxGraphVal) * 100), d.loss > 0 ? 10 : 0);
                    return (
                      <div key={idx} onMouseEnter={() => setHoveredDataPoint(d)} onMouseLeave={() => setHoveredDataPoint(null)}
                        className="flex-1 min-w-[32px] max-w-[70px] flex flex-col items-center justify-end h-full group cursor-pointer">
                        <div className="w-full flex items-end justify-center gap-2 h-full">
                          <div className="w-full max-w-[24px] flex flex-col items-center h-full justify-end">
                            {d.profit > 0 && <span className="text-[10px] font-mono font-bold mb-1 leading-none" style={{ color: 'var(--color-success)' }}>{formatCurrency(d.profit)}</span>}
                            <div className="w-full rounded-t-md transition-all duration-300 group-hover:scale-y-105"
                              style={{ height: d.profit > 0 ? `${pH}%` : '2px', background: d.profit > 0 ? 'linear-gradient(to top, #2E7D32, #43A047)' : 'var(--color-border-light)' }} />
                          </div>
                          <div className="w-full max-w-[24px] flex flex-col items-center h-full justify-end">
                            {d.loss > 0 && <span className="text-[10px] font-mono font-bold mb-1 leading-none" style={{ color: 'var(--color-danger)' }}>{formatCurrency(d.loss)}</span>}
                            <div className="w-full rounded-t-md transition-all duration-300 group-hover:scale-y-105"
                              style={{ height: d.loss > 0 ? `${lH}%` : '2px', background: d.loss > 0 ? 'linear-gradient(to top, #C62828, #E53935)' : 'var(--color-border-light)' }} />
                          </div>
                        </div>
                        <span className="text-[11px] font-bold mt-3 truncate w-full text-center transition-colors" style={{ color: 'var(--color-text-secondary)' }}>{d.displayDate}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Documents */}
        <div className="ui-card p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2 font-serif" style={{ color: 'var(--color-brown-dark)' }}>
                <PackageCheck className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                {t('dashboard.recentDocuments')} <span className="font-normal" style={{ color: 'var(--color-accent)' }}>{t('dashboard.recentDocumentsHighlight')}</span>
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>{t('dashboard.recentDocumentsSubtitle')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <div className="relative w-full sm:w-64 flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                <input type="text" placeholder={t('dashboard.searchByFilename')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-xl pl-9 pr-4 py-2 text-xs placeholder-opacity-50 transition-all w-full font-medium"
                  style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border-light)', color: 'var(--color-text-primary)' }} />
              </div>
              <button onClick={() => loadDashboardData(selectedRange)} className="p-2.5 rounded-xl transition-all cursor-pointer shrink-0"
                style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border-light)', color: 'var(--color-text-secondary)' }}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <Link to="/documents" className="flex items-center gap-1.5 text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all shrink-0"
                style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border-light)', color: 'var(--color-accent)' }}>
                {t('dashboard.viewRepository')} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-sm space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto" style={{ color: 'var(--color-accent)' }} />
              <p className="font-mono text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{t('dashboard.synchronizing')}</p>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="py-16 text-center text-sm rounded-3xl p-8 space-y-3" style={{ border: '2px dashed var(--color-border)', background: 'var(--color-surface-muted)' }}>
              <UploadCloud className="w-10 h-10 mx-auto" style={{ color: 'var(--color-border-strong)' }} />
              <h4 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{t('dashboard.noLabelsFound')}</h4>
              <p className="text-xs max-w-sm mx-auto" style={{ color: 'var(--color-text-tertiary)' }}>{t('dashboard.noLabelsFoundHint')}</p>
              <Link to="/upload" className="pill-button-dark inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold">{t('dashboard.uploadDocumentNow')}</Link>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid var(--color-border-light)' }}>
              <table className="w-full text-left text-xs border-collapse min-w-[650px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider font-extrabold" style={{ background: 'var(--color-surface-muted)', borderBottom: '1px solid var(--color-border-light)', color: 'var(--color-text-muted)' }}>
                    <th className="py-3.5 px-4">{t('dashboard.documentTitle')}</th>
                    <th className="py-3.5 px-4">{t('fields.status')}</th>
                    <th className="py-3.5 px-4 text-center">{t('fields.confidenceScore')}</th>
                    <th className="py-3.5 px-4 text-center">{t('fields.processingSpeed')}</th>
                    <th className="py-3.5 px-4">{t('fields.createdDate')}</th>
                    <th className="py-3.5 px-4 text-right">{t('common.action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--color-border-light)' }}>
                  {filteredDocs.slice(0, 8).map((doc) => {
                    const badge = getStatusBadgeConfig(doc.status);
                    const ext = doc.file_name?.split('.').pop()?.toUpperCase() || 'FILE';
                    return (
                      <tr key={doc.id} className="transition-colors group" style={{ '--tw-divide-opacity': 1 }}>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-[10px] shrink-0 font-mono"
                              style={{ background: 'var(--color-surface-warm)', border: '1px solid var(--color-border-light)', color: 'var(--color-accent)' }}>{ext}</div>
                            <span className="font-bold truncate max-w-sm" style={{ color: 'var(--color-text-primary)' }}>{doc.file_name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4"><span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${badge.bgClass}`}><span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />{t(`status.${badge.label.toLowerCase().replace(/ /g, '')}`, badge.label)}</span></td>
                        <td className="py-3.5 px-4 text-center"><span className="font-mono font-bold" style={{ color: 'var(--color-text-secondary)' }}>{formatConfidence(doc.overall_confidence)}</span></td>
                        <td className="py-3.5 px-4 text-center font-mono" style={{ color: 'var(--color-text-muted)' }}>{doc.processing_time ? `${doc.processing_time} ms` : '-'}</td>
                        <td className="py-3.5 px-4 font-medium" style={{ color: 'var(--color-text-muted)' }}>{formatDate(doc.created_at)}</td>
                        <td className="py-3.5 px-4 text-right">
                          <Link to={`/document/${doc.id}`} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all"
                            style={{ background: 'var(--color-surface-muted)', color: 'var(--color-brown-dark)', border: '1px solid var(--color-border-light)' }}>
                            {t('common.inspect')} <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
