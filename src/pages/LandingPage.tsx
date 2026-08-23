import React, { useState } from 'react';
import { useLanguage } from '../utils/translate';
import { 
  Sparkles, 
  ArrowRight, 
  FileText, 
  Palette, 
  ShoppingBag, 
  Smartphone, 
  Languages,
  ChevronDown,
  Layout,
  Zap,
  CheckCircle2
} from 'lucide-react';

interface LandingPageProps {
  onStartSignUp: () => void;
  onStartLogin: () => void;
  onViewDemoRestaurant: (id: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartSignUp,
  onStartLogin,
  onViewDemoRestaurant
}) => {
  const { t, language, setLanguage } = useLanguage();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setActiveFaq(activeFaq === idx ? null : idx);
  };

  return (
    <div className="bg-white min-h-screen text-slate-900 flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900">
      {/* SaaS Navigation Header */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md py-4 px-6 border-b border-slate-200 shadow-xs">
        <div className="saas-container flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight text-slate-900 font-sans">{t('appName')}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 -mt-1">Restaurant SaaS Platform</span>
            </div>
          </div>

          {/* Nav Right */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Lang switcher */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="text-xs font-bold text-slate-700 hover:text-blue-600 transition flex items-center gap-1.5 border border-slate-300 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100"
            >
              <Languages className="w-3.5 h-3.5 text-slate-500" />
              <span>{language === 'en' ? 'العربية' : 'English'}</span>
            </button>

            <button 
              onClick={onStartLogin} 
              className="text-xs sm:text-sm font-bold text-slate-700 hover:text-blue-600 transition px-2 py-1.5"
            >
              {t('loginBtn')}
            </button>
            
            <button 
              onClick={onStartSignUp} 
              className="btn-primary text-xs sm:text-sm py-2.5 px-5 rounded-xl shadow-sm hover:shadow-md"
            >
              <span>{t('signupBtn')}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="saas-container py-16 sm:py-24 px-6 text-center animate-fade-in">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-4 py-1.5 rounded-full mb-6">
          <Zap className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
          <span>{language === 'ar' ? 'منصة متكاملة لبناء مواقع المطاعم' : 'Automated Restaurant Website Builder'}</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 leading-tight mb-6 max-w-4xl mx-auto tracking-tight">
          {t('heroTitle')}
        </h1>
        
        <p className="text-slate-600 text-base sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10 font-normal">
          {t('heroSubtitle')}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center max-w-md mx-auto">
          <button 
            onClick={onStartSignUp} 
            className="btn-primary py-4 px-8 rounded-xl w-full text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
          >
            <span>{t('createWebsiteCta')}</span>
            <ArrowRight className="w-5 h-5 text-white rtl:rotate-180" />
          </button>
          
          <a 
            href="#how-it-works"
            className="btn-secondary py-4 px-8 rounded-xl w-full text-base flex items-center justify-center"
          >
            {t('seeHowItWorks')}
          </a>
        </div>

        {/* Demo menu preview buttons */}
        <div className="mt-12 bg-slate-50 border border-slate-200 p-4 rounded-2xl max-w-2xl mx-auto text-xs text-slate-600 flex flex-wrap justify-center items-center gap-3 shadow-xs">
          <span className="font-semibold text-slate-900">👀 {language === 'ar' ? 'معاينة مواقع حية مولدة:' : 'Live Generated Demos:'}</span>
          
          <button 
            onClick={() => onViewDemoRestaurant('001')}
            className="bg-white border border-slate-300 text-blue-700 hover:border-blue-500 font-bold px-3 py-1.5 rounded-lg transition shadow-2xs flex items-center gap-1.5"
          >
            <span>🇮🇹 Bella Italia</span>
            <span className="text-[10px] text-slate-400 font-normal">(Luxury)</span>
          </button>
          
          <button 
            onClick={() => onViewDemoRestaurant('002')}
            className="bg-white border border-slate-300 text-amber-700 hover:border-amber-500 font-bold px-3 py-1.5 rounded-lg transition shadow-2xs flex items-center gap-1.5"
          >
            <span>🍔 Burger Loft</span>
            <span className="text-[10px] text-slate-400 font-normal">(Fast Food)</span>
          </button>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="bg-slate-50 border-y border-slate-200 py-20 px-6">
        <div className="saas-container">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-3">{t('howItWorksTitle')}</h2>
            <p className="text-slate-600 text-sm leading-relaxed">{t('howItWorksSubtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs relative">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100 mb-6 font-bold text-lg">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('step1Title')}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{t('step1Desc')}</p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs relative">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100 mb-6 font-bold text-lg">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('step2Title')}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{t('step2Desc')}</p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs relative">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100 mb-6 font-bold text-lg">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('step3Title')}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{t('step3Desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="saas-container py-20 px-6">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-3">{t('featuresTitle')}</h2>
          <p className="text-slate-600 text-sm leading-relaxed">{t('featuresSubtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex gap-4 items-start">
            <div className="bg-blue-50 p-3 rounded-xl text-blue-600 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base mb-1">{t('featMenuTitle')}</h4>
              <p className="text-slate-600 text-xs leading-relaxed">{t('featMenuDesc')}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex gap-4 items-start">
            <div className="bg-blue-50 p-3 rounded-xl text-blue-600 shrink-0">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base mb-1">{t('featDesignTitle')}</h4>
              <p className="text-slate-600 text-xs leading-relaxed">{t('featDesignDesc')}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex gap-4 items-start">
            <div className="bg-blue-50 p-3 rounded-xl text-blue-600 shrink-0">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base mb-1">{t('featOrderingTitle')}</h4>
              <p className="text-slate-600 text-xs leading-relaxed">{t('featOrderingDesc')}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex gap-4 items-start">
            <div className="bg-blue-50 p-3 rounded-xl text-blue-600 shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base mb-1">{t('featMobileTitle')}</h4>
              <p className="text-slate-600 text-xs leading-relaxed">{t('featMobileDesc')}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex gap-4 items-start">
            <div className="bg-blue-50 p-3 rounded-xl text-blue-600 shrink-0">
              <Layout className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base mb-1">{t('featNoCodeTitle')}</h4>
              <p className="text-slate-600 text-xs leading-relaxed">{t('featNoCodeDesc')}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex gap-4 items-start">
            <div className="bg-blue-50 p-3 rounded-xl text-blue-600 shrink-0">
              <Languages className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base mb-1">
                {language === 'ar' ? 'تعريب كامل وتوجيه RTL' : 'Arabic & English Support'}
              </h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                {language === 'ar' 
                  ? 'يدعم النظام اللغتين العربية والإنجليزية بشكل مدمج، مع تبديل الاتجاه للموقع بشكل صحيح.' 
                  : 'Native bilingual engine supporting Arabic (RTL) & English (LTR) seamlessly.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Modern SaaS Pricing Cards Section */}
      <section className="bg-slate-50 border-y border-slate-200 py-20 px-6">
        <div className="saas-container">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider mb-3 inline-block">
              Pricing Plans
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-3">{t('pricingTitle')}</h2>
            <p className="text-slate-600 text-sm leading-relaxed">{t('pricingSubtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Starter Plan Card */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between relative hover:border-slate-300 transition-all">
              <div>
                <span className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider w-max block mb-4">
                  Starter
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900">{t('planStarter')}</h3>
                <p className="text-slate-500 text-xs mt-2 leading-relaxed">{t('planStarterDesc')}</p>
                
                <div className="my-6">
                  <span className="text-4xl font-black text-slate-900">{t('planStarterPrice')}</span>
                  <span className="text-slate-500 text-sm ml-2 font-medium">/ {t('planStarterSetup')}</span>
                </div>

                <div className="border-t border-slate-100 pt-6 mb-8">
                  <p className="text-xs font-bold text-slate-900 mb-4 uppercase tracking-wider">Features Included:</p>
                  <ul className="space-y-3">
                    {[
                      t('planStarterFeat1'),
                      t('planStarterFeat2'),
                      t('planStarterFeat3'),
                      t('planStarterFeat4'),
                      t('planStarterFeat5'),
                      t('planStarterFeat6')
                    ].map((feat, fIdx) => (
                      <li key={fIdx} className="flex gap-3 items-center text-xs text-slate-700 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <button 
                onClick={onStartSignUp} 
                className="btn-secondary w-full py-3.5 rounded-xl font-bold text-sm"
              >
                Get Started
              </button>
            </div>

            {/* Pro Plan Card */}
            <div className="bg-white p-8 rounded-3xl border-2 border-blue-600 shadow-xl shadow-blue-500/10 flex flex-col justify-between relative">
              <span className="absolute -top-3.5 right-6 bg-blue-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest shadow-md">
                Most Popular
              </span>
              <div>
                <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider w-max block mb-4">
                  Professional
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900">{t('planPro')}</h3>
                <p className="text-slate-500 text-xs mt-2 leading-relaxed">{t('planProDesc')}</p>
                
                <div className="my-6">
                  <span className="text-4xl font-black text-slate-900">{t('planProPrice')}</span>
                  <span className="text-slate-500 text-sm ml-2 font-medium">{t('planProMonthly')}</span>
                </div>

                <div className="border-t border-slate-100 pt-6 mb-8">
                  <p className="text-xs font-bold text-slate-900 mb-4 uppercase tracking-wider">Everything in Starter plus:</p>
                  <ul className="space-y-3">
                    {[
                      t('planProFeat1'),
                      t('planProFeat2'),
                      t('planProFeat3'),
                      t('planProFeat4'),
                      t('planProFeat5'),
                      t('planProFeat6')
                    ].map((feat, fIdx) => (
                      <li key={fIdx} className="flex gap-3 items-center text-xs text-slate-800 font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <button 
                onClick={onStartSignUp} 
                className="btn-primary w-full py-3.5 rounded-xl font-bold text-sm shadow-md shadow-blue-600/20"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="saas-container py-20 px-6">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-3">{t('faqTitle')}</h2>
          <p className="text-slate-600 text-sm">Frequently asked questions about setup and deployment.</p>
        </div>

        <div className="max-w-2xl mx-auto space-y-4">
          {[
            { q: t('faqQ1'), a: t('faqA1') },
            { q: t('faqQ2'), a: t('faqA2') },
            { q: t('faqQ3'), a: t('faqA3') },
            { q: t('faqQ4'), a: t('faqA4') }
          ].map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left rtl:text-right flex justify-between items-center hover:bg-slate-50 transition"
                >
                  <span className="font-bold text-sm text-slate-900">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="p-5 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 px-6 bg-slate-50 text-slate-500 text-xs font-sans">
        <div className="saas-container flex flex-col sm:flex-row justify-between items-center gap-4">
          <span>{t('footerCopyright')}</span>
          <div className="flex gap-6 font-medium">
            <a href="#" className="hover:text-slate-900 transition">Privacy Policy</a>
            <a href="#" className="hover:text-slate-900 transition">Terms of Service</a>
            <a href="#" className="hover:text-slate-900 transition">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
