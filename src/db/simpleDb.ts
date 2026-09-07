/**
 * simpleDb — Compatibility shim
 *
 * All localStorage operations have been replaced with calls to the real
 * Hono Worker API via src/api/client.ts.
 *
 * The exported `simpleDb` object keeps the same method signatures so that
 * existing frontend code (SimpleAuth, AdminDashboard, etc.) works without
 * modification. Async methods now return Promises; callers that were already
 * awaiting them continue to work, and synchronous callers have been updated
 * in App.tsx.
 */

import {
  apiRegister,
  apiLogin,
  apiLogout,
  apiGetSession,
  apiGetRestaurant,
  apiUpdateContactInfo,
  apiSetPlan,
  apiUpgradePaidPlan,
  apiAddMenuFile,
  apiRemoveMenuFile,
  apiAddCategory,
  apiUpdateCategory,
  apiDeleteCategory,
  apiSaveItem,
  apiDeleteItem,
  apiUpdateBranding,
  apiCreateOrder,
  apiUpdateOrderStatus,
  apiGetOrders,
} from '../api/client';

// ──────────────────────────────────────────────────────────────
// Re-export all interfaces so imports from './simpleDb' still work
// ──────────────────────────────────────────────────────────────
export type { SimpleUser, MenuFile, MenuItemOption, MenuItemAddon, InteractiveItem, InteractiveCategory, RestaurantBranding, CustomerOrderItem, CustomerOrder, SimpleRestaurant, SimpleSchema } from './types';

// ──────────────────────────────────────────────────────────────
// Shim object
// ──────────────────────────────────────────────────────────────
export const simpleDb = {
  // Auth
  register: apiRegister,
  login: apiLogin,
  logout: apiLogout,
  getSession: apiGetSession,

  // Restaurant (sync-ish — now async under the hood)
  getRestaurant: apiGetRestaurant,
  updateContactInfo: apiUpdateContactInfo,
  setPlan: apiSetPlan,
  upgradePaidPlan: apiUpgradePaidPlan,

  // Menu Files
  addMenuFile: apiAddMenuFile,
  removeMenuFile: apiRemoveMenuFile,

  // Categories
  addCategory: apiAddCategory,
  updateCategory: apiUpdateCategory,
  deleteCategory: apiDeleteCategory,

  // Items
  saveItem: apiSaveItem,
  deleteItem: apiDeleteItem,

  // Branding
  updateBranding: apiUpdateBranding,

  // Orders
  createOrder: apiCreateOrder,
  updateOrderStatus: apiUpdateOrderStatus,
  getOrders: apiGetOrders,
};
