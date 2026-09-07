import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
  JWT_SECRET: string;
};

export const pub = new Hono<{ Bindings: Bindings }>();

// ──────────────────────────────────────────────────────────────
// Helper: resolve restaurant by slug or host header
// ──────────────────────────────────────────────────────────────
async function resolveRestaurant(db: D1Database, slugOrHost: string) {
  // Strip .bistroflow.com suffix if present
  const slug = slugOrHost.replace(/\.bistroflow\.com$/i, '').replace(/\..*$/, '').trim().toLowerCase();
  const row = await db
    .prepare('SELECT * FROM restaurants WHERE slug = ? AND published = 1')
    .bind(slug)
    .first<{
      id: string;
      name: string;
      slug: string;
      whatsapp_number?: string;
      hotline?: string;
      plan: string;
      paid_plan: string;
      published: number;
    }>();
  return row;
}

// ──────────────────────────────────────────────────────────────
// GET /api/public/site?slug=bazzoka   OR   ?host=bazzoka.bistroflow.com
// Returns full public restaurant data (branding + categories + items + files)
// ──────────────────────────────────────────────────────────────
pub.get('/site', async (c) => {
  const slug = c.req.query('slug');
  const host = c.req.query('host');
  const key = slug || host;
  if (!key) return c.json({ error: 'slug or host required' }, 400);

  const restaurant = await resolveRestaurant(c.env.DB, key);
  if (!restaurant) return c.json({ error: 'Restaurant not found or not published' }, 404);

  const restId = restaurant.id;

  // Branding
  const branding = await c.env.DB
    .prepare('SELECT * FROM restaurant_branding WHERE restaurant_id = ?')
    .bind(restId)
    .first<Record<string, unknown>>();

  // Categories
  const categoriesResult = await c.env.DB
    .prepare('SELECT * FROM categories WHERE restaurant_id = ? ORDER BY sort_order ASC')
    .bind(restId)
    .all<{ id: string; name: string }>();

  // Items with options and addons
  const itemsResult = await c.env.DB
    .prepare('SELECT * FROM menu_items WHERE restaurant_id = ? AND available = 1 ORDER BY sort_order ASC')
    .bind(restId)
    .all<{
      id: string;
      category_id: string;
      name: string;
      description: string;
      price: number;
      image_url?: string;
      available: number;
      is_offer: number;
    }>();

  const itemsWithExtras = await Promise.all(
    itemsResult.results.map(async (item) => {
      const optionsResult = await c.env.DB
        .prepare('SELECT id, name, price_delta FROM item_options WHERE item_id = ? ORDER BY sort_order ASC')
        .bind(item.id)
        .all<{ id: string; name: string; price_delta: number }>();

      const addonsResult = await c.env.DB
        .prepare('SELECT id, name, price FROM item_addons WHERE item_id = ? ORDER BY sort_order ASC')
        .bind(item.id)
        .all<{ id: string; name: string; price: number }>();

      return {
        ...item,
        options: optionsResult.results || [],
        addons: addonsResult.results || [],
      };
    })
  );

  // Menu files (PDFs / images)
  const filesResult = await c.env.DB
    .prepare('SELECT * FROM menu_files WHERE restaurant_id = ? ORDER BY uploaded_at ASC')
    .bind(restId)
    .all<{
      id: string;
      file_type: string;
      file_name: string;
      file_url: string;
      r2_key: string;
      uploaded_at: string;
    }>();

  return c.json({
    restaurant: {
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      whatsapp_number: restaurant.whatsapp_number,
      hotline: restaurant.hotline,
      plan: restaurant.paid_plan || 'menu-link',
      paidPlan: restaurant.paid_plan || 'menu-link',
    },
    branding: branding || {},
    categories: categoriesResult.results || [],
    items: itemsWithExtras,
    menuFiles: filesResult.results.map((f) => ({
      id: f.id,
      type: f.file_type,
      fileType: f.file_type,
      name: f.file_name,
      fileName: f.file_name,
      fileUrl: `/api/public/files/${encodeURIComponent(f.r2_key)}`,
      dataUrl: `/api/public/files/${encodeURIComponent(f.r2_key)}`,
      uploadedAt: f.uploaded_at,
    })),
  });
});

// ──────────────────────────────────────────────────────────────
// POST /api/public/orders
// Create a new order with SERVER-SIDE PRICE RECALCULATION & VALIDATION
// ──────────────────────────────────────────────────────────────
interface IncomingOrderItem {
  itemId: string;
  name?: string;
  selectedOption?: string; // option name or id
  selectedAddons?: string[]; // addon names or ids
  quantity: number;
}

pub.post('/orders', async (c) => {
  const body = await c.req.json<{
    restaurantId: string;
    customerName: string;
    customerPhone: string;
    address?: string;
    orderType: 'delivery' | 'pickup';
    items: IncomingOrderItem[];
  }>();

  const { restaurantId, customerName, customerPhone, address, orderType, items } = body;

  // 1. Basic input validation
  if (!restaurantId || typeof restaurantId !== 'string') {
    return c.json({ error: 'Valid restaurantId is required' }, 400);
  }
  if (!customerName || typeof customerName !== 'string' || customerName.trim().length === 0 || customerName.length > 100) {
    return c.json({ error: 'Customer name is required (max 100 characters)' }, 400);
  }
  if (!customerPhone || typeof customerPhone !== 'string' || customerPhone.trim().length === 0 || customerPhone.length > 30) {
    return c.json({ error: 'Customer phone is required (max 30 characters)' }, 400);
  }
  if (orderType !== 'delivery' && orderType !== 'pickup') {
    return c.json({ error: 'Order type must be "delivery" or "pickup"' }, 400);
  }
  if (address && typeof address === 'string' && address.length > 300) {
    return c.json({ error: 'Address exceeds 300 character limit' }, 400);
  }
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    return c.json({ error: 'Order must contain between 1 and 50 items' }, 400);
  }

  // 2. Verify restaurant exists, is published, and has paid for Offer 3 website plan
  const restaurant = await c.env.DB
    .prepare('SELECT id, name, published, paid_plan FROM restaurants WHERE id = ?')
    .bind(restaurantId)
    .first<{ id: string; name: string; published: number; paid_plan: string }>();

  if (!restaurant || !restaurant.published) {
    return c.json({ error: 'Restaurant is not available or not accepting orders' }, 404);
  }

  if (restaurant.paid_plan !== 'website') {
    return c.json({ error: 'Online ordering is only available on Offer 3 (Interactive Website plan)' }, 403);
  }

  // 3. SERVER-SIDE PRICE RECALCULATION
  // Never trust total or item prices supplied by the client
  let verifiedGrandTotal = 0;
  const verifiedItems: Array<{
    itemId: string;
    name: string;
    selectedOption?: string;
    selectedAddons?: string[];
    unitPrice: number;
    quantity: number;
    totalPrice: number;
  }> = [];

  for (const rawItem of items) {
    const qty = Math.max(1, Math.min(100, Math.floor(Number(rawItem.quantity) || 1)));

    // Fetch genuine item from D1
    const dbItem = await c.env.DB
      .prepare('SELECT id, name, price, available FROM menu_items WHERE id = ? AND restaurant_id = ?')
      .bind(rawItem.itemId, restaurantId)
      .first<{ id: string; name: string; price: number; available: number }>();

    if (!dbItem || !dbItem.available) {
      return c.json({ error: `Item "${rawItem.name || rawItem.itemId}" is no longer available` }, 400);
    }

    let itemUnitPrice = dbItem.price;

    // Verify Option / Size Variant price delta
    let verifiedOptionName: string | undefined;
    if (rawItem.selectedOption) {
      const opt = await c.env.DB
        .prepare('SELECT name, price_delta FROM item_options WHERE item_id = ? AND (id = ? OR name = ?)')
        .bind(dbItem.id, rawItem.selectedOption, rawItem.selectedOption)
        .first<{ name: string; price_delta: number }>();

      if (opt) {
        itemUnitPrice += Number(opt.price_delta) || 0;
        verifiedOptionName = opt.name;
      }
    }

    // Verify Add-on prices
    const verifiedAddonNames: string[] = [];
    if (Array.isArray(rawItem.selectedAddons) && rawItem.selectedAddons.length > 0) {
      for (const addonIdentifier of rawItem.selectedAddons) {
        const add = await c.env.DB
          .prepare('SELECT name, price FROM item_addons WHERE item_id = ? AND (id = ? OR name = ?)')
          .bind(dbItem.id, addonIdentifier, addonIdentifier)
          .first<{ name: string; price: number }>();

        if (add) {
          itemUnitPrice += Number(add.price) || 0;
          verifiedAddonNames.push(add.name);
        }
      }
    }

    const itemTotalPrice = Math.round(itemUnitPrice * qty * 100) / 100;
    verifiedGrandTotal += itemTotalPrice;

    verifiedItems.push({
      itemId: dbItem.id,
      name: dbItem.name,
      selectedOption: verifiedOptionName,
      selectedAddons: verifiedAddonNames,
      unitPrice: Math.round(itemUnitPrice * 100) / 100,
      quantity: qty,
      totalPrice: itemTotalPrice,
    });
  }

  verifiedGrandTotal = Math.round(verifiedGrandTotal * 100) / 100;
  const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString(36).toUpperCase()}`;

  await c.env.DB
    .prepare(`
      INSERT INTO orders (id, restaurant_id, customer_name, customer_phone, address, order_type, items_json, total, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))
    `)
    .bind(
      orderId,
      restaurantId,
      customerName.trim(),
      customerPhone.trim(),
      address?.trim() || null,
      orderType,
      JSON.stringify(verifiedItems),
      verifiedGrandTotal
    )
    .run();

  return c.json({
    orderId,
    status: 'pending',
    total: verifiedGrandTotal,
    items: verifiedItems,
  }, 201);
});

// ──────────────────────────────────────────────────────────────
// GET /api/public/files/:key
// Proxy R2 private objects securely to the browser
// ──────────────────────────────────────────────────────────────
pub.get('/files/:key{.+}', async (c) => {
  const key = c.req.param('key');
  if (!key || key.includes('..')) return c.text('Not found', 404);

  const decodedKey = decodeURIComponent(key);
  const object = await c.env.BUCKET.get(decodedKey);
  if (!object) return c.text('File not found', 404);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'public, max-age=3600');

  return new Response(object.body, { headers });
});

// ──────────────────────────────────────────────────────────────
// GET /sitemap.xml
// List all published restaurant subdomains
// ──────────────────────────────────────────────────────────────
pub.get('/sitemap', async (c) => {
  const result = await c.env.DB
    .prepare("SELECT slug, created_at FROM restaurants WHERE published = 1 ORDER BY created_at DESC LIMIT 500")
    .all<{ slug: string; created_at: string }>();

  const urls = (result.results || [])
    .map((r) => {
      const lastmod = r.created_at ? r.created_at.split('T')[0] : new Date().toISOString().split('T')[0];
      return `  <url>\n    <loc>https://${r.slug}.bistroflow.com</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;

  return c.text(xml, 200, { 'Content-Type': 'application/xml' });
});

// ──────────────────────────────────────────────────────────────
// GET /robots.txt
// ──────────────────────────────────────────────────────────────
pub.get('/robots', async (c) => {
  return c.text('User-agent: *\nAllow: /\nSitemap: https://bistroflow.com/sitemap.xml\n');
});
