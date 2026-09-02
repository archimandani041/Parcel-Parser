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
      <div className="p-12 text-center font-mono text-xs" style={{ color: 'var(--color-text-muted)' }}>
        No structured extraction data available for this document.
      </div>
    );
  }

  // Handle invalid document rejection
  if (structuredJson.is_valid_document === false) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-danger-light)', border: '1px solid var(--color-danger-border)' }}>
          <XCircle className="w-8 h-8" style={{ color: 'var(--color-rose)' }} />
        </div>
        <h3 className="text-lg font-bold" style={{ color: 'var(--color-navy)' }}>Invalid Document</h3>
        <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
          {structuredJson.rejection_reason || 'This file does not contain any recognizable order, invoice, or shipping label information.'}
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold" style={{ background: 'var(--color-danger-light)', border: '1px solid var(--color-danger-border)', color: 'var(--color-rose)' }}>
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
        className="flex items-center justify-between py-2.5 px-3.5 rounded-xl border text-xs group transition-all"
        style={{ borderColor: 'var(--color-border-light)' }}
      >
        <div className="flex flex-col pr-2 min-w-0 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
          <span className={`font-mono text-xs break-words mt-0.5 ${isNull ? 'italic' : 'font-semibold'}`} style={{ color: isNull ? 'var(--color-text-muted)' : 'var(--color-text-primary)' }}>
            {isNull ? 'null' : <AutoTranslate text={strVal} />}
          </span>
        </div>
        {onEditField && (
          <button
            onClick={() => onEditField(fieldName, isNull ? '' : String(value))}
            title={`Edit ${label}`}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all shrink-0"
            style={{ color: 'var(--color-rose)' }}
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  };

  const Section = ({ icon, title, color, children, wide = false }) => (
    <div className={`ui-card rounded-3xl p-5 shadow-lg space-y-3 ${wide ? 'md:col-span-2' : ''}`} style={{ border: '1px solid var(--color-border-light)' }}>
      <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
        <div className="flex items-center gap-2 font-extrabold text-xs uppercase tracking-wider" style={{ color: 'var(--color-navy)' }}>
          <span className="p-1.5 rounded-xl" style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border-light)', color }}>{icon}</span>
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
        <div className="rounded-2xl p-4 text-xs flex items-start gap-3 shadow-sm" style={{ background: 'var(--color-amber-muted)', border: '1px solid var(--color-warning-border)', color: 'var(--color-navy)' }}>
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--color-amber)' }} />
          <div>
            <h4 className="font-bold text-sm mb-1" style={{ color: 'var(--color-navy)' }}>Validation Warnings ({warnings.length})</h4>
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
        <div className="ui-card rounded-3xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl" style={{ border: '1px solid var(--color-border-light)' }}>
          <div className="flex items-center gap-3 text-xs font-extrabold" style={{ color: 'var(--color-navy)' }}>
            <span className="p-2 rounded-xl" style={{ background: 'var(--color-accent-light)', border: '1px solid var(--color-accent-muted)', color: 'var(--color-rose)' }}>
              <Layers className="w-4 h-4" />
            </span>
            <div>
              <span className="font-extrabold text-sm block" style={{ color: 'var(--color-navy)' }}>Multi-Label Document ({structuredJson.labels.length} Orders)</span>
              <span className="text-[11px] font-mono" style={{ color: 'var(--color-text-muted)' }}>Select a label to view its extracted data</span>
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
                  className="px-3.5 py-2 rounded-2xl text-xs font-bold font-mono transition-all shrink-0 flex items-center gap-2 cursor-pointer"
                  style={isSelected ? {
                    background: 'linear-gradient(135deg, var(--color-navy), var(--color-deep-purple))', color: 'var(--color-blush-light)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-navy-light)'
                  } : {
                    background: 'var(--color-surface-muted)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-light)'
                  }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: isSelected ? 'var(--color-amber)' : 'var(--color-text-muted)' }} />
                  <span>Label #{idx + 1}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={isSelected ? { background: 'rgba(232,188,185,0.15)', color: 'var(--color-blush-light)' } : { background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', color: 'var(--color-plum)' }}>
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
        <Section icon={<ShoppingBag className="w-4 h-4" />} title="Order Information" color="var(--color-rose)">
          {renderField('order_id', orderId, 'Order ID')}
        </Section>

        <Section icon={<UserCheck className="w-4 h-4" />} title="Customer / Recipient" color="var(--color-deep-purple)">
          {renderField('customer_name', customerName, 'Customer Name')}
        </Section>

        {/* ── Product Line Items Table (full width) ── */}
        <div className="ui-card rounded-3xl p-5 shadow-lg md:col-span-2 space-y-3" style={{ border: '1px solid var(--color-border-light)' }}>
          <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
            <div className="flex items-center gap-2 font-extrabold text-xs uppercase tracking-wider" style={{ color: 'var(--color-navy)' }}>
              <span className="p-1.5 rounded-xl" style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border-light)', color: 'var(--color-amber)' }}>
                <PackageCheck className="w-4 h-4" />
              </span>
              Product Items ({items.length})
            </div>
          </div>

          {items.length === 0 ? (
            <p className="text-xs font-mono italic py-4 text-center" style={{ color: 'var(--color-text-muted)' }}>No product items extracted from this document.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid var(--color-border-light)', background: 'var(--color-surface)' }}>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="uppercase tracking-wider font-extrabold text-[10px]" style={{ background: 'var(--color-surface-muted)', borderBottom: '1px solid var(--color-border-light)', color: 'var(--color-text-muted)' }}>
                    <th className="py-2.5 px-3">SKU ID</th>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3 text-right">Purchase Price</th>
                    <th className="py-2.5 px-3 text-right">Selling Price</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-mono" style={{ borderColor: 'var(--color-border-light)' }}>
                  {items.map((item, idx) => (
                    <tr key={idx} className="transition-colors">
                      <td className="py-3 px-3 font-bold" style={{ color: 'var(--color-plum)' }}>{item.sku_id || <span style={{ color: 'var(--color-text-muted)' }}>—</span>}</td>
                      <td className="py-3 px-3 font-semibold" style={{ color: 'var(--color-text-primary)' }}>{item.product_name ? <AutoTranslate text={item.product_name} /> : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}</td>
                      <td className="py-3 px-3 text-right" style={{ color: 'var(--color-text-secondary)' }}>
                        {item.purchase_price !== null && item.purchase_price !== undefined ? `₹${item.purchase_price}` : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                      </td>
                      <td className="py-3 px-3 text-right" style={{ color: 'var(--color-text-secondary)' }}>
                        {item.selling_price !== null && item.selling_price !== undefined ? `₹${item.selling_price}` : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                      </td>
                      <td className="py-3 px-3 text-center font-bold" style={{ color: 'var(--color-success)' }}>
                        {item.quantity !== null && item.quantity !== undefined ? item.quantity : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
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
