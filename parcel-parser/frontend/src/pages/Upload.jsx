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
  Trash2
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

    if (currentStep === 'FAILED') return 'text-slate-600 border-slate-800 bg-slate-950/40';
    if (currentIndex > stepIndex || currentStep === 'COMPLETED') {
      return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10 font-bold';
    }
    if (currentIndex === stepIndex) {
      return 'text-indigo-300 border-indigo-500 bg-indigo-500/20 font-bold ring-1 ring-indigo-500/40 animate-pulse';
    }
    return 'text-slate-500 border-slate-800/80 bg-slate-950/60';
  };

  return (
    <Layout title="Upload Shipping Label">
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        
        {/* Header Intro */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/15 border border-indigo-500/30 rounded-full text-xs font-semibold text-indigo-300 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" /> Automated Multimodal AI Parser
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Upload Parcel Label Document</h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
            Drop shipping waybills, courier bills, or invoices in image or multi-page PDF format. Our Gemini vision engine parses courier data without fixed templates.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 text-xs text-rose-300 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span className="font-medium">{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white p-1 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-indigo-500/30 hover:border-indigo-500/70 bg-slate-900/60 hover:bg-slate-900/90 rounded-3xl p-12 text-center cursor-pointer transition-all duration-300 shadow-2xl group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/20 transition-all" />

          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/jpeg,image/png,image/webp,image/bmp,image/tiff,application/pdf,.jpg,.jpeg,.png,.webp,.bmp,.tiff,.tif,.pdf"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />

          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-violet-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-5 text-indigo-400 group-hover:scale-110 transition-transform shadow-xl shadow-indigo-500/10">
            <UploadCloud className="w-10 h-10" />
          </div>

          <h3 className="text-lg font-bold text-white mb-1.5">
            Drop your parcel label or click to browse
          </h3>
          <p className="text-xs text-slate-400 mb-5 max-w-sm mx-auto">
            Supports standard shipping labels, invoices, air waybills & delivery receipts
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-950/90 border border-slate-800 rounded-full text-xs text-slate-400 font-mono shadow-inner">
            <FileCheck2 className="w-3.5 h-3.5 text-indigo-400" />
            JPG • PNG • WEBP • TIFF • PDF
          </div>
        </div>

        {/* Selected Files Preview List */}
        {selectedFiles.length > 0 && (
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 shadow-2xl space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div>
                <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" /> Selected Documents ({selectedFiles.length})
                </h4>
                <p className="text-xs text-slate-400">Ready for AI multimodal extraction</p>
              </div>

              {processingState === 'IDLE' && (
                <button
                  onClick={() => setSelectedFiles([])}
                  className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors px-2.5 py-1 rounded-lg hover:bg-slate-800/60"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear All
                </button>
              )}
            </div>

            {/* File List */}
            <div className="space-y-3">
              {selectedFiles.map((file, idx) => {
                const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
                return (
                  <div key={idx} className="flex items-center justify-between bg-slate-950/80 border border-slate-800/90 p-4 rounded-2xl shadow-inner hover:border-slate-700 transition-all">
                    <div className="flex items-center gap-3.5 truncate pr-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-extrabold text-xs uppercase shrink-0 font-mono">
                        {ext}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-200 truncate">{file.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{formatBytes(file.size)}</p>
                      </div>
                    </div>

                    {processingState === 'IDLE' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(idx);
                        }}
                        className="text-slate-500 hover:text-rose-400 p-2 rounded-xl hover:bg-slate-800 transition-colors"
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
              <div className="pt-5 border-t border-slate-800/80 space-y-4">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-indigo-300 flex items-center gap-2">
                    {processingState === 'COMPLETED' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                    )}
                    Pipeline State: <span className="text-white uppercase font-mono">{processingState}</span>
                  </span>
                  <span className="text-slate-400 font-mono">{uploadProgress}%</span>
                </div>

                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-500 transition-all duration-300 shadow-md shadow-indigo-500/50"
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
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors border border-slate-700"
                  >
                    Upload More Labels
                  </button>
                  {uploadedResults.length > 0 && (
                    <button
                      onClick={() => navigate(`/document/${uploadedResults[0].id}`)}
                      className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl transition-all shadow-lg shadow-emerald-600/30"
                    >
                      Inspect Extracted Label <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {processingState === 'IDLE' && (
                <button
                  onClick={handleStartUpload}
                  className="flex items-center gap-2.5 px-7 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-extrabold text-xs rounded-xl shadow-xl shadow-indigo-600/30 transition-all duration-200 hover:scale-[1.02] border border-indigo-400/30"
                >
                  <Cpu className="w-4 h-4" />
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

