import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import AutoTranslate from '../components/AutoTranslate';
import {
  getReturnsOverview,
  updateReturnDeliveryCharge,
  undoReturnOrderRecord,
  getOrderRecords,
  uploadParcelLabels,
  returnOrderRecord
} from '../services/api';
import {
  RotateCcw,
  Package,
  Search,
  RefreshCw,
  Save,
  Check,
  Truck,
  Inbox,
  AlertTriangle,
  UploadCloud,
  Camera,
  Loader2,
  X,
  FileText,
  User,
  Hash,
  ShoppingBag,
  Layers,
  ArrowRight,
  RefreshCcw
} from 'lucide-react';

export default function Return() {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState('customer'); // 'customer' | 'rto'
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // ===== UPLOAD RETURN LABEL MODAL STATES =====
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadStep, setUploadStep] = useState('SELECT_METHOD');
  // Steps: 'SELECT_METHOD' | 'IMAGE_PREVIEW' | 'CAMERA_VIEW' | 'CAMERA_PREVIEW' | 'PARSING' | 'MATCH_FOUND' | 'ERROR'

  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [extractedOrderId, setExtractedOrderId] = useState(null);
  const [matchedOrder, setMatchedOrder] = useState(null);
  const [returnModalError, setReturnModalError] = useState(null);
  const [customDeliveryCharge, setCustomDeliveryCharge] = useState(10);
  const [processingReturn, setProcessingReturn] = useState(false);

  // Camera stream refs
  const [cameraStream, setCameraStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const videoRef = useRef(null);
  const uploadFileInputRef = useRef(null);

  // 1. File picker handler
  const handleFileSelectForUpload = (file) => {
    if (!file) return;
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setUploadStep('IMAGE_PREVIEW');
    setReturnModalError(null);
  };

  // 2. Camera stream handlers
  const startCamera = async (mode = facingMode) => {
    setReturnModalError(null);
    setUploadStep('CAMERA_VIEW');
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setCameraStream(stream);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error('Camera Error:', err);
      setReturnModalError(t('returns.cameraAccessError'));
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
  };

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `captured_return_${Date.now()}.jpg`, { type: 'image/jpeg' });
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
      stopCamera();
      setUploadStep('CAMERA_PREVIEW');
    }, 'image/jpeg', 0.92);
  };

  // 3. Process button handler (Gemini Vision Extraction & Order Matching)
  const handleProcessImage = async () => {
    if (!selectedFile) return;
    setUploadStep('PARSING');
    setReturnModalError(null);

    try {
      // Call Gemini Vision Parser API
      const res = await uploadParcelLabels([selectedFile]);
      const doc = res.documents && res.documents[0];
      const json = doc?.structured_json || {};

      let extractedId = null;
      if (json.order?.order_id) extractedId = json.order.order_id;
      else if (json.order?.order_number) extractedId = json.order.order_number;
      else if (json.order_id) extractedId = json.order_id;
      else if (json.orderId) extractedId = json.orderId;
      else if (Array.isArray(json.labels) && json.labels.length > 0) {
        const l = json.labels[0];
        extractedId = l.order?.order_id || l.order?.order_number || l.order_id || null;
      }

      if (!extractedId || !extractedId.trim()) {
        setReturnModalError(t('returns.orderIdNotFound'));
        setUploadStep('ERROR');
        return;
      }

      const cleanExtractedId = extractedId.trim();
      setExtractedOrderId(cleanExtractedId);

      // Search existing Supabase Orders data using extracted Order ID
      const ordersRes = await getOrderRecords();
      const allOrders = ordersRes.records || [];

      const match = allOrders.find(o => 
        (o.order_id && o.order_id.trim().toLowerCase() === cleanExtractedId.toLowerCase()) ||
        (o.id && o.id.trim().toLowerCase() === cleanExtractedId.toLowerCase())
      );

      // Validation 1: Order ID not found in Supabase
      if (!match) {
        setReturnModalError(t('returns.orderIdNotFound'));
        setUploadStep('ERROR');
        return;
      }

      // Validation 2: Order already returned check (Duplicate protection)
      if (match.is_returned) {
        setReturnModalError(t('returns.orderAlreadyReturned'));
        setUploadStep('ERROR');
        return;
      }

      // Order found & valid for return!
      setMatchedOrder(match);
      setUploadStep('MATCH_FOUND');

    } catch (err) {
      console.error('Process label error:', err);
      setReturnModalError(t('returns.orderIdNotFound'));
      setUploadStep('ERROR');
    }
  };

  // 4. Save Return (Customer Return vs RTO Return)
  const handleSaveReturnFromModal = async (returnType) => {
    if (!matchedOrder) return;
    setProcessingReturn(true);

    try {
      const targetId = matchedOrder.id || matchedOrder.order_id;
      
      // Save return in Supabase for existing Order ID
      await returnOrderRecord(targetId, returnType);

      // Set delivery charge (RTO Return = ₹0, Customer Return = custom charge)
      const chargeVal = returnType === 'RTO_RETURN' ? 0 : (parseFloat(customDeliveryCharge) || 10);
      await updateReturnDeliveryCharge(matchedOrder.order_id || targetId, chargeVal, returnType);

      showToast(t('returns.orderAddedToReturn', {
        id: matchedOrder.order_id,
        type: returnType === 'RTO_RETURN' ? t('orders.rtoReturn') : t('orders.customerReturn')
      }));
      closeModal();
      await loadReturnData();

    } catch (err) {
      console.error('Save Return Error:', err);
      alert(t('returns.failedSaveReturn') + (err.response?.data?.error || err.message));
    } finally {
      setProcessingReturn(false);
    }
  };

  const closeModal = () => {
    stopCamera();
    setShowUploadModal(false);
    setUploadStep('SELECT_METHOD');
    setSelectedFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setExtractedOrderId(null);
    setMatchedOrder(null);
    setReturnModalError(null);
  };

  // Data states
  const [customerReturns, setCustomerReturns] = useState([]);
  const [rtoReturns, setRtoReturns] = useState([]);
  const [summary, setSummary] = useState({
    total_customer_returns: 0,
    total_customer_returned_quantity: 0,
    total_customer_delivery_charges: 0,
    total_customer_return_loss: 0,
    total_rto_returns: 0,
    total_rto_returned_quantity: 0,
    total_rto_delivery_charges: 0,
    total_rto_return_loss: 0
  });

  // Delivery charge editing state for Customer Returns
  const [editChargeState, setEditChargeState] = useState({});
  // Confirmation state for Undo Return
  const [confirmUndoOrder, setConfirmUndoOrder] = useState(null);
  const [undoingId, setUndoingId] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadReturnData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getReturnsOverview();
      if (data.success) {
        const custRet = data.customerReturns || (data.returns || []).filter(r => r.return_type === 'CUSTOMER_RETURN');
        const rtoRet = data.rtoReturns || (data.returns || []).filter(r => r.return_type === 'RTO_RETURN');

        setCustomerReturns(custRet);
        setRtoReturns(rtoRet);
        if (data.summary) {
          setSummary(data.summary);
        }

        // Initialize editChargeState for customer returns
        const chargeStateObj = {};
        custRet.forEach(r => {
          chargeStateObj[r.order_id] = {
            delivery_boy_charge: r.delivery_boy_charge != null ? r.delivery_boy_charge : '',
            saving: false,
            saved: false
          };
        });
        setEditChargeState(chargeStateObj);
      }
    } catch (err) {
      console.error('Failed to load returns overview:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReturnData();
  }, [loadReturnData]);

  const handleChargeChange = (orderId, val) => {
    setEditChargeState(prev => ({
      ...prev,
      [orderId]: {
        ...(prev[orderId] || {}),
        delivery_boy_charge: val,
        saved: false
      }
    }));
  };

  const handleSaveCharge = async (orderId) => {
    const itemState = editChargeState[orderId];
    if (!itemState) return;

    setEditChargeState(prev => ({
      ...prev,
      [orderId]: { ...prev[orderId], saving: true }
    }));

    try {
      const currentItem = customerReturns.find(r => r.order_id === orderId) || rtoReturns.find(r => r.order_id === orderId);
      const currentReturnType = currentItem?.return_type || 'CUSTOMER_RETURN';
      await updateReturnDeliveryCharge(orderId, itemState.delivery_boy_charge, currentReturnType);
      setEditChargeState(prev => ({
        ...prev,
        [orderId]: { ...prev[orderId], saving: false, saved: true }
      }));
      showToast(t('returns.updatedDeliveryCharge', { id: orderId }));
      await loadReturnData();
    } catch (err) {
      alert(t('returns.failedUpdateDeliveryCharge') + (err.response?.data?.error || err.message));
      setEditChargeState(prev => ({
        ...prev,
        [orderId]: { ...prev[orderId], saving: false }
      }));
    }
  };

  const handleConfirmUndoReturn = async () => {
    if (!confirmUndoOrder) return;
    const targetId = confirmUndoOrder.id || confirmUndoOrder.order_id;
    setConfirmUndoOrder(null);
    setUndoingId(targetId);
    try {
      await undoReturnOrderRecord(targetId);
      showToast(t('returns.returnUndoneForOrder', { id: confirmUndoOrder.order_id }));
      await loadReturnData();
    } catch (err) {
      alert(t('orders.undoReturnFailed') + (err.response?.data?.error || err.message));
    } finally {
      setUndoingId(null);
    }
  };

  const formatCurrency = (val) => {
    if (val == null || isNaN(val)) return '₹0';
    const num = Number(val);
    if (num < 0) {
      return `-₹${Math.abs(num).toLocaleString('en-IN')}`;
    }
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return isoString;
    }
  };

  // Filter returns based on search query
  const filteredCustomerReturns = customerReturns.filter(r => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (r.order_id && r.order_id.toLowerCase().includes(q)) ||
      (r.sku_id && r.sku_id.toLowerCase().includes(q)) ||
      (r.customer_name && r.customer_name.toLowerCase().includes(q)) ||
      (r.product_name && r.product_name.toLowerCase().includes(q))
    );
  });

  const filteredRtoReturns = rtoReturns.filter(r => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (r.order_id && r.order_id.toLowerCase().includes(q)) ||
      (r.sku_id && r.sku_id.toLowerCase().includes(q)) ||
      (r.customer_name && r.customer_name.toLowerCase().includes(q)) ||
      (r.product_name && r.product_name.toLowerCase().includes(q))
    );
  });

  return (
    <Layout title={t('nav.returns')}>
      <div className="space-y-6 w-full pb-12">

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* HEADER & CONTROLS */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-purple-100/80 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shadow-sm shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {t('returns.title')} <span className="font-normal text-amber-700">{t('returns.titleHighlight')}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap xl:flex-nowrap shrink-0">
            {/* Category Switcher Pill [ Customer Return ] [ RTO Return ] */}
            <div className="bg-purple-100/60 p-1 rounded-full border border-purple-200/80 flex items-center gap-1 shadow-inner shrink-0">
              <button
                id="customer-return-tab-btn"
                onClick={() => setActiveCategory('customer')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${activeCategory === 'customer'
                    ? 'bg-amber-200/90 text-amber-950 border border-amber-300 shadow-xs'
                    : 'text-purple-800/80 hover:text-purple-950 hover:bg-white/60'
                  }`}
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-800" />
                {t('orders.customerReturn')}
              </button>

              <button
                id="rto-return-tab-btn"
                onClick={() => setActiveCategory('rto')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${activeCategory === 'rto'
                    ? 'bg-purple-200/90 text-purple-950 border border-purple-300 shadow-xs'
                    : 'text-purple-800/80 hover:text-purple-950 hover:bg-white/60'
                  }`}
              >
                <Truck className="w-3.5 h-3.5 text-purple-700" />
                {t('orders.rtoReturn')}
              </button>
            </div>

            {/* Upload Return Label Button */}
            <button
              onClick={() => {
                setShowUploadModal(true);
                setUploadStep('SELECT_METHOD');
              }}
              className="flex items-center gap-2 px-4.5 py-2.5 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold rounded-full shadow-md shadow-purple-500/25 hover:shadow-lg hover:shadow-purple-500/35 transition-all hover:scale-105 cursor-pointer shrink-0"
            >
              <UploadCloud className="w-4 h-4 text-white" />
              <span>{t('returns.uploadReturnLabel')}</span>
            </button>

            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px] sm:w-60">
              <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="search-return-input"
                type="text"
                placeholder={t('orders.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-purple-50/40 border border-purple-200/80 rounded-full pl-9 pr-4 py-2.5 text-xs text-slate-800 placeholder-purple-300 outline-none focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-200 transition-all font-medium shadow-xs"
              />
            </div>

            {/* Refresh Button */}
            <button
              onClick={loadReturnData}
              disabled={loading}
              className="p-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-full border border-purple-200/80 transition-all shadow-xs disabled:opacity-50 cursor-pointer shrink-0"
              title={t('common.refresh')}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* DYNAMIC SUMMARY CARDS DEPENDING ON CATEGORY */}
        {activeCategory === 'customer' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Total Customer Returns */}
            <div className="ui-card p-5 space-y-1.5">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>{t('returns.customerReturns')}</span>
                <RotateCcw className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-amber-700 font-mono">
                {summary.total_customer_returns || customerReturns.length || 0}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">{t('returns.customerReturnParcels')}</p>
            </div>

            {/* Total Returned Quantity */}
            <div className="ui-card p-5 space-y-1.5">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>{t('stock.custReturnedQty')}</span>
                <Package className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 font-mono">
                {summary.total_customer_returned_quantity || customerReturns.reduce((acc, r) => acc + (r.quantity || 1), 0)}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">{t('returns.unitsAddedBackToStock')}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Total RTO Returns */}
            <div className="ui-card p-5 space-y-1.5">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>{t('returns.rtoReturns')}</span>
                <Truck className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-700 font-mono">
                {summary.total_rto_returns || rtoReturns.length || 0}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">{t('returns.rtoReturnParcels')}</p>
            </div>

            {/* Total RTO Quantity */}
            <div className="ui-card p-5 space-y-1.5">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>{t('stock.rtoReturnedQty')}</span>
                <Package className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 font-mono">
                {summary.total_rto_returned_quantity || rtoReturns.reduce((acc, r) => acc + (r.quantity || 1), 0)}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">{t('returns.restoredToAvailableStock')}</p>
            </div>
          </div>
        )}

        {/* TABLE VIEW FOR ACTIVE CATEGORY */}
        {activeCategory === 'customer' ? (
          /* CUSTOMER RETURNS TABLE */
          <div className="ui-card overflow-hidden shadow-xl border border-slate-200/80 rounded-3xl">
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-600" />
                <p className="text-xs text-slate-500 font-mono font-medium">{t('returns.loadingCustomerReturns')}</p>
              </div>
            ) : filteredCustomerReturns.length === 0 ? (
              <div className="py-20 text-center space-y-3 bg-slate-50/50">
                <Inbox className="w-12 h-12 text-slate-400 mx-auto" />
                <h4 className="font-semibold text-slate-800 text-base">{t('returns.noCustomerReturnsFound')}</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                  {searchQuery
                    ? t('returns.noCustomerReturnsMatch', { query: searchQuery })
                    : t('returns.noCustomerReturnsHint')}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto bg-white">
                <table className="w-full text-left border-collapse text-xs min-w-[950px]" id="customer-returns-table">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                      <th className="py-4 px-3 border-r border-slate-100">{t('fields.orderId')}</th>
                      <th className="py-4 px-3 border-r border-slate-100">{t('fields.skuId')}</th>
                      <th className="py-4 px-3 border-r border-slate-100">{t('fields.productName')}</th>
                      <th className="py-4 px-2 border-r border-slate-100 text-center">{t('fields.quantity')}</th>
                      <th className="py-4 px-3 border-r border-slate-100 text-center">{t('fields.purchasePrice')}</th>
                      <th className="py-4 px-3 border-r border-slate-100 text-center">{t('fields.sellingPrice')}</th>
                      <th className="py-4 px-3 border-r border-slate-100 text-center">{t('fields.deliveryCharge')}</th>
                      <th className="py-4 px-3 border-r border-slate-100 text-right">{t('stock.returnLoss')}</th>
                      <th className="py-4 px-3 border-r border-slate-100 text-center">{t('fields.returnDate')}</th>
                      <th className="py-4 px-3 text-center">{t('common.action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCustomerReturns.map((r) => {
                      const itemState = editChargeState[r.order_id] || {
                        delivery_boy_charge: r.delivery_boy_charge != null ? r.delivery_boy_charge : '',
                        saving: false,
                        saved: false
                      };

                      return (
                        <tr key={r.id || r.order_id} className="hover:bg-amber-50/40 transition-colors">
                          {/* Order ID */}
                          <td className="py-3.5 px-3 border-r border-slate-100 font-mono text-xs font-bold text-amber-900 select-all">
                            {r.order_id}
                          </td>

                          {/* SKU ID */}
                          <td className="py-3.5 px-3 border-r border-slate-100">
                            <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                              {r.sku_id}
                            </span>
                          </td>

                          {/* Product Name */}
                          <td className="py-3.5 px-3 border-r border-slate-100">
                            <span className="text-xs text-slate-800 font-semibold line-clamp-2">
                              {r.product_name ? <AutoTranslate text={r.product_name} /> : '-'}
                            </span>
                          </td>

                          {/* Quantity */}
                          <td className="py-3.5 px-2 border-r border-slate-100 text-center font-mono text-xs font-semibold text-slate-800">
                            {r.quantity}
                          </td>

                          {/* Purchase Price */}
                          <td className="py-3.5 px-3 border-r border-slate-100 text-center font-mono text-xs text-slate-600">
                            {formatCurrency(r.purchase_price)}
                          </td>

                          {/* Selling Price */}
                          <td className="py-3.5 px-3 border-r border-slate-100 text-center font-mono text-xs text-slate-600">
                            {formatCurrency(r.selling_price)}
                          </td>

                          {/* Delivery Charge Input */}
                          <td className="py-3.5 px-3 border-r border-slate-100 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="text-slate-400 font-mono font-bold">₹</span>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                placeholder="0"
                                value={itemState.delivery_boy_charge}
                                onChange={(e) => handleChargeChange(r.order_id, e.target.value)}
                                className="w-16 bg-amber-50/50 border border-amber-200 rounded-lg px-2 py-1 text-xs text-slate-800 font-mono text-center outline-none focus:border-amber-400 focus:bg-white transition-all font-semibold"
                              />
                              <button
                                onClick={() => handleSaveCharge(r.order_id)}
                                disabled={itemState.saving}
                                title={t('common.save')}
                                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${itemState.saved
                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                    : 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                                  }`}
                              >
                                {itemState.saving ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : itemState.saved ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : (
                                  <Save className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Return Loss */}
                          <td className="py-3.5 px-3 border-r border-slate-100 text-right">
                            <span className="font-mono text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              {formatCurrency(r.return_loss)}
                            </span>
                          </td>

                          {/* Return Date */}
                          <td className="py-3.5 px-3 border-r border-slate-100 text-center text-[11px] text-slate-500 font-medium">
                            {formatDate(r.return_date)}
                          </td>

                          {/* Action (Undo Return) */}
                          <td className="py-3.5 px-3 text-center">
                            <button
                              onClick={() => setConfirmUndoOrder(r)}
                              disabled={undoingId === (r.id || r.order_id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200 transition-all cursor-pointer disabled:opacity-50"
                            >
                              <RotateCcw className={`w-3 h-3 ${undoingId === (r.id || r.order_id) ? 'animate-spin' : ''}`} />
                              {t('orders.undoReturn')}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* RTO RETURNS TABLE */
          <div className="ui-card overflow-hidden shadow-xl border border-slate-200/80 rounded-3xl">
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-600" />
                <p className="text-xs text-slate-500 font-mono font-medium">{t('returns.loadingRtoReturns')}</p>
              </div>
            ) : filteredRtoReturns.length === 0 ? (
              <div className="py-20 text-center space-y-3 bg-slate-50/50">
                <Inbox className="w-12 h-12 text-slate-400 mx-auto" />
                <h4 className="font-semibold text-slate-800 text-base">{t('returns.noRtoReturnsFound')}</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                  {searchQuery
                    ? t('returns.noRtoReturnsMatch', { query: searchQuery })
                    : t('returns.noRtoReturnsHint')}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto bg-white">
                <table className="w-full text-left border-collapse text-xs min-w-[950px]" id="rto-returns-table">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                      <th className="py-4 px-3 border-r border-slate-100">{t('fields.orderId')}</th>
                      <th className="py-4 px-3 border-r border-slate-100">{t('fields.skuId')}</th>
                      <th className="py-4 px-3 border-r border-slate-100">{t('fields.productName')}</th>
                      <th className="py-4 px-2 border-r border-slate-100 text-center">{t('fields.quantity')}</th>
                      <th className="py-4 px-3 border-r border-slate-100 text-center">{t('fields.purchasePrice')}</th>
                      <th className="py-4 px-3 border-r border-slate-100 text-center">{t('fields.sellingPrice')}</th>
                      <th className="py-4 px-3 border-r border-slate-100 text-center">{t('orders.returnStatus')}</th>
                      <th className="py-4 px-3 border-r border-slate-100 text-center">{t('fields.returnDate')}</th>
                      <th className="py-4 px-3 text-center">{t('common.action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRtoReturns.map((r) => (
                      <tr key={r.id || r.order_id} className="hover:bg-purple-50/40 transition-colors">
                        {/* Order ID */}
                        <td className="py-3.5 px-3 border-r border-slate-100 font-mono text-xs font-bold text-purple-900 select-all">
                          {r.order_id}
                        </td>

                        {/* SKU ID */}
                        <td className="py-3.5 px-3 border-r border-slate-100">
                          <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                            {r.sku_id}
                          </span>
                        </td>

                        {/* Product Name */}
                        <td className="py-3.5 px-3 border-r border-slate-100">
                          <span className="text-xs text-slate-800 font-semibold line-clamp-2">
                            {r.product_name ? <AutoTranslate text={r.product_name} /> : '-'}
                          </span>
                        </td>

                        {/* Quantity */}
                        <td className="py-3.5 px-2 border-r border-slate-100 text-center font-mono text-xs font-semibold text-slate-800">
                          {r.quantity}
                        </td>

                        {/* Purchase Price */}
                        <td className="py-3.5 px-3 border-r border-slate-100 text-center font-mono text-xs text-slate-600">
                          {formatCurrency(r.purchase_price)}
                        </td>

                        {/* Selling Price */}
                        <td className="py-3.5 px-3 border-r border-slate-100 text-center font-mono text-xs text-slate-600">
                          {formatCurrency(r.selling_price)}
                        </td>

                        {/* Return Type Badge */}
                        <td className="py-3.5 px-3 border-r border-slate-100 text-center">
                          <span className="font-bold text-[10px] tracking-wider uppercase text-purple-800 bg-purple-100 px-3 py-1 rounded-full border border-purple-300">
                            RTO
                          </span>
                        </td>

                        {/* Return Date */}
                        <td className="py-3.5 px-3 border-r border-slate-100 text-center text-[11px] text-slate-500 font-medium">
                          {formatDate(r.return_date)}
                        </td>

                        {/* Action (Undo Return) */}
                        <td className="py-3.5 px-3 text-center">
                          <button
                            onClick={() => setConfirmUndoOrder(r)}
                            disabled={undoingId === (r.id || r.order_id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <RotateCcw className={`w-3 h-3 ${undoingId === (r.id || r.order_id) ? 'animate-spin' : ''}`} />
                            {t('orders.undoReturn')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* CONFIRMATION MODAL FOR UNDO RETURN */}
        {confirmUndoOrder && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white border border-purple-100 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 shadow-xs">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{t('returns.undoReturnConfirmation')}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    {t('returns.undoReturnConfirmMessage')} <span className="font-mono font-bold text-slate-800">#{confirmUndoOrder.order_id}</span>?
                  </p>
                </div>
              </div>

              <div className="bg-purple-50/60 rounded-2xl p-3.5 border border-purple-100 space-y-1.5 text-xs text-slate-600 font-medium">
                <div className="flex justify-between">
                  <span>{t('fields.skuId')}:</span>
                  <span className="font-mono font-bold text-purple-950">{confirmUndoOrder.sku_id}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('returns.returnedCategory')}:</span>
                  <span className="font-bold text-amber-800">
                    {confirmUndoOrder.return_type === 'RTO_RETURN' ? t('orders.rtoReturn') : t('orders.customerReturn')}
                  </span>
                </div>
                <p className="text-[11px] text-purple-900/80 pt-1 border-t border-purple-200/50">
                  {t('returns.undoReturnRestoreNotice')}
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setConfirmUndoOrder(null)}
                  className="px-4 py-2 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleConfirmUndoReturn}
                  className="px-5 py-2 rounded-full text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md transition-all cursor-pointer"
                >
                  {t('returns.confirmUndoReturn')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* UPLOAD RETURN LABEL POPUP MODAL */}
        {showUploadModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white border border-purple-100 rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-7 space-y-6 relative max-h-[90vh] overflow-y-auto my-auto">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-purple-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/30 shrink-0">
                    <UploadCloud className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">{t('returns.uploadReturnLabel')}</h3>
                    <p className="text-xs text-slate-500 font-medium font-sans">{t('upload.subtitle')}</p>
                  </div>
                </div>

                <button
                  onClick={closeModal}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* STEP 1: SELECT METHOD (Exact 2 Options: 1. Upload Image, 2. Capture Image) */}
              {uploadStep === 'SELECT_METHOD' && (
                <div className="space-y-5">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t('returns.selectReturnLabelSource')}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Option 1: Upload Image */}
                    <div
                      onClick={() => uploadFileInputRef.current?.click()}
                      className="border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/40 hover:bg-purple-50/90 rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 group flex flex-col items-center justify-center space-y-3"
                    >
                      <input
                        type="file"
                        ref={uploadFileInputRef}
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={(e) => e.target.files?.[0] && handleFileSelectForUpload(e.target.files[0])}
                        className="hidden"
                      />
                      <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{t('returns.uploadImage')}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-medium">JPG, JPEG, PNG, WEBP</p>
                      </div>
                    </div>

                    {/* Option 2: Capture Image */}
                    <div
                      onClick={() => startCamera('environment')}
                      className="border-2 border-amber-200 hover:border-amber-400 bg-amber-50/40 hover:bg-amber-50/90 rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 group flex flex-col items-center justify-center space-y-3"
                    >
                      <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                        <Camera className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{t('returns.captureImage')}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Device camera shutter</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2A: UPLOAD IMAGE PREVIEW & PROCESS BUTTON */}
              {uploadStep === 'IMAGE_PREVIEW' && (
                <div className="space-y-5">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t('upload.preview')}:</p>
                  
                  {imagePreview && (
                    <div className="relative aspect-video max-h-56 bg-slate-900 rounded-2xl overflow-hidden border border-purple-100 flex items-center justify-center p-2">
                      <img src={imagePreview} alt="Selected Return Label" className="h-full object-contain rounded-xl" />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => setUploadStep('SELECT_METHOD')}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                    >
                      {t('common.back')}
                    </button>
                    <button
                      onClick={handleProcessImage}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs rounded-full shadow-md shadow-purple-500/25 transition-all hover:scale-105 cursor-pointer"
                    >
                      <span>{t('returns.continueAndProcess')}</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2B: LIVE CAMERA VIEWFINDER */}
              {uploadStep === 'CAMERA_VIEW' && (
                <div className="space-y-4">
                  <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    <div className="absolute inset-6 border-2 border-amber-400/70 rounded-2xl pointer-events-none flex items-center justify-center">
                      <span className="text-[10px] font-mono text-amber-200 bg-slate-900/80 px-3 py-1 rounded-full border border-amber-400/40">
                        {t('returns.positionParcelLabel')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        stopCamera();
                        setUploadStep('SELECT_METHOD');
                      }}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                    >
                      {t('common.cancel')}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleFacingMode}
                        className="px-3 py-2 text-xs font-bold text-purple-800 bg-purple-100 hover:bg-purple-200 rounded-full transition-colors cursor-pointer"
                      >
                        Flip Camera
                      </button>
                      <button
                        onClick={capturePhoto}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white text-xs font-bold rounded-full shadow-md cursor-pointer"
                      >
                        <Camera className="w-4 h-4 text-white" /> {t('returns.captureImage')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2C: CAPTURED CAMERA IMAGE PREVIEW & PROCESS BUTTON */}
              {uploadStep === 'CAMERA_PREVIEW' && (
                <div className="space-y-5">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t('upload.preview')}:</p>
                  
                  {imagePreview && (
                    <div className="relative aspect-video max-h-56 bg-slate-900 rounded-2xl overflow-hidden border border-amber-200 flex items-center justify-center p-2">
                      <img src={imagePreview} alt="Captured Return Label" className="h-full object-contain rounded-xl" />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => startCamera('environment')}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-purple-800 bg-purple-100 hover:bg-purple-200 rounded-full transition-colors cursor-pointer"
                    >
                      <RefreshCcw className="w-3.5 h-3.5" /> {t('returns.retakePhoto')}
                    </button>
                    <button
                      onClick={handleProcessImage}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs rounded-full shadow-md shadow-purple-500/25 transition-all hover:scale-105 cursor-pointer"
                    >
                      <span>{t('returns.continueAndProcess')}</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: PARSING SPINNER */}
              {uploadStep === 'PARSING' && (
                <div className="py-12 text-center space-y-4 bg-purple-50/40 rounded-2xl border border-purple-100">
                  <Loader2 className="w-10 h-10 text-amber-600 animate-spin mx-auto" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{t('returns.extractingOrderId')}</h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium">{t('returns.searchingSupabase')}</p>
                  </div>
                </div>
              )}

              {/* STEP 4: INVALID ORDER ID OR DUPLICATE RETURN ERROR */}
              {uploadStep === 'ERROR' && (
                <div className="space-y-5">
                  <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-5 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-rose-900">{returnModalError}</h4>
                      {extractedOrderId && (
                        <p className="text-xs text-rose-700 mt-1 font-mono">
                          {t('fields.orderId')}: <span className="font-bold">{extractedOrderId}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => setUploadStep('SELECT_METHOD')}
                      className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-full shadow-md transition-colors cursor-pointer"
                    >
                      {t('common.back')}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5: MATCH FOUND - SHOW MATCHED ORDER DETAILS & SELECT RETURN TYPE */}
              {uploadStep === 'MATCH_FOUND' && matchedOrder && (
                <div className="space-y-6">
                  {/* Matched Order Details Box */}
                  <div className="bg-emerald-50/80 rounded-2xl p-5 border border-emerald-200/80 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2.5">
                      <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-600" /> {t('returns.orderFoundInSupabase')}
                      </span>
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2.5 py-0.5 rounded-full font-extrabold">{t('returns.verifiedMatch')}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                        <span className="text-[11px] text-slate-500 font-medium block">{t('fields.orderId')}</span>
                        <span className="font-mono font-extrabold text-slate-900 text-sm">{matchedOrder.order_id}</span>
                      </div>

                      <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                        <span className="text-[11px] text-slate-500 font-medium block">{t('fields.customerName')}</span>
                        <span className="font-bold text-slate-900">{matchedOrder.customer_name || 'N/A'}</span>
                      </div>

                      <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                        <span className="text-[11px] text-slate-500 font-medium block">{t('fields.skuId')}</span>
                        <span className="font-mono font-bold text-purple-950">{matchedOrder.sku_id || 'N/A'}</span>
                      </div>

                      <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                        <span className="text-[11px] text-slate-500 font-medium block">{t('fields.quantity')}</span>
                        <span className="font-bold text-slate-900">{matchedOrder.quantity || 1}</span>
                      </div>

                      <div className="col-span-2 bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                        <span className="text-[11px] text-slate-500 font-medium block">{t('fields.productName')}</span>
                        <span className="font-bold text-slate-900">{matchedOrder.product_name || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Return Delivery Charge input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t('returns.deliveryChargeForCustomerReturn')}
                    </label>
                    <input
                      type="number"
                      value={customDeliveryCharge}
                      onChange={(e) => setCustomDeliveryCharge(e.target.value)}
                      placeholder="10"
                      className="w-full sm:w-48 bg-white border border-purple-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:border-purple-400 focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">{t('returns.deliveryChargeRtoNote')}</p>
                  </div>

                  {/* SELECT RETURN TYPE BUTTONS */}
                  <div>
                    <p className="text-xs font-bold text-slate-900 mb-3">{t('returns.selectReturnType')}:</p>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        disabled={processingReturn}
                        onClick={() => handleSaveReturnFromModal('CUSTOMER_RETURN')}
                        className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950 transition-all group cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        <RotateCcw className="w-6 h-6 text-amber-700 mb-1.5 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-extrabold">{t('orders.customerReturn')}</span>
                        <span className="text-[10px] text-amber-800 font-medium text-center mt-0.5">{t('returns.customerReturnLossNotice', { amount: customDeliveryCharge || 10 })}</span>
                      </button>

                      <button
                        type="button"
                        disabled={processingReturn}
                        onClick={() => handleSaveReturnFromModal('RTO_RETURN')}
                        className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-950 transition-all group cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        <Truck className="w-6 h-6 text-purple-700 mb-1.5 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-extrabold">{t('orders.rtoReturn')}</span>
                        <span className="text-[10px] text-purple-800 font-medium text-center mt-0.5">{t('orders.returnToOriginZeroLoss')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}

