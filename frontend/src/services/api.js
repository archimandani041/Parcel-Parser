import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const getHealthStatus = async () => {
  const response = await api.get('/health');
  return response.data;
};

export const uploadParcelLabels = async (files, onUploadProgress) => {
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append('files', files[i]);
  }

  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (progressEvent) => {
      if (onUploadProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onUploadProgress(percentCompleted);
      }
    }
  });

  return response.data;
};

export const scanReturnLabelFile = async (file) => {
  const formData = new FormData();
  formData.append('files', file);

  const response = await api.post('/upload/scan-only', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data;
};

export const getDocuments = async () => {
  const response = await api.get('/documents');
  return response.data;
};

export const getDocumentById = async (id) => {
  const response = await api.get(`/documents/${id}`);
  return response.data;
};

export const updateFieldCorrection = async (id, fieldName, originalValue, correctedValue) => {
  const response = await api.put(`/documents/${id}/corrections`, {
    field_name: fieldName,
    original_value: originalValue,
    corrected_value: correctedValue
  });
  return response.data;
};

export const deleteDocument = async (id) => {
  const response = await api.delete(`/documents/${id}`);
  return response.data;
};

export const exportDocumentsData = async (format, documentIds = []) => {
  const response = await api.post('/export', {
    format,
    document_ids: documentIds
  }, {
    responseType: 'blob'
  });
  
  return response;
};

// ===== ORDER RECORDS API =====

export const getOrderRecords = async (search = '') => {
  const params = search ? `?search=${encodeURIComponent(search)}` : '';
  const response = await api.get(`/orders${params}`);
  return response.data;
};

export const returnOrderRecord = async (id, return_type = 'CUSTOMER_RETURN') => {
  const response = await api.post(`/orders/${id}/return`, { return_type });
  return response.data;
};

export const undoReturnOrderRecord = async (id) => {
  const response = await api.post(`/orders/${id}/undo-return`);
  return response.data;
};

export const deleteOrderRecord = async (id) => {
  const response = await api.delete(`/orders/${id}`);
  return response.data;
};

export const syncOrdersToSupabase = async () => {
  const response = await api.post('/orders/sync');
  return response.data;
};

export const exportOrdersExcel = async () => {
  const response = await api.get('/orders/export-excel', { responseType: 'blob' });
  return response;
};

export const exportMasterExcel = async () => {
  const response = await api.get('/orders/export-master', { responseType: 'blob' });
  return response;
};

// ===== STOCK & RETURN API =====

export const getDashboardStats = async (range = '30') => {
  const response = await api.get(`/stock/dashboard-stats?range=${range}`);
  return response.data;
};

export const getStockOverview = async () => {
  const response = await api.get('/stock');
  return response.data;
};

export const exportStockExcel = async () => {
  const response = await api.get('/stock/export-excel', { responseType: 'blob' });
  return response;
};

export const updateStockProductPrice = async (skuId, purchasePrice, sellingPrice, productName) => {
  const response = await api.put(`/stock/products/${encodeURIComponent(skuId)}`, {
    sku_id: skuId,
    purchase_price: purchasePrice,
    selling_price: sellingPrice,
    product_name: productName
  });
  return response.data;
};

export const getReturnsOverview = async () => {
  const response = await api.get('/stock/returns');
  return response.data;
};

export const exportReturnsExcel = async () => {
  const response = await api.get('/stock/returns/export-excel', { responseType: 'blob' });
  return response;
};

export const updateReturnDeliveryCharge = async (orderId, deliveryBoyCharge, return_type) => {
  const response = await api.put(`/stock/returns/${encodeURIComponent(orderId)}`, {
    order_id: orderId,
    delivery_boy_charge: deliveryBoyCharge,
    return_type
  });
  return response.data;
};

export const deleteStockProduct = async (skuId) => {
  const response = await api.delete(`/stock/products/${encodeURIComponent(skuId)}`);
  return response.data;
};

export const deleteStockReturn = async (orderId) => {
  const response = await api.delete(`/stock/returns/${encodeURIComponent(orderId)}`);
  return response.data;
};

