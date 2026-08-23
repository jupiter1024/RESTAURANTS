import React, { createContext, useContext, useState, useEffect } from 'react';
import type { BilingualText } from '../db/mockDb';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  tText: (text: BilingualText | string | undefined | null) => string;
  isRtl: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // SaaS Landing Page
    appName: 'BistroFlow',
    appSubtitle: 'Restaurant SaaS Builder',
    heroTitle: 'Build Your Restaurant Website in Minutes',
    heroSubtitle: 'Upload your menu, choose your design, customize your brand, and launch a professional restaurant website without hiring a developer.',
    createWebsiteCta: 'Create Your Restaurant Website',
    seeHowItWorks: 'See How It Works',
    howItWorksTitle: 'How It Works',
    howItWorksSubtitle: 'Launch your website in 3 simple steps.',
    step1Title: '1. Enter Information',
    step1Desc: 'Fill in your phone, location, links, and opening hours.',
    step2Title: '2. Upload Menu',
    step2Desc: 'Upload a PDF, CSV, or photos. Our AI extracts categories, prices, and options.',
    step3Title: '3. Customize & Publish',
    step3Desc: 'Extract colors from your logo, choose from 4 layout templates, and go live.',
    featuresTitle: 'Supercharged Features',
    featuresSubtitle: 'Everything you need to grow your restaurant business online.',
    featMenuTitle: 'AI Menu Import',
    featMenuDesc: 'Parse menus instantly. No manual data entry required.',
    featDesignTitle: 'Branded Customization',
    featDesignDesc: 'Extract colors from your logo. Apply cohesive layouts in seconds.',
    featOrderingTitle: 'Online Ordering',
    featOrderingDesc: 'Accept delivery or pickup orders directly to dashboard and WhatsApp.',
    featMobileTitle: 'Future Mobile App Ready',
    featMobileDesc: 'Backend built so you can deploy a white-label mobile app later.',
    featNoCodeTitle: 'No-Code Management',
    featNoCodeDesc: 'Update items, hide unavailable dishes instantly from your phone.',
    templatesTitle: 'Designed for Success',
    templatesSubtitle: 'Switch between 4 high-end layouts at any time.',
    tempModern: 'Modern Clean',
    tempLuxury: 'Premium Luxury',
    tempMinimal: 'Elegant Minimal',
    tempFastFood: 'Fast Cafe / Bistro',
    pricingTitle: 'Simple, Predictable Pricing',
    pricingSubtitle: 'Choose the plan that fits your growth.',
    planStarter: 'Starter Plan',
    planStarterPrice: '$19',
    planStarterDesc: 'Perfect for restaurants just getting started online.',
    planStarterSetup: 'One-time setup fee',
    planStarterFeat1: 'Professional generated website',
    planStarterFeat2: 'AI Menu import (1 time)',
    planStarterFeat3: 'QR Code generator',
    planStarterFeat4: 'Bilingual (EN / AR) support',
    planStarterFeat5: 'WhatsApp contact button',
    planStarterFeat6: 'No ordering system',
    planPro: 'Professional Plan',
    planProPrice: '$49',
    planProDesc: 'For active restaurants requiring integrated ordering and management.',
    planProMonthly: '/month + commission-free',
    planProFeat1: 'Everything in Starter',
    planProFeat2: 'Bilingual Online Ordering System',
    planProFeat3: 'Dashboard Order Management',
    planProFeat4: 'Customizable Variants & Addons',
    planProFeat5: 'AI color extractor (Unlimited)',
    planProFeat6: 'WhatsApp Order Notifications',
    faqTitle: 'Frequently Asked Questions',
    faqQ1: 'Do I need developer skills to use this?',
    faqA1: 'No. You just upload your logo, fill in your details, import your menu, and the website generates automatically. You can edit it easily in your dashboard.',
    faqQ2: 'Can customers order directly from my website?',
    faqA2: 'Yes, with the Professional plan, customers can add items to their cart, select pickup/delivery, and checkout. The order goes to your dashboard and WhatsApp.',
    faqQ3: 'How does the AI Menu Import work?',
    faqA3: 'Simply upload a PDF, Excel/CSV, or a clear photo of your printed menu. Our AI scans it, structures it into categories, items, and prices, and lets you review before publishing.',
    faqQ4: 'Can I switch templates later?',
    faqA4: 'Yes. You can switch between Modern, Luxury, Minimal, and Fast Food layouts with one click without losing any data or colors.',
    ctaFooterTitle: 'Ready to Launch Your Website?',
    ctaFooterSubtitle: 'Join hundreds of restaurants growing their sales with BistroFlow.',
    footerCopyright: '© 2026 BistroFlow. All rights reserved.',
    
    // Auth
    loginTitle: 'Sign In to BistroFlow',
    loginSubtitle: 'Manage your restaurant website and orders',
    signupTitle: 'Create Owner Account',
    signupSubtitle: 'Start building your website for free',
    emailLabel: 'Email Address',
    passwordLabel: 'Password',
    restaurantNameLabel: 'Restaurant Name (English)',
    restaurantNameArLabel: 'Restaurant Name (Arabic)',
    loginBtn: 'Sign In',
    signupBtn: 'Create Account',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    invalidLogin: 'Invalid email address. Try owner@bistroflow.com or burger@bistroflow.com',
    
    // Onboarding
    onboardingTitle: 'Let\'s Set Up Your Restaurant',
    onboardingStep1: 'Info',
    onboardingStep2: 'Logo',
    onboardingStep3: 'Menu',
    onboardingStep4: 'Customize',
    nextBtn: 'Next Step',
    backBtn: 'Back',
    finishBtn: 'Complete Setup & Go to Dashboard',
    
    stepInfoTitle: 'Restaurant Information',
    stepInfoSubtitle: 'Introduce your restaurant to customers in both English & Arabic.',
    nameEnLabel: 'Restaurant Name (EN)',
    nameArLabel: 'Restaurant Name (AR)',
    descEnLabel: 'Description (EN)',
    descArLabel: 'Description (AR)',
    phoneLabel: 'Phone Number',
    addressEnLabel: 'Address (EN)',
    addressArLabel: 'Address (AR)',
    mapsLabel: 'Google Maps Link',
    hoursEnLabel: 'Opening Hours (EN)',
    hoursArLabel: 'Opening Hours (AR)',
    whatsappLabel: 'WhatsApp Order Number (with country code, e.g., 201001234567)',
    
    stepLogoTitle: 'Brand Identity',
    stepLogoSubtitle: 'Upload your logo to style your website and invoices.',
    uploadLogoLabel: 'Upload Logo Image',
    uploadLogoDesc: 'PNG or JPG. Max 2MB.',
    logoPreview: 'Logo Preview',
    
    stepMenuTitle: 'Menu Import',
    stepMenuSubtitle: 'Upload your current menu file. Our AI will convert it into a structured website menu.',
    menuUploadType: 'Choose Upload Format',
    uploadPdfBtn: 'PDF Document',
    uploadCsvBtn: 'Excel / CSV Sheet',
    uploadImgBtn: 'Menu Image/Photo',
    selectSampleBtn: 'Load Sample Menu File',
    aiRunning: 'AI is analyzing your menu...',
    aiStep1: 'Reading document text (OCR)...',
    aiStep2: 'Parsing categories and dishes...',
    aiStep3: 'Identifying prices, variants, and addons...',
    reviewMenuTitle: 'Review Extracted Menu',
    reviewMenuSubtitle: 'Verify and edit the AI-extracted categories and items before importing.',
    addCategory: 'Add Category',
    addItem: 'Add Item',
    saveImportBtn: 'Import Verified Menu',
    
    // Dashboard
    dashOverview: 'Overview',
    dashMenu: 'Menu Editor',
    dashDesign: 'Layouts',
    dashBranding: 'Branding & Theme',
    dashOrders: 'Incoming Orders',
    dashInfo: 'Store Profile',
    dashSettings: 'Settings',
    logoutBtn: 'Logout',
    
    welcomeOwner: 'Welcome Back,',
    websiteStatus: 'Website Status',
    liveSite: 'Live Website',
    draftSite: 'Unpublished Draft',
    menuSummary: 'Menu Summary',
    itemsCount: 'Dishes Total',
    categoriesCount: 'Categories Total',
    recentOrders: 'Recent Orders',
    noOrders: 'No orders received yet.',
    viewDetails: 'Details',
    statusPending: 'Pending',
    statusPreparing: 'Preparing',
    statusCompleted: 'Completed',
    statusCancelled: 'Cancelled',
    qrCodeTitle: 'Your Website QR Code',
    qrCodeDesc: 'Download and print this QR code on tables or flyers so customers can scan and view your menu.',
    downloadQr: 'Download QR Code',
    
    // Menu Editor
    categoryNameEn: 'Category Name (EN)',
    categoryNameAr: 'Category Name (AR)',
    itemNameEn: 'Dish Name (EN)',
    itemNameAr: 'Dish Name (AR)',
    itemDescEn: 'Description (EN)',
    itemDescAr: 'Description (AR)',
    itemPrice: 'Price',
    itemImage: 'Image URL',
    isAvailableLabel: 'Available',
    isHiddenLabel: 'Hidden',
    saveChanges: 'Save Changes',
    publishBtn: 'Publish to Live Site',
    publishSuccess: 'Website published successfully!',
    
    // Branding
    colorPaletteTitle: 'Brand Color Palette',
    colorPrimary: 'Primary Theme Color',
    colorSecondary: 'Secondary Accent',
    colorBackground: 'Website Background',
    colorButton: 'Button Color',
    colorText: 'Body Text Color',
    fontLabel: 'Typography Style',
    aiColorBtn: 'AI Generate Brand Colors',
    aiColorSuccess: 'Brand colors successfully extracted from logo!',
    
    // Orders Panel
    orderId: 'Order ID',
    customer: 'Customer',
    orderTypeLabel: 'Type',
    orderDate: 'Date',
    totalPriceLabel: 'Total',
    orderActions: 'Actions',
    acceptOrder: 'Accept & Prepare',
    completeOrder: 'Mark Completed',
    cancelOrder: 'Cancel Order',
    pickup: 'Pickup',
    delivery: 'Delivery',
    notesLabel: 'Notes',
    
    // Settings
    domainSettings: 'Domain Settings',
    customDomainLabel: 'Your Subdomain / URL slug',
    pricingPlanLabel: 'Billing Plan',
    changePlan: 'Upgrade/Downgrade Plan',
    saveSettings: 'Save Settings',
    
    // Customer Site
    backToHome: 'Back to Home',
    aboutUs: 'About Us',
    ourMenu: 'Our Menu',
    contactUs: 'Contact Us',
    addToCart: 'Add to Cart',
    optionsTitle: 'Choose Options',
    addonsTitle: 'Add Extras',
    cartTitle: 'Shopping Cart',
    cartEmpty: 'Your cart is empty',
    quantity: 'Quantity',
    subtotal: 'Subtotal',
    checkoutTitle: 'Checkout Details',
    nameField: 'Your Name',
    phoneField: 'Phone Number',
    addressField: 'Delivery Address',
    deliveryMethod: 'Order Method',
    submitOrderWhatsApp: 'Order via WhatsApp',
    submitOrderLocal: 'Submit Order to Dashboard',
    orderSuccessTitle: 'Order Placed!',
    orderSuccessDesc: 'Your order has been sent to the restaurant. They will contact you shortly.',
    currency: 'EGP',
    whatsappMessageSent: 'Order link generated! Click to send via WhatsApp.'
  },
  ar: {
    // SaaS Landing Page
    appName: 'بيستروفلو',
    appSubtitle: 'نظام إنشاء مواقع المطاعم',
    heroTitle: 'أنشئ موقع مطعمك الإلكتروني في دقائق',
    heroSubtitle: 'حمّل قائمتك، اختر تصميمك، خصص علامتك التجارية، وانطلق بموقع مطعم احترافي دون الحاجة لتوظيف مطور.',
    createWebsiteCta: 'أنشئ موقع مطعمك الآن',
    seeHowItWorks: 'شاهد كيف يعمل',
    howItWorksTitle: 'كيف يعمل بيستروفلو؟',
    howItWorksSubtitle: 'أطلق موقعك الإلكتروني بثلاث خطوات بسيطة فقط.',
    step1Title: '١. أدخل المعلومات',
    step1Desc: 'املأ رقم الهاتف، الموقع، الروابط وساعات العمل الخاصة بك.',
    step2Title: '٢. ارفع القائمة (المنيو)',
    step2Desc: 'ارفع ملف PDF، إكسل، أو صوراً للمنيو. يقوم الذكاء الاصطناعي باستخراج الفئات والأسعار والخيارات.',
    step3Title: '٣. خصص وانشر موقعك',
    step3Desc: 'استخرج الألوان تلقائياً من شعارك، اختر من بين ٤ قوالب رائعة، وانطلق مباشرة.',
    featuresTitle: 'ميزات فائقة لمطعمك',
    featuresSubtitle: 'كل ما تحتاجه لتنمية أعمال مطعمك وزيادة مبيعاتك عبر الإنترنت.',
    featMenuTitle: 'استيراد المنيو بالذكاء الاصطناعي',
    featMenuDesc: 'قم بمسح وقراءة المنيو فوراً دون الحاجة لإدخال البيانات يدوياً.',
    featDesignTitle: 'تخصيص الهوية البصرية',
    featDesignDesc: 'استخرج الألوان من شعارك وقم بتطبيق تصاميم متناسقة في ثوانٍ.',
    featOrderingTitle: 'الطلب المباشر عبر الإنترنت',
    featOrderingDesc: 'استقبل طلبات التوصيل والاستلام مباشرة على لوحة التحكم وعبر الواتساب.',
    featMobileTitle: 'جاهز لتطبيق جوال مستقبلي',
    featMobileDesc: 'قاعدة البيانات مهيأة بالكامل لإطلاق تطبيق جوال لعلامتك التجارية لاحقاً.',
    featNoCodeTitle: 'إدارة بدون أكواد',
    featNoCodeDesc: 'أضف الأطباق، عدل الأسعار، أو اخفِ الأطباق غير المتوفرة فوراً من هاتفك.',
    templatesTitle: 'تصاميم مصممة للنجاح',
    templatesSubtitle: 'تنقل بين ٤ تصاميم ومخططات مختلفة في أي وقت بنقرة واحدة.',
    tempModern: 'عصري ونظيف',
    tempLuxury: 'فاخر وراقٍ',
    tempMinimal: 'بسيط وأنيق',
    tempFastFood: 'بيسترو سريع / كافيه',
    pricingTitle: 'أسعار بسيطة وواضحة',
    pricingSubtitle: 'اختر الباقة المناسبة لنمو مطعمك.',
    planStarter: 'الباقة الأساسية',
    planStarterPrice: '١٩$',
    planStarterDesc: 'مثالية للمطاعم التي تبدأ خطواتها الأولى عبر الإنترنت.',
    planStarterSetup: 'رسوم إعداد تدفع لمرة واحدة',
    planStarterFeat1: 'موقع إلكتروني احترافي متكامل',
    planStarterFeat2: 'استيراد المنيو بالذكاء الاصطناعي (مرة واحدة)',
    planStarterFeat3: 'منشئ الرمز السريع QR Code',
    planStarterFeat4: 'دعم كامل للغتين (العربية والإنجليزية)',
    planStarterFeat5: 'زر التواصل السريع عبر الواتساب',
    planStarterFeat6: 'بدون نظام استقبال طلبات',
    planPro: 'الباقة الاحترافية',
    planProPrice: '٤٩$',
    planProDesc: 'للمطاعم النشطة التي تحتاج نظام متكامل لإدارة واستقبال الطلبات.',
    planProMonthly: '/شهرياً + بدون عمولات',
    planProFeat1: 'تشمل جميع ميزات الباقة الأساسية',
    planProFeat2: 'نظام طلبات كامل ثنائي اللغة عبر الإنترنت',
    planProFeat3: 'لوحة تحكم لإدارة الطلبات الواردة',
    planProFeat4: 'إدارة خيارات وأحجام الأطباق والإضافات',
    planProFeat5: 'مستخرج ألوان بالذكاء الاصطناعي (غير محدود)',
    planProFeat6: 'إشعارات وتفاصيل الطلبات عبر الواتساب',
    faqTitle: 'الأسئلة الشائعة',
    faqQ1: 'هل أحتاج إلى خبرة برمجية لاستخدام المنصة؟',
    faqA1: 'بالتأكيد لا. كل ما عليك فعله هو رفع شعارك، ملء تفاصيل مطعمك، ورفع المنيو وسيقوم النظام بتوليد موقعك. يمكنك تعديل كل شيء لاحقاً من لوحة التحكم.',
    faqQ2: 'هل يمكن للزبائن الطلب مباشرة من موقعي؟',
    faqA2: 'نعم، مع الباقة الاحترافية، يمكن للزبائن تصفح المنيو، إضافة الأطباق للسلة، واختيار التوصيل أو الاستلام. ستصلك الطلبات في لوحة التحكم وتصلهم رسالة واتساب.',
    faqQ3: 'كيف يعمل استيراد المنيو بالذكاء الاصطناعي؟',
    faqA3: 'ببساطة ارفع ملف PDF، إكسل، أو صورة واضحة لقائمتك المطبوعة. سيقوم الذكاء الاصطناعي بمسحها وتقسيمها إلى فئات وأطباق وأسعار، ويعرضها عليك لمراجعتها وتعديلها قبل النشر.',
    faqQ4: 'هل يمكنني تغيير قالب الموقع لاحقاً؟',
    faqA4: 'نعم. يمكنك التبديل بين التصاميم الأربعة بنقرة زر واحدة في أي وقت دون أن تفقد أياً من بياناتك أو ألوانك الخاصة.',
    ctaFooterTitle: 'جاهز لإطلاق موقع مطعمك؟',
    ctaFooterSubtitle: 'انضم إلى مئات المطاعم التي تزيد مبيعاتها مع بيستروفلو.',
    footerCopyright: '© ٢٠٢٦ بيستروفلو. جميع الحقوق محفوظة.',
    
    // Auth
    loginTitle: 'تسجيل الدخول إلى بيستروفلو',
    loginSubtitle: 'إدارة موقع مطعمك واستقبال الطلبات',
    signupTitle: 'إنشاء حساب مالك جديد',
    signupSubtitle: 'ابدأ في بناء موقع مطعمك مجاناً',
    emailLabel: 'البريد الإلكتروني',
    passwordLabel: 'كلمة المرور',
    restaurantNameLabel: 'اسم المطعم (بالإنجليزية)',
    restaurantNameArLabel: 'اسم المطعم (بالعربية)',
    loginBtn: 'تسجيل الدخول',
    signupBtn: 'إنشاء الحساب',
    noAccount: 'ليس لديك حساب؟',
    hasAccount: 'لديك حساب بالفعل؟',
    invalidLogin: 'البريد الإلكتروني غير صحيح. جرب owner@bistroflow.com أو burger@bistroflow.com',
    
    // Onboarding
    onboardingTitle: 'لنبدأ في إعداد مطعمك',
    onboardingStep1: 'المعلومات',
    onboardingStep2: 'الشعار',
    onboardingStep3: 'المنيو',
    onboardingStep4: 'التخصيص',
    nextBtn: 'الخطوة التالية',
    backBtn: 'السابق',
    finishBtn: 'إكمال الإعداد والذهاب للوحة التحكم',
    
    stepInfoTitle: 'معلومات المطعم',
    stepInfoSubtitle: 'عرّف العملاء بمطعمك باللغتين العربية والإنجليزية.',
    nameEnLabel: 'اسم المطعم (EN)',
    nameArLabel: 'اسم المطعم (AR)',
    descEnLabel: 'الوصف (EN)',
    descArLabel: 'الوصف (AR)',
    phoneLabel: 'رقم الهاتف',
    addressEnLabel: 'العنوان (EN)',
    addressArLabel: 'العنوان (AR)',
    mapsLabel: 'رابط خرائط جوجل',
    hoursEnLabel: 'ساعات العمل (EN)',
    hoursArLabel: 'ساعات العمل (AR)',
    whatsappLabel: 'رقم واتساب لاستقبال الطلبات (مع رمز الدولة، مثلاً 201001234567)',
    
    stepLogoTitle: 'الهوية البصرية للمطعم',
    stepLogoSubtitle: 'رفع شعار المطعم لتخصيص موقعك وفواتيرك.',
    uploadLogoLabel: 'رفع صورة الشعار',
    uploadLogoDesc: 'PNG أو JPG. الحجم الأقصى ٢ ميجابايت.',
    logoPreview: 'معاينة الشعار',
    
    stepMenuTitle: 'استيراد قائمة الطعام (المنيو)',
    stepMenuSubtitle: 'ارفع ملف المنيو الحالي وسيقوم الذكاء الاصطناعي بتحويله لقائمة تفاعلية على موقعك.',
    menuUploadType: 'اختر صيغة الملف',
    uploadPdfBtn: 'ملف PDF',
    uploadCsvBtn: 'جدول إكسل / CSV',
    uploadImgBtn: 'صورة المنيو',
    selectSampleBtn: 'تحميل ملف منيو تجريبي',
    aiRunning: 'يقوم الذكاء الاصطناعي بتحليل المنيو...',
    aiStep1: 'قراءة النصوص من الملف (OCR)...',
    aiStep2: 'استخراج فئات الأطباق والوجبات...',
    aiStep3: 'تحديد الأسعار والخيارات والإضافات...',
    reviewMenuTitle: 'مراجعة المنيو المستخرج',
    reviewMenuSubtitle: 'تحقق من الأطباق والفئات وعدل عليها قبل حفظها واستيرادها.',
    addCategory: 'إضافة فئة',
    addItem: 'إضافة طبق',
    saveImportBtn: 'استيراد وتأكيد المنيو',
    
    // Dashboard
    dashOverview: 'نظرة عامة',
    dashMenu: 'محرر المنيو',
    dashDesign: 'القوالب والتصميم',
    dashBranding: 'الألوان والهوية',
    dashOrders: 'الطلبات الواردة',
    dashInfo: 'معلومات المطعم',
    dashSettings: 'الإعدادات',
    logoutBtn: 'تسجيل الخروج',
    
    welcomeOwner: 'مرحباً بك مجدداً،',
    websiteStatus: 'حالة الموقع',
    liveSite: 'الموقع منشور ولايف',
    draftSite: 'مسودة غير منشورة',
    menuSummary: 'ملخص قائمة الطعام',
    itemsCount: 'إجمالي الأطباق',
    categoriesCount: 'إجمالي الفئات',
    recentOrders: 'آخر الطلبات',
    noOrders: 'لا توجد طلبات واردة بعد.',
    viewDetails: 'التفاصيل',
    statusPending: 'قيد الانتظار',
    statusPreparing: 'جاري التحضير',
    statusCompleted: 'مكتمل',
    statusCancelled: 'ملغي',
    qrCodeTitle: 'الرمز السريع للموقع QR Code',
    qrCodeDesc: 'قم بتحميل وطباعة هذا الرمز على الطاولات أو المنشورات ليتمكن العملاء من مسحه وتصفح المنيو فوراً.',
    downloadQr: 'تحميل الرمز QR',
    
    // Menu Editor
    categoryNameEn: 'اسم الفئة (EN)',
    categoryNameAr: 'اسم الفئة (AR)',
    itemNameEn: 'اسم الطبق (EN)',
    itemNameAr: 'اسم الطبق (AR)',
    itemDescEn: 'وصف الطبق (EN)',
    itemDescAr: 'وصف الطبق (AR)',
    itemPrice: 'السعر',
    itemImage: 'رابط الصورة',
    isAvailableLabel: 'متوفر',
    isHiddenLabel: 'مخفي',
    saveChanges: 'حفظ التعديلات',
    publishBtn: 'نشر التغييرات للموقع لايف',
    publishSuccess: 'تم نشر الموقع بنجاح وبثه لايف!',
    
    // Branding
    colorPaletteTitle: 'الألوان والهوية البصرية',
    colorPrimary: 'اللون الرئيسي للموقع',
    colorSecondary: 'اللون الثانوي',
    colorBackground: 'لون الخلفية',
    colorButton: 'لون الأزرار',
    colorText: 'لون النصوص الأساسية',
    fontLabel: 'خط الموقع',
    aiColorBtn: 'توليد ألوان الهوية بالذكاء الاصطناعي',
    aiColorSuccess: 'تم استخراج ألوان علامتك التجارية من الشعار بنجاح!',
    
    // Orders Panel
    orderId: 'رقم الطلب',
    customer: 'العميل',
    orderTypeLabel: 'النوع',
    orderDate: 'التاريخ',
    totalPriceLabel: 'الإجمالي',
    orderActions: 'الإجراءات',
    acceptOrder: 'قبول وتحضير',
    completeOrder: 'تحديد كمكتمل',
    cancelOrder: 'إلغاء الطلب',
    pickup: 'استلام من المطعم',
    delivery: 'توصيل للمنزل',
    notesLabel: 'ملاحظات',
    
    // Settings
    domainSettings: 'إعدادات النطاق (الدومين)',
    customDomainLabel: 'رابط موقعك الفرعي (Subdomain)',
    pricingPlanLabel: 'باقة الاشتراك الحالية',
    changePlan: 'ترقية/تعديل الباقة',
    saveSettings: 'حفظ الإعدادات',
    
    // Customer Site
    backToHome: 'العودة للرئيسية',
    aboutUs: 'من نحن',
    ourMenu: 'قائمة طعامنا',
    contactUs: 'اتصل بنا',
    addToCart: 'أضف للسلة',
    optionsTitle: 'اختر الخيارات',
    addonsTitle: 'إضافات اختيارية',
    cartTitle: 'سلة المشتريات',
    cartEmpty: 'السلة فارغة حالياً',
    quantity: 'الكمية',
    subtotal: 'المجموع الفرعي',
    checkoutTitle: 'تفاصيل إتمام الطلب',
    nameField: 'اسمك الكريم',
    phoneField: 'رقم الجوال',
    addressField: 'عنوان التوصيل بالتفصيل',
    deliveryMethod: 'طريقة الاستلام',
    submitOrderWhatsApp: 'إرسال الطلب عبر الواتساب',
    submitOrderLocal: 'إرسال الطلب للمطعم مباشرة',
    orderSuccessTitle: 'تم إرسال طلبك بنجاح!',
    orderSuccessDesc: 'تم إرسال تفاصيل طلبك للمطعم بنجاح، وسيتواصلون معك قريباً لتأكيده.',
    currency: 'ج.م',
    whatsappMessageSent: 'تم توليد رابط الطلب! انقر لإرساله عبر واتساب.'
  }
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('bistroflow_lang') as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('bistroflow_lang', lang);
  };

  useEffect(() => {
    const isRtl = language === 'ar';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    
    // Handle specific fonts on body
    if (isRtl) {
      document.body.style.fontFamily = "'Cairo', 'Tajawal', sans-serif";
    } else {
      document.body.style.fontFamily = "'Outfit', 'Inter', sans-serif";
    }
  }, [language]);

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  const tText = (text: BilingualText | string | undefined | null): string => {
    if (!text) return '';
    if (typeof text === 'string') return text;
    return text[language] || text['en'] || '';
  };

  const isRtl = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tText, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
