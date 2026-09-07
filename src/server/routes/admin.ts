import { Hono } from 'hono';
import { generateId, verifyToken } from '../services/crypto';

export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  JWT_SECRET: string;
}

const admin = new Hono<{ Bindings: Env; Variables: { restaurantId: string; userId: string } }>();

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

function requireJwtSecret(env: Env): string {
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is missing. Set it via wrangler secret put JWT_SECRET');
  }
  return env.JWT_SECRET;
}

// Middleware to verify Admin Bearer Token
admin.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized. Bearer token required.' }, 401);
  }

  const token = authHeader.substring(7);
  let secret: string;
  try {
    secret = requireJwtSecret(c.env);
  } catch (e) {
    return c.json({ error: (e as Error).message }, 500);
  }

  const payload = await verifyToken<{ restaurantId: string; userId: string }>(token, secret);
  if (!payload || !payload.restaurantId) {
    return c.json({ error: 'Invalid or expired session token.' }, 401);
  }

  c.set('restaurantId', payload.restaurantId);
  c.set('userId', payload.userId);
  await next();
});

// GET RESTAURANT DETAILS
admin.get('/restaurant', async (c) => {
  const restId = c.get('restaurantId');
  const rest = await c.env.DB.prepare('SELECT * FROM restaurants WHERE id = ?').bind(restId).first<{
    id: string;
    name: string;
    slug: string;
    plan: string;
    paid_plan: string;
    whatsapp_number?: string;
    hotline?: string;
    published: number;
    created_at: string;
  }>();
  if (!rest) return c.json({ error: 'Restaurant not found' }, 404);

  const branding = await c.env.DB.prepare('SELECT * FROM restaurant_branding WHERE restaurant_id = ?').bind(restId).first<{
    template: string;
    primary_color: string;
    accent_color: string;
    bg_color: string;
    text_color: string;
    bg_mode: string;
    logo_url?: string;
  }>();

  const categories = (await c.env.DB.prepare('SELECT * FROM categories WHERE restaurant_id = ? ORDER BY sort_order ASC').bind(restId).all<{
    id: string;
    name: string;
  }>()).results;

  const items = (await c.env.DB.prepare('SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY sort_order ASC').bind(restId).all<{
    id: string;
    category_id: string;
    name: string;
    description: string;
    price: number;
    image_url?: string;
    available: number;
    is_offer: number;
  }>()).results;

  const files = (await c.env.DB.prepare('SELECT * FROM menu_files WHERE restaurant_id = ? ORDER BY uploaded_at DESC').bind(restId).all<{
    id: string;
    file_type: string;
    file_name: string;
    file_url: string;
    uploaded_at: string;
  }>()).results;

  const orders = (await c.env.DB.prepare('SELECT * FROM orders WHERE restaurant_id = ? ORDER BY created_at DESC').bind(restId).all<{
    id: string;
    customer_name: string;
    customer_phone: string;
    address?: string;
    order_type: string;
    items_json: string;
    total: number;
    status: string;
    created_at: string;
  }>()).results;

  // Enrich items with options & addons
  const enrichedItems = await Promise.all(
    items.map(async (item) => {
      const options = (await c.env.DB.prepare('SELECT id, name, price_delta FROM item_options WHERE item_id = ?').bind(item.id).all<{
        id: string;
        name: string;
        price_delta: number;
      }>()).results;

      const addons = (await c.env.DB.prepare('SELECT id, name, price FROM item_addons WHERE item_id = ?').bind(item.id).all<{
        id: string;
        name: string;
        price: number;
      }>()).results;

      return {
        id: item.id,
        categoryId: item.category_id,
        name: item.name,
        description: item.description || '',
        price: item.price,
        image: item.image_url || '',
        available: Boolean(item.available),
        isOffer: Boolean(item.is_offer),
        options: options.map((o) => ({ id: o.id, name: o.name, priceDelta: o.price_delta })),
        addons: addons.map((a) => ({ id: a.id, name: a.name, price: a.price })),
      };
    })
  );

  return c.json({
    restaurant: {
      id: rest.id,
      name: rest.name,
      slug: rest.slug,
      plan: rest.plan,
      paidPlan: rest.paid_plan,
      whatsappNumber: rest.whatsapp_number,
      hotline: rest.hotline,
      published: Boolean(rest.published),
      createdAt: rest.created_at,
      branding: branding ? {
        template: branding.template,
        primaryColor: branding.primary_color,
        accentColor: branding.accent_color,
        bgColor: branding.bg_color,
        textColor: branding.text_color,
        bgMode: branding.bg_mode,
        logoUrl: branding.logo_url,
      } : {},
      categories: categories.map((cat) => ({ id: cat.id, name: cat.name })),
      items: enrichedItems,
      menuFiles: files.map((f) => ({
        id: f.id,
        type: f.file_type,
        name: f.file_name,
        dataUrl: f.file_url,
        uploadedAt: f.uploaded_at,
      })),
      orders: orders.map((o) => ({
        id: o.id,
        customerName: o.customer_name,
        customerPhone: o.customer_phone,
        address: o.address,
        orderType: o.order_type,
        items: JSON.parse(o.items_json || '[]'),
        total: o.total,
        status: o.status,
        createdAt: o.created_at,
      })),
    },
  });
});

// UPDATE PLAN
admin.post('/plan', async (c) => {
  const restId = c.get('restaurantId');
  const { plan, isUpgrade } = await c.req.json<{ plan: string; isUpgrade?: boolean }>();
  if (!plan) return c.json({ error: 'Plan is required' }, 400);

  if (isUpgrade) {
    await c.env.DB.prepare('UPDATE restaurants SET plan = ?, paid_plan = ? WHERE id = ?').bind(plan, plan, restId).run();
  } else {
    await c.env.DB.prepare('UPDATE restaurants SET plan = ? WHERE id = ?').bind(plan, restId).run();
  }
  return c.json({ success: true });
});

// UPDATE CONTACT INFO
admin.post('/contact', async (c) => {
  const restId = c.get('restaurantId');
  const { whatsappNumber, hotline } = await c.req.json<{ whatsappNumber?: string; hotline?: string }>();
  await c.env.DB.prepare('UPDATE restaurants SET whatsapp_number = ?, hotline = ? WHERE id = ?')
    .bind(whatsappNumber || '', hotline || '', restId).run();
  return c.json({ success: true });
});

// CATEGORIES
admin.post('/categories', async (c) => {
  const restId = c.get('restaurantId');
  const { name } = await c.req.json<{ name: string }>();
  if (!name || !name.trim()) return c.json({ error: 'Category name is required' }, 400);

  const id = generateId('cat');
  await c.env.DB.prepare('INSERT INTO categories (id, restaurant_id, name) VALUES (?, ?, ?)')
    .bind(id, restId, name.trim()).run();
  return c.json({ id, name: name.trim() });
});

admin.delete('/categories/:id', async (c) => {
  const restId = c.get('restaurantId');
  const catId = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM categories WHERE id = ? AND restaurant_id = ?')
    .bind(catId, restId).run();
  return c.json({ success: true });
});

// MENU ITEMS
admin.post('/items', async (c) => {
  const restId = c.get('restaurantId');
  const body = await c.req.json<{
    id?: string;
    categoryId: string;
    name: string;
    description?: string;
    price: number;
    image?: string;
    available?: boolean;
    isOffer?: boolean;
    options?: Array<{ id?: string; name: string; priceDelta: number }>;
    addons?: Array<{ id?: string; name: string; price: number }>;
  }>();

  if (!body.name || !body.categoryId || typeof body.price !== 'number') {
    return c.json({ error: 'Name, categoryId, and valid price are required' }, 400);
  }

  const itemId = body.id || generateId('item');

  const existing = await c.env.DB.prepare('SELECT id FROM menu_items WHERE id = ? AND restaurant_id = ?').bind(itemId, restId).first();

  if (existing) {
    await c.env.DB.prepare(
      'UPDATE menu_items SET category_id = ?, name = ?, description = ?, price = ?, image_url = ?, available = ?, is_offer = ? WHERE id = ? AND restaurant_id = ?'
    ).bind(body.categoryId, body.name.trim(), body.description || '', body.price, body.image || '', body.available !== false ? 1 : 0, body.isOffer ? 1 : 0, itemId, restId).run();
  } else {
    await c.env.DB.prepare(
      'INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, image_url, available, is_offer) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(itemId, restId, body.categoryId, body.name.trim(), body.description || '', body.price, body.image || '', body.available !== false ? 1 : 0, body.isOffer ? 1 : 0).run();
  }

  // Clear existing options & addons for this item
  await c.env.DB.prepare('DELETE FROM item_options WHERE item_id = ?').bind(itemId).run();
  await c.env.DB.prepare('DELETE FROM item_addons WHERE item_id = ?').bind(itemId).run();

  if (body.options && Array.isArray(body.options)) {
    for (const opt of body.options) {
      if (opt.name && opt.name.trim()) {
        const optId = opt.id || generateId('opt');
        await c.env.DB.prepare('INSERT INTO item_options (id, item_id, name, price_delta) VALUES (?, ?, ?, ?)')
          .bind(optId, itemId, opt.name.trim(), Number(opt.priceDelta) || 0).run();
      }
    }
  }

  if (body.addons && Array.isArray(body.addons)) {
    for (const add of body.addons) {
      if (add.name && add.name.trim()) {
        const addId = add.id || generateId('add');
        await c.env.DB.prepare('INSERT INTO item_addons (id, item_id, name, price) VALUES (?, ?, ?, ?)')
          .bind(addId, itemId, add.name.trim(), Number(add.price) || 0).run();
      }
    }
  }

  return c.json({ success: true, itemId });
});

admin.delete('/items/:id', async (c) => {
  const restId = c.get('restaurantId');
  const itemId = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM menu_items WHERE id = ? AND restaurant_id = ?')
    .bind(itemId, restId).run();
  return c.json({ success: true });
});

// BRANDING
admin.post('/branding', async (c) => {
  const restId = c.get('restaurantId');
  const b = await c.req.json<{
    template?: string;
    primaryColor?: string;
    accentColor?: string;
    bgColor?: string;
    textColor?: string;
    bgMode?: string;
    logoUrl?: string;
  }>();

  await c.env.DB.prepare(
    `INSERT INTO restaurant_branding (restaurant_id, template, primary_color, accent_color, bg_color, text_color, bg_mode, logo_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(restaurant_id) DO UPDATE SET
     template = excluded.template,
     primary_color = excluded.primary_color,
     accent_color = excluded.accent_color,
     bg_color = excluded.bg_color,
     text_color = excluded.text_color,
     bg_mode = excluded.bg_mode,
     logo_url = excluded.logo_url`
  ).bind(
    restId,
    b.template || 'modern',
    b.primaryColor || '#f97316',
    b.accentColor || '#ef4444',
    b.bgColor || '#0d0d11',
    b.textColor || '#f0f0f4',
    b.bgMode || 'dark',
    b.logoUrl || ''
  ).run();

  return c.json({ success: true });
});

// R2 UPLOAD WITH STRICT VALIDATION
admin.post('/upload', async (c) => {
  const restId = c.get('restaurantId');
  const formData = await c.req.parseBody();
  const file = formData['file'] as File;

  if (!file || typeof file.size !== 'number') {
    return c.json({ error: 'No file uploaded or invalid file payload' }, 400);
  }

  // 1. Strict MIME type validation
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return c.json({
      error: `Invalid file type "${file.type}". Only JPEG, PNG, WEBP, and PDF files are allowed.`,
    }, 400);
  }

  // 2. Server-side size validation (25MB)
  if (file.size > MAX_FILE_SIZE) {
    return c.json({
      error: `File size exceeds 25MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB).`,
    }, 413);
  }

  const fileType = file.type === 'application/pdf' ? 'pdf' : 'image';
  const fileId = generateId('f');
  const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 100);

  // Scoped namespace strictly within the authenticated restaurant
  const r2Key = `uploads/${restId}/${fileId}-${sanitizedFilename}`;

  // Store in R2 bucket
  await c.env.BUCKET.put(r2Key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  const fileUrl = `/api/public/files/${encodeURIComponent(r2Key)}`;
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    'INSERT INTO menu_files (id, restaurant_id, file_type, file_name, file_url, r2_key, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(fileId, restId, fileType, file.name, fileUrl, r2Key, now).run();

  return c.json({ id: fileId, type: fileType, name: file.name, dataUrl: fileUrl, uploadedAt: now });
});

// DELETE FILE
admin.delete('/files/:id', async (c) => {
  const restId = c.get('restaurantId');
  const fileId = c.req.param('id');
  const file = await c.env.DB.prepare('SELECT r2_key FROM menu_files WHERE id = ? AND restaurant_id = ?')
    .bind(fileId, restId).first<{ r2_key: string }>();

  if (file && file.r2_key) {
    await c.env.BUCKET.delete(file.r2_key);
  }

  await c.env.DB.prepare('DELETE FROM menu_files WHERE id = ? AND restaurant_id = ?').bind(fileId, restId).run();
  return c.json({ success: true });
});

// ORDERS STATUS
admin.post('/orders/status', async (c) => {
  const restId = c.get('restaurantId');
  const { orderId, status } = await c.req.json<{ orderId: string; status: string }>();
  if (!orderId || !status) return c.json({ error: 'orderId and status are required' }, 400);

  const allowedStatuses = new Set(['pending', 'preparing', 'completed', 'cancelled']);
  if (!allowedStatuses.has(status)) {
    return c.json({ error: 'Invalid order status' }, 400);
  }

  await c.env.DB.prepare('UPDATE orders SET status = ? WHERE id = ? AND restaurant_id = ?')
    .bind(status, orderId, restId).run();
  return c.json({ success: true });
});

export { admin };
