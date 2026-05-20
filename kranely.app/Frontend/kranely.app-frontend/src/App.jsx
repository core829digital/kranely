import './App.css';
import { useEffect, useState, Suspense } from 'react';
import { Toaster } from '@/components/ui/sonner';
import NavigationTracker from '@/lib/NavigationTracker';
import { pagesConfig } from './pages.config';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { WhiteLabelProvider } from '@/lib/WhiteLabelContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { ClerkProvider, useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';
import { enUS } from '@clerk/localizations';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ConvexReactClient } from 'convex/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Sentry from '@sentry/react';
import { usePostHog } from '@posthog/react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n/index.js';
import VerticalMenu from './components/dashboard/VerticalMenu';
import AnimatedBackground from './components/dashboard/AnimatedBackground';

const queryClient = new QueryClient();

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? '';

const ENV_MISSING = !CONVEX_URL || !CLERK_PUBLISHABLE_KEY;
if (!CONVEX_URL) console.error('[Kranely] VITE_CONVEX_URL is not set. Copy .env.example → .env.local');
if (!CLERK_PUBLISHABLE_KEY) console.error('[Kranely] VITE_CLERK_PUBLISHABLE_KEY is not set. Copy .env.example → .env.local');

// Only create the client when we have a valid URL — avoids "not an absolute URL" crash
const convex = ENV_MISSING ? null : new ConvexReactClient(CONVEX_URL);

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : null;

const PUBLIC_PAGES = [
  'Home', 'About', 'Services', 'Pricing', 'Blog', 'BlogPost',
  'Contact', 'Cookie', 'Privacy', 'Terms', 'Reviews',
  'SupplierOnboarding', 'OnboardingStaff', 'RentYourApp'
];

function KranelySpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#1C1A18]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-[3px] border-[#FFC703]/20 border-t-[#FFC703] animate-spin" />
        <p className="text-[10px] text-white/30 tracking-[0.3em] uppercase font-medium">Kranely</p>
      </div>
    </div>
  );
}

const GlobalLayout = ({ children }) => {
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { isAuthenticated, isLoadingAuth, navigateToLogin, isPendingActivation } = useAuth();
  const { t } = useTranslation();

  const currentPath = location.pathname.split('/')[1];
  const currentPageName = currentPath === ''
    ? mainPageKey
    : (Object.keys(Pages).find(k => k.toLowerCase() === currentPath.toLowerCase()) || currentPath);

  const isPrivate = !PUBLIC_PAGES.includes(currentPageName);
  const sidebarWidth = isPrivate ? (isSidebarCollapsed ? 72 : 264) : 0;

  useEffect(() => {
    if (isPrivate && !isLoadingAuth && !isAuthenticated) navigateToLogin();
  }, [isPrivate, isAuthenticated, isLoadingAuth]);

  if (isPrivate && !isLoadingAuth && !isAuthenticated) return <KranelySpinner />;

  if (isPrivate && isAuthenticated && isPendingActivation) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#1C1A18]">
        <div className="text-center p-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 max-w-md mx-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#FFC703]/10 flex items-center justify-center">
            <div className="w-8 h-8 border-[3px] border-[#FFC703]/20 border-t-[#FFC703] rounded-full animate-spin" />
          </div>
          <h1 className="text-xl font-semibold text-[#F0EBE8] mb-2">{t('auth.pending_activation')}</h1>
          <p className="text-[#F0EBE8]/60 mb-4 text-sm leading-relaxed">{t('auth.pending_message')}</p>
          <p className="text-[#F0EBE8]/40 text-xs">{t('auth.contact_support')}</p>
        </div>
      </div>
    );
  }

  // Sync sidebar width to CSS variable for smooth transitions
  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-w', `${sidebarWidth}px`);
  }, [sidebarWidth]);

  return (
    <>
      {isPrivate && <VerticalMenu isCollapsed={isSidebarCollapsed} onCollapse={setIsSidebarCollapsed} />}
      {isPrivate && <AnimatedBackground />}
      {Layout
        ? <Layout currentPageName={currentPageName} isPrivate={isPrivate} sidebarWidth={sidebarWidth}>{children}</Layout>
        : <>{children}</>}
    </>
  );
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, logout } = useAuth();
  const { user } = useUser();
  const posthog = typeof usePostHog === 'function' ? usePostHog() : null;
  const { t } = useTranslation();

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

  if (isLoadingPublicSettings || isLoadingAuth) return <KranelySpinner />;

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'user_blocked') {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-[#1C1A18]">
          <div className="text-center p-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-red-500/20 max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center text-2xl">🚫</div>
            <h1 className="text-xl font-semibold text-[#F0EBE8] mb-2">{t('auth.blocked')}</h1>
            <p className="text-[#F0EBE8]/60 mb-6 text-sm">{authError.message}</p>
            <button onClick={logout} className="px-6 py-2.5 bg-[#F0EBE8] text-[#1C1A18] rounded-lg font-medium hover:bg-white transition-colors text-sm">{t('auth.logout')}</button>
          </div>
        </div>
      );
    }
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <GlobalLayout>
      <Suspense fallback={<KranelySpinner />}>
        <Routes>
          {MainPage && <Route path="/" element={<MainPage />} />}
          {Object.entries(Pages).map(([path, Page]) => (
            <Route key={path} path={`/${path}`} element={<Page />} />
          ))}
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Suspense>
    </GlobalLayout>
  );
};

function EnvSetupScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#1C1A18]">
      <div className="max-w-md w-full mx-4 p-8 bg-white/5 border border-white/10 rounded-2xl text-center">
        <div className="w-14 h-14 mx-auto mb-5 rounded-xl bg-[#FFC703]/10 flex items-center justify-center">
          <span className="text-2xl font-bold text-[#FFC703]">K</span>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Environment not configured</h1>
        <p className="text-[#F0EBE8]/50 text-sm mb-6 leading-relaxed">
          Copy <code className="bg-white/10 px-1.5 py-0.5 rounded text-[#FFC703]">.env.example</code> to{' '}
          <code className="bg-white/10 px-1.5 py-0.5 rounded text-[#FFC703]">.env.local</code> and fill in your Convex URL and Clerk publishable key, then restart the dev server.
        </p>
        <div className="text-left bg-black/30 rounded-xl p-4 text-xs font-mono text-[#F0EBE8]/60 space-y-1">
          <div><span className="text-[#FFC703]/70">VITE_CONVEX_URL</span>=https://your-project.convex.cloud</div>
          <div><span className="text-[#FFC703]/70">VITE_CLERK_PUBLISHABLE_KEY</span>=pk_test_...</div>
        </div>
      </div>
    </div>
  );
}

function App() {
  useEffect(() => {
    const el = document.getElementById('initial-loader');
    if (el) el.remove();
  }, []);

  if (ENV_MISSING) return <EnvSetupScreen />;

  return (
    <QueryClientProvider client={queryClient}>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} localization={enUS} clerkJSUrl="https://js.clerk.com/npm/@clerk/clerk-js@5/dist/clerk.browser.js">
        <ConvexProviderWithClerk client={convex} useAuth={useClerkAuth}>
          <AuthProvider>
            <WhiteLabelProvider>
              <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <NavigationTracker />
                <AuthenticatedApp />
              </Router>
              <Toaster position="bottom-right" richColors closeButton />
            </WhiteLabelProvider>
          </AuthProvider>
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </QueryClientProvider>
  );
}

export default App;
