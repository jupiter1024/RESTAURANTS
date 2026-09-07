import React, { useEffect, useRef, useState } from 'react';

interface PdfPageViewerProps {
  dataUrl: string;
  onPageClick?: (pageCanvasData: string) => void;
}

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

export const PdfPageViewer: React.FC<PdfPageViewerProps> = ({ dataUrl, onPageClick }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [viewMode, setViewMode] = useState<'single' | 'stacked'>('stacked');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<any>(null);

  // 1. Ensure PDF.js script is loaded
  useEffect(() => {
    let isMounted = true;

    const loadPdfJs = async () => {
      if (window.pdfjsLib) {
        return window.pdfjsLib;
      }

      return new Promise((resolve, reject) => {
        const existingScript = document.getElementById('pdfjs-script');
        if (existingScript) {
          existingScript.addEventListener('load', () => resolve(window.pdfjsLib));
          return;
        }

        const script = document.createElement('script');
        script.id = 'pdfjs-script';
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = () => {
          if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            resolve(window.pdfjsLib);
          } else {
            reject(new Error('PDF.js failed to load'));
          }
        };
        script.onerror = () => reject(new Error('Failed to load PDF script'));
        document.head.appendChild(script);
      });
    };

    setLoading(true);
    setError('');

    loadPdfJs()
      .then((pdfjs) => {
        return pdfjs.getDocument(dataUrl).promise;
      })
      .then((pdfDoc) => {
        if (!isMounted) return;
        pdfDocRef.current = pdfDoc;
        setNumPages(pdfDoc.numPages);
        setCurrentPage(1);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('PDF load error:', err);
        setError('Could not render PDF directly.');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [dataUrl]);

  // Render single page
  useEffect(() => {
    if (!pdfDocRef.current || viewMode !== 'single' || loading) return;

    let isMounted = true;
    const renderPage = async () => {
      try {
        const page = await pdfDocRef.current.getPage(currentPage);
        if (!isMounted || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        const viewport = page.getViewport({ scale: 1.5 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
      } catch (err) {
        console.error('Error rendering page:', err);
      }
    };

    renderPage();
    return () => { isMounted = false; };
  }, [currentPage, viewMode, loading]);

  // Render stacked pages
  const [stackedPages, setStackedPages] = useState<{ pageNum: number; dataUrl: string }[]>([]);

  useEffect(() => {
    if (!pdfDocRef.current || viewMode !== 'stacked' || loading) return;

    let isMounted = true;
    const renderAllPages = async () => {
      const doc = pdfDocRef.current;
      const pages: { pageNum: number; dataUrl: string }[] = [];

      for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
        if (!isMounted) break;
        try {
          const page = await doc.getPage(pageNum);
          const viewport = page.getViewport({ scale: 1.5 });
          
          const offscreenCanvas = document.createElement('canvas');
          offscreenCanvas.width = viewport.width;
          offscreenCanvas.height = viewport.height;
          const ctx = offscreenCanvas.getContext('2d');

          if (ctx) {
            await page.render({ canvasContext: ctx, viewport }).promise;
            pages.push({
              pageNum,
              dataUrl: offscreenCanvas.toDataURL('image/png'),
            });
          }
        } catch (err) {
          console.error(`Error rendering page ${pageNum}:`, err);
        }
      }

      if (isMounted) {
        setStackedPages(pages);
      }
    };

    renderAllPages();
    return () => { isMounted = false; };
  }, [viewMode, loading]);

  if (loading) {
    return (
      <div className="pdf-viewer-loading">
        <div className="pdf-spinner" />
        <p>Loading PDF pages...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pdf-viewer-fallback">
        <iframe src={dataUrl} className="cv-pdf-frame" title="Menu PDF" />
      </div>
    );
  }

  return (
    <div className="pdf-page-viewer" ref={containerRef}>
      {/* Controls Header */}
      <div className="pdf-controls">
        <div className="pdf-page-indicator">
          <span className="pdf-badge">PDF Menu</span>
          <span>{numPages} Page{numPages > 1 ? 's' : ''}</span>
        </div>

        <div className="pdf-view-toggle">
          <button
            className={`pdf-toggle-btn ${viewMode === 'stacked' ? 'active' : ''}`}
            onClick={() => setViewMode('stacked')}
          >
            All Pages
          </button>
          <button
            className={`pdf-toggle-btn ${viewMode === 'single' ? 'active' : ''}`}
            onClick={() => setViewMode('single')}
          >
            Single Page
          </button>
        </div>
      </div>

      {/* Stacked Pages View */}
      {viewMode === 'stacked' && (
        <div className="pdf-stacked-list">
          {stackedPages.map((p) => (
            <div
              key={p.pageNum}
              className="pdf-page-card"
              onClick={() => onPageClick?.(p.dataUrl)}
            >
              <div className="pdf-page-number">Page {p.pageNum} of {numPages}</div>
              <img src={p.dataUrl} alt={`Menu page ${p.pageNum}`} className="pdf-page-img" />
            </div>
          ))}
        </div>
      )}

      {/* Single Page View */}
      {viewMode === 'single' && (
        <div className="pdf-single-view">
          <div className="pdf-single-canvas-wrap">
            <canvas ref={canvasRef} className="pdf-canvas" />
          </div>

          {numPages > 1 && (
            <div className="pdf-nav-bar">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="pdf-nav-btn"
              >
                ← Previous
              </button>
              <span className="pdf-nav-counter">
                Page {currentPage} of {numPages}
              </span>
              <button
                disabled={currentPage >= numPages}
                onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                className="pdf-nav-btn"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
