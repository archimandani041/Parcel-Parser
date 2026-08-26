import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import { uploadParcelLabels } from '../services/api';
import { formatBytes } from '../utils/formatters';
import {
  UploadCloud, FileText, X, CheckCircle2, AlertCircle, Loader2, Cpu, ShieldCheck,
  ArrowRight, Sparkles, FileCheck2, Trash2, Camera, RefreshCw, Zap, Image as ImageIcon
} from 'lucide-react';

export default function Upload() {
  const { t } = useTranslation();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingState, setProcessingState] = useState('IDLE');
  const [errorMessage, setErrorMessage] = useState(null);
  const [uploadedResults, setUploadedResults] = useState([]);
  const fileInputRef = useRef(null);
  const mobileCameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const navigate = useNavigate();

  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [cameraError, setCameraError] = useState(null);

  const startCamera = async (mode = facingMode) => {
    setCameraError(null); setShowCameraModal(true);
    try {
      if (cameraStream) cameraStream.getTracks().forEach(track => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: mode }, width: { ideal: 1920 }, height: { ideal: 1080 } } });
      setCameraStream(stream);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
    } catch (err) { console.error('Camera Access Error:', err); setCameraError(t('upload.cameraDeniedError')); }
  };

  const stopCamera = () => { if (cameraStream) { cameraStream.getTracks().forEach(track => track.stop()); setCameraStream(null); } setShowCameraModal(false); setCameraError(null); };
  const toggleFacingMode = () => { const next = facingMode === 'environment' ? 'user' : 'environment'; setFacingMode(next); startCamera(next); };

  const captureCameraPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280; canvas.height = video.videoHeight || 720;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `parcel_label_camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
      Object.assign(file, { _isPdf: false });
      setSelectedFiles(prev => [...prev, file]); stopCamera();
    }, 'image/jpeg', 0.92);
  };

  const handleFileSelect = (files) => {
    const validFiles = Array.from(files).filter(file => file.type.startsWith('image/') || file.type === 'application/pdf' || file.name.match(/\.(jpg|jpeg|png|webp|bmp|tiff|tif|pdf)$/i));
    if (validFiles.length < files.length) setErrorMessage(t('upload.fileSkippedError')); else setErrorMessage(null);
    const annotated = validFiles.map(f => Object.assign(f, { _isPdf: f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf') }));
    setSelectedFiles(prev => [...prev, ...annotated]);
  };

  const handleDrop = (e) => { e.preventDefault(); if (e.dataTransfer.files?.length > 0) handleFileSelect(e.dataTransfer.files); };
  const removeFile = (index) => setSelectedFiles(prev => prev.filter((_, i) => i !== index));

  const handleStartUpload = async () => {
    if (selectedFiles.length === 0) return;
    setProcessingState('UPLOADING'); setUploadProgress(10); setErrorMessage(null);
    try {
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev < 40) { setProcessingState('ANALYZING'); return prev + 15; }
          else if (prev < 75) { setProcessingState('EXTRACTING'); return prev + 10; }
          else if (prev < 90) { setProcessingState('VALIDATING'); return prev + 5; }
          return prev;
        });
      }, 600);
      const res = await uploadParcelLabels(selectedFiles, (percent) => setUploadProgress(Math.min(percent, 95)));
      clearInterval(interval); setUploadProgress(100); setUploadedResults(res.documents || []);
      const allDocs = res.documents || [];
      const invalidDocs = allDocs.filter(d => d.is_invalid_document || (d.status === 'FAILED' && d.error_message));
      const failedDocs = allDocs.filter(d => d.status === 'FAILED');
      if (invalidDocs.length > 0 && invalidDocs.length === allDocs.length) { setProcessingState('FAILED'); setErrorMessage(invalidDocs.map(d => d.error_message || 'Invalid document').join('; ')); }
      else if (failedDocs.length > 0 && failedDocs.length === allDocs.length) { setProcessingState('FAILED'); setErrorMessage(failedDocs.map(d => d.error_message || 'Extraction failed').join('; ')); }
      else { setProcessingState('COMPLETED'); if (allDocs.length === 1) setTimeout(() => navigate(`/document/${allDocs[0].id}`), 1200); }
    } catch (err) { console.error('Upload Error:', err); setProcessingState('FAILED'); setErrorMessage(err.response?.data?.error || err.message || t('upload.failedProcessError')); }
  };

  const steps = [
    { id: 'UPLOADING', label: t('upload.step1') }, { id: 'ANALYZING', label: t('upload.step2') },
    { id: 'EXTRACTING', label: t('upload.step3') }, { id: 'VALIDATING', label: t('upload.step4') }, { id: 'COMPLETED', label: t('upload.step5') }
  ];

  const getStepStatusClass = (stepId, currentStep) => {
    const order = ['IDLE', 'UPLOADING', 'ANALYZING', 'EXTRACTING', 'VALIDATING', 'COMPLETED'];
    const ci = order.indexOf(currentStep), si = order.indexOf(stepId);
    if (currentStep === 'FAILED') return { background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border-light)' };
    if (ci > si || currentStep === 'COMPLETED') return { background: 'var(--color-success-light)', color: 'var(--color-success)', border: '1px solid var(--color-success-border)', fontWeight: 700 };
    if (ci === si) return { background: 'var(--color-accent-light)', color: 'var(--color-accent)', border: '1px solid var(--color-accent-muted)', fontWeight: 700 };
    return { background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border-light)' };
  };

  return (
    <Layout title={t('nav.upload')}>
      <div className="w-full space-y-8 pb-12">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold"
            style={{ background: 'var(--color-accent-light)', border: '1px solid var(--color-accent-muted)', color: 'var(--color-accent)' }}>
            <Sparkles className="w-3.5 h-3.5 fill-current" /> {t('upload.badge')}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight font-serif" style={{ color: 'var(--color-brown-dark)' }}>{t('upload.title')}</h1>
          <p className="text-xs sm:text-sm max-w-xl mx-auto leading-relaxed font-medium" style={{ color: 'var(--color-text-tertiary)' }}>{t('upload.subtitle')}</p>
        </div>

        {/* Error */}
        {errorMessage && (
          <div className="rounded-2xl p-4 text-xs flex items-center justify-between shadow-md"
            style={{ background: 'var(--color-danger-light)', border: '1px solid var(--color-danger-border)', color: 'var(--color-danger)' }}>
            <div className="flex items-center gap-3"><AlertCircle className="w-5 h-5 shrink-0" /><span className="font-semibold">{errorMessage}</span></div>
            <button onClick={() => setErrorMessage(null)} className="p-1 rounded-lg"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Upload Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div onDragOver={(e) => e.preventDefault()} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}
            className="ui-card rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 group relative overflow-hidden flex flex-col items-center justify-center min-h-[250px]"
            style={{ border: '2px dashed var(--color-border-strong)' }}>
            <input type="file" ref={fileInputRef} multiple accept="image/jpeg,image/png,image/webp,image/bmp,image/tiff,application/pdf,.jpg,.jpeg,.png,.webp,.bmp,.tiff,.tif,.pdf" onChange={(e) => handleFileSelect(e.target.files)} className="hidden" />
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-white group-hover:scale-105 transition-transform"
              style={{ background: 'var(--color-brown-dark)', boxShadow: '0 8px 24px rgba(61,35,20,0.2)' }}>
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold mb-1" style={{ color: 'var(--color-brown-dark)' }}>{t('upload.browseOrDrag')}</h3>
            <p className="text-xs mb-4 max-w-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>{t('upload.browseSubtitle')}</p>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-mono font-semibold"
              style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border-light)', color: 'var(--color-text-secondary)' }}>
              <FileCheck2 className="w-3.5 h-3.5" /> {t('upload.supportedFormats')}
            </div>
          </div>

          <div className="ui-card rounded-3xl p-8 text-center transition-all duration-300 relative overflow-hidden flex flex-col items-center justify-center min-h-[250px]"
            style={{ background: 'var(--color-surface-warm)', border: '1px solid var(--color-border)' }}>
            <input type="file" ref={mobileCameraInputRef} accept="image/*" capture="environment" onChange={(e) => e.target.files && handleFileSelect(e.target.files)} className="hidden" />
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-white"
              style={{ background: 'var(--color-brown-dark)', boxShadow: '0 8px 24px rgba(61,35,20,0.2)' }}>
              <Camera className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold mb-1" style={{ color: 'var(--color-brown-dark)' }}>{t('upload.directCamera')}</h3>
            <p className="text-xs mb-4 max-w-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>{t('upload.directCameraSubtitle')}</p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => startCamera('environment')}
                className="flex items-center gap-2 px-5 py-2.5 text-white text-xs font-bold rounded-xl shadow-md transition-all hover:scale-105 cursor-pointer"
                style={{ background: 'var(--color-brown-dark)' }}>
                <Camera className="w-4 h-4" style={{ color: 'var(--color-accent-muted)' }} /> {t('upload.openLiveCamera')}
              </button>
              <button type="button" onClick={() => mobileCameraInputRef.current?.click()}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer"
                style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent)', border: '1px solid var(--color-accent-muted)' }}>
                <Zap className="w-3.5 h-3.5" /> {t('upload.snapPhoto')}
              </button>
            </div>
          </div>
        </div>

        {/* Camera Modal */}
        {showCameraModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(45,24,16,0.8)', backdropFilter: 'blur(8px)' }}>
            <div className="max-w-2xl w-full p-6 text-white space-y-4 relative overflow-hidden rounded-3xl shadow-2xl" style={{ background: 'var(--color-brown-dark)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(150,62,27,0.2)', border: '1px solid rgba(150,62,27,0.3)' }}>
                    <Camera className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                  </div>
                  <div><h3 className="text-sm font-bold">{t('upload.liveScannerTitle')}</h3><p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{t('upload.liveScannerSubtitle')}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={toggleFacingMode} className="p-2 rounded-full transition-all cursor-pointer text-xs flex items-center gap-1.5" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}>
                    <RefreshCw className="w-3.5 h-3.5" /><span className="hidden sm:inline">Flip</span>
                  </button>
                  <button onClick={stopCamera} className="p-2 rounded-full transition-all cursor-pointer" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }}>
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
              {cameraError ? (
                <div className="py-16 text-center space-y-3 rounded-2xl" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <AlertCircle className="w-10 h-10 mx-auto" style={{ color: 'var(--color-danger)' }} />
                  <p className="text-xs px-4" style={{ color: '#FF8A80' }}>{cameraError}</p>
                  <button onClick={() => startCamera()} className="px-4 py-2 text-white rounded-full text-xs font-bold cursor-pointer" style={{ background: 'var(--color-accent)' }}>{t('upload.retryCamera')}</button>
                </div>
              ) : (
                <div className="relative aspect-video bg-black rounded-2xl overflow-hidden flex items-center justify-center" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  <div className="absolute inset-8 rounded-2xl pointer-events-none flex items-center justify-center" style={{ border: '2px solid rgba(150,62,27,0.5)' }}>
                    <div className="absolute top-2 left-2 w-4 h-4" style={{ borderTop: '2px solid var(--color-accent)', borderLeft: '2px solid var(--color-accent)' }} />
                    <div className="absolute top-2 right-2 w-4 h-4" style={{ borderTop: '2px solid var(--color-accent)', borderRight: '2px solid var(--color-accent)' }} />
                    <div className="absolute bottom-2 left-2 w-4 h-4" style={{ borderBottom: '2px solid var(--color-accent)', borderLeft: '2px solid var(--color-accent)' }} />
                    <div className="absolute bottom-2 right-2 w-4 h-4" style={{ borderBottom: '2px solid var(--color-accent)', borderRight: '2px solid var(--color-accent)' }} />
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ color: 'rgba(255,255,255,0.7)', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(150,62,27,0.3)' }}>{t('upload.alignParcelLabel')}</span>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between pt-2">
                <button onClick={stopCamera} className="px-5 py-2 rounded-full text-xs font-semibold cursor-pointer" style={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.08)' }}>{t('common.cancel')}</button>
                {!cameraError && (
                  <button onClick={captureCameraPhoto} className="pill-button-dark flex items-center gap-2 px-7 py-3 text-white font-bold text-xs shadow-lg transition-all hover:scale-105 cursor-pointer">
                    <Camera className="w-4 h-4" /> {t('upload.capturePhotoAndExtract')}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="ui-card rounded-3xl p-6 space-y-4 shadow-lg" style={{ background: 'var(--color-surface)' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--color-brown-dark)' }}>
                <FileText className="w-4 h-4" style={{ color: 'var(--color-accent)' }} /> {t('upload.selectedDocuments')} ({selectedFiles.length})
              </h3>
              {processingState === 'IDLE' && (
                <button onClick={() => setSelectedFiles([])} className="text-xs font-semibold hover:underline cursor-pointer" style={{ color: 'var(--color-text-tertiary)' }}>{t('upload.clearAll')}</button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {selectedFiles.map((file, index) => {
                const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
                return (
                  <div key={index} className="flex items-center justify-between p-3 rounded-2xl transition-all"
                    style={{ background: 'var(--color-surface-warm)', border: '1px solid var(--color-border-light)' }}>
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center font-mono text-[10px] font-bold shrink-0"
                        style={ext === 'PDF' ? { background: 'var(--color-danger-light)', color: 'var(--color-danger)', border: '1px solid var(--color-danger-border)' }
                          : { background: 'var(--color-accent-light)', border: '1px solid var(--color-accent-muted)', color: 'var(--color-accent)' }}>{ext}</div>
                      <div className="truncate">
                        <p className="text-xs font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>{file.name}</p>
                        <p className="text-[10px] font-mono" style={{ color: 'var(--color-text-tertiary)' }}>{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    {processingState === 'IDLE' && (
                      <button onClick={() => removeFile(index)} className="p-1 rounded-full hover:bg-slate-200/50 transition-colors cursor-pointer shrink-0" style={{ color: 'var(--color-text-tertiary)' }}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Processing Progress Bar */}
            {processingState !== 'IDLE' && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-2" style={{ color: 'var(--color-accent)' }}>
                    {processingState === 'COMPLETED' ? <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--color-success)' }} /> : <Loader2 className="w-4 h-4 animate-spin" />}
                    {uploadProgressMessage || t('upload.extractingWithAi')}
                  </span>
                  <span className="font-mono font-bold" style={{ color: 'var(--color-accent)' }}>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border-light)' }}>
                  <div className="h-full transition-all duration-300" style={{ width: `${uploadProgress}%`, background: 'linear-gradient(90deg, var(--color-accent), var(--color-accent-hover))', boxShadow: '0 0 8px rgba(150,62,27,0.2)' }} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
                  {steps.map((step) => (
                    <div key={step.id} className="p-2.5 rounded-xl text-[11px] text-center transition-all" style={getStepStatusClass(step.id, processingState)}>{step.label}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3">
              {processingState === 'COMPLETED' && (
                <div className="flex items-center gap-3">
                  <button onClick={() => { setSelectedFiles([]); setProcessingState('IDLE'); setUploadProgress(0); setErrorMessage(null); setUploadedResults([]); }}
                    className="px-5 py-2.5 text-xs font-bold rounded-xl transition-colors"
                    style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-light)' }}>{t('upload.uploadMore')}</button>
                  {uploadedResults.length > 0 && (
                    <button onClick={() => navigate(`/document/${uploadedResults[0].id}`)}
                      className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      style={{ background: 'var(--color-surface-muted)', color: 'var(--color-brown-dark)', border: '1px solid var(--color-border-light)' }}>
                      {t('upload.inspectExtractedLabel')} <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
              {processingState === 'FAILED' && (
                <div className="flex items-center gap-3">
                  <button onClick={() => { setSelectedFiles([]); setProcessingState('IDLE'); setUploadProgress(0); setErrorMessage(null); setUploadedResults([]); }}
                    className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger)', border: '1px solid var(--color-danger-border)' }}>
                    <Trash2 className="w-3.5 h-3.5" /> {t('upload.clearAndRetry', { defaultValue: 'Clear & Upload New' })}
                  </button>
                  <button onClick={() => { setProcessingState('IDLE'); setUploadProgress(0); setErrorMessage(null); setUploadedResults([]); }}
                    className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    style={{ background: 'var(--color-warning-light)', color: 'var(--color-warning)', border: '1px solid var(--color-warning-border)' }}>
                    <RefreshCw className="w-3.5 h-3.5" /> {t('upload.retryExtraction', { defaultValue: 'Retry Extraction' })}
                  </button>
                </div>
              )}
              {processingState === 'IDLE' && (
                <button onClick={handleStartUpload} className="pill-button-dark flex items-center gap-2.5 px-8 py-3.5 font-bold text-xs hover:scale-105">
                  <Cpu className="w-4 h-4" /> {t('upload.runAiExtraction')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
