import React, { useState } from 'react';
import type { SimpleRestaurant, InteractiveItem, MenuItemOption, MenuItemAddon, CustomerOrderItem } from '../db/simpleDb';
import { simpleDb } from '../db/simpleDb';
import { PdfPageViewer } from './PdfPageViewer';

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

  // Checkout form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [orderSuccessMsg, setOrderSuccessMsg] = useState('');

  const branding = restaurant.branding || { template: 'modern', primaryColor: '#f97316', bgColor: '#0d0d11', textColor: '#f0f0f4' };
  const categories = restaurant.categories || [];
  const items = restaurant.items || [];
  const menuFiles = restaurant.menuFiles || [];

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

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) return;

    try {
      const order = simpleDb.createOrder(restaurant.id, {
        customerName,
        customerPhone,
        address: deliveryAddress,
        orderType,
        items: cart,
        total: cartSubtotal
      });

      // Prepare WhatsApp text
      let waText = `*NEW ORDER - #${order.id}*\n`;
      waText += `Restaurant: ${restaurant.name}\n`;
      waText += `Customer: ${customerName} (${customerPhone})\n`;
      waText += `Type: ${orderType.toUpperCase()}\n`;
      if (deliveryAddress) waText += `Address: ${deliveryAddress}\n`;
      waText += `\n*ITEMS:*\n`;
      cart.forEach(item => {
        waText += `• ${item.quantity}x ${item.name}`;
        if (item.selectedOption) waText += ` (${item.selectedOption})`;
        if (item.selectedAddons && item.selectedAddons.length > 0) waText += ` + ${item.selectedAddons.join(', ')}`;
        waText += ` = $${item.totalPrice.toFixed(2)}\n`;
      });
      waText += `\n*TOTAL:* $${cartSubtotal.toFixed(2)}`;

      const cleanWa = restaurant.whatsappNumber ? restaurant.whatsappNumber.replace(/[^0-9+]/g, '') : '';
      if (cleanWa) {
        window.open(`https://wa.me/${cleanWa.replace('+', '')}?text=${encodeURIComponent(waText)}`, '_blank');
      }

      setOrderSuccessMsg(`✓ Order #${order.id} submitted successfully!`);
      setCart([]);
      setIsCheckoutOpen(false);
      setIsCartOpen(false);

      setTimeout(() => setOrderSuccessMsg(''), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to place order.');
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
                <label>Order Type</label>
                <div className="icv-type-selector">
                  <button
                    type="button"
                    className={orderType === 'delivery' ? 'active' : ''}
                    onClick={() => setOrderType('delivery')}
                  >
                    🛵 Delivery
                  </button>
                  <button
                    type="button"
                    className={orderType === 'pickup' ? 'active' : ''}
                    onClick={() => setOrderType('pickup')}
                  >
                    🛍️ Pickup
                  </button>
                </div>
              </div>

              {orderType === 'delivery' && (
                <div className="icv-field">
                  <label>Delivery Address</label>
                  <input
                    type="text"
                    placeholder="Street, Building, Apartment #"
                    value={deliveryAddress}
                    onChange={e => setDeliveryAddress(e.target.value)}
                  />
                </div>
              )}

              <div className="icv-checkout-summary">
                <div className="icv-summary-row">
                  <span>Total Amount:</span>
                  <span className="icv-summary-total">${cartSubtotal.toFixed(2)}</span>
                </div>
              </div>

              <button type="submit" className="icv-submit-order-btn">
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
    </div>
  );
};
