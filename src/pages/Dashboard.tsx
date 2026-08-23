import React, { useState, useEffect } from 'react';
import { db } from '../db/mockDb';
import type { Restaurant, Menu, Order, MenuCategory, MenuItem } from '../db/mockDb';
import { useLanguage } from '../utils/translate';
import { TemplateWrapper } from '../templates/TemplateWrapper';
import { 
  Sparkles, 
  Store, 
  Menu as MenuIcon, 
  Palette, 
  ShoppingBag, 
  Settings as SettingsIcon, 
  LogOut, 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  Eye,
  Languages,
  Download,
  Layers,
  Building,
  RefreshCw
} from 'lucide-react';

interface DashboardProps {
  restaurantId: string;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  restaurantId,
  onLogout
}) => {
  const { t, language, setLanguage, tText } = useLanguage();
  const [activeTab, setActiveTab] = useState<'overview' | 'menu' | 'design' | 'branding' | 'orders' | 'info' | 'settings'>('overview');
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrderFilter, setActiveOrderFilter] = useState<'all' | 'pending' | 'preparing' | 'completed' | 'cancelled'>('all');
  const [activeOrderDetails, setActiveOrderDetails] = useState<Order | null>(null);

  // States for Editing/Adding
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [editingItem, setEditingItem] = useState<{ categoryId: string; item: MenuItem } | null>(null);

  const [publishSuccessMsg, setPublishSuccessMsg] = useState('');

  // Reload dashboard data
  const reloadData = () => {
    const resData = db.getRestaurant(restaurantId);
    const menuData = db.getMenu(restaurantId);
    const orderData = db.getOrders(restaurantId);
    if (resData) setRestaurant(resData);
    if (menuData) setMenu(menuData);
    if (orderData) setOrders([...orderData].reverse()); // latest first
  };

  useEffect(() => {
    reloadData();
  }, [restaurantId]);

  if (!restaurant || !menu) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-slate-900">
        <RefreshProgress />
      </div>
    );
  }

  // Statistics
  const totalItemsCount = menu.categories.reduce((acc, cat) => acc + cat.items.length, 0);
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  const totalSales = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.totalPrice, 0);

  // QR Code URL
  const siteUrl = `${window.location.origin}/r/${restaurant.id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(siteUrl)}`;

  // Publish
  const handlePublish = () => {
    db.updateRestaurant(restaurantId, { published: true });
    setPublishSuccessMsg(t('publishSuccess'));
    reloadData();
    setTimeout(() => setPublishSuccessMsg(''), 3000);
  };

  // AI color palette extraction from Logo
  const handleExtractColors = () => {
    if (!restaurant.logoUrl) return;
    
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
          const r = imageData[i];
          const g = imageData[i+1];
          const b = imageData[i+2];
          const a = imageData[i+3];
          if (a < 128) continue;
          if (r > 240 && g > 240 && b > 240) continue;
          if (r < 15 && g < 15 && b < 15) continue;
          const rgb = `${r},${g},${b}`;
          colorCounts[rgb] = (colorCounts[rgb] || 0) + 1;
        }
        const sorted = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);
        if (sorted.length > 0) {
          const rgb1 = sorted[0][0].split(',').map(Number);
          const primHex = '#' + rgb1.map(x => x.toString(16).padStart(2, '0')).join('');
          
          let secHex = '#1f2937';
          if (sorted.length > 1) {
            const rgb2 = sorted[1][0].split(',').map(Number);
            secHex = '#' + rgb2.map(x => x.toString(16).padStart(2, '0')).join('');
          }
          
          db.updateRestaurant(restaurantId, {
            branding: {
              ...restaurant.branding,
              primaryColor: primHex,
              buttonColor: primHex,
              secondaryColor: secHex
            }
          });
          
          reloadData();
          alert(t('aiColorSuccess'));
        }
      } catch (e) {
        console.error('Failed to parse colors via canvas', e);
      }
    };
    img.src = restaurant.logoUrl;
  };

  // Menu Category CRUD
  const saveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    const nextMenu = { ...menu };
    const idx = nextMenu.categories.findIndex(c => c.id === editingCategory.id);
    
    if (idx > -1) {
      nextMenu.categories[idx] = editingCategory;
    } else {
      nextMenu.categories.push({
        ...editingCategory,
        id: `cat_${Math.random().toString(36).substr(2, 5)}`,
        items: [],
        order: nextMenu.categories.length + 1
      });
    }

    db.updateMenu(restaurantId, nextMenu);
    setEditingCategory(null);
    reloadData();
  };

  const deleteCategory = (catId: string) => {
    if (window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذه الفئة بجميع أطباقها؟' : 'Are you sure you want to delete this category and all its dishes?')) {
      const nextMenu = { ...menu };
      nextMenu.categories = nextMenu.categories.filter(c => c.id !== catId);
      db.updateMenu(restaurantId, nextMenu);
      reloadData();
    }
  };

  // Menu Item CRUD
  const saveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const nextMenu = { ...menu };
    const catIdx = nextMenu.categories.findIndex(c => c.id === editingItem.categoryId);
    if (catIdx === -1) return;

    const cat = nextMenu.categories[catIdx];
    const itemIdx = cat.items.findIndex(i => i.id === editingItem.item.id);

    if (itemIdx > -1) {
      cat.items[itemIdx] = editingItem.item;
    } else {
      cat.items.push({
        ...editingItem.item,
        id: `item_${Math.random().toString(36).substr(2, 5)}`,
        order: cat.items.length + 1
      });
    }

    db.updateMenu(restaurantId, nextMenu);
    setEditingItem(null);
    reloadData();
  };

  const deleteItem = (catId: string, itemId: string) => {
    if (window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا الطبق؟' : 'Are you sure you want to delete this dish?')) {
      const nextMenu = { ...menu };
      const catIdx = nextMenu.categories.findIndex(c => c.id === catId);
      if (catIdx > -1) {
        nextMenu.categories[catIdx].items = nextMenu.categories[catIdx].items.filter(i => i.id !== itemId);
        db.updateMenu(restaurantId, nextMenu);
        reloadData();
      }
    }
  };

  const quickSavePrice = (catId: string, itemId: string, newPrice: number) => {
    const nextCategories = menu.categories.map((c) => {
      if (c.id !== catId) return c;
      return {
        ...c,
        items: c.items.map((i) => i.id === itemId ? { ...i, price: Math.max(0, newPrice) } : i)
      };
    });
    const updatedMenu = { ...menu, categories: nextCategories };
    setMenu(updatedMenu);
    db.updateMenu(restaurantId, updatedMenu);
  };

  const toggleItemAvailability = (catId: string, itemId: string) => {
    const nextCategories = menu.categories.map((c) => {
      if (c.id !== catId) return c;
      return {
        ...c,
        items: c.items.map((i) => i.id === itemId ? { ...i, isAvailable: !i.isAvailable } : i)
      };
    });
    const updatedMenu = { ...menu, categories: nextCategories };
    setMenu(updatedMenu);
    db.updateMenu(restaurantId, updatedMenu);
  };

  // Update Order Status
  const handleUpdateOrderStatus = (orderId: string, nextStatus: Order['status']) => {
    db.updateOrderStatus(restaurantId, orderId, nextStatus);
    reloadData();
    if (activeOrderDetails && activeOrderDetails.id === orderId) {
      setActiveOrderDetails({
        ...activeOrderDetails,
        status: nextStatus
      });
    }
  };

  // Logo preset triggers
  const handleLogoUpload = (demoUrl: string) => {
    db.updateRestaurant(restaurantId, { logoUrl: demoUrl });
    reloadData();
  };

  // Cover preset triggers
  const handleCoverUpload = (demoUrl: string) => {
    db.updateRestaurant(restaurantId, { heroImageUrl: demoUrl });
    reloadData();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row relative">
      {/* Top Floating Language & Dashboard Controls */}
      <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
        {/* Languages Switcher */}
        <button
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className="text-xs bg-white text-slate-700 hover:text-blue-600 px-3 py-1.5 rounded-xl border border-slate-300 font-bold transition flex items-center gap-1 shadow-2xs"
        >
          <Languages className="w-3.5 h-3.5" />
          <span>{language === 'en' ? 'العربية' : 'English'}</span>
        </button>

        {/* View live site */}
        <a 
          href={siteUrl} 
          target="_blank" 
          rel="noreferrer"
          className="text-xs bg-blue-600 hover:bg-blue-700 text-slate-900 px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1 shadow-md shadow-blue-500/20"
        >
          <Eye className="w-3.5 h-3.5 text-slate-900" />
          <span>{t('liveSite')}</span>
        </a>
      </div>

      {/* Side Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 p-6 shadow-2xs">
        <div>
          {/* Logo Branding */}
          <div className="flex items-center gap-2.5 mb-8">
            <div className="bg-blue-600 p-2 rounded-xl text-slate-900 shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <span className="font-extrabold text-md tracking-tight text-slate-900 block">
                {tText(restaurant.name)}
              </span>
              <span className="text-[9px] font-extrabold text-blue-600 uppercase tracking-widest block">
                SaaS Dashboard
              </span>
            </div>
          </div>

          {/* Nav list */}
          <nav className="space-y-1">
            {[
              { id: 'overview', icon: <Store className="w-4 h-4" />, label: t('dashOverview') },
              { id: 'menu', icon: <MenuIcon className="w-4 h-4" />, label: t('dashMenu') },
              { id: 'design', icon: <Layers className="w-4 h-4" />, label: t('dashDesign') },
              { id: 'branding', icon: <Palette className="w-4 h-4" />, label: t('dashBranding') },
              { id: 'orders', icon: <ShoppingBag className="w-4 h-4" />, label: t('dashOrders'), badge: pendingOrdersCount > 0 ? pendingOrdersCount : null },
              { id: 'info', icon: <Building className="w-4 h-4" />, label: t('dashInfo') },
              { id: 'settings', icon: <SettingsIcon className="w-4 h-4" />, label: t('dashSettings') },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setActiveOrderDetails(null);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive 
                      ? 'bg-blue-600 text-slate-900 shadow-md shadow-blue-500/20' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {tab.icon}
                    <span>{tab.label}</span>
                  </span>
                  {tab.badge && (
                    <span className="bg-red-500 text-slate-900 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Dashboard bottom */}
        <div className="pt-6 border-t border-slate-200 mt-8 space-y-4">
          {/* Status quick toggle */}
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
              <span className={`text-[10px] font-bold ${restaurant.published ? 'text-emerald-600' : 'text-amber-600'}`}>
                {restaurant.published ? t('liveSite') : t('draftSite')}
              </span>
            </div>
            <button 
              onClick={handlePublish}
              className={`text-[9px] font-bold px-2.5 py-1 rounded-lg transition text-slate-900 ${restaurant.published ? 'bg-slate-700 hover:bg-slate-800' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {restaurant.published ? 'Unpublish' : 'Publish'}
            </button>
          </div>

          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs text-slate-500 hover:text-red-600 font-semibold transition"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('logoutBtn')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="flex-1 p-6 md:p-10 max-h-screen overflow-y-auto bg-slate-50">
        {/* Publish Alert banner */}
        {publishSuccessMsg && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs font-bold text-emerald-600 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            {publishSuccessMsg}
          </div>
        )}

        {/* ========================================================
            TAB 1: OVERVIEW
            ======================================================== */}
        {activeTab === 'overview' && (
          <div className="animate-fade-in space-y-8">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  {t('welcomeOwner')} {tText(restaurant.name)}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Here is how your restaurant website is doing today.</p>
              </div>
              <span className="text-xs bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-300 text-slate-600 font-mono">
                📅 {new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
              </span>
            </div>

            {/* Metrics cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="glass p-5 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Total Items</span>
                <div className="text-2xl font-black text-slate-900">{totalItemsCount}</div>
                <span className="text-[9px] text-slate-500">across menu categories</span>
              </div>
              <div className="glass p-5 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Pending Orders</span>
                <div className="text-2xl font-black text-amber-600">{pendingOrdersCount}</div>
                <span className="text-[9px] text-slate-500">awaiting your kitchen response</span>
              </div>
              <div className="glass p-5 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Completed Sales</span>
                <div className="text-2xl font-black text-emerald-600">{totalSales} {t('currency')}</div>
                <span className="text-[9px] text-slate-500">commission-free revenue</span>
              </div>
              <div className="glass p-5 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Billing Plan</span>
                <div className="text-2xl font-black text-blue-600 uppercase">{restaurant.pricingPlan}</div>
                <span className="text-[9px] text-slate-500">billing features config</span>
              </div>
            </div>

            {/* QR Code and Quick Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Recent Orders table */}
              <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">{t('recentOrders')}</h3>
                  {orders.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs italic">
                      {t('noOrders')}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="text-xs text-slate-600">
                        <thead>
                          <tr className="text-slate-400">
                            <th>{t('orderId')}</th>
                            <th>{t('customer')}</th>
                            <th>{t('orderTypeLabel')}</th>
                            <th>{t('totalPriceLabel')}</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.slice(0, 5).map((ord) => (
                            <tr key={ord.id} className="hover:bg-slate-100/10 cursor-pointer" onClick={() => { setActiveTab('orders'); setActiveOrderDetails(ord); }}>
                              <td className="font-mono font-bold text-blue-600">{ord.id}</td>
                              <td>{ord.customerName}</td>
                              <td>{stText(ord.orderType)}</td>
                              <td className="font-bold">{ord.totalPrice} {t('currency')}</td>
                              <td>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  ord.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                                  ord.status === 'preparing' ? 'bg-blue-50 text-blue-600' :
                                  ord.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                                  'bg-red-50 text-red-600'
                                }`}>
                                  {stText(ord.status)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                
                {orders.length > 5 && (
                  <button 
                    onClick={() => setActiveTab('orders')}
                    className="text-xs text-blue-600 hover:text-blue-300 font-semibold text-center mt-4 w-full"
                  >
                    View All Orders →
                  </button>
                )}
              </div>

              {/* QR Code generator */}
              <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs text-center flex flex-col items-center justify-center">
                <h3 className="text-xs font-bold text-slate-900 mb-2">{t('qrCodeTitle')}</h3>
                <p className="text-[10px] text-slate-500 mb-6 leading-relaxed max-w-xs">{t('qrCodeDesc')}</p>
                
                <img 
                  src={qrCodeUrl} 
                  alt="QR Menu link" 
                  className="w-40 h-40 bg-white p-2 rounded-2xl shadow-lg mb-6 border border-slate-200"
                />

                <a 
                  href={qrCodeUrl}
                  download="website_qr_code.png"
                  target="_blank" 
                  rel="noreferrer"
                  className="btn-secondary py-2 px-4 rounded-xl text-[10px] flex items-center gap-1.5 w-full justify-center"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t('downloadQr')}</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: MENU EDITOR
            ======================================================== */}
        {activeTab === 'menu' && (
          <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">{t('dashMenu')}</h2>
                <p className="text-xs text-slate-500 mt-0.5">Manage your categories and food items. Drag-and-drop order reordering is structured in arrays.</p>
              </div>
              <button
                onClick={() => setEditingCategory({ id: '', name: { en: '', ar: '' }, order: menu.categories.length + 1, items: [] })}
                className="btn-primary py-2 px-4 rounded-xl text-xs flex items-center gap-1"
              >
                <Plus className="w-4 h-4 text-slate-900" />
                <span>{t('addCategory')}</span>
              </button>
            </div>

            {/* List categories */}
            {menu.categories.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-xs text-center text-slate-500 text-xs italic">
                No categories listed yet. Create a category to start adding dishes.
              </div>
            ) : (
              <div className="space-y-6">
                {menu.categories.map((cat) => (
                  <div key={cat.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 mb-4 gap-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded">
                            Order {cat.order}
                          </span>
                          {tText(cat.name)}
                        </h3>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          ID: {cat.id} | Items: {cat.items.length}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => setEditingCategory(cat)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Rename</span>
                        </button>
                        <button
                          onClick={() => deleteCategory(cat.id)}
                          className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                        <button
                          onClick={() => setEditingItem({
                            categoryId: cat.id,
                            item: {
                              id: '',
                              name: { en: '', ar: '' },
                              description: { en: '', ar: '' },
                              price: 100,
                              imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
                              isAvailable: true,
                              isHidden: false,
                              variants: [],
                              addons: [],
                              order: cat.items.length + 1
                            }
                          })}
                          className="btn-primary py-1.5 px-3 rounded-lg text-xs flex items-center gap-1.5 ml-auto sm:ml-0"
                        >
                          <Plus className="w-3.5 h-3.5 text-slate-900" />
                          <span>{t('addItem')}</span>
                        </button>
                      </div>
                    </div>

                    {/* Category Items */}
                    {cat.items.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-4">No dishes added to this category yet.</p>
                    ) : (
                      <div className="grid grid-cards">
                        {cat.items.map((item) => (
                          <div 
                            key={item.id} 
                            className={`bg-slate-50 p-4 border rounded-2xl flex flex-col justify-between ${
                              item.isHidden ? 'border-dashed border-slate-200 opacity-60' : 'border-slate-200'
                            }`}
                          >
                            <div className="flex gap-3">
                              {item.imageUrl && (
                                <img src={item.imageUrl} alt={tText(item.name)} className="w-14 h-14 object-cover rounded-lg shrink-0 border border-slate-200" />
                              )}
                              <div className="flex-1">
                                <h4 className="font-bold text-xs text-slate-900">{tText(item.name)}</h4>
                                <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{tText(item.description)}</p>
                                
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  {/* Quick Inline Price Editor */}
                                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                                    <button
                                      type="button"
                                      onClick={() => quickSavePrice(cat.id, item.id, item.price - 5)}
                                      className="text-slate-500 hover:text-slate-900 px-1.5 py-0.5 text-[10px] font-extrabold hover:bg-slate-100 rounded"
                                    >
                                      -
                                    </button>
                                    <input
                                      type="number"
                                      value={item.price}
                                      onChange={(e) => quickSavePrice(cat.id, item.id, Number(e.target.value))}
                                      className="w-12 bg-transparent text-[10px] font-bold text-blue-600 text-center outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => quickSavePrice(cat.id, item.id, item.price + 5)}
                                      className="text-slate-500 hover:text-slate-900 px-1.5 py-0.5 text-[10px] font-extrabold hover:bg-slate-100 rounded"
                                    >
                                      +
                                    </button>
                                    <span className="text-[9px] text-slate-400 font-bold pr-1.5">{t('currency')}</span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => toggleItemAvailability(cat.id, item.id)}
                                    className={`text-[8px] font-bold px-2 py-1 rounded transition cursor-pointer ${
                                      item.isAvailable 
                                        ? 'bg-green-500/10 text-emerald-600 border border-emerald-200' 
                                        : 'bg-red-500/10 text-red-600 border border-red-200'
                                    }`}
                                  >
                                    {item.isAvailable ? 'In Stock' : 'Out of Stock'}
                                  </button>

                                  {item.isHidden && <span className="bg-slate-100 text-slate-500 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">Hidden</span>}
                                </div>
                              </div>
                            </div>

                            <div className="border-t border-slate-200/80 pt-3 mt-3 flex items-center justify-between gap-1.5">
                              {/* Option and addons tag */}
                              <div className="text-[9px] text-slate-400 font-semibold">
                                {item.variants.length > 0 ? `${item.variants.length} Options` : ''}{' '}
                                {item.addons.length > 0 ? `${item.addons.length} Addons` : ''}
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => setEditingItem({ categoryId: cat.id, item })}
                                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteItem(cat.id, item.id)}
                                  className="text-[10px] bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 px-2 py-1 rounded"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Category Modal Dialog */}
            {editingCategory && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-65 p-4 text-gray-900 animate-fade-in">
                <form onSubmit={saveCategory} className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-4">
                  <h3 className="text-md font-bold text-slate-900">
                    {editingCategory.id ? 'Edit Category' : 'Create Category'}
                  </h3>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">{t('categoryNameEn')}</label>
                    <input
                      type="text"
                      required
                      value={editingCategory.name.en}
                      onChange={(e) => setEditingCategory({
                        ...editingCategory,
                        name: { ...editingCategory.name, en: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                      placeholder="e.g. Italian Pizzas"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">{t('categoryNameAr')}</label>
                    <input
                      type="text"
                      required
                      value={editingCategory.name.ar}
                      onChange={(e) => setEditingCategory({
                        ...editingCategory,
                        name: { ...editingCategory.name, ar: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-right"
                      placeholder="مثال: بيتزا إيطالية"
                      dir="rtl"
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => setEditingCategory(null)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary py-2 px-4 rounded-xl text-xs"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Menu Item Dialog */}
            {editingItem && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-65 p-4 text-gray-900 animate-fade-in max-h-screen overflow-y-auto">
                <form onSubmit={saveItem} className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
                  <h3 className="text-md font-bold text-slate-900">
                    {editingItem.item.id ? 'Edit Dish details' : 'Add New Dish'}
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">{t('itemNameEn')}</label>
                      <input
                        type="text"
                        required
                        value={editingItem.item.name.en}
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          item: {
                            ...editingItem.item,
                            name: { ...editingItem.item.name, en: e.target.value }
                          }
                        })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                        placeholder="e.g. Margherita DOC"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">{t('itemNameAr')}</label>
                      <input
                        type="text"
                        required
                        value={editingItem.item.name.ar}
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          item: {
                            ...editingItem.item,
                            name: { ...editingItem.item.name, ar: e.target.value }
                          }
                        })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-right"
                        placeholder="مثال: بيتزا مارجريتا"
                        dir="rtl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">{t('itemDescEn')}</label>
                      <textarea
                        value={editingItem.item.description.en}
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          item: {
                            ...editingItem.item,
                            description: { ...editingItem.item.description, en: e.target.value }
                          }
                        })}
                        rows={2}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs resize-none"
                        placeholder="Tomato, mozzarella, basil..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 text-right">{t('itemDescAr')}</label>
                      <textarea
                        value={editingItem.item.description.ar}
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          item: {
                            ...editingItem.item,
                            description: { ...editingItem.item.description, ar: e.target.value }
                          }
                        })}
                        rows={2}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs resize-none text-right"
                        placeholder="طماطم، موزاريلا، ريحان..."
                        dir="rtl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">{t('itemPrice')}</label>
                      <input
                        type="number"
                        required
                        value={editingItem.item.price}
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          item: {
                            ...editingItem.item,
                            price: Number(e.target.value)
                          }
                        })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">{t('itemImage')}</label>
                      <input
                        type="text"
                        value={editingItem.item.imageUrl}
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          item: {
                            ...editingItem.item,
                            imageUrl: e.target.value
                          }
                        })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                        placeholder="Image URL"
                      />
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="flex gap-6 items-center">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <input 
                        type="checkbox" 
                        checked={editingItem.item.isAvailable} 
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          item: { ...editingItem.item, isAvailable: e.target.checked }
                        })}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>Available in Stock</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <input 
                        type="checkbox" 
                        checked={editingItem.item.isHidden} 
                        onChange={(e) => setEditingItem({
                          ...editingItem,
                          item: { ...editingItem.item, isHidden: e.target.checked }
                        })}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>Hide from Menu</span>
                    </label>
                  </div>

                  {/* Custom Option: VARIANTS & ADDONS SUB-EDITOR */}
                  <div className="border-t border-slate-100 pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-xs font-bold text-slate-800">Sizes & Variants</h4>
                      <button
                        type="button"
                        onClick={() => {
                          const nextItem = { ...editingItem.item };
                          nextItem.variants.push({
                            name: { en: 'Size', ar: 'الحجم' },
                            options: [{ name: { en: 'Regular', ar: 'عادي' }, priceModifier: 0 }]
                          });
                          setEditingItem({ ...editingItem, item: nextItem });
                        }}
                        className="text-[10px] text-blue-600 hover:underline font-bold"
                      >
                        + Add Variant Group
                      </button>
                    </div>

                    <div className="space-y-3">
                      {editingItem.item.variants.map((v, vIdx) => (
                        <div key={vIdx} className="bg-slate-50 p-3 rounded-lg border border-slate-100 relative space-y-2">
                          <button
                            type="button"
                            onClick={() => {
                              const nextItem = { ...editingItem.item };
                              nextItem.variants.splice(vIdx, 1);
                              setEditingItem({ ...editingItem, item: nextItem });
                            }}
                            className="absolute top-2 right-2 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <div className="grid grid-cols-2 gap-2 pr-6">
                            <input 
                              type="text" 
                              value={v.name.en} 
                              onChange={(e) => {
                                const nextItem = { ...editingItem.item };
                                nextItem.variants[vIdx].name.en = e.target.value;
                                setEditingItem({ ...editingItem, item: nextItem });
                              }}
                              className="px-2 py-1 border border-slate-200 rounded text-[10px] w-full"
                              placeholder="Group Name (e.g. Size)"
                            />
                            <input 
                              type="text" 
                              value={v.name.ar} 
                              onChange={(e) => {
                                const nextItem = { ...editingItem.item };
                                nextItem.variants[vIdx].name.ar = e.target.value;
                                setEditingItem({ ...editingItem, item: nextItem });
                              }}
                              className="px-2 py-1 border border-slate-200 rounded text-[10px] text-right w-full"
                              placeholder="اسم المجموعة (مثال: الحجم)"
                              dir="rtl"
                            />
                          </div>

                          {/* Options loops inside variant */}
                          <div className="pl-4 border-l border-slate-200 space-y-1.5">
                            {v.options.map((opt, oIdx) => (
                              <div key={oIdx} className="flex gap-2 items-center">
                                <input 
                                  type="text" 
                                  value={opt.name.en} 
                                  onChange={(e) => {
                                    const nextItem = { ...editingItem.item };
                                    nextItem.variants[vIdx].options[oIdx].name.en = e.target.value;
                                    setEditingItem({ ...editingItem, item: nextItem });
                                  }}
                                  className="px-1.5 py-0.5 border border-slate-200 rounded text-[9px]"
                                  placeholder="Option (EN)"
                                />
                                <input 
                                  type="text" 
                                  value={opt.name.ar} 
                                  onChange={(e) => {
                                    const nextItem = { ...editingItem.item };
                                    nextItem.variants[vIdx].options[oIdx].name.ar = e.target.value;
                                    setEditingItem({ ...editingItem, item: nextItem });
                                  }}
                                  className="px-1.5 py-0.5 border border-slate-200 rounded text-[9px] text-right"
                                  placeholder="الخيار (AR)"
                                  dir="rtl"
                                />
                                <input 
                                  type="number" 
                                  value={opt.priceModifier} 
                                  onChange={(e) => {
                                    const nextItem = { ...editingItem.item };
                                    nextItem.variants[vIdx].options[oIdx].priceModifier = Number(e.target.value);
                                    setEditingItem({ ...editingItem, item: nextItem });
                                  }}
                                  className="px-1.5 py-0.5 border border-slate-200 rounded text-[9px] w-12"
                                  placeholder="+Price"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextItem = { ...editingItem.item };
                                    nextItem.variants[vIdx].options.splice(oIdx, 1);
                                    setEditingItem({ ...editingItem, item: nextItem });
                                  }}
                                  className="text-red-600 hover:text-red-600 text-xs"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                const nextItem = { ...editingItem.item };
                                nextItem.variants[vIdx].options.push({ name: { en: 'Option', ar: 'خيار' }, priceModifier: 0 });
                                setEditingItem({ ...editingItem, item: nextItem });
                              }}
                              className="text-[9px] text-blue-600 hover:underline block"
                            >
                              + Add Option
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Addons sub-editor */}
                  <div className="border-t border-slate-100 pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-xs font-bold text-slate-800">Addons & Extras</h4>
                      <button
                        type="button"
                        onClick={() => {
                          const nextItem = { ...editingItem.item };
                          nextItem.addons.push({
                            name: { en: 'Extra Cheese', ar: 'جبنة إضافية' },
                            price: 20
                          });
                          setEditingItem({ ...editingItem, item: nextItem });
                        }}
                        className="text-[10px] text-blue-600 hover:underline font-bold"
                      >
                        + Add Extra
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {editingItem.item.addons.map((addon, aIdx) => (
                        <div key={aIdx} className="bg-slate-50 p-2 rounded border border-slate-100 flex gap-2 items-center relative pr-6">
                          <input 
                            type="text" 
                            value={addon.name.en} 
                            onChange={(e) => {
                              const nextItem = { ...editingItem.item };
                              nextItem.addons[aIdx].name.en = e.target.value;
                              setEditingItem({ ...editingItem, item: nextItem });
                            }}
                            className="px-1.5 py-0.5 border border-slate-200 rounded text-[9px] w-full animate-fade-in"
                            placeholder="Name (EN)"
                          />
                          <input 
                            type="text" 
                            value={addon.name.ar} 
                            onChange={(e) => {
                              const nextItem = { ...editingItem.item };
                              nextItem.addons[aIdx].name.ar = e.target.value;
                              setEditingItem({ ...editingItem, item: nextItem });
                            }}
                            className="px-1.5 py-0.5 border border-slate-200 rounded text-[9px] text-right w-full"
                            placeholder="الاسم (AR)"
                            dir="rtl"
                          />
                          <input 
                            type="number" 
                            value={addon.price} 
                            onChange={(e) => {
                              const nextItem = { ...editingItem.item };
                              nextItem.addons[aIdx].price = Number(e.target.value);
                              setEditingItem({ ...editingItem, item: nextItem });
                            }}
                            className="px-1.5 py-0.5 border border-slate-200 rounded text-[9px] w-14"
                            placeholder="Price"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const nextItem = { ...editingItem.item };
                              nextItem.addons.splice(aIdx, 1);
                              setEditingItem({ ...editingItem, item: nextItem });
                            }}
                            className="absolute right-1 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setEditingItem(null)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary py-2 px-4 rounded-xl text-xs"
                    >
                      Save Item
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 3: WEBSITES DESIGN / LAYOUT
            ======================================================== */}
        {activeTab === 'design' && (
          <div className="animate-fade-in space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">{t('dashDesign')}</h2>
              <p className="text-xs text-slate-500 mt-0.5">Switch the template of your generated website instantly. Content and customization are fully preserved.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { id: 'modern', name: t('tempModern'), img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=80', desc: 'Modern card grid, floating category pills, responsive food details.' },
                { id: 'luxury', name: t('tempLuxury'), img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&auto=format&fit=crop&q=80', desc: 'Serif fonts, classical menu listing with dotted leaders, full-screen cover.' },
                { id: 'minimal', name: t('tempMinimal'), img: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=500&auto=format&fit=crop&q=80', desc: 'Pure typography, high whitespace, fast mono code styling, clean list lines.' },
                { id: 'fastfood', name: t('tempFastFood'), img: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500&auto=format&fit=crop&q=80', desc: 'Playful sans, quick add-to-cart badges, large visual images, bright colors.' }
              ].map((tpl) => {
                const isSel = restaurant.templateId === tpl.id;
                return (
                  <div key={tpl.id} className={`bg-white rounded-2xl overflow-hidden border ${isSel ? 'border-blue-500' : 'border-slate-200'}`}>
                    <img src={tpl.img} alt={tpl.id} className="w-full h-40 object-cover" />
                    <div className="p-4 space-y-2">
                      <h4 className="font-bold text-slate-900 text-xs">{tpl.name}</h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed h-12 overflow-hidden">{tpl.desc}</p>
                      
                      <button
                        onClick={() => {
                          db.updateRestaurant(restaurantId, { templateId: tpl.id as any });
                          reloadData();
                        }}
                        className={`w-full py-2 rounded-xl text-[10px] font-bold transition mt-2 ${
                          isSel 
                            ? 'bg-blue-600 text-slate-900 cursor-default' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isSel ? '✓ Active Template' : 'Activate Template'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Live Interactive Web Site Preview */}
            <div className="pt-6 border-t border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-rose-500" />
                    <span>Live Website Preview</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">This is how your customers experience your menu online in real-time.</p>
                </div>
                <a 
                  href={siteUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-rose-600 hover:bg-rose-500 text-slate-900 font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Open Full Link</span>
                </a>
              </div>

              <div className="rounded-3xl border border-slate-200 overflow-hidden shadow-2xl bg-slate-50 max-h-[600px] overflow-y-auto">
                <TemplateWrapper restaurantId={restaurantId} isPreview={true} />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 4: BRANDING & THEME EDITOR
            ======================================================== */}
        {activeTab === 'branding' && (
          <div className="animate-fade-in space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">{t('dashBranding')}</h2>
              <p className="text-xs text-slate-500 mt-0.5">Customize your brand design colors, typography fonts, logo and hero cover photo.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Branding details */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
                  {/* Logo color picker trigger */}
                  {restaurant.logoUrl && (
                    <button
                      onClick={handleExtractColors}
                      className="w-full bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-600/15 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-xs transition"
                    >
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span>{t('aiColorBtn')}</span>
                    </button>
                  )}

                  {/* Colors grid */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{t('colorPaletteTitle')}</h3>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { key: 'primaryColor', label: t('colorPrimary') },
                        { key: 'secondaryColor', label: t('colorSecondary') },
                        { key: 'backgroundColor', label: t('colorBackground') },
                        { key: 'buttonColor', label: t('colorButton') },
                        { key: 'textColor', label: t('colorText') },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between bg-slate-50 p-2 border border-slate-200 rounded-xl">
                          <span className="text-[10px] text-slate-500">{item.label}</span>
                          <div className="flex gap-2 items-center">
                            <input
                              type="color"
                              value={(restaurant.branding as any)[item.key]}
                              onChange={(e) => {
                                db.updateRestaurant(restaurantId, {
                                  branding: {
                                    ...restaurant.branding,
                                    [item.key]: e.target.value
                                  }
                                });
                                reloadData();
                              }}
                              className="w-8 h-8 cursor-pointer border-none bg-transparent"
                            />
                            <span className="text-[10px] font-mono text-slate-600 font-bold uppercase">
                              {(restaurant.branding as any)[item.key]}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Typography Font */}
                  <div>
                    <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">{t('fontLabel')}</label>
                    <select
                      value={restaurant.branding.fontFamily}
                      onChange={(e) => {
                        db.updateRestaurant(restaurantId, {
                          branding: {
                            ...restaurant.branding,
                            fontFamily: e.target.value
                          }
                        });
                        reloadData();
                      }}
                      className="input-field py-2 text-xs"
                    >
                      <option value="Outfit, Cairo">Outfit / Cairo (Modern Sans)</option>
                      <option value="Playfair Display, Cairo">Playfair Display / Cairo (Luxury Serif)</option>
                      <option value="Inter, Tajawal">Inter / Tajawal (Minimal Clean)</option>
                    </select>
                  </div>
                </div>

                {/* Logo & Cover images edit presets */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Logo & Brand Media</h3>
                  
                  {/* Logo upload simulator */}
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-1.5">Change Logo</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleLogoUpload('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&auto=format&fit=crop&q=60')}
                        className="text-[9px] bg-slate-100 hover:bg-slate-100 text-slate-600 border border-slate-200 px-2 py-1 rounded"
                      >
                        Pizza Logo
                      </button>
                      <button
                        onClick={() => handleLogoUpload('https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=120&auto=format&fit=crop&q=60')}
                        className="text-[9px] bg-slate-100 hover:bg-slate-100 text-slate-600 border border-slate-200 px-2 py-1 rounded"
                      >
                        Burger Logo
                      </button>
                    </div>
                  </div>

                  {/* Cover image uploader simulator */}
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-1.5">Change Cover Photo</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCoverUpload('https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80')}
                        className="text-[9px] bg-slate-100 hover:bg-slate-100 text-slate-600 border border-slate-200 px-2 py-1 rounded"
                      >
                        Pizza Cover
                      </button>
                      <button
                        onClick={() => handleCoverUpload('https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80')}
                        className="text-[9px] bg-slate-100 hover:bg-slate-100 text-slate-600 border border-slate-200 px-2 py-1 rounded"
                      >
                        Burger Cover
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Preview Column */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Live Template Preview</h3>
                  <button 
                    onClick={handlePublish}
                    className="text-xs bg-green-600 hover:bg-green-700 text-slate-900 px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1"
                  >
                    <span>{t('publishBtn')}</span>
                  </button>
                </div>
                
                <div className="border border-slate-200 rounded-3xl overflow-hidden h-[420px] shadow-2xl relative bg-white">
                  <div className="h-full overflow-y-auto">
                    <TemplateWrapper restaurantId={restaurantId} isPreview={true} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 5: ORDERS MANAGER
            ======================================================== */}
        {activeTab === 'orders' && (
          <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">{t('dashOrders')}</h2>
                <p className="text-xs text-slate-500 mt-0.5">Manage incoming client pickup and delivery orders.</p>
              </div>
              
              {/* Order filter buttons */}
              <div className="flex gap-1 bg-slate-50 p-1 border border-slate-200 rounded-xl">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'pending', label: t('statusPending') },
                  { id: 'preparing', label: t('statusPreparing') },
                  { id: 'completed', label: t('statusCompleted') },
                  { id: 'cancelled', label: t('statusCancelled') },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setActiveOrderFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition ${
                      activeOrderFilter === f.id 
                        ? 'bg-blue-600 text-slate-900' 
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Split layout: Orders list + Details */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Orders List Table */}
              <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                {orders.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs italic">
                    {t('noOrders')}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="text-xs text-slate-600">
                      <thead>
                        <tr className="text-slate-400">
                          <th>{t('orderId')}</th>
                          <th>{t('customer')}</th>
                          <th>{t('orderTypeLabel')}</th>
                          <th>{t('totalPriceLabel')}</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders
                          .filter(o => activeOrderFilter === 'all' || o.status === activeOrderFilter)
                          .map((ord) => {
                            const isSel = activeOrderDetails?.id === ord.id;
                            return (
                              <tr 
                                key={ord.id} 
                                onClick={() => setActiveOrderDetails(ord)}
                                className={`hover:bg-slate-100/10 cursor-pointer transition ${isSel ? 'bg-blue-50 text-slate-900 font-bold' : ''}`}
                              >
                                <td className="font-mono text-blue-600 font-bold">{ord.id}</td>
                                <td>{ord.customerName}</td>
                                <td>{stText(ord.orderType)}</td>
                                <td className="font-bold">{ord.totalPrice} {t('currency')}</td>
                                <td>
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                    ord.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                                    ord.status === 'preparing' ? 'bg-blue-50 text-blue-600' :
                                    ord.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                                    'bg-red-50 text-red-600'
                                  }`}>
                                    {stText(ord.status)}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Order Detail Panel */}
              <div className="lg:col-span-5">
                {activeOrderDetails ? (
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 animate-slide-up">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Selected Order</span>
                        <h3 className="font-mono text-sm text-blue-600 font-bold">{activeOrderDetails.id}</h3>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                        activeOrderDetails.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                        activeOrderDetails.status === 'preparing' ? 'bg-blue-50 text-blue-600' :
                        activeOrderDetails.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                        'bg-red-50 text-red-600'
                      }`}>
                        {stText(activeOrderDetails.status)}
                      </span>
                    </div>

                    {/* Customer details */}
                    <div className="space-y-2 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400 block">{t('customer')}</span>
                        <span className="font-bold text-slate-900">{activeOrderDetails.customerName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">{t('phoneField')}</span>
                        <span className="font-semibold">{activeOrderDetails.customerPhone}</span>
                      </div>
                      {activeOrderDetails.orderType === 'delivery' && (
                        <div>
                          <span className="text-slate-400 block">{t('addressField')}</span>
                          <span className="font-medium">{activeOrderDetails.customerAddress}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-400 block">{t('notesLabel')}</span>
                        <p className="italic bg-slate-50/20 p-2.5 rounded-lg border border-gray-850 mt-1">
                          {activeOrderDetails.notes || 'No special notes.'}
                        </p>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="border-y border-slate-200 py-4 space-y-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Order Items</span>
                      {activeOrderDetails.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start text-xs">
                          <div>
                            <span className="font-bold text-slate-900">{item.quantity}x {tText(item.name)}</span>
                            {item.selectedVariants.length > 0 && (
                              <p className="text-[10px] text-slate-400">
                                {item.selectedVariants.map(v => tText(v.optionName)).join(', ')}
                              </p>
                            )}
                            {item.selectedAddons.length > 0 && (
                              <p className="text-[10px] text-emerald-600">
                                + {item.selectedAddons.map(a => tText(a.name)).join(', ')}
                              </p>
                            )}
                          </div>
                          <span className="font-bold">{item.price * item.quantity} {t('currency')}</span>
                        </div>
                      ))}
                      
                      <div className="flex justify-between items-center pt-2 font-bold text-slate-900 text-xs">
                        <span>Total Payable</span>
                        <span className="text-sm text-emerald-600">{activeOrderDetails.totalPrice} {t('currency')}</span>
                      </div>
                    </div>

                    {/* Order Actions */}
                    <div className="space-y-2">
                      {activeOrderDetails.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(activeOrderDetails.id, 'preparing')}
                          className="w-full btn-primary py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-4 h-4 text-slate-900" />
                          <span>{t('acceptOrder')}</span>
                        </button>
                      )}

                      {activeOrderDetails.status === 'preparing' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(activeOrderDetails.id, 'completed')}
                          className="w-full bg-green-600 hover:bg-green-700 text-slate-900 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                        >
                          <Check className="w-4 h-4 text-slate-900" />
                          <span>{t('completeOrder')}</span>
                        </button>
                      )}

                      {activeOrderDetails.status !== 'completed' && activeOrderDetails.status !== 'cancelled' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(activeOrderDetails.id, 'cancelled')}
                          className="w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 py-2 rounded-xl text-xs font-semibold transition"
                        >
                          <span>{t('cancelOrder')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs text-center text-slate-400 text-xs italic">
                    Select an order from the list to view full details and process kitchen preparation steps.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 6: STORE PROFILE INFO
            ======================================================== */}
        {activeTab === 'info' && (
          <div className="animate-fade-in space-y-6 max-w-3xl">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">{t('dashInfo')}</h2>
              <p className="text-xs text-slate-500 mt-0.5">Edit store profiles, maps, and schedules in both Arabic & English.</p>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                alert(t('publishSuccess'));
              }}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* EN */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest border-b border-slate-200 pb-2">🇬🇧 English Fields</h4>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-1">{t('nameEnLabel')}</label>
                    <input
                      type="text"
                      value={restaurant.name.en}
                      onChange={(e) => {
                        db.updateRestaurant(restaurantId, { name: { ...restaurant.name, en: e.target.value } });
                        reloadData();
                      }}
                      className="input-field text-xs py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-1">{t('descEnLabel')}</label>
                    <textarea
                      value={restaurant.description.en}
                      onChange={(e) => {
                        db.updateRestaurant(restaurantId, { description: { ...restaurant.description, en: e.target.value } });
                        reloadData();
                      }}
                      rows={3}
                      className="input-field text-xs resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-1">{t('addressEnLabel')}</label>
                    <input
                      type="text"
                      value={restaurant.address.en}
                      onChange={(e) => {
                        db.updateRestaurant(restaurantId, { address: { ...restaurant.address, en: e.target.value } });
                        reloadData();
                      }}
                      className="input-field text-xs py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-1">{t('hoursEnLabel')}</label>
                    <input
                      type="text"
                      value={restaurant.openingHours.en}
                      onChange={(e) => {
                        db.updateRestaurant(restaurantId, { openingHours: { ...restaurant.openingHours, en: e.target.value } });
                        reloadData();
                      }}
                      className="input-field text-xs py-2"
                    />
                  </div>
                </div>

                {/* AR */}
                <div className="space-y-4" dir="rtl">
                  <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest border-b border-slate-200 pb-2 text-left">🇪🇬 الحقول العربية</h4>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-1 text-right">{t('nameArLabel')}</label>
                    <input
                      type="text"
                      value={restaurant.name.ar}
                      onChange={(e) => {
                        db.updateRestaurant(restaurantId, { name: { ...restaurant.name, ar: e.target.value } });
                        reloadData();
                      }}
                      className="input-field text-xs py-2 text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-1 text-right">{t('descArLabel')}</label>
                    <textarea
                      value={restaurant.description.ar}
                      onChange={(e) => {
                        db.updateRestaurant(restaurantId, { description: { ...restaurant.description, ar: e.target.value } });
                        reloadData();
                      }}
                      rows={3}
                      className="input-field text-xs resize-none text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-1 text-right">{t('addressArLabel')}</label>
                    <input
                      type="text"
                      value={restaurant.address.ar}
                      onChange={(e) => {
                        db.updateRestaurant(restaurantId, { address: { ...restaurant.address, ar: e.target.value } });
                        reloadData();
                      }}
                      className="input-field text-xs py-2 text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-1 text-right">{t('hoursArLabel')}</label>
                    <input
                      type="text"
                      value={restaurant.openingHours.ar}
                      onChange={(e) => {
                        db.updateRestaurant(restaurantId, { openingHours: { ...restaurant.openingHours, ar: e.target.value } });
                        reloadData();
                      }}
                      className="input-field text-xs py-2 text-right"
                    />
                  </div>
                </div>
              </div>

              {/* Contacts */}
              <div className="border-t border-slate-200 pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-1">{t('phoneLabel')}</label>
                  <input
                    type="text"
                    value={restaurant.phone}
                    onChange={(e) => {
                      db.updateRestaurant(restaurantId, { phone: e.target.value });
                      reloadData();
                    }}
                    className="input-field text-xs py-2"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-1">{t('whatsappLabel')}</label>
                  <input
                    type="text"
                    value={restaurant.whatsAppNumber}
                    onChange={(e) => {
                      db.updateRestaurant(restaurantId, { whatsAppNumber: e.target.value });
                      reloadData();
                    }}
                    className="input-field text-xs py-2"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-1">{t('mapsLabel')}</label>
                  <input
                    type="text"
                    value={restaurant.googleMapsLink}
                    onChange={(e) => {
                      db.updateRestaurant(restaurantId, { googleMapsLink: e.target.value });
                      reloadData();
                    }}
                    className="input-field text-xs py-2"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-200">
                <button type="submit" className="btn-primary py-2 px-6 rounded-xl text-xs flex items-center gap-1">
                  <Check className="w-4 h-4 text-slate-900" />
                  <span>{t('saveChanges')}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================
            TAB 7: SETTINGS & DOMAINS
            ======================================================== */}
        {activeTab === 'settings' && (
          <div className="animate-fade-in space-y-6 max-w-2xl">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">{t('dashSettings')}</h2>
              <p className="text-xs text-slate-500 mt-0.5">Manage domain structures and active pricing subscriptions.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              {/* Domain settings */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">{t('domainSettings')}</h3>
                <label className="block text-[10px] text-slate-500 font-semibold mb-1.5">{t('customDomainLabel')}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={restaurant.domain.split('.')[0]}
                    onChange={(e) => {
                      db.updateRestaurant(restaurantId, { domain: `${e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')}.bistroflow.com` });
                      reloadData();
                    }}
                    className="input-field text-xs py-2 flex-1"
                  />
                  <span className="bg-slate-100 border border-slate-300 px-4 py-2 rounded-xl text-xs text-slate-500 flex items-center">
                    .bistroflow.com
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">Customers will navigate to this URL to view your active menu and place orders.</p>
              </div>

              {/* Plan Settings */}
              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">{t('pricingPlanLabel')}</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Starter Box */}
                  <div 
                    onClick={() => {
                      db.updateRestaurant(restaurantId, { pricingPlan: 'starter' });
                      reloadData();
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between h-36 ${
                      restaurant.pricingPlan === 'starter' 
                        ? 'border-blue-600 bg-blue-50' 
                        : 'border-gray-850 hover:bg-white'
                    }`}
                  >
                    <div>
                      <span className="font-extrabold text-xs text-slate-900 block">Starter Plan</span>
                      <span className="text-[10px] text-slate-500 mt-1 block">Low setup fee, static menu website. No ordering cart.</span>
                    </div>
                    <span className="text-[10px] font-black text-blue-600 mt-auto">$19 One-Time</span>
                  </div>

                  {/* Pro Box */}
                  <div 
                    onClick={() => {
                      db.updateRestaurant(restaurantId, { pricingPlan: 'professional' });
                      reloadData();
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between h-36 ${
                      restaurant.pricingPlan === 'professional' 
                        ? 'border-blue-600 bg-blue-50' 
                        : 'border-gray-855 hover:bg-white'
                    }`}
                  >
                    <div>
                      <span className="font-extrabold text-xs text-slate-900 block">Professional Plan</span>
                      <span className="text-[10px] text-slate-500 mt-1 block">Bilingual cart, ordering, WhatsApp notifications, dashboard control.</span>
                    </div>
                    <span className="text-[10px] font-black text-emerald-600 mt-auto">$49 / Month</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// Helper states
function RefreshProgress() {
  return (
    <div className="flex flex-col items-center gap-3">
      <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      <span className="text-sm font-semibold text-slate-500">Loading your BistroFlow dashboard...</span>
    </div>
  );
}

// Translations helper dictionary for Orders panel inside Dashboard
const ORDER_STATUS_TRANSLATIONS: Record<string, { en: string; ar: string }> = {
  all: { en: 'All Orders', ar: 'جميع الطلبات' },
  pending: { en: 'Pending', ar: 'قيد الانتظار' },
  preparing: { en: 'Preparing', ar: 'جاري التحضير' },
  completed: { en: 'Completed', ar: 'مكتمل' },
  cancelled: { en: 'Cancelled', ar: 'ملغي' },
  pickup: { en: 'Pickup', ar: 'استلام من المطعم' },
  delivery: { en: 'Delivery', ar: 'توصيل للمنزل' },
};

function stText(key: string): string {
  const currentLang = localStorage.getItem('bistroflow_lang') || 'en';
  return ORDER_STATUS_TRANSLATIONS[key]?.[currentLang as 'en' | 'ar'] || key;
}

