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

-- 10. Customer Orders
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  address TEXT,
  order_type TEXT NOT NULL,
  items_json TEXT NOT NULL,
  total REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON restaurants(slug);
CREATE INDEX IF NOT EXISTS idx_categories_rest ON categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_items_rest ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_rest ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_custom_domains ON custom_domains(domain);
