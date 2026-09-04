import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import AutoTranslate from '../components/AutoTranslate';
import TiltCard from '../components/animations/TiltCard';
import AnimatedCounter from '../components/animations/AnimatedCounter';
import { getStockOverview, updateStockProductPrice, deleteStockProduct } from '../services/api';
import { Boxes, Package, Search, RefreshCw, Save, Check, TrendingUp, Coins, Inbox, Trash2, Filter, ChevronDown, ChevronLeft, ChevronRight, ArrowUpDown, Pencil, MoreVertical, RotateCcw, X, SlidersHorizontal, AlertCircle, ShieldAlert, Sparkles } from 'lucide-react';

export default function Stock() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [stockSummary, setStockSummary] = useState({ total_products: 0, total_quantity: 0, total_available_quantity: 0, total_returned_quantity: 0, total_inventory_cost: 0, total_inventory_value: 0, total_realized_sales_profit: 0, total_return_loss: 0, total_net_profit: 0 });
  const [editPriceState, setEditPriceState] = useState({});
  const [viewMode, setViewMode] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: null, dir: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [activeMenu, setActiveMenu] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showViewDropdown, setShowViewDropdown] = useState(false);

  // Advanced Filter States
  const [filterPreset, setFilterPreset] = useState('all'); // 'all', 'low_stock', 'loss_making', 'high_profit', 'has_returns'
  const [filterStockStatus, setFilterStockStatus] = useState('all'); // 'all', 'in_stock', 'low_stock', 'out_of_stock'
  const [filterProfitability, setFilterProfitability] = useState('all'); // 'all', 'profitable', 'loss'
  const [filterMinQty, setFilterMinQty] = useState('');
  const [filterMaxQty, setFilterMaxQty] = useState('');
  const [filterMinProfit, setFilterMinProfit] = useState('');
  const [filterMaxProfit, setFilterMaxProfit] = useState('');
  const [filterHasReturns, setFilterHasReturns] = useState(false);

  const menuRef = useRef(null);
  const viewDropdownRef = useRef(null);
  const ITEMS_PER_PAGE = 10;

  const loadStockData = useCallback(async () => {
    setLoading(true);
    try {
      const stockRes = await getStockOverview();
      if (stockRes?.success) {
        setProducts(stockRes.products || []);
        setStockSummary(stockRes.summary || {});
        const priceMap = {};
        (stockRes.products || []).forEach(p => {
          priceMap[p.sku_id] = {
            purchase_price: p.purchase_price != null ? p.purchase_price : '',
            selling_price: p.selling_price != null ? p.selling_price : '',
            saving: false,
            saved: false
          };
        });
        setEditPriceState(priceMap);
      }
    } catch (err) {
      console.error('Failed to load stock data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStockData(); }, [loadStockData]);

  const handleSavePrice = async (skuId, productName) => {
    const cs = editPriceState[skuId]; if (!cs) return;
    setEditPriceState(prev => ({ ...prev, [skuId]: { ...prev[skuId], saving: true, saved: false } }));
    try {
      await updateStockProductPrice(skuId, cs.purchase_price, cs.selling_price, productName);
      setEditPriceState(prev => ({ ...prev, [skuId]: { ...prev[skuId], saving: false, saved: true } }));
      await loadStockData();
    } catch (err) {
      alert(t('stock.failedSavePrices') + (err.response?.data?.error || err.message));
      setEditPriceState(prev => ({ ...prev, [skuId]: { ...prev[skuId], saving: false } }));
    }
  };

  const handleDeleteStockProduct = async (skuId) => {
    if (!window.confirm(t('stock.confirmDeleteStock', { sku: skuId }))) return;
    try {
      await deleteStockProduct(skuId);
      await loadStockData();
    } catch (err) {
      alert(t('stock.deleteFailed') + (err.response?.data?.error || err.message));
    }
  };

  const clearAllFilters = () => {
    setFilterPreset('all');
    setFilterStockStatus('all');
    setFilterProfitability('all');
    setFilterMinQty('');
    setFilterMaxQty('');
    setFilterMinProfit('');
    setFilterMaxProfit('');
    setFilterHasReturns(false);
  };

  const activeFilterCount =
    (filterPreset !== 'all' ? 1 : 0) +
    (filterStockStatus !== 'all' ? 1 : 0) +
    (filterProfitability !== 'all' ? 1 : 0) +
    (filterMinQty !== '' ? 1 : 0) +
    (filterMaxQty !== '' ? 1 : 0) +
    (filterMinProfit !== '' ? 1 : 0) +
    (filterMaxProfit !== '' ? 1 : 0) +
    (filterHasReturns ? 1 : 0);

  const formatCurrency = (val) => {
    if (val == null || isNaN(val)) return '₹0';
    const num = Number(val);
    return num < 0 ? `-₹${Math.abs(num).toLocaleString('en-IN')}` : `₹${num.toLocaleString('en-IN')}`;
  };

  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q || (p.sku_id?.toLowerCase().includes(q)) || (p.product_name?.toLowerCase().includes(q));

    const totalQty = p.total_quantity || 0;
    const availQty = p.total_available_quantity != null ? p.total_available_quantity : (p.total_available_stock || 0);
    const netProf = p.net_profit != null ? p.net_profit : (p.profit || 0);
    const custRet = p.customer_returned_quantity || 0;
    const rtoRet = p.rto_returned_quantity || 0;
    const totalReturns = custRet + rtoRet;

    // Preset filter
    let matchPreset = true;
    if (filterPreset === 'low_stock') matchPreset = availQty <= 5;
    else if (filterPreset === 'loss_making') matchPreset = netProf < 0;
    else if (filterPreset === 'high_profit') matchPreset = netProf >= 500;
    else if (filterPreset === 'has_returns') matchPreset = totalReturns > 0;

    // Stock Status dropdown
    let matchStatus = true;
    if (filterStockStatus === 'in_stock') matchStatus = availQty > 5;
    else if (filterStockStatus === 'low_stock') matchStatus = availQty > 0 && availQty <= 5;
    else if (filterStockStatus === 'out_of_stock') matchStatus = availQty <= 0;

    // Profitability dropdown
    let matchProf = true;
    if (filterProfitability === 'profitable') matchProf = netProf > 0;
    else if (filterProfitability === 'loss') matchProf = netProf < 0;

    // Quantity range
    const matchMinQty = !filterMinQty || totalQty >= Number(filterMinQty);
    const matchMaxQty = !filterMaxQty || totalQty <= Number(filterMaxQty);

    // Profit range
    const matchMinProfit = !filterMinProfit || netProf >= Number(filterMinProfit);
    const matchMaxProfit = !filterMaxProfit || netProf <= Number(filterMaxProfit);

    // Returns toggle
    const matchReturns = !filterHasReturns || totalReturns > 0;

    return matchSearch && matchPreset && matchStatus && matchProf && matchMinQty && matchMaxQty && matchMinProfit && matchMaxProfit && matchReturns;
  });

  const handleSort = (key) => {
    setSortConfig(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));
  };

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (!sortConfig.key) return 0;
    let av = a[sortConfig.key], bv = b[sortConfig.key];
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === 'string') return sortConfig.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortConfig.dir === 'asc' ? av - bv : bv - av;
  });

  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / ITEMS_PER_PAGE));
  const paginatedProducts = sortedProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, viewMode, filterPreset, filterStockStatus, filterProfitability, filterMinQty, filterMaxQty, filterMinProfit, filterMaxProfit, filterHasReturns]);
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setActiveMenu(null);
      if (viewDropdownRef.current && !viewDropdownRef.current.contains(e.target)) setShowViewDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const S = { accent: 'var(--color-rose)', navy: 'var(--color-navy)', border: 'var(--color-border-light)', muted: 'var(--color-text-muted)', surface: 'var(--color-surface-muted)', text: 'var(--color-text-primary)', secondary: 'var(--color-text-secondary)' };

  return (
    <Layout title={t('nav.stock')}>
      <div className="space-y-6 w-full pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl" style={{ background: 'var(--color-surface)', border: `1px solid ${S.border}`, boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm shrink-0" style={{ background: 'var(--color-accent-light)', border: '1px solid var(--color-accent-muted)', color: S.accent }}><Boxes className="w-5 h-5" /></div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight font-serif" style={{ color: S.navy }}>{t('stock.title')} <span className="font-normal" style={{ color: S.accent }}>{t('stock.titleHighlight')}</span></h1>
              <p className="text-xs font-medium mt-0.5" style={{ color: S.muted }}>{t('stock.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto">
            <div className="relative flex-1 min-w-[200px] sm:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
              <input id="search-sku" type="text" placeholder={t('stock.searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl pl-9 pr-4 py-2 text-xs transition-all font-medium" style={{ background: S.surface, border: `1px solid ${S.border}`, color: S.text }} />
            </div>
            <button onClick={loadStockData} disabled={loading} className="p-2 rounded-xl transition-all disabled:opacity-50 shrink-0 cursor-pointer icon-hover-spin active:scale-90" style={{ background: S.surface, border: `1px solid ${S.border}`, color: S.secondary }}>
              <RefreshCw className={`w-4 h-4 transition-transform ${loading ? 'animate-smooth-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Summary Cards with Dashboard Design System */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {[
            {
              label: t('stock.totalAddedQty'),
              value: stockSummary.total_quantity || 0,
              icon: Package,
              hint: t('stock.initialStockLogged'),
              bg: 'var(--color-accent-light)',
              border: 'var(--color-accent-muted)',
              iconBg: 'var(--color-accent-light)',
              iconColor: 'var(--color-rose)',
              valueColor: 'var(--color-rose)',
              labelColor: 'var(--color-rose)'
            },
            {
              label: t('stock.sellingQ'),
              value: stockSummary.total_available_quantity != null ? stockSummary.total_available_quantity : (stockSummary.total_available_stock || 0),
              icon: Boxes,
              hint: t('stock.physicalStockInHand'),
              bg: 'var(--color-success-light)',
              border: 'var(--color-success-border)',
              iconBg: 'var(--color-success-light)',
              iconColor: 'var(--color-success)',
              valueColor: 'var(--color-success)',
              labelColor: 'var(--color-success)'
            },
            {
              label: t('stock.custReturnedQty'),
              value: stockSummary.total_customer_returned_quantity != null ? stockSummary.total_customer_returned_quantity : 0,
              icon: RotateCcw,
              hint: t('stock.customerReturnUnits'),
              bg: 'var(--color-amber-muted)',
              border: 'var(--color-warning-border)',
              iconBg: 'var(--color-amber-muted)',
              iconColor: 'var(--color-amber)',
              valueColor: 'var(--color-amber)',
              labelColor: 'var(--color-amber)'
            },
            {
              label: t('stock.rtoReturnedQty'),
              value: stockSummary.total_rto_returned_quantity || 0,
              icon: RotateCcw,
              hint: t('stock.rtoReturnUnits'),
              bg: 'var(--color-info-light)',
              border: 'var(--color-info-border)',
              iconBg: 'var(--color-info-light)',
              iconColor: 'var(--color-deep-purple)',
              valueColor: 'var(--color-deep-purple)',
              labelColor: 'var(--color-deep-purple)'
            },
            {
              label: t('stock.inventoryCost'),
              value: stockSummary.total_inventory_cost != null ? stockSummary.total_inventory_cost : (stockSummary.total_purchase_cost || 0),
              isCurrency: true,
              icon: Coins,
              hint: t('stock.purchaseCostAvailable'),
              bg: 'rgba(102, 37, 73, 0.08)',
              border: 'rgba(102, 37, 73, 0.18)',
              iconBg: 'rgba(102, 37, 73, 0.08)',
              iconColor: 'var(--color-plum)',
              valueColor: 'var(--color-plum)',
              labelColor: 'var(--color-plum)'
            }
          ].map((card, i) => {
            const Icon = card.icon;
            const numericVal = typeof card.value === 'number' ? card.value : (parseFloat(String(card.value).replace(/[^0-9.-]+/g, '')) || 0);
            return (
              <TiltCard key={i} maxTilt={5} className="w-full">
                <div
                  className={`ui-card px-3.5 py-3 space-y-1.5 h-full flex flex-col justify-between animate-fade-in-up stagger-${i + 1}`}
                  style={{ background: card.bg, border: `1.5px solid ${card.border}` }}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider truncate" style={{ color: card.labelColor }} title={card.label}>
                      {card.label}
                    </span>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-xs" style={{ background: card.iconBg, border: `1.5px solid ${card.iconColor}` }}>
                      <Icon className="w-3.5 h-3.5 transition-transform group-hover:scale-110" style={{ color: card.iconColor }} />
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold font-mono tracking-tight my-0.5" style={{ color: card.valueColor }}>
                    <AnimatedCounter value={numericVal} prefix={card.isCurrency ? '₹' : ''} />
                  </p>
                  <div className="flex items-center gap-1.5 text-[9.5px] font-bold mt-1 pt-1 border-t" style={{ color: card.labelColor, borderColor: card.border }}>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: card.iconColor }} />
                    <span className="truncate">{card.hint}</span>
                  </div>
                </div>
              </TiltCard>
            );
          })}
        </div>

        {/* Action Controls & View Mode Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-sm"
              style={showFilters || activeFilterCount > 0 ? { background: '#2B122A', color: '#FFFFFF' } : { background: 'var(--color-surface)', border: `1px solid ${S.border}`, color: S.secondary }}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{t('stock.filters')}</span>
              {activeFilterCount > 0 && <span className="w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold text-white" style={{ background: 'var(--color-rose)' }}>{activeFilterCount}</span>}
            </button>

            <div className="relative" ref={viewDropdownRef}>
              <button onClick={() => setShowViewDropdown(!showViewDropdown)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95" style={{ background: 'var(--color-surface)', border: `1px solid ${S.border}`, color: S.secondary }}>
                {t('stock.view')}
                <ChevronDown className={`w-3 h-3 transition-transform ${showViewDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showViewDropdown && <div className="absolute left-0 top-10 z-50 py-1.5 rounded-xl min-w-[160px] animate-fade-in" style={{ background: 'var(--color-surface)', border: `1px solid ${S.border}`, boxShadow: 'var(--shadow-lg)' }}>
                {['all','stock','pricing','financials'].map(m => <button key={m} onClick={() => { setViewMode(m); setShowViewDropdown(false); }} className="flex items-center w-full px-3.5 py-2 text-xs font-semibold cursor-pointer transition-colors" style={viewMode === m ? { background: '#F5E8F3', color: '#2B122A' } : { color: S.secondary }}>{t(`stock.${m === 'all' ? 'allColumns' : m === 'stock' ? 'stockOnly' : m === 'pricing' ? 'pricingOnly' : 'financialsOnly'}`)}</button>)}
              </div>}
            </div>

            {activeFilterCount > 0 && (
              <button onClick={clearAllFilters} className="flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-xl cursor-pointer transition-all" style={{ color: 'var(--color-rose)', background: 'var(--color-danger-light)', border: '1px solid var(--color-danger-border)' }}>
                <X className="w-3.5 h-3.5" />
                <span>{t('stock.clearAllFilters')}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--color-surface)', border: `1px solid ${S.border}` }}>
            {['all','stock','pricing','financials'].map(m => (<button key={m} onClick={() => setViewMode(m)} className="px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all" style={viewMode === m ? { background: '#2B122A', color: '#FFFFFF', boxShadow: '0 2px 8px rgba(43,18,42,0.25)' } : { color: S.muted }}>{t(`stock.${m === 'all' ? 'allColumns' : m === 'stock' ? 'stockOnly' : m === 'pricing' ? 'pricingOnly' : 'financialsOnly'}`)}</button>))}
          </div>
        </div>

        {/* Active Filter Chips Bar */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 rounded-2xl" style={{ background: 'var(--color-surface)', border: `1px solid ${S.border}` }}>
            <span className="text-xs font-bold" style={{ color: S.muted }}>{t('stock.activeFilters')}</span>
            {filterPreset !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: '#2B122A', color: '#FFFFFF' }}>
                Preset: {filterPreset}
                <X className="w-3 h-3 cursor-pointer hover:opacity-75" onClick={() => setFilterPreset('all')} />
              </span>
            )}
            {filterStockStatus !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: '#2B122A', color: '#FFFFFF' }}>
                Status: {filterStockStatus}
                <X className="w-3 h-3 cursor-pointer hover:opacity-75" onClick={() => setFilterStockStatus('all')} />
              </span>
            )}
            {filterProfitability !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: '#2B122A', color: '#FFFFFF' }}>
                Profit: {filterProfitability}
                <X className="w-3 h-3 cursor-pointer hover:opacity-75" onClick={() => setFilterProfitability('all')} />
              </span>
            )}
            {(filterMinQty !== '' || filterMaxQty !== '') && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: '#2B122A', color: '#FFFFFF' }}>
                Qty: {filterMinQty || '0'} - {filterMaxQty || '∞'}
                <X className="w-3 h-3 cursor-pointer hover:opacity-75" onClick={() => { setFilterMinQty(''); setFilterMaxQty(''); }} />
              </span>
            )}
            {(filterMinProfit !== '' || filterMaxProfit !== '') && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: '#2B122A', color: '#FFFFFF' }}>
                Profit ₹: {filterMinProfit || '-∞'} - {filterMaxProfit || '∞'}
                <X className="w-3 h-3 cursor-pointer hover:opacity-75" onClick={() => { setFilterMinProfit(''); setFilterMaxProfit(''); }} />
              </span>
            )}
            {filterHasReturns && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: '#2B122A', color: '#FFFFFF' }}>
                Has Returns
                <X className="w-3 h-3 cursor-pointer hover:opacity-75" onClick={() => setFilterHasReturns(false)} />
              </span>
            )}
          </div>
        )}

        {/* Detailed Filter Panel Drawer & Quick Preset Pills (Shown when user clicks on Filter) */}
        {showFilters && (
          <div className="ui-card p-5 space-y-4 animate-fade-in-up rounded-2xl" style={{ background: 'var(--color-surface)', border: `1px solid ${S.border}`, boxShadow: 'var(--shadow-md)' }}>
            {/* Quick Filter Presets Row (Image 2) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 border-b text-xs" style={{ borderColor: S.border }}>
              <span className="text-[11px] font-bold uppercase tracking-wider shrink-0" style={{ color: '#8E7C8C' }}>{t('stock.filters')}:</span>
              {[
                { id: 'all', label: t('stock.presetAll') },
                { id: 'low_stock', label: t('stock.presetLowStock'), badge: '⚠️' },
                { id: 'loss_making', label: t('stock.presetLossMaking'), badge: '📉' },
                { id: 'high_profit', label: t('stock.presetHighProfit'), badge: '✨' },
                { id: 'has_returns', label: t('stock.presetHasReturns'), badge: '🔄' }
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setFilterPreset(p.id)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold shrink-0 cursor-pointer transition-all active:scale-95 shadow-xs"
                  style={filterPreset === p.id
                    ? { background: '#2B122A', color: '#FFFFFF', boxShadow: '0 2px 8px rgba(43,18,42,0.25)' }
                    : { background: '#FFFFFF', border: '1px solid #F0E4EC', color: '#2B122A' }
                  }
                >
                  {p.badge && <span className="text-xs">{p.badge}</span>}
                  <span>{p.label}</span>
                </button>
              ))}
            </div>

            {/* Filter Controls Header */}
            <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: S.border }}>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" style={{ color: '#2B122A' }} />
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: S.navy }}>Filter Controls</h3>
              </div>
              <button onClick={clearAllFilters} className="text-xs font-bold cursor-pointer transition-colors hover:underline" style={{ color: 'var(--color-rose)' }}>{t('stock.clearAllFilters')}</button>
            </div>

            {/* Granular Filter Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Stock Status Select */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: S.muted }}>{t('stock.stockStatus')}</label>
                <select value={filterStockStatus} onChange={e => setFilterStockStatus(e.target.value)} className="w-full rounded-xl px-3 py-2 text-xs font-semibold outline-none cursor-pointer" style={{ background: S.surface, border: `1px solid ${S.border}`, color: S.text }}>
                  <option value="all">{t('stock.allStatuses')}</option>
                  <option value="in_stock">{t('stock.inStock')}</option>
                  <option value="low_stock">{t('stock.lowStock')}</option>
                  <option value="out_of_stock">{t('stock.outOfStock')}</option>
                </select>
              </div>

              {/* Profitability Select */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: S.muted }}>{t('stock.profitability')}</label>
                <select value={filterProfitability} onChange={e => setFilterProfitability(e.target.value)} className="w-full rounded-xl px-3 py-2 text-xs font-semibold outline-none cursor-pointer" style={{ background: S.surface, border: `1px solid ${S.border}`, color: S.text }}>
                  <option value="all">{t('stock.allProfitability')}</option>
                  <option value="profitable">{t('stock.profitableOnly')}</option>
                  <option value="loss">{t('stock.lossMakingOnly')}</option>
                </select>
              </div>

              {/* Quantity Range */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: S.muted }}>Total Qty Range</label>
                <div className="flex items-center gap-1.5">
                  <input type="number" placeholder={t('stock.minQty')} value={filterMinQty} onChange={e => setFilterMinQty(e.target.value)} className="w-full rounded-xl px-2.5 py-1.5 text-xs font-mono font-semibold outline-none" style={{ background: S.surface, border: `1px solid ${S.border}`, color: S.text }} />
                  <span className="text-xs" style={{ color: S.muted }}>-</span>
                  <input type="number" placeholder={t('stock.maxQty')} value={filterMaxQty} onChange={e => setFilterMaxQty(e.target.value)} className="w-full rounded-xl px-2.5 py-1.5 text-xs font-mono font-semibold outline-none" style={{ background: S.surface, border: `1px solid ${S.border}`, color: S.text }} />
                </div>
              </div>

              {/* Net Profit Range */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: S.muted }}>Net Profit (₹) Range</label>
                <div className="flex items-center gap-1.5">
                  <input type="number" placeholder={t('stock.minProfit')} value={filterMinProfit} onChange={e => setFilterMinProfit(e.target.value)} className="w-full rounded-xl px-2.5 py-1.5 text-xs font-mono font-semibold outline-none" style={{ background: S.surface, border: `1px solid ${S.border}`, color: S.text }} />
                  <span className="text-xs" style={{ color: S.muted }}>-</span>
                  <input type="number" placeholder={t('stock.maxProfit')} value={filterMaxProfit} onChange={e => setFilterMaxProfit(e.target.value)} className="w-full rounded-xl px-2.5 py-1.5 text-xs font-mono font-semibold outline-none" style={{ background: S.surface, border: `1px solid ${S.border}`, color: S.text }} />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t flex items-center justify-between" style={{ borderColor: S.border }}>
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none" style={{ color: S.text }}>
                <input type="checkbox" checked={filterHasReturns} onChange={e => setFilterHasReturns(e.target.checked)} className="rounded accent-purple-900" />
                <span>{t('stock.hasReturnsOnly')}</span>
              </label>
              <button onClick={() => setShowFilters(false)} className="px-5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-sm" style={{ background: '#2B122A', color: '#FFFFFF' }}>Apply Filters</button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="ui-card overflow-hidden rounded-3xl" style={{ boxShadow: 'var(--shadow-lg)', border: `1px solid ${S.border}` }}>
          {loading ? (
            <div className="space-y-2 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                  <div className="skeleton-loader w-20 h-5 rounded-full" />
                  <div className="flex-1"><div className="skeleton-loader h-4 rounded-lg w-2/3" /></div>
                  {[...Array(6)].map((_, j) => <div key={j} className="skeleton-loader w-12 h-5 rounded-lg" />)}
                  <div className="skeleton-loader w-14 h-6 rounded-lg" />
                  <div className="skeleton-loader w-7 h-7 rounded-full" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center space-y-4" style={{ background: S.surface }}>
              <Inbox className="w-14 h-14 mx-auto animate-float" style={{ color: 'var(--color-border-strong)' }} />
              <h4 className="font-bold text-base" style={{ color: S.text }}>{t('stock.noProductsFound')}</h4>
              <p className="text-xs max-w-sm mx-auto font-medium leading-relaxed" style={{ color: S.muted }}>{searchQuery ? t('stock.noProductsMatch', { query: searchQuery }) : t('stock.noProductsHint')}</p>
              {activeFilterCount > 0 && (
                <button onClick={clearAllFilters} className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer" style={{ background: '#2B122A', color: '#FFFFFF' }}>{t('stock.clearAllFilters')}</button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto" style={{ background: 'var(--color-surface)' }}>
              <table className="w-full text-left border-collapse text-xs" id="stock-table" style={{ minWidth: viewMode === 'all' ? '1100px' : '600px' }}>
                <thead>
                  {/* Category Header Row (Dark Plum Background & Crisp White Text) */}
                  <tr style={{ background: '#2B122A', color: '#FFFFFF', borderBottom: '1px solid rgba(255, 255, 255, 0.15)' }} className="text-[11px] uppercase tracking-wider font-bold">
                    <th colSpan="2" className="py-3 px-3 text-center border-r" style={{ background: '#2B122A', color: '#FFFFFF', borderColor: 'rgba(255, 255, 255, 0.15)' }}>{t('stock.identity')}</th>
                    {(viewMode === 'all' || viewMode === 'stock') && <th colSpan="4" className="py-3 px-3 text-center border-r" style={{ background: '#2B122A', color: '#FFFFFF', borderColor: 'rgba(255, 255, 255, 0.15)' }}>{t('stock.quantities')}</th>}
                    {(viewMode === 'all' || viewMode === 'pricing') && <th colSpan="2" className="py-3 px-3 text-center border-r" style={{ background: '#2B122A', color: '#FFFFFF', borderColor: 'rgba(255, 255, 255, 0.15)' }}>{t('stock.pricing')}</th>}
                    {(viewMode === 'all' || viewMode === 'financials') && <th colSpan="4" className="py-3 px-3 text-center border-r" style={{ background: '#2B122A', color: '#FFFFFF', borderColor: 'rgba(255, 255, 255, 0.15)' }}>{t('stock.financials')}</th>}
                    <th className="py-3 px-2" style={{ background: '#2B122A', color: '#FFFFFF' }}></th>
                  </tr>
                  {/* Column Header Row (Dark Plum Background & Crisp White Text) */}
                  <tr style={{ background: '#2B122A', color: '#FFFFFF', borderBottom: '1px solid rgba(255, 255, 255, 0.15)' }} className="uppercase tracking-wider font-bold text-[10px]">
                    <th className="py-3 px-3 sticky left-0 z-10" style={{ background: '#2B122A', color: '#FFFFFF' }}>{t('fields.skuId')}</th>
                    <th className="py-3 px-3 sticky left-[90px] z-10" style={{ background: '#2B122A', color: '#FFFFFF', borderRight: '1px solid rgba(255, 255, 255, 0.15)' }}>{t('fields.productName')}</th>
                    {(viewMode === 'all' || viewMode === 'stock') && <>
                      <th className="py-3 px-2 text-center cursor-pointer select-none" style={{ background: '#2B122A', color: '#FFFFFF' }} onClick={() => handleSort('total_quantity')}><span className="inline-flex items-center gap-1 justify-center">{t('stock.totalQty')}<ArrowUpDown className="w-3 h-3 opacity-80 text-white" /></span></th>
                      <th className="py-3 px-2 text-center cursor-pointer select-none" style={{ background: '#2B122A', color: '#FFFFFF' }} onClick={() => handleSort('successfully_sold_quantity')}><span className="inline-flex items-center gap-1 justify-center">{t('stock.soldQty')}<ArrowUpDown className="w-3 h-3 opacity-80 text-white" /></span></th>
                      <th className="py-3 px-2 text-center" style={{ background: '#2B122A', color: '#FFFFFF' }}>{t('stock.custReturn')}</th>
                      <th className="py-3 px-2 text-center" style={{ background: '#2B122A', color: '#FFFFFF', borderRight: '1px solid rgba(255, 255, 255, 0.15)' }}>{t('stock.rtoReturn')}</th>
                    </>}
                    {(viewMode === 'all' || viewMode === 'pricing') && <>
                      <th className="py-3 px-2 text-center cursor-pointer select-none" style={{ background: '#2B122A', color: '#FFFFFF' }} onClick={() => handleSort('purchase_price')}><span className="inline-flex items-center gap-1 justify-center">{t('fields.purchasePrice')}<ArrowUpDown className="w-3 h-3 opacity-80 text-white" /></span></th>
                      <th className="py-3 px-2 text-center cursor-pointer select-none" style={{ background: '#2B122A', color: '#FFFFFF', borderRight: '1px solid rgba(255, 255, 255, 0.15)' }} onClick={() => handleSort('selling_price')}><span className="inline-flex items-center gap-1 justify-center">{t('fields.sellingPrice')}<ArrowUpDown className="w-3 h-3 opacity-80 text-white" /></span></th>
                    </>}
                    {(viewMode === 'all' || viewMode === 'financials') && <>
                      <th className="py-3 px-2 text-center cursor-pointer select-none" style={{ background: '#2B122A', color: '#FFFFFF' }} onClick={() => handleSort('inventory_cost')}><span className="inline-flex items-center gap-1 justify-center">{t('stock.inventoryCost')}<ArrowUpDown className="w-3 h-3 opacity-80 text-white" /></span></th>
                      <th className="py-3 px-2 text-center cursor-pointer select-none" style={{ background: '#2B122A', color: '#FFFFFF' }} onClick={() => handleSort('inventory_value')}><span className="inline-flex items-center gap-1 justify-center">{t('stock.inventoryValue')}<ArrowUpDown className="w-3 h-3 opacity-80 text-white" /></span></th>
                      <th className="py-3 px-2 text-center cursor-pointer select-none" style={{ background: '#2B122A', color: '#FFFFFF' }} onClick={() => handleSort('realized_sales_profit')}><span className="inline-flex items-center gap-1 justify-center">{t('stock.realizedProfit')}<ArrowUpDown className="w-3 h-3 opacity-80 text-white" /></span></th>
                      <th className="py-3 px-2 text-center cursor-pointer select-none" style={{ background: '#2B122A', color: '#FFFFFF' }} onClick={() => handleSort('net_profit')}><span className="inline-flex items-center gap-1 justify-center">{t('stock.netProfit')}<ArrowUpDown className="w-3 h-3 opacity-80 text-white" /></span></th>
                    </>}
                    <th className="py-3 px-2 w-8" style={{ background: '#2B122A', color: '#FFFFFF' }}></th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: S.border }}>
                  {paginatedProducts.map((p) => {
                    const es = editPriceState[p.sku_id] || { purchase_price: p.purchase_price != null ? p.purchase_price : '', selling_price: p.selling_price != null ? p.selling_price : '', saving: false, saved: false };
                    const rawNet = p.net_profit != null ? p.net_profit : p.profit;
                    const soldQty = p.successfully_sold_quantity != null ? p.successfully_sold_quantity : (p.realized_sales_quantity || 0);
                    const isLoss = rawNet != null && rawNet < 0;
                    return (
                      <tr key={p.sku_id} className="table-row-hover transition-colors" style={isLoss ? { background: '#FFF0F3', boxShadow: 'inset 3px 0 0 var(--color-rose)' } : {}}>
                        <td className="py-3.5 px-3 sticky left-0 z-10" style={{ background: isLoss ? '#FFF0F3' : 'var(--color-surface)' }}><span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: 'var(--color-rose)', background: 'var(--color-accent-light)', border: '1px solid var(--color-accent-muted)' }}>{p.sku_id}</span></td>
                        <td className="py-3.5 px-3 sticky left-[90px] z-10" style={{ background: isLoss ? '#FFF0F3' : 'var(--color-surface)', borderRight: '1px solid var(--color-border-light)' }}><span className="text-xs font-semibold line-clamp-2" style={{ color: S.text }}>{p.product_name ? <AutoTranslate text={p.product_name} /> : '-'}</span></td>
                        {(viewMode === 'all' || viewMode === 'stock') && <>
                          <td className="py-3.5 px-2 text-center"><span className="font-mono text-xs font-semibold" style={{ color: S.text }}>{p.total_quantity}</span></td>
                          <td className="py-3.5 px-2 text-center"><span className="font-mono text-xs font-semibold" style={{ color: S.text }}>{soldQty}</span></td>
                          <td className="py-3.5 px-2 text-center"><span className="font-mono text-xs font-semibold" style={{ color: S.text }}>{p.customer_returned_quantity || 0}</span></td>
                          <td className="py-3.5 px-2 text-center" style={{ borderRight: viewMode === 'all' ? '1px solid var(--color-border-light)' : 'none' }}><span className="font-mono text-xs font-semibold" style={{ color: S.text }}>{p.rto_returned_quantity || 0}</span></td>
                        </>}
                        {(viewMode === 'all' || viewMode === 'pricing') && <>
                          <td className="py-2 px-2 text-center"><div className="flex items-center justify-center gap-1 rounded-full px-2 py-1" style={{ background: '#FFF5F7', border: '1px solid var(--color-border-light)' }}><span className="text-xs font-mono" style={{ color: S.muted }}>₹</span><input type="number" step="any" placeholder="0" value={es.purchase_price} onChange={(e) => setEditPriceState(prev => ({ ...prev, [p.sku_id]: { ...prev[p.sku_id], purchase_price: e.target.value } }))} className="w-14 bg-transparent text-xs text-right font-mono outline-none font-semibold" style={{ color: S.text }} /><button onClick={() => handleSavePrice(p.sku_id, p.product_name)} disabled={es.saving} className="p-0.5 rounded-full transition-all cursor-pointer disabled:opacity-50" style={es.saved ? { color: 'var(--color-success)' } : { color: S.muted }}>{es.saved ? <Check className="w-3 h-3" /> : es.saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Pencil className="w-3 h-3" />}</button></div></td>
                          <td className="py-2 px-2 text-center" style={{ borderRight: viewMode === 'all' ? '1px solid var(--color-border-light)' : 'none' }}><div className="flex items-center justify-center gap-1 rounded-full px-2 py-1" style={{ background: '#FFF5F7', border: '1px solid var(--color-border-light)' }}><span className="text-xs font-mono" style={{ color: S.muted }}>₹</span><input type="number" step="any" placeholder="0" value={es.selling_price} onChange={(e) => setEditPriceState(prev => ({ ...prev, [p.sku_id]: { ...prev[p.sku_id], selling_price: e.target.value } }))} className="w-14 bg-transparent text-xs text-right font-mono outline-none font-semibold" style={{ color: S.text }} /><button onClick={() => handleSavePrice(p.sku_id, p.product_name)} disabled={es.saving} className="p-1 rounded-full transition-all cursor-pointer disabled:opacity-50" style={es.saved ? { color: 'var(--color-success)' } : { color: S.muted }}>{es.saved ? <Check className="w-3 h-3" /> : es.saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Pencil className="w-3 h-3" />}</button></div></td>
                        </>}
                        {(viewMode === 'all' || viewMode === 'financials') && <>
                          <td className="py-3.5 px-2 text-center"><span className="font-mono text-xs font-semibold" style={{ color: 'var(--color-amber)' }}>{formatCurrency(p.inventory_cost != null ? p.inventory_cost : p.product_cost)}</span></td>
                          <td className="py-3.5 px-2 text-center"><span className="font-mono text-xs font-semibold" style={{ color: 'var(--color-success)' }}>{formatCurrency(p.inventory_value != null ? p.inventory_value : p.selling_value)}</span></td>
                          <td className="py-3.5 px-2 text-center"><span className="font-mono text-xs font-semibold" style={{ color: 'var(--color-rose)' }}>{formatCurrency(p.realized_sales_profit)}</span></td>
                          <td className="py-3.5 px-2 text-center"><span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full" style={rawNet == null ? { color: S.muted } : rawNet >= 0 ? { color: 'var(--color-success)', background: 'var(--color-success-light)', border: '1px solid var(--color-success-border)' } : { color: 'var(--color-rose)', background: 'var(--color-danger-light)', border: '1px solid var(--color-danger-border)' }}>{formatCurrency(rawNet)}</span></td>
                        </>}
                        <td className="py-3.5 px-2 text-center relative">
                          <button onClick={() => setActiveMenu(activeMenu === p.sku_id ? null : p.sku_id)} className="p-1.5 rounded-full transition-all cursor-pointer hover:bg-gray-100 active:scale-90" style={{ color: S.muted }}><MoreVertical className="w-3.5 h-3.5" /></button>
                          {activeMenu === p.sku_id && <div ref={menuRef} className="absolute right-6 top-8 z-50 py-1 rounded-xl min-w-[140px] animate-fade-in" style={{ background: 'var(--color-surface)', border: `1px solid ${S.border}`, boxShadow: 'var(--shadow-lg)' }}>
                            <button onClick={() => { handleDeleteStockProduct(p.sku_id); setActiveMenu(null); }} className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold cursor-pointer transition-colors hover:bg-red-50" style={{ color: 'var(--color-rose)' }}><Trash2 className="w-3.5 h-3.5" />{t('stock.deleteProduct')}</button>
                          </div>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {/* Pagination */}
          {!loading && sortedProducts.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: `1px solid ${S.border}` }}>
              <span className="text-xs font-medium" style={{ color: S.muted }}>{t('stock.showingItems', { from: (currentPage - 1) * ITEMS_PER_PAGE + 1, to: Math.min(currentPage * ITEMS_PER_PAGE, sortedProducts.length), total: sortedProducts.length })}</span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg cursor-pointer disabled:opacity-30 transition-all" style={{ border: `1px solid ${S.border}`, color: S.secondary }}><ChevronLeft className="w-3.5 h-3.5" /></button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (<button key={pg} onClick={() => setCurrentPage(pg)} className="w-7 h-7 rounded-lg text-xs font-bold cursor-pointer transition-all" style={pg === currentPage ? { background: 'linear-gradient(135deg, var(--color-navy), var(--color-deep-purple))', color: 'var(--color-blush-light)', boxShadow: '0 2px 8px rgba(29,26,57,0.25)' } : { color: S.muted }}>{pg}</button>))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg cursor-pointer disabled:opacity-30 transition-all" style={{ border: `1px solid ${S.border}`, color: S.secondary }}><ChevronRight className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
