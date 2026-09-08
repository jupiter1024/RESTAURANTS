import { Hono } from 'hono';
import { evaluateBranchDelivery, calculateHaversineDistanceKm } from '../services/geo';
import { generateId, hashPassword, verifyPassword, signToken, verifyToken } from '../services/crypto';

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
// GET /api/public/site?slug=bazzoka
// Returns public restaurant data + active branches + zones + items
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

  // Active Branches with their delivery zones and distance tiers
  const rawBranches = (await c.env.DB
    .prepare('SELECT * FROM branches WHERE restaurant_id = ? AND is_active = 1 ORDER BY created_at ASC')
    .bind(restId)
    .all<{
      id: string;
      restaurant_id: string;
      name: string;
      address?: string;
      phone?: string;
      latitude: number;
      longitude: number;
      delivery_mode: string;
      max_delivery_radius_km: number;
      base_delivery_fee: number;
      base_delivery_distance_km: number;
      extra_fee_per_km: number;
      is_active: number;
    }>()).results;

  const branches = await Promise.all(
    rawBranches.map(async (b) => {
      const zones = (await c.env.DB.prepare('SELECT * FROM delivery_zones WHERE branch_id = ? ORDER BY zone_name ASC').bind(b.id).all<{
        id: string;
        branch_id: string;
        zone_name: string;
        fee: number;
        estimated_time_min?: number;
      }>()).results;

      const tiers = (await c.env.DB.prepare('SELECT * FROM delivery_distance_tiers WHERE branch_id = ? ORDER BY min_km ASC').bind(b.id).all<{
        id: string;
        branch_id: string;
        min_km: number;
        max_km: number;
        fee: number;
      }>()).results;

      return {
        id: b.id,
        restaurantId: b.restaurant_id,
        name: b.name,
        address: b.address || '',
        phone: b.phone || '',
        latitude: Number(b.latitude) || 30.0444,
        longitude: Number(b.longitude) || 31.2357,
        deliveryMode: (b.delivery_mode as 'radius' | 'zone') || 'radius',
        maxDeliveryRadiusKm: Number(b.max_delivery_radius_km) || 20,
        baseDeliveryFee: Number(b.base_delivery_fee) || 20,
        baseDeliveryDistanceKm: Number(b.base_delivery_distance_km) || 5,
        extraFeePerKm: Number(b.extra_fee_per_km) || 3,
        isActive: Boolean(b.is_active),
        zones: zones.map((z) => ({
          id: z.id,
          branchId: z.branch_id,
          zoneName: z.zone_name,
          fee: z.fee,
          estimatedTimeMin: z.estimated_time_min,
        })),
        tiers: tiers.map((t) => ({
          id: t.id,
          branchId: t.branch_id,
          minKm: t.min_km,
          maxKm: t.max_km,
          fee: t.fee,
        })),
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
    branches,
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
// CUSTOMER AUTHENTICATION & PROFILE
// ──────────────────────────────────────────────────────────────

// POST /api/public/customer/register
pub.post('/customer/register', async (c) => {
  const body = await c.req.json<{
    restaurantId: string;
    name: string;
    phone: string;
    email?: string;
    password: string;
    defaultAddress?: string;
    defaultLat?: number;
    defaultLng?: number;
  }>();

  const { restaurantId, name, phone, email, password, defaultAddress, defaultLat, defaultLng } = body;

  if (!restaurantId) return c.json({ error: 'restaurantId is required' }, 400);
  if (!name || !name.trim()) return c.json({ error: 'Name is required' }, 400);
  if (!phone || !phone.trim()) return c.json({ error: 'Phone number is required' }, 400);
  if (!password || password.length < 6) return c.json({ error: 'Password must be at least 6 characters' }, 400);

  const cleanPhone = phone.trim().replace(/[^\d+]/g, '');
  const cleanEmail = email?.trim().toLowerCase() || null;

  // Check if customer with phone already exists for this restaurant
  const existing = await c.env.DB
    .prepare('SELECT id FROM customers WHERE restaurant_id = ? AND phone = ?')
    .bind(restaurantId, cleanPhone)
    .first();

  if (existing) {
    return c.json({ error: 'An account with this phone number already exists. Please log in.' }, 409);
  }

  const { hash, salt } = await hashPassword(password);
  const customerId = generateId('cust');
  const now = new Date().toISOString();

  await c.env.DB
    .prepare(`
      INSERT INTO customers (
        id, restaurant_id, name, phone, email, password_hash, password_salt,
        default_address, default_lat, default_lng, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      customerId,
      restaurantId,
      name.trim(),
      cleanPhone,
      cleanEmail,
      hash,
      salt,
      defaultAddress?.trim() || null,
      defaultLat || null,
      defaultLng || null,
      now
    )
    .run();

  const tokenSecret = c.env.JWT_SECRET || 'bistroflow_jwt_secret_customer';
  const token = await signToken(
    { customerId, restaurantId, role: 'customer', phone: cleanPhone },
    tokenSecret,
    30 * 24 * 60 * 60 // 30 days
  );

  return c.json({
    token,
    customer: {
      id: customerId,
      restaurantId,
      name: name.trim(),
      phone: cleanPhone,
      email: cleanEmail || undefined,
      defaultAddress: defaultAddress?.trim() || undefined,
      defaultLat: defaultLat || undefined,
      defaultLng: defaultLng || undefined,
      createdAt: now,
    },
  }, 201);
});

// POST /api/public/customer/login
pub.post('/customer/login', async (c) => {
  const body = await c.req.json<{
    restaurantId: string;
    identifier: string; // phone or email
    password: string;
  }>();

  const { restaurantId, identifier, password } = body;

  if (!restaurantId || !identifier || !password) {
    return c.json({ error: 'Restaurant, phone/email, and password are required' }, 400);
  }

  const cleanIdent = identifier.trim().toLowerCase();
  const cleanPhone = identifier.trim().replace(/[^\d+]/g, '');

  const customer = await c.env.DB
    .prepare('SELECT * FROM customers WHERE restaurant_id = ? AND (phone = ? OR email = ?)')
    .bind(restaurantId, cleanPhone, cleanIdent)
    .first<{
      id: string;
      restaurant_id: string;
      name: string;
      phone: string;
      email?: string;
      password_hash: string;
      password_salt: string;
      default_address?: string;
      default_lat?: number;
      default_lng?: number;
      created_at: string;
    }>();

  if (!customer) {
    return c.json({ error: 'Invalid phone/email or password' }, 401);
  }

  const isValid = await verifyPassword(password, customer.password_hash, customer.password_salt);
  if (!isValid) {
    return c.json({ error: 'Invalid phone/email or password' }, 401);
  }

  const tokenSecret = c.env.JWT_SECRET || 'bistroflow_jwt_secret_customer';
  const token = await signToken(
    { customerId: customer.id, restaurantId, role: 'customer', phone: customer.phone },
    tokenSecret,
    30 * 24 * 60 * 60
  );

  return c.json({
    token,
    customer: {
      id: customer.id,
      restaurantId: customer.restaurant_id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email || undefined,
      defaultAddress: customer.default_address || undefined,
      defaultLat: customer.default_lat || undefined,
      defaultLng: customer.default_lng || undefined,
      createdAt: customer.created_at,
    },
  });
});

// GET /api/public/customer/me
pub.get('/customer/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.substring(7);
  const tokenSecret = c.env.JWT_SECRET || 'bistroflow_jwt_secret_customer';
  const decoded = await verifyToken<{ customerId: string; restaurantId: string }>(token, tokenSecret);

  if (!decoded || !decoded.customerId) {
    return c.json({ error: 'Invalid or expired session' }, 401);
  }

  const customer = await c.env.DB
    .prepare('SELECT * FROM customers WHERE id = ? AND restaurant_id = ?')
    .bind(decoded.customerId, decoded.restaurantId)
    .first<{
      id: string;
      restaurant_id: string;
      name: string;
      phone: string;
      email?: string;
      default_address?: string;
      default_lat?: number;
      default_lng?: number;
      created_at: string;
    }>();

  if (!customer) {
    return c.json({ error: 'Customer not found' }, 404);
  }

  return c.json({
    customer: {
      id: customer.id,
      restaurantId: customer.restaurant_id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email || undefined,
      defaultAddress: customer.default_address || undefined,
      defaultLat: customer.default_lat || undefined,
      defaultLng: customer.default_lng || undefined,
      createdAt: customer.created_at,
    },
  });
});

// POST /api/public/customer/profile
pub.post('/customer/profile', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.substring(7);
  const tokenSecret = c.env.JWT_SECRET || 'bistroflow_jwt_secret_customer';
  const decoded = await verifyToken<{ customerId: string; restaurantId: string }>(token, tokenSecret);

  if (!decoded || !decoded.customerId) {
    return c.json({ error: 'Invalid session' }, 401);
  }

  const body = await c.req.json<{
    name?: string;
    defaultAddress?: string;
    defaultLat?: number;
    defaultLng?: number;
  }>();

  if (body.name) {
    await c.env.DB
      .prepare('UPDATE customers SET name = ?, default_address = ?, default_lat = ?, default_lng = ? WHERE id = ? AND restaurant_id = ?')
      .bind(body.name.trim(), body.defaultAddress?.trim() || null, body.defaultLat || null, body.defaultLng || null, decoded.customerId, decoded.restaurantId)
      .run();
  }

  return c.json({ success: true });
});

// GET /api/public/customer/orders
// Returns order history for the logged-in customer or by phone lookup
pub.get('/customer/orders', async (c) => {
  const authHeader = c.req.header('Authorization');
  const restaurantId = c.req.query('restaurantId');
  const phone = c.req.query('phone');

  let customerId: string | null = null;
  let targetRestId = restaurantId;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const tokenSecret = c.env.JWT_SECRET || 'bistroflow_jwt_secret_customer';
    const decoded = await verifyToken<{ customerId: string; restaurantId: string }>(token, tokenSecret);
    if (decoded) {
      customerId = decoded.customerId;
      targetRestId = decoded.restaurantId;
    }
  }

  if (!targetRestId) {
    return c.json({ error: 'restaurantId is required' }, 400);
  }

  let orders: Array<{
    id: string;
    restaurant_id: string;
    customer_id?: string;
    branch_id?: string;
    branch_name?: string;
    customer_name: string;
    customer_phone: string;
    address?: string;
    order_type: string;
    items_json: string;
    delivery_fee: number;
    total: number;
    delivery_zone_name?: string;
    customer_lat?: number;
    customer_lng?: number;
    google_maps_url?: string;
    distance_km?: number;
    status: string;
    created_at: string;
  }> = [];

  if (customerId) {
    orders = (await c.env.DB
      .prepare('SELECT * FROM orders WHERE restaurant_id = ? AND customer_id = ? ORDER BY created_at DESC')
      .bind(targetRestId, customerId)
      .all()).results as typeof orders;
  } else if (phone) {
    const cleanPhone = phone.trim().replace(/[^\d+]/g, '');
    orders = (await c.env.DB
      .prepare('SELECT * FROM orders WHERE restaurant_id = ? AND customer_phone = ? ORDER BY created_at DESC LIMIT 20')
      .bind(targetRestId, cleanPhone)
      .all()).results as typeof orders;
  } else {
    return c.json({ orders: [] });
  }

  return c.json({
    orders: orders.map((o) => ({
      id: o.id,
      restaurantId: o.restaurant_id,
      customerId: o.customer_id,
      branchId: o.branch_id,
      branchName: o.branch_name,
      customerName: o.customer_name,
      customerPhone: o.customer_phone,
      address: o.address,
      orderType: o.order_type,
      items: JSON.parse(o.items_json || '[]'),
      deliveryFee: Number(o.delivery_fee) || 0,
      total: Number(o.total) || 0,
      customerLat: o.customer_lat,
      customerLng: o.customer_lng,
      googleMapsUrl: o.google_maps_url,
      distanceKm: o.distance_km,
      status: o.status,
      createdAt: o.created_at,
    })),
  });
});

// ──────────────────────────────────────────────────────────────
// POST /api/public/delivery/calculate
// Calculates the nearest branch, validates coverage, and computes fee
// ──────────────────────────────────────────────────────────────

pub.post('/delivery/calculate', async (c) => {
  const body = await c.req.json<{
    restaurantId: string;
    customerLat?: number;
    customerLng?: number;
    zoneId?: string;
    branchId?: string;
  }>();

  const { restaurantId, customerLat, customerLng, zoneId, branchId } = body;
  if (!restaurantId) return c.json({ error: 'restaurantId is required' }, 400);

  // 1. Zone-based calculation
  if (zoneId) {
    const zone = await c.env.DB.prepare(`
      SELECT dz.*, b.name as branch_name, b.id as branch_id
      FROM delivery_zones dz
      JOIN branches b ON b.id = dz.branch_id
      WHERE dz.id = ? AND b.restaurant_id = ? AND b.is_active = 1
    `).bind(zoneId, restaurantId).first<{
      id: string;
      branch_id: string;
      branch_name: string;
      zone_name: string;
      fee: number;
      estimated_time_min?: number;
    }>();

    if (!zone) {
      return c.json({ covered: false, message: 'Selected delivery area is currently unavailable' }, 404);
    }

    return c.json({
      covered: true,
      branchId: zone.branch_id,
      branchName: zone.branch_name,
      deliveryZoneName: zone.zone_name,
      deliveryFee: zone.fee,
      estimatedTimeMin: zone.estimated_time_min,
    });
  }

  // 2. GPS / Distance-based calculation
  if (typeof customerLat === 'number' && typeof customerLng === 'number') {
    const rawBranches = (await c.env.DB
      .prepare('SELECT * FROM branches WHERE restaurant_id = ? AND is_active = 1')
      .bind(restaurantId)
      .all<{
        id: string;
        name: string;
        latitude: number;
        longitude: number;
        delivery_mode: string;
        max_delivery_radius_km: number;
        base_delivery_fee: number;
        base_delivery_distance_km: number;
        extra_fee_per_km: number;
      }>()).results;

    if (rawBranches.length === 0) {
      // Default fallback if no branches configured yet
      return c.json({
        covered: true,
        deliveryFee: 20,
        message: 'Standard delivery',
      });
    }

    // Evaluate delivery for each branch
    const evaluations = await Promise.all(
      rawBranches.map(async (b) => {
        const tiers = (await c.env.DB.prepare('SELECT min_km, max_km, fee FROM delivery_distance_tiers WHERE branch_id = ?')
          .bind(b.id).all<{ min_km: number; max_km: number; fee: number }>()).results;

        return evaluateBranchDelivery(
          {
            id: b.id,
            name: b.name,
            latitude: Number(b.latitude),
            longitude: Number(b.longitude),
            deliveryMode: (b.delivery_mode as 'radius' | 'zone') || 'radius',
            maxDeliveryRadiusKm: Number(b.max_delivery_radius_km) || 20,
            baseDeliveryFee: Number(b.base_delivery_fee) || 20,
            baseDeliveryDistanceKm: Number(b.base_delivery_distance_km) || 5,
            extraFeePerKm: Number(b.extra_fee_per_km) || 3,
            tiers: tiers.map((t) => ({ minKm: t.min_km, maxKm: t.max_km, fee: t.fee })),
          },
          customerLat,
          customerLng
        );
      })
    );

    // Filter covering branches and pick the nearest one
    const coveringBranches = evaluations.filter((e) => e.covered);
    if (coveringBranches.length > 0) {
      coveringBranches.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
      return c.json(coveringBranches[0]);
    }

    // Out of range for all branches
    evaluations.sort((a, b) => (a.distanceKm || 999) - (b.distanceKm || 999));
    const nearest = evaluations[0];
    return c.json({
      covered: false,
      distanceKm: nearest.distanceKm,
      branchName: nearest.branchName,
      message: `Your location is ${nearest.distanceKm} km away from our nearest branch (${nearest.branchName}). Maximum delivery range is ${rawBranches[0].max_delivery_radius_km} km.`,
    });
  }

  // 3. Fallback to branch ID base fee
  if (branchId) {
    const branch = await c.env.DB.prepare('SELECT id, name, base_delivery_fee FROM branches WHERE id = ? AND restaurant_id = ?')
      .bind(branchId, restaurantId).first<{ id: string; name: string; base_delivery_fee: number }>();
    if (branch) {
      return c.json({
        covered: true,
        branchId: branch.id,
        branchName: branch.name,
        deliveryFee: branch.base_delivery_fee,
      });
    }
  }

  return c.json({ error: 'Please provide customer coordinates (customerLat, customerLng) or a zoneId' }, 400);
});

// ──────────────────────────────────────────────────────────────
// POST /api/public/orders
// Create a new order with SERVER-SIDE PRICE & DELIVERY RECALCULATION
// ──────────────────────────────────────────────────────────────
interface IncomingOrderItem {
  itemId: string;
  name?: string;
  selectedOption?: string;
  selectedAddons?: string[];
  quantity: number;
}

pub.post('/orders', async (c) => {
  const body = await c.req.json<{
    restaurantId: string;
    branchId?: string;
    customerName: string;
    customerPhone: string;
    address?: string;
    orderType: 'delivery' | 'pickup';
    items: IncomingOrderItem[];
    deliveryZoneName?: string;
    customerLat?: number;
    customerLng?: number;
    googleMapsUrl?: string;
  }>();

  const {
    restaurantId,
    branchId,
    customerName,
    customerPhone,
    address,
    orderType,
    items,
    deliveryZoneName,
    customerLat,
    customerLng,
    googleMapsUrl,
  } = body;

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
  if (orderType === 'delivery' && (!address || !address.trim())) {
    return c.json({ error: 'Delivery address is required for delivery orders' }, 400);
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

  // 3. SERVER-SIDE ITEM PRICE RECALCULATION
  let verifiedItemsSubtotal = 0;
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

    const dbItem = await c.env.DB
      .prepare('SELECT id, name, price, available FROM menu_items WHERE id = ? AND restaurant_id = ?')
      .bind(rawItem.itemId, restaurantId)
      .first<{ id: string; name: string; price: number; available: number }>();

    if (!dbItem || !dbItem.available) {
      return c.json({ error: `Item "${rawItem.name || rawItem.itemId}" is no longer available` }, 400);
    }

    let itemUnitPrice = dbItem.price;

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
    verifiedItemsSubtotal += itemTotalPrice;

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

  // 4. SERVER-SIDE DELIVERY FEE RECALCULATION & BRANCH ASSIGNMENT
  let verifiedDeliveryFee = 0;
  let assignedBranchId = branchId || null;
  let assignedBranchName = '';
  let computedDistanceKm: number | null = null;

  if (orderType === 'delivery') {
    // Look up target branch if provided or find nearest
    if (assignedBranchId) {
      const b = await c.env.DB.prepare('SELECT * FROM branches WHERE id = ? AND restaurant_id = ?')
        .bind(assignedBranchId, restaurantId).first<{
          id: string;
          name: string;
          latitude: number;
          longitude: number;
          delivery_mode: string;
          max_delivery_radius_km: number;
          base_delivery_fee: number;
          base_delivery_distance_km: number;
          extra_fee_per_km: number;
        }>();

      if (b) {
        assignedBranchName = b.name;
        if (typeof customerLat === 'number' && typeof customerLng === 'number') {
          const tiers = (await c.env.DB.prepare('SELECT min_km, max_km, fee FROM delivery_distance_tiers WHERE branch_id = ?')
            .bind(b.id).all<{ min_km: number; max_km: number; fee: number }>()).results;

          const evalResult = evaluateBranchDelivery(
            {
              id: b.id,
              name: b.name,
              latitude: Number(b.latitude),
              longitude: Number(b.longitude),
              deliveryMode: 'radius',
              maxDeliveryRadiusKm: Number(b.max_delivery_radius_km) || 30,
              baseDeliveryFee: Number(b.base_delivery_fee) || 20,
              baseDeliveryDistanceKm: Number(b.base_delivery_distance_km) || 5,
              extraFeePerKm: 0,
              tiers: tiers.map((t) => ({ minKm: t.min_km, maxKm: t.max_km, fee: t.fee })),
            },
            customerLat,
            customerLng
          );
          verifiedDeliveryFee = evalResult.deliveryFee;
          computedDistanceKm = evalResult.distanceKm || null;
        } else {
          verifiedDeliveryFee = b.base_delivery_fee;
        }
      }
    } else if (typeof customerLat === 'number' && typeof customerLng === 'number') {
      // Auto-assign nearest branch
      const allBranches = (await c.env.DB
        .prepare('SELECT * FROM branches WHERE restaurant_id = ? AND is_active = 1')
        .bind(restaurantId).all<{
          id: string;
          name: string;
          latitude: number;
          longitude: number;
          delivery_mode: string;
          max_delivery_radius_km: number;
          base_delivery_fee: number;
          base_delivery_distance_km: number;
          extra_fee_per_km: number;
        }>()).results;

      if (allBranches.length > 0) {
        let bestDist = 99999;
        let bestBranch = allBranches[0];
        for (const b of allBranches) {
          const d = calculateHaversineDistanceKm(b.latitude, b.longitude, customerLat, customerLng);
          if (d < bestDist) {
            bestDist = d;
            bestBranch = b;
          }
        }
        assignedBranchId = bestBranch.id;
        assignedBranchName = bestBranch.name;

        const tiers = (await c.env.DB.prepare('SELECT min_km, max_km, fee FROM delivery_distance_tiers WHERE branch_id = ?')
          .bind(bestBranch.id).all<{ min_km: number; max_km: number; fee: number }>()).results;

        const evalResult = evaluateBranchDelivery(
          {
            id: bestBranch.id,
            name: bestBranch.name,
            latitude: Number(bestBranch.latitude),
            longitude: Number(bestBranch.longitude),
            deliveryMode: 'radius',
            maxDeliveryRadiusKm: Number(bestBranch.max_delivery_radius_km) || 30,
            baseDeliveryFee: Number(bestBranch.base_delivery_fee) || 20,
            baseDeliveryDistanceKm: Number(bestBranch.base_delivery_distance_km) || 5,
            extraFeePerKm: 0,
            tiers: tiers.map((t) => ({ minKm: t.min_km, maxKm: t.max_km, fee: t.fee })),
          },
          customerLat,
          customerLng
        );
        verifiedDeliveryFee = evalResult.deliveryFee;
        computedDistanceKm = evalResult.distanceKm || null;
      }
    }

  } else if (orderType === 'pickup' && branchId) {
    const b = await c.env.DB.prepare('SELECT name FROM branches WHERE id = ? AND restaurant_id = ?')
      .bind(branchId, restaurantId).first<{ name: string }>();
    if (b) assignedBranchName = b.name;
  }

  const verifiedGrandTotal = Math.round((verifiedItemsSubtotal + verifiedDeliveryFee) * 100) / 100;
  const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString(36).toUpperCase()}`;

  // ── Link to customer account if logged in ──────────────────
  let linkedCustomerId: string | null = null;
  try {
    const authHeader = c.req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const custToken = authHeader.substring(7);
      const secret = c.env.JWT_SECRET || 'bistroflow_jwt_secret_customer';
      const decoded = await verifyToken<{ customerId: string; restaurantId: string; role: string }>(custToken, secret);
      if (decoded && decoded.role === 'customer' && decoded.restaurantId === restaurantId) {
        linkedCustomerId = decoded.customerId;
      }
    }

    if (!linkedCustomerId) {
      // Fallback: look up by phone (auto-link guest who has an account)
      const cleanPhone = customerPhone.trim().replace(/[^\d+]/g, '');
      const existing = await c.env.DB
        .prepare('SELECT id FROM customers WHERE restaurant_id = ? AND phone = ?')
        .bind(restaurantId, cleanPhone)
        .first<{ id: string }>();
      if (existing) linkedCustomerId = existing.id;
    }
  } catch { /* If any token error, proceed without linking */ }

  await c.env.DB
    .prepare(`
      INSERT INTO orders (
        id, restaurant_id, branch_id, branch_name, customer_name, customer_phone,
        address, order_type, items_json, delivery_fee, total,
        delivery_zone_name, customer_lat, customer_lng, google_maps_url,
        distance_km, customer_id, status, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))
    `)
    .bind(
      orderId,
      restaurantId,
      assignedBranchId,
      assignedBranchName || null,
      customerName.trim(),
      customerPhone.trim(),
      address?.trim() || null,
      orderType,
      JSON.stringify(verifiedItems),
      verifiedDeliveryFee,
      verifiedGrandTotal,
      deliveryZoneName || null,
      customerLat || null,
      customerLng || null,
      googleMapsUrl || null,
      computedDistanceKm,
      linkedCustomerId,
    )
    .run();

  return c.json({
    orderId,
    status: 'pending',
    branchId: assignedBranchId,
    branchName: assignedBranchName,
    subtotal: verifiedItemsSubtotal,
    deliveryFee: verifiedDeliveryFee,
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
