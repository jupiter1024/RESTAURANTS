import React, { useState, useRef } from 'react';
import type { SimpleRestaurant, InteractiveItem, MenuItemOption, MenuItemAddon } from '../db/simpleDb';
import { simpleDb } from '../db/simpleDb';

interface InteractiveMenuManagerProps {
  restaurant: SimpleRestaurant;
  onRefresh: () => void;
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

export const InteractiveMenuManager: React.FC<InteractiveMenuManagerProps> = ({ restaurant, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'branding' | 'orders'>('menu');

  // Category State
  const [newCatName, setNewCatName] = useState('');

  // Item Form Modal State
  const [editingItem, setEditingItem] = useState<Partial<InteractiveItem> | null>(null);

  // Form Fields
  const [itemName, setItemName] = useState('');
  const [itemCatId, setItemCatId] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemPrice, setItemPrice] = useState<string>('');
  const [itemImg, setItemImg] = useState('');
  const [itemAvailable, setItemAvailable] = useState(true);
  const [itemIsOffer, setItemIsOffer] = useState(false);

  // Options & Addons editor state
  const [itemOptions, setItemOptions] = useState<MenuItemOption[]>([]);
  const [itemAddons, setItemAddons] = useState<MenuItemAddon[]>([]);

  // Option input fields
  const [newOptName, setNewOptName] = useState('');
  const [newOptDelta, setNewOptDelta] = useState('');

  // Addon input fields
  const [newAddonName, setNewAddonName] = useState('');
  const [newAddonPrice, setNewAddonPrice] = useState('');

  // Branding Fields
  const [template, setTemplate] = useState<'modern' | 'luxury'>(restaurant.branding?.template || 'modern');
  const [primaryColor, setPrimaryColor] = useState(restaurant.branding?.primaryColor || '#f97316');
  const [bgColor, setBgColor] = useState(restaurant.branding?.bgColor || '#0d0d11');
  const [textColor, setTextColor] = useState(restaurant.branding?.textColor || '#f0f0f4');
  const [logoUrl, setLogoUrl] = useState(restaurant.branding?.logoUrl || '');

  const itemFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const categories = restaurant.categories || [];
  const items = restaurant.items || [];
  const orders = restaurant.orders || [];

  // Category Actions
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    simpleDb.addCategory(restaurant.id, newCatName.trim());
    setNewCatName('');
    onRefresh();
  };

  const handleDeleteCategory = (catId: string) => {
    if (window.confirm('Delete this category and all items inside it?')) {
      simpleDb.deleteCategory(restaurant.id, catId);
      onRefresh();
    }
  };

  // Item Form Handlers
  const openItemEditor = (item?: InteractiveItem) => {
    if (item) {
      setEditingItem(item);
      setItemName(item.name);
      setItemCatId(item.categoryId);
      setItemDesc(item.description);
      setItemPrice(item.price.toString());
      setItemImg(item.image || '');
      setItemAvailable(item.available);
      setItemIsOffer(!!item.isOffer);
      setItemOptions(item.options || []);
      setItemAddons(item.addons || []);
    } else {
      setEditingItem({});
      setItemName('');
      setItemCatId(categories.length > 0 ? categories[0].id : '');
      setItemDesc('');
      setItemPrice('10.00');
      setItemImg('');
      setItemAvailable(true);
      setItemIsOffer(false);
      setItemOptions([]);
      setItemAddons([]);
    }
  };

  const handleDeviceItemImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setItemImg(dataUrl);
    } catch (err) {
      alert('Failed to upload image');
    }
  };

  const handleDeviceLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setLogoUrl(dataUrl);
    } catch (err) {
      alert('Failed to upload logo');
    }
  };

  const addOptionToItem = () => {
    if (!newOptName.trim()) return;
    const delta = parseFloat(newOptDelta) || 0;
    const newOpt: MenuItemOption = {
      id: `opt_${Math.random().toString(36).substr(2, 6)}`,
      name: newOptName.trim(),
      priceDelta: delta
    };
    setItemOptions(prev => [...prev, newOpt]);
    setNewOptName('');
    setNewOptDelta('');
  };

  const removeOptionFromItem = (id: string) => {
    setItemOptions(prev => prev.filter(o => o.id !== id));
  };

  const addAddonToItem = () => {
    if (!newAddonName.trim()) return;
    const price = parseFloat(newAddonPrice) || 0;
    const newAddon: MenuItemAddon = {
      id: `add_${Math.random().toString(36).substr(2, 6)}`,
      name: newAddonName.trim(),
      price
    };
    setItemAddons(prev => [...prev, newAddon]);
    setNewAddonName('');
    setNewAddonPrice('');
  };

  const removeAddonFromItem = (id: string) => {
    setItemAddons(prev => prev.filter(a => a.id !== id));
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !itemCatId) return;

    simpleDb.saveItem(restaurant.id, {
      id: editingItem?.id,
      categoryId: itemCatId,
      name: itemName.trim(),
      description: itemDesc.trim(),
      price: parseFloat(itemPrice) || 0,
      image: itemImg.trim(),
      available: itemAvailable,
      isOffer: itemIsOffer,
      options: itemOptions,
      addons: itemAddons
    });

    setEditingItem(null);
    onRefresh();
  };

  const handleDeleteItem = (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      simpleDb.deleteItem(restaurant.id, itemId);
      onRefresh();
    }
  };

  // Branding Saver
  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    simpleDb.updateBranding(restaurant.id, {
      template,
      primaryColor,
      bgColor,
      textColor,
      logoUrl
    });
    onRefresh();
    alert('✓ Branding & Template updated!');
  };

  const updateOrderStatus = (orderId: string, status: any) => {
    simpleDb.updateOrderStatus(restaurant.id, orderId, status);
    onRefresh();
  };

  return (
    <div className="imm-root animate-fade-in">
      {/* Sub Tabs */}
      <div className="imm-tabs">
        <button
          className={`imm-tab ${activeTab === 'menu' ? 'active' : ''}`}
          onClick={() => setActiveTab('menu')}
        >
          🍕 Menu Categories & Items
        </button>
        <button
          className={`imm-tab ${activeTab === 'branding' ? 'active' : ''}`}
          onClick={() => setActiveTab('branding')}
        >
          🎨 Website Templates & Custom Colors
        </button>
        <button
          className={`imm-tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📦 Incoming Orders ({orders.length})
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
         TAB 1: MENU BUILDER
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'menu' && (
        <div className="imm-menu-section">
          {/* Add Category Card */}
          <div className="imm-card">
            <h3 className="imm-card-title">Manage Categories</h3>
            <form onSubmit={handleAddCategory} className="imm-inline-form">
              <input
                type="text"
                placeholder="New Category (e.g. Burgers, Fried Chicken, Meals)"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                className="imm-input"
              />
              <button type="submit" className="imm-btn-primary">+ Add Category</button>
            </form>

            <div className="imm-cat-tags">
              {categories.map(cat => (
                <div key={cat.id} className="imm-cat-tag">
                  <span>{cat.name}</span>
                  <button onClick={() => handleDeleteCategory(cat.id)}>✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* Add Item Button */}
          <div className="imm-add-item-bar">
            <h3 className="imm-card-title">Menu Items ({items.length})</h3>
            <button className="imm-btn-primary" onClick={() => openItemEditor()}>
              + Create New Dish / Item
            </button>
          </div>

          {/* Items List Grouped by Category */}
          {categories.map(cat => {
            const catItems = items.filter(i => i.categoryId === cat.id);
            return (
              <div key={cat.id} className="imm-cat-group">
                <h4 className="imm-cat-group-title">{cat.name} ({catItems.length})</h4>
                <div className="imm-items-grid">
                  {catItems.map(item => (
                    <div key={item.id} className="imm-item-card">
                      {item.image && <img src={item.image} alt={item.name} className="imm-item-thumb" />}
                      <div className="imm-item-info">
                        <div className="imm-item-header">
                          <span className="imm-item-name">{item.name}</span>
                          <span className="imm-item-price">${item.price.toFixed(2)}</span>
                        </div>
                        <p className="imm-item-desc">{item.description}</p>

                        {/* Badges for options / addons */}
                        <div className="imm-badges">
                          {item.options && item.options.length > 0 && (
                            <span className="imm-badge imm-badge-opt">
                              {item.options.length} Sizes/Variants (e.g. {item.options.map(o => o.name).join(', ')})
                            </span>
                          )}
                          {item.addons && item.addons.length > 0 && (
                            <span className="imm-badge imm-badge-add">
                              {item.addons.length} Add-ons
                            </span>
                          )}
                        </div>

                        <div className="imm-item-controls">
                          <button className="imm-btn-sm" onClick={() => openItemEditor(item)}>✏️ Edit</button>
                          <button className="imm-btn-sm imm-btn-danger" onClick={() => handleDeleteItem(item.id)}>🗑️ Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* ITEM EDITOR MODAL */}
          {editingItem && (
            <div className="icv-modal-overlay" onClick={() => setEditingItem(null)}>
              <div className="imm-modal-card animate-scale-up" onClick={e => e.stopPropagation()}>
                <div className="icv-cart-header">
                  <h2>{editingItem.id ? 'Edit Dish / Item' : 'Create New Dish / Item'}</h2>
                  <button onClick={() => setEditingItem(null)}>✕</button>
                </div>

                <form onSubmit={handleSaveItem} className="imm-form">
                  <div className="imm-form-grid">
                    <div className="imm-field">
                      <label>Dish Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Smokey BBQ Bacon Burger"
                        value={itemName}
                        onChange={e => setItemName(e.target.value)}
                        className="imm-input"
                      />
                    </div>

                    <div className="imm-field">
                      <label>Category *</label>
                      <select
                        value={itemCatId}
                        onChange={e => setItemCatId(e.target.value)}
                        className="imm-input"
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="imm-field">
                    <label>Description</label>
                    <textarea
                      placeholder="Ingredients, flavors, weight..."
                      value={itemDesc}
                      onChange={e => setItemDesc(e.target.value)}
                      className="imm-input"
                      rows={2}
                    />
                  </div>

                  <div className="imm-form-grid">
                    <div className="imm-field">
                      <label>Base Price ($) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={itemPrice}
                        onChange={e => setItemPrice(e.target.value)}
                        className="imm-input"
                      />
                    </div>

                    {/* Dish Image Upload from Device */}
                    <div className="imm-field">
                      <label>Dish Image (Upload Device Photo or Paste URL)</label>
                      <div className="imm-image-upload-wrap">
                        <input
                          ref={itemFileInputRef}
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handleDeviceItemImageUpload}
                        />
                        <button
                          type="button"
                          className="imm-btn-upload-file"
                          onClick={() => itemFileInputRef.current?.click()}
                        >
                          📸 Upload Image from Device
                        </button>
                        <input
                          type="url"
                          placeholder="Or paste Image URL (https://...)"
                          value={itemImg}
                          onChange={e => setItemImg(e.target.value)}
                          className="imm-input"
                        />
                      </div>
                      {itemImg && (
                        <div className="imm-img-preview-box">
                          <img src={itemImg} alt="Preview" className="imm-preview-img" />
                          <button type="button" onClick={() => setItemImg('')}>Remove Image</button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Checkbox options */}
                  <div className="imm-checkbox-group">
                    <label className="imm-checkbox-label">
                      <input
                        type="checkbox"
                        checked={itemIsOffer}
                        onChange={e => setItemIsOffer(e.target.checked)}
                      />
                      Highlight as Special Offer / Combo Deal 🔥
                    </label>
                  </div>

                  {/* ──────── OPTIONS / VARIANTS EDITOR ──────── */}
                  <div className="imm-sub-editor">
                    <h4 className="imm-sub-title">Sizes / Variants (e.g. Single/Double/Triple or 3/6/12 Pieces)</h4>
                    
                    <div className="imm-sub-inputs">
                      <input
                        type="text"
                        placeholder="Option Name (e.g. Double Patty 300g or 6 Pieces Box)"
                        value={newOptName}
                        onChange={e => setNewOptName(e.target.value)}
                        className="imm-input"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Price Delta ($) e.g. +4.50"
                        value={newOptDelta}
                        onChange={e => setNewOptDelta(e.target.value)}
                        className="imm-input"
                      />
                      <button type="button" onClick={addOptionToItem} className="imm-btn-primary">+ Add Option</button>
                    </div>

                    <div className="imm-sub-list">
                      {itemOptions.map(opt => (
                        <div key={opt.id} className="imm-sub-item">
                          <span>{opt.name} ({opt.priceDelta >= 0 ? `+$${opt.priceDelta.toFixed(2)}` : `-$${Math.abs(opt.priceDelta).toFixed(2)}`})</span>
                          <button type="button" onClick={() => removeOptionFromItem(opt.id)}>✕</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ──────── ADD-ONS EDITOR ──────── */}
                  <div className="imm-sub-editor">
                    <h4 className="imm-sub-title">Add-ons & Extras (e.g. Extra Cheese, Sauces, Bacon)</h4>
                    
                    <div className="imm-sub-inputs">
                      <input
                        type="text"
                        placeholder="Add-on Name (e.g. Extra Cheddar Cheese)"
                        value={newAddonName}
                        onChange={e => setNewAddonName(e.target.value)}
                        className="imm-input"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Price ($) e.g. 1.50"
                        value={newAddonPrice}
                        onChange={e => setNewAddonPrice(e.target.value)}
                        className="imm-input"
                      />
                      <button type="button" onClick={addAddonToItem} className="imm-btn-primary">+ Add Extra</button>
                    </div>

                    <div className="imm-sub-list">
                      {itemAddons.map(addon => (
                        <div key={addon.id} className="imm-sub-item">
                          <span>{addon.name} (+${addon.price.toFixed(2)})</span>
                          <button type="button" onClick={() => removeAddonFromItem(addon.id)}>✕</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="imm-form-actions">
                    <button type="submit" className="imm-btn-save-item">Save Dish / Item</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
         TAB 2: BRANDING & 2 TEMPLATES CUSTOMIZER
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'branding' && (
        <div className="imm-card">
          <h3 className="imm-card-title">Choose Website Template & Custom Theme Colors</h3>
          <form onSubmit={handleSaveBranding} className="imm-form">

            {/* Template Chooser */}
            <div className="imm-field">
              <label>Select Website Layout Template</label>
              <div className="imm-template-selector-grid">
                <div
                  className={`imm-template-card ${template === 'modern' ? 'active' : ''}`}
                  onClick={() => {
                    setTemplate('modern');
                    setBgColor('#0d0d11');
                    setTextColor('#f0f0f4');
                    setPrimaryColor('#f97316');
                  }}
                >
                  <div className="imm-template-badge">Template 1</div>
                  <h4>Modern Bistro Glassmorphic</h4>
                  <p>Sleek dark theme with glowing accent gradients, pill tabs, and vibrant interactive cards.</p>
                </div>

                <div
                  className={`imm-template-card ${template === 'luxury' ? 'active' : ''}`}
                  onClick={() => {
                    setTemplate('luxury');
                    setBgColor('#faf8f5');
                    setTextColor('#1c1917');
                    setPrimaryColor('#b45309');
                  }}
                >
                  <div className="imm-template-badge">Template 2</div>
                  <h4>Luxury Fine Dining / Warm Cafe</h4>
                  <p>Elegant serif typography, warm cream background, gold accents, and ultra-clean minimal cards.</p>
                </div>
              </div>
            </div>

            {/* Logo Upload */}
            <div className="imm-field">
              <label>Restaurant Logo (Upload Device File or Paste URL)</label>
              <div className="imm-image-upload-wrap">
                <input
                  ref={logoFileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleDeviceLogoUpload}
                />
                <button
                  type="button"
                  className="imm-btn-upload-file"
                  onClick={() => logoFileInputRef.current?.click()}
                >
                  📸 Upload Logo Image from Device
                </button>
                <input
                  type="url"
                  placeholder="https://..."
                  value={logoUrl}
                  onChange={e => setLogoUrl(e.target.value)}
                  className="imm-input"
                />
              </div>
              {logoUrl && (
                <div className="imm-logo-preview">
                  <img src={logoUrl} alt="Logo" />
                  <button type="button" onClick={() => setLogoUrl('')}>Remove Logo</button>
                </div>
              )}
            </div>

            {/* Color Customizer Grid */}
            <div className="imm-form-grid">
              {/* Background Color */}
              <div className="imm-field">
                <label>Website Background Color</label>
                <div className="imm-color-picker-row">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={e => setBgColor(e.target.value)}
                    className="imm-color-input"
                  />
                  <span className="imm-color-hex">{bgColor}</span>
                  {['#0d0d11', '#ffffff', '#faf8f5', '#0a1128'].map(hex => (
                    <button
                      key={hex}
                      type="button"
                      style={{ background: hex }}
                      className="imm-swatch"
                      onClick={() => setBgColor(hex)}
                    />
                  ))}
                </div>
              </div>

              {/* Text Color */}
              <div className="imm-field">
                <label>Website Text Color</label>
                <div className="imm-color-picker-row">
                  <input
                    type="color"
                    value={textColor}
                    onChange={e => setTextColor(e.target.value)}
                    className="imm-color-input"
                  />
                  <span className="imm-color-hex">{textColor}</span>
                  {['#f0f0f4', '#18181b', '#1e293b', '#d97706'].map(hex => (
                    <button
                      key={hex}
                      type="button"
                      style={{ background: hex }}
                      className="imm-swatch"
                      onClick={() => setTextColor(hex)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Button / Primary Color */}
            <div className="imm-field">
              <label>Button & Accent Theme Color</label>
              <div className="imm-color-picker-row">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={e => setPrimaryColor(e.target.value)}
                  className="imm-color-input"
                />
                <span className="imm-color-hex">{primaryColor}</span>
                {['#f97316', '#b45309', '#ef4444', '#10b981', '#6366f1', '#ec4899'].map(hex => (
                  <button
                    key={hex}
                    type="button"
                    style={{ background: hex }}
                    className="imm-swatch"
                    onClick={() => setPrimaryColor(hex)}
                  />
                ))}
              </div>
            </div>

            {/* ──────── LIVE INTERACTIVE PREVIEW BOX ──────── */}
            <div className="imm-live-preview-box">
              <div className="imm-live-preview-header">
                <h4>👁️ Real-time Interactive Design Preview</h4>
                <span className="imm-live-badge">Instant Live Update</span>
              </div>

              <div
                className={`imm-preview-frame imm-prev-tpl-${template}`}
                style={{
                  backgroundColor: bgColor,
                  color: textColor,
                  fontFamily: template === 'luxury' ? "'Playfair Display', Georgia, serif" : "'Inter', sans-serif"
                }}
              >
                {/* Header Preview */}
                {template === 'luxury' ? (
                  <div className="imm-prev-lux-hdr">
                    <div className="imm-prev-lux-line-top" style={{ borderColor: primaryColor }} />
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="imm-prev-logo-lux" />
                    ) : (
                      <div className="imm-prev-logo-ph-lux" style={{ color: primaryColor, borderColor: primaryColor }}>
                        {restaurant.name.charAt(0)}
                      </div>
                    )}
                    <h3 style={{ color: textColor, margin: '0.2rem 0', fontFamily: "'Playfair Display', Georgia, serif" }}>{restaurant.name}</h3>
                    <div className="imm-prev-lux-ornament" style={{ color: primaryColor, fontSize: '0.72rem' }}>
                      ❖ FINE DINING & CULINARY MENU ❖
                    </div>
                  </div>
                ) : (
                  <div className="imm-prev-modern-hdr">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="imm-prev-logo-mod" />
                    ) : (
                      <div className="imm-prev-logo-ph-mod" style={{ background: primaryColor }}>
                        {restaurant.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 style={{ color: textColor, margin: 0 }}>{restaurant.name}</h3>
                      <p style={{ color: textColor, opacity: 0.6, fontSize: '0.75rem', margin: 0 }}>Digital Menu • Fast Delivery</p>
                    </div>
                  </div>
                )}

                {/* Category Pills Preview */}
                <div className="imm-prev-cats-row">
                  <span style={{ background: primaryColor, color: '#ffffff', borderRadius: template === 'luxury' ? '4px' : '20px', padding: '0.25rem 0.75rem', fontSize: '0.72rem', fontWeight: 700 }}>
                    Burgers
                  </span>
                  <span style={{ border: `1px solid ${textColor}33`, color: textColor, borderRadius: template === 'luxury' ? '4px' : '20px', padding: '0.25rem 0.75rem', fontSize: '0.72rem', opacity: 0.8 }}>
                    Chicken
                  </span>
                  <span style={{ border: `1px solid ${textColor}33`, color: textColor, borderRadius: template === 'luxury' ? '4px' : '20px', padding: '0.25rem 0.75rem', fontSize: '0.72rem', opacity: 0.8 }}>
                    Drinks
                  </span>
                </div>

                {/* Content Layout Preview */}
                {template === 'luxury' ? (
                  <div className="imm-prev-lux-body">
                    <div style={{ textTransform: 'uppercase', color: primaryColor, fontSize: '0.75rem', fontWeight: 800, textAlign: 'center', margin: '0.8rem 0 0.4rem', letterSpacing: '0.08em' }}>
                      — GOURMET SELECTION —
                    </div>
                    <div className="imm-prev-lux-row" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderBottom: `1px dashed ${textColor}25`, paddingBottom: '0.4rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Smokey BBQ Bacon Burger</span>
                      <span style={{ flex: 1, borderBottom: `1px dotted ${textColor}30`, margin: '0 0.5rem' }} />
                      <span style={{ color: primaryColor, fontWeight: 800, fontSize: '0.88rem' }}>$11.50</span>
                    </div>
                    <p style={{ fontSize: '0.72rem', opacity: 0.7, fontStyle: 'italic', margin: '0.2rem 0 0' }}>
                      Flame-grilled Angus beef patty, smoked bacon & BBQ sauce.
                    </p>
                  </div>
                ) : (
                  <div className="imm-prev-mod-body" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${textColor}15`, borderRadius: '12px', padding: '0.75rem', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.85rem' }}>
                      <span style={{ color: textColor }}>Smokey BBQ Bacon Burger</span>
                      <span style={{ color: primaryColor, fontWeight: 800 }}>$11.50</span>
                    </div>
                    <p style={{ fontSize: '0.72rem', opacity: 0.6, margin: '0.25rem 0 0.5rem' }}>
                      Flame-grilled Angus beef patty, smoked bacon & BBQ sauce.
                    </p>
                    <button style={{ background: primaryColor, color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.35rem 0.75rem', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}>
                      + Add to Order
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button type="submit" className="imm-btn-primary">Save Template & Colors</button>
          </form>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
         TAB 3: LIVE ORDERS MANAGER
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'orders' && (
        <div className="imm-card">
          <h3 className="imm-card-title">Incoming Customer Orders</h3>

          {orders.length === 0 ? (
            <p className="imm-empty">No orders received yet.</p>
          ) : (
            <div className="imm-orders-list">
              {orders.map(order => (
                <div key={order.id} className="imm-order-card">
                  <div className="imm-order-header">
                    <div>
                      <span className="imm-order-id">#{order.id}</span>
                      <span className="imm-order-name">{order.customerName} ({order.customerPhone})</span>
                      <span className="imm-order-type">{order.orderType.toUpperCase()}</span>
                    </div>
                    <span className="imm-order-total">${order.total.toFixed(2)}</span>
                  </div>

                  {order.address && (
                    <div className="imm-order-address">📍 {order.address}</div>
                  )}

                  <div className="imm-order-items">
                    {order.items.map((item, i) => (
                      <div key={i} className="imm-order-item-line">
                        <span>{item.quantity}x {item.name} {item.selectedOption ? `(${item.selectedOption})` : ''}</span>
                        <span>${item.totalPrice.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="imm-order-status-row">
                    <span>Status: <strong className={`imm-status-${order.status}`}>{order.status.toUpperCase()}</strong></span>
                    <div className="imm-status-btns">
                      <button onClick={() => updateOrderStatus(order.id, 'preparing')}>Preparing</button>
                      <button onClick={() => updateOrderStatus(order.id, 'completed')}>Completed</button>
                      <button onClick={() => updateOrderStatus(order.id, 'cancelled')}>Cancel</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
