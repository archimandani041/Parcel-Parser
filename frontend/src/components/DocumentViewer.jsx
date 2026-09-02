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
    <div className="flex flex-col h-full rounded-2xl overflow-hidden shadow-xl" style={{ background: 'var(--color-navy)', border: '1px solid var(--color-navy-light)' }}>
      {/* Control Bar */}
      <div className="flex items-center justify-between px-4 py-3" style={{ background: 'rgba(29,26,57,0.95)', borderBottom: '1px solid var(--color-navy-light)' }}>
        <div className="flex items-center gap-2 text-xs font-semibold truncate max-w-[200px]" style={{ color: 'var(--color-blush)' }}>
          <FileText className="w-4 h-4 shrink-0" style={{ color: 'var(--color-rose)' }} />
          <span className="truncate">{fileName || 'Label Document'}</span>
          {isPdf && activePage && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full ml-1" style={{ background: 'rgba(174,68,90,0.2)', color: 'var(--color-blush)', border: '1px solid rgba(174,68,90,0.3)' }}>
              Page {activePage}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 rounded-lg p-1" style={{ background: 'var(--color-navy-light)', border: '1px solid rgba(232,188,185,0.1)' }}>
          {loadError && fileName && (
            <button
              onClick={() => {
                setUseLocalFallback(true);
                setLoadError(false);
              }}
              className="text-[11px] px-2.5 py-1 rounded font-medium mr-2 flex items-center gap-1"
              style={{ background: 'rgba(243,159,90,0.2)', color: 'var(--color-amber)', border: '1px solid rgba(243,159,90,0.3)' }}
            >
              <AlertTriangle className="w-3 h-3" style={{ color: 'var(--color-amber)' }} /> Use Local Server View
            </button>
          )}

          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-1.5 rounded-md transition-colors"
            style={{ color: 'var(--color-blush)' }}
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono w-10 text-center select-none" style={{ color: 'var(--color-blush)' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-1.5 rounded-md transition-colors"
            style={{ color: 'var(--color-blush)' }}
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="w-px h-4 my-auto mx-0.5" style={{ background: 'rgba(232,188,185,0.15)' }} />
          <button
            onClick={handleRotate}
            title="Rotate Clockwise"
            className="p-1.5 rounded-md transition-colors"
            style={{ color: 'var(--color-blush)' }}
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            title="Reset View"
            className="p-1.5 rounded-md transition-colors"
            style={{ color: 'var(--color-blush)' }}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {resolvedUrl && (
            <a
              href={pdfUrlWithPage}
              target="_blank"
              rel="noreferrer"
              title="Open Original File"
              className="p-1.5 rounded-md transition-colors ml-1"
              style={{ color: 'var(--color-rose)' }}
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-auto relative min-h-[450px]" style={{ background: 'var(--color-deep-purple)' }}>
        {isPdf ? (
          <iframe
            key={pdfUrlWithPage}
            src={pdfUrlWithPage}
            title={`PDF Document Viewer - Page ${activePage}`}
            onError={() => setLoadError(true)}
            className="w-full h-full min-h-[500px] rounded-lg"
            style={{ border: '1px solid var(--color-navy-light)' }}
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
              className="rounded-lg shadow-2xl transition-all duration-300"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                maxHeight: '650px',
                objectFit: 'contain',
                border: '1px solid rgba(232,188,185,0.15)'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
