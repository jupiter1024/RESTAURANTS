import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { auth } from './routes/auth';
import { admin } from './routes/admin';
import { pub } from './routes/public';

type Bindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
  JWT_SECRET: string;
  ASSETS: Fetcher; // Cloudflare Pages/Workers static asset binding
};

const app = new Hono<{ Bindings: Bindings }>();

// ──────────────────────────────────────────────────────────────
// Strict CORS Validation
// Allows only bistroflow.com, valid *.bistroflow.com subdomains,
// and local development origins (localhost / 127.0.0.1)
// ──────────────────────────────────────────────────────────────
const PROD_ORIGIN_REGEX = /^https:\/\/(?:[a-z0-9-]+\.)?bistroflow\.com$/i;
const LOCAL_ORIGIN_REGEX = /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i;

app.use('/api/*', cors({
  origin: (origin) => {
    if (!origin) return '*';
    if (PROD_ORIGIN_REGEX.test(origin) || LOCAL_ORIGIN_REGEX.test(origin)) {
      return origin;
    }
    return null;
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));

// ──────────────────────────────────────────────────────────────
// API routes
// ──────────────────────────────────────────────────────────────
app.route('/api/auth', auth);
app.route('/api/admin', admin);
app.route('/api/public', pub);

// ──────────────────────────────────────────────────────────────
// Convenience top-level paths (no /api/public prefix)
// ──────────────────────────────────────────────────────────────
app.get('/sitemap.xml', async (c) => {
  return c.redirect('/api/public/sitemap');
});
app.get('/robots.txt', async (c) => {
  return c.redirect('/api/public/robots');
});

// ──────────────────────────────────────────────────────────────
// Static SPA + HTMLRewriter SEO injection for restaurant subdomains
// ──────────────────────────────────────────────────────────────
app.get('*', async (c) => {
  const hostname = c.req.header('host') || '';
  const url = new URL(c.req.url);

  // Detect if this is a restaurant subdomain request
  // e.g. burger-palace.bistroflow.com
  const isSubdomain =
    hostname !== 'bistroflow.com' &&
    hostname !== 'www.bistroflow.com' &&
    !hostname.startsWith('localhost') &&
    !hostname.startsWith('127.0.0.1') &&
    hostname.includes('.');

  // Try to serve static asset first
  let response: Response;
  try {
    response = await c.env.ASSETS.fetch(c.req.raw);
    const contentType = response.headers.get('content-type') || '';
    if (response.ok && !contentType.includes('text/html')) {
      return response;
    }
  } catch {
    // ASSETS binding not available (e.g. local wrangler dev worker without assets)
    if (url.pathname !== '/' && url.pathname.indexOf('.') !== -1) {
      return c.text('Not found', 404);
    }
    return new Response(getMinimalHtml(), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // For HTML responses on restaurant subdomains, inject SEO meta tags & JSON-LD
  if (isSubdomain && response) {
    const slug = hostname.split('.')[0].toLowerCase().trim();
    try {
      const restaurant = await c.env.DB
        .prepare('SELECT id, name, slug, whatsapp_number, hotline FROM restaurants WHERE slug = ? AND published = 1')
        .bind(slug)
        .first<{
          id: string;
          name: string;
          slug: string;
          whatsapp_number?: string;
          hotline?: string;
        }>();

      if (restaurant) {
        const branding = await c.env.DB
          .prepare('SELECT logo_url FROM restaurant_branding WHERE restaurant_id = ?')
          .bind(restaurant.id)
          .first<{ logo_url?: string }>();

        const title = `${restaurant.name} — Online Menu & Ordering`;
        const description = `Browse the full online menu of ${restaurant.name}. View dishes, special offers, prices, and order directly.`;
        const canonical = `https://${restaurant.slug}.bistroflow.com`;
        const logo = branding?.logo_url || 'https://bistroflow.com/logo.png';
        const contactPhone = restaurant.hotline || restaurant.whatsapp_number || '';

        // Schema.org Restaurant Structured Data
        const jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'Restaurant',
          'name': restaurant.name,
          'url': canonical,
          'image': logo,
          ...(contactPhone ? { 'telephone': contactPhone } : {}),
          'menu': canonical,
          'acceptsReservations': 'False',
          'potentialAction': {
            '@type': 'OrderAction',
            'target': {
              '@type': 'EntryPoint',
              'urlTemplate': canonical,
              'actionPlatform': [
                'http://schema.org/DesktopWebPlatform',
                'http://schema.org/MobileWebPlatform',
              ],
            },
          },
        };

        const rewriter = new HTMLRewriter()
          .on('title', {
            element(el) {
              el.setInnerContent(title);
            },
          })
          .on('head', {
            element(el) {
              el.append(
                `<meta name="description" content="${escapeHtml(description)}">` +
                `<link rel="canonical" href="${canonical}">` +
                `<meta property="og:title" content="${escapeHtml(title)}">` +
                `<meta property="og:description" content="${escapeHtml(description)}">` +
                `<meta property="og:url" content="${canonical}">` +
                `<meta property="og:type" content="restaurant.restaurant">` +
                (logo ? `<meta property="og:image" content="${logo}">` : '') +
                `<meta name="twitter:card" content="summary_large_image">` +
                `<meta name="twitter:title" content="${escapeHtml(title)}">` +
                `<meta name="twitter:description" content="${escapeHtml(description)}">` +
                `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` +
                `<script>window.__RESTAURANT_SLUG__="${restaurant.slug}";</script>`,
                { html: true }
              );
            },
          });

        return rewriter.transform(response);
      }
    } catch {
      // DB lookup failed — return standard HTML
    }
  }

  return response;
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getMinimalHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BistroFlow</title>
</head>
<body>
  <div id="root"></div>
  <script>
    if (location.port === '8787') {
      location.href = 'http://localhost:5173' + location.pathname + location.search;
    }
  </script>
</body>
</html>`;
}

export default app;
