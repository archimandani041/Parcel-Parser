import * as XLSX from 'xlsx';

/**
 * Utility functions for exporting document extraction results to JSON, CSV, and Excel XLSX.
 */

export function formatDocumentsForExport(docsDetailList) {
  const rows = [];

  docsDetailList.forEach(doc => {
    const sj = doc.structured_json || {};
    const labels = Array.isArray(sj.labels) && sj.labels.length > 0 ? sj.labels : [sj];

    labels.forEach((lbl, idx) => {
      const items = Array.isArray(lbl.items) ? lbl.items : (Array.isArray(sj.items) ? sj.items : []);
      const itemsStr = items
        .map(i => `${i.product_name || ''} (SKU: ${i.sku_id || 'N/A'}, Qty: ${i.quantity || 1})`)
        .join('; ');

      const order = lbl.order || sj.order || {};
      const shipping = lbl.shipping || sj.shipping || {};
      const customer = lbl.customer || sj.customer || {};
      const seller = lbl.seller || sj.seller || {};
      const financial = lbl.financial || sj.financial || sj.other || {};

      rows.push({
        'Document ID': doc.id,
        'File Name': doc.file_name,
        'Label Index': labels.length > 1 ? idx + 1 : 1,
        'Status': doc.status,
        'Overall Confidence': doc.overall_confidence ? `${(doc.overall_confidence * 100).toFixed(1)}%` : 'N/A',
        'Processing Time (ms)': doc.processing_time || 0,
        'Carrier': shipping.carrier || '',
        'AWB Number': shipping.awb || '',
        'Tracking Number': shipping.tracking_number || '',
        'Order ID': order.order_id || '',
        'Order Date': order.order_date || '',
        'Payment Status': order.payment_status || '',
        'Platform': order.platform || '',
        'Customer Name': customer.name || '',
        'Customer Address': customer.address || '',
        'City': customer.city || '',
        'State': customer.state || '',
        'District': customer.district || '',
        'Pincode': customer.pincode || '',
        'Country': customer.country || '',
        'Customer Phone': customer.phone || '',
        'Items': itemsStr,
        'Seller Name': seller.name || '',
        'Seller Address': seller.address || '',
        'Seller GSTIN': seller.gstin || '',
        'Total Amount': financial.total_amount !== undefined ? financial.total_amount : '',
        'Created At': doc.created_at
      });
    });
  });

  return rows;
}

export function generateCsvBuffer(flattenedData) {
  if (!flattenedData || flattenedData.length === 0) return Buffer.from('');
  
  const headers = Object.keys(flattenedData[0]);
  const csvRows = [headers.join(',')];

  flattenedData.forEach(row => {
    const values = headers.map(header => {
      const val = row[header] !== undefined && row[header] !== null ? String(row[header]) : '';
      const escaped = val.replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  });

  return Buffer.from(csvRows.join('\n'), 'utf-8');
}

export function generateExcelBuffer(flattenedData) {
  const worksheet = XLSX.utils.json_to_sheet(flattenedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Shipping Labels');
  
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}
