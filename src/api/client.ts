/**
 * BistroFlow API Client
 * Replaces simpleDb's localStorage operations with real HTTP calls to the Hono Worker backend.
 * Mirrors the same method signatures so existing frontend components need minimal changes.
 */

import type {
  SimpleRestaurant,
  SimpleUser,
  MenuFile,
  InteractiveItem,
  InteractiveCategory,
  RestaurantBranding,
  CustomerOrder,
} from '../db/types';

const TOKEN_KEY = 'bistroflow_token';
const SESSION_KEY = 'bistroflow_simple_user'; // kept for compatibility

// ──────────────────────────────────────────────────────────────
// Base fetch helper
// ──────────────────────────────────────────────────────────────
async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(`/api${path}`, { ...options, headers });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json() as { error?: string };
      msg = body.error || msg;
    } catch { /* ignore */ }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

// ──────────────────────────────────────────────────────────────
// Auth
// ──────────────────────────────────────────────────────────────
export async function apiRegister(
  email: string,
  password: string,
  restaurantName: string,
  plan: 'menu-link' | 'whatsapp' | 'website' = 'menu-link'
): Promise<SimpleUser> {
  const data = await apiFetch<{ token: string; user: { id: string; email: string; restaurantId: string; slug: string } }>(
    '/auth/register',
    { method: 'POST', body: JSON.stringify({ email, password, restaurantName, plan }) }
  );
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email: data.user.email, restaurantId: data.user.restaurantId }));
  return { id: data.user.id, email: data.user.email, password: '', restaurantId: data.user.restaurantId };
}

export async function apiLogin(email: string, password: string): Promise<SimpleUser> {
  const data = await apiFetch<{ token: string; user: { id: string; email: string; restaurantId: string; slug: string } }>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify({ email, password }) }
  );
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email: data.user.email, restaurantId: data.user.restaurantId }));
  return { id: data.user.id, email: data.user.email, password: '', restaurantId: data.user.restaurantId };
}

export function apiLogout(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SESSION_KEY);
}

export function apiGetSession(): { email: string; restaurantId: string } | null {
  const s = localStorage.getItem(SESSION_KEY);
  const token = localStorage.getItem(TOKEN_KEY);
  if (!s || !token) return null;
  try { return JSON.parse(s); } catch { return null; }
}

// ──────────────────────────────────────────────────────────────
// Restaurant
// ──────────────────────────────────────────────────────────────
export async function apiGetRestaurant(_restaurantId?: string): Promise<SimpleRestaurant | null> {
  try {
    const data = await apiFetch<{ restaurant: SimpleRestaurant }>('/admin/restaurant');
    return data.restaurant || null;
  } catch {
    return null;
  }
}

export async function apiUpdateContactInfo(
  _restaurantId: string,
  whatsappNumber: string,
  hotline: string
): Promise<void> {
  await apiFetch('/admin/contact', {
    method: 'POST',
    body: JSON.stringify({ whatsappNumber, hotline }),
  });
}

export async function apiSetPlan(
  _restaurantId: string,
  plan: 'menu-link' | 'whatsapp' | 'website'
): Promise<void> {
  await apiFetch('/admin/plan', {
    method: 'POST',
    body: JSON.stringify({ plan, isUpgrade: false }),
  });
}

export async function apiUpgradePaidPlan(
  _restaurantId: string,
  plan: 'menu-link' | 'whatsapp' | 'website'
): Promise<void> {
  await apiFetch('/admin/plan', {
    method: 'POST',
    body: JSON.stringify({ plan, isUpgrade: true }),
  });
}

// ──────────────────────────────────────────────────────────────
// Menu Files (Offer 1 & 2)
// ──────────────────────────────────────────────────────────────
export async function apiAddMenuFile(
  restaurantId: string,
  file: File,
  type: 'image' | 'pdf'
): Promise<MenuFile> {
  const form = new FormData();
  form.append('file', file);
  form.append('restaurantId', restaurantId);
  form.append('fileType', type);

  const data = await apiFetch<{ id: string; type: 'image' | 'pdf'; name: string; dataUrl: string; uploadedAt: string }>(
    '/admin/upload',
    { method: 'POST', body: form }
  );

  return {
    id: data.id,
    type: data.type || type,
    name: data.name,
    dataUrl: data.dataUrl,
    uploadedAt: data.uploadedAt || new Date().toISOString(),
  };
}

export async function apiRemoveMenuFile(_restaurantId: string, fileId: string): Promise<void> {
  await apiFetch(`/admin/files/${fileId}`, { method: 'DELETE' });
}

// ──────────────────────────────────────────────────────────────
// Upload generic file/image → R2, returns public URL
// ──────────────────────────────────────────────────────────────
export async function apiUploadImage(
  restaurantId: string,
  file: File
): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  form.append('restaurantId', restaurantId);

  const data = await apiFetch<{ dataUrl: string }>(
    '/admin/upload',
    { method: 'POST', body: form }
  );
  return data.dataUrl;
}

// ──────────────────────────────────────────────────────────────
// Categories
// ──────────────────────────────────────────────────────────────
export async function apiAddCategory(
  _restaurantId: string,
  name: string
): Promise<InteractiveCategory> {
  return apiFetch<InteractiveCategory>('/admin/categories', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function apiUpdateCategory(
  _restaurantId: string,
  _categoryId: string,
  _name: string
): Promise<void> {
  return;
}

export async function apiDeleteCategory(_restaurantId: string, categoryId: string): Promise<void> {
  await apiFetch(`/admin/categories/${categoryId}`, { method: 'DELETE' });
}

// ──────────────────────────────────────────────────────────────
// Items
// ──────────────────────────────────────────────────────────────
export async function apiSaveItem(
  restaurantId: string,
  itemData: Omit<InteractiveItem, 'id'> & { id?: string }
): Promise<InteractiveItem> {
  const res = await apiFetch<{ success: boolean; itemId: string }>('/admin/items', {
    method: 'POST',
    body: JSON.stringify({ restaurantId, ...itemData }),
  });
  return {
    ...itemData,
    id: res.itemId || itemData.id || `item_${Date.now()}`,
  };
}

export async function apiDeleteItem(_restaurantId: string, itemId: string): Promise<void> {
  await apiFetch(`/admin/items/${itemId}`, { method: 'DELETE' });
}

// ──────────────────────────────────────────────────────────────
// Branding
// ──────────────────────────────────────────────────────────────
export async function apiUpdateBranding(
  _restaurantId: string,
  branding: Partial<RestaurantBranding>
): Promise<void> {
  await apiFetch('/admin/branding', {
    method: 'POST',
    body: JSON.stringify(branding),
  });
}

// ──────────────────────────────────────────────────────────────
// Orders
// ──────────────────────────────────────────────────────────────
export async function apiCreateOrder(
  restaurantId: string,
  orderData: Omit<CustomerOrder, 'id' | 'createdAt' | 'status'>
): Promise<CustomerOrder> {
  const data = await apiFetch<{ orderId: string; status: string; total: number; items: unknown[] }>('/public/orders', {
    method: 'POST',
    body: JSON.stringify({ restaurantId, ...orderData }),
  });
  return {
    ...orderData,
    id: data.orderId,
    total: data.total ?? orderData.total,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
}

export async function apiUpdateOrderStatus(
  _restaurantId: string,
  orderId: string,
  status: CustomerOrder['status']
): Promise<void> {
  await apiFetch('/admin/orders/status', {
    method: 'POST',
    body: JSON.stringify({ orderId, status }),
  });
}

export async function apiGetOrders(_restaurantId: string): Promise<CustomerOrder[]> {
  try {
    const data = await apiFetch<{ restaurant: SimpleRestaurant }>('/admin/restaurant');
    return data.restaurant?.orders || [];
  } catch {
    return [];
  }
}
