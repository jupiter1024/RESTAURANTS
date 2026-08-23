import React, { useState, useEffect } from 'react';
import { db } from '../db/mockDb';
import type { Restaurant, Menu, MenuItem, Order, Offer, OrderItem } from '../db/mockDb';
import { 
  ShoppingBag, X, Check, MapPin, Clock, MessageSquare, Plus, Minus, 
  Flame, Tag, ArrowRight, Globe, Sparkles, Palette, DollarSign
} from 'lucide-react';

interface TemplateWrapperProps {
  restaurantId: string;
  isPreview?: boolean;
  onClosePreview?: () => void;
}

export const TemplateWrapper: React.FC<TemplateWrapperProps> = ({
  restaurantId,
  isPreview = false,
  onClosePreview
}) => {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [siteLang, setSiteLang] = useState<'en' | 'ar'>('en');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  
  // Admin Edit UI drawer state
  const [adminDrawerOpen, setAdminDrawerOpen] = useState(false);
  const [adminTab, setAdminTab] = useState<'colors' | 'prices'>('colors');
  const [priceSavedId, setPriceSavedId] = useState<string | null>(null);

  // Customization choices
  const [selectedVariants, setSelectedVariants] = useState<Record<string, { optionName: string; priceModifier: number }>>({});
  const [selectedAddons, setSelectedAddons] = useState<Record<string, boolean>>({});
  const [itemQuantity, setItemQuantity] = useState(1);
  
  // Checkout form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('delivery');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null);
  const [whatsappLink, setWhatsappLink] = useState('');

  // Load restaurant, menu & offers
  useEffect(() => {
    const data = db.getRestaurant(restaurantId);
    const menuData = db.getMenu(restaurantId);
    const offersData = db.getOffers(restaurantId);

    if (data) setRestaurant(data);
    if (menuData) setMenu(menuData);
    if (offersData) setOffers(offersData);
  }, [restaurantId, isPreview]);

  // Direction handling
  useEffect(() => {
    const prevDir = document.documentElement.dir;
    const prevLang = document.documentElement.lang;
    document.documentElement.dir = siteLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = siteLang;
    return () => {
      document.documentElement.dir = prevDir;
      document.documentElement.lang = prevLang;
    };
  }, [siteLang]);

  if (!restaurant || !menu) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#090d16', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid #e11d48', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
          <p style={{ fontWeight: '600', fontSize: '18px' }}>Loading Bazooka & Domino's Menu...</p>
        </div>
      </div>
    );
  }

  const st = (key: string): string => {
    const dict: Record<string, { en: string; ar: string }> = {
      cart: { en: 'My Cart', ar: 'سلة الطلبات' },
      items: { en: 'items', ar: 'أطباق' },
      empty: { en: 'Your cart is empty', ar: 'سلتك فارغة حالياً' },
      emptyDesc: { en: 'Add some delicious items from our menu to get started!', ar: 'أضف بعض الأطباق الشهية من المنيو للبدء' },
      subtotal: { en: 'Subtotal', ar: 'المجموع' },
      checkout: { en: 'Proceed to Checkout', ar: 'متابعة الشراء' },
      orderType: { en: 'Delivery or Pickup', ar: 'نوع الاستلام' },
      delivery: { en: '🚴 Home Delivery', ar: '🚴 توصيل للمنزل' },
      pickup: { en: '🛍️ Restaurant Pickup', ar: '🛍️ استلام من الفرن' },
      name: { en: 'Full Name', ar: 'الاسم بالكامل' },
      phone: { en: 'Phone Number', ar: 'رقم الموبايل' },
      address: { en: 'Delivery Address', ar: 'عنوان التوصيل التفصيلي' },
      notes: { en: 'Order Notes / Instructions', ar: 'ملاحظات خاصة للطلب' },
      submitOrderWhatsApp: { en: 'Confirm Order via WhatsApp', ar: 'تأكيد الطلب عبر الواتساب' },
      add: { en: 'Add to Cart', ar: 'أضف للسلة' },
      allCategories: { en: '🔥 Full Menu', ar: '🔥 كل المنيو' },
      offersTitle: { en: 'Exclusive Deals & Combos', ar: 'عروض اليوم و الوجبات' },
      quantity: { en: 'Quantity', ar: 'الكمية' },
      currency: { en: 'EGP', ar: 'ج.م' },
      previewBanner: { en: 'LIVE PREVIEW MODE', ar: 'معاينة مباشرة' },
      closePreview: { en: 'Back to CMS', ar: 'رجوع للوحة التحكم' }
    };
    return dict[key]?.[siteLang] || key;
  };

  const tText = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    return val[siteLang] || val['en'] || '';
  };

  // Dynamic branding colors
  const brandPrimary = restaurant.branding?.primaryColor || '#e11d48';
  const brandButton = restaurant.branding?.buttonColor || brandPrimary;
  const brandSecondary = restaurant.branding?.secondaryColor || '#1e293b';
  const brandBg = restaurant.branding?.backgroundColor || '#090d16';
  const brandText = restaurant.branding?.textColor || '#f1f5f9';

  const presetThemes = [
    { name: "Domino's Crimson", primary: '#e11d48', secondary: '#1e293b', bg: '#090d16', btn: '#e11d48' },
    { name: "Bazooka Gold", primary: '#f59e0b', secondary: '#1c1917', bg: '#0c0a09', btn: '#f59e0b' },
    { name: "Flame Orange", primary: '#f97316', secondary: '#1f2937', bg: '#111827', btn: '#f97316' },
    { name: "Electric Blue", primary: '#2563eb', secondary: '#0f172a', bg: '#020617', btn: '#2563eb' },
    { name: "Emerald Fresh", primary: '#10b981', secondary: '#064e3b', bg: '#022c22', btn: '#10b981' },
    { name: "Neon Violet", primary: '#8b5cf6', secondary: '#1e1b4b', bg: '#0f0e17', btn: '#8b5cf6' },
  ];

  const handleUpdateBrandingColor = (key: string, val: string) => {
    if (!restaurant) return;
    const updatedBranding = {
      ...restaurant.branding,
      [key]: val
    };
    if (key === 'primaryColor' && (!restaurant.branding.buttonColor || restaurant.branding.buttonColor === restaurant.branding.primaryColor)) {
      updatedBranding.buttonColor = val;
    }
    const updated = { ...restaurant, branding: updatedBranding };
    setRestaurant(updated);
    db.updateRestaurant(restaurantId, { branding: updatedBranding });
  };

  const handleApplyPresetTheme = (theme: typeof presetThemes[0]) => {
    if (!restaurant) return;
    const updatedBranding = {
      ...restaurant.branding,
      primaryColor: theme.primary,
      secondaryColor: theme.secondary,
      backgroundColor: theme.bg,
      buttonColor: theme.btn,
      textColor: '#f8fafc'
    };
    setRestaurant({ ...restaurant, branding: updatedBranding });
    db.updateRestaurant(restaurantId, { branding: updatedBranding });
  };

  const handleQuickPriceUpdate = (itemId: string, newPrice: number) => {
    if (!menu) return;
    const nextCategories = menu.categories.map(cat => ({
      ...cat,
      items: cat.items.map(item => item.id === itemId ? { ...item, price: Math.max(0, newPrice) } : item)
    }));
    const nextMenu = { ...menu, categories: nextCategories };
    setMenu(nextMenu);
    db.updateMenu(restaurantId, nextMenu);
    setPriceSavedId(itemId);
    setTimeout(() => setPriceSavedId(null), 1500);
  };

  const handleExtractColorsLogo = () => {
    if (!restaurant?.logoUrl) return;
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const colorCounts: Record<string, number> = {};
        for (let i = 0; i < imageData.length; i += 40) {
          const r = imageData[i], g = imageData[i+1], b = imageData[i+2], a = imageData[i+3];
          if (a < 128 || (r > 240 && g > 240 && b > 240) || (r < 15 && g < 15 && b < 15)) continue;
          const rgb = `${r},${g},${b}`;
          colorCounts[rgb] = (colorCounts[rgb] || 0) + 1;
        }
        const sorted = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);
        if (sorted.length > 0) {
          const rgb1 = sorted[0][0].split(',').map(Number);
          const primHex = '#' + rgb1.map(x => x.toString(16).padStart(2, '0')).join('');
          handleUpdateBrandingColor('primaryColor', primHex);
          handleUpdateBrandingColor('buttonColor', primHex);
          if (sorted.length > 1) {
            const rgb2 = sorted[1][0].split(',').map(Number);
            const secHex = '#' + rgb2.map(x => x.toString(16).padStart(2, '0')).join('');
            handleUpdateBrandingColor('secondaryColor', secHex);
          }
        }
      } catch (e) {}
    };
    img.src = restaurant.logoUrl;
  };

  const openCustomizer = (item: MenuItem) => {
    setSelectedItem(item);
    setItemQuantity(1);
    const initialVariants: Record<string, { optionName: string; priceModifier: number }> = {};
    item.variants?.forEach(v => {
      if (v.options?.length > 0) {
        initialVariants[tText(v.name)] = {
          optionName: tText(v.options[0].name),
          priceModifier: v.options[0].priceModifier
        };
      }
    });
    setSelectedVariants(initialVariants);
    setSelectedAddons({});
  };

  const addToCart = () => {
    if (!selectedItem) return;
    let extraPrice = 0;
    const variantList: Array<{ name: any; optionName: any; priceModifier: number }> = [];
    Object.entries(selectedVariants).forEach(([vName, vVal]) => {
      extraPrice += vVal.priceModifier;
      variantList.push({
        name: { en: vName, ar: vName },
        optionName: { en: vVal.optionName, ar: vVal.optionName },
        priceModifier: vVal.priceModifier
      });
    });

    const addonList: Array<{ name: any; price: number }> = [];
    selectedItem.addons?.forEach(addon => {
      const aName = tText(addon.name);
      if (selectedAddons[aName]) {
        extraPrice += addon.price;
        addonList.push({ name: addon.name, price: addon.price });
      }
    });

    const unitPrice = selectedItem.price + extraPrice;
    const newItem: OrderItem = {
      itemId: selectedItem.id,
      name: selectedItem.name,
      quantity: itemQuantity,
      price: unitPrice,
      selectedVariants: variantList,
      selectedAddons: addonList
    };

    setCart(prev => [...prev, newItem]);
    setSelectedItem(null);
    setCartOpen(true);
  };

  const updateCartQuantity = (index: number, delta: number) => {
    setCart(prev => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) updated.splice(index, 1);
      else updated[index] = { ...updated[index], quantity: newQty };
      return updated;
    });
  };

  const getCartTotal = () => cart.reduce((total, i) => total + (i.price * i.quantity), 0);
  const getCartCount = () => cart.reduce((total, i) => total + i.quantity, 0);

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const orderData = {
      customerName,
      customerPhone,
      customerAddress: orderType === 'delivery' ? customerAddress : '',
      orderType,
      notes: orderNotes,
      items: cart,
      totalPrice: getCartTotal()
    };

    const savedOrder = isPreview 
      ? { ...orderData, id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`, restaurantId, status: 'pending' as const, createdAt: new Date().toISOString() }
      : db.createOrder(restaurantId, orderData);

    const itemsText = cart.map(item => {
      const vars = item.selectedVariants.map(v => tText(v.optionName)).join(', ');
      const extras = item.selectedAddons.map(a => tText(a.name)).join(', ');
      const optStr = [vars, extras].filter(Boolean).join(' | ');
      return `• ${item.quantity}x *${tText(item.name)}* ${optStr ? `(${optStr})` : ''} - ${item.price * item.quantity} ${st('currency')}`;
    }).join('\n');

    const msg = `*🚀 NEW ORDER #${savedOrder.id}*\n*Restaurant:* ${tText(restaurant.name)}\n\n*Customer:* ${customerName}\n*Phone:* ${customerPhone}\n*Type:* ${orderType === 'delivery' ? '🚴 Delivery' : '🛍️ Pickup'}\n${customerAddress ? `*Address:* ${customerAddress}\n` : ''}${orderNotes ? `*Notes:* ${orderNotes}\n` : ''}\n*ITEMS ORDERED:*\n${itemsText}\n\n*TOTAL AMOUNT:* ${getCartTotal()} ${st('currency')}`;

    const cleanPhone = (restaurant.whatsAppNumber || restaurant.phone || '201000000000').replace(/[^0-9]/g, '');
    setWhatsappLink(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`);
    setOrderSuccess(savedOrder);
    setCart([]);
    setCheckoutOpen(false);
  };

  const activeCategories = menu.categories.filter(c => c.items && c.items.some(i => !i.isHidden));
  const filteredItems = selectedCategory === 'all'
    ? activeCategories.flatMap(c => c.items.filter(i => !i.isHidden))
    : activeCategories.find(c => c.id === selectedCategory)?.items.filter(i => !i.isHidden) || [];

  return (
    <div style={{ backgroundColor: brandBg, color: brandText, minHeight: '100vh', fontFamily: restaurant.branding?.fontFamily || 'Outfit, Cairo, sans-serif', paddingBottom: '96px' }}>
      
      {/* SaaS Live Preview Header */}
      {isPreview && (
        <div style={{ position: 'sticky', top: 0, zIndex: 100, backgroundColor: brandPrimary, color: '#fff', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} />
            {st('previewBanner')} — {tText(restaurant.name)}
          </span>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              onClick={() => setAdminDrawerOpen(true)}
              style={{ backgroundColor: '#ffffff', color: brandPrimary, border: 'none', padding: '4px 12px', borderRadius: '9999px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
            >
              <Palette size={14} />
              <span>Edit UI & Prices</span>
            </button>

            {onClosePreview && (
              <button onClick={onClosePreview} style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', padding: '4px 12px', borderRadius: '9999px', fontWeight: '800', cursor: 'pointer', fontSize: '11px' }}>
                {st('closePreview')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Top Header */}
      <header style={{ position: 'sticky', top: isPreview ? '36px' : 0, zIndex: 90, backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #1e293b', padding: '12px 20px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {restaurant.logoUrl ? (
              <img src={restaurant.logoUrl} alt="Logo" style={{ width: '44px', height: '44px', borderRadius: '12px', objectFit: 'cover', border: `2px solid ${brandPrimary}` }} />
            ) : (
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: brandPrimary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '20px' }}>
                {tText(restaurant.name).charAt(0)}
              </div>
            )}
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: '900', margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {tText(restaurant.name)}
              </h1>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} color={brandPrimary} />
                {tText(restaurant.openingHours) || 'Everyday: 12:00 PM - 2:00 AM'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={() => setAdminDrawerOpen(true)}
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#f8fafc', border: `1px solid ${brandPrimary}`, padding: '8px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Palette size={14} color={brandPrimary} />
              <span>Edit UI</span>
            </button>

            <button 
              onClick={() => setSiteLang(siteLang === 'en' ? 'ar' : 'en')}
              style={{ backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Globe size={14} color={brandPrimary} />
              <span>{siteLang === 'en' ? 'عربي' : 'English'}</span>
            </button>

            <button 
              onClick={() => setCartOpen(true)}
              style={{ backgroundColor: brandButton, color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '12px', fontSize: '14px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: `0 4px 14px ${brandPrimary}66` }}
            >
              <ShoppingBag size={18} />
              <span>{st('cart')}</span>
              {getCartCount() > 0 && (
                <span style={{ backgroundColor: '#fff', color: brandPrimary, borderRadius: '9999px', padding: '2px 8px', fontSize: '12px', fontWeight: '900' }}>
                  {getCartCount()}
                </span>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* Hero Banner Section */}
      <div style={{ maxWidth: '1280px', margin: '24px auto 0', padding: '0 20px' }}>
        <div style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', height: '260px', border: '1px solid #1e293b', backgroundColor: '#020617' }}>
          <img 
            src={restaurant.heroImageUrl || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&auto=format&fit=crop&q=80'} 
            alt="Hero Banner" 
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.45 }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #020617 10%, transparent 90%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '24px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(225,29,72,0.2)', color: '#f43f5e', border: '1px solid rgba(225,29,72,0.4)', padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', width: 'max-content', marginBottom: '8px' }}>
              <Flame size={14} color="#e11d48" />
              <span>{st('offersTitle')}</span>
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#fff', margin: 0, lineHeight: 1.2 }}>
              {tText(restaurant.description) || 'Freshly Prepared Pizza & Burgers Delivered Fast to Your Doorstep!'}
            </h2>
            <p style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={14} color="#e11d48" />
              {tText(restaurant.address) || 'Main Branch, Cairo'}
            </p>
          </div>
        </div>
      </div>

      {/* Special Deals Cards */}
      {offers.length > 0 && (
        <section style={{ maxWidth: '1280px', margin: '32px auto 0', padding: '0 20px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tag size={20} color="#e11d48" />
            {st('offersTitle')}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {offers.filter(o => o.isActive).map(offer => (
              <div key={offer.id} style={{ backgroundColor: '#1e293b', border: '1px solid rgba(225,29,72,0.3)', borderRadius: '16px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
                <img src={offer.imageUrl} alt={tText(offer.title)} style={{ width: '100px', height: '100px', borderRadius: '12px', objectFit: 'cover' }} />
                <div style={{ flex: 1 }}>
                  <span style={{ backgroundColor: 'rgba(245,158,11,0.2)', color: '#fbbf24', fontSize: '10px', fontWeight: '900', padding: '2px 8px', borderRadius: '9999px', border: '1px solid rgba(245,158,11,0.3)' }}>
                    {offer.badge}
                  </span>
                  <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#fff', margin: '6px 0 4px' }}>{tText(offer.title)}</h4>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>{tText(offer.description)}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                    <span style={{ fontSize: '18px', fontWeight: '900', color: '#f43f5e' }}>{offer.dealPrice} {st('currency')}</span>
                    <button 
                      onClick={() => {
                        setCart(prev => [...prev, {
                          itemId: offer.id,
                          name: offer.title,
                          quantity: 1,
                          price: offer.dealPrice,
                          selectedVariants: [],
                          selectedAddons: []
                        }]);
                        setCartOpen(true);
                      }}
                      style={{ backgroundColor: '#e11d48', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Plus size={14} />
                      <span>{st('add')}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sticky Categories Bar */}
      <section style={{ position: 'sticky', top: isPreview ? '96px' : '68px', zIndex: 80, backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', borderTop: '1px solid #1e293b', borderBottom: '1px solid #1e293b', padding: '12px 20px', margin: '32px 0' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }} className="no-scrollbar">
          <button 
            onClick={() => setSelectedCategory('all')}
            style={{
              backgroundColor: selectedCategory === 'all' ? '#e11d48' : '#1e293b',
              color: selectedCategory === 'all' ? '#fff' : '#cbd5e1',
              border: selectedCategory === 'all' ? 'none' : '1px solid #334155',
              padding: '10px 20px',
              borderRadius: '14px',
              fontSize: '13px',
              fontWeight: '800',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>{st('allCategories')}</span>
            <span style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '9999px', fontSize: '11px' }}>
              {activeCategories.reduce((sum, c) => sum + c.items.filter(i => !i.isHidden).length, 0)}
            </span>
          </button>

          {activeCategories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                backgroundColor: selectedCategory === cat.id ? '#e11d48' : '#1e293b',
                color: selectedCategory === cat.id ? '#fff' : '#cbd5e1',
                border: selectedCategory === cat.id ? 'none' : '1px solid #334155',
                padding: '10px 20px',
                borderRadius: '14px',
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>{tText(cat.name)}</span>
              <span style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '9999px', fontSize: '11px' }}>
                {cat.items.filter(i => !i.isHidden).length}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Main Food Item Grid */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {filteredItems.map(item => (
            <div key={item.id} style={{ backgroundColor: '#1e293b', borderRadius: '20px', overflow: 'hidden', border: '1px solid #334155', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}>
              <div>
                <div style={{ position: 'relative', height: '180px' }}>
                  <img src={item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80'} alt={tText(item.name)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: 'rgba(15,23,42,0.85)', color: '#f43f5e', padding: '4px 12px', borderRadius: '9999px', fontWeight: '900', fontSize: '13px', border: '1px solid rgba(225,29,72,0.3)' }}>
                    {item.price} {st('currency')}
                  </div>
                </div>

                <div style={{ padding: '16px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', margin: '0 0 6px' }}>{tText(item.name)}</h3>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }} className="line-clamp-2">{tText(item.description)}</p>
                </div>
              </div>

              <div style={{ padding: '16px', borderTop: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>
                  {item.variants?.length ? `${item.variants.length} Options` : 'Standard'}
                </span>
                <button 
                  onClick={() => openCustomizer(item)}
                  style={{ backgroundColor: '#e11d48', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(225,29,72,0.3)' }}
                >
                  <Plus size={16} />
                  <span>{st('add')}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Item Customizer Modal */}
      {selectedItem && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, backgroundColor: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '24px', width: '100%', maxWidth: '480px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }} className="animate-fade-in">
            
            <div style={{ position: 'relative', height: '180px' }}>
              <img src={selectedItem.imageUrl} alt={tText(selectedItem.name)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button onClick={() => setSelectedItem(null)} style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              <h3 style={{ fontSize: '22px', fontWeight: '900', color: '#fff', margin: 0 }}>{tText(selectedItem.name)}</h3>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{tText(selectedItem.description)}</p>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#f43f5e', marginTop: '8px' }}>{selectedItem.price} {st('currency')}</div>

              {/* Variants Selection */}
              {selectedItem.variants?.map((variant, idx) => {
                const varName = tText(variant.name);
                return (
                  <div key={idx} style={{ marginTop: '16px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: '#cbd5e1', display: 'block', marginBottom: '8px' }}>{varName}</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {variant.options.map((opt, oIdx) => {
                        const optName = tText(opt.name);
                        const isSelected = selectedVariants[varName]?.optionName === optName;
                        return (
                          <button
                            key={oIdx}
                            onClick={() => setSelectedVariants({
                              ...selectedVariants,
                              [varName]: { optionName: optName, priceModifier: opt.priceModifier }
                            })}
                            style={{
                              backgroundColor: isSelected ? 'rgba(225,29,72,0.15)' : '#1e293b',
                              color: isSelected ? '#f43f5e' : '#cbd5e1',
                              border: isSelected ? '1px solid #e11d48' : '1px solid #334155',
                              padding: '10px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between'
                            }}
                          >
                            <span>{optName}</span>
                            {opt.priceModifier > 0 && <span>+{opt.priceModifier}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Addons Selection */}
              {selectedItem.addons && selectedItem.addons.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: '#cbd5e1', display: 'block', marginBottom: '8px' }}>Extra Add-ons</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedItem.addons.map((addon, aIdx) => {
                      const addName = tText(addon.name);
                      const isSelected = !!selectedAddons[addName];
                      return (
                        <button
                          key={aIdx}
                          onClick={() => setSelectedAddons({ ...selectedAddons, [addName]: !isSelected })}
                          style={{
                            backgroundColor: isSelected ? 'rgba(225,29,72,0.15)' : '#1e293b',
                            color: isSelected ? '#f43f5e' : '#cbd5e1',
                            border: isSelected ? '1px solid #e11d48' : '1px solid #334155',
                            padding: '10px 14px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: '1px solid #e11d48', backgroundColor: isSelected ? '#e11d48' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {isSelected && <Check size={12} color="#fff" />}
                            </div>
                            {addName}
                          </span>
                          <span>+{addon.price} {st('currency')}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #1e293b' }}>
                <span style={{ fontSize: '14px', fontWeight: '800' }}>{st('quantity')}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#1e293b', padding: '6px 12px', borderRadius: '9999px' }}>
                  <button onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><Minus size={16} /></button>
                  <span style={{ fontWeight: '900', fontSize: '14px', width: '20px', textAlign: 'center' }}>{itemQuantity}</span>
                  <button onClick={() => setItemQuantity(itemQuantity + 1)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><Plus size={16} /></button>
                </div>
              </div>
            </div>

            <div style={{ padding: '16px', borderTop: '1px solid #1e293b', backgroundColor: '#020617' }}>
              <button 
                onClick={addToCart}
                style={{ width: '100%', backgroundColor: '#e11d48', color: '#fff', border: 'none', padding: '14px', borderRadius: '16px', fontSize: '14px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(225,29,72,0.4)' }}
              >
                <ShoppingBag size={18} />
                <span>{st('add')}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Cart Sidebar Drawer */}
      {cartOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, backgroundColor: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ backgroundColor: '#0f172a', borderLeft: '1px solid #1e293b', width: '100%', maxWidth: '420px', height: '100%', display: 'flex', flexDirection: 'column' }} className="animate-fade-in">
            
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '900', fontSize: '18px' }}>
                <ShoppingBag size={20} color="#e11d48" />
                <span>{st('cart')}</span>
                <span style={{ fontSize: '12px', backgroundColor: 'rgba(225,29,72,0.2)', color: '#f43f5e', padding: '2px 8px', borderRadius: '9999px' }}>
                  {getCartCount()} {st('items')}
                </span>
              </div>
              <button onClick={() => setCartOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                  <ShoppingBag size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                  <p style={{ fontWeight: '800', fontSize: '16px', color: '#94a3b8' }}>{st('empty')}</p>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{st('emptyDesc')}</p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '12px', marginBottom: '12px', display: 'flex', justifyItems: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#fff', margin: 0 }}>{tText(item.name)}</h4>
                      {item.selectedVariants.length > 0 && (
                        <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0' }}>
                          {item.selectedVariants.map(v => tText(v.optionName)).join(', ')}
                        </p>
                      )}
                      {item.selectedAddons.length > 0 && (
                        <p style={{ fontSize: '11px', color: '#f43f5e', margin: '2px 0 0' }}>
                          + {item.selectedAddons.map(a => tText(a.name)).join(', ')}
                        </p>
                      )}
                      <div style={{ fontSize: '13px', fontWeight: '900', color: '#f43f5e', marginTop: '4px' }}>
                        {item.price * item.quantity} {st('currency')}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', padding: '4px 8px', borderRadius: '10px' }}>
                      <button onClick={() => updateCartQuantity(idx, -1)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><Minus size={14} /></button>
                      <span style={{ fontWeight: '900', fontSize: '12px', width: '16px', textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => updateCartQuantity(idx, 1)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><Plus size={14} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div style={{ padding: '16px', borderTop: '1px solid #1e293b', backgroundColor: '#020617' }}>
                <div style={{ display: 'flex', justifyItems: 'space-between', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ color: '#94a3b8', fontWeight: '700' }}>{st('subtotal')}</span>
                  <span style={{ fontSize: '20px', fontWeight: '900', color: '#f43f5e' }}>{getCartTotal()} {st('currency')}</span>
                </div>
                <button 
                  onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}
                  style={{ width: '100%', backgroundColor: '#e11d48', color: '#fff', border: 'none', padding: '14px', borderRadius: '16px', fontSize: '14px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(225,29,72,0.4)' }}
                >
                  <span>{st('checkout')}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Checkout Dialog */}
      {checkoutOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, backgroundColor: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <form onSubmit={handleCheckoutSubmit} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '24px', width: '100%', maxWidth: '480px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>{st('checkout')}</h3>
              <button type="button" onClick={() => setCheckoutOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>{st('orderType')}</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setOrderType('delivery')}
                    style={{
                      backgroundColor: orderType === 'delivery' ? 'rgba(225,29,72,0.15)' : '#1e293b',
                      color: orderType === 'delivery' ? '#f43f5e' : '#94a3b8',
                      border: orderType === 'delivery' ? '1px solid #e11d48' : '1px solid #334155',
                      padding: '12px',
                      borderRadius: '12px',
                      fontWeight: '800',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    {st('delivery')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('pickup')}
                    style={{
                      backgroundColor: orderType === 'pickup' ? 'rgba(225,29,72,0.15)' : '#1e293b',
                      color: orderType === 'pickup' ? '#f43f5e' : '#94a3b8',
                      border: orderType === 'pickup' ? '1px solid #e11d48' : '1px solid #334155',
                      padding: '12px',
                      borderRadius: '12px',
                      fontWeight: '800',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    {st('pickup')}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>{st('name')}</label>
                <input 
                  type="text" 
                  required 
                  value={customerName} 
                  onChange={e => setCustomerName(e.target.value)} 
                  style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none' }}
                  placeholder="e.g. Aly Mohamed" 
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>{st('phone')}</label>
                <input 
                  type="tel" 
                  required 
                  value={customerPhone} 
                  onChange={e => setCustomerPhone(e.target.value)} 
                  style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none' }}
                  placeholder="e.g. 01012345678" 
                />
              </div>

              {orderType === 'delivery' && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>{st('address')}</label>
                  <textarea 
                    required 
                    rows={2} 
                    value={customerAddress} 
                    onChange={e => setCustomerAddress(e.target.value)} 
                    style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none', resize: 'none' }}
                    placeholder="e.g. Street 9, Building 14, Flat 3, Maadi" 
                  />
                </div>
              )}

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>{st('notes')}</label>
                <textarea 
                  rows={2} 
                  value={orderNotes} 
                  onChange={e => setOrderNotes(e.target.value)} 
                  style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none', resize: 'none' }}
                  placeholder="e.g. Extra spicy, don't ring bell" 
                />
              </div>
            </div>

            <div style={{ padding: '16px', borderTop: '1px solid #1e293b', backgroundColor: '#020617' }}>
              <button 
                type="submit" 
                style={{ width: '100%', backgroundColor: '#e11d48', color: '#fff', border: 'none', padding: '14px', borderRadius: '16px', fontSize: '14px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(225,29,72,0.4)' }}
              >
                <span>{st('submitOrderWhatsApp')}</span>
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Success Dialog */}
      {orderSuccess && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, backgroundColor: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '24px', width: '100%', maxWidth: '420px', padding: '24px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', backgroundColor: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Check size={32} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '900', margin: '0 0 8px' }}>Order Placed Successfully!</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px', lineHeight: 1.5 }}>
              Your order has been recorded. Click below to send confirmation directly to the restaurant on WhatsApp.
            </p>

            <a 
              href={whatsappLink} 
              target="_blank" 
              rel="noreferrer" 
              style={{ backgroundColor: '#10b981', color: '#fff', textDecoration: 'none', padding: '14px', borderRadius: '16px', fontSize: '14px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(16,185,129,0.4)', marginBottom: '12px' }}
            >
              <MessageSquare size={20} />
              <span>Send via WhatsApp</span>
            </a>

            <button 
              onClick={() => setOrderSuccess(null)}
              style={{ width: '100%', backgroundColor: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', padding: '12px', borderRadius: '14px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}
            >
              Back to Menu
            </button>
          </div>
        </div>
      )}

      {/* Admin Edit UI Drawer */}
      {adminDrawerOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, backgroundColor: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ backgroundColor: '#0f172a', borderLeft: '1px solid #1e293b', width: '100%', maxWidth: '440px', height: '100%', display: 'flex', flexDirection: 'column', color: '#f8fafc' }} className="animate-fade-in">
            
            {/* Drawer Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#020617' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '900', fontSize: '16px' }}>
                <Palette size={20} color={brandPrimary} />
                <span>Admin Live Customizer</span>
              </div>
              <button onClick={() => setAdminDrawerOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            {/* Admin Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '12px 16px', gap: '8px', borderBottom: '1px solid #1e293b', backgroundColor: '#090d16' }}>
              <button
                onClick={() => setAdminTab('colors')}
                style={{
                  backgroundColor: adminTab === 'colors' ? brandPrimary : '#1e293b',
                  color: '#fff',
                  border: 'none',
                  padding: '8px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Palette size={14} />
                <span>Theme & Colors</span>
              </button>

              <button
                onClick={() => setAdminTab('prices')}
                style={{
                  backgroundColor: adminTab === 'prices' ? brandPrimary : '#1e293b',
                  color: '#fff',
                  border: 'none',
                  padding: '8px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <DollarSign size={14} />
                <span>Quick Price Edit</span>
              </button>
            </div>

            {/* Admin Content Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {adminTab === 'colors' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Preset themes */}
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
                      🎨 Domino's & Fast Food Theme Presets
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {presetThemes.map((t, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleApplyPresetTheme(t)}
                          style={{
                            backgroundColor: '#1e293b',
                            border: brandPrimary === t.primary ? `2px solid ${t.primary}` : '1px solid #334155',
                            padding: '10px',
                            borderRadius: '12px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            color: '#fff'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: t.primary }} />
                            <span style={{ fontSize: '11px', fontWeight: '800' }}>{t.name}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <div style={{ width: '16px', height: '6px', borderRadius: '2px', backgroundColor: t.bg }} />
                            <div style={{ width: '16px', height: '6px', borderRadius: '2px', backgroundColor: t.secondary }} />
                            <div style={{ width: '16px', height: '6px', borderRadius: '2px', backgroundColor: t.btn }} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AI Palette */}
                  {restaurant.logoUrl && (
                    <button
                      onClick={handleExtractColorsLogo}
                      style={{
                        backgroundColor: 'rgba(225,29,72,0.15)',
                        color: brandPrimary,
                        border: `1px solid ${brandPrimary}44`,
                        padding: '12px',
                        borderRadius: '12px',
                        fontWeight: '800',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <Sparkles size={16} />
                      <span>Extract Palette from Logo with AI</span>
                    </button>
                  )}

                  {/* Detailed Color Pickers */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', display: 'block' }}>
                      Detailed Color Pickers
                    </label>

                    {[
                      { key: 'primaryColor', label: 'Primary Brand Color', val: brandPrimary },
                      { key: 'buttonColor', label: 'Button Accent Color', val: brandButton },
                      { key: 'secondaryColor', label: 'Secondary Card Color', val: brandSecondary },
                      { key: 'backgroundColor', label: 'Page Background Color', val: brandBg },
                      { key: 'textColor', label: 'Heading Text Color', val: brandText },
                    ].map(col => (
                      <div key={col.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1e293b', padding: '10px 14px', borderRadius: '12px', border: '1px solid #334155' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#cbd5e1' }}>{col.label}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input 
                            type="color" 
                            value={col.val}
                            onChange={(e) => handleUpdateBrandingColor(col.key, e.target.value)}
                            style={{ width: '32px', height: '32px', border: 'none', background: 'none', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '11px', fontWeight: '800', fontFamily: 'monospace', textTransform: 'uppercase' }}>{col.val}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              )}

              {adminTab === 'prices' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px', fontSize: '12px', color: '#94a3b8' }}>
                    ⚡ Instant price edits update your live menu immediately without page reloads.
                  </div>

                  {menu.categories.map(cat => (
                    <div key={cat.id} style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '14px', border: '1px solid #334155' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: '900', color: brandPrimary, margin: '0 0 10px', textTransform: 'uppercase' }}>
                        {tText(cat.name)} ({cat.items.length} dishes)
                      </h4>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {cat.items.map(item => (
                          <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0f172a', padding: '8px 12px', borderRadius: '10px', border: priceSavedId === item.id ? `1px solid ${brandPrimary}` : '1px solid #1e293b' }}>
                            <div style={{ flex: 1, paddingRight: '8px' }}>
                              <div style={{ fontSize: '12px', fontWeight: '800', color: '#fff' }}>{tText(item.name)}</div>
                              <div style={{ fontSize: '10px', color: '#64748b' }}>Current: {item.price} EGP</div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                onClick={() => handleQuickPriceUpdate(item.id, item.price - 5)}
                                style={{ backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155', width: '26px', height: '26px', borderRadius: '6px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                -
                              </button>

                              <input
                                type="number"
                                value={item.price}
                                onChange={(e) => handleQuickPriceUpdate(item.id, Number(e.target.value))}
                                style={{ width: '60px', backgroundColor: '#1e293b', border: priceSavedId === item.id ? `1px solid ${brandPrimary}` : '1px solid #334155', color: '#fff', padding: '4px 6px', borderRadius: '6px', fontSize: '12px', fontWeight: '800', textAlign: 'center', outline: 'none' }}
                              />

                              <button
                                onClick={() => handleQuickPriceUpdate(item.id, item.price + 5)}
                                style={{ backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155', width: '26px', height: '26px', borderRadius: '6px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                +
                              </button>

                              {priceSavedId === item.id && (
                                <Check size={16} color="#10b981" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer button */}
            <div style={{ padding: '16px', borderTop: '1px solid #1e293b', backgroundColor: '#020617' }}>
              <button
                onClick={() => setAdminDrawerOpen(false)}
                style={{ width: '100%', backgroundColor: brandButton, color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', fontSize: '13px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Check size={16} />
                <span>Done Editing</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ maxWidth: '1280px', margin: '80px auto 0', padding: '24px 20px 0', borderTop: '1px solid #1e293b', fontSize: '12px', color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <strong style={{ color: '#cbd5e1' }}>{tText(restaurant.name)}</strong> — Powered by BistroFlow Platform
        </div>
        <div style={{ display: 'flex', gap: '16px', color: '#94a3b8' }}>
          <span>📞 {restaurant.phone}</span>
          <span>📍 {tText(restaurant.address)}</span>
        </div>
      </footer>
    </div>
  );
};
