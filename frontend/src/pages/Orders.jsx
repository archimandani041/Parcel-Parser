import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import AutoTranslate from '../components/AutoTranslate';
import { getOrderRecords, returnOrderRecord, undoReturnOrderRecord, deleteOrderRecord } from '../services/api';
import { Search, RefreshCw, RotateCcw, Package, Inbox, Trash2, AlertTriangle } from 'lucide-react';

export default function Orders() {
  const { t } = useTranslation();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [returningId, setReturningId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [returnModalOrder, setReturnModalOrder] = useState(null);
  const [confirmUndoOrder, setConfirmUndoOrder] = useState(null);
  const [undoingId, setUndoingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => { setToastMessage(msg); setTimeout(() => setToastMessage(null), 3500); };

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try { const res = await getOrderRecords(searchQuery); setRecords(res.records || []); }
    catch (err) { console.error('Failed to load orders:', err); }
    finally { setLoading(false); }
  }, [searchQuery]);

  useEffect(() => { loadRecords(); }, [loadRecords]);
  const handleSearch = (e) => { e.preventDefault(); setSearchQuery(searchInput.trim()); };

  const executeReturn = async (rec, returnType) => {
    const targetId = rec.order_id || rec.id;
    setReturningId(rec.id); setReturnModalOrder(null);
    try { await returnOrderRecord(targetId, returnType); showToast(t('orders.orderMarkedAsReturn', { id: rec.order_id || rec.id, type: returnType === 'RTO_RETURN' ? t('orders.rtoReturn') : t('orders.customerReturn') })); await loadRecords(); }
    catch (err) { alert(t('orders.returnFailed') + (err.response?.data?.error || err.message)); }
    finally { setReturningId(null); }
  };

  const handleOpenUndoModal = (rec) => setConfirmUndoOrder(rec);
  const handleConfirmUndoReturn = async () => {
    if (!confirmUndoOrder) return;
    const targetId = confirmUndoOrder.id; setConfirmUndoOrder(null); setUndoingId(targetId);
    try { await undoReturnOrderRecord(targetId); showToast(t('orders.returnUndoneSuccess')); await loadRecords(); }
    catch (err) { alert(t('orders.undoReturnFailed') + (err.response?.data?.error || err.message)); }
    finally { setUndoingId(null); }
  };

  const handleDelete = async (id, orderId) => {
    if (!window.confirm(t('orders.confirmDeleteOrder', { id: orderId || id }))) return;
    setDeletingId(id);
    try { await deleteOrderRecord(id); setRecords(prev => prev.filter(r => r.id !== id && r.order_id !== id)); }
    catch (err) { alert(t('orders.deleteFailed') + (err.response?.data?.error || err.message)); }
    finally { setDeletingId(null); }
  };

  const S = { accent: 'var(--color-accent)', brown: 'var(--color-brown-dark)', border: 'var(--color-border-light)', muted: 'var(--color-text-muted)', surface: 'var(--color-surface-muted)', text: 'var(--color-text-primary)', secondary: 'var(--color-text-secondary)' };

  return (
    <Layout title={t('nav.orders')}>
      <div className="space-y-6 pb-10 animate-fade-in">
        {/* Top Header & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 backdrop-blur-md p-5 rounded-3xl border border-amber-900/10 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0" style={{ background: S.brown, boxShadow: '0 4px 14px rgba(61,35,20,0.2)' }}>
              <Package className="w-6 h-6 text-amber-100" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight font-serif" style={{ color: S.brown }}>
                {t('orders.title')} <span className="font-normal text-amber-800">{t('orders.titleHighlight')}</span>
              </h1>
              <p className="text-xs font-medium text-slate-500 mt-0.5">{t('orders.subtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 sm:w-80">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="search-order-id"
                  type="text"
                  placeholder={t('orders.searchPlaceholder')}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full rounded-2xl pl-9 pr-4 py-2.5 text-xs font-medium bg-white border border-amber-900/15 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-900/20 shadow-xs transition-all"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 text-xs font-bold rounded-2xl bg-white border border-amber-900/15 text-slate-700 hover:bg-slate-50 shadow-xs transition-all cursor-pointer"
              >
                {t('common.search')}
              </button>
            </form>
            <button
              onClick={loadRecords}
              disabled={loading}
              className="p-2.5 rounded-2xl bg-white border border-amber-900/15 text-slate-700 hover:bg-slate-50 shadow-xs transition-all disabled:opacity-50 shrink-0 cursor-pointer"
              title={t('common.refresh')}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Orders Table Section */}
        <div className="ui-card rounded-3xl overflow-hidden border border-amber-900/10 shadow-sm bg-white/80 backdrop-blur-md">
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <RefreshCw className="w-7 h-7 animate-spin mx-auto text-amber-900/60" />
              <p className="text-xs font-mono font-semibold text-slate-500">{t('orders.loadingOrders')}</p>
            </div>
          ) : records.length === 0 ? (
            <div className="py-20 text-center space-y-3 bg-amber-50/20">
              <Inbox className="w-12 h-12 mx-auto text-slate-300" />
              <h4 className="font-bold text-base text-slate-800">{t('orders.noOrdersFound')}</h4>
              <p className="text-xs max-w-sm mx-auto font-medium text-slate-500">
                {searchQuery ? t('orders.noOrdersMatch', { query: searchQuery }) : t('orders.noOrdersHint')}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[750px]" id="orders-table">
                <thead>
                  <tr className="bg-amber-900/[0.04] border-b border-amber-900/10 text-slate-600 font-extrabold text-[11px] uppercase tracking-wider">
                    <th className="py-4 px-5">{t('fields.orderId')}</th>
                    <th className="py-4 px-5">{t('fields.customerName')}</th>
                    <th className="py-4 px-5">{t('fields.skuId')}</th>
                    <th className="py-4 px-5">{t('fields.productName')}</th>
                    <th className="py-4 px-5 text-center">{t('fields.quantity')}</th>
                    <th className="py-4 px-5 text-center">{t('orders.returnStatus')}</th>
                    <th className="py-4 px-5 text-center">{t('common.action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-900/[0.06]">
                  {records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-amber-900/[0.02] transition-colors duration-150">
                      {/* Order ID Badge */}
                      <td className="py-4 px-5">
                        <span className="inline-block font-mono text-xs font-bold text-slate-900 bg-amber-900/[0.05] px-2.5 py-1 rounded-xl border border-amber-900/10 select-all">
                          {rec.order_id || '-'}
                        </span>
                      </td>

                      {/* Customer Name */}
                      <td className="py-4 px-5">
                        <span className="text-xs font-bold text-slate-900">
                          {rec.customer_name ? <AutoTranslate text={rec.customer_name} /> : '-'}
                        </span>
                      </td>

                      {/* SKU ID Badge */}
                      <td className="py-4 px-5">
                        <span className="inline-block font-mono text-xs font-bold text-amber-900/70 bg-amber-900/[0.03] px-2 py-0.5 rounded-lg border border-amber-900/10">
                          {rec.sku_id || '-'}
                        </span>
                      </td>

                      {/* Product Name */}
                      <td className="py-4 px-5">
                        <span className="text-xs font-medium text-slate-700">
                          {rec.product_name ? <AutoTranslate text={rec.product_name} /> : '-'}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="py-4 px-5 text-center">
                        <span className="font-mono text-xs font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {rec.quantity || 1}
                        </span>
                      </td>

                      {/* Return Status Pill / Button */}
                      <td className="py-4 px-5 text-center">
                        {rec.is_returned ? (
                          <button
                            onClick={() => handleOpenUndoModal(rec)}
                            disabled={undoingId === rec.id}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                          >
                            <RotateCcw className={`w-3.5 h-3.5 ${undoingId === rec.id ? 'animate-spin' : ''}`} />
                            {undoingId === rec.id ? t('orders.undoing') : t('orders.returned')}
                          </button>
                        ) : (
                          <button
                            onClick={() => setReturnModalOrder(rec)}
                            disabled={returningId === rec.id}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200/80 hover:bg-amber-100 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                          >
                            <RotateCcw className={`w-3.5 h-3.5 ${returningId === rec.id ? 'animate-spin' : ''}`} />
                            {returningId === rec.id ? t('orders.returning') : t('common.return')}
                          </button>
                        )}
                      </td>

                      {/* Action (Delete) */}
                      <td className="py-4 px-5 text-center">
                        <button
                          onClick={() => handleDelete(rec.id, rec.order_id)}
                          disabled={deletingId === rec.id}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer disabled:opacity-50"
                          title={t('common.delete')}
                        >
                          <Trash2 className={`w-4 h-4 ${deletingId === rec.id ? 'animate-spin' : ''}`} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && records.length > 0 && (
            <div className="px-6 py-4 flex items-center justify-between bg-amber-900/[0.02] border-t border-amber-900/10">
              <span className="text-xs font-semibold text-slate-500">{t('orders.showingCount', { count: records.length })}</span>
              <button onClick={loadRecords} className="text-xs font-bold flex items-center gap-1.5 text-amber-900 hover:text-amber-700 transition-colors cursor-pointer">
                <RefreshCw className="w-3.5 h-3.5" /> {t('common.refresh')}
              </button>
            </div>
          )}
        </div>

        {/* Return Type Modal */}
        {returnModalOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(45,24,16,0.5)', backdropFilter: 'blur(4px)' }}>
            <div className="max-w-md w-full p-6 space-y-5 rounded-3xl shadow-2xl" style={{ background: 'var(--color-surface)', border: `1px solid ${S.border}` }}>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'var(--color-warning-light)', border: '1px solid var(--color-warning-border)', color: 'var(--color-warning)' }}><RotateCcw className="w-5 h-5" /></div>
                <div><h3 className="text-base font-bold" style={{ color: S.brown }}>{t('orders.selectReturnType')}</h3><p className="text-xs font-medium mt-1" style={{ color: S.muted }}>{t('orders.chooseCategoryForOrder')} <span className="font-mono font-bold" style={{ color: S.text }}>#{returnModalOrder.order_id}</span></p></div>
              </div>
              <div className="rounded-2xl p-3.5 space-y-1.5 text-xs font-medium" style={{ background: S.surface, border: `1px solid ${S.border}`, color: S.secondary }}>
                <div className="flex justify-between"><span>{t('fields.skuId')}:</span><span className="font-mono font-bold" style={{ color: S.brown }}>{returnModalOrder.sku_id}</span></div>
                <div className="flex justify-between"><span>{t('fields.customer')}:</span><span className="font-bold" style={{ color: S.text }}>{returnModalOrder.customer_name || '-'}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button onClick={() => executeReturn(returnModalOrder, 'CUSTOMER_RETURN')} className="flex flex-col items-center justify-center p-4 rounded-2xl transition-all group cursor-pointer"
                  style={{ border: '2px solid var(--color-warning-border)', background: 'var(--color-warning-light)', color: 'var(--color-warning)' }}>
                  <RotateCcw className="w-6 h-6 mb-1.5 group-hover:scale-110 transition-transform" /><span className="text-xs font-bold">{t('orders.customerReturn')}</span><span className="text-[10px] font-medium text-center mt-0.5">{t('orders.deliveryChargeApplies')}</span>
                </button>
                <button onClick={() => executeReturn(returnModalOrder, 'RTO_RETURN')} className="flex flex-col items-center justify-center p-4 rounded-2xl transition-all group cursor-pointer"
                  style={{ border: '2px solid var(--color-border)', background: S.surface, color: S.brown }}>
                  <Package className="w-6 h-6 mb-1.5 group-hover:scale-110 transition-transform" style={{ color: S.accent }} /><span className="text-xs font-bold">{t('orders.rtoReturn')}</span><span className="text-[10px] font-medium text-center mt-0.5" style={{ color: S.muted }}>{t('orders.returnToOriginZeroLoss')}</span>
                </button>
              </div>
              <div className="flex justify-end pt-2" style={{ borderTop: `1px solid ${S.border}` }}><button onClick={() => setReturnModalOrder(null)} className="px-4 py-1.5 text-xs font-bold transition-colors cursor-pointer" style={{ color: S.muted }}>{t('common.cancel')}</button></div>
            </div>
          </div>
        )}

        {/* Undo Modal */}
        {confirmUndoOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(45,24,16,0.5)', backdropFilter: 'blur(4px)' }}>
            <div className="max-w-md w-full p-6 space-y-5 rounded-3xl shadow-2xl" style={{ background: 'var(--color-surface)', border: `1px solid ${S.border}` }}>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'var(--color-warning-light)', border: '1px solid var(--color-warning-border)', color: 'var(--color-warning)' }}><AlertTriangle className="w-5 h-5" /></div>
                <div className="space-y-1"><h3 className="text-lg font-bold" style={{ color: S.brown }}>{t('orders.undoReturnTitle')}</h3><p className="text-xs leading-relaxed font-medium" style={{ color: S.secondary }}>{t('orders.undoReturnConfirmMessage')}</p>
                  {confirmUndoOrder.order_id && <div className="pt-1 text-[11px] font-mono font-semibold" style={{ color: S.accent }}>{t('fields.orderId')}: {confirmUndoOrder.order_id}</div>}
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2" style={{ borderTop: `1px solid ${S.border}` }}>
                <button onClick={() => setConfirmUndoOrder(null)} className="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer" style={{ background: S.surface, color: S.secondary }}>{t('common.cancel')}</button>
                <button onClick={handleConfirmUndoReturn} className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  style={{ background: 'var(--color-danger)', boxShadow: '0 4px 12px rgba(198,40,40,0.2)' }}><RotateCcw className="w-3.5 h-3.5" /> {t('orders.undoReturn')}</button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5" style={{ background: 'var(--color-brown-dark)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="w-5 h-5 rounded-full text-white flex items-center justify-center text-xs font-bold" style={{ background: 'var(--color-success)' }}>✓</div>
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </Layout>
  );
}
