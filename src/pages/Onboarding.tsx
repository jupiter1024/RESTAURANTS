import React, { useState } from 'react';
import { db } from '../db/mockDb';
import type { MenuCategory, MenuItem } from '../db/mockDb';
import { useLanguage } from '../utils/translate';
import { TemplateWrapper } from '../templates/TemplateWrapper';
import { 
  Building, 
  Palette, 
  Check, 
  ArrowLeft, 
  Plus, 
  Trash2,
  Upload,
  ChevronRight,
  UtensilsCrossed,
  Eye,
  Rocket,
  Store
} from 'lucide-react';

interface OnboardingProps {
  restaurantId: string;
  onOnboardingComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({
  restaurantId,
  onOnboardingComplete
}) => {
  const { t, language } = useLanguage();
  const [step, setStep] = useState(1);

  // STEP 1 FIELDS (Restaurant Info)
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descAr, setDescAr] = useState('');
  const [phone, setPhone] = useState('');
  const [addressEn, setAddressEn] = useState('');
  const [addressAr, setAddressAr] = useState('');
  const [googleMapsLink, setGoogleMapsLink] = useState('');
  const [hoursEn, setHoursEn] = useState('Everyday: 12:00 PM - 11:00 PM');
  const [hoursAr, setHoursAr] = useState('يومياً: ١٢:٠٠ م - ١١:٠٠ م');
  const [whatsAppNumber, setWhatsAppNumber] = useState('');

  // STEP 2 FIELDS (Logo)
  const [logoUrl, setLogoUrl] = useState('');

  // STEP 3 FIELDS (Branding & Design)
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [secondaryColor, setSecondaryColor] = useState('#1f2937');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [buttonColor, setButtonColor] = useState('#3b82f6');
  const [textColor, setTextColor] = useState('#0f172a');
  const [fontFamily, setFontFamily] = useState('Outfit, Cairo');
  const [templateId, setTemplateId] = useState<'modern' | 'luxury' | 'minimal' | 'fastfood'>('modern');

  // STEP 4 FIELDS (Menu)
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [editingItem, setEditingItem] = useState<{ categoryId: string; item: MenuItem } | null>(null);

  // Load initial if exists
  React.useEffect(() => {
    const res = db.getRestaurant(restaurantId);
    if (res) {
      setNameEn(res.name.en || '');
      setNameAr(res.name.ar || '');
      setDescEn(res.description.en || '');
      setDescAr(res.description.ar || '');
      setPhone(res.phone || '');
      setAddressEn(res.address.en || '');
      setAddressAr(res.address.ar || '');
      setGoogleMapsLink(res.googleMapsLink || '');
      setHoursEn(res.openingHours.en || 'Everyday: 12:00 PM - 11:00 PM');
      setHoursAr(res.openingHours.ar || 'يومياً: ١٢:٠٠ م - ١١:٠٠ م');
      setWhatsAppNumber(res.whatsAppNumber || '');
      setLogoUrl(res.logoUrl || '');
      
      setPrimaryColor(res.branding.primaryColor);
      setSecondaryColor(res.branding.secondaryColor);
      setBackgroundColor(res.branding.backgroundColor);
      setButtonColor(res.branding.buttonColor);
      setTextColor(res.branding.textColor);
      setFontFamily(res.branding.fontFamily);
      setTemplateId(res.templateId);
    }

    const menuData = db.getMenu(restaurantId);
    if (menuData && menuData.categories.length > 0) {
      setMenuCategories(menuData.categories);
    }
  }, [restaurantId]);

  const handleNextStep = () => {
    // Save current step data to DB
    if (step === 1) {
      db.updateRestaurant(restaurantId, {
        name: { en: nameEn, ar: nameAr },
        description: { en: descEn, ar: descAr },
        phone,
        address: { en: addressEn, ar: addressAr },
        googleMapsLink,
        openingHours: { en: hoursEn, ar: hoursAr },
        whatsAppNumber,
      });
    } else if (step === 2) {
      db.updateRestaurant(restaurantId, { logoUrl });
    } else if (step === 3) {
      db.updateRestaurant(restaurantId, {
        templateId,
        branding: {
          primaryColor,
          secondaryColor,
          backgroundColor,
          buttonColor,
          textColor,
          fontFamily
        }
      });
    } else if (step === 4) {
      db.updateMenu(restaurantId, {
        restaurantId,
        categories: menuCategories
      });
    }

    setStep(step + 1);
  };

  // Mock File Upload logo
  const triggerLogoUpload = (demoUrl: string) => {
    setLogoUrl(demoUrl);
  };

  const handleFinishOnboarding = () => {
    // Save final branding state
    db.updateRestaurant(restaurantId, {
      templateId,
      published: true,
      branding: {
        primaryColor,
        secondaryColor,
        backgroundColor,
        buttonColor,
        textColor,
        fontFamily
      }
    });
    onOnboardingComplete();
  };

  // Menu CRUD for onboarding
  const saveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    const nextCategories = [...menuCategories];
    const idx = nextCategories.findIndex(c => c.id === editingCategory.id);
    
    if (idx > -1) {
      nextCategories[idx] = editingCategory;
    } else {
      nextCategories.push({
        ...editingCategory,
        id: `cat_${Math.random().toString(36).substr(2, 5)}`,
        items: [],
        order: nextCategories.length + 1
      });
    }

    setMenuCategories(nextCategories);
    setEditingCategory(null);
  };

  const deleteCategory = (catId: string) => {
    if (window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذه الفئة بجميع أطباقها؟' : 'Are you sure you want to delete this category and all its dishes?')) {
      setMenuCategories(menuCategories.filter(c => c.id !== catId));
    }
  };

  const saveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const nextCategories = [...menuCategories];
    const catIdx = nextCategories.findIndex(c => c.id === editingItem.categoryId);
    if (catIdx === -1) return;

    const cat = nextCategories[catIdx];
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

    setMenuCategories(nextCategories);
    setEditingItem(null);
  };

  const deleteItem = (catId: string, itemId: string) => {
    if (window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا الطبق؟' : 'Are you sure you want to delete this dish?')) {
      const nextCategories = menuCategories.map(c => {
        if (c.id !== catId) return c;
        return { ...c, items: c.items.filter(i => i.id !== itemId) };
      });
      setMenuCategories(nextCategories);
    }
  };

  const steps = [
    { id: 1, label: language === 'ar' ? 'الحساب' : 'Account' },
    { id: 2, label: language === 'ar' ? 'المطعم' : 'Restaurant' },
    { id: 3, label: language === 'ar' ? 'التصميم' : 'Design' },
    { id: 4, label: language === 'ar' ? 'المنيو' : 'Menu' },
    { id: 5, label: language === 'ar' ? 'معاينة' : 'Preview' },
    { id: 6, label: language === 'ar' ? 'نشر' : 'Publish' },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 py-10 px-6 flex flex-col justify-between text-zinc-900">
      {/* Wizard Header */}
      <div className="max-w-6xl mx-auto w-full mb-8">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">{t('onboardingTitle')}</h2>
          <p className="text-zinc-500 text-sm mt-1 font-medium">BistroFlow {t('appSubtitle')}</p>
        </div>

        {/* Steps navigation */}
        <div className="flex justify-center items-center gap-2 mt-8 max-w-3xl mx-auto">
          {steps.map((s, idx) => {
            const isCompleted = step > s.id;
            const isActive = step === s.id;
            const isLast = idx === steps.length - 1;
            return (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center min-w-[3.5rem]">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                    isCompleted 
                      ? 'bg-emerald-600 text-white' 
                      : isActive 
                        ? 'bg-zinc-900 text-white ring-4 ring-zinc-100' 
                        : 'bg-zinc-100 text-zinc-400 border border-zinc-200'
                  }`}>
                    {isCompleted ? <Check className="w-4 h-4" /> : s.id}
                  </div>
                  <span className={`text-[11px] font-medium mt-2 text-center leading-tight ${isActive ? 'text-zinc-900' : isCompleted ? 'text-emerald-600' : 'text-zinc-400'}`}>
                    {s.label}
                  </span>
                </div>
                {!isLast && (
                  <div className={`flex-1 h-px max-w-12 sm:max-w-16 mb-5 transition-colors ${step > s.id ? 'bg-emerald-500' : 'bg-zinc-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main wizard workspace */}
      <div className="max-w-6xl mx-auto w-full bg-white border border-zinc-200 rounded-2xl p-6 sm:p-10 shadow-sm flex-1">
        {/* STEP 1: Account */}
        {step === 1 && (
          <div className="animate-fade-in space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
                <Store className="w-5 h-5 text-zinc-500" />
                {language === 'ar' ? 'معلومات الحساب' : 'Account Information'}
              </h3>
              <p className="text-sm text-zinc-500 mt-1">
                {language === 'ar' ? 'أدخل اسم مطعمك باللغتين.' : 'Enter your restaurant name in both languages.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">{t('nameEnLabel')}</label>
                <input
                  type="text"
                  required
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Bella Italia"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">{t('nameArLabel')}</label>
                <input
                  type="text"
                  required
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className="input-field text-right"
                  placeholder="مثال: بيلا إيطاليا"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={handleNextStep}
                disabled={!nameEn || !nameAr}
                className="btn-primary py-3 px-8 rounded-lg disabled:opacity-40 flex items-center gap-2"
              >
                <span>{t('nextBtn')}</span>
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Restaurant Info */}
        {step === 2 && (
          <div className="animate-fade-in space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-zinc-500" />
                {t('stepInfoTitle')}
              </h3>
              <p className="text-sm text-zinc-500 mt-1">{t('stepInfoSubtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">{t('descEnLabel')}</label>
                <textarea
                  value={descEn}
                  onChange={(e) => setDescEn(e.target.value)}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Describe your kitchen style, history, specialties..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">{t('descArLabel')}</label>
                <textarea
                  value={descAr}
                  onChange={(e) => setDescAr(e.target.value)}
                  rows={3}
                  className="input-field resize-none text-right"
                  placeholder="صف تاريخ مطبخك، تخصصاتك، طابع مطعمك..."
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">{t('phoneLabel')}</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-field"
                  placeholder="e.g. +201001234567"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">{t('whatsappLabel')}</label>
                <input
                  type="text"
                  required
                  value={whatsAppNumber}
                  onChange={(e) => setWhatsAppNumber(e.target.value)}
                  className="input-field"
                  placeholder="e.g. 201001234567"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">{t('addressEnLabel')}</label>
                <input
                  type="text"
                  value={addressEn}
                  onChange={(e) => setAddressEn(e.target.value)}
                  className="input-field"
                  placeholder="e.g. 9 Road 15, Maadi, Cairo"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">{t('addressArLabel')}</label>
                <input
                  type="text"
                  value={addressAr}
                  onChange={(e) => setAddressAr(e.target.value)}
                  className="input-field text-right"
                  placeholder="مثال: ٩ شارع ١٥، المعادي، القاهرة"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">{t('hoursEnLabel')}</label>
                <input
                  type="text"
                  value={hoursEn}
                  onChange={(e) => setHoursEn(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">{t('hoursArLabel')}</label>
                <input
                  type="text"
                  value={hoursAr}
                  onChange={(e) => setHoursAr(e.target.value)}
                  className="input-field text-right"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">{t('mapsLabel')}</label>
                <input
                  type="text"
                  value={googleMapsLink}
                  onChange={(e) => setGoogleMapsLink(e.target.value)}
                  className="input-field"
                  placeholder="Paste Google Maps URL"
                />
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-zinc-100">
              <button 
                onClick={() => setStep(1)} 
                className="btn-secondary py-3 px-6 rounded-lg flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                <span>{t('backBtn')}</span>
              </button>
              
              <button
                onClick={handleNextStep}
                disabled={!phone || !whatsAppNumber}
                className="btn-primary py-3 px-8 rounded-lg disabled:opacity-40 flex items-center gap-2"
              >
                <span>{t('nextBtn')}</span>
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Design & Branding */}
        {step === 3 && (
          <div className="animate-fade-in space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
                <Palette className="w-5 h-5 text-zinc-500" />
                {language === 'ar' ? 'التصميم والهوية' : 'Design & Branding'}
              </h3>
              <p className="text-sm text-zinc-500 mt-1">
                {language === 'ar' ? 'اختر قالباً وحدد ألوان علامتك التجارية.' : 'Choose a template and set your brand colors.'}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Branding Sidebar inputs */}
              <div className="lg:col-span-5 space-y-6">
                {/* Logo upload */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-6">
                  <h4 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider mb-4">{t('stepLogoTitle')}</h4>
                  <div className="flex items-center gap-4 mb-4">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-16 h-16 object-cover rounded-xl border border-zinc-200" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-zinc-200 flex items-center justify-center">
                        <Upload className="w-6 h-6 text-zinc-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-xs text-zinc-500 mb-2">{t('uploadLogoDesc')}</p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => triggerLogoUpload('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&auto=format&fit=crop&q=60')}
                          className="text-xs bg-white text-zinc-700 font-medium px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 transition"
                        >
                          🍕 Pizza Logo
                        </button>
                        <button
                          onClick={() => triggerLogoUpload('https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=120&auto=format&fit=crop&q=60')}
                          className="text-xs bg-white text-zinc-700 font-medium px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 transition"
                        >
                          🍔 Burger Logo
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Template Selector */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-900 uppercase tracking-wider mb-2">
                    {language === 'ar' ? 'قالب المخطط' : 'Choose Website Template'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'modern', name: t('tempModern') },
                      { id: 'luxury', name: t('tempLuxury') },
                      { id: 'minimal', name: t('tempMinimal') },
                      { id: 'fastfood', name: t('tempFastFood') }
                    ].map((tpl) => {
                      const isSel = templateId === tpl.id;
                      return (
                        <button
                          key={tpl.id}
                          onClick={() => setTemplateId(tpl.id as any)}
                          className={`py-2.5 px-3 rounded-lg border text-xs font-medium transition text-left ${
                            isSel 
                              ? 'border-zinc-900 bg-zinc-900 text-white' 
                              : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700'
                          }`}
                        >
                          {tpl.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Color pickers */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">{t('colorPrimary')}</label>
                    <div className="flex gap-2 items-center bg-white border border-zinc-200 rounded-lg p-1">
                      <input 
                        type="color" 
                        value={primaryColor} 
                        onChange={(e) => {
                          setPrimaryColor(e.target.value);
                          setButtonColor(e.target.value);
                        }}
                        className="w-8 h-8 cursor-pointer border-none bg-transparent"
                      />
                      <span className="text-[10px] font-mono font-medium text-zinc-700">{primaryColor}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">{t('colorSecondary')}</label>
                    <div className="flex gap-2 items-center bg-white border border-zinc-200 rounded-lg p-1">
                      <input 
                        type="color" 
                        value={secondaryColor} 
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-8 h-8 cursor-pointer border-none bg-transparent"
                      />
                      <span className="text-[10px] font-mono font-medium text-zinc-700">{secondaryColor}</span>
                    </div>
                  </div>
                </div>

                {/* Typography fonts selection */}
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">{t('fontLabel')}</label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="input-field py-2"
                  >
                    <option value="Outfit, Cairo">Outfit / Cairo (Modern Sans)</option>
                    <option value="Playfair Display, Cairo">Playfair Display / Cairo (Luxury Serif)</option>
                    <option value="Inter, Tajawal">Inter / Tajawal (Minimal Clean)</option>
                  </select>
                </div>
              </div>

              {/* Live Preview */}
              <div className="lg:col-span-7">
                <div className="border border-zinc-200 rounded-xl overflow-hidden h-[450px] shadow-sm relative bg-white">
                  <div className="bg-zinc-50 border-b border-zinc-200 px-4 py-2 flex items-center justify-between text-xs text-zinc-600">
                    <span className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    </span>
                    <span className="font-mono text-[10px] bg-white border border-zinc-200 px-3 py-1 rounded-md text-zinc-600 w-64 truncate text-center font-medium">
                      {nameEn.toLowerCase().replace(/[^a-z0-9]/g, '') || 'restaurant'}.bistroflow.com
                    </span>
                    <span className="text-[10px] text-emerald-600 font-medium">● Active Draft</span>
                  </div>
                  
                  <div className="h-[410px] overflow-y-auto">
                    <TemplateWrapper 
                      restaurantId={restaurantId} 
                      isPreview={true} 
                      onClosePreview={() => {}}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-zinc-100">
              <button 
                onClick={() => setStep(2)} 
                className="btn-secondary py-3 px-6 rounded-lg flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                <span>{t('backBtn')}</span>
              </button>
              
              <button
                onClick={handleNextStep}
                className="btn-primary py-3 px-8 rounded-lg flex items-center gap-2"
              >
                <span>{t('nextBtn')}</span>
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Menu */}
        {step === 4 && (
          <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-zinc-500" />
                  {language === 'ar' ? 'أضف قائمتك' : 'Add Your Menu'}
                </h3>
                <p className="text-sm text-zinc-500 mt-1">
                  {language === 'ar' ? 'أضف الفئات والأطباق يدوياً.' : 'Add categories and dishes manually.'}
                </p>
              </div>
              <button
                onClick={() => setEditingCategory({ id: '', name: { en: '', ar: '' }, order: menuCategories.length + 1, items: [] })}
                className="btn-primary py-2 px-4 rounded-lg text-sm flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>{t('addCategory')}</span>
              </button>
            </div>

            {menuCategories.length === 0 ? (
              <div className="bg-zinc-50 p-12 rounded-xl border border-zinc-200 text-center text-zinc-500 text-sm">
                {language === 'ar' ? 'لا توجد فئات بعد. أنشئ فئة للبدء بإضافة الأطباق.' : 'No categories yet. Create a category to start adding dishes.'}
              </div>
            ) : (
              <div className="space-y-6">
                {menuCategories.map((cat) => (
                  <div key={cat.id} className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-100 pb-4 mb-4 gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                          {cat.name.en || cat.name.ar}
                        </h3>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {cat.items.length} {language === 'ar' ? 'أطباق' : 'items'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => setEditingCategory(cat)}
                          className="bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                        >
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
                          <Plus className="w-3.5 h-3.5" />
                          <span>{t('addItem')}</span>
                        </button>
                      </div>
                    </div>

                    {cat.items.length === 0 ? (
                      <p className="text-xs text-zinc-400 italic py-4">
                        {language === 'ar' ? 'لا توجد أطباق في هذه الفئة بعد.' : 'No dishes added to this category yet.'}
                      </p>
                    ) : (
                      <div className="grid grid-cards">
                        {cat.items.map((item) => (
                          <div key={item.id} className="bg-zinc-50 p-4 border border-zinc-200 rounded-xl flex flex-col justify-between">
                            <div className="flex gap-3">
                              {item.imageUrl && (
                                <img src={item.imageUrl} alt={item.name.en} className="w-14 h-14 object-cover rounded-lg shrink-0 border border-zinc-200" />
                              )}
                              <div className="flex-1">
                                <h4 className="font-semibold text-xs text-zinc-900">{item.name.en || item.name.ar}</h4>
                                <p className="text-[10px] text-zinc-500 mt-1 line-clamp-2">{item.description.en || item.description.ar}</p>
                                <div className="text-xs font-semibold text-zinc-900 mt-2">{item.price} {t('currency')}</div>
                              </div>
                            </div>

                            <div className="border-t border-zinc-200/80 pt-3 mt-3 flex items-center justify-between gap-1.5">
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => setEditingItem({ categoryId: cat.id, item })}
                                  className="text-[10px] bg-zinc-100 hover:bg-zinc-200 text-zinc-600 px-2 py-1 rounded"
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

            {/* Category Modal */}
            {editingCategory && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in">
                <form onSubmit={saveCategory} className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl relative space-y-4">
                  <h3 className="text-md font-semibold text-zinc-900">
                    {editingCategory.id ? 'Edit Category' : 'Create Category'}
                  </h3>
                  
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">{t('categoryNameEn')}</label>
                    <input
                      type="text"
                      required
                      value={editingCategory.name.en}
                      onChange={(e) => setEditingCategory({
                        ...editingCategory,
                        name: { ...editingCategory.name, en: e.target.value }
                      })}
                      className="input-field"
                      placeholder="e.g. Italian Pizzas"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">{t('categoryNameAr')}</label>
                    <input
                      type="text"
                      required
                      value={editingCategory.name.ar}
                      onChange={(e) => setEditingCategory({
                        ...editingCategory,
                        name: { ...editingCategory.name, ar: e.target.value }
                      })}
                      className="input-field text-right"
                      placeholder="مثال: بيتزا إيطالية"
                      dir="rtl"
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => setEditingCategory(null)}
                      className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-4 py-2 rounded-lg text-xs font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary py-2 px-4 rounded-lg text-xs"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Menu Item Modal */}
            {editingItem && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in max-h-screen overflow-y-auto">
                <form onSubmit={saveItem} className="bg-white rounded-xl w-full max-w-lg p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
                  <h3 className="text-md font-semibold text-zinc-900">
                    {editingItem.item.id ? 'Edit Dish details' : 'Add New Dish'}
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1">{t('itemNameEn')}</label>
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
                        className="input-field"
                        placeholder="e.g. Margherita DOC"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1">{t('itemNameAr')}</label>
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
                        className="input-field text-right"
                        placeholder="مثال: بيتزا مارجريتا"
                        dir="rtl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1">{t('itemDescEn')}</label>
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
                        className="input-field resize-none"
                        placeholder="Tomato, mozzarella, basil..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1 text-right">{t('itemDescAr')}</label>
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
                        className="input-field resize-none text-right"
                        placeholder="طماطم، موزاريلا، ريحان..."
                        dir="rtl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1">{t('itemPrice')}</label>
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
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1">{t('itemImage')}</label>
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
                        className="input-field"
                        placeholder="Image URL"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-4 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={() => setEditingItem(null)}
                      className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-4 py-2 rounded-lg text-xs font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary py-2 px-4 rounded-lg text-xs"
                    >
                      Save Item
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="flex justify-between pt-6 border-t border-zinc-100">
              <button 
                onClick={() => setStep(3)} 
                className="btn-secondary py-3 px-6 rounded-lg flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                <span>{t('backBtn')}</span>
              </button>
              
              <button
                onClick={handleNextStep}
                className="btn-primary py-3 px-8 rounded-lg flex items-center gap-2"
              >
                <span>{t('nextBtn')}</span>
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Preview */}
        {step === 5 && (
          <div className="animate-fade-in space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
                <Eye className="w-5 h-5 text-zinc-500" />
                {language === 'ar' ? 'معاينة موقعك' : 'Preview Your Website'}
              </h3>
              <p className="text-sm text-zinc-500 mt-1">
                {language === 'ar' ? 'هكذا سيرى عملاؤك موقعك.' : 'This is how your customers will see your website.'}
              </p>
            </div>

            <div className="border border-zinc-200 rounded-xl overflow-hidden h-[500px] shadow-sm relative bg-white">
              <div className="bg-zinc-50 border-b border-zinc-200 px-4 py-2 flex items-center justify-between text-xs text-zinc-600">
                <span className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </span>
                <span className="font-mono text-[10px] bg-white border border-zinc-200 px-3 py-1 rounded-md text-zinc-600 w-64 truncate text-center font-medium">
                  {nameEn.toLowerCase().replace(/[^a-z0-9]/g, '') || 'restaurant'}.bistroflow.com
                </span>
                <span className="text-[10px] text-emerald-600 font-medium">● Preview</span>
              </div>
              
              <div className="h-[460px] overflow-y-auto">
                <TemplateWrapper 
                  restaurantId={restaurantId} 
                  isPreview={true} 
                  onClosePreview={() => {}}
                />
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-zinc-100">
              <button 
                onClick={() => setStep(4)} 
                className="btn-secondary py-3 px-6 rounded-lg flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                <span>{t('backBtn')}</span>
              </button>
              
              <button
                onClick={handleNextStep}
                className="btn-primary py-3 px-8 rounded-lg flex items-center gap-2"
              >
                <span>{t('nextBtn')}</span>
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: Publish */}
        {step === 6 && (
          <div className="animate-fade-in space-y-6 text-center py-10">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Rocket className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-900">
              {language === 'ar' ? 'جاهز للنشر!' : 'Ready to Publish!'}
            </h3>
            <p className="text-zinc-500 text-sm max-w-md mx-auto">
              {language === 'ar' 
                ? 'موقعك جاهز. انشر الآن ليتمكن عملاؤك من تصفحه والطلب.' 
                : 'Your website is ready. Publish now so your customers can view it and order.'}
            </p>

            <div className="max-w-md mx-auto bg-zinc-50 border border-zinc-200 rounded-xl p-6 text-left space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">{language === 'ar' ? 'اسم المطعم' : 'Restaurant Name'}</span>
                <span className="font-semibold text-zinc-900">{nameEn || nameAr}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">{language === 'ar' ? 'القالب' : 'Template'}</span>
                <span className="font-semibold text-zinc-900">{templateId}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">{language === 'ar' ? 'الفئات' : 'Categories'}</span>
                <span className="font-semibold text-zinc-900">{menuCategories.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">{language === 'ar' ? 'الأطباق' : 'Dishes'}</span>
                <span className="font-semibold text-zinc-900">{menuCategories.reduce((acc, c) => acc + c.items.length, 0)}</span>
              </div>
            </div>

            <div className="flex justify-center pt-6">
              <button
                onClick={handleFinishOnboarding}
                className="btn-primary py-3.5 px-10 rounded-lg flex items-center gap-2 shadow-lg shadow-zinc-900/10"
              >
                <Rocket className="w-4 h-4" />
                <span>{language === 'ar' ? 'انشر موقعي' : 'Publish My Website'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};