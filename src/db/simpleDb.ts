export interface SimpleUser {
  id: string;
  email: string;
  password: string; // plaintext for demo
  restaurantId: string;
}

export interface MenuFile {
  id: string;
  type: 'image' | 'pdf';
  name: string;
  dataUrl: string; // base64 data URL stored locally
  uploadedAt: string;
}

// Offer 3 Data Structures
export interface MenuItemOption {
  id: string;
  name: string; // e.g. "Single (150g)", "Double (300g)", "Triple (450g)" OR "3 Pieces", "6 Pieces"
  priceDelta: number; // e.g. 0, 4, 8
}

export interface MenuItemAddon {
  id: string;
  name: string; // e.g. "Extra Cheese", "Spicy Sauce", "Fries & Drink"
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
  isOffer?: boolean; // Highlighted offer / combo
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
  template?: 'modern' | 'luxury'; // 2 professional templates
  primaryColor?: string; // e.g. '#f97316'
  accentColor?: string;  // e.g. '#ef4444'
  bgColor?: string;      // custom background color
  textColor?: string;    // custom text color
  bgMode?: 'dark' | 'light' | 'cream' | 'glass';
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
  customerName: string;
  customerPhone: string;
  address?: string;
  orderType: 'delivery' | 'pickup';
  items: CustomerOrderItem[];
  total: number;
  status: 'pending' | 'preparing' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface SimpleRestaurant {
  id: string;
  name: string;
  menuFiles: MenuFile[];
  published: boolean;
  createdAt: string;
  whatsappNumber?: string;
  hotline?: string;
  plan?: 'menu-link' | 'whatsapp' | 'website'; // active previewed plan
  paidPlan?: 'menu-link' | 'whatsapp' | 'website'; // actual purchased plan
  categories?: InteractiveCategory[];
  items?: InteractiveItem[];
  branding?: RestaurantBranding;
  orders?: CustomerOrder[];
}

export interface SimpleSchema {
  users: Record<string, SimpleUser>;
  restaurants: Record<string, SimpleRestaurant>;
}

const STORAGE_KEY = 'bistroflow_simple_db';

// Sample Seed Data for Offer 3
const SAMPLE_CATEGORIES: InteractiveCategory[] = [
  { id: 'cat_offers', name: '🔥 Special Offers & Combos' },
  { id: 'cat_burgers', name: '🍔 Gourmet Burgers' },
  { id: 'cat_chicken', name: '🍗 Fried Chicken' },
  { id: 'cat_drinks', name: '🥤 Drinks & Desserts' },
];

const SAMPLE_ITEMS: InteractiveItem[] = [
  // Offers
  {
    id: 'item_off1',
    categoryId: 'cat_offers',
    name: 'Twin Smash Burger Deal',
    description: '2 Single Smash Cheese Burgers + 2 Medium Fries + 2 Drinks of your choice.',
    price: 18.99,
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80',
    available: true,
    isOffer: true,
    addons: [
      { id: 'add_cheese', name: 'Extra Cheddar Cheese Sauce', price: 1.50 },
      { id: 'add_bacon', name: 'Extra Crispy Bacon', price: 2.00 }
    ]
  },
  {
    id: 'item_off2',
    categoryId: 'cat_offers',
    name: 'Family Chicken Feast Box',
    description: '12 Pcs Golden Fried Chicken + Large Fries + Coleslaw + 3 Garlic Dips + 1.5L Soda.',
    price: 29.99,
    image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80',
    available: true,
    isOffer: true,
  },
  // Burgers
  {
    id: 'item_b1',
    categoryId: 'cat_burgers',
    name: 'Smokey BBQ Bacon Burger',
    description: 'Flame-grilled Angus beef patty, smoked bacon, melted cheddar, crispy onion rings & BBQ sauce.',
    price: 11.50,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    available: true,
    options: [
      { id: 'opt_s1', name: 'Single Patty (150g)', priceDelta: 0 },
      { id: 'opt_s2', name: 'Double Patty (300g)', priceDelta: 4.50 },
      { id: 'opt_s3', name: 'Triple Monster (450g)', priceDelta: 8.00 }
    ],
    addons: [
      { id: 'add_cheesy', name: 'Extra Melted Cheddar', price: 1.50 },
      { id: 'add_jalapeno', name: 'Spicy Jalapeños', price: 1.00 },
      { id: 'add_sauce', name: 'Secret House Sauce', price: 0.75 }
    ]
  },
  {
    id: 'item_b2',
    categoryId: 'cat_burgers',
    name: 'Classic Smash Cheese Burger',
    description: 'Smashed beef patty, American cheese, pickles, diced onions, mustard & ketchup on brioche.',
    price: 9.50,
    image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80',
    available: true,
    options: [
      { id: 'opt_cs1', name: 'Single (150g)', priceDelta: 0 },
      { id: 'opt_cs2', name: 'Double (300g)', priceDelta: 3.50 },
      { id: 'opt_cs3', name: 'Triple (450g)', priceDelta: 6.50 }
    ]
  },
  // Fried Chicken
  {
    id: 'item_c1',
    categoryId: 'cat_chicken',
    name: 'Crispy Golden Chicken Box',
    description: 'Hand-breaded crunchy fried chicken seasoned with our signature secret spice blend.',
    price: 8.99,
    image: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80',
    available: true,
    options: [
      { id: 'opt_c3', name: '3 Pieces Box', priceDelta: 0 },
      { id: 'opt_c6', name: '6 Pieces Box', priceDelta: 6.00 },
      { id: 'opt_c9', name: '9 Pieces Bucket', priceDelta: 11.50 },
      { id: 'opt_c12', name: '12 Pieces Family Bucket', priceDelta: 16.00 }
    ],
    addons: [
      { id: 'add_garlic', name: 'Extra Garlic Dip', price: 1.25 },
      { id: 'add_spicy', name: 'Hot Honey Glaze', price: 1.50 },
      { id: 'add_fries', name: 'Upgrade to Waffle Fries', price: 2.00 }
    ]
  },
  // Drinks
  {
    id: 'item_d1',
    categoryId: 'cat_drinks',
    name: 'Fresh Mint Lemonade',
    description: 'Hand-squeezed fresh lemons blended with crushed ice and organic mint leaves.',
    price: 3.99,
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
    available: true
  }
];

class SimpleDatabase {
  private db: SimpleSchema;

  constructor() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        this.db = JSON.parse(stored);
      } catch {
        this.db = { users: {}, restaurants: {} };
        this.save();
      }
    } else {
      this.db = { users: {}, restaurants: {} };
      this.save();
    }
  }

  private save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db));
  }

  // Auth
  register(email: string, password: string, restaurantName: string, plan: 'menu-link' | 'whatsapp' | 'website' = 'menu-link'): SimpleUser {
    const normalized = email.toLowerCase().trim();
    if (this.db.users[normalized]) throw new Error('Email already registered.');

    const restId = `r_${Math.random().toString(36).substr(2, 8)}`;
    const userId = `u_${Math.random().toString(36).substr(2, 8)}`;

    const restaurant: SimpleRestaurant = {
      id: restId,
      name: restaurantName,
      menuFiles: [],
      published: true,
      createdAt: new Date().toISOString(),
      plan,
      paidPlan: plan,
      categories: plan === 'website' ? [...SAMPLE_CATEGORIES] : [],
      items: plan === 'website' ? [...SAMPLE_ITEMS] : [],
      branding: {
        template: 'modern',
        primaryColor: '#f97316',
        accentColor: '#ef4444',
        bgColor: '#0d0d11',
        textColor: '#f0f0f4',
        bgMode: 'dark'
      },
      orders: []
    };

    const user: SimpleUser = {
      id: userId,
      email: normalized,
      password,
      restaurantId: restId,
    };

    this.db.restaurants[restId] = restaurant;
    this.db.users[normalized] = user;
    this.save();

    localStorage.setItem('bistroflow_simple_user', JSON.stringify({ email: normalized, restaurantId: restId }));
    return user;
  }

  login(email: string, password: string): SimpleUser {
    const normalized = email.toLowerCase().trim();
    const user = this.db.users[normalized];
    if (!user || user.password !== password) throw new Error('Invalid email or password.');
    localStorage.setItem('bistroflow_simple_user', JSON.stringify({ email: normalized, restaurantId: user.restaurantId }));
    return user;
  }

  logout() {
    localStorage.removeItem('bistroflow_simple_user');
  }

  getSession(): { email: string; restaurantId: string } | null {
    const s = localStorage.getItem('bistroflow_simple_user');
    if (!s) return null;
    try { return JSON.parse(s); } catch { return null; }
  }

  // Restaurant
  getRestaurant(id: string): SimpleRestaurant | null {
    const r = this.db.restaurants[id];
    if (r) {
      // Ensure arrays are initialized
      if (!r.categories) r.categories = [];
      if (!r.items) r.items = [];
      if (!r.orders) r.orders = [];
      if (!r.branding) r.branding = { primaryColor: '#f97316', accentColor: '#ef4444', bgMode: 'dark' };
    }
    return r || null;
  }

  // Menu files (Offer 1 & 2)
  addMenuFile(restaurantId: string, file: Omit<MenuFile, 'id' | 'uploadedAt'>): MenuFile {
    const restaurant = this.db.restaurants[restaurantId];
    if (!restaurant) throw new Error('Restaurant not found');

    const newFile: MenuFile = {
      ...file,
      id: `f_${Math.random().toString(36).substr(2, 8)}`,
      uploadedAt: new Date().toISOString(),
    };

    restaurant.menuFiles.push(newFile);
    restaurant.published = true;
    this.save();
    return newFile;
  }

  removeMenuFile(restaurantId: string, fileId: string) {
    const restaurant = this.db.restaurants[restaurantId];
    if (!restaurant) return;
    restaurant.menuFiles = restaurant.menuFiles.filter(f => f.id !== fileId);
    if (restaurant.menuFiles.length === 0 && (!restaurant.items || restaurant.items.length === 0)) {
      restaurant.published = false;
    }
    this.save();
  }

  updateContactInfo(restaurantId: string, whatsappNumber: string, hotline: string) {
    const restaurant = this.db.restaurants[restaurantId];
    if (!restaurant) return;
    restaurant.whatsappNumber = whatsappNumber;
    restaurant.hotline = hotline;
    this.save();
  }

  setPlan(restaurantId: string, plan: 'menu-link' | 'whatsapp' | 'website') {
    const restaurant = this.db.restaurants[restaurantId];
    if (!restaurant) return;
    restaurant.plan = plan;
    if (plan === 'website' && (!restaurant.categories || restaurant.categories.length === 0)) {
      restaurant.categories = [...SAMPLE_CATEGORIES];
      restaurant.items = [...SAMPLE_ITEMS];
    }
    this.save();
  }

  upgradePaidPlan(restaurantId: string, plan: 'menu-link' | 'whatsapp' | 'website') {
    const restaurant = this.db.restaurants[restaurantId];
    if (!restaurant) return;
    restaurant.paidPlan = plan;
    restaurant.plan = plan;
    if (plan === 'website' && (!restaurant.categories || restaurant.categories.length === 0)) {
      restaurant.categories = [...SAMPLE_CATEGORIES];
      restaurant.items = [...SAMPLE_ITEMS];
    }
    this.save();
  }

  // ─────────────────────────────────────────────────────
  // OFFER 3: Interactive Menu & Orders Methods
  // ─────────────────────────────────────────────────────
  
  // Category management
  addCategory(restaurantId: string, name: string): InteractiveCategory {
    const r = this.getRestaurant(restaurantId);
    if (!r) throw new Error('Restaurant not found');
    const newCat: InteractiveCategory = {
      id: `cat_${Math.random().toString(36).substr(2, 8)}`,
      name
    };
    r.categories = [...(r.categories || []), newCat];
    this.save();
    return newCat;
  }

  updateCategory(restaurantId: string, categoryId: string, name: string) {
    const r = this.getRestaurant(restaurantId);
    if (!r || !r.categories) return;
    const cat = r.categories.find(c => c.id === categoryId);
    if (cat) cat.name = name;
    this.save();
  }

  deleteCategory(restaurantId: string, categoryId: string) {
    const r = this.getRestaurant(restaurantId);
    if (!r) return;
    r.categories = (r.categories || []).filter(c => c.id !== categoryId);
    r.items = (r.items || []).filter(i => i.categoryId !== categoryId);
    this.save();
  }

  // Item management
  saveItem(restaurantId: string, itemData: Omit<InteractiveItem, 'id'> & { id?: string }): InteractiveItem {
    const r = this.getRestaurant(restaurantId);
    if (!r) throw new Error('Restaurant not found');

    let item: InteractiveItem;
    if (itemData.id) {
      const idx = (r.items || []).findIndex(i => i.id === itemData.id);
      item = { ...itemData, id: itemData.id } as InteractiveItem;
      if (idx !== -1 && r.items) {
        r.items[idx] = item;
      } else {
        r.items = [...(r.items || []), item];
      }
    } else {
      item = {
        ...itemData,
        id: `item_${Math.random().toString(36).substr(2, 8)}`,
      };
      r.items = [...(r.items || []), item];
    }

    this.save();
    return item;
  }

  deleteItem(restaurantId: string, itemId: string) {
    const r = this.getRestaurant(restaurantId);
    if (!r) return;
    r.items = (r.items || []).filter(i => i.id !== itemId);
    this.save();
  }

  // Branding management
  updateBranding(restaurantId: string, branding: Partial<RestaurantBranding>) {
    const r = this.getRestaurant(restaurantId);
    if (!r) return;
    r.branding = { ...(r.branding || {}), ...branding };
    this.save();
  }

  // Order management
  createOrder(restaurantId: string, orderData: Omit<CustomerOrder, 'id' | 'createdAt' | 'status'>): CustomerOrder {
    const r = this.getRestaurant(restaurantId);
    if (!r) throw new Error('Restaurant not found');

    const newOrder: CustomerOrder = {
      ...orderData,
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    r.orders = [newOrder, ...(r.orders || [])];
    this.save();
    return newOrder;
  }

  updateOrderStatus(restaurantId: string, orderId: string, status: CustomerOrder['status']) {
    const r = this.getRestaurant(restaurantId);
    if (!r || !r.orders) return;
    const order = r.orders.find(o => o.id === orderId);
    if (order) order.status = status;
    this.save();
  }
}

export const simpleDb = new SimpleDatabase();
