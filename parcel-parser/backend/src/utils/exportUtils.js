import * as XLSX from 'xlsx';

/**
 * Utility functions for exporting document extraction results to JSON, CSV, and Excel XLSX.
 */

export function formatDocumentsForExport(docsDetailList) {
  return docsDetailList.map(doc => {
    const sj = doc.structured_json || {};
    const itemsStr = (sj.items || [])
      .map(i => `${i.product_name || ''} (SKU: ${i.sku_id || 'N/A'}, Qty: ${i.quantity || 1})`)
      .join('; ');

    return {
      'Document ID': doc.id,
      'File Name': doc.file_name,
      'Status': doc.status,
      'Overall Confidence': doc.overall_confidence ? `${(doc.overall_confidence * 100).toFixed(1)}%` : 'N/A',
      'Processing Time (ms)': doc.processing_time || 0,
      'Carrier': sj.shipping?.carrier || '',
      'AWB Number': sj.shipping?.awb || '',
      'Tracking Number': sj.shipping?.tracking_number || '',
      'Order ID': sj.order?.order_id || '',
      'Order Date': sj.order?.order_date || '',
      'Payment Status': sj.order?.payment_status || '',
      'Platform': sj.order?.platform || '',
      'Customer Name': sj.customer?.name || '',
      'Customer Address': sj.customer?.address || '',
      'City': sj.customer?.city || '',
      'State': sj.customer?.state || '',
      'District': sj.customer?.district || '',
      'Pincode': sj.customer?.pincode || '',
      'Country': sj.customer?.country || '',
      'Customer Phone': sj.customer?.phone || '',
      'Items': itemsStr,
      'Seller Name': sj.seller?.name || '',
      'Seller Address': sj.seller?.address || '',
      'Seller GSTIN': sj.seller?.gstin || '',
      'Total Amount': sj.other?.total_amount !== undefined ? sj.other.total_amount : '',
      'Created At': doc.created_at
    };
  });
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
