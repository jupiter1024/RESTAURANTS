import { useState, useEffect } from 'react';
import { LandingPage } from './pages/LandingPage';
import { SimpleAuth } from './pages/SimpleAuth';
import { MenuUploadScreen } from './pages/MenuUploadScreen';
import { AdminDashboard } from './pages/AdminDashboard';
import { apiGetSession, apiLogout, apiGetRestaurant } from './api/client';
import { PublicMenuPage } from './pages/PublicMenuPage';

type Page = 'loading' | 'landing' | 'auth' | 'upload' | 'admin' | 'public';
type AuthMode = 'login' | 'signup';
type PlanType = 'menu-link' | 'whatsapp' | 'website';

// ──────────────────────────────────────────────────────────────
// Detect if this is a restaurant subdomain request
// e.g. burger-palace.bistroflow.com  or  burger-palace.localhost
// ──────────────────────────────────────────────────────────────
function detectSubdomain(): string | null {
  const injectedSlug = (window as unknown as Record<string, unknown>).__RESTAURANT_SLUG__ as string | undefined;
  if (injectedSlug) return injectedSlug; // injected by HTMLRewriter on production

  // Check URL query param ?slug=... (for local dev testing e.g. http://localhost:5173?slug=mola)
  const searchParams = new URLSearchParams(window.location.search);
  const querySlug = searchParams.get('slug');
  if (querySlug && querySlug.trim()) {
    return querySlug.trim().toLowerCase();
  }

  const hostname = window.location.hostname;
  // bistroflow.com or www.bistroflow.com → not a subdomain
  if (hostname === 'bistroflow.com' || hostname === 'www.bistroflow.com') return null;
  // localhost / 127.0.0.1 without ?slug= → admin/SaaS portal
  if (hostname === 'localhost' || hostname === '127.0.0.1') return null;

  // something.bistroflow.com or something.localhost → subdomain
  const parts = hostname.split('.');
  if (parts.length >= 2) {
    const sub = parts[0];
    if (sub && sub !== 'www') return sub.toLowerCase();
  }
  return null;
}

function App() {
  const subdomainSlug = detectSubdomain();

  const [page, setPage] = useState<Page>(subdomainSlug ? 'public' : 'loading');
  const [restaurantId, setRestaurantId] = useState<string | undefined>();
  const [authMode, setAuthMode] = useState<AuthMode>('signup');
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('menu-link');

  // On boot: restore session (async because the API call verifies the JWT)
  useEffect(() => {
    if (subdomainSlug) return; // Public menu mode — skip session check

    const session = apiGetSession();
    if (!session) {
      setPage('landing');
      return;
    }

    // Verify the session is still valid by fetching the restaurant
    apiGetRestaurant(session.restaurantId).then((restaurant) => {
      if (restaurant) {
        setRestaurantId(session.restaurantId);
        setPage('admin');
      } else {
        apiLogout();
        setPage('landing');
      }
    }).catch(() => {
      // Network error — still go to landing rather than hang on loading
      setPage('landing');
    });
  }, [subdomainSlug]);

  const [adminInitialView, setAdminInitialView] = useState<'admin' | 'customer'>('admin');

  const handleAuthSuccess = async (restId: string, isSignUp: boolean) => {
    setRestaurantId(restId);
    setAdminInitialView('admin');
    if (!isSignUp) {
      // Login → always go to admin
      setPage('admin');
      return;
    }
    // Sign-up → check plan & menu files
    const r = await apiGetRestaurant(restId);
    if (r && (r.plan === 'website' || (r.menuFiles && r.menuFiles.length > 0))) {
      // Offer 3 ($200 interactive site) or existing menus go directly to Admin
      setPage('admin');
    } else {
      // Offer 1 ($10) and Offer 2 ($25) go to upload screen
      setPage('upload');
    }
  };

  const handleUploadNext = () => {
    setAdminInitialView('customer');
    setPage('admin');
  };

  const handleLogout = () => {
    apiLogout();
    setRestaurantId(undefined);
    setPage('landing');
  };

  // ── Public restaurant menu (subdomain) ──────────────────────
  if (page === 'public' && subdomainSlug) {
    return <PublicMenuPage slug={subdomainSlug} />;
  }

  // ── Loading splash ──────────────────────────────────────────
  if (page === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0d11]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading BistroFlow…</p>
        </div>
      </div>
    );
  }

  // ── Auth ─────────────────────────────────────────────────────
  if (page === 'auth') {
    return (
      <SimpleAuth
        mode={authMode}
        plan={selectedPlan}
        onSuccess={handleAuthSuccess}
        onToggleMode={() => setAuthMode(m => m === 'signup' ? 'login' : 'signup')}
      />
    );
  }

  // ── Upload screen (after brand-new signup) ───────────────────
  if (page === 'upload' && restaurantId) {
    return (
      <MenuUploadScreen
        restaurantId={restaurantId}
        onNext={handleUploadNext}
        onManualEntry={handleUploadNext}
      />
    );
  }

  // ── Admin dashboard ─────────────────────────────────────────
  if (page === 'admin' && restaurantId) {
    return (
      <AdminDashboard
        restaurantId={restaurantId}
        initialViewMode={adminInitialView}
        onLogout={handleLogout}
      />
    );
  }

  // ── Landing page ─────────────────────────────────────────────
  return (
    <LandingPage
      onStartSignUp={(planId) => {
        setSelectedPlan(planId || 'menu-link');
        setAuthMode('signup');
        setPage('auth');
      }}
      onStartLogin={() => {
        setAuthMode('login');
        setPage('auth');
      }}
      onViewDemoRestaurant={() => {
        setAuthMode('signup');
        setPage('auth');
      }}
    />
  );
}

export default App;
