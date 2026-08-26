import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCw, RefreshCw, ExternalLink, FileText, AlertTriangle } from 'lucide-react';

export default function DocumentViewer({ fileUrl, fileName, fileType, activePage = 1 }) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [useLocalFallback, setUseLocalFallback] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setLoadError(false);
    setUseLocalFallback(false);
  };
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const getFullFileUrl = (url) => {
    if (useLocalFallback && fileName) {
      return `/uploads/${encodeURIComponent(fileName)}`;
    }
    if (!url) {
      return fileName ? `/uploads/${encodeURIComponent(fileName)}` : '';
    }
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
      return url;
    }
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return cleanPath;
  };

  const resolvedUrl = getFullFileUrl(fileUrl);
  const isPdf = fileType?.toLowerCase().includes('pdf') || fileName?.toLowerCase().endsWith('.pdf') || resolvedUrl.toLowerCase().includes('.pdf');
  const pdfUrlWithPage = (isPdf && resolvedUrl) ? `${resolvedUrl}#page=${activePage}` : resolvedUrl;

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Control Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-stone-950/70 border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 truncate max-w-[200px]">
          <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="truncate">{fileName || 'Label Document'}</span>
          {isPdf && activePage && (
            <span className="text-[10px] bg-indigo-950 text-indigo-300 font-mono px-2 py-0.5 rounded-full border border-indigo-800/60 ml-1">
              Page {activePage}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1">
          {loadError && fileName && (
            <button
              onClick={() => {
                setUseLocalFallback(true);
                setLoadError(false);
              }}
              className="text-[11px] px-2.5 py-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 rounded font-medium border border-amber-500/30 mr-2 flex items-center gap-1"
            >
              <AlertTriangle className="w-3 h-3 text-amber-400" /> Use Local Server View
            </button>
          )}

          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-400 font-mono w-10 text-center select-none">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-slate-800 my-auto mx-0.5" />
          <button
            onClick={handleRotate}
            title="Rotate Clockwise"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            title="Reset View"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {resolvedUrl && (
            <a
              href={pdfUrlWithPage}
              target="_blank"
              rel="noreferrer"
              title="Open Original File"
              className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-md transition-colors ml-1"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-950/40 overflow-auto relative min-h-[450px]">
        {isPdf ? (
          <iframe
            key={pdfUrlWithPage}
            src={pdfUrlWithPage}
            title={`PDF Document Viewer - Page ${activePage}`}
            onError={() => setLoadError(true)}
            className="w-full h-full min-h-[500px] rounded-lg border border-slate-800"
          />
        ) : (
          <div className="transition-transform duration-200 ease-out flex items-center justify-center">
            <img
              src={resolvedUrl}
              alt="Parcel Label Document"
              onError={() => {
                if (!useLocalFallback && fileName) {
                  setUseLocalFallback(true);
                } else {
                  setLoadError(true);
                }
              }}
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                maxHeight: '650px',
                objectFit: 'contain'
              }}
              className="rounded-lg border border-slate-800/80 shadow-2xl transition-all duration-300"
            />
          </div>
        )}
      </div>
    </div>
  );
}
