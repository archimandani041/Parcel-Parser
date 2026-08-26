import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import AutoTranslate from '../components/AutoTranslate';
import { getStockOverview, updateStockProductPrice, deleteStockProduct } from '../services/api';
import { Boxes, Package, Search, RefreshCw, Save, Check, TrendingUp, Coins, Inbox, Trash2 } from 'lucide-react';

export default function Stock() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [stockSummary, setStockSummary] = useState({ total_products: 0, total_quantity: 0, total_available_quantity: 0, total_returned_quantity: 0, total_inventory_cost: 0, total_inventory_value: 0, total_realized_sales_profit: 0, total_return_loss: 0, total_net_profit: 0 });
  const [editPriceState, setEditPriceState] = useState({});

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
  const filteredProducts = products.filter(p => { if (!searchQuery.trim()) return true; const q = searchQuery.toLowerCase().trim(); return (p.sku_id?.toLowerCase().includes(q)) || (p.product_name?.toLowerCase().includes(q)); });

  const S = { accent: 'var(--color-accent)', brown: 'var(--color-brown-dark)', border: 'var(--color-border-light)', muted: 'var(--color-text-muted)', surface: 'var(--color-surface-muted)', text: 'var(--color-text-primary)', secondary: 'var(--color-text-secondary)' };

  return (
    <Layout title={t('nav.stock')}>
      <div className="space-y-6 w-full pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl" style={{ background: 'var(--color-surface)', border: `1px solid ${S.border}`, boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm shrink-0" style={{ background: 'var(--color-accent-light)', border: '1px solid var(--color-accent-muted)', color: S.accent }}><Boxes className="w-5 h-5" /></div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight font-serif" style={{ color: S.brown }}>{t('stock.title')} <span className="font-normal" style={{ color: S.accent }}>{t('stock.titleHighlight')}</span></h1>
              <p className="text-xs font-medium mt-0.5" style={{ color: S.muted }}>{t('stock.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto">
            <div className="relative flex-1 min-w-[180px] sm:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
              <input id="search-sku" type="text" placeholder={t('stock.searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl pl-9 pr-4 py-2 text-xs transition-all font-medium" style={{ background: S.surface, border: `1px solid ${S.border}`, color: S.text }} />
            </div>
            <button onClick={loadStockData} disabled={loading} className="p-2 rounded-xl transition-all disabled:opacity-50 shrink-0 cursor-pointer" style={{ background: S.surface, border: `1px solid ${S.border}`, color: S.secondary }}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          {[
            { label: t('stock.totalAddedQty'), value: stockSummary.total_quantity || 0, icon: Package, hint: t('stock.initialStockLogged'), color: S.accent },
            { label: t('fields.sellingQ'), value: stockSummary.total_available_quantity != null ? stockSummary.total_available_quantity : stockSummary.total_available_stock || 0, icon: Boxes, hint: t('stock.physicalStockInHand'), color: 'var(--color-success)' },
            { label: t('stock.custReturnedQty'), value: stockSummary.total_customer_returned_quantity != null ? stockSummary.total_customer_returned_quantity : 0, icon: Inbox, hint: t('stock.customerReturnUnits'), color: 'var(--color-warning)' },
            { label: t('stock.rtoReturnedQty'), value: stockSummary.total_rto_returned_quantity || 0, icon: Inbox, hint: t('stock.rtoReturnUnits'), color: 'var(--color-info)' },
            { label: t('stock.inventoryCost'), value: formatCurrency(stockSummary.total_inventory_cost != null ? stockSummary.total_inventory_cost : stockSummary.total_purchase_cost), icon: Coins, hint: t('stock.purchaseCostAvailable'), color: S.brown }
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={i} className="ui-card p-4 space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold" style={{ color: S.muted }}><span>{card.label}</span><Icon className="w-4 h-4" style={{ color: card.color }} /></div>
                <p className="text-2xl font-bold font-mono" style={{ color: card.color }}>{card.value}</p>
                <p className="text-[10px] font-medium" style={{ color: S.muted }}>{card.hint}</p>
              </div>
            );
          })}
        </div>

        {/* Table */}
        <div className="ui-card overflow-hidden rounded-3xl" style={{ boxShadow: 'var(--shadow-lg)', border: `1px solid ${S.border}` }}>
          {loading ? (
            <div className="py-20 text-center space-y-3"><RefreshCw className="w-6 h-6 animate-spin mx-auto" style={{ color: S.accent }} /><p className="text-xs font-mono font-medium" style={{ color: S.muted }}>{t('stock.loadingStock')}</p></div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center space-y-3" style={{ background: S.surface }}><Inbox className="w-12 h-12 mx-auto" style={{ color: 'var(--color-border-strong)' }} /><h4 className="font-semibold text-base" style={{ color: S.text }}>{t('stock.noProductsFound')}</h4>
              <p className="text-xs max-w-sm mx-auto font-medium" style={{ color: S.muted }}>{searchQuery ? t('stock.noProductsMatch', { query: searchQuery }) : t('stock.noProductsHint')}</p></div>
          ) : (
            <div className="overflow-x-auto" style={{ background: 'var(--color-surface)' }}>
              <table className="w-full text-left border-collapse text-xs min-w-[1250px]" id="stock-table">
                <thead><tr style={{ background: S.surface, borderBottom: `1px solid ${S.border}`, color: S.muted }} className="uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-4 px-3">{t('fields.skuId')}</th><th className="py-4 px-3">{t('fields.productName')}</th><th className="py-4 px-2 text-center">{t('stock.totalQty')}</th>
                  <th className="py-4 px-2 text-center">{t('stock.soldQty')}</th><th className="py-4 px-2 text-center">{t('stock.custReturn')}</th><th className="py-4 px-2 text-center">{t('stock.rtoReturn')}</th>
                  <th className="py-4 px-2 text-center">{t('stock.currentStock')}</th><th className="py-4 px-2 text-center">{t('fields.purchasePrice')}</th><th className="py-4 px-2 text-center">{t('fields.sellingPrice')}</th>
                  <th className="py-4 px-3 text-right">{t('stock.inventoryCost')}</th><th className="py-4 px-3 text-right">{t('stock.inventoryValue')}</th><th className="py-4 px-3 text-right">{t('stock.realizedProfit')}</th>
                  <th className="py-4 px-3 text-right">{t('stock.returnLoss')}</th><th className="py-4 px-3 text-right">{t('stock.netProfit')}</th><th className="py-4 px-3 text-center">{t('common.action')}</th>
                </tr></thead>
                <tbody className="divide-y" style={{ borderColor: S.border }}>
                  {filteredProducts.map((p) => {
                    const es = editPriceState[p.sku_id] || { purchase_price: p.purchase_price != null ? p.purchase_price : '', selling_price: p.selling_price != null ? p.selling_price : '', saving: false, saved: false };
                    const rawNet = p.net_profit != null ? p.net_profit : p.profit;
                    const soldQty = p.successfully_sold_quantity != null ? p.successfully_sold_quantity : (p.realized_sales_quantity || 0);
                    return (
                      <tr key={p.sku_id} className="transition-colors">
                        <td className="py-3.5 px-3"><span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: S.accent, background: 'var(--color-accent-light)', border: '1px solid var(--color-accent-muted)' }}>{p.sku_id}</span></td>
                        <td className="py-3.5 px-3"><span className="text-xs font-semibold line-clamp-2" style={{ color: S.text }}>{p.product_name ? <AutoTranslate text={p.product_name} /> : '-'}</span></td>
                        <td className="py-3.5 px-2 text-center"><span className="font-mono text-xs font-semibold" style={{ color: S.text }}>{p.total_quantity}</span></td>
                        <td className="py-3.5 px-2 text-center"><span className="font-mono text-xs font-semibold" style={{ color: 'var(--color-info)' }}>{soldQty}</span></td>
                        <td className="py-3.5 px-2 text-center"><span className="font-mono text-xs font-semibold" style={{ color: 'var(--color-warning)' }}>{p.customer_returned_quantity || 0}</span></td>
                        <td className="py-3.5 px-2 text-center"><span className="font-mono text-xs font-semibold" style={{ color: 'var(--color-info)' }}>{p.rto_returned_quantity || 0}</span></td>
                        <td className="py-3.5 px-2 text-center"><span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: 'var(--color-success)', background: 'var(--color-success-light)', border: '1px solid var(--color-success-border)' }}>{p.available_quantity != null ? p.available_quantity : p.current_available_stock}</span></td>
                        <td className="py-2 px-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-xs font-mono" style={{ color: S.muted }}>₹</span>
                            <input type="number" step="any" placeholder="0" value={es.purchase_price} onChange={(e) => setEditPriceState(prev => ({ ...prev, [p.sku_id]: { ...prev[p.sku_id], purchase_price: e.target.value } }))}
                              className="w-16 rounded-lg px-1.5 py-1 text-xs text-right font-mono outline-none transition-all font-semibold" style={{ background: S.surface, border: `1px solid ${S.border}`, color: S.text }} />
                          </div>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-xs font-mono" style={{ color: S.muted }}>₹</span>
                            <input type="number" step="any" placeholder="0" value={es.selling_price} onChange={(e) => setEditPriceState(prev => ({ ...prev, [p.sku_id]: { ...prev[p.sku_id], selling_price: e.target.value } }))}
                              className="w-16 rounded-lg px-1.5 py-1 text-xs text-right font-mono outline-none transition-all font-semibold" style={{ background: S.surface, border: `1px solid ${S.border}`, color: S.text }} />
                            <button onClick={() => handleSavePrice(p.sku_id, p.product_name)} disabled={es.saving}
                              className="p-1 rounded-full transition-all cursor-pointer disabled:opacity-50"
                              style={es.saved ? { background: 'var(--color-success-light)', color: 'var(--color-success)', border: '1px solid var(--color-success-border)' } : { background: 'var(--color-accent-light)', color: S.accent, border: '1px solid var(--color-accent-muted)' }}>
                              {es.saved ? <Check className="w-3 h-3" /> : es.saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-right"><span className="font-mono text-xs font-semibold" style={{ color: 'var(--color-warning)' }}>{formatCurrency(p.inventory_cost != null ? p.inventory_cost : p.product_cost)}</span></td>
                        <td className="py-3.5 px-3 text-right"><span className="font-mono text-xs font-semibold" style={{ color: 'var(--color-success)' }}>{formatCurrency(p.inventory_value != null ? p.inventory_value : p.selling_value)}</span></td>
                        <td className="py-3.5 px-3 text-right"><span className="font-mono text-xs font-semibold" style={{ color: p.realized_sales_profit == null ? S.muted : p.realized_sales_profit >= 0 ? 'var(--color-info)' : 'var(--color-danger)' }}>{formatCurrency(p.realized_sales_profit)}</span></td>
                        <td className="py-3.5 px-3 text-right"><span className="font-mono text-xs font-semibold" style={{ color: (p.return_loss > 0 || p.customer_return_loss > 0) ? 'var(--color-danger)' : S.muted }}>{formatCurrency(p.customer_return_loss || p.return_loss)}</span></td>
                        <td className="py-3.5 px-3 text-right">
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={rawNet == null ? { color: S.muted } : rawNet >= 0 ? { color: 'var(--color-success)', background: 'var(--color-success-light)', border: '1px solid var(--color-success-border)' } : { color: 'var(--color-danger)', background: 'var(--color-danger-light)', border: '1px solid var(--color-danger-border)' }}>
                            {formatCurrency(rawNet)}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center"><button onClick={() => handleDeleteStockProduct(p.sku_id)} className="p-1 rounded-full transition-all cursor-pointer" style={{ color: S.muted }}><Trash2 className="w-3.5 h-3.5" /></button></td>
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
