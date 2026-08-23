import { useState, useEffect } from 'react';
import { LanguageProvider } from './utils/translate';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { TemplateWrapper } from './templates/TemplateWrapper';
import { db } from './db/mockDb';

function App() {
  const [route, setRoute] = useState<{
    page: 'landing' | 'login' | 'signup' | 'onboarding' | 'dashboard' | 'restaurant';
    restaurantId?: string;
  }>(() => {
    // Check URL path on bootstrap
    const path = window.location.pathname;
    const match = path.match(/\/r\/([a-zA-Z0-9_-]+)/);
    if (match) {
      return { page: 'restaurant', restaurantId: match[1] };
    }

    // Check existing active user session
    const activeUserStr = localStorage.getItem('bistroflow_user');
    if (activeUserStr) {
      try {
        const userObj = JSON.parse(activeUserStr);
        const restObj = db.getRestaurant(userObj.restaurantId);
        if (restObj) {
          // If restaurant is published and has menu, send to dashboard. Otherwise onboarding.
          const menuObj = db.getMenu(userObj.restaurantId);
          const hasMenu = menuObj && menuObj.categories.length > 0;
          return {
            page: (restObj.published && hasMenu) ? 'dashboard' : 'onboarding',
            restaurantId: userObj.restaurantId
          };
        }
      } catch (err) {
        localStorage.removeItem('bistroflow_user');
      }
    }

    return { page: 'landing' };
  });

  // Listen to popstate for back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const match = path.match(/\/r\/([a-zA-Z0-9_-]+)/);
      if (match) {
        setRoute({ page: 'restaurant', restaurantId: match[1] });
      } else {
        const activeUserStr = localStorage.getItem('bistroflow_user');
        if (activeUserStr) {
          try {
            const userObj = JSON.parse(activeUserStr);
            const restObj = db.getRestaurant(userObj.restaurantId);
            if (restObj) {
              const menuObj = db.getMenu(userObj.restaurantId);
              const hasMenu = menuObj && menuObj.categories.length > 0;
              setRoute({
                page: (restObj.published && hasMenu) ? 'dashboard' : 'onboarding',
                restaurantId: userObj.restaurantId
              });
              return;
            }
          } catch (e) {}
        }
        setRoute({ page: 'landing' });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (page: typeof route.page, restaurantId?: string) => {
    if (page === 'restaurant' && restaurantId) {
      window.history.pushState(null, '', `/r/${restaurantId}`);
    } else {
      window.history.pushState(null, '', '/');
    }
    setRoute({ page, restaurantId });
  };

  const handleAuthSuccess = (_userId: string, restaurantId: string) => {
    // Check if onboarding completed
    const rest = db.getRestaurant(restaurantId);
    const menuObj = db.getMenu(restaurantId);
    const hasMenu = menuObj && menuObj.categories.length > 0;

    if (rest && rest.published && hasMenu) {
      navigateTo('dashboard', restaurantId);
    } else {
      navigateTo('onboarding', restaurantId);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('bistroflow_user');
    navigateTo('landing');
  };

  if (route.page === 'restaurant' && route.restaurantId) {
    return (
      <LanguageProvider>
        <TemplateWrapper
          restaurantId={route.restaurantId}
          isPreview={false}
          onClosePreview={() => navigateTo('landing')}
        />
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider>
      <div className="min-h-screen text-gray-100 bg-gray-950 font-sans selection:bg-blue-600 selection:text-white antialiased">
        {/* Render pages */}
        {route.page === 'landing' && (
          <LandingPage
            onStartSignUp={() => navigateTo('signup')}
            onStartLogin={() => navigateTo('login')}
            onViewDemoRestaurant={(id) => navigateTo('restaurant', id)}
          />
        )}

        {(route.page === 'login' || route.page === 'signup') && (
          <AuthPage
            initialMode={route.page}
            onAuthSuccess={handleAuthSuccess}
          />
        )}

        {route.page === 'onboarding' && route.restaurantId && (
          <Onboarding
            restaurantId={route.restaurantId}
            onOnboardingComplete={() => navigateTo('dashboard', route.restaurantId)}
          />
        )}

        {route.page === 'dashboard' && route.restaurantId && (
          <Dashboard
            restaurantId={route.restaurantId}
            onLogout={handleLogout}
          />
        )}
      </div>
    </LanguageProvider>
  );
}

export default App;
