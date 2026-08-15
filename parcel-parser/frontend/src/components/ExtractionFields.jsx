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
  PackageCheck,
  Package,
  DollarSign,
  Barcode,
  MapPin
} from 'lucide-react';

export default function ExtractionFields({ structuredJson, warnings = [], onEditField }) {
  if (!structuredJson) {
    return (
      <div className="p-8 text-center text-slate-500">
        No structured extraction data available.
      </div>
    );
  }

  const {
    order = {},
    shipping = {},
    customer = {},
    items = [],
    seller = {},
    financial = {},
    package: pkg = {},
    other = {}, // backward compat with old schema
    additional_fields = []
  } = structuredJson;

  // ── Helper: render a single label/value row ──────────────────────────────
  const renderField = (fieldName, value, label) => {
    const isNull = value === null || value === undefined || value === '';
    return (
      <div
        key={fieldName}
        className="flex items-start justify-between py-2 border-b border-slate-800/60 last:border-b-0 text-sm group"
      >
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

  // ── Helper: section card wrapper ─────────────────────────────────────────
  const Section = ({ icon, title, color, children, wide = false }) => (
    <div className={`bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm ${wide ? 'md:col-span-2' : ''}`}>
      <div className={`flex items-center gap-2 font-bold text-slate-200 border-b border-slate-800 pb-2.5 mb-3 text-sm`}>
        <span className={color}>{icon}</span>
        {title}
      </div>
      {children}
    </div>
  );

  // ── Detect which financial object to use (new 'financial' or old 'other') ─
  const fin = (financial && Object.keys(financial).length > 0) ? financial : other;

  // ── Detect which package object to use ───────────────────────────────────
  const pkgData = (pkg && Object.keys(pkg).length > 0) ? pkg : other;

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

        {/* ── Order Information ── */}
        <Section icon={<ShoppingBag className="w-4 h-4" />} title="Order Details" color="text-indigo-400">
          {renderField('order_id', order.order_id, 'Order ID')}
          {renderField('order_number', order.order_number, 'Order Number')}
          {renderField('order_date', order.order_date, 'Order Date')}
          {renderField('payment_status', order.payment_status, 'Payment Status')}
          {renderField('platform', order.platform, 'E-Commerce Platform')}
          {order.return_policy && renderField('return_policy', order.return_policy, 'Return Policy')}
        </Section>

        {/* ── Shipping & Logistics ── */}
        <Section icon={<Truck className="w-4 h-4" />} title="Shipping Logistics" color="text-sky-400">
          {renderField('carrier', shipping.carrier, 'Courier / Carrier')}
          {renderField('awb', shipping.awb, 'AWB Number')}
          {renderField('tracking_number', shipping.tracking_number, 'Tracking Number')}
          {renderField('shipment_id', shipping.shipment_id, 'Shipment ID')}
          {shipping.service_type && renderField('service_type', shipping.service_type, 'Service Type')}
          {shipping.route_code && renderField('route_code', shipping.route_code, 'Route Code')}
          {shipping.sort_code && renderField('sort_code', shipping.sort_code, 'Sort Code')}
          {shipping.zone && renderField('zone', shipping.zone, 'Zone')}
          {shipping.bag_number && renderField('bag_number', shipping.bag_number, 'Bag Number')}
          {shipping.expected_delivery && renderField('expected_delivery', shipping.expected_delivery, 'Expected Delivery')}
        </Section>

        {/* ── Customer / Recipient (full width) ── */}
        <Section icon={<UserCheck className="w-4 h-4" />} title="Customer / Recipient" color="text-emerald-400" wide>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
            <div>
              {renderField('customer_name', customer.name, 'Customer Name')}
              {renderField('customer_phone', customer.phone, 'Phone Number')}
              {customer.alternate_phone && renderField('alternate_phone', customer.alternate_phone, 'Alternate Phone')}
              {renderField('customer_email', customer.email, 'Email')}
            </div>
            <div className="md:col-span-2">
              {renderField('customer_address', customer.address, 'Shipping Address')}
              {(customer.building || customer.street || customer.locality || customer.landmark) && (
                <div className="grid grid-cols-2 gap-2">
                  {customer.building && renderField('customer_building', customer.building, 'Building')}
                  {customer.street && renderField('customer_street', customer.street, 'Street')}
                  {customer.locality && renderField('customer_locality', customer.locality, 'Locality')}
                  {customer.landmark && renderField('customer_landmark', customer.landmark, 'Landmark')}
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {renderField('customer_city', customer.city, 'City')}
                {customer.district && renderField('customer_district', customer.district, 'District')}
                {renderField('customer_state', customer.state, 'State')}
                {renderField('customer_pincode', customer.pincode, 'Pincode')}
                {renderField('customer_country', customer.country, 'Country')}
              </div>
            </div>
          </div>
        </Section>

        {/* ── Line Items Table (full width) ── */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm md:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
            <div className="flex items-center gap-2 font-bold text-slate-200 text-sm">
              <PackageCheck className="w-4 h-4 text-purple-400" />
              Product Line Items ({items.length})
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
                    <th className="py-2 px-3 text-right">Unit Price</th>
                    <th className="py-2 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-indigo-300">{item.sku_id || 'N/A'}</td>
                      <td className="py-2.5 px-3 text-slate-100 font-semibold">{item.product_name || 'N/A'}</td>
                      <td className="py-2.5 px-3 text-slate-400 max-w-xs truncate" title={item.description}>{item.description || '-'}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-400">{item.quantity !== null ? item.quantity : 1}</td>
                      <td className="py-2.5 px-3 text-right text-slate-200">{item.price !== null && item.price !== undefined ? `₹${item.price}` : '-'}</td>
                      <td className="py-2.5 px-3 text-right text-slate-200">{item.total !== null && item.total !== undefined ? `₹${item.total}` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Seller / Merchant ── */}
        <Section icon={<Store className="w-4 h-4" />} title="Seller / Merchant" color="text-amber-400">
          {renderField('seller_name', seller.name, 'Merchant Name')}
          {renderField('gstin', seller.gstin, 'GSTIN')}
          {seller.pan && renderField('seller_pan', seller.pan, 'PAN')}
          {renderField('seller_address', seller.address, 'Seller Address')}
          {(seller.city || seller.state || seller.pincode) && (
            <div className="grid grid-cols-3 gap-2">
              {seller.city && renderField('seller_city', seller.city, 'City')}
              {seller.state && renderField('seller_state', seller.state, 'State')}
              {seller.pincode && renderField('seller_pincode', seller.pincode, 'Pincode')}
            </div>
          )}
          {renderField('seller_phone', seller.phone, 'Seller Phone')}
          {seller.email && renderField('seller_email', seller.email, 'Seller Email')}
          {seller.fssai && renderField('seller_fssai', seller.fssai, 'FSSAI')}
        </Section>

        {/* ── Financial & Amounts ── */}
        <Section icon={<DollarSign className="w-4 h-4" />} title="Financial & Amounts" color="text-rose-400">
          {renderField('invoice_number', fin.invoice_number, 'Invoice Number')}
          {fin.invoice_date && renderField('invoice_date', fin.invoice_date, 'Invoice Date')}
          {fin.subtotal !== null && fin.subtotal !== undefined && renderField('subtotal', `₹${fin.subtotal}`, 'Subtotal')}
          {fin.discount !== null && fin.discount !== undefined && renderField('discount', `₹${fin.discount}`, 'Discount')}
          {fin.tax !== null && fin.tax !== undefined && renderField('tax', `₹${fin.tax}`, 'Tax / GST')}
          {renderField('shipping_charge', fin.shipping_charge !== null && fin.shipping_charge !== undefined ? `₹${fin.shipping_charge}` : null, 'Shipping Charge')}
          {renderField('cod_amount', fin.cod_amount !== null && fin.cod_amount !== undefined ? `₹${fin.cod_amount}` : null, 'COD Amount')}
          {renderField('total_amount', fin.total_amount !== null && fin.total_amount !== undefined ? `₹${fin.total_amount}` : null, 'Total Amount')}
          {fin.currency && renderField('currency', fin.currency, 'Currency')}
        </Section>

        {/* ── Package Info ── */}
        <Section icon={<Package className="w-4 h-4" />} title="Package Information" color="text-teal-400">
          {renderField('weight', pkgData.weight, 'Package Weight')}
          {renderField('dimensions', pkgData.dimensions, 'Dimensions')}
          {renderField('package_number', pkgData.package_number, 'Package Number')}
          {(pkgData.hbd || pkgData.hbd_code) && renderField('hbd', pkgData.hbd || pkgData.hbd_code, 'Hub Destination (HBD)')}
          {pkgData.cpd && renderField('cpd', pkgData.cpd, 'CPD Code')}
          {pkgData.reference_number && renderField('reference_number', pkgData.reference_number, 'Reference Number')}
          {pkgData.return_hub && renderField('return_hub', pkgData.return_hub, 'Return Hub')}
          {pkgData.special_instructions && renderField('special_instructions', pkgData.special_instructions, 'Special Instructions')}
          {pkgData.fragile !== null && pkgData.fragile !== undefined && renderField('fragile', pkgData.fragile ? 'Yes' : 'No', 'Fragile')}
          {/* Barcode values */}
          {Array.isArray(pkgData.barcode_values) && pkgData.barcode_values.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-800/60">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                <Barcode className="w-3.5 h-3.5 inline mr-1" />Barcode / QR Values
              </span>
              <div className="flex flex-wrap gap-1.5">
                {pkgData.barcode_values.map((val, idx) => (
                  <span key={idx} className="font-mono text-xs bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-indigo-300">
                    {val}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* ── Additional Fields (full width, if any) ── */}
        {additional_fields && additional_fields.length > 0 && (
          <Section icon={<Layers className="w-4 h-4" />} title={`Additional Fields (${additional_fields.length})`} color="text-teal-400" wide>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {additional_fields.map((field, idx) => (
                <div key={idx} className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  <span className="text-xs font-semibold text-teal-400 block">{field.field_name}</span>
                  <span className="font-mono text-sm text-slate-200">{field.value}</span>
                  {field.confidence !== null && field.confidence !== undefined && (
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Confidence: {(field.confidence * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

      </div>
    </div>
  );
}
