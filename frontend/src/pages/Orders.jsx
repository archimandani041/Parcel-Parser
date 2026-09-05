import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import AutoTranslate from '../components/AutoTranslate';
import TiltCard from '../components/animations/TiltCard';
import AnimatedCounter from '../components/animations/AnimatedCounter';
import { getOrderRecords, returnOrderRecord, undoReturnOrderRecord, deleteOrderRecord } from '../services/api';
import {
  Package,
  Boxes,
  Search,
  RefreshCw,
  RotateCcw,
  AlertTriangle,
  Trash2,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  X,
  SlidersHorizontal,
  CheckCircle2,
  Truck,
  Inbox
} from 'lucide-react';

export default function Orders() {
  const { t } = useTranslation();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('all'); // 'all', 'delivered', 'returned', 'customer_return', 'rto_return'
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', dir: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [showViewDropdown, setShowViewDropdown] = useState(false);

  // Advanced Filter States (mirrors Stock page)
  const [filterPreset, setFilterPreset] = useState('all'); // 'all', 'delivered', 'returned', 'customer_return', 'rto_return', 'multi_item'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'delivered', 'returned', 'customer_return', 'rto_return'
  const [filterSku, setFilterSku] = useState('all');
  const [filterMinQty, setFilterMinQty] = useState('');
  const [filterMaxQty, setFilterMaxQty] = useState('');
  const [filterHasReturns, setFilterHasReturns] = useState(false);

  // Operation / Modal States
  const [returningId, setReturningId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [returnModalOrder, setReturnModalOrder] = useState(null);
  const [confirmUndoOrder, setConfirmUndoOrder] = useState(null);
  const [undoingId, setUndoingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const viewDropdownRef = useRef(null);
  const ITEMS_PER_PAGE = 10;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOrderRecords();
      setRecords(res.records || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Click outside to close view dropdown
  useEffect(() => {
    const handler = (e) => {
      if (viewDropdownRef.current && !viewDropdownRef.current.contains(e.target)) {
        setShowViewDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Summary Metrics calculation (for executive KPI TiltCards)
  const metrics = useMemo(() => {
    const totalOrders = records.length;
    let totalQuantity = 0;
    let totalDelivered = 0;
    let totalCustReturns = 0;
    let totalRtoReturns = 0;

    records.forEach(rec => {
      const qty = parseInt(rec.quantity, 10) || 1;
      totalQuantity += qty;
      if (rec.is_returned) {
        if (rec.return_type === 'CUSTOMER_RETURN') {
          totalCustReturns += 1;
        } else if (rec.return_type === 'RTO_RETURN') {
          totalRtoReturns += 1;
        } else {
          totalCustReturns += 1;
        }
      } else {
        totalDelivered += 1;
      }
    });

    return {
      totalOrders,
      totalQuantity,
      totalDelivered,
      totalCustReturns,
      totalRtoReturns
    };
  }, [records]);

  // Unique SKUs for dropdown filter
  const uniqueSkus = useMemo(() => {
    const set = new Set();
    records.forEach(r => {
      if (r.sku_id) {
        r.sku_id.split('|').forEach(s => {
          const trimmed = s.trim();
          if (trimmed) set.add(trimmed);
        });
      }
    });
    return Array.from(set).sort();
  }, [records]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setViewMode('all');
    setFilterPreset('all');
    setFilterStatus('all');
    setFilterSku('all');
    setFilterMinQty('');
    setFilterMaxQty('');
    setFilterHasReturns(false);
  };

  const activeFilterCount =
    (searchQuery.trim() !== '' ? 1 : 0) +
    (viewMode !== 'all' ? 1 : 0) +
    (filterPreset !== 'all' ? 1 : 0) +
    (filterStatus !== 'all' ? 1 : 0) +
    (filterSku !== 'all' ? 1 : 0) +
    (filterMinQty !== '' ? 1 : 0) +
    (filterMaxQty !== '' ? 1 : 0) +
    (filterHasReturns ? 1 : 0);

  // Multi-field Client-side Filter Logic
  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      const q = searchQuery.toLowerCase().trim();
      let matchSearch = true;
      if (q) {
        const orderId = (rec.order_id || '').toLowerCase();
        const custName = (rec.customer_name || '').toLowerCase();
        const skuId = (rec.sku_id || '').toLowerCase();
        const prodName = (rec.product_name || '').toLowerCase();
        const returnType = (rec.return_type || '').toLowerCase();
        const statusText = rec.is_returned ? 'returned return' : 'delivered active normal';
        matchSearch =
          orderId.includes(q) ||
          custName.includes(q) ||
          skuId.includes(q) ||
          prodName.includes(q) ||
          returnType.includes(q) ||
          statusText.includes(q);
      }

      const qty = parseInt(rec.quantity, 10) || 1;

      // View Mode filter
      let matchView = true;
      if (viewMode === 'delivered') matchView = !rec.is_returned;
      else if (viewMode === 'returned') matchView = !!rec.is_returned;
      else if (viewMode === 'customer_return') matchView = rec.is_returned && rec.return_type === 'CUSTOMER_RETURN';
      else if (viewMode === 'rto_return') matchView = rec.is_returned && rec.return_type === 'RTO_RETURN';

      // Preset filter
      let matchPreset = true;
      if (filterPreset === 'delivered') matchPreset = !rec.is_returned;
      else if (filterPreset === 'returned') matchPreset = !!rec.is_returned;
      else if (filterPreset === 'customer_return') matchPreset = rec.is_returned && rec.return_type === 'CUSTOMER_RETURN';
      else if (filterPreset === 'rto_return') matchPreset = rec.is_returned && rec.return_type === 'RTO_RETURN';
      else if (filterPreset === 'multi_item') matchPreset = qty >= 2;

      // Status dropdown
      let matchStatus = true;
      if (filterStatus === 'delivered') matchStatus = !rec.is_returned;
      else if (filterStatus === 'returned') matchStatus = !!rec.is_returned;
      else if (filterStatus === 'customer_return') matchStatus = rec.is_returned && rec.return_type === 'CUSTOMER_RETURN';
      else if (filterStatus === 'rto_return') matchStatus = rec.is_returned && rec.return_type === 'RTO_RETURN';

      // SKU dropdown
      let matchSku = true;
      if (filterSku !== 'all' && filterSku) {
        matchSku = (rec.sku_id || '').toLowerCase().includes(filterSku.toLowerCase());
      }

      // Quantity range
      const matchMinQty = !filterMinQty || qty >= Number(filterMinQty);
      const matchMaxQty = !filterMaxQty || qty <= Number(filterMaxQty);

      // Returns checkbox
      const matchReturns = !filterHasReturns || !!rec.is_returned;

      return (
        matchSearch &&
        matchView &&
        matchPreset &&
        matchStatus &&
        matchSku &&
        matchMinQty &&
        matchMaxQty &&
        matchReturns
      );
    });
  }, [
    records,
    searchQuery,
    viewMode,
    filterPreset,
    filterStatus,
    filterSku,
    filterMinQty,
    filterMaxQty,
    filterHasReturns
  ]);

  // Sorting
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      if (!sortConfig.key) return 0;
      let av, bv;

      if (sortConfig.key === 'return_status') {
        av = a.is_returned ? (a.return_type || 'RETURN') : 'DELIVERED';
        bv = b.is_returned ? (b.return_type || 'RETURN') : 'DELIVERED';
      } else if (sortConfig.key === 'quantity') {
        av = parseInt(a.quantity, 10) || 1;
        bv = parseInt(b.quantity, 10) || 1;
      } else {
        av = a[sortConfig.key];
        bv = b[sortConfig.key];
      }

      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'string') {
        return sortConfig.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortConfig.dir === 'asc' ? av - bv : bv - av;
    });
  }, [filteredRecords, sortConfig]);

  // Reset pagination when any filter or query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    viewMode,
    filterPreset,
    filterStatus,
    filterSku,
    filterMinQty,
    filterMaxQty,
    filterHasReturns
  ]);

  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / ITEMS_PER_PAGE));
  const paginatedRecords = sortedRecords.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Return Actions
  const executeReturn = async (rec, returnType) => {
    const targetId = rec.order_id || rec.id;
    setReturningId(rec.id);
    setReturnModalOrder(null);
    try {
      await returnOrderRecord(targetId, returnType);
      showToast(
        t('orders.orderMarkedAsReturn', {
          id: rec.order_id || rec.id,
          type: returnType === 'RTO_RETURN' ? t('orders.rtoReturn') : t('orders.customerReturn')
        })
      );
      await loadRecords();
    } catch (err) {
      alert(t('orders.returnFailed') + (err.response?.data?.error || err.message));
    } finally {
      setReturningId(null);
    }
  };

  const handleOpenUndoModal = (rec) => setConfirmUndoOrder(rec);

  const handleConfirmUndoReturn = async () => {
    if (!confirmUndoOrder) return;
    const targetId = confirmUndoOrder.id;
    setConfirmUndoOrder(null);
    setUndoingId(targetId);
    try {
      await undoReturnOrderRecord(targetId);
      showToast(t('orders.returnUndoneSuccess'));
      await loadRecords();
    } catch (err) {
      alert(t('orders.undoReturnFailed') + (err.response?.data?.error || err.message));
    } finally {
      setUndoingId(null);
    }
  };

  const handleDelete = async (id, orderId) => {
    if (!window.confirm(t('orders.confirmDeleteOrder', { id: orderId || id }))) return;
    setDeletingId(id);
    try {
      await deleteOrderRecord(id);
      setRecords(prev => prev.filter(r => r.id !== id && r.order_id !== id));
      showToast(t('common.deleted', 'Order deleted successfully'));
    } catch (err) {
      alert(t('orders.deleteFailed') + (err.response?.data?.error || err.message));
    } finally {
      setDeletingId(null);
    }
  };

  const S = {
    accent: 'var(--color-rose)',
    navy: 'var(--color-navy)',
    border: 'var(--color-border-light)',
    muted: 'var(--color-text-muted)',
    surface: 'var(--color-surface-muted)',
    text: 'var(--color-text-primary)',
    secondary: 'var(--color-text-secondary)'
  };

  return (
    <Layout title={t('nav.orders')}>
      <div className="space-y-6 pb-12 w-full animate-fade-in">
        {/* Top Header & Fully Functional Search Bar */}
        <div
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border-light)',
            boxShadow: 'var(--shadow-sm)',
            backdropFilter: 'blur(12px)'
          }}
        >
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md shrink-0"
              style={{
                background: 'linear-gradient(135deg, var(--color-navy), var(--color-deep-purple))',
                boxShadow: '0 4px 14px rgba(29,26,57,0.2)'
              }}
            >
              <Package className="w-6 h-6" style={{ color: 'var(--color-blush-light)' }} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight font-serif" style={{ color: S.navy }}>
                {t('orders.title')} <span className="font-normal" style={{ color: 'var(--color-rose)' }}>{t('orders.titleHighlight')}</span>
              </h1>
              <p className="text-xs font-medium mt-0.5" style={{ color: S.muted }}>{t('orders.subtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto">
            {/* Search Input with Instant Filtering & Clear Button */}
            <form onSubmit={(e) => e.preventDefault()} className="relative flex-1 min-w-[220px] sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: S.muted }} />
              <input
                id="search-order-input"
                type="text"
                placeholder={t('orders.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl pl-9 pr-9 py-2 text-xs transition-all font-medium outline-none focus:ring-2 focus:ring-rose-300"
                style={{
                  background: S.surface,
                  border: `1px solid ${S.border}`,
                  color: S.text
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-black/5 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            <button
              onClick={loadRecords}
              disabled={loading}
              className="p-2 rounded-xl transition-all disabled:opacity-50 shrink-0 cursor-pointer icon-hover-spin active:scale-90"
              style={{ background: S.surface, border: `1px solid ${S.border}`, color: S.secondary }}
              title={t('common.refresh')}
            >
              <RefreshCw className={`w-4 h-4 transition-transform ${loading ? 'animate-smooth-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Summary KPI Cards (Executive TiltCard Style from Stock Page) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {[
            {
              label: t('orders.totalOrders'),
              value: metrics.totalOrders,
              icon: Package,
              hint: t('orders.totalOrdersLogged'),
              bg: 'linear-gradient(135deg, rgba(29, 26, 57, 0.05), rgba(66, 30, 54, 0.08))',
              border: 'rgba(29, 26, 57, 0.15)',
              iconBg: 'rgba(29, 26, 57, 0.1)',
              iconColor: 'var(--color-navy)',
              valueColor: 'var(--color-navy)',
              labelColor: 'var(--color-navy)'
            },
            {
              label: t('orders.totalUnits'),
              value: metrics.totalQuantity,
              icon: Boxes,
              hint: t('orders.totalUnitsOrdered'),
              bg: 'var(--color-accent-light)',
              border: 'var(--color-accent-muted)',
              iconBg: 'var(--color-accent-light)',
              iconColor: 'var(--color-rose)',
              valueColor: 'var(--color-rose)',
              labelColor: 'var(--color-rose)'
            },
            {
              label: t('orders.delivered'),
              value: metrics.totalDelivered,
              icon: CheckCircle2,
              hint: t('orders.deliveredActiveOrders'),
              bg: 'var(--color-success-light)',
              border: 'var(--color-success-border)',
              iconBg: 'var(--color-success-light)',
              iconColor: 'var(--color-success)',
              valueColor: 'var(--color-success)',
              labelColor: 'var(--color-success)'
            },
            {
              label: t('orders.custReturns'),
              value: metrics.totalCustReturns,
              icon: RotateCcw,
              hint: t('orders.customerReturnedUnits'),
              bg: 'var(--color-amber-muted)',
              border: 'var(--color-warning-border)',
              iconBg: 'var(--color-amber-muted)',
              iconColor: 'var(--color-amber)',
              valueColor: 'var(--color-amber)',
              labelColor: 'var(--color-amber)'
            },
            {
              label: t('orders.rtoReturns'),
              value: metrics.totalRtoReturns,
              icon: Truck,
              hint: t('orders.rtoReturnedUnits'),
              bg: 'rgba(102, 37, 73, 0.08)',
              border: 'rgba(102, 37, 73, 0.18)',
              iconBg: 'rgba(102, 37, 73, 0.08)',
              iconColor: 'var(--color-plum)',
              valueColor: 'var(--color-plum)',
              labelColor: 'var(--color-plum)'
            }
          ].map((card, i) => {
            const Icon = card.icon;
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
                    <AnimatedCounter value={card.value} />
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

        {/* Action Controls & View Mode Bar (Identical to Stock page) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-sm"
              style={
                showFilters || activeFilterCount > 0
                  ? { background: '#2B122A', color: '#FFFFFF' }
                  : { background: 'var(--color-surface)', border: `1px solid ${S.border}`, color: S.secondary }
              }
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{t('orders.filters', 'Filters')}</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold text-white" style={{ background: 'var(--color-rose)' }}>
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* View Mode Dropdown */}
            <div className="relative" ref={viewDropdownRef}>
              <button
                onClick={() => setShowViewDropdown(!showViewDropdown)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95"
                style={{ background: 'var(--color-surface)', border: `1px solid ${S.border}`, color: S.secondary }}
              >
                {t('orders.view', 'View')}
                <ChevronDown className={`w-3 h-3 transition-transform ${showViewDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showViewDropdown && (
                <div
                  className="absolute left-0 top-10 z-50 py-1.5 rounded-xl min-w-[160px] animate-fade-in shadow-xl"
                  style={{ background: 'var(--color-surface)', border: `1px solid ${S.border}`, boxShadow: 'var(--shadow-lg)' }}
                >
                  {[
                    { id: 'all', label: t('orders.allOrders') },
                    { id: 'delivered', label: t('orders.deliveredOnly') },
                    { id: 'returned', label: t('orders.allReturns') },
                    { id: 'customer_return', label: t('orders.customerReturnsOnly') },
                    { id: 'rto_return', label: t('orders.rtoReturnsOnly') }
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => { setViewMode(m.id); setShowViewDropdown(false); }}
                      className="flex items-center w-full px-3.5 py-2 text-xs font-semibold cursor-pointer transition-colors"
                      style={viewMode === m.id ? { background: '#F5E8F3', color: '#2B122A' } : { color: S.secondary }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Clear All Filters Button */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-xl cursor-pointer transition-all active:scale-95"
                style={{ color: 'var(--color-rose)', background: 'var(--color-danger-light)', border: '1px solid var(--color-danger-border)' }}
              >
                <X className="w-3.5 h-3.5" />
                <span>{t('orders.clearAllFilters', 'Clear All Filters')}</span>
              </button>
            )}
          </div>

          {/* Segmented View Mode Buttons */}
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--color-surface)', border: `1px solid ${S.border}` }}>
            {[
              { id: 'all', label: t('orders.allOrders') },
              { id: 'delivered', label: t('orders.deliveredOnly') },
              { id: 'returned', label: t('orders.allReturns') },
              { id: 'customer_return', label: t('orders.customerReturnsOnly') },
              { id: 'rto_return', label: t('orders.rtoReturnsOnly') }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setViewMode(m.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all whitespace-nowrap"
                style={
                  viewMode === m.id
                    ? { background: '#2B122A', color: '#FFFFFF', boxShadow: '0 2px 8px rgba(43,18,42,0.25)' }
                    : { color: S.muted }
                }
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active Filter Chips Bar */}
        {activeFilterCount > 0 && (
          <div
            className="flex flex-wrap items-center gap-2 px-4 py-2.5 rounded-2xl animate-fade-in"
            style={{ background: 'var(--color-surface)', border: `1px solid ${S.border}` }}
          >
            <span className="text-xs font-bold" style={{ color: S.muted }}>{t('orders.activeFilters', 'Active Filters:')}</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: '#2B122A', color: '#FFFFFF' }}>
                Search: "{searchQuery}"
                <X className="w-3 h-3 cursor-pointer hover:opacity-75" onClick={() => setSearchQuery('')} />
              </span>
            )}
            {viewMode !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: '#2B122A', color: '#FFFFFF' }}>
                View: {viewMode.replace('_', ' ')}
                <X className="w-3 h-3 cursor-pointer hover:opacity-75" onClick={() => setViewMode('all')} />
              </span>
            )}
            {filterPreset !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: '#2B122A', color: '#FFFFFF' }}>
                Preset: {filterPreset.replace('_', ' ')}
                <X className="w-3 h-3 cursor-pointer hover:opacity-75" onClick={() => setFilterPreset('all')} />
              </span>
            )}
            {filterStatus !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: '#2B122A', color: '#FFFFFF' }}>
                Status: {filterStatus.replace('_', ' ')}
                <X className="w-3 h-3 cursor-pointer hover:opacity-75" onClick={() => setFilterStatus('all')} />
              </span>
            )}
            {filterSku !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: '#2B122A', color: '#FFFFFF' }}>
                SKU: {filterSku}
                <X className="w-3 h-3 cursor-pointer hover:opacity-75" onClick={() => setFilterSku('all')} />
              </span>
            )}
            {(filterMinQty !== '' || filterMaxQty !== '') && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: '#2B122A', color: '#FFFFFF' }}>
                Qty: {filterMinQty || '0'} - {filterMaxQty || '∞'}
                <X className="w-3 h-3 cursor-pointer hover:opacity-75" onClick={() => { setFilterMinQty(''); setFilterMaxQty(''); }} />
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

        {/* Detailed Filter Panel Drawer & Quick Preset Pills (Stock Page Style) */}
        {showFilters && (
          <div
            className="ui-card p-5 space-y-4 animate-fade-in-up rounded-2xl"
            style={{ background: 'var(--color-surface)', border: `1px solid ${S.border}`, boxShadow: 'var(--shadow-md)' }}
          >
            {/* Quick Filter Presets Row */}
            <div className="flex flex-wrap items-center gap-2 pb-3 border-b text-xs" style={{ borderColor: S.border }}>
              <span className="text-[11px] font-bold uppercase tracking-wider shrink-0" style={{ color: '#8E7C8C' }}>{t('orders.filters')}:</span>
              {[
                { id: 'all', label: t('orders.presetAll') },
                { id: 'delivered', label: t('orders.presetDelivered'), badge: '✅' },
                { id: 'returned', label: t('orders.presetAllReturns'), badge: '🔄' },
                { id: 'customer_return', label: t('orders.presetCustomerReturn'), badge: '📦' },
                { id: 'rto_return', label: t('orders.presetRtoReturn'), badge: '🚚' },
                { id: 'multi_item', label: t('orders.presetMultiItem'), badge: '⚡' }
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setFilterPreset(p.id)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold shrink-0 cursor-pointer transition-all active:scale-95 shadow-xs"
                  style={
                    filterPreset === p.id
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
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: S.navy }}>{t('orders.filterControls')}</h3>
              </div>
              <button
                onClick={clearAllFilters}
                className="text-xs font-bold cursor-pointer transition-colors hover:underline"
                style={{ color: 'var(--color-rose)' }}
              >
                {t('orders.clearAllFilters')}
              </button>
            </div>

            {/* Granular Filter Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Return / Order Status Select */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: S.muted }}>{t('orders.orderStatus')}</label>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-xs font-semibold outline-none cursor-pointer"
                  style={{ background: S.surface, border: `1px solid ${S.border}`, color: S.text }}
                >
                  <option value="all">{t('orders.allStatuses')}</option>
                  <option value="delivered">{t('orders.deliveredStatus')}</option>
                  <option value="returned">{t('orders.returnedStatus')}</option>
                  <option value="customer_return">{t('orders.customerReturnStatus')}</option>
                  <option value="rto_return">{t('orders.rtoReturnStatus')}</option>
                </select>
              </div>

              {/* SKU Dropdown */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: S.muted }}>{t('orders.skuFilter')}</label>
                <select
                  value={filterSku}
                  onChange={e => setFilterSku(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-xs font-semibold outline-none cursor-pointer"
                  style={{ background: S.surface, border: `1px solid ${S.border}`, color: S.text }}
                >
                  <option value="all">{t('orders.allSkus')}</option>
                  {uniqueSkus.map(sku => (
                    <option key={sku} value={sku}>{sku}</option>
                  ))}
                </select>
              </div>

              {/* Quantity Range */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: S.muted }}>{t('orders.totalQtyRange')}</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    placeholder={t('orders.minQty')}
                    value={filterMinQty}
                    onChange={e => setFilterMinQty(e.target.value)}
                    className="w-full rounded-xl px-2.5 py-1.5 text-xs font-mono font-semibold outline-none"
                    style={{ background: S.surface, border: `1px solid ${S.border}`, color: S.text }}
                  />
                  <span className="text-xs" style={{ color: S.muted }}>-</span>
                  <input
                    type="number"
                    placeholder={t('orders.maxQty')}
                    value={filterMaxQty}
                    onChange={e => setFilterMaxQty(e.target.value)}
                    className="w-full rounded-xl px-2.5 py-1.5 text-xs font-mono font-semibold outline-none"
                    style={{ background: S.surface, border: `1px solid ${S.border}`, color: S.text }}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="pt-2 border-t flex items-center justify-between" style={{ borderColor: S.border }}>
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none" style={{ color: S.text }}>
                <input
                  type="checkbox"
                  checked={filterHasReturns}
                  onChange={e => setFilterHasReturns(e.target.checked)}
                  className="rounded accent-purple-900"
                />
                <span>{t('orders.hasReturnsOnly')}</span>
              </label>
              <button
                onClick={() => setShowFilters(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-sm"
                style={{ background: '#2B122A', color: '#FFFFFF' }}
              >
                {t('orders.applyFilters')}
              </button>
            </div>
          </div>
        )}

        {/* Orders Table Section */}
        <div
          className="ui-card rounded-3xl overflow-hidden"
          style={{ border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-lg)' }}
        >
          {loading ? (
            <div className="space-y-2 p-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3.5 rounded-xl">
                  <div className="skeleton-loader w-20 h-6 rounded-xl" />
                  <div className="skeleton-loader w-28 h-4 rounded-lg" />
                  <div className="skeleton-loader w-16 h-4 rounded-lg" />
                  <div className="flex-1"><div className="skeleton-loader h-4 rounded-lg w-3/4" /></div>
                  <div className="skeleton-loader w-8 h-8 rounded-lg" />
                  <div className="skeleton-loader w-16 h-6 rounded-full" />
                  <div className="skeleton-loader w-8 h-8 rounded-lg" />
                </div>
              ))}
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-20 text-center space-y-4" style={{ background: 'var(--color-surface-muted)' }}>
              <Inbox className="w-14 h-14 mx-auto animate-float" style={{ color: 'var(--color-border-strong)' }} />
              <h4 className="font-bold text-base" style={{ color: S.text }}>{t('orders.noOrdersFound')}</h4>
              <p className="text-xs max-w-sm mx-auto font-medium leading-relaxed" style={{ color: S.muted }}>
                {searchQuery || activeFilterCount > 0
                  ? t('orders.noOrdersMatch', { query: searchQuery || 'filters' })
                  : t('orders.noOrdersHint')}
              </p>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95"
                  style={{ background: '#2B122A', color: '#FFFFFF' }}
                >
                  {t('orders.clearAllFilters')}
                </button>
              )}
            </div>
          ) : (
            <div className="w-full overflow-x-auto scrollbar-none">
              <table className="w-full text-left border-collapse text-xs table-auto" id="orders-table">
                <thead>
                  <tr
                    className="uppercase tracking-wider font-bold text-[10px]"
                    style={{ background: '#2B122A', color: '#FFFFFF', borderBottom: '1px solid rgba(255, 255, 255, 0.15)' }}
                  >
                    <th
                      className="py-3 px-3 sm:px-4 cursor-pointer select-none hover:bg-white/5 transition-colors whitespace-nowrap"
                      onClick={() => handleSort('order_id')}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {t('fields.orderId')}
                        <ArrowUpDown className="w-3 h-3 opacity-80 text-white" />
                      </span>
                    </th>
                    <th
                      className="py-3 px-3 sm:px-4 cursor-pointer select-none hover:bg-white/5 transition-colors whitespace-nowrap"
                      onClick={() => handleSort('customer_name')}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {t('fields.customerName')}
                        <ArrowUpDown className="w-3 h-3 opacity-80 text-white" />
                      </span>
                    </th>
                    <th
                      className="py-3 px-3 sm:px-4 cursor-pointer select-none hover:bg-white/5 transition-colors whitespace-nowrap"
                      onClick={() => handleSort('sku_id')}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {t('fields.skuId')}
                        <ArrowUpDown className="w-3 h-3 opacity-80 text-white" />
                      </span>
                    </th>
                    <th
                      className="py-3 px-3 sm:px-4 cursor-pointer select-none hover:bg-white/5 transition-colors whitespace-nowrap"
                      onClick={() => handleSort('product_name')}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {t('fields.productName')}
                        <ArrowUpDown className="w-3 h-3 opacity-80 text-white" />
                      </span>
                    </th>
                    <th
                      className="py-3 px-2 sm:px-3 text-center cursor-pointer select-none hover:bg-white/5 transition-colors whitespace-nowrap"
                      onClick={() => handleSort('quantity')}
                    >
                      <span className="inline-flex items-center gap-1.5 justify-center">
                        {t('fields.quantity')}
                        <ArrowUpDown className="w-3 h-3 opacity-80 text-white" />
                      </span>
                    </th>
                    <th
                      className="py-3 px-2 sm:px-3 text-center cursor-pointer select-none hover:bg-white/5 transition-colors whitespace-nowrap"
                      onClick={() => handleSort('return_status')}
                    >
                      <span className="inline-flex items-center gap-1.5 justify-center">
                        {t('orders.returnStatus')}
                        <ArrowUpDown className="w-3 h-3 opacity-80 text-white" />
                      </span>
                    </th>
                    <th className="py-3 px-2 sm:px-3 text-center whitespace-nowrap">{t('common.action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--color-border-light)' }}>
                  {paginatedRecords.map((rec) => (
                    <tr key={rec.id} className="table-row-hover transition-colors duration-150">
                      {/* Order ID Badge */}
                      <td className="py-3 px-3 sm:px-4">
                        <span
                          className="inline-block font-mono text-xs font-bold px-2 py-0.5 rounded-full select-all truncate max-w-[150px] align-middle"
                          style={{
                            color: 'var(--color-rose)',
                            background: 'var(--color-accent-light)',
                            border: '1px solid var(--color-accent-muted)'
                          }}
                          title={rec.order_id || '-'}
                        >
                          {rec.order_id || '-'}
                        </span>
                      </td>

                      {/* Customer Name */}
                      <td className="py-3 px-3 sm:px-4">
                        <span className="text-xs font-bold truncate block max-w-[150px]" style={{ color: S.text }} title={rec.customer_name || ''}>
                          {rec.customer_name ? <AutoTranslate text={rec.customer_name} /> : '-'}
                        </span>
                      </td>

                      {/* SKU ID Badge */}
                      <td className="py-3 px-3 sm:px-4">
                        <span
                          className="inline-block font-mono text-xs font-bold px-2 py-0.5 rounded-full truncate max-w-[120px] align-middle"
                          style={{
                            color: 'var(--color-plum)',
                            background: 'rgba(102,37,73,0.06)',
                            border: '1px solid rgba(102,37,73,0.15)'
                          }}
                          title={rec.sku_id || '-'}
                        >
                          {rec.sku_id || '-'}
                        </span>
                      </td>

                      {/* Product Name */}
                      <td className="py-3 px-3 sm:px-4">
                        <span className="text-xs font-medium line-clamp-1 max-w-[200px]" style={{ color: S.secondary }} title={rec.product_name || ''}>
                          {rec.product_name ? <AutoTranslate text={rec.product_name} /> : '-'}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="py-3 px-2 sm:px-3 text-center">
                        <span
                          className="font-mono text-xs font-extrabold px-2 py-0.5 rounded-full"
                          style={{
                            color: S.navy,
                            background: 'var(--color-surface-muted)',
                            border: '1px solid var(--color-border-light)'
                          }}
                        >
                          {rec.quantity || 1}
                        </span>
                      </td>

                      {/* Return Status Pill / Button */}
                      <td className="py-3 px-2 sm:px-3 text-center whitespace-nowrap">
                        {rec.is_returned ? (
                          <button
                            onClick={() => handleOpenUndoModal(rec)}
                            disabled={undoingId === rec.id}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50 shadow-2xs icon-hover-rotate"
                            style={{
                              background: 'var(--color-danger-light)',
                              color: 'var(--color-rose)',
                              border: '1px solid var(--color-danger-border)'
                            }}
                            title={rec.return_type ? `${rec.return_type} — Click to undo` : 'Click to undo return'}
                          >
                            <RotateCcw className={`w-3.5 h-3.5 ${undoingId === rec.id ? 'animate-spin' : ''}`} />
                            {undoingId === rec.id
                              ? t('orders.undoing')
                              : rec.return_type === 'RTO_RETURN'
                                ? t('orders.rtoReturn')
                                : rec.return_type === 'CUSTOMER_RETURN'
                                  ? t('orders.customerReturn')
                                  : t('orders.returned')}
                          </button>
                        ) : (
                          <button
                            onClick={() => setReturnModalOrder(rec)}
                            disabled={returningId === rec.id}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50 shadow-2xs icon-hover-rotate"
                            style={{
                              background: 'var(--color-amber-muted)',
                              color: 'var(--color-navy)',
                              border: '1px solid var(--color-warning-border)'
                            }}
                          >
                            <RotateCcw className={`w-3.5 h-3.5 ${returningId === rec.id ? 'animate-spin' : ''}`} />
                            {returningId === rec.id ? t('orders.returning') : t('common.return')}
                          </button>
                        )}
                      </td>

                      {/* Action (Delete) */}
                      <td className="py-3 px-2 sm:px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleDelete(rec.id, rec.order_id)}
                          disabled={deletingId === rec.id}
                          className="p-2 rounded-xl transition-all cursor-pointer disabled:opacity-50 icon-hover-shake btn-danger-hover active:scale-90"
                          style={{ color: S.muted }}
                          title={t('common.delete')}
                        >
                          <Trash2 className={`w-4 h-4 ${deletingId === rec.id ? 'animate-smooth-spin' : ''}`} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination (Matching Stock page) */}
          {!loading && sortedRecords.length > 0 && (
            <div
              className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 gap-3"
              style={{ background: 'var(--color-surface-muted)', borderTop: `1px solid ${S.border}` }}
            >
              <span className="text-xs font-medium" style={{ color: S.muted }}>
                {t('orders.showingItems', {
                  from: (currentPage - 1) * ITEMS_PER_PAGE + 1,
                  to: Math.min(currentPage * ITEMS_PER_PAGE, sortedRecords.length),
                  total: sortedRecords.length
                })}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg cursor-pointer disabled:opacity-30 transition-all active:scale-95"
                  style={{ border: `1px solid ${S.border}`, color: S.secondary }}
                  title="Previous Page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                  <button
                    key={pg}
                    onClick={() => setCurrentPage(pg)}
                    className="w-7 h-7 rounded-lg text-xs font-bold cursor-pointer transition-all active:scale-95"
                    style={
                      pg === currentPage
                        ? {
                            background: 'linear-gradient(135deg, var(--color-navy), var(--color-deep-purple))',
                            color: 'var(--color-blush-light)',
                            boxShadow: '0 2px 8px rgba(29,26,57,0.25)'
                          }
                        : { color: S.muted }
                    }
                  >
                    {pg}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg cursor-pointer disabled:opacity-30 transition-all active:scale-95"
                  style={{ border: `1px solid ${S.border}`, color: S.secondary }}
                  title="Next Page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Return Type Modal */}
        {returnModalOrder && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(29,26,57,0.5)', backdropFilter: 'blur(4px)' }}
          >
            <div
              className="max-w-md w-full p-6 space-y-5 rounded-3xl shadow-2xl animate-scale-in"
              style={{ background: 'var(--color-surface)', border: `1px solid ${S.border}` }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                  style={{
                    background: 'var(--color-amber-muted)',
                    border: '1px solid var(--color-warning-border)',
                    color: 'var(--color-amber)'
                  }}
                >
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold" style={{ color: S.navy }}>{t('orders.selectReturnType')}</h3>
                  <p className="text-xs font-medium mt-1" style={{ color: S.muted }}>
                    {t('orders.chooseCategoryForOrder')}{' '}
                    <span className="font-mono font-bold" style={{ color: S.text }}>#{returnModalOrder.order_id}</span>
                  </p>
                </div>
              </div>
              <div
                className="rounded-2xl p-3.5 space-y-1.5 text-xs font-medium"
                style={{ background: S.surface, border: `1px solid ${S.border}`, color: S.secondary }}
              >
                <div className="flex justify-between">
                  <span>{t('fields.skuId')}:</span>
                  <span className="font-mono font-bold" style={{ color: S.navy }}>{returnModalOrder.sku_id}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('fields.customer')}:</span>
                  <span className="font-bold" style={{ color: S.text }}>{returnModalOrder.customer_name || '-'}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => executeReturn(returnModalOrder, 'CUSTOMER_RETURN')}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl transition-all group cursor-pointer active:scale-95"
                  style={{
                    border: '2px solid var(--color-warning-border)',
                    background: 'var(--color-amber-muted)',
                    color: 'var(--color-navy)'
                  }}
                >
                  <RotateCcw className="w-6 h-6 mb-1.5 group-hover:scale-110 transition-transform" style={{ color: 'var(--color-amber)' }} />
                  <span className="text-xs font-bold">{t('orders.customerReturn')}</span>
                  <span className="text-[10px] font-medium text-center mt-0.5" style={{ color: S.secondary }}>
                    {t('orders.deliveryChargeApplies')}
                  </span>
                </button>
                <button
                  onClick={() => executeReturn(returnModalOrder, 'RTO_RETURN')}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl transition-all group cursor-pointer active:scale-95"
                  style={{ border: '2px solid var(--color-border)', background: S.surface, color: S.navy }}
                >
                  <Package className="w-6 h-6 mb-1.5 group-hover:scale-110 transition-transform" style={{ color: 'var(--color-rose)' }} />
                  <span className="text-xs font-bold">{t('orders.rtoReturn')}</span>
                  <span className="text-[10px] font-medium text-center mt-0.5" style={{ color: S.muted }}>
                    {t('orders.returnToOriginZeroLoss')}
                  </span>
                </button>
              </div>
              <div className="flex justify-end pt-2" style={{ borderTop: `1px solid ${S.border}` }}>
                <button
                  onClick={() => setReturnModalOrder(null)}
                  className="px-4 py-1.5 text-xs font-bold transition-colors cursor-pointer"
                  style={{ color: S.muted }}
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Undo Modal */}
        {confirmUndoOrder && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(29,26,57,0.5)', backdropFilter: 'blur(4px)' }}
          >
            <div
              className="max-w-md w-full p-6 space-y-5 rounded-3xl shadow-2xl animate-scale-in"
              style={{ background: 'var(--color-surface)', border: `1px solid ${S.border}` }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                  style={{
                    background: 'var(--color-amber-muted)',
                    border: '1px solid var(--color-warning-border)',
                    color: 'var(--color-amber)'
                  }}
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold" style={{ color: S.navy }}>{t('orders.undoReturnTitle')}</h3>
                  <p className="text-xs leading-relaxed font-medium" style={{ color: S.secondary }}>
                    {t('orders.undoReturnConfirmMessage')}
                  </p>
                  {confirmUndoOrder.order_id && (
                    <div className="pt-1 text-[11px] font-mono font-semibold" style={{ color: S.accent }}>
                      {t('fields.orderId')}: {confirmUndoOrder.order_id}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2" style={{ borderTop: `1px solid ${S.border}` }}>
                <button
                  onClick={() => setConfirmUndoOrder(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  style={{ background: S.surface, color: S.secondary }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleConfirmUndoReturn}
                  className="px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-rose), var(--color-plum))',
                    color: 'var(--color-blush-light)',
                    boxShadow: '0 4px 12px rgba(174,68,90,0.2)'
                  }}
                >
                  <RotateCcw className="w-3.5 h-3.5" /> {t('orders.undoReturn')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toastMessage && (
          <div
            className="fixed bottom-6 right-6 z-50 text-xs font-semibold px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-toast-in"
            style={{
              background: 'linear-gradient(135deg, var(--color-navy), var(--color-deep-purple))',
              color: 'var(--color-blush-light)',
              border: '1px solid rgba(232,188,185,0.1)',
              boxShadow: '0 20px 40px rgba(29,26,57,0.3)'
            }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold animate-check-pop"
              style={{ background: 'var(--color-amber)', color: 'var(--color-navy)' }}
            >
              ✓
            </div>
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </Layout>
  );
}
