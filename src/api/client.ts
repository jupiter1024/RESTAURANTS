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
  CustomerProfile,
  CustomerAuthResponse,
} from '../db/types';

const TOKEN_KEY = 'bistroflow_token';
const SESSION_KEY = 'bistroflow_simple_user'; // kept for compatibility

// ── Customer session keys (separate from admin session) ──
export const CUSTOMER_TOKEN_KEY = 'bistroflow_customer_token';
export const CUSTOMER_SESSION_KEY = 'bistroflow_customer_session';

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
// Branches & Delivery
// ──────────────────────────────────────────────────────────────
export async function apiSaveBranch(
  _restaurantId: string,
  branchData: {
    id?: string;
    name: string;
    address?: string;
    phone?: string;
    latitude: number;
    longitude: number;
    deliveryMode?: 'radius' | 'zone';
    maxDeliveryRadiusKm?: number;
    baseDeliveryFee?: number;
    baseDeliveryDistanceKm?: number;
    extraFeePerKm?: number;
    isActive?: boolean;
    zones?: Array<{ id?: string; zoneName: string; fee: number; estimatedTimeMin?: number }>;
    tiers?: Array<{ id?: string; minKm: number; maxKm: number; fee: number }>;
  }
): Promise<{ success: boolean; branchId: string }> {
  return apiFetch<{ success: boolean; branchId: string }>('/admin/branches', {
    method: 'POST',
    body: JSON.stringify(branchData),
  });
}

export async function apiDeleteBranch(_restaurantId: string, branchId: string): Promise<void> {
  await apiFetch(`/admin/branches/${branchId}`, { method: 'DELETE' });
}

export async function apiCalculateDeliveryFee(params: {
  restaurantId: string;
  customerLat?: number;
  customerLng?: number;
  zoneId?: string;
  branchId?: string;
}): Promise<{
  covered: boolean;
  branchId?: string;
  branchName?: string;
  distanceKm?: number;
  deliveryFee: number;
  deliveryZoneName?: string;
  estimatedTimeMin?: number;
  message?: string;
}> {
  return apiFetch('/public/delivery/calculate', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// ──────────────────────────────────────────────────────────────
// Orders
// ──────────────────────────────────────────────────────────────
export async function apiCreateOrder(
  restaurantId: string,
  orderData: Omit<CustomerOrder, 'id' | 'createdAt' | 'status'>
): Promise<CustomerOrder> {
  // Prefer the customer JWT so the backend can link the order to the account
  const customerToken = localStorage.getItem(CUSTOMER_TOKEN_KEY);
  const adminToken = localStorage.getItem(TOKEN_KEY);
  const authToken = customerToken || adminToken;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const res = await fetch('/api/public/orders', {
    method: 'POST',
    headers,
    body: JSON.stringify({ restaurantId, ...orderData }),
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const b = await res.json() as { error?: string }; msg = b.error || msg; } catch { /* ignore */ }
    throw new Error(msg);
  }

  const data = await res.json() as { orderId: string; status: string; total: number; deliveryFee?: number; items: unknown[] };

  return {
    ...orderData,
    id: data.orderId,
    deliveryFee: data.deliveryFee ?? orderData.deliveryFee,
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

// ──────────────────────────────────────────────────────────────
// CUSTOMER AUTH (public – no admin JWT needed)
// ──────────────────────────────────────────────────────────────

/** Shared fetch that attaches the *customer* JWT, not the admin JWT. */
async function customerFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem(CUSTOMER_TOKEN_KEY);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(`/api/public${path}`, { ...options, headers });
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

export function apiCustomerGetSession(): CustomerProfile | null {
  const s = localStorage.getItem(CUSTOMER_SESSION_KEY);
  const token = localStorage.getItem(CUSTOMER_TOKEN_KEY);
  if (!s || !token) return null;
  try { return JSON.parse(s) as CustomerProfile; } catch { return null; }
}

export function apiCustomerGetToken(): string | null {
  return localStorage.getItem(CUSTOMER_TOKEN_KEY);
}

export async function apiCustomerRegister(data: {
  restaurantId: string;
  name: string;
  phone: string;
  email?: string;
  password: string;
  defaultAddress?: string;
  defaultLat?: number;
  defaultLng?: number;
}): Promise<CustomerAuthResponse> {
  const res = await customerFetch<CustomerAuthResponse>('/customer/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  localStorage.setItem(CUSTOMER_TOKEN_KEY, res.token);
  localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(res.customer));
  return res;
}

export async function apiCustomerLogin(
  restaurantId: string,
  identifier: string,
  password: string
): Promise<CustomerAuthResponse> {
  const res = await customerFetch<CustomerAuthResponse>('/customer/login', {
    method: 'POST',
    body: JSON.stringify({ restaurantId, identifier, password }),
  });
  localStorage.setItem(CUSTOMER_TOKEN_KEY, res.token);
  localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(res.customer));
  return res;
}

export function apiCustomerLogout(): void {
  localStorage.removeItem(CUSTOMER_TOKEN_KEY);
  localStorage.removeItem(CUSTOMER_SESSION_KEY);
}

export async function apiCustomerGetProfile(): Promise<CustomerProfile | null> {
  try {
    const res = await customerFetch<{ customer: CustomerProfile }>('/customer/me');
    if (res.customer) {
      localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(res.customer));
    }
    return res.customer || null;
  } catch {
    return null;
  }
}

export async function apiCustomerUpdateProfile(profileData: {
  name?: string;
  defaultAddress?: string;
  defaultLat?: number;
  defaultLng?: number;
}): Promise<void> {
  await customerFetch('/customer/profile', {
    method: 'POST',
    body: JSON.stringify(profileData),
  });
  // Update cached session
  const cached = apiCustomerGetSession();
  if (cached) {
    const updated = { ...cached, ...profileData };
    localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(updated));
  }
}

export async function apiCustomerGetOrders(
  restaurantId: string,
  phone?: string
): Promise<CustomerOrder[]> {
  try {
    const token = localStorage.getItem(CUSTOMER_TOKEN_KEY);
    const qs = token
      ? `?restaurantId=${encodeURIComponent(restaurantId)}`
      : `?restaurantId=${encodeURIComponent(restaurantId)}${phone ? `&phone=${encodeURIComponent(phone)}` : ''}`;
    const res = await customerFetch<{ orders: CustomerOrder[] }>(`/customer/orders${qs}`);
    return res.orders || [];
  } catch {
    return [];
  }
}
