import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import AIProcessingScanner from '../components/animations/AIProcessingScanner';
import AutoTranslate from '../components/AutoTranslate';
import {
  getReturnsOverview,
  updateReturnDeliveryCharge,
  undoReturnOrderRecord,
  getOrderRecords,
  scanReturnLabelFile,
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
  RefreshCcw,
  TrendingDown
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
      // Call Gemini Vision Parser API in-memory (scan-only, no DB record creation)
      const res = await scanReturnLabelFile(selectedFile);

      // Handle API-level failure (e.g. invalid document)
      if (res.success === false && res.error) {
        setReturnModalError(res.error);
        setUploadStep('ERROR');
        return;
      }

      const doc = res.documents && res.documents[0];
      const json = doc?.structured_json || {};

      // Check if document was rejected as invalid
      if (json.is_valid_document === false) {
        setReturnModalError(json.rejection_reason || 'This image does not contain a valid shipping label or order document.');
        setUploadStep('ERROR');
        return;
      }

      let extractedId = null;
      // New simplified schema: order_id directly on label
      if (Array.isArray(json.labels) && json.labels.length > 0) {
        const l = json.labels[0];
        extractedId = l.order_id || l.order?.order_id || l.order?.order_number || null;
      }
      // Fallback to old schema / top-level
      if (!extractedId) {
        extractedId = json.order_id || json.order?.order_id || json.order?.order_number || json.orderId || null;
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
          <div className="fixed bottom-6 right-6 z-50 text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-fade-in" style={{ background: 'linear-gradient(135deg, var(--color-navy), var(--color-deep-purple))', color: 'var(--color-blush-light)', border: '1px solid rgba(232,188,185,0.1)' }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--color-amber)', color: 'var(--color-navy)' }}>✓</div>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* HEADER & CONTROLS */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-6 rounded-3xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm shrink-0" style={{ background: 'var(--color-accent-light)', border: '1px solid var(--color-accent-muted)', color: 'var(--color-accent)' }}>
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight font-serif" style={{ color: 'var(--color-navy)' }}>
                {t('returns.title')} <span className="font-normal" style={{ color: 'var(--color-accent)' }}>{t('returns.titleHighlight')}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap xl:flex-nowrap shrink-0">
            {/* Category Switcher Pill [ Customer Return ] [ RTO Return ] */}
            <div className="p-1 rounded-xl flex items-center gap-1 shrink-0" style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border-light)' }}>
              <button
                id="customer-return-tab-btn"
                onClick={() => setActiveCategory('customer')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer"
                style={activeCategory === 'customer' ? { background: 'linear-gradient(135deg, var(--color-navy), var(--color-deep-purple))', color: 'var(--color-blush-light)', boxShadow: 'var(--shadow-xs)' } : { color: 'var(--color-text-secondary)' }}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {t('orders.customerReturn')}
              </button>

              <button
                id="rto-return-tab-btn"
                onClick={() => setActiveCategory('rto')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer"
                style={activeCategory === 'rto' ? { background: 'linear-gradient(135deg, var(--color-navy), var(--color-deep-purple))', color: 'var(--color-blush-light)', boxShadow: 'var(--shadow-xs)' } : { color: 'var(--color-text-secondary)' }}
              >
                <Truck className="w-3.5 h-3.5" />
                {t('orders.rtoReturn')}
              </button>
            </div>

            {/* Upload Return Label Button */}
            <button
              onClick={() => {
                setShowUploadModal(true);
                setUploadStep('SELECT_METHOD');
              }}
              className="pill-button-dark flex items-center gap-2 px-5 py-2.5 text-xs font-bold hover:scale-105 cursor-pointer shrink-0"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{t('returns.uploadReturnLabel')}</span>
            </button>

            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px] sm:w-60">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
              <input
                id="search-return-input"
                type="text"
                placeholder={t('orders.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl pl-9 pr-4 py-2.5 text-xs transition-all font-medium"
                style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border-light)', color: 'var(--color-text-primary)' }}
              />
            </div>

            {/* Refresh Button */}
            <button
              onClick={loadReturnData}
              disabled={loading}
              className="p-2.5 rounded-xl transition-all disabled:opacity-50 cursor-pointer shrink-0"
              style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border-light)', color: 'var(--color-text-secondary)' }}
              title={t('common.refresh')}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* DYNAMIC SUMMARY CARDS DEPENDING ON CATEGORY */}
        {activeCategory === 'customer' ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Customer Returns */}
            <div className="ui-card p-5 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                <span>{t('returns.customerReturns')}</span>
                <RotateCcw className="w-4 h-4" style={{ color: 'var(--color-warning)' }} />
              </div>
              <p className="text-2xl font-bold font-mono" style={{ color: 'var(--color-warning)' }}>
                {summary.total_customer_returns || customerReturns.length || 0}
              </p>
              <p className="text-[10px] font-medium" style={{ color: 'var(--color-text-muted)' }}>{t('returns.customerReturnParcels')}</p>
            </div>

            {/* Total Returned Quantity */}
            <div className="ui-card p-5 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                <span>{t('stock.custReturnedQty')}</span>
                <Package className="w-4 h-4" style={{ color: 'var(--color-amber)' }} />
              </div>
              <p className="text-2xl font-bold font-mono" style={{ color: 'var(--color-navy)' }}>
                {summary.total_customer_returned_quantity || customerReturns.reduce((acc, r) => acc + (r.quantity || 1), 0)}
              </p>
              <p className="text-[10px] font-medium" style={{ color: 'var(--color-text-muted)' }}>{t('returns.unitsAddedBackToStock')}</p>
            </div>

            {/* Total Customer Return Loss */}
            <div className="ui-card p-5 space-y-1.5" style={{ borderColor: 'var(--color-danger-border)', background: 'var(--color-danger-light)' }}>
              <div className="flex items-center justify-between text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                <span className="font-bold" style={{ color: 'var(--color-rose)' }}>{t('fields.returnLoss', { defaultValue: 'Total Return Loss' })}</span>
                <TrendingDown className="w-4 h-4" style={{ color: 'var(--color-rose)' }} />
              </div>
              <p className="text-2xl font-bold font-mono" style={{ color: 'var(--color-rose)' }}>
                {formatCurrency(
                  summary.total_customer_return_loss != null
                    ? summary.total_customer_return_loss
                    : customerReturns.reduce((acc, r) => acc + (Number(r.return_loss) || Number(r.delivery_boy_charge) || 0), 0)
                )}
              </p>
              <p className="text-[10px] font-medium" style={{ color: 'var(--color-rose)' }}>{t('dashboard.customerReturnLosses', { defaultValue: 'Customer return delivery charges' })}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Total RTO Returns */}
            <div className="ui-card p-5 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                <span>{t('returns.rtoReturns')}</span>
                <Truck className="w-4 h-4" style={{ color: 'var(--color-info)' }} />
              </div>
              <p className="text-2xl font-bold font-mono" style={{ color: 'var(--color-info)' }}>
                {summary.total_rto_returns || rtoReturns.length || 0}
              </p>
              <p className="text-[10px] font-medium" style={{ color: 'var(--color-text-muted)' }}>{t('returns.rtoReturnParcels')}</p>
            </div>

            {/* Total RTO Quantity */}
            <div className="ui-card p-5 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                <span>{t('stock.rtoReturnedQty')}</span>
                <Package className="w-4 h-4" style={{ color: 'var(--color-info)' }} />
              </div>
              <p className="text-2xl font-bold font-mono" style={{ color: 'var(--color-text-primary)' }}>
                {summary.total_rto_returned_quantity || rtoReturns.reduce((acc, r) => acc + (r.quantity || 1), 0)}
              </p>
              <p className="text-[10px] font-medium" style={{ color: 'var(--color-text-muted)' }}>{t('returns.restoredToAvailableStock')}</p>
            </div>
          </div>
        )}

        {/* TABLE VIEW FOR ACTIVE CATEGORY */}
        {activeCategory === 'customer' ? (
          /* CUSTOMER RETURNS TABLE */
          <div className="ui-card overflow-hidden rounded-3xl" style={{ boxShadow: 'var(--shadow-lg)', border: '1px solid var(--color-border-light)' }}>
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto" style={{ color: 'var(--color-rose)' }} />
                <p className="text-xs font-mono font-medium" style={{ color: 'var(--color-text-muted)' }}>{t('returns.loadingCustomerReturns')}</p>
              </div>
            ) : filteredCustomerReturns.length === 0 ? (
              <div className="py-20 text-center space-y-3" style={{ background: 'var(--color-surface-muted)' }}>
                <Inbox className="w-12 h-12 mx-auto" style={{ color: 'var(--color-border-strong)' }} />
                <h4 className="font-semibold text-base" style={{ color: 'var(--color-text-primary)' }}>{t('returns.noCustomerReturnsFound')}</h4>
                <p className="text-xs max-w-sm mx-auto font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  {searchQuery
                    ? t('returns.noCustomerReturnsMatch', { query: searchQuery })
                    : t('returns.noCustomerReturnsHint')}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto" style={{ background: 'var(--color-surface)' }}>
                <table className="w-full text-left border-collapse text-xs min-w-[950px]" id="customer-returns-table">
                  <thead>
                    <tr style={{ background: 'var(--color-surface-muted)', borderBottom: '1px solid var(--color-border-light)', color: 'var(--color-text-muted)' }} className="uppercase tracking-wider font-semibold text-[11px]">
                      <th className="py-4 px-3">{t('fields.orderId')}</th>
                      <th className="py-4 px-3">{t('fields.skuId')}</th>
                      <th className="py-4 px-3">{t('fields.productName')}</th>
                      <th className="py-4 px-2 text-center">{t('fields.quantity')}</th>
                      <th className="py-4 px-3 text-center">{t('fields.purchasePrice')}</th>
                      <th className="py-4 px-3 text-center">{t('fields.sellingPrice')}</th>
                      <th className="py-4 px-3 text-center">{t('fields.deliveryCharge')}</th>
                      <th className="py-4 px-3 text-right">{t('stock.returnLoss')}</th>
                      <th className="py-4 px-3 text-center">{t('fields.returnDate')}</th>
                      <th className="py-4 px-3 text-center">{t('common.action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--color-border-light)' }}>
                    {filteredCustomerReturns.map((r) => {
                      const itemState = editChargeState[r.order_id] || {
                        delivery_boy_charge: r.delivery_boy_charge != null ? r.delivery_boy_charge : '',
                        saving: false,
                        saved: false
                      };

                      return (
                        <tr key={r.id || r.order_id} className="transition-colors">
                          {/* Order ID */}
                          <td className="py-3.5 px-3 font-mono text-xs font-bold select-all" style={{ color: 'var(--color-navy)' }}>
                            {r.order_id}
                          </td>

                          {/* SKU ID */}
                          <td className="py-3.5 px-3">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: 'var(--color-plum)', background: 'rgba(102,37,73,0.06)', border: '1px solid rgba(102,37,73,0.15)' }}>
                              {r.sku_id}
                            </span>
                          </td>

                          {/* Product Name */}
                          <td className="py-3.5 px-3">
                            <span className="text-xs font-semibold line-clamp-2" style={{ color: 'var(--color-text-primary)' }}>
                              {r.product_name ? <AutoTranslate text={r.product_name} /> : '-'}
                            </span>
                          </td>

                          {/* Quantity */}
                          <td className="py-3.5 px-2 text-center font-mono text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                            {r.quantity}
                          </td>

                          {/* Purchase Price */}
                          <td className="py-3.5 px-3 text-center font-mono text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                            {formatCurrency(r.purchase_price)}
                          </td>

                          {/* Selling Price */}
                          <td className="py-3.5 px-3 text-center font-mono text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                            {formatCurrency(r.selling_price)}
                          </td>

                          {/* Delivery Charge Input */}
                          <td className="py-3.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="font-mono font-bold" style={{ color: 'var(--color-text-muted)' }}>₹</span>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                placeholder="0"
                                value={itemState.delivery_boy_charge}
                                onChange={(e) => handleChargeChange(r.order_id, e.target.value)}
                                className="w-16 rounded-lg px-2 py-1 text-xs font-mono text-center outline-none transition-all font-semibold"
                                style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border-light)', color: 'var(--color-text-primary)' }}
                              />
                              <button
                                onClick={() => handleSaveCharge(r.order_id)}
                                disabled={itemState.saving}
                                title={t('common.save')}
                                className={`p-1.5 rounded-lg border transition-all cursor-pointer`}
                                style={itemState.saved
                                  ? { background: 'var(--color-success-light)', color: 'var(--color-success)', border: '1px solid var(--color-success-border)' }
                                  : { background: 'var(--color-accent-light)', color: 'var(--color-rose)', border: '1px solid var(--color-accent-muted)' }}
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
                          <td className="py-3.5 px-3 text-right">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: 'var(--color-rose)', background: 'var(--color-danger-light)', border: '1px solid var(--color-danger-border)' }}>
                              {formatCurrency(r.return_loss)}
                            </span>
                          </td>

                          {/* Return Date */}
                          <td className="py-3.5 px-3 text-center text-[11px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
                            {formatDate(r.return_date)}
                          </td>

                          {/* Action (Undo Return) */}
                          <td className="py-3.5 px-3 text-center">
                            <button
                              onClick={() => setConfirmUndoOrder(r)}
                              disabled={undoingId === (r.id || r.order_id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50"
                              style={{ background: 'var(--color-danger-light)', color: 'var(--color-rose)', border: '1px solid var(--color-danger-border)' }}
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
          <div className="ui-card overflow-hidden rounded-3xl" style={{ boxShadow: 'var(--shadow-lg)', border: '1px solid var(--color-border-light)' }}>
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto" style={{ color: 'var(--color-rose)' }} />
                <p className="text-xs font-mono font-medium" style={{ color: 'var(--color-text-muted)' }}>{t('returns.loadingRtoReturns')}</p>
              </div>
            ) : filteredRtoReturns.length === 0 ? (
              <div className="py-20 text-center space-y-3" style={{ background: 'var(--color-surface-muted)' }}>
                <Inbox className="w-12 h-12 mx-auto" style={{ color: 'var(--color-border-strong)' }} />
                <h4 className="font-semibold text-base" style={{ color: 'var(--color-text-primary)' }}>{t('returns.noRtoReturnsFound')}</h4>
                <p className="text-xs max-w-sm mx-auto font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  {searchQuery
                    ? t('returns.noRtoReturnsMatch', { query: searchQuery })
                    : t('returns.noRtoReturnsHint')}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto" style={{ background: 'var(--color-surface)' }}>
                <table className="w-full text-left border-collapse text-xs min-w-[950px]" id="rto-returns-table">
                  <thead>
                    <tr style={{ background: 'var(--color-surface-muted)', borderBottom: '1px solid var(--color-border-light)', color: 'var(--color-text-muted)' }} className="uppercase tracking-wider font-semibold text-[11px]">
                      <th className="py-4 px-3">{t('fields.orderId')}</th>
                      <th className="py-4 px-3">{t('fields.skuId')}</th>
                      <th className="py-4 px-3">{t('fields.productName')}</th>
                      <th className="py-4 px-2 text-center">{t('fields.quantity')}</th>
                      <th className="py-4 px-3 text-center">{t('fields.purchasePrice')}</th>
                      <th className="py-4 px-3 text-center">{t('fields.sellingPrice')}</th>
                      <th className="py-4 px-3 text-center">{t('orders.returnStatus')}</th>
                      <th className="py-4 px-3 text-center">{t('fields.returnDate')}</th>
                      <th className="py-4 px-3 text-center">{t('common.action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--color-border-light)' }}>
                    {filteredRtoReturns.map((r) => (
                      <tr key={r.id || r.order_id} className="transition-colors">
                        {/* Order ID */}
                        <td className="py-3.5 px-3 font-mono text-xs font-bold select-all" style={{ color: 'var(--color-navy)' }}>
                          {r.order_id}
                        </td>

                        {/* SKU ID */}
                        <td className="py-3.5 px-3">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: 'var(--color-plum)', background: 'rgba(102,37,73,0.06)', border: '1px solid rgba(102,37,73,0.15)' }}>
                            {r.sku_id}
                          </span>
                        </td>

                        {/* Product Name */}
                        <td className="py-3.5 px-3">
                          <span className="text-xs font-semibold line-clamp-2" style={{ color: 'var(--color-text-primary)' }}>
                            {r.product_name ? <AutoTranslate text={r.product_name} /> : '-'}
                          </span>
                        </td>

                        {/* Quantity */}
                        <td className="py-3.5 px-2 text-center font-mono text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                          {r.quantity}
                        </td>

                        {/* Purchase Price */}
                        <td className="py-3.5 px-3 text-center font-mono text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          {formatCurrency(r.purchase_price)}
                        </td>

                        {/* Selling Price */}
                        <td className="py-3.5 px-3 text-center font-mono text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          {formatCurrency(r.selling_price)}
                        </td>

                        {/* Return Type Badge */}
                        <td className="py-3.5 px-3 text-center">
                          <span className="font-bold text-[10px] tracking-wider uppercase px-3 py-1 rounded-full" style={{ color: 'var(--color-deep-purple)', background: 'var(--color-info-light)', border: '1px solid var(--color-info-border)' }}>
                            RTO
                          </span>
                        </td>

                        {/* Return Date */}
                        <td className="py-3.5 px-3 text-center text-[11px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
                          {formatDate(r.return_date)}
                        </td>

                        {/* Action (Undo Return) */}
                        <td className="py-3.5 px-3 text-center">
                          <button
                            onClick={() => setConfirmUndoOrder(r)}
                            disabled={undoingId === (r.id || r.order_id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50"
                            style={{ background: 'var(--color-danger-light)', color: 'var(--color-rose)', border: '1px solid var(--color-danger-border)' }}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" style={{ background: 'rgba(29,26,57,0.5)', backdropFilter: 'blur(4px)' }}>
            <div className="rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs" style={{ background: 'var(--color-amber-muted)', border: '1px solid var(--color-warning-border)', color: 'var(--color-amber)' }}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold" style={{ color: 'var(--color-navy)' }}>{t('returns.undoReturnConfirmation')}</h3>
                  <p className="text-xs font-medium mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    {t('returns.undoReturnConfirmMessage')} <span className="font-mono font-bold" style={{ color: 'var(--color-text-primary)' }}>#{confirmUndoOrder.order_id}</span>?
                  </p>
                </div>
              </div>

              <div className="rounded-2xl p-3.5 space-y-1.5 text-xs font-medium" style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border-light)', color: 'var(--color-text-secondary)' }}>
                <div className="flex justify-between">
                  <span>{t('fields.skuId')}:</span>
                  <span className="font-mono font-bold" style={{ color: 'var(--color-navy)' }}>{confirmUndoOrder.sku_id}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('returns.returnedCategory')}:</span>
                  <span className="font-bold" style={{ color: 'var(--color-deep-purple)' }}>
                    {confirmUndoOrder.return_type === 'RTO_RETURN' ? t('orders.rtoReturn') : t('orders.customerReturn')}
                  </span>
                </div>
                <p className="text-[11px] pt-1" style={{ color: 'var(--color-text-secondary)', borderTop: '1px solid var(--color-border-light)' }}>
                  {t('returns.undoReturnRestoreNotice')}
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setConfirmUndoOrder(null)}
                  className="px-4 py-2 rounded-full text-xs font-bold transition-colors cursor-pointer"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleConfirmUndoReturn}
                  className="pill-button-dark px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  {t('returns.confirmUndoReturn')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* UPLOAD RETURN LABEL POPUP MODAL */}
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in" style={{ background: 'rgba(29,26,57,0.65)', backdropFilter: 'blur(8px)' }}>
            <div className="rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-7 space-y-6 relative max-h-[90vh] overflow-y-auto my-auto" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>

              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md shrink-0" style={{ background: 'linear-gradient(135deg, var(--color-navy), var(--color-deep-purple))', boxShadow: '0 4px 12px rgba(29,26,57,0.25)' }}>
                    <UploadCloud className="w-5 h-5" style={{ color: 'var(--color-blush-light)' }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold tracking-tight font-serif" style={{ color: 'var(--color-navy)' }}>{t('returns.uploadReturnLabel')}</h3>
                    <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{t('upload.subtitle')}</p>
                  </div>
                </div>

                <button
                  onClick={closeModal}
                  className="p-2 rounded-full transition-colors cursor-pointer" style={{ color: 'var(--color-text-muted)' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* STEP 1: SELECT METHOD (Exact 2 Options: 1. Upload Image, 2. Capture Image) */}
              {uploadStep === 'SELECT_METHOD' && (
                <div className="space-y-5">
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-navy)' }}>{t('returns.selectReturnLabelSource')}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Option 1: Upload Image */}
                    <div
                      onClick={() => uploadFileInputRef.current?.click()}
                      className="rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 group flex flex-col items-center justify-center space-y-3"
                      style={{ border: '2px dashed var(--color-border-strong)', background: 'var(--color-surface-muted)' }}
                    >
                      <input
                        type="file"
                        ref={uploadFileInputRef}
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={(e) => e.target.files?.[0] && handleFileSelectForUpload(e.target.files[0])}
                        className="hidden"
                      />
                      <div className="w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform" style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent)', border: '1px solid var(--color-accent-muted)' }}>
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>{t('returns.uploadImage')}</h4>
                        <p className="text-[11px] mt-0.5 font-medium" style={{ color: 'var(--color-text-muted)' }}>JPG, JPEG, PNG, WEBP</p>
                      </div>
                    </div>

                    {/* Option 2: Capture Image */}
                    <div
                      onClick={() => startCamera('environment')}
                      className="rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 group flex flex-col items-center justify-center space-y-3"
                      style={{ border: '2px solid var(--color-border-light)', background: 'var(--color-surface-warm)' }}
                    >
                      <div className="w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs" style={{ background: 'var(--color-amber-muted)', color: 'var(--color-amber)', border: '1px solid var(--color-warning-border)' }}>
                        <Camera className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>{t('returns.captureImage')}</h4>
                        <p className="text-[11px] mt-0.5 font-medium" style={{ color: 'var(--color-text-muted)' }}>Device camera shutter</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2A: UPLOAD IMAGE PREVIEW & PROCESS BUTTON */}
              {uploadStep === 'IMAGE_PREVIEW' && (
                <div className="space-y-5">
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-navy)' }}>{t('upload.preview')}:</p>

                  {imagePreview && (
                    <div className="relative aspect-video max-h-56 rounded-2xl overflow-hidden flex items-center justify-center p-2" style={{ background: 'var(--color-navy)', border: '1px solid var(--color-border-light)' }}>
                      <img src={imagePreview} alt="Selected Return Label" className="h-full object-contain rounded-xl" />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => setUploadStep('SELECT_METHOD')}
                      className="px-4 py-2 text-xs font-bold rounded-full transition-colors cursor-pointer"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {t('common.back')}
                    </button>
                    <button
                      onClick={handleProcessImage}
                      className="pill-button-dark flex items-center gap-2 px-6 py-2.5 font-bold text-xs hover:scale-105 cursor-pointer"
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
                    <div className="relative aspect-video rounded-2xl overflow-hidden flex items-center justify-center" style={{ background: 'var(--color-navy)', border: '1px solid var(--color-navy-light)' }}>
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    <div className="absolute inset-6 rounded-2xl pointer-events-none flex items-center justify-center" style={{ border: '2px solid rgba(174,68,90,0.5)' }}>
                      <span className="text-[10px] font-mono px-3 py-1 rounded-full" style={{ color: 'var(--color-blush)', background: 'rgba(29,26,57,0.8)', border: '1px solid rgba(174,68,90,0.3)' }}>
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
                      className="px-4 py-2 text-xs font-bold rounded-full transition-colors cursor-pointer"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {t('common.cancel')}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleFacingMode}
                        className="px-3 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                        style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-light)' }}
                      >
                        Flip Camera
                      </button>
                      <button
                        onClick={capturePhoto}
                        className="pill-button-dark flex items-center gap-2 px-5 py-2.5 text-xs font-bold cursor-pointer"
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
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-navy)' }}>{t('upload.preview')}:</p>

                  {imagePreview && (
                    <div className="relative aspect-video max-h-56 rounded-2xl overflow-hidden flex items-center justify-center p-2" style={{ background: 'var(--color-navy)', border: '1px solid var(--color-border-light)' }}>
                      <img src={imagePreview} alt="Captured Return Label" className="h-full object-contain rounded-xl" />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => startCamera('environment')}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-light)' }}
                    >
                      <RefreshCcw className="w-3.5 h-3.5" /> {t('returns.retakePhoto')}
                    </button>
                    <button
                      onClick={handleProcessImage}
                      className="pill-button-dark flex items-center gap-2 px-6 py-2.5 font-bold text-xs hover:scale-105 cursor-pointer"
                    >
                      <span>{t('returns.continueAndProcess')}</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: PARSING SPINNER & AI SCANNER */}
              {uploadStep === 'PARSING' && (
                <div className="py-2">
                  <AIProcessingScanner
                    processingState="EXTRACTING"
                    uploadProgress={75}
                    compact={true}
                  />
                </div>
              )}

              {/* STEP 4: INVALID ORDER ID OR DUPLICATE RETURN ERROR */}
              {uploadStep === 'ERROR' && (
                <div className="space-y-5">
                  <div className="rounded-2xl p-5 text-center space-y-3" style={{ background: 'var(--color-danger-light)', border: '2px solid var(--color-danger-border)' }}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto shadow-xs" style={{ background: 'rgba(174,68,90,0.15)', color: 'var(--color-rose)' }}>
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold" style={{ color: 'var(--color-navy)' }}>{returnModalError}</h4>
                      {extractedOrderId && (
                        <p className="text-xs mt-1 font-mono" style={{ color: 'var(--color-rose)' }}>
                          {t('fields.orderId')}: <span className="font-bold">{extractedOrderId}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => setUploadStep('SELECT_METHOD')}
                      className="px-6 py-2.5 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                      style={{ background: 'var(--color-navy)' }}
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
                  <div className="rounded-2xl p-5 space-y-3 shadow-xs" style={{ background: 'var(--color-success-light)', border: '1px solid var(--color-success-border)' }}>
                    <div className="flex items-center justify-between pb-2.5" style={{ borderBottom: '1px solid var(--color-success-border)' }}>
                      <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--color-success)' }}>
                        <Check className="w-4 h-4" style={{ color: 'var(--color-success)' }} /> {t('returns.orderFoundInSupabase')}
                      </span>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full font-extrabold" style={{ background: 'var(--color-success)', color: 'var(--color-surface)' }}>{t('returns.verifiedMatch')}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
                        <span className="text-[11px] font-medium block" style={{ color: 'var(--color-text-muted)' }}>{t('fields.orderId')}</span>
                        <span className="font-mono font-extrabold text-sm" style={{ color: 'var(--color-navy)' }}>{matchedOrder.order_id}</span>
                      </div>

                      <div className="p-2.5 rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
                        <span className="text-[11px] font-medium block" style={{ color: 'var(--color-text-muted)' }}>{t('fields.customerName')}</span>
                        <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{matchedOrder.customer_name || 'N/A'}</span>
                      </div>

                      <div className="p-2.5 rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
                        <span className="text-[11px] font-medium block" style={{ color: 'var(--color-text-muted)' }}>{t('fields.skuId')}</span>
                        <span className="font-mono font-bold" style={{ color: 'var(--color-navy)' }}>{matchedOrder.sku_id || 'N/A'}</span>
                      </div>

                      <div className="p-2.5 rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
                        <span className="text-[11px] font-medium block" style={{ color: 'var(--color-text-muted)' }}>{t('fields.quantity')}</span>
                        <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{matchedOrder.quantity || 1}</span>
                      </div>

                      <div className="col-span-2 p-2.5 rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
                        <span className="text-[11px] font-medium block" style={{ color: 'var(--color-text-muted)' }}>{t('fields.productName')}</span>
                        <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{matchedOrder.product_name || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Return Delivery Charge input */}
                  <div>
                    <label className="block text-xs font-bold mb-1" style={{ color: 'var(--color-navy)' }}>
                      {t('returns.deliveryChargeForCustomerReturn')}
                    </label>
                    <input
                      type="number"
                      value={customDeliveryCharge}
                      onChange={(e) => setCustomDeliveryCharge(e.target.value)}
                      placeholder="10"
                      className="w-full sm:w-48 border rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none"
                      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', color: 'var(--color-text-primary)' }}
                    />
                    <p className="text-[11px] mt-1" style={{ color: 'var(--color-text-muted)' }}>{t('returns.deliveryChargeRtoNote')}</p>
                  </div>

                  {/* SELECT RETURN TYPE BUTTONS */}
                  <div>
                    <p className="text-xs font-bold mb-3" style={{ color: 'var(--color-navy)' }}>{t('returns.selectReturnType')}:</p>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        disabled={processingReturn}
                        onClick={() => handleSaveReturnFromModal('CUSTOMER_RETURN')}
                        className="flex flex-col items-center justify-center p-4 rounded-2xl transition-all group cursor-pointer shadow-xs disabled:opacity-50"
                        style={{ border: '2px solid var(--color-warning-border)', background: 'var(--color-amber-muted)', color: 'var(--color-navy)' }}
                      >
                        <RotateCcw className="w-6 h-6 mb-1.5 group-hover:scale-110 transition-transform" style={{ color: 'var(--color-amber)' }} />
                        <span className="text-xs font-extrabold">{t('orders.customerReturn')}</span>
                        <span className="text-[10px] font-medium text-center mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{t('returns.customerReturnLossNotice', { amount: customDeliveryCharge || 10 })}</span>
                      </button>

                      <button
                        type="button"
                        disabled={processingReturn}
                        onClick={() => handleSaveReturnFromModal('RTO_RETURN')}
                        className="flex flex-col items-center justify-center p-4 rounded-2xl transition-all group cursor-pointer disabled:opacity-50"
                        style={{ border: '2px solid var(--color-border)', background: 'var(--color-surface-muted)', color: 'var(--color-navy)' }}
                      >
                        <Truck className="w-6 h-6 mb-1.5 group-hover:scale-110 transition-transform" style={{ color: 'var(--color-rose)' }} />
                        <span className="text-xs font-extrabold">{t('orders.rtoReturn')}</span>
                        <span className="text-[10px] font-medium text-center mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{t('orders.returnToOriginZeroLoss')}</span>
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

