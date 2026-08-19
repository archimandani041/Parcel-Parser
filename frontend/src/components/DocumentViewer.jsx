import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCw, RefreshCw, ExternalLink, FileText } from 'lucide-react';

export default function DocumentViewer({ fileUrl, fileName, fileType, activePage = 1 }) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const isPdf = fileType?.toLowerCase().includes('pdf') || fileName?.toLowerCase().endsWith('.pdf');
  const pdfUrlWithPage = (isPdf && fileUrl) ? `${fileUrl}#page=${activePage}` : fileUrl;

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Control Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/70 border-b border-slate-800">
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
          {fileUrl && (
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
            className="w-full h-full min-h-[500px] rounded-lg border border-slate-800"
          />
        ) : (
          <div className="transition-transform duration-200 ease-out flex items-center justify-center">
            <img
              src={fileUrl}
              alt="Parcel Label Document"
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
