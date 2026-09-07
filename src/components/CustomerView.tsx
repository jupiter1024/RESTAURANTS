import React, { useState } from 'react';
import type { MenuFile } from '../db/types';
import { PdfPageViewer } from './PdfPageViewer';

interface CustomerViewProps {
  files: MenuFile[];
  restaurantName: string;
  whatsappNumber?: string;
  hotline?: string;
  plan?: 'menu-link' | 'whatsapp';
}

export const CustomerView: React.FC<CustomerViewProps> = ({
  files,
  restaurantName,
  whatsappNumber,
  hotline,
  plan = 'menu-link',
}) => {
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const images = files.filter((f) => f.type === 'image');
  const pdf = files.find((f) => f.type === 'pdf');

  const isWhatsappPlan = plan === 'whatsapp';

  const cleanWaNumber = isWhatsappPlan && whatsappNumber ? whatsappNumber.replace(/[^0-9+]/g, '') : '';
  const waUrl = cleanWaNumber
    ? `https://wa.me/${cleanWaNumber.replace('+', '')}?text=${encodeURIComponent(
        `Hello ${restaurantName}! I would like to place an order from your menu.`
      )}`
    : '';

  const cleanHotline = isWhatsappPlan && hotline ? hotline.replace(/[^0-9+]/g, '') : '';
  const telUrl = cleanHotline ? `tel:${cleanHotline}` : '';

  return (
    <div className="cv-root">
      {/* Header */}
      <div className="cv-header">
        <h1 className="cv-title">{restaurantName}</h1>
        <p className="cv-subtitle">Digital Menu</p>

        {/* Action Header Buttons */}
        {(waUrl || telUrl) && (
          <div className="cv-contact-header-actions">
            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="cv-btn cv-btn-wa"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.119.553 4.11 1.519 5.84L0 24l6.328-1.659A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.849 0-3.585-.494-5.088-1.357l-.365-.21-3.774.99.1008-3.676-.232-.37C1.75 15.86 1.2 14.004 1.2 12 1.2 6.045 6.045 1.2 12 1.2S22.8 6.045 22.8 12 17.955 22 12 22z"/>
                </svg>
                Order on WhatsApp
              </a>
            )}
            {telUrl && (
              <a
                href={telUrl}
                className="cv-btn cv-btn-phone"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                </svg>
                Call Hotline ({hotline})
              </a>
            )}
          </div>
        )}
      </div>

      {files.length === 0 ? (
        <div className="cv-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="#444" strokeWidth="1.5"/>
            <path d="M9 9h6M9 13h4" stroke="#444" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <p>Menu coming soon...</p>
        </div>
      ) : (
        <div className="cv-content-wrap">
          {/* PDF View Page-by-Page */}
          {pdf && (
            <div className="cv-pdf-section">
              <PdfPageViewer
                dataUrl={pdf.dataUrl}
                onPageClick={(pageDataUrl) => setLightboxImg(pageDataUrl)}
              />
            </div>
          )}

          {/* Images View */}
          {images.length > 0 && (
            <div className="cv-images-section">
              {pdf && <h3 className="cv-section-title">Menu Images</h3>}
              <div className="cv-images">
                {images.map((img, idx) => (
                  <div key={img.id} className="cv-image-card" onClick={() => { setLightboxIdx(idx); setLightboxImg(img.dataUrl); }}>
                    <img src={img.dataUrl} alt={`Menu page ${idx + 1}`} className="cv-image" />
                    <div className="cv-image-overlay">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Bottom Action Bar */}
      {(waUrl || telUrl) && (
        <div className="cv-floating-actions-bar">
          {waUrl && (
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="cv-float-btn cv-float-wa">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.119.553 4.11 1.519 5.84L0 24l6.328-1.659A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.849 0-3.585-.494-5.088-1.357l-.365-.21-3.774.99.1008-3.676-.232-.37C1.75 15.86 1.2 14.004 1.2 12 1.2 6.045 6.045 1.2 12 1.2S22.8 6.045 22.8 12 17.955 22 12 22z"/>
              </svg>
              <span>Order via WhatsApp</span>
            </a>
          )}
          {telUrl && (
            <a href={telUrl} className="cv-float-btn cv-float-phone">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
              </svg>
              <span>Call Hotline ({hotline})</span>
            </a>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightboxImg && (
        <div className="cv-lightbox" onClick={() => setLightboxImg(null)}>
          <button className="cv-lb-close" onClick={() => setLightboxImg(null)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <img
            src={lightboxImg}
            alt="Menu Page"
            className="cv-lb-img"
            onClick={(e) => e.stopPropagation()}
          />
          {lightboxIdx !== null && images.length > 1 && (
            <>
              <button
                className="cv-lb-nav cv-lb-prev"
                onClick={(e) => {
                  e.stopPropagation();
                  const nextIdx = ((lightboxIdx ?? 0) - 1 + images.length) % images.length;
                  setLightboxIdx(nextIdx);
                  setLightboxImg(images[nextIdx].dataUrl);
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
              <button
                className="cv-lb-nav cv-lb-next"
                onClick={(e) => {
                  e.stopPropagation();
                  const nextIdx = ((lightboxIdx ?? 0) + 1) % images.length;
                  setLightboxIdx(nextIdx);
                  setLightboxImg(images[nextIdx].dataUrl);
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
