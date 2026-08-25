import React from 'react';
import AutoTranslate from './AutoTranslate';
import {
  ShoppingBag,
  UserCheck,
  Layers,
  Edit3,
  AlertCircle,
  PackageCheck,
  AlertTriangle,
  XCircle
} from 'lucide-react';

export default function ExtractionFields({
  structuredJson,
  warnings = [],
  onEditField,
  selectedLabelIdx: externalSelectedIdx = 0,
  onSelectLabel
}) {
  const [internalSelectedIdx, setInternalSelectedIdx] = React.useState(0);
  const selectedLabelIdx = onSelectLabel ? externalSelectedIdx : internalSelectedIdx;

  const handleTabClick = (idx) => {
    if (onSelectLabel) {
      onSelectLabel(idx);
    } else {
      setInternalSelectedIdx(idx);
    }
  };

  if (!structuredJson) {
    return (
      <div className="p-12 text-center text-slate-500 font-mono text-xs">
        No structured extraction data available for this document.
      </div>
    );
  }

  // Handle invalid document rejection
  if (structuredJson.is_valid_document === false) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center">
          <XCircle className="w-8 h-8 text-rose-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Invalid Document</h3>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          {structuredJson.rejection_reason || 'This file does not contain any recognizable order, invoice, or shipping label information.'}
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-200 rounded-full text-xs font-bold text-rose-700">
          <AlertTriangle className="w-3.5 h-3.5" />
          No data was extracted — please upload a valid order document
        </div>
      </div>
    );
  }

  const hasMultipleLabels = Array.isArray(structuredJson.labels) && structuredJson.labels.length > 1;
  const currentData = (Array.isArray(structuredJson.labels) && structuredJson.labels[selectedLabelIdx])
    ? structuredJson.labels[selectedLabelIdx]
    : (Array.isArray(structuredJson.labels) && structuredJson.labels[0])
      ? structuredJson.labels[0]
      : structuredJson;

  // Support both new simplified schema and old nested schema
  const orderId = currentData.order_id || currentData.order?.order_id || null;
  const customerName = currentData.customer_name || currentData.customer?.name || null;
  const items = Array.isArray(currentData.items) ? currentData.items : [];

  const renderField = (fieldName, value, label) => {
    const isNull = value === null || value === undefined || value === '';
    const strVal = isNull ? 'null' : String(value);
    
    return (
      <div
        key={fieldName}
        className="flex items-center justify-between py-2.5 px-3.5 rounded-xl border border-purple-100/60 hover:border-purple-300 hover:bg-purple-50/50 text-xs group transition-all"
      >
        <div className="flex flex-col pr-2 min-w-0 flex-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
          <span className={`font-mono text-xs break-words mt-0.5 ${isNull ? 'text-slate-400 italic' : 'text-slate-800 font-semibold'}`}>
            {isNull ? 'null' : <AutoTranslate text={strVal} />}
          </span>
        </div>
        {onEditField && (
          <button
            onClick={() => onEditField(fieldName, isNull ? '' : String(value))}
            title={`Edit ${label}`}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-purple-600 hover:text-purple-900 hover:bg-purple-100/80 rounded-lg transition-all shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  };

  const Section = ({ icon, title, color, children, wide = false }) => (
    <div className={`ui-card border border-purple-100 rounded-3xl p-5 shadow-lg space-y-3 ${wide ? 'md:col-span-2' : ''}`}>
      <div className="flex items-center justify-between border-b border-purple-100/80 pb-3">
        <div className="flex items-center gap-2 font-extrabold text-slate-900 text-xs uppercase tracking-wider">
          <span className={`p-1.5 rounded-xl bg-purple-50 border border-purple-100 ${color}`}>{icon}</span>
          {title}
        </div>
      </div>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 font-sans">

      {/* Validation Warnings Alert */}
      {warnings && warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-950 text-sm mb-1">Validation Warnings ({warnings.length})</h4>
            <ul className="list-disc list-inside space-y-0.5 font-mono text-[11px] opacity-90">
              {warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Multi-Label Batch Selector Bar */}
      {hasMultipleLabels && (
        <div className="ui-card border border-purple-100 rounded-3xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3 text-xs font-extrabold text-slate-900">
            <span className="p-2 rounded-xl bg-purple-100 border border-purple-200 text-purple-700">
              <Layers className="w-4 h-4" />
            </span>
            <div>
              <span className="text-slate-900 font-extrabold text-sm block">Multi-Label Document ({structuredJson.labels.length} Orders)</span>
              <span className="text-[11px] text-slate-500 font-mono">Select a label to view its extracted data</span>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0">
            {structuredJson.labels.map((lbl, idx) => {
              const labelId = lbl.order_id || lbl.order?.order_id || `Label #${idx + 1}`;
              const isSelected = selectedLabelIdx === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleTabClick(idx)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold font-mono transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-md border border-purple-500'
                      : 'bg-purple-50 text-slate-600 hover:text-purple-900 hover:bg-purple-100 border border-purple-200/80'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                  <span>Label #{idx + 1}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${isSelected ? 'bg-purple-700 text-white' : 'bg-white text-purple-700 border border-purple-200'}`}>
                    {labelId.length > 14 ? `${labelId.slice(0, 12)}...` : labelId}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid of Sections — FOCUSED: Only Order ID, Customer Name, and Product Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* ── Order & Customer Info ── */}
        <Section icon={<ShoppingBag className="w-4 h-4" />} title="Order Information" color="text-purple-600">
          {renderField('order_id', orderId, 'Order ID')}
        </Section>

        <Section icon={<UserCheck className="w-4 h-4" />} title="Customer / Recipient" color="text-emerald-600">
          {renderField('customer_name', customerName, 'Customer Name')}
        </Section>

        {/* ── Product Line Items Table (full width) ── */}
        <div className="ui-card border border-purple-100 rounded-3xl p-5 shadow-lg md:col-span-2 space-y-3">
          <div className="flex items-center justify-between border-b border-purple-100/80 pb-3">
            <div className="flex items-center gap-2 font-extrabold text-slate-900 text-xs uppercase tracking-wider">
              <span className="p-1.5 rounded-xl bg-purple-50 border border-purple-100 text-purple-600">
                <PackageCheck className="w-4 h-4" />
              </span>
              Product Items ({items.length})
            </div>
          </div>

          {items.length === 0 ? (
            <p className="text-xs text-slate-400 font-mono italic py-4 text-center">No product items extracted from this document.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-purple-100 bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-purple-50/50 border-b border-purple-100 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
                    <th className="py-2.5 px-3">SKU ID</th>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3 text-right">Purchase Price</th>
                    <th className="py-2.5 px-3 text-right">Selling Price</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-purple-50/30 transition-colors">
                      <td className="py-3 px-3 font-bold text-purple-700">{item.sku_id || <span className="text-slate-400 italic">—</span>}</td>
                      <td className="py-3 px-3 text-slate-800 font-semibold">{item.product_name ? <AutoTranslate text={item.product_name} /> : <span className="text-slate-400 italic">—</span>}</td>
                      <td className="py-3 px-3 text-right text-slate-700">
                        {item.purchase_price !== null && item.purchase_price !== undefined ? `₹${item.purchase_price}` : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-700">
                        {item.selling_price !== null && item.selling_price !== undefined ? `₹${item.selling_price}` : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-emerald-700">
                        {item.quantity !== null && item.quantity !== undefined ? item.quantity : <span className="text-slate-400">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
