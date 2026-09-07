import React, { useState, useRef, useCallback } from 'react';
import { apiAddMenuFile } from '../api/client';


interface MenuUploadScreenProps {
  restaurantId: string;
  onNext: () => void;
  onManualEntry: () => void;
}

interface LocalFile {
  file: File;
  preview: string;
  type: 'image' | 'pdf';
}

export const MenuUploadScreen: React.FC<MenuUploadScreenProps> = ({ restaurantId, onNext, onManualEntry }) => {
  const [uploadedFiles, setUploadedFiles] = useState<LocalFile[]>([]);
  const [imageDragging, setImageDragging] = useState(false);
  const [pdfDragging, setPdfDragging] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return;
    setError('');

    const added: LocalFile[] = [];
    for (const file of Array.from(newFiles)) {
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';

      if (!isImage && !isPdf) {
        setError('Only images (JPG, PNG, WEBP) or PDF files are allowed.');
        continue;
      }
      if (file.size > 20 * 1024 * 1024) {
        setError('File must be under 20MB.');
        continue;
      }

      const preview = isImage ? URL.createObjectURL(file) : '';
      added.push({ file, preview, type: isImage ? 'image' : 'pdf' });
    }

    setUploadedFiles(prev => [...prev, ...added]);
  }, []);

  const handleImageDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setImageDragging(false);
    processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handlePdfDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setPdfDragging(false);
    processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const removeFile = (idx: number) => {
    setUploadedFiles(prev => {
      const updated = [...prev];
      if (updated[idx].preview) URL.revokeObjectURL(updated[idx].preview);
      updated.splice(idx, 1);
      return updated;
    });
  };

  const canContinue = uploadedFiles.length > 0;

  const handleContinue = async () => {
    if (!canContinue) return;
    setUploading(true);
    setError('');
    try {
      // Upload each file directly to R2 via the API
      for (const uf of uploadedFiles) {
        await apiAddMenuFile(restaurantId, uf.file, uf.type);
      }
      onNext();
    } catch (err: unknown) {
      setError((err as Error).message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };


  return (
    <div className="mup-root">
      {/* Animated background orbs */}
      <div className="mup-orb mup-orb-1" />
      <div className="mup-orb mup-orb-2" />
      <div className="mup-orb mup-orb-3" />

      {/* Grid overlay */}
      <div className="mup-grid" />

      {/* Header */}
      <header className="mup-header">
        <div className="mup-logo">
          <div className="mup-logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="url(#lg1)" />
              <path d="M8 12l2.5 2.5L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="lg1" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#f97316" />
                  <stop offset="1" stopColor="#ef4444" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="mup-logo-text">BistroFlow</span>
        </div>

        {/* Step pills */}
        <div className="mup-steps">
          <div className="mup-step mup-step-active">
            <span className="mup-step-num">1</span>
            <span className="mup-step-label">Upload Menu</span>
          </div>
          <div className="mup-step-line" />
          <div className="mup-step mup-step-inactive">
            <span className="mup-step-num">2</span>
            <span className="mup-step-label">Manage</span>
          </div>
          <div className="mup-step-line" />
          <div className="mup-step mup-step-inactive">
            <span className="mup-step-num">3</span>
            <span className="mup-step-label">Go Live</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mup-main">
        {/* Hero text */}
        <div className="mup-hero animate-fade-in">
          <div className="mup-badge">
            <span className="mup-badge-dot" />
            Step 1 of 3
          </div>
          <h1 className="mup-title">
            Upload Your <span className="mup-title-accent">Menu</span>
          </h1>
          <p className="mup-subtitle">
            Upload photos or a PDF of your menu — we'll build your beautiful digital page instantly.
          </p>
        </div>

        {/* Upload zone grid */}
        <div className="mup-upload-grid">
          {/* Image Upload Zone */}
          <div
            className={`mup-upload-zone ${imageDragging ? 'mup-zone-dragging' : ''}`}
            onDragEnter={(e) => { e.preventDefault(); setImageDragging(true); }}
            onDragOver={(e) => { e.preventDefault(); setImageDragging(true); }}
            onDragLeave={() => setImageDragging(false)}
            onDrop={handleImageDrop}
            onClick={() => imageInputRef.current?.click()}
          >
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => processFiles(e.target.files)}
            />

            {/* Zone accent line */}
            <div className="mup-zone-accent mup-zone-accent-img" />

            <div className="mup-zone-icon mup-zone-icon-img">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="3" stroke="url(#imgGrad)" strokeWidth="1.5" />
                <circle cx="8.5" cy="8.5" r="1.5" fill="url(#imgGrad)" />
                <path d="M3 15l5-5 4 4 3-3 6 6" stroke="url(#imgGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="imgGrad" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#f97316" />
                    <stop offset="1" stopColor="#fb923c" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <h3 className="mup-zone-title">Upload Images</h3>
            <p className="mup-zone-desc">
              {imageDragging ? 'Drop your images here!' : 'Drag & drop or click to browse'}
            </p>

            <div className="mup-zone-formats">
              <span className="mup-format-tag">JPG</span>
              <span className="mup-format-tag">PNG</span>
              <span className="mup-format-tag">WEBP</span>
            </div>

            <p className="mup-zone-hint">Perfect for menu photos & photos of printed menus</p>

            <button className="mup-zone-btn mup-zone-btn-img" type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Choose Images
            </button>
          </div>

          {/* Divider */}
          <div className="mup-divider">
            <div className="mup-divider-line" />
            <span className="mup-divider-text">or</span>
            <div className="mup-divider-line" />
          </div>

          {/* PDF Upload Zone */}
          <div
            className={`mup-upload-zone ${pdfDragging ? 'mup-zone-dragging mup-zone-dragging-pdf' : ''}`}
            onDragEnter={(e) => { e.preventDefault(); setPdfDragging(true); }}
            onDragOver={(e) => { e.preventDefault(); setPdfDragging(true); }}
            onDragLeave={() => setPdfDragging(false)}
            onDrop={handlePdfDrop}
            onClick={() => pdfInputRef.current?.click()}
          >
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf"
              style={{ display: 'none' }}
              onChange={(e) => processFiles(e.target.files)}
            />

            <div className="mup-zone-accent mup-zone-accent-pdf" />

            <div className="mup-zone-icon mup-zone-icon-pdf">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="url(#pdfGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 2v6h6M9 13h6M9 17h4" stroke="url(#pdfGrad)" strokeWidth="1.5" strokeLinecap="round" />
                <defs>
                  <linearGradient id="pdfGrad" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#6366f1" />
                    <stop offset="1" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <h3 className="mup-zone-title">Upload PDF</h3>
            <p className="mup-zone-desc">
              {pdfDragging ? 'Drop your PDF here!' : 'Drag & drop or click to browse'}
            </p>

            <div className="mup-zone-formats">
              <span className="mup-format-tag mup-format-tag-pdf">PDF</span>
            </div>

            <p className="mup-zone-hint">Best for professionally designed menu PDFs</p>

            <button className="mup-zone-btn mup-zone-btn-pdf" type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Choose PDF
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mup-error animate-fade-in">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="1.5" />
              <path d="M12 8v4M12 16h.01" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {error}
          </div>
        )}

        {/* Uploaded files preview */}
        {uploadedFiles.length > 0 && (
          <div className="mup-preview-section animate-fade-in">
            <div className="mup-preview-header">
              <div className="mup-preview-count">
                <div className="mup-preview-count-dot" />
                {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''} ready
              </div>
              <span className="mup-preview-hint">Files will be processed when you continue</span>
            </div>

            <div className="mup-preview-grid">
              {uploadedFiles.map((uf, idx) => (
                <div key={idx} className="mup-preview-item">
                  {uf.type === 'image' ? (
                    <img src={uf.preview} alt={uf.file.name} className="mup-preview-img" />
                  ) : (
                    <div className="mup-preview-pdf">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="#6366f1" strokeWidth="1.5" />
                        <path d="M14 2v6h6" stroke="#6366f1" strokeWidth="1.5" />
                      </svg>
                      <span className="mup-preview-pdf-label">PDF</span>
                    </div>
                  )}
                  <div className="mup-preview-info">
                    <span className="mup-preview-name">{uf.file.name}</span>
                    <span className="mup-preview-size">{(uf.file.size / 1024 / 1024).toFixed(1)} MB</span>
                  </div>
                  <button
                    className="mup-preview-remove"
                    onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                    aria-label="Remove file"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA area */}
        <div className="mup-cta">
          {error && (
            <p className="text-red-400 text-sm text-center mb-3">{error}</p>
          )}
          <button
            className={`mup-cta-btn ${canContinue && !uploading ? 'mup-cta-btn-active' : 'mup-cta-btn-disabled'}`}
            onClick={handleContinue}
            disabled={!canContinue || uploading}
          >
            {uploading ? (
              <>
                <span>Uploading…</span>
                <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </>
            ) : (
              <>
                <span>Continue to Preview</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </>
            )}
          </button>

          <button className="mup-skip-btn" onClick={onManualEntry}>
            I'll add menu items manually instead
          </button>
        </div>


        {/* Trust badges */}
        <div className="mup-trust">
          <div className="mup-trust-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Secure upload</span>
          </div>
          <div className="mup-trust-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#f97316" strokeWidth="1.5" />
              <path d="M12 6v6l4 2" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span>Ready in minutes</span>
          </div>
          <div className="mup-trust-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>No tech skills needed</span>
          </div>
        </div>
      </main>
    </div>
  );
};
