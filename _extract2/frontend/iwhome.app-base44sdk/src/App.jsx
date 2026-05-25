import './App.css'
import { useEffect, useState, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster"
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { ClerkProvider, useAuth as useClerkAuth } from "@clerk/clerk-react";
import { itIT } from "@clerk/localizations";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Sentry from "@sentry/react";
import { usePostHog } from '@posthog/react';
import { useUser } from "@clerk/clerk-react";

// ── Sentry test button (dev only) ─────────────────────────────────────────────
function SentryTestButton() {
  if (import.meta.env.MODE !== 'development') return null;
  return (
    <button
      onClick={() => { throw new Error('This is your first error!'); }}
      style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 9999, background: '#dc3545', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 12 }}
    >
      🔴 Test Sentry
    </button>
  );
}

const queryClient = new QueryClient();

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

import VerticalMenu from './components/dashboard/VerticalMenu';
import AnimatedBackground from './components/dashboard/AnimatedBackground';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

// Pages accessible without login (no sidebar, no AnimatedBackground)
// Onboarding pages must be public — suppliers/staff use them before registering
// NOTE: Prezzi and CodiceReferral are admin-only PRIVATE pages (not here)
const PUBLIC_PAGES = [
  'Home', 'ChiSiamo', 'Servizi', 'Calcolatore', 'Blog', 'BlogPost',
  'Contatti', 'Cookie', 'Privacy', 'Termini',
  'Recensioni',
  'SupplierOnboarding', 'onboarding-staff',
  'Appuntamenti', // legacy redirect → renders Calcolatore (public, no auth needed)
];

const GlobalLayout = ({ children }) => {
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { isAuthenticated, isLoadingAuth, navigateToLogin, isPendingActivation } = useAuth();

  // Attempt to derive currentPageName, defaulting to mainPageKey if at root
  const currentPath = location.pathname.split('/')[1];
  const currentPageName = currentPath === '' ? mainPageKey : (Object.keys(Pages).find(k => k.toLowerCase() === currentPath.toLowerCase()) || currentPath);

  const isPrivate = !PUBLIC_PAGES.includes(currentPageName);
  const sidebarWidth = isPrivate ? (isSidebarCollapsed ? 80 : 280) : 0;

  // Private area protection: non-authenticated users are redirected to Clerk sign-in
  useEffect(() => {
    if (isPrivate && !isLoadingAuth && !isAuthenticated) {
      navigateToLogin();
    }
  }, [isPrivate, isAuthenticated, isLoadingAuth]);

  // Show a minimal loading screen while redirecting to login
  if (isPrivate && !isLoadingAuth && !isAuthenticated) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#212529]">
        <div className="w-8 h-8 border-4 border-blue-900 border-t-blue-400 rounded-full animate-spin" />
      </div>
    );
  }

  // Private page with authenticated user but no role assigned → show waiting screen
  if (isPrivate && isAuthenticated && isPendingActivation) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#212529]">
        <div className="text-center p-8 bg-[#343a40]/50 backdrop-blur-xl rounded-2xl border border-[#f8f9fa]/10 max-w-md mx-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-900 border-t-blue-400 rounded-full animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-[#f8f9fa] mb-2">Account in attesa di attivazione</h1>
          <p className="text-[#dee2e6] mb-4">
            Il tuo account è stato registrato. IWHome ti assegnerà il ruolo corretto a breve.
          </p>
          <p className="text-[#adb5bd] text-sm">
            Per assistenza contattaci: <span className="text-blue-400">info@iwhome.it</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {isPrivate && (
        <VerticalMenu
          isCollapsed={isSidebarCollapsed}
          onCollapse={setIsSidebarCollapsed}
        />
      )}
      {isPrivate && <AnimatedBackground />}
      {Layout ? (
        <Layout
          currentPageName={currentPageName}
          isPrivate={isPrivate}
          sidebarWidth={sidebarWidth}
        >
          {children}
        </Layout>
      ) : (
        <>{children}</>
      )}
    </>
  );
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, logout } = useAuth();
  const { user } = useUser();
  const posthog = usePostHog();

  // Identify user in Sentry and PostHog when logged in
  useEffect(() => {
    if (user) {
      const email = user.primaryEmailAddress?.emailAddress;
      Sentry.setUser({ id: user.id, email });
      posthog?.identify(user.id, { email, name: user.fullName });
    } else {
      Sentry.setUser(null);
      posthog?.reset();
    }
  }, [user?.id]);

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#212529]">
        <div className="w-8 h-8 border-4 border-blue-900 border-t-blue-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'user_blocked') {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-[#212529]">
          <div className="text-center p-8 bg-[#343a40]/50 backdrop-blur-xl rounded-2xl border border-red-500/30 max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <span className="text-3xl">🚫</span>
            </div>
            <h1 className="text-2xl font-bold text-[#f8f9fa] mb-2">Account Bloccato</h1>
            <p className="text-[#dee2e6] mb-4">{authError.message}</p>
            <button
              onClick={() => logout()}
              className="px-6 py-2 bg-[#f8f9fa] text-[#212529] rounded-lg font-medium hover:bg-[#e9ecef] transition-colors"
            >
              Esci
            </button>
          </div>
        </div>
      );
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <GlobalLayout>
      <Suspense fallback={
        <div className="fixed inset-0 flex items-center justify-center bg-[#212529]">
          <div className="w-8 h-8 border-4 border-blue-900 border-t-blue-400 rounded-full animate-spin" />
        </div>
      }>
      <Routes>
        <Route path="/" element={<MainPage />} />
        {Object.entries(Pages).map(([path, Page]) => (
          <Route
            key={path}
            path={`/${path}`}
            element={<Page />}
          />
        ))}
        <Route path="*" element={<PageNotFound />} />
      </Routes>
      </Suspense>
    </GlobalLayout>
  );
};


function App() {
  useEffect(() => {
    const el = document.getElementById('initial-loader');
    if (el) el.remove();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} localization={itIT}>
        <ConvexProviderWithClerk client={convex} useAuth={useClerkAuth}>
          <AuthProvider>
            <Router>
              <NavigationTracker />
              <AuthenticatedApp />
            </Router>
            <Toaster />
            <VisualEditAgent />
            <SentryTestButton />
          </AuthProvider>
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </QueryClientProvider>
  )
}

export default App
