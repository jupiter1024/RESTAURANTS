import React, { useState } from 'react';
import { useLanguage } from '../utils/translate';
import {
  ArrowRight, Check, ChevronDown, Globe, Link2,
  MessageCircle, Smartphone, LayoutDashboard, Menu as MenuIcon,
  Sparkles, Zap, Languages
} from 'lucide-react';

interface LandingPageProps {
  onStartSignUp: (planId?: 'menu-link' | 'whatsapp' | 'website') => void;
  onStartLogin: () => void;
  onViewDemoRestaurant: (id: string) => void;
}

const plans = [
  {
    id: 'menu-link',
    name: 'Menu Link',
    price: '$10',
    billing: 'one-time',
    desc: 'Get a shareable digital menu link in minutes. Upload a photo or PDF and we handle the rest.',
    icon: <Link2 className="w-5 h-5" />,
    color: 'from-slate-500 to-slate-700',
    features: [
      'Shareable menu link',
      'Upload photo or PDF menu',
      'AI menu extraction',
      'QR code for tables',
    ],
    cta: 'Get Link',
    popular: false,
    accent: '#64748b',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Orders',
    price: '$25',
    billing: 'one-time',
    desc: 'A branded website where customers browse your menu and order directly via WhatsApp or call your hotline.',
    icon: <MessageCircle className="w-5 h-5" />,
    color: 'from-emerald-500 to-teal-600',
    features: [
      'Professional restaurant website',
      'Upload images or PDF menu',
      'Direct WhatsApp order button',
      'Hotline call button',
      'QR code for tables',
    ],
    cta: 'Get Started',
    popular: true,
    accent: '#10b981',
  },
  {
    id: 'website',
    name: 'Website',
    price: '$200',
    billing: 'one-time',
    desc: 'A complete, premium restaurant website with full menu management and admin dashboard.',
    icon: <Globe className="w-5 h-5" />,
    color: 'from-orange-500 to-amber-600',
    features: [
      'Everything in WhatsApp plan',
      'Admin dashboard',
      'Online ordering system',
      'Order management',
      'Menu editor',
      'Multiple templates',
      'Brand customization',
    ],
    cta: 'Get Website',
    popular: true,
    accent: '#f97316',
  },
  {
    id: 'full',
    name: 'Website + App',
    price: '$500',
    billing: 'one-time',
    desc: 'The complete package — website, mobile app, and full restaurant management system.',
    icon: <Smartphone className="w-5 h-5" />,
    color: 'from-violet-600 to-purple-700',
    features: [
      'Everything in Website plan',
      'iOS & Android mobile app',
      'Push notifications',
      'Advanced order dashboard',
      'Customer accounts',
      'Priority support',
    ],
    cta: 'Go Full',
    popular: false,
    accent: '#7c3aed',
  },
];

const steps = [
  { num: '01', title: 'Sign Up & Choose a Plan', desc: 'Create your account and pick the package that matches your needs and budget.', icon: <Zap className="w-6 h-6" /> },
  { num: '02', title: 'Upload Your Menu', desc: 'Upload a photo, PDF, or fill in manually. Our AI automatically structures your entire menu.', icon: <Sparkles className="w-6 h-6" /> },
  { num: '03', title: 'Go Live', desc: 'Customize your branding, pick a template, and publish your restaurant website in minutes.', icon: <Globe className="w-6 h-6" /> },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onStartSignUp, onStartLogin, onViewDemoRestaurant }) => {
  const { language, setLanguage } = useLanguage();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const faqs = [
    { q: 'Do I need any technical skills?', a: 'None at all. Upload your logo, fill in your details, add your menu, and your website is ready. Everything is managed from a simple dashboard.' },
    { q: 'Can customers order from my website?', a: 'Yes — with the WhatsApp Orders plan, customers click a button to order via WhatsApp. With the Website plan, they can order directly on-site through our checkout system.' },
    { q: 'How do I add my menu?', a: 'Upload a photo or PDF of your existing menu and our AI will extract all items, categories, and prices automatically. You can also add items manually.' },
    { q: 'Is this a monthly subscription?', a: 'No. All plans are one-time payments. You own your website setup. Hosting is billed separately as a low recurring infrastructure cost.' },
  ];

  return (
    <div className="min-h-screen bg-white text-zinc-900 overflow-x-hidden">

      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-100">
        <div className="saas-container flex items-center justify-between h-[68px]">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M4 10h16M4 14h16M8 6v12M16 6v12" strokeLinecap="round" />
              </svg>
            </div>
            <span className="font-bold text-lg tracking-tight text-zinc-900">BistroFlow</span>
          </div>

          {/* Links */}
          <div className="hidden md:flex items-center gap-1">
            {['Features', 'Pricing', 'How it works', 'FAQ'].map((l, i) => (
              <a key={i} href={`#${l.toLowerCase().replace(/ /g, '-')}`}
                className="text-sm font-medium text-zinc-500 hover:text-zinc-900 px-3 py-2 rounded-lg hover:bg-zinc-50 transition-all">
                {l}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-zinc-500 border border-zinc-200 px-3 py-1.5 rounded-lg hover:bg-zinc-50 transition-all">
              <Languages className="w-3.5 h-3.5" />
              {language === 'en' ? 'العربية' : 'English'}
            </button>
            <button onClick={onStartLogin}
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 px-3 py-2 transition-all">
              Log in
            </button>
            <button onClick={() => onStartSignUp()}
              className="text-sm font-semibold bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-700 transition-all shadow-sm">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0a0a0a]">
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.15]" style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '28px 28px'
        }} />
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-orange-500/20 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-violet-600/10 blur-[80px] rounded-full" />

        <div className="saas-container relative py-24 md:py-36 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-orange-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-7 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Restaurant Website Platform
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white leading-[1.05] tracking-tight mb-6 max-w-4xl mx-auto">
            Your Restaurant Website,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
              Built in Minutes
            </span>
          </h1>

          <p className="text-zinc-400 text-lg max-w-2xl mx-auto leading-relaxed mb-10">
            Launch a professional restaurant website, upload your menu with AI, and start receiving orders — no developer needed.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={() => onStartSignUp()}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-base px-7 py-3.5 rounded-xl transition-all shadow-lg shadow-orange-500/25 hover:-translate-y-0.5">
              Start Building Free
              <ArrowRight className="w-4 h-4" />
            </button>
            <a href="#pricing"
              className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium text-base px-7 py-3.5 rounded-xl transition-all backdrop-blur-sm">
              View Pricing
            </a>
          </div>

          {/* Demo buttons */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <span className="text-xs text-zinc-500 font-medium">Live demos:</span>
            <button onClick={() => onViewDemoRestaurant('001')}
              className="text-xs font-medium text-zinc-300 border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-orange-400" /> Bella Italia
            </button>
            <button onClick={() => onViewDemoRestaurant('002')}
              className="text-xs font-medium text-zinc-300 border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-amber-400" /> Burger Loft
            </button>
          </div>

          {/* Dashboard mockup */}
          <div className="mt-16 max-w-4xl mx-auto animate-float">
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-black/20">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
                <div className="flex-1 mx-4">
                  <div className="bg-white/5 border border-white/10 rounded-md px-3 py-1 text-xs text-zinc-400 font-mono text-center max-w-xs mx-auto">
                    bellaitalia.bistroflow.com
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-12 min-h-[320px] text-left">
                {/* Sidebar */}
                <div className="col-span-3 border-r border-white/10 p-4 hidden sm:block bg-black/10">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-6 h-6 rounded-md bg-orange-500 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M4 10h16M4 14h16M8 6v12M16 6v12" strokeLinecap="round" />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-white">BistroFlow</span>
                  </div>
                  <div className="space-y-1">
                    {[
                      { icon: <LayoutDashboard className="w-3.5 h-3.5" />, label: 'Overview', active: true },
                      { icon: <MenuIcon className="w-3.5 h-3.5" />, label: 'Menu' },
                      { icon: <Globe className="w-3.5 h-3.5" />, label: 'Website' },
                    ].map((item, i) => (
                      <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${item.active ? 'bg-orange-500 text-white' : 'text-zinc-400'}`}>
                        {item.icon}<span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Content */}
                <div className="col-span-12 sm:col-span-9 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm font-semibold text-white">Bella Italia</div>
                      <div className="text-xs text-zinc-400">Restaurant Dashboard</div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Live
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[{ l: 'Orders Today', v: '12' }, { l: 'Menu Items', v: '24' }, { l: 'Website Visits', v: '340' }].map((s, i) => (
                      <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3">
                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">{s.l}</div>
                        <div className="text-lg font-bold text-white">{s.v}</div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <div className="text-xs font-semibold text-white mb-2">Recent Orders</div>
                    {[
                      { id: 'ORD-4821', name: 'Ahmed A.', total: '360 EGP', status: 'Pending', c: 'text-amber-400' },
                      { id: 'ORD-4820', name: 'Sara M.', total: '240 EGP', status: 'Preparing', c: 'text-blue-400' },
                    ].map((o, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-zinc-300">{o.id}</span>
                          <span className="text-xs text-zinc-500">{o.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white font-medium">{o.total}</span>
                          <span className={`text-[10px] font-medium ${o.c}`}>{o.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24 bg-zinc-50 border-y border-zinc-100">
        <div className="saas-container">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold text-orange-500 uppercase tracking-widest">How It Works</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mt-2 mb-3 tracking-tight">Launch in 3 Simple Steps</h2>
            <p className="text-zinc-500 max-w-xl mx-auto text-sm leading-relaxed">No technical skills needed. Your restaurant website can be live today.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <div key={i} className="relative bg-white rounded-2xl border border-zinc-200 p-8 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                <div className="w-12 h-12 rounded-xl bg-zinc-900 text-white flex items-center justify-center mb-5 shadow-md">
                  {s.icon}
                </div>
                <div className="absolute top-6 right-6 text-4xl font-black text-zinc-100">{s.num}</div>
                <h3 className="text-base font-bold text-zinc-900 mb-2">{s.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 bg-white">
        <div className="saas-container">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold text-orange-500 uppercase tracking-widest">Pricing</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mt-2 mb-3 tracking-tight">Simple, One-Time Pricing</h2>
            <p className="text-zinc-500 max-w-xl mx-auto text-sm leading-relaxed">No subscriptions. No hidden fees. Pay once and own your setup.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
            {plans.map((plan) => (
              <div key={plan.id} className={`relative rounded-2xl border flex flex-col h-full transition-all duration-200 hover:shadow-xl hover:-translate-y-1 ${plan.popular ? 'border-orange-400 shadow-lg shadow-orange-100 ring-1 ring-orange-300' : 'border-zinc-200 shadow-sm'}`}>
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-orange-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-md whitespace-nowrap">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="p-6 flex-1">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center text-white mb-4 shadow-md`}>
                    {plan.icon}
                  </div>
                  <div className="text-base font-bold text-zinc-900 mb-1">{plan.name}</div>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-3xl font-black text-zinc-900">{plan.price}</span>
                    <span className="text-xs text-zinc-400 mb-1.5">one-time</span>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed mb-5">{plan.desc}</p>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-zinc-700">
                        <Check className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="px-6 pb-6">
                  <button
                    onClick={() => onStartSignUp(plan.id === 'website' ? 'website' : plan.id === 'whatsapp' ? 'whatsapp' : 'menu-link')}
                    className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${plan.popular ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-md shadow-orange-200' : 'bg-zinc-900 text-white hover:bg-zinc-700'}`}>
                    {plan.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-zinc-400 mt-6">Hosting billed separately as a low recurring infrastructure cost.</p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-zinc-50 border-y border-zinc-100">
        <div className="saas-container max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold text-orange-500 uppercase tracking-widest">FAQ</span>
            <h2 className="text-3xl font-bold text-zinc-900 mt-2 tracking-tight">Common Questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => {
              const open = activeFaq === i;
              return (
                <div key={i} className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                  <button onClick={() => setActiveFaq(open ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-zinc-50 transition-all">
                    <span className="font-semibold text-sm text-zinc-900">{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                  </button>
                  {open && (
                    <div className="px-5 pb-5 text-sm text-zinc-500 leading-relaxed border-t border-zinc-100 pt-4">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative bg-[#0a0a0a] py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.12]" style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '28px 28px'
        }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-orange-500/15 blur-[80px] rounded-full" />
        <div className="saas-container relative text-center">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-4 tracking-tight">Ready to Go Live?</h2>
          <p className="text-zinc-400 text-base mb-8 max-w-xl mx-auto">Join hundreds of restaurants growing their sales with BistroFlow. Setup takes less than 30 minutes.</p>
          <button onClick={() => onStartSignUp()}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-base px-8 py-4 rounded-xl transition-all shadow-lg shadow-orange-500/30 hover:-translate-y-0.5">
            Start Building Now
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-zinc-100 py-8">
        <div className="saas-container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-zinc-900 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M4 10h16M4 14h16M8 6v12M16 6v12" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-xs text-zinc-400">© 2026 BistroFlow. All rights reserved.</span>
          </div>
          <div className="flex gap-6 text-xs font-medium text-zinc-400">
            <a href="#" className="hover:text-zinc-900 transition-all">Privacy</a>
            <a href="#" className="hover:text-zinc-900 transition-all">Terms</a>
            <a href="#" className="hover:text-zinc-900 transition-all">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};