import React, { useState, useEffect } from 'react';
import type { SimpleRestaurant } from '../db/types';
import { InteractiveCustomerView } from '../components/InteractiveCustomerView';
import { CustomerView } from '../components/CustomerView';

interface PublicMenuPageProps {
  slug: string;
}

interface SiteData {
  restaurant: {
    id: string;
    name: string;
    slug: string;
    whatsapp_number?: string;
    hotline?: string;
    plan?: string;
    paidPlan?: string;
  };
  branding: Record<string, unknown>;
  categories: Array<{ id: string; name: string; icon?: string }>;
  items: Array<Record<string, unknown>>;
  menuFiles: Array<{ id: string; type: string; name: string; fileUrl: string; uploaded_at: string }>;
}

export const PublicMenuPage: React.FC<PublicMenuPageProps> = ({ slug }) => {
  const [siteData, setSiteData] = useState<SiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/public/site?slug=${encodeURIComponent(slug)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Restaurant not found or not published.');
        return res.json() as Promise<SiteData>;
      })
      .then(setSiteData)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0d11]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading menu…</p>
        </div>
      </div>
    );
  }

  if (error || !siteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0d11]">
        <div className="text-center px-6">
          <div className="text-6xl mb-4">🍽️</div>
          <h1 className="text-2xl font-bold text-white mb-2">Menu Unavailable</h1>
          <p className="text-gray-400">{error || 'This restaurant menu is not available right now.'}</p>
        </div>
      </div>
    );
  }

  // Map API response → SimpleRestaurant shape
  const branding = siteData.branding as Record<string, string>;
  const activePlan = (siteData.restaurant.paidPlan || siteData.restaurant.plan || 'menu-link') as SimpleRestaurant['paidPlan'];

  const restaurant: SimpleRestaurant = {
    id: siteData.restaurant.id,
    name: siteData.restaurant.name,
    menuFiles: siteData.menuFiles.map((f) => ({
      id: String(f.id || ''),
      type: ((f.type || (f as Record<string, unknown>).file_type || (f as Record<string, unknown>).fileType || 'image') as 'image' | 'pdf'),
      name: String(f.name || (f as Record<string, unknown>).file_name || 'Menu'),
      dataUrl: String(f.fileUrl || (f as Record<string, unknown>).dataUrl || (f as Record<string, unknown>).file_url || ''),
      uploadedAt: String(f.uploaded_at || (f as Record<string, unknown>).uploadedAt || ''),
    })),
    published: true,
    createdAt: '',
    whatsappNumber: siteData.restaurant.whatsapp_number,
    hotline: siteData.restaurant.hotline,
    plan: activePlan,
    paidPlan: activePlan,
    categories: siteData.categories.map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
    })),
    items: siteData.items.map((item) => ({
      id: String(item.id || ''),
      categoryId: String(item.category_id || item.categoryId || ''),
      name: String(item.name || ''),
      description: String(item.description || ''),
      price: Number(item.price ?? item.base_price ?? 0),
      image: (item.image_url || item.image) as string | undefined,
      available: item.available !== undefined ? Boolean(item.available) : true,
      isOffer: Boolean(item.is_offer || item.isOffer),
      options: ((item.options as Array<{ id?: string; name: string; price_delta?: number; priceDelta?: number }>) || []).map((o) => ({
        id: String(o.id || ''),
        name: o.name,
        priceDelta: Number(o.price_delta ?? o.priceDelta ?? 0),
      })),
      addons: ((item.addons as Array<{ id?: string; name: string; price?: number }>) || []).map((a) => ({
        id: String(a.id || ''),
        name: a.name,
        price: Number(a.price ?? 0),
      })),
    })),
    branding: {
      logoUrl: branding.logo_url,
      template: (branding.template as 'modern' | 'luxury') || 'modern',
      primaryColor: branding.primary_color || '#f97316',
      accentColor: branding.accent_color || '#ef4444',
      bgColor: branding.bg_color,
      textColor: branding.text_color,
      bgMode: (branding.bg_mode as 'dark' | 'light' | 'cream' | 'glass') || 'dark',
    },
    orders: [],
  };

  // Render Offer 3 (Interactive Ordering Website) OR Offer 1/2 (PDF / Image Digital Menu with WhatsApp/Phone)
  if (activePlan === 'website') {
    return <InteractiveCustomerView restaurant={restaurant} />;
  }

  return (
    <CustomerView
      files={restaurant.menuFiles}
      restaurantName={restaurant.name}
      whatsappNumber={restaurant.whatsappNumber}
      hotline={restaurant.hotline}
      plan={activePlan as 'menu-link' | 'whatsapp'}
    />
  );
};
