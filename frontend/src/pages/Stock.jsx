import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import AutoTranslate from '../components/AutoTranslate';
import { getStockOverview, updateStockProductPrice, deleteStockProduct } from '../services/api';
import { Boxes, Package, Search, RefreshCw, Save, Check, TrendingUp, Coins, Inbox, Trash2, Filter, ChevronDown, ChevronLeft, ChevronRight, ArrowUpDown, Pencil, MoreVertical, RotateCcw } from 'lucide-react';

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
  const [filterMinQty, setFilterMinQty] = useState('');
  const [filterMinProfit, setFilterMinProfit] = useState('');
  const menuRef = useRef(null);
  const viewDropdownRef = useRef(null);
  const ITEMS_PER_PAGE = 10;

  const loadStockData = useCallback(async () => {
    setLoading(true);
    try {
      const stockRes = await getStockOverview();
      if (stockRes?.success) {
        setProducts(stockRes.products || []); setStockSummary(stockRes.summary || {});
        const priceMap = {};
        (stockRes.products || []).forEach(p => { priceMap[p.sku_id] = { purchase_price: p.purchase_price != null ? p.purchase_price : '', selling_price: p.selling_price != null ? p.selling_price : '', saving: false, saved: false }; });
        setEditPriceState(priceMap);
      }
    } catch (err) { console.error('Failed to load stock data:', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadStockData(); }, [loadStockData]);

  const handleSavePrice = async (skuId, productName) => {
    const cs = editPriceState[skuId]; if (!cs) return;
    setEditPriceState(prev => ({ ...prev, [skuId]: { ...prev[skuId], saving: true, saved: false } }));
    try { await updateStockProductPrice(skuId, cs.purchase_price, cs.selling_price, productName); setEditPriceState(prev => ({ ...prev, [skuId]: { ...prev[skuId], saving: false, saved: true } })); await loadStockData(); }
    catch (err) { alert(t('stock.failedSavePrices') + (err.response?.data?.error || err.message)); setEditPriceState(prev => ({ ...prev, [skuId]: { ...prev[skuId], saving: false } })); }
  };

  const handleDeleteStockProduct = async (skuId) => {
    if (!window.confirm(t('stock.confirmDeleteStock', { sku: skuId }))) return;
    try { await deleteStockProduct(skuId); await loadStockData(); }
    catch (err) { alert(t('stock.deleteFailed') + (err.response?.data?.error || err.message)); }
  };

  const formatCurrency = (val) => { if (val == null || isNaN(val)) return '₹0'; const num = Number(val); return num < 0 ? `-₹${Math.abs(num).toLocaleString('en-IN')}` : `₹${num.toLocaleString('en-IN')}`; };
  const filteredProducts = products.filter(p => { if (!searchQuery.trim() && !filterMinQty && !filterMinProfit) { return true; } const q = searchQuery.toLowerCase().trim(); const matchSearch = !q || (p.sku_id?.toLowerCase().includes(q)) || (p.product_name?.toLowerCase().includes(q)); const matchQty = !filterMinQty || (p.total_quantity >= Number(filterMinQty)); const matchProfit = !filterMinProfit || ((p.net_profit || p.profit || 0) >= Number(filterMinProfit)); return matchSearch && matchQty && matchProfit; });

  const handleSort = (key) => { setSortConfig(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' })); };
  const sortedProducts = [...filteredProducts].sort((a, b) => { if (!sortConfig.key) return 0; let av = a[sortConfig.key], bv = b[sortConfig.key]; if (av == null) return 1; if (bv == null) return -1; if (typeof av === 'string') return sortConfig.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av); return sortConfig.dir === 'asc' ? av - bv : bv - av; });
  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / ITEMS_PER_PAGE));
  const paginatedProducts = sortedProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  useEffect(() => { setCurrentPage(1); }, [searchQuery, viewMode]);
  useEffect(() => { const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setActiveMenu(null); if (viewDropdownRef.current && !viewDropdownRef.current.contains(e.target)) setShowViewDropdown(false); }; document.addEventListener('mousedown', handler); return () => document.removeEventListener('mousedown', handler); }, []);

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
            <div className="relative flex-1 min-w-[180px] sm:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
              <input id="search-sku" type="text" placeholder={t('stock.searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl pl-9 pr-4 py-2 text-xs transition-all font-medium" style={{ background: S.surface, border: `1px solid ${S.border}`, color: S.text }} />
            </div>
            <button onClick={loadStockData} disabled={loading} className="p-2 rounded-xl transition-all disabled:opacity-50 shrink-0 cursor-pointer icon-hover-spin active:scale-90" style={{ background: S.surface, border: `1px solid ${S.border}`, color: S.secondary }}>
              <RefreshCw className={`w-4 h-4 transition-transform ${loading ? 'animate-smooth-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Summary Cards — semantic color grouping: stock movement = deep-purple, cost/value = navy */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          {[
            { label: t('stock.totalAddedQty'), value: stockSummary.total_quantity || 0, icon: Package, hint: t('stock.initialStockLogged'), color: 'var(--color-rose)', bg: 'var(--color-accent-light)' },
            { label: t('fields.sellingQ'), value: stockSummary.total_available_quantity != null ? stockSummary.total_available_quantity : stockSummary.total_available_stock || 0, icon: Boxes, hint: t('stock.physicalStockInHand'), color: 'var(--color-success)', bg: 'var(--color-success-light)' },
            { label: t('stock.custReturnedQty'), value: stockSummary.total_customer_returned_quantity != null ? stockSummary.total_customer_returned_quantity : 0, icon: RotateCcw, hint: t('stock.customerReturnUnits'), color: 'var(--color-amber)', bg: 'var(--color-amber-muted)' },
            { label: t('stock.rtoReturnedQty'), value: stockSummary.total_rto_returned_quantity || 0, icon: RotateCcw, hint: t('stock.rtoReturnUnits'), color: 'var(--color-deep-purple)', bg: 'var(--color-info-light)' },
            { label: t('stock.inventoryCost'), value: formatCurrency(stockSummary.total_inventory_cost != null ? stockSummary.total_inventory_cost : stockSummary.total_purchase_cost), icon: Coins, hint: t('stock.purchaseCostAvailable'), color: S.navy, bg: 'rgba(29,26,57,0.08)' }
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={i} className="ui-card p-4 space-y-1.5 animate-fade-in-up" style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: S.muted }}>{card.label}</span>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: card.bg }}>
                    <Icon className="w-4 h-4" style={{ color: card.color }} />
                  </div>
                </div>
                <p className="text-2xl font-bold font-mono" style={{ color: card.color }}>{card.value}</p>
                <p className="text-[10px] font-medium" style={{ color: S.muted }}>{card.hint}</p>
              </div>
            );
          })}
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95" style={showFilters ? { background: 'var(--color-accent-light)', border: '1px solid var(--color-accent-muted)', color: 'var(--color-rose)' } : { background: 'var(--color-surface)', border: `1px solid ${S.border}`, color: S.secondary }}><Filter className="w-3.5 h-3.5" />{t('stock.filters')}</button>
            <div className="relative" ref={viewDropdownRef}>
              <button onClick={() => setShowViewDropdown(!showViewDropdown)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95" style={{ background: 'var(--color-surface)', border: `1px solid ${S.border}`, color: S.secondary }}>{t('stock.view')}<ChevronDown className={`w-3 h-3 transition-transform ${showViewDropdown ? 'rotate-180' : ''}`} /></button>
              {showViewDropdown && <div className="absolute left-0 top-10 z-50 py-1.5 rounded-xl min-w-[160px] animate-fade-in" style={{ background: 'var(--color-surface)', border: `1px solid ${S.border}`, boxShadow: 'var(--shadow-lg)' }}>
                {['all','stock','pricing','financials'].map(m => <button key={m} onClick={() => { setViewMode(m); setShowViewDropdown(false); }} className="flex items-center w-full px-3.5 py-2 text-xs font-semibold cursor-pointer transition-colors" style={viewMode === m ? { background: 'var(--color-accent-light)', color: 'var(--color-rose)' } : { color: S.secondary }}>{t(`stock.${m === 'all' ? 'allColumns' : m === 'stock' ? 'stockOnly' : m === 'pricing' ? 'pricingOnly' : 'financialsOnly'}`)}</button>)}
              </div>}
            </div>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--color-surface)', border: `1px solid ${S.border}` }}>
            {['all','stock','pricing','financials'].map(m => (<button key={m} onClick={() => setViewMode(m)} className="px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all" style={viewMode === m ? { background: 'linear-gradient(135deg, var(--color-navy), var(--color-deep-purple))', color: 'var(--color-blush-light)', boxShadow: '0 2px 8px rgba(29,26,57,0.25)' } : { color: S.muted }}>{t(`stock.${m === 'all' ? 'allColumns' : m === 'stock' ? 'stockOnly' : m === 'pricing' ? 'pricingOnly' : 'financialsOnly'}`)}</button>))}
          </div>
        </div>
        {/* Filter Panel */}
        {showFilters && <div className="ui-card p-4 flex flex-wrap items-end gap-4 animate-fade-in-up" style={{ background: 'var(--color-surface)' }}>
          <div><label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: S.muted }}>Min Qty</label><input type="number" placeholder="0" value={filterMinQty} onChange={e => setFilterMinQty(e.target.value)} className="w-24 rounded-lg px-2.5 py-1.5 text-xs font-mono font-semibold outline-none" style={{ background: S.surface, border: `1px solid ${S.border}`, color: S.text }} /></div>
          <div><label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: S.muted }}>Min Profit</label><input type="number" placeholder="0" value={filterMinProfit} onChange={e => setFilterMinProfit(e.target.value)} className="w-24 rounded-lg px-2.5 py-1.5 text-xs font-mono font-semibold outline-none" style={{ background: S.surface, border: `1px solid ${S.border}`, color: S.text }} /></div>
          <button onClick={() => { setFilterMinQty(''); setFilterMinProfit(''); }} className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all active:scale-95" style={{ background: 'var(--color-danger-light)', color: 'var(--color-rose)', border: '1px solid var(--color-danger-border)' }}>Clear</button>
        </div>}

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
            <div className="py-20 text-center space-y-4" style={{ background: S.surface }}><Inbox className="w-14 h-14 mx-auto animate-float" style={{ color: 'var(--color-border-strong)' }} /><h4 className="font-bold text-base" style={{ color: S.text }}>{t('stock.noProductsFound')}</h4>
              <p className="text-xs max-w-sm mx-auto font-medium leading-relaxed" style={{ color: S.muted }}>{searchQuery ? t('stock.noProductsMatch', { query: searchQuery }) : t('stock.noProductsHint')}</p></div>
          ) : (
            <div className="overflow-x-auto" style={{ background: 'var(--color-surface)' }}>
              <table className="w-full text-left border-collapse text-xs" id="stock-table" style={{ minWidth: viewMode === 'all' ? '1100px' : '600px' }}>
                <thead>
                  <tr style={{ background: '#30122E', color: '#FFFFFF' }} className="text-[10px] uppercase tracking-widest font-bold">
                    <th colSpan="2" className="py-2.5 px-3 text-center border-r border-white/15" style={{ background: '#30122E' }}>{t('stock.identity')}</th>
                    {(viewMode === 'all' || viewMode === 'stock') && <th colSpan="4" className="py-2.5 px-3 text-center border-r border-white/15" style={{ background: '#30122E' }}>{t('stock.quantities')}</th>}
                    {(viewMode === 'all' || viewMode === 'pricing') && <th colSpan="2" className="py-2.5 px-3 text-center border-r border-white/15" style={{ background: '#30122E' }}>{t('stock.pricing')}</th>}
                    {(viewMode === 'all' || viewMode === 'financials') && <th colSpan="4" className="py-2.5 px-3 text-center" style={{ background: '#30122E' }}>{t('stock.financials')}</th>}
                    <th className="py-2.5 px-2" style={{ background: '#30122E' }}></th>
                  </tr>
                  <tr style={{ background: '#361438', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(248, 231, 238, 0.85)' }} className="uppercase tracking-wider font-semibold text-[10px]">
                    <th className="py-3 px-3 sticky left-0 z-10" style={{ background: '#361438' }}>{t('fields.skuId')}</th>
                    <th className="py-3 px-3 sticky left-[90px] z-10" style={{ background: '#361438', borderRight: '1px solid rgba(255,255,255,0.1)' }}>{t('fields.productName')}</th>
                    {(viewMode === 'all' || viewMode === 'stock') && <><th className="py-3 px-2 text-center cursor-pointer select-none" style={{ background: '#361438' }} onClick={() => handleSort('total_quantity')}><span className="inline-flex items-center gap-1 justify-center">{t('stock.totalQty')}<ArrowUpDown className="w-3 h-3 opacity-60" /></span></th>
                    <th className="py-3 px-2 text-center cursor-pointer select-none" style={{ background: '#361438' }} onClick={() => handleSort('successfully_sold_quantity')}><span className="inline-flex items-center gap-1 justify-center">{t('stock.soldQty')}<ArrowUpDown className="w-3 h-3 opacity-60" /></span></th>
                    <th className="py-3 px-2 text-center" style={{ background: '#361438' }}>{t('stock.custReturn')}</th>
                    <th className="py-3 px-2 text-center" style={{ background: '#361438', borderRight: viewMode === 'all' ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>{t('stock.rtoReturn')}</th></>}
                    {(viewMode === 'all' || viewMode === 'pricing') && <><th className="py-3 px-2 text-center cursor-pointer select-none" style={{ background: '#361438' }} onClick={() => handleSort('purchase_price')}><span className="inline-flex items-center gap-1 justify-center">{t('fields.purchasePrice')}<ArrowUpDown className="w-3 h-3 opacity-60" /></span></th>
                    <th className="py-3 px-2 text-center cursor-pointer select-none" style={{ background: '#361438', borderRight: viewMode === 'all' ? '1px solid rgba(255,255,255,0.1)' : 'none' }} onClick={() => handleSort('selling_price')}><span className="inline-flex items-center gap-1 justify-center">{t('fields.sellingPrice')}<ArrowUpDown className="w-3 h-3 opacity-60" /></span></th></>}
                    {(viewMode === 'all' || viewMode === 'financials') && <><th className="py-3 px-2 text-right cursor-pointer select-none" style={{ background: '#361438' }} onClick={() => handleSort('inventory_cost')}><span className="inline-flex items-center gap-1 justify-end">{t('stock.inventoryCost')}<ArrowUpDown className="w-3 h-3 opacity-60" /></span></th>
                    <th className="py-3 px-2 text-right cursor-pointer select-none" style={{ background: '#361438' }} onClick={() => handleSort('inventory_value')}><span className="inline-flex items-center gap-1 justify-end">{t('stock.inventoryValue')}<ArrowUpDown className="w-3 h-3 opacity-60" /></span></th>
                    <th className="py-3 px-2 text-right cursor-pointer select-none" style={{ background: '#361438' }} onClick={() => handleSort('realized_sales_profit')}><span className="inline-flex items-center gap-1 justify-end">{t('stock.realizedProfit')}<ArrowUpDown className="w-3 h-3 opacity-60" /></span></th>
                    <th className="py-3 px-2 text-right cursor-pointer select-none" style={{ background: '#361438' }} onClick={() => handleSort('net_profit')}><span className="inline-flex items-center gap-1 justify-end">{t('stock.netProfit')}<ArrowUpDown className="w-3 h-3 opacity-60" /></span></th></>}
                    <th className="py-3 px-2 w-8" style={{ background: '#361438' }}></th>
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
                        <td className="py-3.5 px-2 text-right"><span className="font-mono text-xs font-semibold" style={{ color: 'var(--color-amber)' }}>{formatCurrency(p.inventory_cost != null ? p.inventory_cost : p.product_cost)}</span></td>
                        <td className="py-3.5 px-2 text-right"><span className="font-mono text-xs font-semibold" style={{ color: 'var(--color-success)' }}>{formatCurrency(p.inventory_value != null ? p.inventory_value : p.selling_value)}</span></td>
                        <td className="py-3.5 px-2 text-right"><span className="font-mono text-xs font-semibold" style={{ color: 'var(--color-rose)' }}>{formatCurrency(p.realized_sales_profit)}</span></td>
                        <td className="py-3.5 px-2 text-right"><span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full" style={rawNet == null ? { color: S.muted } : rawNet >= 0 ? { color: 'var(--color-success)', background: 'var(--color-success-light)', border: '1px solid var(--color-success-border)' } : { color: 'var(--color-rose)', background: 'var(--color-danger-light)', border: '1px solid var(--color-danger-border)' }}>{formatCurrency(rawNet)}</span></td>
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
