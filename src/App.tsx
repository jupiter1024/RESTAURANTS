import { useState } from 'react';
import { LandingPage } from './pages/LandingPage';
import { SimpleAuth } from './pages/SimpleAuth';
import { MenuUploadScreen } from './pages/MenuUploadScreen';
import { AdminDashboard } from './pages/AdminDashboard';
import { simpleDb } from './db/simpleDb';

type Page = 'landing' | 'auth' | 'upload' | 'admin';
type AuthMode = 'login' | 'signup';
type PlanType = 'menu-link' | 'whatsapp' | 'website';

function App() {
  // Detect session on boot
  const getInitialPage = (): { page: Page; restaurantId?: string } => {
    const session = simpleDb.getSession();
    if (session) {
      const restaurant = simpleDb.getRestaurant(session.restaurantId);
      if (restaurant) {
        return { page: 'admin', restaurantId: session.restaurantId };
      }
    }
    return { page: 'landing' };
  };

  const initial = getInitialPage();
  const [page, setPage] = useState<Page>(initial.page);
  const [restaurantId, setRestaurantId] = useState<string | undefined>(initial.restaurantId);
  const [authMode, setAuthMode] = useState<AuthMode>('signup');
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('menu-link');

  const handleAuthSuccess = (restId: string, isSignUp: boolean) => {
    setRestaurantId(restId);
    const r = simpleDb.getRestaurant(restId);
    // If sign in (login) or if menu files already exist, go straight to Admin!
    if (!isSignUp || (r && r.menuFiles.length > 0)) {
      setPage('admin');
    } else {
      setPage('upload');
    }
  };

  const handleUploadNext = async () => {
    setPage('admin');
  };

  const handleLogout = () => {
    simpleDb.logout();
    setRestaurantId(undefined);
    setPage('landing');
  };

  // Auth (signup or login)
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

  // Upload screen (after brand-new signup)
  if (page === 'upload' && restaurantId) {
    return (
      <MenuUploadScreen
        restaurantId={restaurantId}
        onNext={handleUploadNext}
        onManualEntry={handleUploadNext}
      />
    );
  }

  // Admin dashboard
  if (page === 'admin' && restaurantId) {
    return (
      <AdminDashboard
        restaurantId={restaurantId}
        onLogout={handleLogout}
      />
    );
  }

  // Default / Landing page
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
