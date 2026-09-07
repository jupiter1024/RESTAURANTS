import { Hono } from 'hono';
import { generateId, slugify, hashPassword, verifyPassword, signToken, verifyToken } from '../services/crypto';

export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  JWT_SECRET: string;
}

const auth = new Hono<{ Bindings: Env }>();

// Helper to strictly require JWT_SECRET
function requireJwtSecret(env: Env): string {
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is missing. Set it via wrangler secret put JWT_SECRET');
  }
  return env.JWT_SECRET;
}

// Seed sample categories and dishes when new restaurant is created
const SAMPLE_CATEGORIES = [
  { id: 'cat_offers', name: '🔥 Special Offers & Combos', sort_order: 1 },
  { id: 'cat_burgers', name: '🍔 Gourmet Burgers', sort_order: 2 },
  { id: 'cat_chicken', name: '🍗 Fried Chicken', sort_order: 3 },
  { id: 'cat_drinks', name: '🥤 Drinks & Desserts', sort_order: 4 },
];

const SAMPLE_ITEMS = [
  {
    id: 'item_off1',
    categoryId: 'cat_offers',
    name: 'Twin Smash Burger Deal',
    description: '2 Single Cheese Burgers + 2 Fries + 2 Drinks.',
    price: 18.99,
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80',
    isOffer: 1,
    options: [],
    addons: [
      { id: 'add_cheese', name: 'Extra Cheddar Cheese', price: 1.50 },
      { id: 'add_bacon', name: 'Extra Crispy Bacon', price: 2.00 }
    ]
  },
  {
    id: 'item_b1',
    categoryId: 'cat_burgers',
    name: 'Smokey BBQ Bacon Burger',
    description: 'Flame-grilled Angus beef patty, smoked bacon, melted cheddar & BBQ sauce.',
    price: 11.50,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    isOffer: 0,
    options: [
      { id: 'opt_s1', name: 'Single Patty (150g)', priceDelta: 0 },
      { id: 'opt_s2', name: 'Double Patty (300g)', priceDelta: 4.50 },
      { id: 'opt_s3', name: 'Triple Monster (450g)', priceDelta: 8.00 }
    ],
    addons: [
      { id: 'add_cheesy', name: 'Extra Melted Cheddar', price: 1.50 },
      { id: 'add_jalapeno', name: 'Spicy Jalapeños', price: 1.00 }
    ]
  },
  {
    id: 'item_c1',
    categoryId: 'cat_chicken',
    name: 'Crispy Golden Chicken Box',
    description: 'Hand-breaded crunchy fried chicken with signature spices.',
    price: 8.99,
    image: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80',
    isOffer: 0,
    options: [
      { id: 'opt_c3', name: '3 Pieces Box', priceDelta: 0 },
      { id: 'opt_c6', name: '6 Pieces Box', priceDelta: 6.00 },
      { id: 'opt_c12', name: '12 Pieces Family Bucket', priceDelta: 16.00 }
    ],
    addons: [
      { id: 'add_garlic', name: 'Extra Garlic Dip', price: 1.25 }
    ]
  }
];

// REGISTER
auth.post('/register', async (c) => {
  try {
    const { email, password, restaurantName, plan = 'menu-link' } = await c.req.json();
    if (!email || !password || !restaurantName) {
      return c.json({ error: 'Email, password, and restaurant name are required.' }, 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check existing email
    const existingUser = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(normalizedEmail).first();
    if (existingUser) {
      return c.json({ error: 'Email already registered.' }, 400);
    }

    const restId = generateId('r');
    const userId = generateId('u');
    const baseSlug = slugify(restaurantName);
    let slug = baseSlug;

    // Check slug uniqueness
    const existingRest = await c.env.DB.prepare('SELECT id FROM restaurants WHERE slug = ?').bind(slug).first();
    if (existingRest) {
      slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const now = new Date().toISOString();
    const { hash, salt } = await hashPassword(password);

    // Batch insert into D1
    await c.env.DB.batch([
      c.env.DB.prepare(
        'INSERT INTO restaurants (id, name, slug, plan, paid_plan, published, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)'
      ).bind(restId, restaurantName, slug, plan, plan, now),

      c.env.DB.prepare(
        'INSERT INTO users (id, email, password_hash, password_salt, restaurant_id, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(userId, normalizedEmail, hash, salt, restId, now),

      c.env.DB.prepare(
        'INSERT INTO restaurant_branding (restaurant_id, template, primary_color, accent_color, bg_color, text_color, bg_mode) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(restId, 'modern', '#f97316', '#ef4444', '#0d0d11', '#f0f0f4', 'dark')
    ]);

    // Insert Seed Data if plan === 'website' with unique generated IDs
    if (plan === 'website') {
      const catIdMap = new Map<string, string>();

      for (const cat of SAMPLE_CATEGORIES) {
        const catId = generateId('cat');
        catIdMap.set(cat.id, catId);
        await c.env.DB.prepare('INSERT INTO categories (id, restaurant_id, name, sort_order) VALUES (?, ?, ?, ?)')
          .bind(catId, restId, cat.name, cat.sort_order)
          .run();
      }

      for (const item of SAMPLE_ITEMS) {
        const itemId = generateId('item');
        const resolvedCatId = catIdMap.get(item.categoryId) || generateId('cat');

        await c.env.DB.prepare(
          'INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, image_url, available, is_offer) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)'
        ).bind(itemId, restId, resolvedCatId, item.name, item.description, item.price, item.image, item.isOffer).run();

        for (const opt of item.options) {
          const optId = generateId('opt');
          await c.env.DB.prepare('INSERT INTO item_options (id, item_id, name, price_delta) VALUES (?, ?, ?, ?)')
            .bind(optId, itemId, opt.name, opt.priceDelta).run();
        }
        for (const addon of item.addons) {
          const addId = generateId('add');
          await c.env.DB.prepare('INSERT INTO item_addons (id, item_id, name, price) VALUES (?, ?, ?, ?)')
            .bind(addId, itemId, addon.name, addon.price).run();
        }
      }
    }

    const secret = requireJwtSecret(c.env);
    const token = await signToken({ userId, email: normalizedEmail, restaurantId: restId }, secret);

    return c.json({
      token,
      user: { id: userId, email: normalizedEmail, restaurantId: restId, slug }
    });
  } catch (err: unknown) {
    return c.json({ error: (err as Error).message || 'Registration failed' }, 500);
  }
});

// LOGIN
auth.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) {
      return c.json({ error: 'Email and password are required.' }, 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await c.env.DB.prepare(
      'SELECT id, email, password_hash, password_salt, restaurant_id FROM users WHERE email = ?'
    ).bind(normalizedEmail).first<{
      id: string;
      email: string;
      password_hash: string;
      password_salt: string;
      restaurant_id: string;
    }>();

    if (!user) {
      return c.json({ error: 'Invalid email or password.' }, 401);
    }

    const isValid = await verifyPassword(password, user.password_hash, user.password_salt);
    if (!isValid) {
      return c.json({ error: 'Invalid email or password.' }, 401);
    }

    const rest = await c.env.DB.prepare('SELECT slug FROM restaurants WHERE id = ?').bind(user.restaurant_id).first<{ slug: string }>();

    const secret = requireJwtSecret(c.env);
    const token = await signToken({ userId: user.id, email: user.email, restaurantId: user.restaurant_id }, secret);

    return c.json({
      token,
      user: { id: user.id, email: user.email, restaurantId: user.restaurant_id, slug: rest?.slug }
    });
  } catch (err: unknown) {
    return c.json({ error: (err as Error).message || 'Login failed' }, 500);
  }
});

// ME (Session Check)
auth.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.substring(7);
  let secret: string;
  try {
    secret = requireJwtSecret(c.env);
  } catch (e) {
    return c.json({ error: (e as Error).message }, 500);
  }

  const payload = await verifyToken<{ userId: string; email: string; restaurantId: string }>(token, secret);
  if (!payload) {
    return c.json({ error: 'Invalid or expired session token.' }, 401);
  }

  const rest = await c.env.DB.prepare('SELECT id, name, slug, plan, paid_plan FROM restaurants WHERE id = ?').bind(payload.restaurantId).first();

  return c.json({
    user: { id: payload.userId, email: payload.email, restaurantId: payload.restaurantId, slug: (rest as { slug?: string })?.slug },
    restaurant: rest
  });
});

export { auth };
