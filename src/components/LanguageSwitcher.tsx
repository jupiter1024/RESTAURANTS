import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '../utils/translate';

export const LanguageSwitcher: React.FC<{ variant?: 'default' | 'ghost' }> = ({ variant = 'default' }) => {
  const { language, setLanguage } = useLanguage();

  const baseClass = variant === 'ghost'
    ? 'text-xs font-medium text-zinc-600 hover:text-zinc-900 transition flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-zinc-100'
    : 'text-xs font-medium text-zinc-600 hover:text-zinc-900 transition flex items-center gap-1.5 border border-zinc-200 px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-50';

  return (
    <button onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')} className={baseClass}>
      <Languages className="w-3.5 h-3.5" />
      <span>{language === 'en' ? 'العربية' : 'English'}</span>
    </button>
  );
};
