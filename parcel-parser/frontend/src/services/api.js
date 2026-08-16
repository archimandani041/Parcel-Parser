import axios from 'axios';

const API_BASE_URL = '/api';

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

export const returnOrderRecord = async (id) => {
  const response = await api.post(`/orders/${id}/return`);
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
