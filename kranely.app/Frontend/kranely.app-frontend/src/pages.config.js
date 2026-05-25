import { lazy } from 'react';
import __Layout from './Layout.jsx';

// ── Kranely — Lazy-loaded pages ───────────────────────────────────────────────
// Page files keep their original names; routes use English paths.
// Each page is loaded on demand (code splitting).

const Admin              = lazy(() => import('./pages/Admin'));
const Dashboard          = lazy(() => import('./pages/Dashboard'));
const Home               = lazy(() => import('./pages/Home'));

// Clients & CRM
const Clients            = lazy(() => import('./pages/Clienti'));
const Suppliers          = lazy(() => import('./pages/Fornitori'));
const Collaborators      = lazy(() => import('./pages/Collaboratori'));

// Operations
const Projects           = lazy(() => import('./pages/CantieriDashboard'));
const Quotes             = lazy(() => import('./pages/Preventivi'));
const Payments           = lazy(() => import('./pages/Pagamenti'));
const Appointments       = lazy(() => import('./pages/MyAppointments'));
const DailyLogs          = lazy(() => import('./pages/DailyLogs'));
const Tasks              = lazy(() => import('./pages/Tasks'));
const Workflow           = lazy(() => import('./pages/FlussoDiLavoro'));

// Documents
const Documents          = lazy(() => import('./pages/Documents'));
const UploadDocument     = lazy(() => import('./pages/UploadDocument'));
const SharedDocuments    = lazy(() => import('./pages/SharedDocuments'));
const PdfEditor          = lazy(() => import('./pages/PdfEditor'));

// Communication
const Messages           = lazy(() => import('./pages/Messages'));

// Certificates & Compliance
const Certificates       = lazy(() => import('./pages/Certificati'));

// Settings & Admin
const Settings           = lazy(() => import('./pages/Settings'));
const ReferralCode       = lazy(() => import('./pages/CodiceReferral'));
const PublicPricing      = lazy(() => import('./pages/PublicPricing')); // public SaaS pricing page
const Storage            = lazy(() => import('./pages/Storage'));        // private storage manager
const Whitelabel         = lazy(() => import('./pages/Whitelabel'));     // private whitelabel reseller
const RentYourApp        = lazy(() => import('./pages/RentYourApp'));   // public landing page

// Public pages
const Blog               = lazy(() => import('./pages/Blog'));
const BlogPost           = lazy(() => import('./pages/BlogPost'));
const Calculator         = lazy(() => import('./pages/Calcolatore'));
const About              = lazy(() => import('./pages/ChiSiamo'));
const Contact            = lazy(() => import('./pages/Contatti'));
const Cookie             = lazy(() => import('./pages/Cookie'));
const Privacy            = lazy(() => import('./pages/Privacy'));
const Reviews            = lazy(() => import('./pages/Recensioni'));
const Services           = lazy(() => import('./pages/Servizi'));
const Terms              = lazy(() => import('./pages/Termini'));
const SupplierOnboarding = lazy(() => import('./pages/SupplierOnboarding'));
const OnboardingStaff    = lazy(() => import('./pages/OnboardingStaff'));

export const PAGES = {
  // ── Core ──────────────────────────────────────────────────────────────────
  'Admin':           Admin,
  'Dashboard':       Dashboard,

  // ── CRM ───────────────────────────────────────────────────────────────────
  'Clients':         Clients,
  'Suppliers':       Suppliers,
  'Collaborators':   Collaborators,

  // ── Operations ────────────────────────────────────────────────────────────
  'Projects':        Projects,
  'Quotes':          Quotes,
  'Payments':        Payments,
  'Appointments':    Appointments,
  'DailyLogs':       DailyLogs,
  'Tasks':           Tasks,
  'Workflow':        Workflow,

  // ── Documents ─────────────────────────────────────────────────────────────
  'Documents':       Documents,
  'UploadDocument':  UploadDocument,
  'SharedDocuments': SharedDocuments,
  'PdfEditor':       PdfEditor,

  // ── Communication ─────────────────────────────────────────────────────────
  'Messages':        Messages,

  // ── Certificates ──────────────────────────────────────────────────────────
  'Certificates':    Certificates,

  // ── Settings ──────────────────────────────────────────────────────────────
  'Settings':        Settings,
  'ReferralCode':    ReferralCode,
  'Storage':         Storage,
  'Whitelabel':      Whitelabel,

  // ── Public ────────────────────────────────────────────────────────────────
  'Home':            Home,
  'About':           About,
  'Services':        Services,
  'Pricing':         PublicPricing,  // public SaaS pricing page
  'RentYourApp':     RentYourApp,    // public rent-your-app landing
  'Blog':            Blog,
  'BlogPost':        BlogPost,
  'Contact':         Contact,
  'Cookie':          Cookie,
  'Privacy':         Privacy,
  'Terms':           Terms,
  'Reviews':         Reviews,
  'Calculator':      Calculator,

  // ── Onboarding ────────────────────────────────────────────────────────────
  'SupplierOnboarding': SupplierOnboarding,
  'OnboardingStaff':    OnboardingStaff,

  // ── Legacy redirects ──────────────────────────────────────────────────────
  'CompanyDashboard':  Dashboard,
  'ClientChat':        Messages,
  'MyAppointments':    Appointments,
};

export const pagesConfig = {
  mainPage: 'Home',
  Pages: PAGES,
  Layout: __Layout,
};
