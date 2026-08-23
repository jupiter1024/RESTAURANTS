import React, { useState } from 'react';
import { db } from '../db/mockDb';
import { useLanguage } from '../utils/translate';
import { KeyRound, Mail, Store, Languages, ArrowRight, Sparkles } from 'lucide-react';

interface AuthPageProps {
  onAuthSuccess: (userId: string, restaurantId: string) => void;
  initialMode?: 'login' | 'signup';
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onAuthSuccess,
  initialMode = 'login'
}) => {
  const { t, language, setLanguage } = useLanguage();
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  
  // Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [restaurantNameEn, setRestaurantNameEn] = useState('');
  const [restaurantNameAr, setRestaurantNameAr] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        // Authenticate
        const user = db.login(email);
        if (user) {
          onAuthSuccess(user.id, user.restaurantId);
        } else {
          setError(t('invalidLogin'));
        }
      } else {
        // Register
        if (!restaurantNameEn || !restaurantNameAr) {
          setError(language === 'ar' ? 'يرجى إدخال اسم المطعم باللغتين' : 'Please enter restaurant name in both languages');
          return;
        }
        const { user } = db.register(email, { en: restaurantNameEn, ar: restaurantNameAr });
        onAuthSuccess(user.id, user.restaurantId);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  const loadDemoOwner = (emailStr: string) => {
    setEmail(emailStr);
    setPassword('password');
    const user = db.login(emailStr);
    if (user) {
      onAuthSuccess(user.id, user.restaurantId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-6 py-12 relative text-slate-900">
      {/* Top Floating Language Switcher */}
      <div className="absolute top-6 right-6 z-15 flex items-center gap-2">
        <Languages className="w-4 h-4 text-slate-500" />
        <button
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className="text-xs font-bold text-slate-700 hover:text-blue-600 transition py-1.5 px-3 border border-slate-300 rounded-xl bg-white shadow-xs"
        >
          {language === 'en' ? 'العربية (RTL)' : 'English (LTR)'}
        </button>
      </div>

      <div className="w-full max-w-md animate-fade-in">
        {/* SaaS branding logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600 text-white rounded-2xl shadow-md shadow-blue-500/20 mb-3">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
            {t('appName')}
          </h2>
          <p className="text-slate-500 text-sm mt-1">{t('appSubtitle')}</p>
        </div>

        {/* Card */}
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-200 relative">
          <h3 className="text-xl font-bold text-slate-900 mb-1">
            {isLogin ? t('loginTitle') : t('signupTitle')}
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            {isLogin ? t('loginSubtitle') : t('signupSubtitle')}
          </p>

          {error && (
            <div className="mb-4 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 p-3 rounded-xl">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('emailLabel')}</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10 rtl:pl-4 rtl:pr-10"
                  placeholder="owner@restaurant.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('passwordLabel')}</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10 rtl:pl-4 rtl:pr-10"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {!isLogin && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('restaurantNameLabel')}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <Store className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={restaurantNameEn}
                      onChange={(e) => setRestaurantNameEn(e.target.value)}
                      className="input-field pl-10 rtl:pl-4 rtl:pr-10"
                      placeholder="e.g. Bella Italia"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('restaurantNameArLabel')}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <Store className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={restaurantNameAr}
                      onChange={(e) => setRestaurantNameAr(e.target.value)}
                      className="input-field pl-10 rtl:pl-4 rtl:pr-10"
                      placeholder="مثال: بيلا إيطاليا"
                      dir="rtl"
                    />
                  </div>
                </div>
              </>
            )}

            <button type="submit" className="w-full btn-primary py-3.5 rounded-xl font-bold text-sm mt-6 flex items-center justify-center gap-2 shadow-md shadow-blue-600/20">
              <span>{isLogin ? t('loginBtn') : t('signupBtn')}</span>
              <ArrowRight className="w-4 h-4 text-white rtl:rotate-180" />
            </button>
          </form>

          {/* Toggle mode */}
          <div className="text-center mt-6 pt-6 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              {isLogin ? t('noAccount') : t('hasAccount')}{' '}
            </span>
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-blue-600 hover:text-blue-700 font-bold ml-1 transition"
            >
              {isLogin ? t('signupBtn') : t('loginBtn')}
            </button>
          </div>
        </div>

        {/* Demo Quick Logins */}
        {isLogin && (
          <div className="mt-6 text-center bg-white p-4 border border-slate-200 rounded-2xl shadow-xs">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
              🚀 Try BistroFlow with Demo Accounts
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button
                onClick={() => loadDemoOwner('owner@bistroflow.com')}
                className="text-xs font-bold bg-slate-50 text-blue-700 border border-slate-200 px-3.5 py-2 rounded-xl hover:bg-slate-100 transition"
              >
                🍕 Italian: Bella Italia
              </button>
              <button
                onClick={() => loadDemoOwner('burger@bistroflow.com')}
                className="text-xs font-bold bg-slate-50 text-amber-700 border border-slate-200 px-3.5 py-2 rounded-xl hover:bg-slate-100 transition"
              >
                🍔 FastFood: Burger Loft
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
