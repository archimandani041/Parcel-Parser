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
  ArrowRight
} from 'lucide-react';

export default function Upload() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingState, setProcessingState] = useState('IDLE'); // IDLE, UPLOADING, ANALYZING, EXTRACTING, VALIDATING, COMPLETED, FAILED
  const [errorMessage, setErrorMessage] = useState(null);
  const [uploadedResults, setUploadedResults] = useState([]);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

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

    setSelectedFiles(prev => [...prev, ...validFiles]);
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
      // Simulate visual stepper feedback during network payload processing
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

      // If single file uploaded, auto navigate to details after 1.2s
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
    { id: 'UPLOADING', label: 'Uploading File' },
    { id: 'ANALYZING', label: 'Analyzing Document Structure' },
    { id: 'EXTRACTING', label: 'Gemini Semantic Extraction' },
    { id: 'VALIDATING', label: 'Deterministic Validation' },
    { id: 'COMPLETED', label: 'Completed' }
  ];

  const getStepStatusClass = (stepId, currentStep) => {
    const order = ['IDLE', 'UPLOADING', 'ANALYZING', 'EXTRACTING', 'VALIDATING', 'COMPLETED'];
    const currentIndex = order.indexOf(currentStep);
    const stepIndex = order.indexOf(stepId);

    if (currentStep === 'FAILED') return 'text-slate-600 border-slate-800';
    if (currentIndex > stepIndex || currentStep === 'COMPLETED') {
      return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10 font-bold';
    }
    if (currentIndex === stepIndex) {
      return 'text-indigo-400 border-indigo-500 bg-indigo-500/10 font-bold animate-pulse';
    }
    return 'text-slate-500 border-slate-800 bg-slate-950/40';
  };

  return (
    <Layout title="Upload Shipping Label">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Intro */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Upload Parcel Label Document</h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Drop any shipping label, invoice, or waybill regardless of format or courier design. Our multimodal AI will parse all key information semantically.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-xs text-rose-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Drag and Drop Zone (Section 20) */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-indigo-500/30 hover:border-indigo-500/60 bg-slate-900/60 hover:bg-slate-900/90 rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 shadow-xl group relative overflow-hidden"
        >
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/jpeg,image/png,image/webp,image/bmp,image/tiff,application/pdf,.jpg,.jpeg,.png,.webp,.bmp,.tiff,.tif,.pdf"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />

          <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4 text-indigo-400 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-base font-bold text-white mb-1">
            Drop your parcel label here
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            or <span className="text-indigo-400 underline font-semibold">Browse Files</span> from your computer
          </p>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-full text-[11px] text-slate-400 font-mono">
            JPG • PNG • WEBP • TIFF • PDF (Multi-page supported)
          </div>
        </div>

        {/* Selected Files Preview List */}
        {selectedFiles.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white">Selected Files ({selectedFiles.length})</h4>
              {processingState === 'IDLE' && (
                <button
                  onClick={() => setSelectedFiles([])}
                  className="text-xs text-slate-400 hover:text-rose-400 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
                  <div className="flex items-center gap-3 truncate pr-4">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs uppercase shrink-0">
                      {file.name.split('.').pop() || 'FILE'}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-200 truncate">{file.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{formatBytes(file.size)}</p>
                    </div>
                  </div>

                  {processingState === 'IDLE' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(idx);
                      }}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Processing Progress Stepper (Section 21) */}
            {processingState !== 'IDLE' && (
              <div className="pt-4 border-t border-slate-800 space-y-4">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-indigo-400 flex items-center gap-1.5">
                    {processingState === 'COMPLETED' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                    )}
                    Processing Status: <span className="text-white uppercase font-mono">{processingState}</span>
                  </span>
                  <span className="text-slate-400 font-mono">{uploadProgress}%</span>
                </div>

                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>

                {/* Processing Steps Horizontal Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
                  {steps.map((step) => (
                    <div
                      key={step.id}
                      className={`p-2 rounded-lg border text-[10px] text-center transition-all ${getStepStatusClass(step.id, processingState)}`}
                    >
                      {step.label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              {processingState === 'COMPLETED' && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedFiles([]);
                      setProcessingState('IDLE');
                      setUploadProgress(0);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors border border-slate-700"
                  >
                    Upload More
                  </button>
                  {uploadedResults.length > 0 && (
                    <button
                      onClick={() => navigate(`/document/${uploadedResults[0].id}`)}
                      className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/30"
                    >
                      Inspect Extracted Label <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {processingState === 'IDLE' && (
                <button
                  onClick={handleStartUpload}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all duration-200 hover:scale-[1.02]"
                >
                  <Cpu className="w-4 h-4" />
                  Start AI Extraction
                </button>
              )}
            </div>

          </div>
        )}

      </div>
    </Layout>
  );
}
