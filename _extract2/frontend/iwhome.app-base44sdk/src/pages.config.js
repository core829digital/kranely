import { lazy } from 'react';
import __Layout from './Layout.jsx';

// ── Lazy-loaded pages ─────────────────────────────────────────────────────────
// Each page is loaded on demand — the initial JS bundle stays small.
// Public pages (Home, Blog, etc.) and private pages are all lazy:
// the user only ever visits a subset of them per session.

const Admin             = lazy(() => import('./pages/Admin'));
const AreaPrivata       = lazy(() => import('./pages/AreaPrivata'));
const Blog              = lazy(() => import('./pages/Blog'));
const BlogPost          = lazy(() => import('./pages/BlogPost'));
const Calcolatore       = lazy(() => import('./pages/Calcolatore'));
const Certificati       = lazy(() => import('./pages/Certificati'));
const ChiSiamo          = lazy(() => import('./pages/ChiSiamo'));
const Collaboratori     = lazy(() => import('./pages/Collaboratori'));
const CantieriDashboard = lazy(() => import('./pages/CantieriDashboard'));
const Contatti          = lazy(() => import('./pages/Contatti'));
const Cookie            = lazy(() => import('./pages/Cookie'));
const Clienti           = lazy(() => import('./pages/Clienti'));
const DailyLogs         = lazy(() => import('./pages/DailyLogs'));
const Tasks             = lazy(() => import('./pages/Tasks'));
const Dashboard         = lazy(() => import('./pages/Dashboard'));
const Documents         = lazy(() => import('./pages/Documents'));
const FlussoDiLavoro    = lazy(() => import('./pages/FlussoDiLavoro'));
const Fornitori         = lazy(() => import('./pages/Fornitori'));
const Home              = lazy(() => import('./pages/Home'));
const Messages          = lazy(() => import('./pages/Messages'));
const MyAppointments    = lazy(() => import('./pages/MyAppointments'));
const Pagamenti         = lazy(() => import('./pages/Pagamenti'));
const PdfEditor         = lazy(() => import('./pages/PdfEditor'));
const Preventivi        = lazy(() => import('./pages/Preventivi'));
const Prezzi            = lazy(() => import('./pages/Prezzi'));
const CodiceReferral    = lazy(() => import('./pages/CodiceReferral'));
const Privacy           = lazy(() => import('./pages/Privacy'));
const Recensioni        = lazy(() => import('./pages/Recensioni'));
const Servizi           = lazy(() => import('./pages/Servizi'));
const Settings          = lazy(() => import('./pages/Settings'));
const SharedDocuments   = lazy(() => import('./pages/SharedDocuments'));
const SupplierOnboarding = lazy(() => import('./pages/SupplierOnboarding'));
const OnboardingStaff   = lazy(() => import('./pages/OnboardingStaff'));
const Termini           = lazy(() => import('./pages/Termini'));
const UploadDocument    = lazy(() => import('./pages/UploadDocument'));

export const PAGES = {
    "Admin": Admin,
    "AreaPrivata": AreaPrivata,
    "Appuntamenti": Calcolatore,       // legacy redirect → Calcolatore
    "Blog": Blog,
    "BlogPost": BlogPost,
    "Calcolatore": Calcolatore,
    "Certificati": Certificati,
    "ChiSiamo": ChiSiamo,
    "ClientChat": Messages,            // legacy redirect → Messages
    "Collaboratori": Collaboratori,
    "CompanyDashboard": Dashboard,     // legacy redirect → Dashboard
    "CantieriDashboard": CantieriDashboard,
    "Contatti": Contatti,
    "Cookie": Cookie,
    "Clienti": Clienti,
    "DailyLogs": DailyLogs,
    "Tasks": Tasks,
    "Dashboard": Dashboard,
    "Documents": Documents,
    "FlussoDiLavoro": FlussoDiLavoro,
    "Fornitori": Fornitori,
    "Home": Home,
    "Messages": Messages,
    "MyAppointments": MyAppointments,
    "Pagamenti": Pagamenti,
    "PdfEditor": PdfEditor,
    "Preventivi": Preventivi,
    "Prezzi": Prezzi,
    "CodiceReferral": CodiceReferral,
    "Privacy": Privacy,
    "Recensioni": Recensioni,
    "Servizi": Servizi,
    "Settings": Settings,
    "SharedDocuments": SharedDocuments,
    "SupplierOnboarding": SupplierOnboarding,
    "onboarding-staff": OnboardingStaff,
    "Termini": Termini,
    "UploadDocument": UploadDocument,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
