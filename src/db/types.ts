// ──────────────────────────────────────────────────────────────
// Shared BistroFlow data types
// ──────────────────────────────────────────────────────────────

export interface SimpleUser {
  id: string;
  email: string;
  password: string;
  restaurantId: string;
}

export interface MenuFile {
  id: string;
  type: 'image' | 'pdf';
  name: string;
  dataUrl: string; // URL (from R2)
  uploadedAt: string;
}

export interface MenuItemOption {
  id: string;
  name: string;
  priceDelta: number;
}

export interface MenuItemAddon {
  id: string;
  name: string;
  price: number;
}

export interface InteractiveItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  available: boolean;
  isOffer?: boolean;
  options?: MenuItemOption[];
  addons?: MenuItemAddon[];
}

export interface InteractiveCategory {
  id: string;
  name: string;
  icon?: string;
}

export interface RestaurantBranding {
  logoUrl?: string;
  template?: 'modern' | 'luxury';
  primaryColor?: string;
  accentColor?: string;
  bgColor?: string;
  textColor?: string;
  bgMode?: 'dark' | 'light' | 'cream' | 'glass';
}

export interface DeliveryZone {
  id: string;
  branchId: string;
  zoneName: string;
  fee: number;
  estimatedTimeMin?: number;
}

export interface DeliveryDistanceTier {
  id: string;
  branchId: string;
  minKm: number;
  maxKm: number;
  fee: number;
}

export interface Branch {
  id: string;
  restaurantId: string;
  name: string;
  address?: string;
  phone?: string;
  latitude: number;
  longitude: number;
  deliveryMode: 'radius' | 'zone'; // 'radius' (Option 1) | 'zone' (Option 2)
  maxDeliveryRadiusKm: number;
  baseDeliveryFee: number;
  baseDeliveryDistanceKm: number;
  extraFeePerKm: number;
  isActive: boolean;
  zones?: DeliveryZone[];
  tiers?: DeliveryDistanceTier[];
  createdAt?: string;
}

export interface CustomerProfile {
  id: string;
  restaurantId: string;
  name: string;
  phone: string;
  email?: string;
  defaultAddress?: string;
  defaultLat?: number;
  defaultLng?: number;
  createdAt: string;
}

export interface CustomerAuthResponse {
  token: string;
  customer: CustomerProfile;
}

export interface CustomerOrderItem {
  itemId: string;
  name: string;
  selectedOption?: string;
  selectedAddons?: string[];
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface CustomerOrder {
  id: string;
  restaurantId?: string;
  customerId?: string;
  branchId?: string;
  branchName?: string;
  customerName: string;
  customerPhone: string;
  address?: string;
  orderType: 'delivery' | 'pickup';
  items: CustomerOrderItem[];
  deliveryFee: number;
  total: number;
  deliveryZoneName?: string;
  customerLat?: number;
  customerLng?: number;
  googleMapsUrl?: string;
  distanceKm?: number;
  status: 'pending' | 'preparing' | 'completed' | 'cancelled';
  createdAt: string;
}


export interface SimpleRestaurant {
  id: string;
  name: string;
  slug?: string;
  menuFiles: MenuFile[];
  published: boolean;
  createdAt: string;
  whatsappNumber?: string;
  hotline?: string;
  plan?: 'menu-link' | 'whatsapp' | 'website';
  paidPlan?: 'menu-link' | 'whatsapp' | 'website';
  categories?: InteractiveCategory[];
  items?: InteractiveItem[];
  branding?: RestaurantBranding;
  branches?: Branch[];
  orders?: CustomerOrder[];
}

export interface SimpleSchema {
  users: Record<string, SimpleUser>;
  restaurants: Record<string, SimpleRestaurant>;
}
