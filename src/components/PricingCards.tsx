import React from 'react';
import { Check, ArrowRight, Globe, ShoppingBag } from 'lucide-react';
import { useLanguage } from '../utils/translate';

interface PricingCardsProps {
  onSelectPlan: () => void;
  compact?: boolean;
}

export const PricingCards: React.FC<PricingCardsProps> = ({ onSelectPlan, compact = false }) => {
  const { t } = useLanguage();

  const plans = [
    {
      id: 'website',
      name: t('planWebsite'),
      price: '15',
      billing: t('planWebsiteBilling'),
      description: t('planWebsiteDesc'),
      cta: t('planWebsiteCta'),
      icon: <Globe className="w-5 h-5" />,
      iconBg: 'bg-sky-500',
      features: [
        t('planWebsiteFeat1'), t('planWebsiteFeat2'), t('planWebsiteFeat3'),
        t('planWebsiteFeat4'), t('planWebsiteFeat5'), t('planWebsiteFeat6'),
        t('planWebsiteFeat7'), t('planWebsiteFeat8'), t('planWebsiteFeat9'),
        t('planWebsiteFeat10'),
      ],
      popular: false,
    },
    {
      id: 'orders',
      name: t('planOrders'),
      price: '100',
      billing: t('planOrdersBilling'),
      description: t('planOrdersDesc'),
      cta: t('planOrdersCta'),
      icon: <ShoppingBag className="w-5 h-5" />,
      iconBg: 'bg-amber-500',
      features: [
        t('planOrdersFeat1'), t('planOrdersFeat2'), t('planOrdersFeat3'),
        t('planOrdersFeat4'), t('planOrdersFeat5'), t('planOrdersFeat6'),
        t('planOrdersFeat7'), t('planOrdersFeat8'), t('planOrdersFeat9'),
        t('planOrdersFeat10'),
      ],
      popular: true,
    },
  ];

  return (
    <div className="relative">
      <div className="overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar">
        <div className={`flex gap-6 ${compact ? 'md:justify-center' : 'lg:justify-center'} min-w-max mx-auto`}>
          {plans.map((plan) => {
            const isPopular = plan.popular;
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl w-[340px] sm:w-[380px] shrink-0 overflow-hidden transition-all ${
                  isPopular
                    ? 'bg-zinc-900 text-white shadow-2xl ring-2 ring-zinc-900'
                    : 'bg-white border border-zinc-200 hover:border-zinc-300 hover:shadow-lg'
                }`}
              >
                {/* Top accent ribbon for popular plan */}
                {isPopular && (
                  <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400" />
                )}

                {/* Header */}
                <div className={`px-6 pt-6 pb-5 ${isPopular ? '' : 'border-b border-zinc-100'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-md ${plan.iconBg || 'bg-zinc-900'}`}>
                      {plan.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-lg font-bold ${isPopular ? 'text-white' : 'text-zinc-900'}`}>
                        {plan.name}
                      </h3>
                      {isPopular && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          {t('mostPopular')}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className={`text-sm leading-relaxed mb-5 ${isPopular ? 'text-zinc-300' : 'text-zinc-500'}`}>
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="flex items-baseline">
                    <span className={`text-xl font-semibold ${isPopular ? 'text-zinc-400' : 'text-zinc-400'}`}>$</span>
                    <span className={`text-4xl font-extrabold tracking-tight leading-none ${isPopular ? 'text-white' : 'text-zinc-900'}`}>
                      {plan.price}
                    </span>
                    <span className={`text-xs ml-2 ${isPopular ? 'text-zinc-400' : 'text-zinc-400'}`}>
                      {plan.billing}
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <div className="px-6 pb-3">
                  <button
                    onClick={onSelectPlan}
                    className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 ${
                      isPopular
                        ? 'bg-white text-zinc-900 hover:bg-zinc-100 shadow-md'
                        : 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-md'
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </button>
                </div>

                {/* Features */}
                <div className={`px-6 py-4 flex-1 ${isPopular ? 'bg-zinc-800/40' : ''}`}>
                  <div className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isPopular ? 'text-zinc-400' : 'text-zinc-400'}`}>
                    Included Features
                  </div>
                  <ul className="space-y-2.5">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex gap-2.5 items-start text-[13px]">
                        <span className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                          isPopular ? 'bg-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'
                        }`}>
                          <Check className={`w-3 h-3 ${isPopular ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        </span>
                        <span className={isPopular ? 'text-zinc-300' : 'text-zinc-600'}>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-center text-sm text-zinc-500 mt-4">
        {t('hostingNote')}
      </p>
    </div>
  );
};