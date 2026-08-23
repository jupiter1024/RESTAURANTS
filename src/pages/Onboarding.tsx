import React, { useState } from 'react';
import { db } from '../db/mockDb';
import type { MenuCategory, MenuItem } from '../db/mockDb';
import { useLanguage } from '../utils/translate';
import { TemplateWrapper } from '../templates/TemplateWrapper';
import { 
  Building, 
  Image as ImageIcon, 
  FileText, 
  Palette, 
  Check, 
  ArrowLeft, 
  Sparkles, 
  Plus, 
  Trash2,
  Upload,
  Layers,
  ChevronRight,
  RefreshCw
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
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // STEP 3 FIELDS (Menu Import)
  const [menuFileType, setMenuFileType] = useState<'pdf' | 'csv' | 'image' | null>(null);
  const [menuFileName, setMenuFileName] = useState('');
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiProgressStep, setAiProgressStep] = useState(0);
  const [extractedCategories, setExtractedCategories] = useState<MenuCategory[]>([]);

  // STEP 4 FIELDS (Branding & Design Preview)
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [secondaryColor, setSecondaryColor] = useState('#1f2937');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [buttonColor, setButtonColor] = useState('#3b82f6');
  const [textColor, setTextColor] = useState('#0f172a');
  const [fontFamily, setFontFamily] = useState('Outfit, Cairo');
  const [templateId, setTemplateId] = useState<'modern' | 'luxury' | 'minimal' | 'fastfood'>('modern');

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
  }, [restaurantId]);

  // AI color palette extraction from Logo
  const handleExtractColors = () => {
    if (!logoUrl) return;
    
    // Canvas pixel color extractor
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
          
          let secHex = '#1e293b';
          if (sorted.length > 1) {
            const rgb2 = sorted[1][0].split(',').map(Number);
            secHex = '#' + rgb2.map(x => x.toString(16).padStart(2, '0')).join('');
          }
          
          setPrimaryColor(primHex);
          setButtonColor(primHex);
          setSecondaryColor(secHex);
          
          // Save branding colors to draft DB immediately
          db.updateRestaurant(restaurantId, {
            branding: {
              primaryColor: primHex,
              secondaryColor: secHex,
              backgroundColor,
              buttonColor: primHex,
              textColor,
              fontFamily
            }
          });
        }
      } catch (e) {
        console.error('Failed to parse colors via canvas', e);
      }
    };
    img.src = logoUrl;
  };

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
    }

    setStep(step + 1);
  };

  // Mock File Upload logo
  const triggerLogoUpload = (demoUrl: string) => {
    setUploadingLogo(true);
    setTimeout(() => {
      setLogoUrl(demoUrl);
      setUploadingLogo(false);
    }, 1000);
  };

  // Simulated AI Menu Import Progress
  const runMenuOcrSimulation = (type: 'pdf' | 'csv' | 'image', name: string) => {
    setMenuFileType(type);
    setMenuFileName(name);
    setAiProcessing(true);
    setAiProgressStep(1);

    setTimeout(() => {
      setAiProgressStep(2);
      setTimeout(() => {
        setAiProgressStep(3);
        setTimeout(() => {
          const items = db.simulateMenuExtraction(type, name);
          setExtractedCategories(items);
          setAiProcessing(false);
        }, 1500);
      }, 1500);
    }, 1200);
  };

  const handleSaveImportedMenu = () => {
    // Import categories to restaurant's menu
    db.updateMenu(restaurantId, {
      restaurantId,
      categories: extractedCategories
    });
    setStep(4);
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

  // Helper edit review menu
  const editReviewItem = (catIdx: number, itemIdx: number, field: keyof MenuItem, val: any, isAr = false) => {
    const nextCats = [...extractedCategories];
    const item = nextCats[catIdx].items[itemIdx];
    
    if (field === 'name' || field === 'description') {
      const bilingual = { ...(item[field] as any) };
      bilingual[isAr ? 'ar' : 'en'] = val;
      item[field] = bilingual;
    } else {
      (item as any)[field] = val;
    }
    
    setExtractedCategories(nextCats);
  };

  const deleteReviewItem = (catIdx: number, itemIdx: number) => {
    const nextCats = [...extractedCategories];
    nextCats[catIdx].items.splice(itemIdx, 1);
    setExtractedCategories(nextCats);
  };

  const addReviewItem = (catIdx: number) => {
    const nextCats = [...extractedCategories];
    const newItem: MenuItem = {
      id: `new_item_${Math.random().toString(36).substr(2, 5)}`,
      name: { en: 'New Dish', ar: 'طبق جديد' },
      description: { en: 'Dish description details', ar: 'تفاصيل وصف الطبق' },
      price: 100,
      imageUrl: '',
      isAvailable: true,
      isHidden: false,
      variants: [],
      addons: [],
      order: nextCats[catIdx].items.length + 1
    };
    nextCats[catIdx].items.push(newItem);
    setExtractedCategories(nextCats);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6 flex flex-col justify-between text-slate-900">
      {/* Wizard Header */}
      <div className="max-w-6xl mx-auto w-full mb-8">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{t('onboardingTitle')}</h2>
          <p className="text-slate-500 text-xs mt-1 font-medium">BistroFlow {t('appSubtitle')}</p>
        </div>

        {/* Steps navigation circles */}
        <div className="flex justify-center items-center gap-2 mt-8 max-w-lg mx-auto">
          {[1, 2, 3, 4].map((s) => {
            const isCompleted = step > s;
            const isActive = step === s;
            const labels = [t('onboardingStep1'), t('onboardingStep2'), t('onboardingStep3'), t('onboardingStep4')];
            return (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition duration-300 ${
                    isCompleted 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : isActive 
                        ? 'bg-blue-600 text-white scale-110 shadow-md shadow-blue-500/20' 
                        : 'bg-slate-200 text-slate-500 border border-slate-300'
                  }`}>
                    {isCompleted ? <Check className="w-4 h-4 text-white" /> : s}
                  </div>
                  <span className={`text-[10px] font-bold mt-1.5 ${isActive ? 'text-blue-600' : 'text-slate-500'}`}>
                    {labels[s-1]}
                  </span>
                </div>
                {s < 4 && <div className={`flex-1 h-0.5 max-w-16 transition-colors duration-300 ${step > s ? 'bg-emerald-600' : 'bg-slate-200'}`} />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main wizard workspace */}
      <div className="max-w-6xl mx-auto w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-lg flex-1">
        {step === 1 && (
          <div className="animate-fade-in space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                {t('stepInfoTitle')}
              </h3>
              <p className="text-xs text-slate-500 mt-1">{t('stepInfoSubtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* English Inputs */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-blue-700 tracking-wider">🇬🇧 English Details</h4>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('nameEnLabel')}</label>
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('descEnLabel')}</label>
                  <textarea
                    value={descEn}
                    onChange={(e) => setDescEn(e.target.value)}
                    rows={3}
                    className="input-field resize-none"
                    placeholder="Describe your kitchen style, history, specialties..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('addressEnLabel')}</label>
                  <input
                    type="text"
                    value={addressEn}
                    onChange={(e) => setAddressEn(e.target.value)}
                    className="input-field"
                    placeholder="e.g. 9 Road 15, Maadi, Cairo"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('hoursEnLabel')}</label>
                  <input
                    type="text"
                    value={hoursEn}
                    onChange={(e) => setHoursEn(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Arabic Inputs */}
              <div className="space-y-4" dir="rtl">
                <h4 className="text-xs font-black uppercase text-blue-700 tracking-wider text-left">🇪🇬 التفاصيل بالعربية</h4>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 text-right">{t('nameArLabel')}</label>
                  <input
                    type="text"
                    required
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    className="input-field text-right"
                    placeholder="مثال: بيلا إيطاليا"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 text-right">{t('descArLabel')}</label>
                  <textarea
                    value={descAr}
                    onChange={(e) => setDescAr(e.target.value)}
                    rows={3}
                    className="input-field resize-none text-right"
                    placeholder="صف تاريخ مطبخك، تخصصاتك، طابع مطعمك..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 text-right">{t('addressArLabel')}</label>
                  <input
                    type="text"
                    value={addressAr}
                    onChange={(e) => setAddressAr(e.target.value)}
                    className="input-field text-right"
                    placeholder="مثال: ٩ شارع ١٥، المعادي، القاهرة"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 text-right">{t('hoursArLabel')}</label>
                  <input
                    type="text"
                    value={hoursAr}
                    onChange={(e) => setHoursAr(e.target.value)}
                    className="input-field text-right"
                  />
                </div>
              </div>
            </div>

            {/* General contacts */}
            <div className="border-t border-slate-200 pt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('phoneLabel')}</label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('whatsappLabel')}</label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('mapsLabel')}</label>
                <input
                  type="text"
                  value={googleMapsLink}
                  onChange={(e) => setGoogleMapsLink(e.target.value)}
                  className="input-field"
                  placeholder="Paste Google Maps URL"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={handleNextStep}
                disabled={!nameEn || !nameAr || !phone || !whatsAppNumber}
                className="btn-primary py-3.5 px-8 rounded-xl disabled:opacity-40 flex items-center gap-2 shadow-md shadow-blue-600/20"
              >
                <span>{t('nextBtn')}</span>
                <ChevronRight className="w-5 h-5 text-white rtl:rotate-180" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-600" />
                {t('stepLogoTitle')}
              </h3>
              <p className="text-xs text-slate-500 mt-1">{t('stepLogoSubtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Uploader Box */}
              <div className="border-2 border-dashed border-slate-300 rounded-3xl p-10 text-center bg-slate-50">
                <Upload className="w-10 h-10 text-slate-400 mx-auto mb-4" />
                <h4 className="font-bold text-sm text-slate-800 mb-1">{t('uploadLogoLabel')}</h4>
                <p className="text-xs text-slate-500 mb-6">{t('uploadLogoDesc')}</p>

                {/* Choose a preset demo logo */}
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Sample Logo File</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <button
                      onClick={() => triggerLogoUpload('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&auto=format&fit=crop&q=60')}
                      className="text-xs bg-white text-slate-700 font-semibold px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 transition shadow-2xs"
                    >
                      🍕 Red Italian Pizzeria Logo
                    </button>
                    <button
                      onClick={() => triggerLogoUpload('https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=120&auto=format&fit=crop&q=60')}
                      className="text-xs bg-white text-slate-700 font-semibold px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 transition shadow-2xs"
                    >
                      🍔 Yellow Burger Joint Logo
                    </button>
                    <button
                      onClick={() => triggerLogoUpload('https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=120&auto=format&fit=crop&q=60')}
                      className="text-xs bg-white text-slate-700 font-semibold px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 transition shadow-2xs"
                    >
                      🍣 Green Sushi House Logo
                    </button>
                  </div>
                </div>
              </div>

              {/* Logo Preview Panel */}
              <div className="bg-slate-50 p-8 rounded-3xl text-center border border-slate-200 flex flex-col justify-center items-center h-64 shadow-2xs">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                  {t('logoPreview')}
                </span>

                {uploadingLogo ? (
                  <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                    <span className="text-xs text-slate-500">Processing image...</span>
                  </div>
                ) : logoUrl ? (
                  <div className="space-y-4">
                    <img 
                      src={logoUrl} 
                      alt="Logo preview" 
                      className="w-24 h-24 object-cover rounded-full border-4 border-white shadow-lg"
                    />
                    <div className="text-xs text-slate-600 font-bold">{t('appName')} Brand Core</div>
                  </div>
                ) : (
                  <div className="text-slate-400 text-xs italic">
                    No logo uploaded yet. Select a sample above to continue.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-slate-200">
              <button 
                onClick={() => setStep(1)} 
                className="btn-secondary py-3 px-6 rounded-xl flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                <span>{t('backBtn')}</span>
              </button>
              
              <button
                onClick={handleNextStep}
                disabled={!logoUrl}
                className="btn-primary py-3.5 px-8 rounded-xl disabled:opacity-40 flex items-center gap-2 shadow-md shadow-blue-600/20"
              >
                <span>{t('nextBtn')}</span>
                <ChevronRight className="w-5 h-5 text-white rtl:rotate-180" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                {t('stepMenuTitle')}
              </h3>
              <p className="text-xs text-slate-500 mt-1">{t('stepMenuSubtitle')}</p>
            </div>

            {/* AI OCR Simulator */}
            {!menuFileType && !aiProcessing && (
              <div className="max-w-2xl mx-auto space-y-6 text-center py-10">
                <h4 className="text-sm font-bold text-slate-800">{t('menuUploadType')}</h4>
                
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => runMenuOcrSimulation('pdf', 'menu_draft_2026.pdf')}
                    className="bg-white p-6 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition border border-slate-200 flex flex-col items-center gap-3 shadow-2xs"
                  >
                    <FileText className="w-8 h-8 text-blue-600" />
                    <span className="text-xs font-bold text-slate-800">{t('uploadPdfBtn')}</span>
                  </button>
                  <button
                    onClick={() => runMenuOcrSimulation('csv', 'menu_spreadsheet.csv')}
                    className="bg-white p-6 rounded-2xl hover:border-purple-500 hover:bg-purple-50 transition border border-slate-200 flex flex-col items-center gap-3 shadow-2xs"
                  >
                    <Layers className="w-8 h-8 text-purple-600" />
                    <span className="text-xs font-bold text-slate-800">{t('uploadCsvBtn')}</span>
                  </button>
                  <button
                    onClick={() => runMenuOcrSimulation('image', 'menu_photo.jpg')}
                    className="bg-white p-6 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition border border-slate-200 flex flex-col items-center gap-3 shadow-2xs"
                  >
                    <ImageIcon className="w-8 h-8 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-800">{t('uploadImgBtn')}</span>
                  </button>
                </div>
              </div>
            )}

            {/* AI Scanning progress updates */}
            {aiProcessing && (
              <div className="max-w-md mx-auto py-12 text-center space-y-6">
                <RefreshCw className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
                <h4 className="font-bold text-slate-900">{t('aiRunning')}</h4>
                
                <div className="space-y-3 text-xs text-left max-w-xs mx-auto">
                  <div className={`flex items-center gap-2 ${aiProgressStep >= 1 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                    <div className={`w-2 h-2 rounded-full ${aiProgressStep >= 1 ? 'bg-blue-600 animate-ping' : 'bg-slate-300'}`} />
                    <span>{t('aiStep1')}</span>
                  </div>
                  <div className={`flex items-center gap-2 ${aiProgressStep >= 2 ? 'text-purple-600 font-bold' : 'text-slate-400'}`}>
                    <div className={`w-2 h-2 rounded-full ${aiProgressStep >= 2 ? 'bg-purple-600 animate-ping' : 'bg-slate-300'}`} />
                    <span>{t('aiStep2')}</span>
                  </div>
                  <div className={`flex items-center gap-2 ${aiProgressStep >= 3 ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                    <div className={`w-2 h-2 rounded-full ${aiProgressStep >= 3 ? 'bg-emerald-600 animate-ping' : 'bg-slate-300'}`} />
                    <span>{t('aiStep3')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* OCR Review Table */}
            {extractedCategories.length > 0 && !aiProcessing && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-900 text-md">{t('reviewMenuTitle')}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{t('reviewMenuSubtitle')}</p>
                  </div>
                  <span className="bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold px-3 py-1 rounded-xl">
                    📄 File: {menuFileName}
                  </span>
                </div>

                <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2">
                  {extractedCategories.map((cat, cIdx) => (
                    <div key={cat.id} className="bg-slate-50 border border-slate-200 p-6 rounded-2xl">
                      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-4 border-b border-slate-200 pb-3">
                        <div className="flex gap-2 w-full sm:w-auto">
                          <input
                            type="text"
                            value={cat.name.en}
                            onChange={(e) => {
                              const next = [...extractedCategories];
                              next[cIdx].name.en = e.target.value;
                              setExtractedCategories(next);
                            }}
                            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900"
                            placeholder="Category Name (EN)"
                          />
                          <input
                            type="text"
                            value={cat.name.ar}
                            onChange={(e) => {
                              const next = [...extractedCategories];
                              next[cIdx].name.ar = e.target.value;
                              setExtractedCategories(next);
                            }}
                            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 text-right"
                            placeholder="اسم الفئة (AR)"
                            dir="rtl"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const next = [...extractedCategories];
                            next.splice(cIdx, 1);
                            setExtractedCategories(next);
                          }}
                          className="text-red-600 hover:text-red-700 text-xs font-semibold flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete Category</span>
                        </button>
                      </div>

                      {/* Items loop */}
                      <div className="space-y-3">
                        {cat.items.map((item, iIdx) => (
                          <div key={item.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                            <div className="sm:col-span-3 flex gap-2">
                              <input
                                type="text"
                                value={item.name.en}
                                onChange={(e) => editReviewItem(cIdx, iIdx, 'name', e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-900 font-semibold w-full"
                                placeholder="Dish Name (EN)"
                              />
                            </div>
                            <div className="sm:col-span-3 flex gap-2">
                              <input
                                type="text"
                                value={item.name.ar}
                                onChange={(e) => editReviewItem(cIdx, iIdx, 'name', e.target.value, true)}
                                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-900 font-semibold text-right w-full"
                                placeholder="اسم الطبق (AR)"
                                dir="rtl"
                              />
                            </div>
                            <div className="sm:col-span-3">
                              <input
                                type="text"
                                value={item.description.en}
                                onChange={(e) => editReviewItem(cIdx, iIdx, 'description', e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-600 w-full"
                                placeholder="Description (EN)"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <input
                                type="number"
                                value={item.price}
                                onChange={(e) => editReviewItem(cIdx, iIdx, 'price', Number(e.target.value))}
                                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-blue-600 font-bold w-full"
                                placeholder="Price"
                              />
                            </div>
                            <div className="sm:col-span-1 text-center">
                              <button
                                onClick={() => deleteReviewItem(cIdx, iIdx)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                        
                        <button
                          onClick={() => addReviewItem(cIdx)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 mt-3"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{t('addItem')}</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => {
                      const next = [...extractedCategories];
                      next.push({
                        id: `cat_new_${Math.random().toString(36).substr(2, 5)}`,
                        name: { en: 'New Category', ar: 'فئة جديدة' },
                        order: next.length + 1,
                        items: []
                      });
                      setExtractedCategories(next);
                    }}
                    className="w-full border border-dashed border-slate-300 py-3 rounded-2xl text-xs font-bold text-slate-600 hover:border-slate-400 flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('addCategory')}</span>
                  </button>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-200">
                  <button
                    onClick={handleSaveImportedMenu}
                    className="btn-primary py-3.5 px-8 rounded-xl flex items-center gap-2 shadow-md shadow-blue-600/20"
                  >
                    <Check className="w-5 h-5 text-white" />
                    <span>{t('saveImportBtn')}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Back button */}
            {!aiProcessing && extractedCategories.length === 0 && (
              <div className="flex justify-between pt-6 border-t border-slate-200">
                <button 
                  onClick={() => setStep(2)} 
                  className="btn-secondary py-3 px-6 rounded-xl flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                  <span>{t('backBtn')}</span>
                </button>
                
                <button
                  onClick={() => setStep(4)}
                  className="btn-secondary py-3.5 px-8 rounded-xl flex items-center gap-2"
                >
                  <span>Skip Menu Import</span>
                  <ChevronRight className="w-4 h-4 text-slate-500 rtl:rotate-180" />
                </button>
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="animate-fade-in space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Palette className="w-5 h-5 text-blue-600" />
                {language === 'ar' ? 'تصميم وهوية الموقع' : 'Customization & Branding'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'ar' ? 'حدد قالباً، خصص الألوان، وشاهد معاينة حية لموقع مطعمك.' : 'Configure theme colors, layout template, and check your live responsive page.'}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Branding Sidebar inputs */}
              <div className="lg:col-span-5 space-y-6">
                {/* AI Color generator */}
                {logoUrl && (
                  <button
                    onClick={handleExtractColors}
                    className="w-full bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-xs transition shadow-2xs"
                  >
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>{t('aiColorBtn')}</span>
                  </button>
                )}

                {/* Theme Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
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
                          className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition text-left ${
                            isSel 
                              ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xs' 
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
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
                    <label className="block text-xs font-bold text-slate-700 mb-1">{t('colorPrimary')}</label>
                    <div className="flex gap-2 items-center bg-white border border-slate-300 rounded-xl p-1 shadow-2xs">
                      <input 
                        type="color" 
                        value={primaryColor} 
                        onChange={(e) => {
                          setPrimaryColor(e.target.value);
                          setButtonColor(e.target.value);
                        }}
                        className="w-8 h-8 cursor-pointer border-none bg-transparent"
                      />
                      <span className="text-[10px] font-mono font-bold text-slate-700">{primaryColor}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{t('colorSecondary')}</label>
                    <div className="flex gap-2 items-center bg-white border border-slate-300 rounded-xl p-1 shadow-2xs">
                      <input 
                        type="color" 
                        value={secondaryColor} 
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-8 h-8 cursor-pointer border-none bg-transparent"
                      />
                      <span className="text-[10px] font-mono font-bold text-slate-700">{secondaryColor}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{t('colorBackground')}</label>
                    <div className="flex gap-2 items-center bg-white border border-slate-300 rounded-xl p-1 shadow-2xs">
                      <input 
                        type="color" 
                        value={backgroundColor} 
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-8 h-8 cursor-pointer border-none bg-transparent"
                      />
                      <span className="text-[10px] font-mono font-bold text-slate-700">{backgroundColor}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{t('colorText')}</label>
                    <div className="flex gap-2 items-center bg-white border border-slate-300 rounded-xl p-1 shadow-2xs">
                      <input 
                        type="color" 
                        value={textColor} 
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-8 h-8 cursor-pointer border-none bg-transparent"
                      />
                      <span className="text-[10px] font-mono font-bold text-slate-700">{textColor}</span>
                    </div>
                  </div>
                </div>

                {/* Typography fonts selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('fontLabel')}</label>
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

              {/* Dynamic Live Site Preview Mockup */}
              <div className="lg:col-span-7">
                <div className="border border-slate-300 rounded-3xl overflow-hidden h-[450px] shadow-lg relative bg-white">
                  <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    </span>
                    <span className="font-mono text-[10px] bg-white border border-slate-200 px-3 py-1 rounded-md text-slate-600 w-64 truncate text-center font-bold">
                      bellaitalia.bistroflow.com
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold">● Active Draft</span>
                  </div>
                  
                  {/* Embedded Customizer render frame */}
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

            <div className="flex justify-between pt-6 border-t border-slate-200">
              <button 
                onClick={() => setStep(3)} 
                className="btn-secondary py-3 px-6 rounded-xl flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                <span>{t('backBtn')}</span>
              </button>
              
              <button
                onClick={handleFinishOnboarding}
                className="btn-primary py-3.5 px-8 rounded-xl flex items-center gap-2 shadow-md shadow-blue-600/20"
              >
                <Check className="w-5 h-5 text-white" />
                <span>{t('finishBtn')}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
