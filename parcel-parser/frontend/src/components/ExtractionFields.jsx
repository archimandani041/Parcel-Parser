import React from 'react';
import { 
  ShoppingBag, 
  Truck, 
  UserCheck, 
  Store, 
  Receipt, 
  Layers, 
  Edit3, 
  AlertCircle,
  PackageCheck
} from 'lucide-react';

export default function ExtractionFields({ structuredJson, warnings = [], onEditField }) {
  if (!structuredJson) {
    return (
      <div className="p-8 text-center text-slate-500">
        No structured extraction data available.
      </div>
    );
  }

  const { order = {}, shipping = {}, customer = {}, items = [], seller = {}, other = {}, additional_fields = [] } = structuredJson;

  const renderFieldValue = (fieldName, value, label) => {
    const isNull = value === null || value === undefined || value === '';

    return (
      <div className="flex items-start justify-between py-2 border-b border-slate-800/60 last:border-b-0 text-sm group">
        <div className="flex flex-col pr-2 min-w-0 flex-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
          <span className={`font-mono text-sm break-words mt-0.5 ${isNull ? 'text-slate-600 italic' : 'text-slate-100 font-medium'}`}>
            {isNull ? 'null' : String(value)}
          </span>
        </div>
        {onEditField && (
          <button
            onClick={() => onEditField(fieldName, isNull ? '' : String(value))}
            title={`Edit ${label}`}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-md transition-all shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Validation Warnings Alert */}
      {warnings && warnings.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-200 text-sm mb-1">Validation Warnings ({warnings.length})</h4>
            <ul className="list-disc list-inside space-y-0.5 opacity-90">
              {warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Order Information */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-slate-200 border-b border-slate-800 pb-2.5 mb-3 text-sm">
            <ShoppingBag className="w-4 h-4 text-indigo-400" /> Order Details
          </div>
          {renderFieldValue('order_id', order.order_id, 'Order ID')}
          {renderFieldValue('order_number', order.order_number, 'Order Number')}
          {renderFieldValue('order_date', order.order_date, 'Order Date')}
          {renderFieldValue('payment_status', order.payment_status, 'Payment Status')}
          {renderFieldValue('platform', order.platform, 'E-Commerce Platform')}
        </div>

        {/* Shipping & Logistics */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-slate-200 border-b border-slate-800 pb-2.5 mb-3 text-sm">
            <Truck className="w-4 h-4 text-sky-400" /> Shipping Logistics
          </div>
          {renderFieldValue('carrier', shipping.carrier, 'Courier / Carrier')}
          {renderFieldValue('awb', shipping.awb, 'AWB Number')}
          {renderFieldValue('tracking_number', shipping.tracking_number, 'Tracking Number')}
          {renderFieldValue('shipment_id', shipping.shipment_id, 'Shipment ID')}
        </div>

        {/* Customer / Recipient */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm md:col-span-2">
          <div className="flex items-center gap-2 font-bold text-slate-200 border-b border-slate-800 pb-2.5 mb-3 text-sm">
            <UserCheck className="w-4 h-4 text-emerald-400" /> Customer / Recipient
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
            <div>
              {renderFieldValue('customer_name', customer.name, 'Customer Name')}
              {renderFieldValue('customer_phone', customer.phone, 'Phone Number')}
              {renderFieldValue('customer_email', customer.email, 'Email')}
            </div>
            <div className="md:col-span-2">
              {renderFieldValue('customer_address', customer.address, 'Shipping Address')}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {renderFieldValue('customer_city', customer.city, 'City')}
                {renderFieldValue('customer_state', customer.state, 'State')}
                {renderFieldValue('customer_pincode', customer.pincode, 'Pincode')}
                {renderFieldValue('customer_country', customer.country, 'Country')}
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm md:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
            <div className="flex items-center gap-2 font-bold text-slate-200 text-sm">
              <PackageCheck className="w-4 h-4 text-purple-400" /> Product Line Items ({items.length})
            </div>
          </div>

          {items.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2">No product line items extracted.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-2 px-3">SKU</th>
                    <th className="py-2 px-3">Product Title</th>
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3 text-center">Qty</th>
                    <th className="py-2 px-3 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-indigo-300">{item.sku_id || 'N/A'}</td>
                      <td className="py-2.5 px-3 text-slate-100 font-semibold">{item.product_name || 'N/A'}</td>
                      <td className="py-2.5 px-3 text-slate-400 max-w-xs truncate">{item.description || '-'}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-400">{item.quantity !== null ? item.quantity : 1}</td>
                      <td className="py-2.5 px-3 text-right text-slate-200">{item.price !== null ? `₹${item.price}` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Seller Merchant Details */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-slate-200 border-b border-slate-800 pb-2.5 mb-3 text-sm">
            <Store className="w-4 h-4 text-amber-400" /> Seller / Merchant
          </div>
          {renderFieldValue('seller_name', seller.name, 'Merchant Name')}
          {renderFieldValue('gstin', seller.gstin, 'GSTIN')}
          {renderFieldValue('seller_address', seller.address, 'Seller Address')}
          {renderFieldValue('seller_phone', seller.phone, 'Seller Phone')}
        </div>

        {/* Financial & Other Fields */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-slate-200 border-b border-slate-800 pb-2.5 mb-3 text-sm">
            <Receipt className="w-4 h-4 text-rose-400" /> Other & Amounts
          </div>
          {renderFieldValue('invoice_number', other.invoice_number, 'Invoice Number')}
          {renderFieldValue('weight', other.weight, 'Package Weight')}
          {renderFieldValue('dimensions', other.dimensions, 'Dimensions')}
          {renderFieldValue('cod_amount', other.cod_amount, 'COD Amount')}
          {renderFieldValue('total_amount', other.total_amount, 'Total Amount')}
        </div>

        {/* Additional Fields Preserved */}
        {additional_fields && additional_fields.length > 0 && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm md:col-span-2">
            <div className="flex items-center gap-2 font-bold text-slate-200 border-b border-slate-800 pb-2.5 mb-3 text-sm">
              <Layers className="w-4 h-4 text-teal-400" /> Preserved Additional Fields ({additional_fields.length})
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {additional_fields.map((field, idx) => (
                <div key={idx} className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  <span className="text-xs font-semibold text-teal-400 block">{field.field_name}</span>
                  <span className="font-mono text-sm text-slate-200">{field.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
