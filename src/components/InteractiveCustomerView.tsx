import React, { useState, useEffect } from 'react';
import type { SimpleRestaurant, InteractiveItem, MenuItemOption, MenuItemAddon, CustomerOrderItem, Branch } from '../db/simpleDb';
import { simpleDb } from '../db/simpleDb';
import { PdfPageViewer } from './PdfPageViewer';
import { MapLocationPicker } from './MapLocationPicker';
import {
  apiCustomerGetSession,
  apiCustomerRegister,
  apiCustomerLogin,
  apiCustomerLogout,
  apiCustomerGetOrders,
} from '../api/client';
import type { CustomerProfile, CustomerOrder } from '../db/types';

interface InteractiveCustomerViewProps {
  restaurant: SimpleRestaurant;
}

export const InteractiveCustomerView: React.FC<InteractiveCustomerViewProps> = ({ restaurant }) => {
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [activeItemModal, setActiveItemModal] = useState<InteractiveItem | null>(null);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  
  // Customization state for active modal item
  const [selectedOption, setSelectedOption] = useState<MenuItemOption | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<MenuItemAddon[]>([]);
  const [itemQuantity, setItemQuantity] = useState<number>(1);

  // Cart state
  const [cart, setCart] = useState<CustomerOrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);

  // Checkout form & Delivery state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    restaurant.branches && restaurant.branches.length > 0 ? restaurant.branches[0].id : ''
  );
  
  // Location & Nearest Branch calculation state
  const [customerLat, setCustomerLat] = useState<number | null>(null);
  const [customerLng, setCustomerLng] = useState<number | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number>(20);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [assignedBranchName, setAssignedBranchName] = useState<string>('');
  const [assignedBranchId, setAssignedBranchId] = useState<string>('');
  const [isCovered, setIsCovered] = useState<boolean>(true);
  const [coverageMessage, setCoverageMessage] = useState<string>('');
  const [isCalculatingFee, setIsCalculatingFee] = useState<boolean>(false);
  const [googleMapsUrl, setGoogleMapsUrl] = useState<string>('');
  const [orderSuccessMsg, setOrderSuccessMsg] = useState('');

  // ── Customer auth state ────────────────────────────────────
  const [customerSession, setCustomerSession] = useState<CustomerProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authName, setAuthName] = useState('');
  const [authIdentifier, setAuthIdentifier] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // ── My Orders drawer ───────────────────────────────────────
  const [showOrdersDrawer, setShowOrdersDrawer] = useState(false);
  const [myOrders, setMyOrders] = useState<CustomerOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Load session on mount
  useEffect(() => {
    const session = apiCustomerGetSession();
    if (session && session.restaurantId === restaurant.id) {
      setCustomerSession(session);
    }
  }, [restaurant.id]);

  // Auto-fill checkout fields when session changes
  useEffect(() => {
    if (customerSession) {
      if (!customerName) setCustomerName(customerSession.name);
      if (!customerPhone) setCustomerPhone(customerSession.phone);
      if (!deliveryAddress && customerSession.defaultAddress) setDeliveryAddress(customerSession.defaultAddress);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerSession]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      let res;
      if (authMode === 'login') {
        res = await apiCustomerLogin(restaurant.id, authIdentifier, authPassword);
      } else {
        res = await apiCustomerRegister({
          restaurantId: restaurant.id,
          name: authName,
          phone: authIdentifier,
          password: authPassword,
        });
      }
      setCustomerSession(res.customer);
      setShowAuthModal(false);
      setAuthName('');
      setAuthIdentifier('');
      setAuthPassword('');
    } catch (err: unknown) {
      setAuthError((err as Error).message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    apiCustomerLogout();
    setCustomerSession(null);
    setMyOrders([]);
    setShowOrdersDrawer(false);
  };

  const openOrdersDrawer = async () => {
    setShowOrdersDrawer(true);
    setOrdersLoading(true);
    try {
      const orders = await apiCustomerGetOrders(restaurant.id, customerSession?.phone);
      setMyOrders(orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch {
      setMyOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const branding = restaurant.branding || { template: 'modern', primaryColor: '#f97316', bgColor: '#0d0d11', textColor: '#f0f0f4' };
  const categories = restaurant.categories || [];
  const items = restaurant.items || [];
  const menuFiles = restaurant.menuFiles || [];
  const branches: Branch[] = (restaurant.branches || []).filter(b => b.isActive !== false);

  const template = branding.template || 'modern';
  const primaryColor = branding.primaryColor || '#f97316';
  const bgColor = branding.bgColor || (template === 'luxury' ? '#faf8f5' : '#0d0d11');
  const textColor = branding.textColor || (template === 'luxury' ? '#1c1917' : '#f0f0f4');

  const pdfFile = menuFiles.find(f => f.type === 'pdf');
  const imageFiles = menuFiles.filter(f => f.type === 'image');

  // Filter items
  const filteredItems = selectedCatId === 'all'
    ? items
    : items.filter(i => i.categoryId === selectedCatId);

  // Open customization modal
  const openCustomizer = (item: InteractiveItem) => {
    setActiveItemModal(item);
    setSelectedOption(item.options && item.options.length > 0 ? item.options[0] : null);
    setSelectedAddons([]);
    setItemQuantity(1);
  };

  // Calculate price for customized item
  const calculateItemUnitPrice = (): number => {
    if (!activeItemModal) return 0;
    let base = activeItemModal.price;
    if (selectedOption) base += selectedOption.priceDelta;
    selectedAddons.forEach(a => { base += a.price; });
    return base;
  };

  const handleAddToCart = () => {
    if (!activeItemModal) return;
    const unitPrice = calculateItemUnitPrice();
    const newItem: CustomerOrderItem = {
      itemId: activeItemModal.id,
      name: activeItemModal.name,
      selectedOption: selectedOption?.name,
      selectedAddons: selectedAddons.map(a => a.name),
      unitPrice,
      quantity: itemQuantity,
      totalPrice: unitPrice * itemQuantity
    };

    setCart(prev => [...prev, newItem]);
    setActiveItemModal(null);
    setIsCartOpen(true);
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const cartSubtotal = cart.reduce((acc, item) => acc + item.totalPrice, 0);
  const effectiveDeliveryFee = orderType === 'delivery' ? (isCovered ? deliveryFee : 0) : 0;
  const grandTotal = Math.round((cartSubtotal + effectiveDeliveryFee) * 100) / 100;

  // Calculate delivery fee & nearest branch from GPS/Map selection
  const calculateLocationDelivery = async (lat: number, lng: number, addressName?: string) => {
    setCustomerLat(lat);
    setCustomerLng(lng);
    const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    setGoogleMapsUrl(mapUrl);
    if (addressName && !deliveryAddress) {
      setDeliveryAddress(addressName);
    }

    setIsCalculatingFee(true);
    setCoverageMessage('');

    try {
      const res = await simpleDb.calculateDeliveryFee({
        restaurantId: restaurant.id,
        customerLat: lat,
        customerLng: lng,
      });

      setIsCovered(res.covered);
      if (res.covered) {
        setDeliveryFee(res.deliveryFee);
        setDistanceKm(res.distanceKm ?? null);
        setAssignedBranchId(res.branchId || '');
        setAssignedBranchName(res.branchName || '');
        setCoverageMessage(`✓ Nearest branch: ${res.branchName} (${res.distanceKm} km away) • Delivery Fee: ${res.deliveryFee} EGP`);
      } else {
        setCoverageMessage(res.message || 'Sorry, your location is outside our delivery range.');
      }
    } catch (err: unknown) {
      setCoverageMessage((err as Error).message || 'Failed to calculate delivery fee.');
    } finally {
      setIsCalculatingFee(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) return;
    if (orderType === 'delivery' && !isCovered) {
      alert('Your address is currently outside our delivery range. Please choose Pickup or select another location on the map.');
      return;
    }

    try {
      const chosenBranchId = orderType === 'pickup' ? selectedBranchId : assignedBranchId || selectedBranchId || undefined;
      const chosenBranch = branches.find(b => b.id === chosenBranchId);
      const branchName = assignedBranchName || chosenBranch?.name || 'Main Branch';

      const order = await simpleDb.createOrder(restaurant.id, {
        branchId: chosenBranchId,
        branchName: branchName,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        address: deliveryAddress.trim() || (orderType === 'pickup' ? `Pickup from ${branchName}` : undefined),
        orderType,
        items: cart,
        deliveryFee: effectiveDeliveryFee,
        total: grandTotal,
        customerLat: customerLat || undefined,
        customerLng: customerLng || undefined,
        googleMapsUrl: googleMapsUrl || (customerLat && customerLng ? `https://www.google.com/maps?q=${customerLat},${customerLng}` : undefined),
        distanceKm: distanceKm || undefined,
      });

      // Prepare WhatsApp message
      let waText = `*NEW ORDER - #${order.id}*\n`;
      waText += `Restaurant: ${restaurant.name}\n`;
      waText += `Branch: ${branchName}\n`;
      waText += `Customer: ${customerName} (${customerPhone})\n`;
      waText += `Type: ${orderType === 'delivery' ? '🛵 DELIVERY' : '🥡 PICKUP'}\n`;
      if (orderType === 'delivery') {
        if (deliveryAddress) waText += `Address: ${deliveryAddress}\n`;
        if (distanceKm != null) waText += `Distance: ${distanceKm} km\n`;
        if (googleMapsUrl) waText += `Google Maps: ${googleMapsUrl}\n`;
      } else {
        if (chosenBranch?.address) waText += `Pickup Address: ${chosenBranch.address}\n`;
      }
      waText += `\n*ORDER ITEMS:*\n`;
      cart.forEach(item => {
        waText += `• ${item.quantity}x ${item.name}`;
        if (item.selectedOption) waText += ` (${item.selectedOption})`;
        if (item.selectedAddons && item.selectedAddons.length > 0) waText += ` + ${item.selectedAddons.join(', ')}`;
        waText += ` = $${item.totalPrice.toFixed(2)}\n`;
      });
      waText += `\nSubtotal: $${cartSubtotal.toFixed(2)}`;
      if (orderType === 'delivery') {
        waText += `\nDelivery Fee: ${effectiveDeliveryFee} EGP`;
      }
      waText += `\n*GRAND TOTAL: $${grandTotal.toFixed(2)}*`;

      const cleanWa = restaurant.whatsappNumber ? restaurant.whatsappNumber.replace(/[^0-9+]/g, '') : '';
      if (cleanWa) {
        window.open(`https://wa.me/${cleanWa.replace('+', '')}?text=${encodeURIComponent(waText)}`, '_blank');
      }

      setOrderSuccessMsg(`✓ Order #${order.id} submitted successfully!`);
      setCart([]);
      setIsCheckoutOpen(false);
      setIsCartOpen(false);

      setTimeout(() => setOrderSuccessMsg(''), 5000);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to place order.');
    }
  };




  return (
    <div
      className={`icv-root icv-template-${template}`}
      style={{
        '--icv-primary': primaryColor,
        '--icv-bg': bgColor,
        '--icv-text': textColor,
        background: bgColor,
        color: textColor,
        fontFamily: template === 'luxury' ? "'Playfair Display', Georgia, serif" : "'Inter', sans-serif"
      } as React.CSSProperties}
    >
      {/* ─────────────────────────────────────────────────────────────
         HEADER: MODERN vs LUXURY FINE DINING
         ───────────────────────────────────────────────────────────── */}
      {template === 'luxury' ? (
        <header className="icv-header-luxury">
          <div className="icv-lux-border-top" style={{ borderColor: primaryColor }} />
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt={restaurant.name} className="icv-logo-lux" />
          ) : (
            <div className="icv-logo-placeholder-lux" style={{ color: primaryColor, borderColor: primaryColor }}>
              {restaurant.name.charAt(0)}
            </div>
          )}
          <h1 className="icv-title-lux" style={{ color: textColor }}>{restaurant.name}</h1>
          <div className="icv-lux-ornament" style={{ color: primaryColor }}>
            <span>❖</span> <span>FINE DINING & CULINARY MENU</span> <span>❖</span>
          </div>

          {/* Contact buttons for Luxury */}
          {(restaurant.whatsappNumber || restaurant.hotline) && (
            <div className="icv-header-contacts-lux">
              {restaurant.whatsappNumber && (
                <a
                  href={`https://wa.me/${restaurant.whatsappNumber.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="icv-header-btn-lux icv-wa-btn-lux"
                >
                  💬 WhatsApp Reservations & Orders
                </a>
              )}
              {restaurant.hotline && (
                <a href={`tel:${restaurant.hotline}`} className="icv-header-btn-lux icv-phone-btn-lux" style={{ borderColor: primaryColor, color: primaryColor }}>
                  📞 Hotline ({restaurant.hotline})
                </a>
              )}
            </div>
          )}

          {/* ── Account Button (Luxury) ── */}
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
            {customerSession ? (
              <>
                <button
                  onClick={openOrdersDrawer}
                  style={{ background: 'transparent', border: `1px solid ${primaryColor}`, color: primaryColor, borderRadius: '4px', padding: '6px 16px', fontSize: '13px', cursor: 'pointer', fontWeight: 600, letterSpacing: '0.05em' }}
                >
                  📦 MY ORDERS
                </button>
                <button
                  onClick={handleLogout}
                  style={{ background: 'transparent', border: '1px solid #ccc', color: '#999', borderRadius: '4px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}
                >
                  👤 {customerSession.name.split(' ')[0]} · Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => { setShowAuthModal(true); setAuthMode('login'); setAuthError(''); }}
                style={{ background: 'transparent', border: `1px solid ${primaryColor}`, color: primaryColor, borderRadius: '4px', padding: '6px 16px', fontSize: '13px', cursor: 'pointer', fontWeight: 600, letterSpacing: '0.05em' }}
              >
                👤 SIGN IN / CREATE ACCOUNT
              </button>
            )}
          </div>
        </header>
      ) : (
        <header className="icv-header">
          <div className="icv-header-content">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt={restaurant.name} className="icv-logo" />
            ) : (
              <div className="icv-logo-placeholder" style={{ background: primaryColor }}>
                {restaurant.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="icv-title">{restaurant.name}</h1>
              <p className="icv-subtitle">Order Online • Fast Delivery & Pickup</p>
            </div>
          </div>

          {/* Contact buttons */}
          {(restaurant.whatsappNumber || restaurant.hotline) && (
            <div className="icv-header-contacts">
              {restaurant.whatsappNumber && (
                <a
                  href={`https://wa.me/${restaurant.whatsappNumber.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="icv-header-btn icv-wa-btn"
                >
                  💬 WhatsApp Order
                </a>
              )}
              {restaurant.hotline && (
                <a href={`tel:${restaurant.hotline}`} className="icv-header-btn icv-phone-btn">
                  📞 Hotline ({restaurant.hotline})
                </a>
              )}
            </div>
          )}

          {/* ── Account Button ── */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            {customerSession ? (
              <>
                <button
                  onClick={openOrdersDrawer}
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '20px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}
                >
                  📦 My Orders
                </button>
                <button
                  onClick={handleLogout}
                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', borderRadius: '20px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}
                >
                  👤 {customerSession.name.split(' ')[0]} · Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => { setShowAuthModal(true); setAuthMode('login'); setAuthError(''); }}
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '20px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}
              >
                👤 Sign In / Create Account
              </button>
            )}
          </div>
        </header>
      )}

      {/* Success Notification */}
      {orderSuccessMsg && (
        <div className="icv-toast-success animate-slide-down">
          {orderSuccessMsg}
        </div>
      )}

      {/* Category Tabs Bar */}
      <div className={`icv-cat-bar ${template === 'luxury' ? 'icv-cat-bar-lux' : ''}`}>
        <button
          className={`icv-cat-tab ${selectedCatId === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCatId('all')}
        >
          All Items ({items.length})
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`icv-cat-tab ${selectedCatId === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCatId(cat.id)}
          >
            {cat.name}
          </button>
        ))}
        {menuFiles.length > 0 && (
          <button
            className={`icv-cat-tab ${selectedCatId === 'uploaded_files' ? 'active' : ''}`}
            onClick={() => setSelectedCatId('uploaded_files')}
          >
            📄 Original Menu PDF / Photos ({menuFiles.length})
          </button>
        )}
      </div>

      {/* Items Grid / Classic Menu Book Layout */}
      <main className="icv-main">
        {selectedCatId === 'uploaded_files' ? (
          <div className="icv-files-view">
            {pdfFile && (
              <div className="icv-pdf-wrap">
                <PdfPageViewer dataUrl={pdfFile.dataUrl} onPageClick={(data) => setLightboxImg(data)} />
              </div>
            )}
            {imageFiles.length > 0 && (
              <div className="icv-images-section">
                <h3 className="cv-section-title">Uploaded Menu Images</h3>
                <div className="cv-images">
                  {imageFiles.map((img, idx) => (
                    <div key={img.id} className="cv-image-card" onClick={() => setLightboxImg(img.dataUrl)}>
                      <img src={img.dataUrl} alt={`Page ${idx + 1}`} className="cv-image" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="icv-empty-menu">
            <p>No items found in this category.</p>
          </div>
        ) : template === 'luxury' ? (
          /* LUXURY FINE DINING CLASSIC MENU BOOK LAYOUT */
          <div className="icv-menu-book">
            {categories
              .filter(c => selectedCatId === 'all' || selectedCatId === c.id)
              .map(cat => {
                const catItems = filteredItems.filter(i => i.categoryId === cat.id);
                if (catItems.length === 0) return null;
                return (
                  <div key={cat.id} className="icv-lux-section">
                    <div className="icv-lux-section-header">
                      <span className="icv-lux-section-title" style={{ color: primaryColor }}>
                        — {cat.name.toUpperCase()} —
                      </span>
                    </div>
                    <div className="icv-lux-items-list">
                      {catItems.map(item => (
                        <div key={item.id} className="icv-lux-item-row" onClick={() => openCustomizer(item)}>
                          {item.image && (
                            <img src={item.image} alt={item.name} className="icv-lux-thumb" />
                          )}
                          <div className="icv-lux-item-body">
                            <div className="icv-lux-title-line">
                              <span className="icv-lux-name">{item.name}</span>
                              <span className="icv-lux-dots" />
                              <span className="icv-lux-price" style={{ color: primaryColor }}>${item.price.toFixed(2)}</span>
                            </div>
                            <p className="icv-lux-desc">{item.description}</p>
                            {item.isOffer && (
                              <span className="icv-lux-offer-badge" style={{ borderColor: primaryColor, color: primaryColor }}>
                                Chef Special Offer ★
                              </span>
                            )}
                          </div>
                          <button className="icv-lux-add-btn" style={{ background: primaryColor }}>
                            + Add
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          /* MODERN BISTRO GRID LAYOUT */
          <div className="icv-items-grid">
            {filteredItems.map(item => (
              <div key={item.id} className="icv-item-card">
                {item.image && (
                  <div className="icv-item-img-wrap">
                    <img src={item.image} alt={item.name} className="icv-item-img" />
                    {item.isOffer && <span className="icv-badge-offer">SPECIAL OFFER</span>}
                  </div>
                )}
                <div className="icv-item-details">
                  <div className="icv-item-title-row">
                    <h3 className="icv-item-name">{item.name}</h3>
                    <span className="icv-item-price">${item.price.toFixed(2)}</span>
                  </div>
                  <p className="icv-item-desc">{item.description}</p>

                  <div className="icv-item-actions">
                    <button
                      className="icv-add-btn"
                      onClick={() => openCustomizer(item)}
                    >
                      {item.options && item.options.length > 0 ? 'Customize & Add' : '+ Add to Order'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && !isCartOpen && !isCheckoutOpen && (
        <div className="icv-floating-cart-bar" onClick={() => setIsCartOpen(true)}>
          <div className="icv-float-cart-info">
            <span className="icv-float-count">{cart.length} item{cart.length > 1 ? 's' : ''}</span>
            <span className="icv-float-price">${cartSubtotal.toFixed(2)}</span>
          </div>
          <button className="icv-float-checkout-btn">
            View Cart & Checkout →
          </button>
        </div>
      )}

      {/* ITEM CUSTOMIZATION MODAL */}
      {activeItemModal && (
        <div className="icv-modal-overlay" onClick={() => setActiveItemModal(null)}>
          <div className="icv-modal-card animate-scale-up" onClick={e => e.stopPropagation()}>
            <button className="icv-modal-close" onClick={() => setActiveItemModal(null)}>✕</button>

            {activeItemModal.image && (
              <img src={activeItemModal.image} alt={activeItemModal.name} className="icv-modal-img" />
            )}

            <div className="icv-modal-content">
              <h2 className="icv-modal-title">{activeItemModal.name}</h2>
              <p className="icv-modal-desc">{activeItemModal.description}</p>

              {/* Options / Sizes Selection */}
              {activeItemModal.options && activeItemModal.options.length > 0 && (
                <div className="icv-option-group">
                  <h4 className="icv-group-label">Choose Size / Options</h4>
                  <div className="icv-options-list">
                    {activeItemModal.options.map(opt => (
                      <label key={opt.id} className={`icv-option-item ${selectedOption?.id === opt.id ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="item-option"
                          checked={selectedOption?.id === opt.id}
                          onChange={() => setSelectedOption(opt)}
                        />
                        <span className="icv-opt-name">{opt.name}</span>
                        <span className="icv-opt-delta">
                          {opt.priceDelta > 0 ? `+$${opt.priceDelta.toFixed(2)}` : 'Standard'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Add-ons Checkboxes */}
              {activeItemModal.addons && activeItemModal.addons.length > 0 && (
                <div className="icv-option-group">
                  <h4 className="icv-group-label">Optional Add-ons & Extras</h4>
                  <div className="icv-addons-list">
                    {activeItemModal.addons.map(addon => {
                      const isSelected = selectedAddons.some(a => a.id === addon.id);
                      return (
                        <label key={addon.id} className={`icv-addon-item ${isSelected ? 'selected' : ''}`}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAddons(prev => [...prev, addon]);
                              } else {
                                setSelectedAddons(prev => prev.filter(a => a.id !== addon.id));
                              }
                            }}
                          />
                          <span className="icv-addon-name">{addon.name}</span>
                          <span className="icv-addon-price">+$${addon.price.toFixed(2)}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity counter & Add to Cart button */}
              <div className="icv-modal-footer">
                <div className="icv-qty-counter">
                  <button onClick={() => setItemQuantity(q => Math.max(1, q - 1))}>-</button>
                  <span>{itemQuantity}</span>
                  <button onClick={() => setItemQuantity(q => q + 1)}>+</button>
                </div>

                <button className="icv-add-to-cart-submit" onClick={handleAddToCart}>
                  Add to Cart • ${(calculateItemUnitPrice() * itemQuantity).toFixed(2)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CART DRAWER */}
      {isCartOpen && (
        <div className="icv-modal-overlay" onClick={() => setIsCartOpen(false)}>
          <div className="icv-cart-drawer animate-slide-left" onClick={e => e.stopPropagation()}>
            <div className="icv-cart-header">
              <h2>Your Shopping Cart ({cart.length})</h2>
              <button onClick={() => setIsCartOpen(false)}>✕</button>
            </div>

            <div className="icv-cart-body">
              {cart.length === 0 ? (
                <div className="icv-cart-empty">
                  <p>Your cart is empty.</p>
                </div>
              ) : (
                <div className="icv-cart-items-list">
                  {cart.map((item, idx) => (
                    <div key={idx} className="icv-cart-item-row">
                      <div className="icv-cart-item-info">
                        <div className="icv-cart-item-title">{item.quantity}x {item.name}</div>
                        {item.selectedOption && <div className="icv-cart-subtext">Option: {item.selectedOption}</div>}
                        {item.selectedAddons && item.selectedAddons.length > 0 && (
                          <div className="icv-cart-subtext">Extras: {item.selectedAddons.join(', ')}</div>
                        )}
                      </div>
                      <div className="icv-cart-item-right">
                        <span className="icv-cart-price">${item.totalPrice.toFixed(2)}</span>
                        <button className="icv-cart-remove" onClick={() => removeFromCart(idx)}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="icv-cart-footer">
                <div className="icv-cart-total-row">
                  <span>Subtotal:</span>
                  <span className="icv-cart-total-amount">${cartSubtotal.toFixed(2)}</span>
                </div>
                <button
                  className="icv-proceed-checkout-btn"
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                >
                  Proceed to Checkout →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <div className="icv-modal-overlay" onClick={() => setIsCheckoutOpen(false)}>
          <div className="icv-modal-card animate-scale-up" onClick={e => e.stopPropagation()}>
            <div className="icv-cart-header">
              <h2>Checkout Order</h2>
              <button onClick={() => setIsCheckoutOpen(false)}>✕</button>
            </div>

            <form onSubmit={handlePlaceOrder} className="icv-checkout-form">
              <div className="icv-field">
                <label>Your Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                />
              </div>

              <div className="icv-field">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +201001234567"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                />
              </div>

              <div className="icv-field">
                <label>Fulfillment Type</label>
                <div className="icv-type-selector">
                  <button
                    type="button"
                    className={orderType === 'delivery' ? 'active' : ''}
                    onClick={() => {
                      setOrderType('delivery');
                      setIsCovered(true);
                      setCoverageMessage('');
                    }}
                  >
                    🛵 Delivery
                  </button>
                  <button
                    type="button"
                    className={orderType === 'pickup' ? 'active' : ''}
                    onClick={() => {
                      setOrderType('pickup');
                      setIsCovered(true);
                      setCoverageMessage('');
                    }}
                  >
                    🥡 Pickup from Branch
                  </button>
                </div>
              </div>

              {/* PICKUP MODE */}
              {orderType === 'pickup' && (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-300">
                    🏢 Choose Pickup Branch (FREE - 0 EGP)
                  </label>
                  {branches.length === 0 ? (
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300">
                      📍 Main Restaurant Location (Pickup)
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {branches.map((b) => {
                        const isSelected = selectedBranchId === b.id;
                        return (
                          <div
                            key={b.id}
                            onClick={() => setSelectedBranchId(b.id)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                              isSelected
                                ? 'bg-orange-500/10 border-orange-500 text-white'
                                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <input
                                type="radio"
                                name="pickup_branch"
                                checked={isSelected}
                                onChange={() => setSelectedBranchId(b.id)}
                                className="mt-1 text-orange-500 focus:ring-orange-500 cursor-pointer"
                              />
                              <div>
                                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                                  <span>🏢</span> {b.name}
                                </div>
                                {b.address && (
                                  <div className="text-xs text-slate-400 mt-0.5">
                                    📍 {b.address}
                                  </div>
                                )}
                                {b.phone && (
                                  <div className="text-xs text-slate-500 mt-0.5">
                                    📞 {b.phone}
                                  </div>
                                )}
                              </div>
                            </div>
                            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-full shrink-0">
                              FREE Pickup
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* DELIVERY MODE */}
              {orderType === 'delivery' && (
                <div className="space-y-3.5">
                  {/* Interactive Searchable Map Picker */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider">
                      📍 Pin Your Delivery Location on Map
                    </label>
                    <MapLocationPicker
                      latitude={customerLat || (branches[0]?.latitude || 30.0444)}
                      longitude={customerLng || (branches[0]?.longitude || 31.2357)}
                      onChange={(lat, lng, addr) => calculateLocationDelivery(lat, lng, addr)}
                      height="200px"
                    />
                  </div>

                  {/* Nearest Branch & Coverage Banner */}
                  {isCalculatingFee ? (
                    <div className="p-3 rounded-xl text-xs font-medium border bg-slate-900 border-slate-800 text-amber-300 flex items-center gap-2">
                      <span className="animate-spin">⏳</span> Finding nearest branch & calculating delivery fee...
                    </div>
                  ) : coverageMessage ? (
                    <div
                      className={`p-3 rounded-xl text-xs font-medium border ${
                        isCovered
                          ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                          : 'bg-red-950/60 border-red-800 text-red-300'
                      }`}
                    >
                      {coverageMessage}
                    </div>
                  ) : null}


                  {/* Street Address */}
                  <div className="icv-field">
                    <label>Building, Floor & Apartment Details *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Building 12, 3rd Floor, Apt 7"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Order Summary Breakdown */}
              <div className="icv-checkout-summary">
                <div className="icv-summary-row">
                  <span>Subtotal:</span>
                  <span>${cartSubtotal.toFixed(2)}</span>
                </div>
                {orderType === 'delivery' && (
                  <div className="icv-summary-row text-xs text-slate-400">
                    <span>Delivery Fee ({distanceKm != null ? `${distanceKm} km` : 'calculated'}):</span>
                    <span className="text-emerald-400 font-bold">{effectiveDeliveryFee} EGP</span>
                  </div>
                )}
                {orderType === 'pickup' && (
                  <div className="icv-summary-row text-xs text-emerald-400 font-semibold">
                    <span>Pickup Fee:</span>
                    <span>FREE (0 EGP)</span>
                  </div>
                )}
                <div className="icv-summary-row border-t border-slate-800 pt-2 mt-1 font-bold text-base">
                  <span>Grand Total:</span>
                  <span className="icv-summary-total">${grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={orderType === 'delivery' && !isCovered}
                className="icv-submit-order-btn disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm & Order via WhatsApp
              </button>
            </form>
          </div>
        </div>
      )}



      {/* Lightbox for uploaded PDF/Images */}
      {lightboxImg && (
        <div className="cv-lightbox" onClick={() => setLightboxImg(null)}>
          <button className="cv-lb-close" onClick={() => setLightboxImg(null)}>✕</button>
          <img src={lightboxImg} alt="Original Menu" className="cv-lb-img" />
        </div>
      )}

      {/* ── AUTH MODAL ─────────────────────────────────────────── */}
      {showAuthModal && (
        <div className="icv-modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div
            className="icv-modal-card animate-scale-up"
            style={{ maxWidth: '380px', width: '90%' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="icv-cart-header">
              <h2 style={{ fontSize: '18px' }}>
                {authMode === 'login' ? '👤 Sign In to Your Account' : '🆕 Create Account'}
              </h2>
              <button onClick={() => setShowAuthModal(false)}>✕</button>
            </div>

            <form onSubmit={handleAuthSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {authMode === 'register' && (
                <div className="icv-field">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ahmed Hassan"
                    value={authName}
                    onChange={e => setAuthName(e.target.value)}
                  />
                </div>
              )}

              <div className="icv-field">
                <label>{authMode === 'login' ? 'Phone or Email *' : 'Phone Number *'}</label>
                <input
                  type="text"
                  required
                  placeholder={authMode === 'login' ? 'Phone or email' : 'e.g. 01001234567'}
                  value={authIdentifier}
                  onChange={e => setAuthIdentifier(e.target.value)}
                />
              </div>

              <div className="icv-field">
                <label>Password * {authMode === 'register' && <span style={{ fontWeight: 400, opacity: 0.6 }}>(min 6 characters)</span>}</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                />
              </div>

              {authError && (
                <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: '8px', padding: '10px 14px', fontSize: '13px' }}>
                  ⚠️ {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                style={{ background: primaryColor, color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', opacity: authLoading ? 0.7 : 1 }}
              >
                {authLoading ? '⏳ Please wait…' : authMode === 'login' ? 'Sign In' : 'Create Account'}
              </button>

              <p style={{ textAlign: 'center', fontSize: '13px', opacity: 0.7, margin: 0 }}>
                {authMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  type="button"
                  onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}
                  style={{ background: 'none', border: 'none', color: primaryColor, cursor: 'pointer', fontWeight: 700, fontSize: '13px', padding: 0 }}
                >
                  {authMode === 'login' ? 'Create one' : 'Sign In'}
                </button>
              </p>
            </form>
          </div>
        </div>
      )}

      {/* ── MY ORDERS DRAWER ───────────────────────────────────── */}
      {showOrdersDrawer && (
        <div className="icv-modal-overlay" onClick={() => setShowOrdersDrawer(false)}>
          <div className="icv-cart-drawer animate-slide-left" onClick={e => e.stopPropagation()}>
            <div className="icv-cart-header">
              <h2>📦 My Orders</h2>
              <button onClick={() => setShowOrdersDrawer(false)}>✕</button>
            </div>

            <div className="icv-cart-body">
              {ordersLoading ? (
                <div style={{ padding: '30px', textAlign: 'center', opacity: 0.6 }}>
                  <span style={{ fontSize: '24px' }}>⏳</span>
                  <p style={{ marginTop: '10px' }}>Loading your orders…</p>
                </div>
              ) : myOrders.length === 0 ? (
                <div className="icv-cart-empty">
                  <p>You don't have any orders yet.</p>
                  <p style={{ fontSize: '12px', opacity: 0.5 }}>Start by adding items to your cart!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {myOrders.map(order => {
                    const statusColors: Record<string, { bg: string; color: string; label: string }> = {
                      pending:   { bg: '#fef3c7', color: '#92400e', label: '🕒 Pending' },
                      preparing: { bg: '#dbeafe', color: '#1e40af', label: '👨‍🍳 Preparing' },
                      completed: { bg: '#d1fae5', color: '#065f46', label: '✅ Completed' },
                      cancelled: { bg: '#fee2e2', color: '#991b1b', label: '❌ Cancelled' },
                    };
                    const sc = statusColors[order.status] || statusColors.pending;
                    const dateStr = new Date(order.createdAt).toLocaleDateString('en-EG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

                    return (
                      <div
                        key={order.id}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px', fontSize: '13px' }}
                      >
                        {/* Order header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '13px' }}>#{order.id}</span>
                          <span style={{ background: sc.bg, color: sc.color, borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 700 }}>
                            {sc.label}
                          </span>
                        </div>

                        {/* Date & Branch */}
                        <div style={{ opacity: 0.55, fontSize: '11px', marginBottom: '8px' }}>
                          {dateStr}{order.branchName ? ` • ${order.branchName}` : ''} • {order.orderType === 'delivery' ? '🛵 Delivery' : '🥡 Pickup'}
                        </div>

                        {/* Items */}
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {(order.items || []).map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ opacity: 0.85 }}>
                                {item.quantity}x {item.name}
                                {item.selectedOption ? ` (${item.selectedOption})` : ''}
                                {item.selectedAddons && item.selectedAddons.length > 0 ? ` + ${item.selectedAddons.join(', ')}` : ''}
                              </span>
                              <span style={{ fontWeight: 600, opacity: 0.8 }}>{item.totalPrice.toFixed(2)} EGP</span>
                            </div>
                          ))}
                        </div>

                        {/* Total */}
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '8px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                          <span>Total</span>
                          <span style={{ color: primaryColor }}>{order.total.toFixed(2)} EGP</span>
                        </div>

                        {/* Address / Maps link */}
                        {order.address && (
                          <div style={{ marginTop: '6px', opacity: 0.5, fontSize: '11px' }}>📍 {order.address}</div>
                        )}
                        {order.googleMapsUrl && (
                          <a href={order.googleMapsUrl} target="_blank" rel="noreferrer" style={{ marginTop: '4px', display: 'inline-block', fontSize: '11px', color: primaryColor, opacity: 0.8 }}>
                            🗺️ View on Google Maps
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
