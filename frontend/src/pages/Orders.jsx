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

  const S = { accent: 'var(--color-rose)', navy: 'var(--color-navy)', border: 'var(--color-border-light)', muted: 'var(--color-text-muted)', surface: 'var(--color-surface-muted)', text: 'var(--color-text-primary)', secondary: 'var(--color-text-secondary)' };

  return (
    <Layout title={t('nav.orders')}>
      <div className="space-y-6 pb-10 animate-fade-in">
        {/* Top Header & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-sm)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md shrink-0" style={{ background: 'linear-gradient(135deg, var(--color-navy), var(--color-deep-purple))', boxShadow: '0 4px 14px rgba(29,26,57,0.2)' }}>
              <Package className="w-6 h-6" style={{ color: 'var(--color-blush-light)' }} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight font-serif" style={{ color: S.navy }}>
                {t('orders.title')} <span className="font-normal" style={{ color: 'var(--color-rose)' }}>{t('orders.titleHighlight')}</span>
              </h1>
              <p className="text-xs font-medium mt-0.5" style={{ color: S.muted }}>{t('orders.subtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 sm:w-80">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
                <input
                  id="search-order-id"
                  type="text"
                  placeholder={t('orders.searchPlaceholder')}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full rounded-2xl pl-9 pr-4 py-2.5 text-xs font-medium transition-all"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', color: S.text }}
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 text-xs font-bold rounded-2xl transition-all cursor-pointer"
                style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border-light)', color: S.secondary }}
              >
                {t('common.search')}
              </button>
            </form>
            <button
              onClick={loadRecords}
              disabled={loading}
              className="p-2.5 rounded-2xl transition-all disabled:opacity-50 shrink-0 cursor-pointer"
              style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border-light)', color: S.secondary }}
              title={t('common.refresh')}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Orders Table Section */}
        <div className="ui-card rounded-3xl overflow-hidden" style={{ border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-lg)' }}>
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <RefreshCw className="w-7 h-7 animate-spin mx-auto" style={{ color: 'var(--color-rose)' }} />
              <p className="text-xs font-mono font-semibold" style={{ color: S.muted }}>{t('orders.loadingOrders')}</p>
            </div>
          ) : records.length === 0 ? (
            <div className="py-20 text-center space-y-3" style={{ background: 'var(--color-surface-muted)' }}>
              <Inbox className="w-12 h-12 mx-auto" style={{ color: 'var(--color-border-strong)' }} />
              <h4 className="font-bold text-base" style={{ color: S.text }}>{t('orders.noOrdersFound')}</h4>
              <p className="text-xs max-w-sm mx-auto font-medium" style={{ color: S.muted }}>
                {searchQuery ? t('orders.noOrdersMatch', { query: searchQuery }) : t('orders.noOrdersHint')}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[750px]" id="orders-table">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider font-extrabold" style={{ background: 'var(--color-surface-muted)', borderBottom: '1px solid var(--color-border-light)', color: S.muted }}>
                    <th className="py-4 px-5">{t('fields.orderId')}</th>
                    <th className="py-4 px-5">{t('fields.customerName')}</th>
                    <th className="py-4 px-5">{t('fields.skuId')}</th>
                    <th className="py-4 px-5">{t('fields.productName')}</th>
                    <th className="py-4 px-5 text-center">{t('fields.quantity')}</th>
                    <th className="py-4 px-5 text-center">{t('orders.returnStatus')}</th>
                    <th className="py-4 px-5 text-center">{t('common.action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--color-border-light)' }}>
                  {records.map((rec) => (
                    <tr key={rec.id} className="table-row-hover transition-colors duration-150">
                      {/* Order ID Badge */}
                      <td className="py-4 px-5">
                        <span className="inline-block font-mono text-xs font-bold px-2.5 py-1 rounded-xl select-all"
                          style={{ color: S.navy, background: 'var(--color-surface-muted)', border: '1px solid var(--color-border-light)' }}>
                          {rec.order_id || '-'}
                        </span>
                      </td>

                      {/* Customer Name */}
                      <td className="py-4 px-5">
                        <span className="text-xs font-bold" style={{ color: S.text }}>
                          {rec.customer_name ? <AutoTranslate text={rec.customer_name} /> : '-'}
                        </span>
                      </td>

                      {/* SKU ID Badge */}
                      <td className="py-4 px-5">
                        <span className="inline-block font-mono text-xs font-bold px-2 py-0.5 rounded-lg"
                          style={{ color: 'var(--color-plum)', background: 'rgba(102,37,73,0.06)', border: '1px solid rgba(102,37,73,0.15)' }}>
                          {rec.sku_id || '-'}
                        </span>
                      </td>

                      {/* Product Name */}
                      <td className="py-4 px-5">
                        <span className="text-xs font-medium" style={{ color: S.secondary }}>
                          {rec.product_name ? <AutoTranslate text={rec.product_name} /> : '-'}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="py-4 px-5 text-center">
                        <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg"
                          style={{ color: S.navy, background: 'var(--color-surface-muted)' }}>
                          {rec.quantity || 1}
                        </span>
                      </td>

                      {/* Return Status Pill / Button */}
                      <td className="py-4 px-5 text-center">
                        {rec.is_returned ? (
                          <button
                            onClick={() => handleOpenUndoModal(rec)}
                            disabled={undoingId === rec.id}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50 shadow-2xs icon-hover-rotate"
                            style={{ background: 'var(--color-danger-light)', color: 'var(--color-rose)', border: '1px solid var(--color-danger-border)' }}
                          >
                            <RotateCcw className={`w-3.5 h-3.5 ${undoingId === rec.id ? 'animate-spin' : ''}`} />
                            {undoingId === rec.id ? t('orders.undoing') : t('orders.returned')}
                          </button>
                        ) : (
                          <button
                            onClick={() => setReturnModalOrder(rec)}
                            disabled={returningId === rec.id}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50 shadow-2xs icon-hover-rotate"
                            style={{ background: 'var(--color-amber-muted)', color: 'var(--color-navy)', border: '1px solid var(--color-warning-border)' }}
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
                          className="p-2 rounded-xl transition-all cursor-pointer disabled:opacity-50 icon-hover-shake"
                          style={{ color: S.muted }}
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
            <div className="px-6 py-4 flex items-center justify-between" style={{ background: 'var(--color-surface-muted)', borderTop: '1px solid var(--color-border-light)' }}>
              <span className="text-xs font-semibold" style={{ color: S.muted }}>{t('orders.showingCount', { count: records.length })}</span>
              <button onClick={loadRecords} className="text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer" style={{ color: 'var(--color-rose)' }}>
                <RefreshCw className="w-3.5 h-3.5" /> {t('common.refresh')}
              </button>
            </div>
          )}
        </div>

        {/* Return Type Modal */}
        {returnModalOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(29,26,57,0.5)', backdropFilter: 'blur(4px)' }}>
            <div className="max-w-md w-full p-6 space-y-5 rounded-3xl shadow-2xl" style={{ background: 'var(--color-surface)', border: `1px solid ${S.border}` }}>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'var(--color-amber-muted)', border: '1px solid var(--color-warning-border)', color: 'var(--color-amber)' }}><RotateCcw className="w-5 h-5" /></div>
                <div><h3 className="text-base font-bold" style={{ color: S.navy }}>{t('orders.selectReturnType')}</h3><p className="text-xs font-medium mt-1" style={{ color: S.muted }}>{t('orders.chooseCategoryForOrder')} <span className="font-mono font-bold" style={{ color: S.text }}>#{returnModalOrder.order_id}</span></p></div>
              </div>
              <div className="rounded-2xl p-3.5 space-y-1.5 text-xs font-medium" style={{ background: S.surface, border: `1px solid ${S.border}`, color: S.secondary }}>
                <div className="flex justify-between"><span>{t('fields.skuId')}:</span><span className="font-mono font-bold" style={{ color: S.navy }}>{returnModalOrder.sku_id}</span></div>
                <div className="flex justify-between"><span>{t('fields.customer')}:</span><span className="font-bold" style={{ color: S.text }}>{returnModalOrder.customer_name || '-'}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button onClick={() => executeReturn(returnModalOrder, 'CUSTOMER_RETURN')} className="flex flex-col items-center justify-center p-4 rounded-2xl transition-all group cursor-pointer"
                  style={{ border: '2px solid var(--color-warning-border)', background: 'var(--color-amber-muted)', color: 'var(--color-navy)' }}>
                  <RotateCcw className="w-6 h-6 mb-1.5 group-hover:scale-110 transition-transform" style={{ color: 'var(--color-amber)' }} /><span className="text-xs font-bold">{t('orders.customerReturn')}</span><span className="text-[10px] font-medium text-center mt-0.5" style={{ color: S.secondary }}>{t('orders.deliveryChargeApplies')}</span>
                </button>
                <button onClick={() => executeReturn(returnModalOrder, 'RTO_RETURN')} className="flex flex-col items-center justify-center p-4 rounded-2xl transition-all group cursor-pointer"
                  style={{ border: '2px solid var(--color-border)', background: S.surface, color: S.navy }}>
                  <Package className="w-6 h-6 mb-1.5 group-hover:scale-110 transition-transform" style={{ color: 'var(--color-rose)' }} /><span className="text-xs font-bold">{t('orders.rtoReturn')}</span><span className="text-[10px] font-medium text-center mt-0.5" style={{ color: S.muted }}>{t('orders.returnToOriginZeroLoss')}</span>
                </button>
              </div>
              <div className="flex justify-end pt-2" style={{ borderTop: `1px solid ${S.border}` }}><button onClick={() => setReturnModalOrder(null)} className="px-4 py-1.5 text-xs font-bold transition-colors cursor-pointer" style={{ color: S.muted }}>{t('common.cancel')}</button></div>
            </div>
          </div>
        )}

        {/* Undo Modal */}
        {confirmUndoOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(29,26,57,0.5)', backdropFilter: 'blur(4px)' }}>
            <div className="max-w-md w-full p-6 space-y-5 rounded-3xl shadow-2xl" style={{ background: 'var(--color-surface)', border: `1px solid ${S.border}` }}>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'var(--color-amber-muted)', border: '1px solid var(--color-warning-border)', color: 'var(--color-amber)' }}><AlertTriangle className="w-5 h-5" /></div>
                <div className="space-y-1"><h3 className="text-lg font-bold" style={{ color: S.navy }}>{t('orders.undoReturnTitle')}</h3><p className="text-xs leading-relaxed font-medium" style={{ color: S.secondary }}>{t('orders.undoReturnConfirmMessage')}</p>
                  {confirmUndoOrder.order_id && <div className="pt-1 text-[11px] font-mono font-semibold" style={{ color: S.accent }}>{t('fields.orderId')}: {confirmUndoOrder.order_id}</div>}
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2" style={{ borderTop: `1px solid ${S.border}` }}>
                <button onClick={() => setConfirmUndoOrder(null)} className="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer" style={{ background: S.surface, color: S.secondary }}>{t('common.cancel')}</button>
                <button onClick={handleConfirmUndoReturn} className="px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  style={{ background: 'linear-gradient(135deg, var(--color-rose), var(--color-plum))', color: 'var(--color-blush-light)', boxShadow: '0 4px 12px rgba(174,68,90,0.2)' }}><RotateCcw className="w-3.5 h-3.5" /> {t('orders.undoReturn')}</button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5" style={{ background: 'linear-gradient(135deg, var(--color-navy), var(--color-deep-purple))', color: 'var(--color-blush-light)', border: '1px solid rgba(232,188,185,0.1)' }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--color-amber)', color: 'var(--color-navy)' }}>✓</div>
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </Layout>
  );
}
