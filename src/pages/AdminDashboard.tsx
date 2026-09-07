import React, { useState, useRef, useCallback, useEffect } from 'react';
import { simpleDb, type SimpleRestaurant, type MenuFile } from '../db/simpleDb';
import { PdfPageViewer } from '../components/PdfPageViewer';
import { InteractiveCustomerView } from '../components/InteractiveCustomerView';
import { InteractiveMenuManager } from '../components/InteractiveMenuManager';

interface AdminDashboardProps {
  restaurantId: string;
  onLogout: () => void;
}

// Helper: read file as base64 dataURL
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─────────────────────────────────────────────────────
// Customer View — what visitors see
// ─────────────────────────────────────────────────────
const CustomerView: React.FC<{
  files: MenuFile[];
  restaurantName: string;
  whatsappNumber?: string;
  hotline?: string;
  plan?: 'menu-link' | 'whatsapp';
}> = ({ files, restaurantName, whatsappNumber, hotline, plan = 'menu-link' }) => {
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  
  const images = files.filter(f => f.type === 'image');
  const pdf = files.find(f => f.type === 'pdf');

  const isWhatsappPlan = plan === 'whatsapp';

  const cleanWaNumber = (isWhatsappPlan && whatsappNumber) ? whatsappNumber.replace(/[^0-9+]/g, '') : '';
  const waUrl = cleanWaNumber
    ? `https://wa.me/${cleanWaNumber.replace('+', '')}?text=${encodeURIComponent(`Hello ${restaurantName}! I would like to place an order from your menu.`)}`
    : '';

  const cleanHotline = (isWhatsappPlan && hotline) ? hotline.replace(/[^0-9+]/g, '') : '';
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
            onClick={e => e.stopPropagation()}
          />
          {lightboxIdx !== null && images.length > 1 && (
            <>
              <button
                className="cv-lb-nav cv-lb-prev"
                onClick={e => {
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
                onClick={e => {
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

// ─────────────────────────────────────────────────────
// Main Admin Dashboard
// ─────────────────────────────────────────────────────
const PLAN_RANKS: Record<string, number> = { 'menu-link': 1, 'whatsapp': 2, 'website': 3 };
const PLAN_PRICES: Record<string, number> = { 'menu-link': 10, 'whatsapp': 25, 'website': 200 };
const PLAN_NAMES: Record<string, string> = {
  'menu-link': 'Offer 1 ($10)',
  'whatsapp': 'Offer 2 ($25)',
  'website': 'Offer 3 ($200)'
};

// ─────────────────────────────────────────────────────
// Main Admin Dashboard
// ─────────────────────────────────────────────────────
export const AdminDashboard: React.FC<AdminDashboardProps> = ({ restaurantId, onLogout }) => {
  const [restaurant, setRestaurant] = useState<SimpleRestaurant | null>(null);
  const [viewMode, setViewMode] = useState<'admin' | 'customer'>('admin');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [dragging, setDragging] = useState(false);

  // Contact info form
  const [waInput, setWaInput] = useState('');
  const [hotlineInput, setHotlineInput] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const r = simpleDb.getRestaurant(restaurantId);
    if (r) {
      setRestaurant(r);
      setWaInput(r.whatsappNumber || '');
      setHotlineInput(r.hotline || '');
    }
  }, [restaurantId]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const refresh = () => {
    const r = simpleDb.getRestaurant(restaurantId);
    if (r) {
      setRestaurant(r);
      setWaInput(r.whatsappNumber || '');
      setHotlineInput(r.hotline || '');
    }
  };

  const handlePlanSelect = (targetPlan: 'menu-link' | 'whatsapp' | 'website') => {
    if (!restaurant) return;
    const paidPlan = restaurant.paidPlan || 'menu-link';
    const targetRank = PLAN_RANKS[targetPlan];
    const paidRank = PLAN_RANKS[paidPlan];

    if (targetRank <= paidRank) {
      simpleDb.setPlan(restaurantId, targetPlan);
      refresh();
      showToast(`✓ Switched to ${PLAN_NAMES[targetPlan]} (Active Live)`);
    } else {
      simpleDb.setPlan(restaurantId, targetPlan);
      refresh();
      showToast(`👁️ Previewing ${PLAN_NAMES[targetPlan]}. Upgrade & Pay to publish live!`);
    }
  };

  const saveContactDetails = (e: React.FormEvent) => {
    e.preventDefault();
    simpleDb.updateContactInfo(restaurantId, waInput, hotlineInput);
    refresh();
    showToast('✓ Contact details saved!');
  };

  const processFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setError('');
    setUploading(true);

    try {
      for (const file of Array.from(fileList)) {
        const isImage = file.type.startsWith('image/');
        const isPdf = file.type === 'application/pdf';

        if (!isImage && !isPdf) {
          setError('Only images or PDF files are allowed.');
          continue;
        }
        if (file.size > 25 * 1024 * 1024) {
          setError('File must be under 25MB.');
          continue;
        }

        const dataUrl = await readFileAsDataUrl(file);
        simpleDb.addMenuFile(restaurantId, {
          type: isPdf ? 'pdf' : 'image',
          name: file.name,
          dataUrl,
        });
      }
      refresh();
      showToast('✓ Files uploaded successfully!');
    } catch (err: any) {
      setError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }, [restaurantId]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const removeFile = (fileId: string) => {
    simpleDb.removeMenuFile(restaurantId, fileId);
    refresh();
    showToast('File removed.');
  };

  const shareLink = `${window.location.origin}/menu/${restaurantId}`;
  const copyLink = () => {
    navigator.clipboard.writeText(shareLink).then(() => showToast('✓ Link copied to clipboard!'));
  };

  if (!restaurant) return null;

  const files = restaurant.menuFiles;
  const hasFiles = files.length > 0;
  const currentPlan = restaurant.plan || 'menu-link';
  const paidPlan = restaurant.paidPlan || 'menu-link';
  const isWhatsappPlan = currentPlan === 'whatsapp';
  
  const isPreviewingHigherPlan = PLAN_RANKS[currentPlan] > PLAN_RANKS[paidPlan];
  const priceDiff = PLAN_PRICES[currentPlan] - PLAN_PRICES[paidPlan];

  // ── CUSTOMER VIEW MODE ──────────────────────────────────────
  if (viewMode === 'customer') {
    return (
      <div style={{ position: 'relative', minHeight: '100vh', background: '#0a0a0a' }}>
        {/* Floating switch button */}
        <button className="adm-switch-float" onClick={() => setViewMode('admin')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Back to Admin
        </button>
        {currentPlan === 'website' ? (
          <InteractiveCustomerView restaurant={restaurant} />
        ) : (
          <CustomerView
            files={files}
            restaurantName={restaurant.name}
            whatsappNumber={restaurant.whatsappNumber}
            hotline={restaurant.hotline}
            plan={currentPlan}
          />
        )}
      </div>
    );
  }

  // ── ADMIN VIEW MODE ─────────────────────────────────────────
  return (
    <div className="adm-root">
      <div className="adm-orb adm-orb-1" />
      <div className="adm-orb adm-orb-2" />
      <div className="adm-grid" />

      {/* Header */}
      <header className="adm-header">
        <div className="adm-logo">
          <div className="adm-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="url(#admGrad)"/>
              <path d="M8 12l2.5 2.5L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <defs><linearGradient id="admGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse"><stop stopColor="#f97316"/><stop offset="1" stopColor="#ef4444"/></linearGradient></defs>
            </svg>
          </div>
          <div>
            <span className="adm-logo-text">BistroFlow</span>
            <span className="adm-restaurant-name">{restaurant.name}</span>
          </div>
        </div>

        <div className="adm-header-actions">
          {/* Preview toggle */}
          <button
            className="adm-preview-btn"
            onClick={() => setViewMode('customer')}
            title="See what customers see"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            Customer View
          </button>

          <button className="adm-logout-btn" onClick={onLogout}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Logout
          </button>
        </div>
      </header>

      <main className="adm-main">
        {/* Share link card */}
        <div className="adm-link-card animate-fade-in">
          <div className="adm-link-card-inner">
            <div>
              <div className="adm-link-label">
                <div className="adm-link-dot adm-link-dot-live" />
                Your menu website is live
              </div>
              <div className="adm-link-url">{shareLink}</div>
            </div>
            <button
              className="adm-copy-btn adm-copy-btn-active"
              onClick={copyLink}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Copy Link
            </button>
          </div>
        </div>

        {/* Trial / Preview Mode Warning Banner (if testing a higher plan than paid) */}
        {isPreviewingHigherPlan && (
          <div className="adm-trial-banner animate-fade-in">
            <div className="adm-trial-content">
              <span className="adm-trial-icon">⚠️</span>
              <div>
                <h4 className="adm-trial-title">
                  Trial / Preview Mode: {PLAN_NAMES[currentPlan]}
                </h4>
                <p className="adm-trial-desc">
                  You are previewing {PLAN_NAMES[currentPlan]}. Your live public link is currently serving your active paid tier ({PLAN_NAMES[paidPlan]}). Upgrade to publish live!
                </p>
              </div>
            </div>
            <button
              className="adm-upgrade-btn"
              onClick={() => {
                simpleDb.upgradePaidPlan(restaurantId, currentPlan as any);
                refresh();
                showToast(`🎉 Upgrade successful! ${PLAN_NAMES[currentPlan]} is now LIVE!`);
              }}
            >
              💳 Upgrade & Pay Live (+${priceDiff})
            </button>
          </div>
        )}

        {/* Offer plan status card & switcher */}
        <div className="adm-plan-banner animate-fade-in">
          <div className="adm-plan-info">
            <span className="adm-plan-tag">
              {currentPlan === 'website'
                ? 'Offer 3 ($200): Interactive Ordering Website'
                : isWhatsappPlan
                ? 'Offer 2 ($25): WhatsApp Orders & Hotline'
                : 'Offer 1 ($10): Menu Link Only'}
              {isPreviewingHigherPlan && <span className="adm-preview-badge"> (Trial / Preview)</span>}
            </span>
            <span className="adm-plan-sub">
              {currentPlan === 'website'
                ? 'Interactive menu builder, categories, dish sizes/variants, add-ons, cart & online ordering.'
                : isWhatsappPlan
                ? 'Customers see direct WhatsApp order & Hotline call buttons.'
                : 'Upload images or PDF menu only — simple shareable link.'}
            </span>
          </div>

          <div className="adm-plan-switch-group">
            <button
              className={`adm-plan-btn ${currentPlan === 'menu-link' ? 'active' : ''}`}
              onClick={() => handlePlanSelect('menu-link')}
            >
              Offer 1 ($10)
            </button>
            <button
              className={`adm-plan-btn ${currentPlan === 'whatsapp' ? 'active' : ''}`}
              onClick={() => handlePlanSelect('whatsapp')}
            >
              Offer 2 ($25)
            </button>
            <button
              className={`adm-plan-btn ${currentPlan === 'website' ? 'active' : ''}`}
              onClick={() => handlePlanSelect('website')}
            >
              Offer 3 ($200)
            </button>
          </div>
        </div>

        {/* OFFER 3 INTERACTIVE MENU MANAGER */}
        {currentPlan === 'website' ? (
          <InteractiveMenuManager restaurant={restaurant} onRefresh={refresh} />
        ) : (
          <>
            {/* Contact Numbers Config Card (ONLY FOR OFFER 2 WHATSAPP PLAN) */}
            {isWhatsappPlan && (
              <div className="adm-contact-card animate-fade-in">
                <div className="adm-contact-card-header">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                  </svg>
                  <div>
                    <h3 className="adm-contact-title">WhatsApp & Hotline Ordering (Offer 2)</h3>
                    <p className="adm-contact-desc">Add your WhatsApp number and Hotline so customers can order or call directly from your menu page.</p>
                  </div>
                </div>

                <form onSubmit={saveContactDetails} className="adm-contact-form">
                  <div className="adm-contact-inputs-grid">
                    <div className="adm-input-group">
                      <label className="adm-label">WhatsApp Number (e.g. +201001234567)</label>
                      <div className="adm-input-icon-wrap">
                        <span className="adm-input-icon">💬</span>
                        <input
                          type="text"
                          value={waInput}
                          onChange={e => setWaInput(e.target.value)}
                          placeholder="+201001234567"
                          className="adm-input"
                        />
                      </div>
                    </div>

                    <div className="adm-input-group">
                      <label className="adm-label">Hotline / Phone Number (e.g. 19999)</label>
                      <div className="adm-input-icon-wrap">
                        <span className="adm-input-icon">📞</span>
                        <input
                          type="text"
                          value={hotlineInput}
                          onChange={e => setHotlineInput(e.target.value)}
                          placeholder="19999 or +20123456789"
                          className="adm-input"
                        />
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="adm-save-contact-btn">
                    Save Contact Numbers
                  </button>
                </form>
              </div>
            )}
          </>
        )}

        {/* Upload zone Section Title */}
        <div className="adm-section-header animate-fade-in" style={{ marginTop: '2rem', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
            📁 Upload Printed Menu Images or PDF {currentPlan === 'website' && '(Original Menu Tab)'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
            Upload photos of your physical menu or a PDF file. Customers will see page-by-page clean preview.
          </p>
        </div>

        {/* Upload zone */}
        <div
          className={`adm-upload-zone ${dragging ? 'adm-zone-dragging' : ''} ${uploading ? 'adm-zone-uploading' : ''}`}
          onDragEnter={e => { e.preventDefault(); setDragging(true); }}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            multiple
            style={{ display: 'none' }}
            onChange={e => processFiles(e.target.files)}
          />

          <div className="adm-zone-accent" />

          {uploading ? (
            <>
              <svg className="adm-upload-spinner" width="36" height="36" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="rgba(249,115,22,0.2)" strokeWidth="2"/>
                <path d="M12 2a10 10 0 0110 10" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <p className="adm-zone-uploading-text">Uploading...</p>
            </>
          ) : (
            <>
              <div className="adm-zone-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="url(#uploadGrad)" strokeWidth="1.5" strokeLinecap="round"/>
                  <polyline points="17 8 12 3 7 8" stroke="url(#uploadGrad)" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="12" y1="3" x2="12" y2="15" stroke="url(#uploadGrad)" strokeWidth="1.5" strokeLinecap="round"/>
                  <defs><linearGradient id="uploadGrad" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse"><stop stopColor="#f97316"/><stop offset="1" stopColor="#fb923c"/></linearGradient></defs>
                </svg>
              </div>
              <p className="adm-zone-title">
                {dragging ? 'Drop files here!' : hasFiles ? 'Add more files' : 'Upload your menu'}
              </p>
              <p className="adm-zone-desc">
                {dragging ? 'Release to upload' : 'Drag & drop or click • Images (JPG/PNG) or PDF'}
              </p>
            </>
          )}
        </div>

        {error && (
          <div className="adm-error animate-fade-in">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="1.5"/>
              <path d="M12 8v4M12 16h.01" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}

        {/* Files grid */}
        {hasFiles && (
          <div className="adm-files-section animate-fade-in">
            <div className="adm-files-header">
              <span className="adm-files-count">{files.length} file{files.length > 1 ? 's' : ''} uploaded</span>
              <span className="adm-files-hint">Click × to remove</span>
            </div>

            <div className="adm-files-grid">
              {files.map((file, idx) => (
                <div key={file.id} className="adm-file-card">
                  {file.type === 'image' ? (
                    <img src={file.dataUrl} alt={file.name} className="adm-file-img" />
                  ) : (
                    <div className="adm-file-pdf">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="#6366f1" strokeWidth="1.5"/>
                        <path d="M14 2v6h6M9 13h6M9 17h4" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      <span className="adm-file-pdf-label">PDF</span>
                    </div>
                  )}
                  <div className="adm-file-info">
                    <span className="adm-file-name">{file.name}</span>
                    {file.type === 'image' && <span className="adm-file-badge-img">Image {idx + 1}</span>}
                    {file.type === 'pdf' && <span className="adm-file-badge-pdf">PDF Menu</span>}
                  </div>
                  <button
                    className="adm-file-remove"
                    onClick={() => removeFile(file.id)}
                    title="Remove file"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state hint */}
        {!hasFiles && !uploading && (
          <div className="adm-empty-hint animate-fade-in">
            <p>📸 Upload photos of your printed menu, or a PDF — customers will see page-by-page clean preview.</p>
          </div>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div className="adm-toast animate-slide-up">{toast}</div>
      )}
    </div>
  );
};
