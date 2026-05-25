import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Home,
  LayoutDashboard,
  FileText,
  MessageSquare,
  Settings,
  FolderOpen,
  Upload,
  Share2,
  Calendar,
  Users,
  Building,
  HardHat,
  Receipt,
  Shield,
  Truck,
  QrCode,
  CreditCard,
  Briefcase,
  Euro,
  Tag,
  GitBranch
} from 'lucide-react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useQuery } from "convex/react";
import { api } from "../../../../../Backend/convex/_generated/api";
import StorageWidget from "./StorageWidget";

// Helper function to create page URLs (simplified for now)
const createPageUrl = (page) => {
  const routes = {
    Dashboard: '/Dashboard',
    Documents: '/Documents',
    UploadDocument: '/UploadDocument',
    SharedDocuments: '/SharedDocuments',
    Messages: '/Messages',
    MyAppointments: '/MyAppointments',
    Settings: '/Settings',
    ClientChat: '/ClientChat',
    CantieriDashboard: '/CantieriDashboard',
    Clienti: '/Clienti',
    Preventivi: '/Preventivi',
    Admin: '/Admin',
    Fornitori: '/Fornitori',
    Collaboratori: '/Collaboratori',
    Certificati: '/Certificati',
    Pagamenti: '/Pagamenti',
    DailyLogs: '/DailyLogs',
    Prezzi: '/Prezzi',
    CodiceReferral: '/CodiceReferral',
    FlussoDiLavoro: '/FlussoDiLavoro',
  };
  return routes[page] || '/Dashboard';
};

const getMenuItems = (user) => {
  const role = user?.role || 'user';
  const isAdmin = role === 'admin' || role === 'superadmin';
  const isSupplier = role === 'supplier';
  const isCollaborator = role === 'collaborator_internal' || role === 'collaborator_external' || role === 'collaborator';
  const isSupervisor = false;
  const isClient = role === 'client';

  // Role display config
  const roleConfig = {
    superadmin: { label: 'SuperAdmin', color: 'text-purple-400', ring: 'ring-purple-500', bg: 'bg-purple-500/20' },
    admin: { label: 'Admin', color: 'text-emerald-400', ring: 'ring-emerald-500', bg: 'bg-emerald-500/20' },
    supplier: { label: 'Fornitore', color: 'text-orange-400', ring: 'ring-orange-500', bg: 'bg-orange-500/20' },
    client: { label: 'Cliente', color: 'text-blue-400', ring: 'ring-blue-500', bg: 'bg-blue-500/20' },
    collaborator: { label: 'Collaboratore', color: 'text-indigo-400', ring: 'ring-indigo-500', bg: 'bg-indigo-500/20' },
    collaborator_internal: { label: 'Collaboratore', color: 'text-indigo-400', ring: 'ring-indigo-500', bg: 'bg-indigo-500/20' },
    collaborator_external: { label: 'Collaboratore', color: 'text-indigo-400', ring: 'ring-indigo-500', bg: 'bg-indigo-500/20' },
  };
  const rc = roleConfig[role] || { label: 'In Attesa', color: 'text-gray-400', ring: 'ring-gray-500', bg: 'bg-gray-500/20' };

  // Build menu based on role
  const items = [];

  // 1. Dashboard — visible to all
  items.push({ name: 'Dashboard', page: 'Dashboard', icon: LayoutDashboard });

  // 2. Area Operativa
  const opGroup = [];
  if (isAdmin || isSupplier) opGroup.push({ name: 'Fornitori', page: 'Fornitori', icon: Truck });
  if (isAdmin || isSupplier) opGroup.push({ name: 'Flusso di Lavoro', page: 'FlussoDiLavoro', icon: GitBranch });
  if (isAdmin || isSupervisor || isCollaborator) opGroup.push({ name: 'Cantieri', page: 'CantieriDashboard', icon: HardHat });
  if (isAdmin) opGroup.push({ name: 'Preventivi', page: 'Preventivi', icon: Receipt });
  if (isAdmin || isSupplier || isCollaborator || isClient) opGroup.push({ name: 'Pagamenti', page: 'Pagamenti', icon: CreditCard });
  if (isCollaborator) opGroup.push({ name: 'Log Ore', page: 'DailyLogs', icon: Briefcase });
  opGroup.push({ name: 'Appuntamenti', page: 'MyAppointments', icon: Calendar });

  if (opGroup.length > 0) items.push({ name: 'Area Operativa', icon: Briefcase, isGroup: true, subItems: opGroup });

  // 3. CRM & Admin
  const crmGroup = [];
  if (isAdmin) crmGroup.push({ name: 'Clienti', page: 'Clienti', icon: Users });
  if (isAdmin) crmGroup.push({ name: 'Collaboratori', page: 'Collaboratori', icon: Briefcase });
  if (isAdmin || isSupervisor || isCollaborator) crmGroup.push({ name: 'Certificati', page: 'Certificati', icon: Shield });
  if (isAdmin) crmGroup.push({ name: 'Pannello Admin', page: 'Admin', icon: Shield });

  if (crmGroup.length > 0) items.push({ name: 'CRM & Admin', icon: Shield, isGroup: true, subItems: crmGroup });

  // 4. Marketing (admin only)
  if (isAdmin) {
    items.push({
      name: 'Marketing',
      icon: Tag,
      isGroup: true,
      subItems: [
        { name: 'Prezzi', page: 'Prezzi', icon: Euro },
        { name: 'Codice Referral', page: 'CodiceReferral', icon: Tag },
      ],
    });
  }

  // 5. Archivio & Chat
  const docGroup = [
    { name: 'I Miei Documenti', page: 'Documents', icon: FolderOpen },
    { name: 'Carica Documento', page: 'UploadDocument', icon: Upload },
    { name: 'Condivisi con me', page: 'SharedDocuments', icon: Share2 }
  ];
  if (isAdmin || isClient || isCollaborator) docGroup.push({ name: 'Messaggi', page: 'Messages', icon: MessageSquare });

  items.push({ name: 'Archivio & Chat', icon: FileText, isGroup: true, subItems: docGroup });


  // 6. Settings
  items.push({ name: 'Impostazioni', page: 'Settings', icon: Settings, subItems: [] });

  return items;
};




export default function VerticalMenu({ isCollapsed = false, onCollapse }) {
  const location = useLocation();
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState([]);
  const [flyoutGroup, setFlyoutGroup] = useState(null);
  const [flyoutTop, setFlyoutTop] = useState(0);

  // Fetch user role from Convex database (source of truth for roles)
  // Skip when email is not yet available — avoids querying with empty string
  const convexUser = useQuery(
    api.users.getByEmail,
    clerkUser?.primaryEmailAddress?.emailAddress
      ? { email: clerkUser.primaryEmailAddress.emailAddress }
      : "skip"
  );

  const isAdmin = convexUser?.role === 'admin' || convexUser?.role === 'superadmin';

  const storageStats = useQuery(
    api.storageStats.getStats,
    isAdmin ? {} : "skip"
  );

  // Map user data for getMenuItems - using Convex role instead of Clerk metadata
  const user = clerkUser ? {
    email: clerkUser.primaryEmailAddress?.emailAddress,
    full_name: clerkUser.fullName,
    role: convexUser?.role || null, // Get role from Convex, null if not assigned
    profile_image: convexUser?.profile_image,
  } : null;

  // Role display config for the UI badge
  const roleConfig = {
    superadmin: { label: 'SuperAdmin', color: 'text-purple-400', ring: 'ring-purple-500', bg: 'bg-purple-500/20' },
    admin: { label: 'Admin', color: 'text-emerald-400', ring: 'ring-emerald-500', bg: 'bg-emerald-500/20' },
    supplier: { label: 'Fornitore', color: 'text-orange-400', ring: 'ring-orange-500', bg: 'bg-orange-500/20' },
    client: { label: 'Cliente', color: 'text-blue-400', ring: 'ring-blue-500', bg: 'bg-blue-500/20' },
    collaborator: { label: 'Collaboratore', color: 'text-indigo-400', ring: 'ring-indigo-500', bg: 'bg-indigo-500/20' },
    collaborator_internal: { label: 'Collaboratore', color: 'text-indigo-400', ring: 'ring-indigo-500', bg: 'bg-indigo-500/20' },
    collaborator_external: { label: 'Collaboratore', color: 'text-indigo-400', ring: 'ring-indigo-500', bg: 'bg-indigo-500/20' },
  };
  const rc = roleConfig[user?.role || ''] || { label: 'In Attesa', color: 'text-gray-400', ring: 'ring-gray-500', bg: 'bg-gray-500/20' };

  // Auto-close menu on mobile when clicking a link
  React.useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsMobileOpen(false);
    }
  }, [location]);

  // Sync CSS variables so Radix UI dialogs/overlays center within the actual content area
  // --sidebar-w        : width occupied by the sidebar (0px mobile, 80/280px desktop)
  // --private-header-h : height of the fixed top navbar (always 76px in private area)
  // --scrollbar-w      : classic scrollbar width (≈15px on Windows, 0 on Mac overlay).
  //   Used in dialog centering to offset 100vw (which includes the scrollbar gutter)
  //   so the dialog appears perfectly centred in the *visible* content area.
  //   We skip this measurement while a Radix modal is open (body.overflow===hidden)
  //   to avoid overwriting the cached value now that the scrollbar has been removed.
  React.useEffect(() => {
    const update = () => {
      const isMobile = window.innerWidth < 1024;
      document.documentElement.style.setProperty(
        '--sidebar-w',
        isMobile ? '0px' : (isCollapsed ? '80px' : '280px')
      );
      document.documentElement.style.setProperty('--private-header-h', '76px');
      // Only measure scrollbar width when no modal has locked the body scroll.
      // window.innerWidth includes the scrollbar; clientWidth excludes it.
      if (document.body.style.overflow !== 'hidden') {
        const sw = window.innerWidth - document.documentElement.clientWidth;
        document.documentElement.style.setProperty('--scrollbar-w', `${sw}px`);
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
      // Reset when leaving private area
      document.documentElement.style.removeProperty('--sidebar-w');
      document.documentElement.style.removeProperty('--private-header-h');
      document.documentElement.style.removeProperty('--scrollbar-w');
    };
  }, [isCollapsed]);

  // Sincronizza il gruppo aperto in base alla route (pagina) corrente
  React.useEffect(() => {
    const currentPath = location.pathname.toLowerCase();
    const items = getMenuItems(user);
    const activeGroup = items.find(g =>
      g.isGroup && g.subItems?.some(sub => {
        const sp = createPageUrl(sub.page).toLowerCase();
        return currentPath === sp || (sp !== '/' && currentPath.startsWith(sp));
      })
    );
    // Se stiamo navigando su una pagina che fa parte di un gruppo e 
    // quel gruppo non è attualmente aperto, lo aggiungiamo a quelli aperti.
    if (activeGroup && !openGroups.includes(activeGroup.name)) {
      setOpenGroups(prev => [...prev, activeGroup.name]);
    }
  }, [location.pathname, user?.role]);


  // Close flyout when sidebar expands
  React.useEffect(() => {
    if (!isCollapsed) setFlyoutGroup(null);
  }, [isCollapsed]);

  // Close flyout on navigation
  React.useEffect(() => {
    setFlyoutGroup(null);
  }, [location.pathname]);

  // Close flyout when clicking outside
  React.useEffect(() => {
    if (!flyoutGroup) return;
    const handler = (e) => {
      if (!e.target.closest('[data-sidebar-flyout]') && !e.target.closest('[data-sidebar-group-btn]')) {
        setFlyoutGroup(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [flyoutGroup]);

  const menuItems = getMenuItems(user);

  const handleLogout = async () => {
    await signOut();
  };



  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed z-[150] p-3 bg-[#343a40] rounded-xl shadow-2xl hover:bg-[#495057] transition-all"
        style={{ top: 'calc(1rem + env(safe-area-inset-top))', left: 'calc(1rem + env(safe-area-inset-left))' }}
      >
        {isMobileOpen ? <X size={20} className="text-[#f8f9fa]" /> : <Menu size={20} className="text-[#f8f9fa]" />}
      </button>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/50 z-[140]"
          />
        )}
      </AnimatePresence>

      {/* Vertical Menu */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? 80 : 280,
          x: isMobileOpen || window.innerWidth >= 1024 ? 0 : -280
        }}
        transition={{
          // Match the CSS cubic-bezier used for content margin / top-bar transition
          width: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
          x: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
        }}
        className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-[#212529] to-[#343a40] border-r border-[#f8f9fa]/10 z-[145] shadow-2xl ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } transition-transform lg:transition-none`}
        style={{ paddingLeft: 'env(safe-area-inset-left)' }}
      >
        <div className="flex flex-col h-full">
          {/* Header — h-[76px] on desktop to align its border with the top-bar border */}
          <div className={`border-b border-[#f8f9fa]/10 ${
            isCollapsed
              ? 'flex flex-col items-center justify-center pt-20 pb-3 gap-2 lg:pt-0 lg:pb-0 lg:h-[76px]'
              : 'flex items-center justify-between p-4 pt-20 lg:pt-0 lg:pb-0 lg:h-[76px] lg:px-3'
          }`}>
            {isCollapsed ? (
              <>
                {/* Avatar — shown centered when sidebar is collapsed */}
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold overflow-hidden ring-2 ${rc.ring} shadow-md flex-shrink-0`}>
                  {user?.profile_image ? (
                    <img src={user.profile_image} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm">{user?.full_name?.[0] || user?.email?.[0] || 'U'}</span>
                  )}
                </div>
                {/* Chevron to expand — desktop only */}
                <button
                  onClick={() => onCollapse(!isCollapsed)}
                  className="hidden lg:flex items-center justify-center p-1 hover:bg-[#f8f9fa]/10 rounded-lg transition-all"
                >
                  <ChevronRight size={16} className="text-[#adb5bd]" />
                </button>
              </>
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold overflow-hidden ring-2 ${rc.ring} shadow-md flex-shrink-0`}>
                    {user?.profile_image ? (
                      <img src={user.profile_image} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      user?.full_name?.[0] || user?.email?.[0] || 'U'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#f8f9fa] truncate">
                      {user?.full_name || user?.email}
                    </p>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${rc.bg} ${rc.color}`}>
                      {rc.label}
                    </span>
                  </div>
                </motion.div>
                {/* Chevron to collapse — desktop only */}
                <button
                  onClick={() => onCollapse(!isCollapsed)}
                  className="hidden lg:flex items-center justify-center p-1.5 hover:bg-[#f8f9fa]/10 rounded-lg transition-all flex-shrink-0"
                >
                  <ChevronRight
                    size={20}
                    className="text-[#f8f9fa] transition-transform rotate-180"
                  />
                </button>
              </>
            )}
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;

              if (item.isGroup) {
                const isOpen = openGroups.includes(item.name);
                const hasActiveSub = item.subItems.some(sub => {
                  const sp = createPageUrl(sub.page).toLowerCase();
                  const cp = location.pathname.toLowerCase();
                  return cp === sp || (sp !== '/' && cp.startsWith(sp));
                });

                return (
                  <div key={item.name} className="mb-1 text-[#dee2e6]">
                    <button
                      data-sidebar-group-btn="true"
                      title={isCollapsed ? item.name : undefined}
                      onClick={(e) => {
                        if (isCollapsed) {
                          // Show flyout instead of expanding the sidebar
                          const rect = e.currentTarget.getBoundingClientRect();
                          setFlyoutTop(rect.top);
                          setFlyoutGroup(prev => prev === item.name ? null : item.name);
                          return;
                        }
                        setOpenGroups(prev =>
                          prev.includes(item.name)
                            ? prev.filter(g => g !== item.name)
                            : [...prev, item.name]
                        );
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                        isCollapsed && flyoutGroup === item.name
                          ? 'bg-[#f8f9fa]/15'
                          : hasActiveSub ? 'bg-[#f8f9fa]/5' : 'hover:bg-[#f8f9fa]/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={20} className="flex-shrink-0" />
                        {!isCollapsed && <span className="font-medium text-sm">{item.name}</span>}
                      </div>
                      {!isCollapsed && (
                        <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                      )}
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && !isCollapsed && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden ml-4 mt-1 border-l border-[#495057] pl-2 space-y-1"
                        >
                          {item.subItems.map(subItem => {
                            const SubIcon = subItem.icon;
                            const linkPath = createPageUrl(subItem.page).toLowerCase();
                            const currentPath = location.pathname.toLowerCase();
                            const isActive = currentPath === linkPath || (linkPath !== '/' && currentPath.startsWith(linkPath));
                            return (
                              <Link
                                key={subItem.page}
                                to={createPageUrl(subItem.page)}
                                onClick={() => setIsMobileOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-xs ${isActive
                                  ? 'bg-blue-600/20 text-blue-400 font-medium'
                                  : 'text-[#adb5bd] hover:bg-[#f8f9fa]/10 hover:text-[#f8f9fa]'
                                  }`}
                              >
                                <SubIcon size={16} className="flex-shrink-0" />
                                <span>{subItem.name}</span>
                              </Link>
                            )
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              } else {
                const linkPath = createPageUrl(item.page).toLowerCase();
                const currentPath = location.pathname.toLowerCase();
                const isActive = currentPath === linkPath || (linkPath !== '/' && currentPath.startsWith(linkPath));

                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm'
                      : 'text-[#dee2e6] hover:bg-[#f8f9fa]/10'
                      }`}
                  >
                    <Icon size={20} className="flex-shrink-0" />
                    {!isCollapsed && (
                      <span className="font-medium text-sm">{item.name}</span>
                    )}
                  </Link>
                );
              }
            })}
          </nav>

          {/* Storage widget - solo admin */}
          {isAdmin && (
            <StorageWidget isCollapsed={isCollapsed} storageData={storageStats} />
          )}

          {/* Footer */}
          <div className="p-3 border-t border-[#f8f9fa]/10" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
            {/* Back to public site */}
            <Link
              to="/"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#dee2e6] hover:bg-[#f8f9fa]/10 hover:text-[#f8f9fa] transition-all mb-1"
              title="Torna al sito"
            >
              <Home size={20} className="flex-shrink-0" />
              {!isCollapsed && <span className="font-medium text-sm">Torna al Sito</span>}
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#dee2e6] hover:bg-red-500/20 hover:text-red-400 transition-all"
            >
              <LogOut size={20} className="flex-shrink-0" />
              {!isCollapsed && <span className="font-medium text-sm">Logout</span>}
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Collapsed sidebar flyout — appears to the right of the sidebar when a group icon is clicked */}
      <AnimatePresence>
        {isCollapsed && flyoutGroup && (() => {
          const group = menuItems.find(g => g.name === flyoutGroup);
          if (!group) return null;
          return (
            <motion.div
              key={flyoutGroup}
              data-sidebar-flyout="true"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
              className="fixed z-[146] min-w-[200px] bg-[#2d3238] border border-[#f8f9fa]/15 rounded-xl shadow-2xl overflow-hidden"
              style={{
                left: '84px',
                top: `${flyoutTop}px`,
                maxHeight: `calc(100vh - ${flyoutTop}px - 16px)`,
                overflowY: 'auto',
              }}
            >
              {/* Group label */}
              <div className="px-4 py-2 text-[10px] font-bold text-[#adb5bd] uppercase tracking-widest border-b border-[#f8f9fa]/10">
                {flyoutGroup}
              </div>
              {/* Sub-items */}
              {group.subItems.map(subItem => {
                const SubIcon = subItem.icon;
                const linkPath = createPageUrl(subItem.page).toLowerCase();
                const currentPath = location.pathname.toLowerCase();
                const isActive = currentPath === linkPath || (linkPath !== '/' && currentPath.startsWith(linkPath));
                return (
                  <Link
                    key={subItem.page}
                    to={createPageUrl(subItem.page)}
                    onClick={() => { setFlyoutGroup(null); setIsMobileOpen(false); }}
                    className={`flex items-center gap-3 px-4 py-2.5 transition-all text-sm ${
                      isActive
                        ? 'bg-blue-600/20 text-blue-400 font-medium'
                        : 'text-[#dee2e6] hover:bg-[#f8f9fa]/10 hover:text-[#f8f9fa]'
                    }`}
                  >
                    <SubIcon size={16} className="flex-shrink-0" />
                    <span>{subItem.name}</span>
                  </Link>
                );
              })}
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </>
  );
}