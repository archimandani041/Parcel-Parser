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
    // Backend API base URL for resolving relative file paths
    const backendBase = import.meta.env.VITE_API_BASE_URL
      ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '')
      : '';

    if (useLocalFallback && fileName) {
      return `${backendBase}/api/files/${encodeURIComponent(fileName)}`;
    }
    if (!url) {
      return fileName ? `${backendBase}/api/files/${encodeURIComponent(fileName)}` : '';
    }
    // Absolute URLs (Supabase public URLs, blobs) → use as-is
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
      return url;
    }
    // Relative /uploads/ paths → route through backend API file endpoint
    if (url.includes('/uploads/')) {
      const filename = url.split('/uploads/').pop();
      return `${backendBase}/api/files/${filename}`;
    }
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `${backendBase}${cleanPath}`;
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
              title="Open Original File in New Tab"
              className="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ml-1"
              style={{ background: 'rgba(174,68,90,0.2)', color: 'var(--color-blush)', border: '1px solid rgba(174,68,90,0.4)' }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open File</span>
            </a>
          )}
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto relative min-h-[450px]" style={{ background: 'var(--color-deep-purple)' }}>
        {isPdf ? (
          <div className="w-full h-full min-h-[520px] flex flex-col items-center justify-center">
            <object
              key={pdfUrlWithPage}
              data={pdfUrlWithPage}
              type="application/pdf"
              className="w-full h-full min-h-[520px] rounded-lg"
              style={{ border: '1px solid var(--color-navy-light)' }}
            >
              <iframe
                src={pdfUrlWithPage}
                title={`PDF Document Viewer - Page ${activePage}`}
                className="w-full h-full min-h-[520px] rounded-lg"
                style={{ border: '1px solid var(--color-navy-light)' }}
              >
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 rounded-xl" style={{ background: 'var(--color-navy)', border: '1px solid var(--color-navy-light)' }}>
                  <FileText className="w-12 h-12" style={{ color: 'var(--color-rose)' }} />
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-blush)' }}>
                    Your browser does not support inline PDF viewing.
                  </p>
                  <a
                    href={resolvedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-md"
                    style={{ background: 'var(--color-rose)', color: 'white' }}
                  >
                    <ExternalLink className="w-4 h-4" /> View or Download PDF
                  </a>
                </div>
              </iframe>
            </object>
          </div>
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
                objectFit: 'contain',
                border: '1px solid rgba(232,188,185,0.15)'
              }}
              className="rounded-lg shadow-2xl transition-all duration-300"
            />
          </div>
        )}
      </div>
    </div>
  );
}
