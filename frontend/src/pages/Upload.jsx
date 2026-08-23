import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { uploadParcelLabels } from '../services/api';
import { formatBytes } from '../utils/formatters';
import { 
  UploadCloud, 
  FileText, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Cpu, 
  ShieldCheck,
  ArrowRight,
  Sparkles,
  FileCheck2,
  Trash2,
  Camera,
  RefreshCw,
  Zap,
  Image as ImageIcon
} from 'lucide-react';

export default function Upload() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingState, setProcessingState] = useState('IDLE'); // IDLE, UPLOADING, ANALYZING, EXTRACTING, VALIDATING, COMPLETED, FAILED
  const [errorMessage, setErrorMessage] = useState(null);
  const [uploadedResults, setUploadedResults] = useState([]);
  const fileInputRef = useRef(null);
  const mobileCameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const navigate = useNavigate();

  // Camera Capture state
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [cameraError, setCameraError] = useState(null);

  const startCamera = async (mode = facingMode) => {
    setCameraError(null);
    setShowCameraModal(true);
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      setCameraStream(stream);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error('Camera Access Error:', err);
      setCameraError('Camera access denied or unavailable. Please check browser permissions.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
    setCameraError(null);
  };

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const captureCameraPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const fileName = `parcel_label_camera_${Date.now()}.jpg`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });
      Object.assign(file, { _isPdf: false });

      setSelectedFiles(prev => [...prev, file]);
      stopCamera();
    }, 'image/jpeg', 0.92);
  };

  const handleFileSelect = (files) => {
    const validFiles = Array.from(files).filter(file => {
      const isAllowed = file.type.startsWith('image/') || file.type === 'application/pdf' || file.name.match(/\.(jpg|jpeg|png|webp|bmp|tiff|tif|pdf)$/i);
      return isAllowed;
    });

    if (validFiles.length < files.length) {
      setErrorMessage('Some files were skipped. Only JPG, PNG, WEBP, BMP, TIFF, and PDF formats are supported.');
    } else {
      setErrorMessage(null);
    }

    // Annotate each file with isPdf flag
    const annotated = validFiles.map(f => Object.assign(f, {
      _isPdf: f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    }));

    setSelectedFiles(prev => [...prev, ...annotated]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleStartUpload = async () => {
    if (selectedFiles.length === 0) return;

    setProcessingState('UPLOADING');
    setUploadProgress(10);
    setErrorMessage(null);

    try {
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev < 40) {
            setProcessingState('ANALYZING');
            return prev + 15;
          } else if (prev < 75) {
            setProcessingState('EXTRACTING');
            return prev + 10;
          } else if (prev < 90) {
            setProcessingState('VALIDATING');
            return prev + 5;
          }
          return prev;
        });
      }, 600);

      const res = await uploadParcelLabels(selectedFiles, (percent) => {
        setUploadProgress(Math.min(percent, 95));
      });

      clearInterval(interval);
      setUploadProgress(100);
      setProcessingState('COMPLETED');
      setUploadedResults(res.documents || []);

      if (res.documents && res.documents.length === 1) {
        setTimeout(() => {
          navigate(`/document/${res.documents[0].id}`);
        }, 1200);
      }

    } catch (err) {
      console.error('Upload Error:', err);
      setProcessingState('FAILED');
      setErrorMessage(err.response?.data?.error || err.message || 'Failed to process document extraction.');
    }
  };

  const steps = [
    { id: 'UPLOADING', label: '1. File Ingestion' },
    { id: 'ANALYZING', label: '2. Vision OCR Analysis' },
    { id: 'EXTRACTING', label: '3. Gemini Parsing' },
    { id: 'VALIDATING', label: '4. Data Validation' },
    { id: 'COMPLETED', label: '5. Finished' }
  ];

  const getStepStatusClass = (stepId, currentStep) => {
    const order = ['IDLE', 'UPLOADING', 'ANALYZING', 'EXTRACTING', 'VALIDATING', 'COMPLETED'];
    const currentIndex = order.indexOf(currentStep);
    const stepIndex = order.indexOf(stepId);

    if (currentStep === 'FAILED') return 'text-slate-400 border-slate-200 bg-slate-100';
    if (currentIndex > stepIndex || currentStep === 'COMPLETED') {
      return 'text-emerald-800 border-emerald-300 bg-emerald-100/90 font-bold';
    }
    if (currentIndex === stepIndex) {
      return 'text-purple-900 border-purple-300 bg-purple-100 font-bold ring-2 ring-purple-300/60 animate-pulse';
    }
    return 'text-slate-400 border-purple-100 bg-purple-50/30';
  };

  return (
    <Layout title="Upload Shipping Label">
      <div className="w-full space-y-8 pb-12">
        
        {/* Header Intro */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-purple-100 border border-purple-200 rounded-full text-xs font-bold text-purple-800 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 fill-purple-600" /> Automated Multimodal AI Parser
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Upload parcel label <span className="font-normal text-purple-600">document</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed font-medium">
            Drop shipping waybills, courier bills, or invoices in image or multi-page PDF format. Our Gemini vision engine parses courier data without fixed templates.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-800 p-1 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ACTION CARDS: FILE UPLOAD + DIRECT CAMERA UPLOAD */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Drag & Drop / File Upload */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="ui-card border-2 border-dashed border-purple-200 hover:border-purple-400 bg-white hover:bg-purple-50/40 rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 shadow-xl shadow-purple-900/5 group relative overflow-hidden flex flex-col items-center justify-center min-h-[250px]"
          >
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="image/jpeg,image/png,image/webp,image/bmp,image/tiff,application/pdf,.jpg,.jpeg,.png,.webp,.bmp,.tiff,.tif,.pdf"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-400 via-violet-500 to-indigo-500 flex items-center justify-center mb-4 text-white group-hover:scale-105 transition-transform shadow-md shadow-purple-300/40">
              <UploadCloud className="w-8 h-8" />
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              Browse Files or Drag & Drop
            </h3>
            <p className="text-xs text-slate-500 mb-4 max-w-xs font-medium">
              Upload shipping labels, invoices or PDFs from your device
            </p>

            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-50 border border-purple-200/80 rounded-full text-[11px] text-purple-700 font-mono font-semibold">
              <FileCheck2 className="w-3.5 h-3.5 text-purple-600" />
              JPG • PNG • WEBP • PDF
            </div>
          </div>

          {/* Card 2: Direct Camera Image Capture */}
          <div
            className="ui-card border-2 border-purple-200/90 bg-gradient-to-br from-purple-50/60 via-violet-50/30 to-white rounded-3xl p-8 text-center transition-all duration-300 shadow-xl shadow-purple-900/5 relative overflow-hidden flex flex-col items-center justify-center min-h-[250px]"
          >
            <input
              type="file"
              ref={mobileCameraInputRef}
              accept="image/*"
              capture="environment"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
              className="hidden"
            />

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-500 to-amber-600 flex items-center justify-center mb-4 text-white shadow-md shadow-amber-300/40">
              <Camera className="w-8 h-8" />
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              Direct Camera Upload
            </h3>
            <p className="text-xs text-slate-500 mb-4 max-w-xs font-medium">
              Capture parcel label directly using your webcam or phone camera
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => startCamera('environment')}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-900 hover:bg-purple-950 text-white text-xs font-bold rounded-full shadow-md shadow-purple-900/20 transition-all hover:scale-105 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-amber-400" />
                Open Live Camera
              </button>

              <button
                type="button"
                onClick={() => mobileCameraInputRef.current?.click()}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-bold rounded-full border border-amber-300 transition-all cursor-pointer"
                title="Direct Phone Camera Shutter"
              >
                <Zap className="w-3.5 h-3.5 text-amber-700" />
                Snap Photo
              </button>
            </div>
          </div>

        </div>

        {/* LIVE CAMERA VIEWFINDER MODAL */}
        {showCameraModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full p-6 text-white space-y-4 relative overflow-hidden">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">Live Parcel Label Scanner</h3>
                    <p className="text-[10px] text-slate-400">Align parcel label inside the viewfinder frame</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleFacingMode}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full border border-slate-700 transition-all cursor-pointer text-xs flex items-center gap-1.5"
                    title="Switch Camera (Front/Rear)"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Flip</span>
                  </button>

                  <button
                    onClick={stopCamera}
                    className="p-2 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded-full border border-slate-700 hover:border-rose-900 transition-all cursor-pointer"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>

              {cameraError ? (
                <div className="py-16 text-center space-y-3 bg-slate-950/60 rounded-2xl border border-slate-800">
                  <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
                  <p className="text-xs text-rose-300 font-medium px-4">{cameraError}</p>
                  <button
                    onClick={() => startCamera()}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-xs font-bold cursor-pointer"
                  >
                    Retry Camera
                  </button>
                </div>
              ) : (
                <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Viewfinder Target Guidelines */}
                  <div className="absolute inset-8 border-2 border-purple-400/60 rounded-2xl pointer-events-none flex items-center justify-center">
                    <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-purple-400" />
                    <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-purple-400" />
                    <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-purple-400" />
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-purple-400" />
                    <span className="text-[10px] font-mono text-purple-200/80 bg-slate-900/60 px-2 py-0.5 rounded-full border border-purple-400/30">
                      Align Parcel Label
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={stopCamera}
                  className="px-5 py-2 rounded-full text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Cancel
                </button>

                {!cameraError && (
                  <button
                    onClick={captureCameraPhoto}
                    className="flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs rounded-full shadow-lg shadow-purple-500/25 transition-all hover:scale-105 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    Capture Photo & Extract
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Selected Files Preview List */}
        {selectedFiles.length > 0 && (
          <div className="ui-card p-6 sm:p-8 space-y-6 shadow-xl">
            
            <div className="flex items-center justify-between border-b border-purple-100 pb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-600" /> Selected Documents ({selectedFiles.length})
                </h4>
                <p className="text-xs text-slate-500 font-medium">Ready for AI multimodal extraction</p>
              </div>

              {processingState === 'IDLE' && (
                <button
                  onClick={() => setSelectedFiles([])}
                  className="text-xs font-bold text-slate-500 hover:text-rose-600 flex items-center gap-1 transition-colors px-3 py-1.5 rounded-full hover:bg-rose-50 border border-transparent hover:border-rose-200"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear All
                </button>
              )}
            </div>

            {/* File List */}
            <div className="space-y-3">
              {selectedFiles.map((file, idx) => {
                const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
                const isPdf = file._isPdf || file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
                return (
                  <div key={idx} className="flex items-center justify-between bg-purple-50/40 border border-purple-200/80 p-4 rounded-2xl hover:bg-purple-100/50 transition-all">
                    <div className="flex items-center gap-3.5 truncate pr-4">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs uppercase shrink-0 font-mono border ${
                        isPdf
                          ? 'bg-rose-100 border-rose-200 text-rose-700'
                          : 'bg-purple-100 border-purple-200 text-purple-700'
                      }`}>
                        {ext}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-800 truncate">{file.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[10px] text-slate-500 font-mono font-medium">{formatBytes(file.size)}</p>
                          {isPdf && (
                            <span className="text-[9px] font-bold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              PDF · Text+Vision Extraction
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {processingState === 'IDLE' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(idx);
                        }}
                        className="text-slate-400 hover:text-rose-600 p-2 rounded-full hover:bg-purple-100 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Processing Progress Stepper */}
            {processingState !== 'IDLE' && (
              <div className="pt-5 border-t border-purple-100 space-y-4">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-purple-800 flex items-center gap-2">
                    {processingState === 'COMPLETED' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                    )}
                    Pipeline State: <span className="text-slate-900 uppercase font-mono">{processingState}</span>
                  </span>
                  <span className="text-purple-700 font-mono font-bold">{uploadProgress}%</span>
                </div>

                <div className="w-full h-2.5 bg-purple-100 rounded-full overflow-hidden border border-purple-200">
                  <div
                    className="h-full bg-gradient-to-r from-purple-400 via-violet-500 to-indigo-500 transition-all duration-300 shadow-md"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>

                {/* Processing Steps Horizontal Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
                  {steps.map((step) => (
                    <div
                      key={step.id}
                      className={`p-2.5 rounded-xl border text-[11px] text-center transition-all ${getStepStatusClass(step.id, processingState)}`}
                    >
                      {step.label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3">
              {processingState === 'COMPLETED' && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedFiles([]);
                      setProcessingState('IDLE');
                      setUploadProgress(0);
                    }}
                    className="px-5 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold rounded-full transition-colors border border-purple-200"
                  >
                    Upload More Labels
                  </button>
                  {uploadedResults.length > 0 && (
                    <button
                      onClick={() => navigate(`/document/${uploadedResults[0].id}`)}
                      className="flex items-center gap-2 px-6 py-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 text-xs font-bold rounded-full transition-all border border-emerald-300 shadow-xs cursor-pointer"
                    >
                      Inspect Extracted Label <ArrowRight className="w-4 h-4 text-emerald-700" />
                    </button>
                  )}
                </div>
              )}

              {processingState === 'IDLE' && (
                <button
                  onClick={handleStartUpload}
                  className="pill-button-pastel flex items-center gap-2.5 px-8 py-3.5 font-bold text-xs shadow-xl hover:scale-105"
                >
                  <Cpu className="w-4 h-4 text-purple-100" />
                  Run AI Extraction
                </button>
              )}
            </div>

          </div>
        )}

      </div>
    </Layout>
  );
}

