-- 1. Restaurants Table (Multi-Tenant Core)
CREATE TABLE IF NOT EXISTS restaurants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'menu-link',
  paid_plan TEXT NOT NULL DEFAULT 'menu-link',
  whatsapp_number TEXT,
  hotline TEXT,
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

-- 2. Users / Admin Accounts
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  restaurant_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- 3. Custom Domains
CREATE TABLE IF NOT EXISTS custom_domains (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT NOT NULL,
  domain TEXT UNIQUE NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- 4. Restaurant Branding & Theme Config
CREATE TABLE IF NOT EXISTS restaurant_branding (
  restaurant_id TEXT PRIMARY KEY,
  template TEXT NOT NULL DEFAULT 'modern',
  primary_color TEXT NOT NULL DEFAULT '#f97316',
  accent_color TEXT NOT NULL DEFAULT '#ef4444',
  bg_color TEXT NOT NULL DEFAULT '#0d0d11',
  text_color TEXT NOT NULL DEFAULT '#f0f0f4',
  bg_mode TEXT NOT NULL DEFAULT 'dark',
  logo_url TEXT,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- 5. Menu Categories
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- 6. Menu Items / Dishes
CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  image_url TEXT,
  available INTEGER NOT NULL DEFAULT 1,
  is_offer INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- 7. Item Sizes & Variants
CREATE TABLE IF NOT EXISTS item_options (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  name TEXT NOT NULL,
  price_delta REAL NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (item_id) REFERENCES menu_items(id) ON DELETE CASCADE
);

-- 8. Add-ons & Extras
CREATE TABLE IF NOT EXISTS item_addons (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  name TEXT NOT NULL,
  price REAL NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (item_id) REFERENCES menu_items(id) ON DELETE CASCADE
);

-- 9. Uploaded Files (Images & PDFs)
CREATE TABLE IF NOT EXISTS menu_files (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  uploaded_at TEXT NOT NULL,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- 10. Multi-Branch Management
CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  latitude REAL DEFAULT 30.0444,
  longitude REAL DEFAULT 31.2357,
  delivery_mode TEXT NOT NULL DEFAULT 'radius', -- 'radius' (Option 1) | 'zone' (Option 2)
  max_delivery_radius_km REAL NOT NULL DEFAULT 20,
  base_delivery_fee REAL NOT NULL DEFAULT 20,
  base_delivery_distance_km REAL NOT NULL DEFAULT 5,
  extra_fee_per_km REAL NOT NULL DEFAULT 3,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- 11. Delivery Zones (Option 2: Area/Neighborhood-based Delivery Fees)
CREATE TABLE IF NOT EXISTS delivery_zones (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL,
  zone_name TEXT NOT NULL,
  fee REAL NOT NULL DEFAULT 25,
  estimated_time_min INTEGER DEFAULT 45,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

-- 12. Delivery Distance Tiers (Option 1 Alternative: Brackets e.g. 0-5km=$20, 5-10km=$35)
CREATE TABLE IF NOT EXISTS delivery_distance_tiers (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL,
  min_km REAL NOT NULL,
  max_km REAL NOT NULL,
  fee REAL NOT NULL,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

-- 13. Customers Table (End-User Accounts per Restaurant)
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  default_address TEXT,
  default_lat REAL,
  default_lng REAL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  UNIQUE(restaurant_id, phone),
  UNIQUE(restaurant_id, email)
);

-- 14. Customer Orders
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT NOT NULL,
  customer_id TEXT,
  branch_id TEXT,
  branch_name TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  address TEXT,
  order_type TEXT NOT NULL, -- 'delivery' | 'pickup'
  items_json TEXT NOT NULL,
  delivery_fee REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL,
  delivery_zone_name TEXT,
  customer_lat REAL,
  customer_lng REAL,
  google_maps_url TEXT,
  distance_km REAL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'preparing' | 'completed' | 'cancelled'
  created_at TEXT NOT NULL,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON restaurants(slug);
CREATE INDEX IF NOT EXISTS idx_categories_rest ON categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_items_rest ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_customers_rest ON customers(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(restaurant_id, phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(restaurant_id, email);
CREATE INDEX IF NOT EXISTS idx_orders_rest ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_branch ON orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_branches_rest ON branches(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_zones_branch ON delivery_zones(branch_id);
CREATE INDEX IF NOT EXISTS idx_tiers_branch ON delivery_distance_tiers(branch_id);
CREATE INDEX IF NOT EXISTS idx_custom_domains ON custom_domains(domain);

