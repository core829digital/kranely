import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  LogOut,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  LayoutDashboard,
  FileText,
  MessageSquare,
  Settings,
  FolderOpen,
  Upload,
  Share2,
  Calendar,
  Users,
  Users2,
  HardHat,
  Receipt,
  Shield,
  Truck,
  CreditCard,
  Briefcase,
  Tag,
  GitBranch,
  Home,
  Cloud,
  Palette,
} from 'lucide-react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useQuery } from 'convex/react';
import { api } from '../../../../../Backend/convex/_generated/api';
import StorageWidget from './StorageWidget';

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
const ROUTES = {
  Dashboard: '/Dashboard',
  Documents: '/Documents',
  UploadDocument: '/UploadDocument',
  SharedDocuments: '/SharedDocuments',
  Messages: '/Messages',
  Appointments: '/Appointments',
  Settings: '/Settings',
  Projects: '/Projects',
  Clients: '/Clients',
  Quotes: '/Quotes',
  Admin: '/Admin',
  Suppliers: '/Suppliers',
  Collaborators: '/Collaborators',
  Certificates: '/Certificates',
  Payments: '/Payments',
  DailyLogs: '/DailyLogs',
  ReferralCode: '/ReferralCode',
  Workflow: '/Workflow',
  Tasks: '/Tasks',
  Storage: '/Storage',
  Whitelabel: '/Whitelabel',
};

// ---------------------------------------------------------------------------
// Role helpers
// ---------------------------------------------------------------------------
const getRoleConfig = (role) => {
  const r = (role || '').toLowerCase();
  if (r === 'superadmin' || r === 'admin') return { label: 'Admin', color: 'text-[#FFC703]' };
  if (r === 'supplier') return { label: 'Supplier', color: 'text-amber-400' };
  if (r === 'client') return { label: 'Client', color: 'text-[#F0EBE8]/70' };
  if (r.startsWith('collaborator')) return { label: 'Collaborator', color: 'text-[#FFC703]/70' };
  return { label: 'Pending', color: 'text-white/30' };
};

const checkIsAdmin = (role) => {
  const r = (role || '').toLowerCase();
  return r === 'admin' || r === 'superadmin';
};

const checkIsSupplier = (role) => (role || '').toLowerCase() === 'supplier';
const checkIsClient = (role) => (role || '').toLowerCase() === 'client';
const checkIsCollaborator = (role) =>
  (role || '').toLowerCase().startsWith('collaborator');

// ---------------------------------------------------------------------------
// Menu structure
// ---------------------------------------------------------------------------
const getMenuItems = (role, t) => {
  const admin = checkIsAdmin(role);
  const supplier = checkIsSupplier(role);
  const client = checkIsClient(role);
  const collaborator = checkIsCollaborator(role);

  return [
    {
      id: 'dashboard',
      label: t('nav.dashboard'),
      icon: LayoutDashboard,
      path: ROUTES.Dashboard,
      single: true,
    },
    {
      id: 'operations',
      label: t('common.operations') || 'Operations',
      icon: Briefcase,
      group: true,
      children: [
        (admin || supplier) && {
          id: 'suppliers',
          label: t('nav.suppliers'),
          icon: Truck,
          path: ROUTES.Suppliers,
        },
        (admin || supplier) && {
          id: 'workflow',
          label: t('nav.workflow') || 'Workflow',
          icon: GitBranch,
          path: ROUTES.Workflow,
        },
        (admin || collaborator) && {
          id: 'projects',
          label: t('nav.projects'),
          icon: HardHat,
          path: ROUTES.Projects,
        },
        admin && {
          id: 'quotes',
          label: t('nav.quotes'),
          icon: Receipt,
          path: ROUTES.Quotes,
        },
        {
          id: 'payments',
          label: t('nav.payments'),
          icon: CreditCard,
          path: ROUTES.Payments,
        },
        collaborator && {
          id: 'dailylogs',
          label: t('nav.dailylogs') || 'Time Logs',
          icon: Briefcase,
          path: ROUTES.DailyLogs,
        },
        {
          id: 'appointments',
          label: t('nav.appointments'),
          icon: Calendar,
          path: ROUTES.Appointments,
        },
      ].filter(Boolean),
    },
    admin && {
      id: 'crm',
      label: t('nav.crm') || 'CRM & Admin',
      icon: Shield,
      group: true,
      children: [
        { id: 'clients', label: t('nav.clients'), icon: Users, path: ROUTES.Clients },
        {
          id: 'collaborators',
          label: t('nav.collaborators'),
          icon: Users2,
          path: ROUTES.Collaborators,
        },
        {
          id: 'certificates',
          label: t('nav.certificates'),
          icon: Shield,
          path: ROUTES.Certificates,
        },
        {
          id: 'adminpanel',
          label: t('nav.admin') || 'Admin Panel',
          icon: Shield,
          path: ROUTES.Admin,
        },
      ],
    },
    admin && {
      id: 'marketing',
      label: t('nav.marketing') || 'Marketing',
      icon: Tag,
      group: true,
      children: [
      ],
    },
    {
      id: 'archive',
      label: t('nav.archive') || 'Archive & Chat',
      icon: FileText,
      group: true,
      children: [
        {
          id: 'documents',
          label: t('nav.documents'),
          icon: FolderOpen,
          path: ROUTES.Documents,
        },
        {
          id: 'upload',
          label: t('documents.upload'),
          icon: Upload,
          path: ROUTES.UploadDocument,
        },
        {
          id: 'shared',
          label: t('nav.shared') || 'Shared',
          icon: Share2,
          path: ROUTES.SharedDocuments,
        },
        (admin || client || collaborator) && {
          id: 'messages',
          label: t('nav.messages'),
          icon: MessageSquare,
          path: ROUTES.Messages,
        },
      ].filter(Boolean),
    },
    {
      id: 'settings',
      icon: Settings,
      label: t('nav.settings') || 'Settings & More',
      group: true,
      children: [
        { id: 'settings-main', label: t('nav.settings'), icon: Settings, path: ROUTES.Settings },
        { id: 'storage', label: t('nav.storage') || 'Storage', icon: Cloud, path: ROUTES.Storage },
        admin && { id: 'whitelabel', label: t('nav.whitelabel'), icon: Palette, path: ROUTES.Whitelabel },
        admin && { id: 'referral', label: 'Referral Code', icon: Tag, path: ROUTES.ReferralCode },
      ].filter(Boolean),
    },
  ].filter(Boolean);
};

// ---------------------------------------------------------------------------
// NavItem — leaf link
// ---------------------------------------------------------------------------
const NavItem = ({ item, collapsed, isActive, onClick }) => {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={[
        'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg mx-2 transition-all duration-150',
        isActive
          ? 'bg-[#FFC703]/10 text-[#FFC703] border-l-2 border-[#FFC703] pl-[10px]'
          : 'text-white/60 hover:bg-white/5 hover:text-white/90 border-l-2 border-transparent',
      ].join(' ')}
    >
      <Icon
        size={18}
        className={`shrink-0 transition-colors ${
          isActive ? 'text-[#FFC703]' : 'text-white/50 group-hover:text-white/80'
        }`}
      />
      {!collapsed && (
        <span className="text-sm font-medium truncate leading-none">{item.label}</span>
      )}
      {collapsed && (
        <span
          className="
            pointer-events-none absolute left-full ml-3 z-50
            whitespace-nowrap rounded-md border border-white/10
            bg-[#1a1814] px-2 py-1 text-xs text-white shadow-lg
            opacity-0 transition-opacity duration-150 group-hover:opacity-100
          "
        >
          {item.label}
        </span>
      )}
    </Link>
  );
};

// ---------------------------------------------------------------------------
// FlyoutPanel — shown in collapsed mode when hovering a group
// ---------------------------------------------------------------------------
const FlyoutPanel = ({ group, location, onClose }) => {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  if (!group) return null;

  return (
    <motion.div
      ref={ref}
      key={group.id}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.15 }}
      className="
        fixed left-[72px] top-0 z-50 h-full w-52 py-4
        border-r border-white/5 shadow-2xl
      "
      style={{
        background: 'linear-gradient(180deg, #1c1a17 0%, #161410 100%)',
      }}
    >
      <p className="mb-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-white/30">
        {group.label}
      </p>
      <div className="flex flex-col gap-0.5">
        {group.children.map((child) => {
          const Icon = child.icon;
          const active = location.pathname === child.path;
          return (
            <Link
              key={child.id}
              to={child.path}
              onClick={onClose}
              className={[
                'flex items-center gap-3 border-l-2 px-4 py-2.5 transition-all duration-150',
                active
                  ? 'border-[#FFC703] bg-[#FFC703]/10 pl-[14px] text-[#FFC703]'
                  : 'border-transparent text-white/60 hover:bg-white/5 hover:text-white/90',
              ].join(' ')}
            >
              <Icon size={16} className="shrink-0" />
              <span className="text-sm font-medium">{child.label}</span>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
const VerticalMenu = ({ isCollapsed: externalCollapsed, onCollapse: externalOnCollapse }) => {
  const location = useLocation();
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const { t } = useTranslation();

  // Use external state if provided, otherwise use internal state
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const setCollapsed = externalOnCollapse || setInternalCollapsed;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [openGroups, setOpenGroups] = useState({});
  const [flyoutGroup, setFlyoutGroup] = useState(null);

  // Fetch Convex user for role
  const convexUser = useQuery(
    api.users?.getByEmail,
    clerkUser?.primaryEmailAddress?.emailAddress
      ? { email: clerkUser.primaryEmailAddress.emailAddress }
      : 'skip'
  );

  const role = convexUser?.role || '';
  const roleConfig = getRoleConfig(role);
  const isAdmin = checkIsAdmin(role);
  const menuItems = getMenuItems(role, t);

  // Storage stats — only fetched for admins (backend enforces this too)
  const storageData = useQuery(api.storageStats.getStats);

  // Derived display info
  const displayName =
    clerkUser?.fullName ||
    clerkUser?.primaryEmailAddress?.emailAddress ||
    'User';
  const avatarInitial = (displayName[0] || 'K').toUpperCase();
  // Get profile image from Convex storage
  const rawConvexImage = convexUser?.profile_image;
  const isFullUrl = rawConvexImage && rawConvexImage.startsWith('http');
  
  // Get resolved URL from Convex storage
  let avatarUrl = null;
  if (rawConvexImage) {
    if (isFullUrl) {
      // Already a full URL
      avatarUrl = rawConvexImage;
    } else {
      // It's a storage ID - resolve it
      const resolvedUrl = useQuery(api.files.getFileUrl, { storageId: rawConvexImage });
      avatarUrl = resolvedUrl;
    }
  }

  // ---------------------------------------------------------------------------
  // CSS variable sync
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const update = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Sync with parent component's sidebar width
      document.documentElement.style.setProperty(
        '--sidebar-w',
        mobile ? '0px' : collapsed ? '72px' : '264px'
      );
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [collapsed]);

  // Sync internal state with external state changes
  useEffect(() => {
    if (externalCollapsed !== undefined && externalCollapsed !== internalCollapsed) {
      setInternalCollapsed(externalCollapsed);
    }
  }, [externalCollapsed]);

  // ---------------------------------------------------------------------------
  // Auto-open active group on route change
  // ---------------------------------------------------------------------------
  useEffect(() => {
    menuItems.forEach((item) => {
      if (item.group && item.children) {
        const anyActive = item.children.some(
          (c) => location.pathname === c.path
        );
        if (anyActive) {
          setOpenGroups((prev) => ({ ...prev, [item.id]: true }));
        }
      }
    });
  }, [location.pathname]);

  // Close mobile drawer & flyout on navigation
  useEffect(() => {
    setMobileOpen(false);
    setFlyoutGroup(null);
  }, [location.pathname]);

  // Close flyout when expanding sidebar
  useEffect(() => {
    if (!collapsed) setFlyoutGroup(null);
  }, [collapsed]);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const toggleGroup = (id) =>
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));

  const isGroupActive = (item) =>
    item.children?.some((c) => location.pathname === c.path);

  // ---------------------------------------------------------------------------
  // Sidebar content
  // ---------------------------------------------------------------------------
  const renderSidebarContent = (forceExpanded = false) => {
    const expanded = forceExpanded || !collapsed;

    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* ---- Header ---- */}
        <div
          className={`flex h-[60px] shrink-0 items-center border-b border-white/8 px-3 ${
            expanded ? 'justify-between' : 'justify-center'
          }`}
        >
          {expanded ? (
            <>
              <Link
                to={ROUTES.Dashboard}
                className="select-none flex items-center gap-2.5 group"
              >
                {/* Kranely K. Logo SVG */}
                <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 10H32V42L58 10H78L50 48L80 90H60L38 58L32 65V90H15V10Z" fill="#FFC703" stroke="#B8860B" strokeWidth="2"/>
                  <path d="M80 85H87V92H80V85Z" fill="#FFC703" stroke="#B8860B" strokeWidth="1.5"/>
                  <path d="M15 10H25V20H15V10Z" fill="#B8860B" opacity="0.4"/>
                  <path d="M58 10H68L50 35L58 10Z" fill="#B8860B" opacity="0.3"/>
                </svg>
                <span className="text-white font-bold text-lg tracking-tight leading-none">
                  ranely<span className="text-[#FFC703]">.</span>
                </span>
              </Link>
              <button
                onClick={() =>
                  forceExpanded ? setMobileOpen(false) : setCollapsed(true)
                }
                className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/5 hover:text-white/80"
                aria-label="Collapse sidebar"
              >
                {forceExpanded ? <X size={18} /> : <ChevronRight size={18} />}
              </button>
            </>
          ) : (
            <button
              onClick={() => setCollapsed(false)}
              className="rounded-md p-1 text-white/40 transition-colors hover:bg-white/5 hover:text-white/80"
              aria-label="Expand sidebar"
            >
              {/* K. logo small */}
              <svg width="26" height="26" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 10H32V42L58 10H78L50 48L80 90H60L38 58L32 65V90H15V10Z" fill="#FFC703" stroke="#B8860B" strokeWidth="2"/>
                <path d="M80 85H87V92H80V85Z" fill="#FFC703" stroke="#B8860B" strokeWidth="1.5"/>
              </svg>
            </button>
          )}
        </div>


        {/* ---- Nav ---- */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-0.5 scrollbar-thin scrollbar-thumb-white/10">
          {menuItems.map((item) => {
            // Single leaf item
            if (item.single) {
              return (
                <NavItem
                  key={item.id}
                  item={item}
                  collapsed={!expanded}
                  isActive={location.pathname === item.path}
                  onClick={() => forceExpanded && setMobileOpen(false)}
                />
              );
            }

            // Group item
            if (item.group) {
              const active = isGroupActive(item);
              const open = openGroups[item.id];
              const GroupIcon = item.icon;

              return (
                <div
                  key={item.id}
                  onMouseEnter={() => {
                    if (!expanded && !isMobile) setFlyoutGroup(item);
                  }}
                  onMouseLeave={() => {
                    if (!expanded && !isMobile) setFlyoutGroup(null);
                  }}
                >
                  {/* Group header button */}
                  <button
                    onClick={() => {
                      if (expanded) {
                        toggleGroup(item.id);
                      } else {
                        setFlyoutGroup((prev) =>
                          prev?.id === item.id ? null : item
                        );
                      }
                    }}
                    title={!expanded ? item.label : undefined}
                    className={[
                      'group relative mx-2 flex w-[calc(100%-16px)] items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-150',
                      expanded ? 'justify-between' : 'justify-center',
                      active
                        ? 'text-[#FFC703]'
                        : 'text-white/50 hover:bg-white/5 hover:text-white/80',
                      flyoutGroup?.id === item.id && !expanded
                        ? 'bg-white/5 text-white/80'
                        : '',
                    ].join(' ')}
                  >
                    <div className="flex items-center gap-3">
                      <GroupIcon
                        size={18}
                        className={`shrink-0 ${
                          active
                            ? 'text-[#FFC703]'
                            : 'text-white/40 group-hover:text-white/70'
                        }`}
                      />
                      {expanded && (
                        <span className="text-xs font-semibold uppercase tracking-wider">
                          {item.label}
                        </span>
                      )}
                    </div>

                    {expanded && (
                      <motion.span
                        animate={{ rotate: open ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center"
                      >
                        <ChevronRight size={14} className="text-white/30" />
                      </motion.span>
                    )}

                    {/* Collapsed tooltip */}
                    {!expanded && (
                      <span
                        className="
                          pointer-events-none absolute left-full ml-3 z-50
                          whitespace-nowrap rounded-md border border-white/10
                          bg-[#1a1814] px-2 py-1 text-xs text-white shadow-lg
                          opacity-0 transition-opacity duration-150 group-hover:opacity-100
                        "
                      >
                        {item.label}
                      </span>
                    )}
                  </button>

                  {/* Expanded children */}
                  {expanded && (
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mb-1 ml-4 mt-0.5 space-y-0.5 border-l border-white/5 pl-1">
                            {item.children.map((child) => (
                              <NavItem
                                key={child.id}
                                item={child}
                                collapsed={false}
                                isActive={location.pathname === child.path}
                                onClick={() =>
                                  forceExpanded && setMobileOpen(false)
                                }
                              />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              );
            }

            return null;
          })}
        </nav>

        {/* ---- StorageWidget (admin only, hidden when collapsed) ---- */}
        {isAdmin && expanded && storageData && (
          <div className="px-3 pb-2">
            <StorageWidget storageData={storageData} isCollapsed={false} />
          </div>
        )}

        {/* ---- Back to Site + User footer ---- */}
        <div className="shrink-0 border-t border-white/5">
          {/* Back to Site link */}
          {expanded ? (
            <Link
              to="/"
              className="flex items-center gap-2.5 mx-3 mt-3 mb-1 px-3 py-2 rounded-lg text-white/40 hover:text-[#FFC703]/80 hover:bg-[#FFC703]/5 transition-all text-xs font-medium"
              title="Back to site"
            >
              <Home size={14} className="shrink-0" />
              <span>Back to Site</span>
            </Link>
          ) : (
            <div className="flex justify-center mt-2">
              <Link
                to="/"
                title="Back to site"
                className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-[#FFC703]/10 hover:text-[#FFC703]/70"
              >
                <Home size={15} />
              </Link>
            </div>
          )}

          <div className="p-3">
          {expanded ? (
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#FFC703]/30 bg-[#FFC703]/20">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold text-[#FFC703]">
                    {avatarInitial}
                  </span>
                )}
              </div>

              {/* Name + role */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-tight text-white/90">
                  {displayName}
                </p>
                <span className={`text-xs font-medium ${roleConfig.color}`}>
                  {roleConfig.label}
                </span>
              </div>

              {/* Sign out */}
              <button
                onClick={() => signOut()}
                title="Sign out"
                className="shrink-0 rounded-md p-1.5 text-white/30 transition-colors hover:bg-red-400/10 hover:text-red-400"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-[#FFC703]/30 bg-[#FFC703]/20">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold text-[#FFC703]">
                    {avatarInitial}
                  </span>
                )}
              </div>
              <button
                onClick={() => signOut()}
                title="Sign out"
                className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-red-400/10 hover:text-red-400"
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
          </div>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <>
      {/* Mobile toggle button */}
      {isMobile && !mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="
            fixed left-3 top-3 z-40 md:hidden
            rounded-lg border border-white/10 bg-[#141210] p-2
            text-white/70 shadow-lg hover:text-white
          "
        >
          <Menu size={20} />
        </button>
      )}

      {/* ---- Desktop sidebar ---- */}
      {!isMobile && (
        <aside
          style={{
            background: 'linear-gradient(180deg, #141210 0%, #111009 100%)',
            borderRight: '1px solid rgba(255,255,255,0.05)',
            width: collapsed ? '72px' : '264px',
            transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
            overflow: 'hidden',
          }}
          className="fixed left-0 top-0 z-30 flex h-screen flex-col"
        >
          {renderSidebarContent()}

          {/* Collapsed flyout */}
          <AnimatePresence>
            {collapsed && flyoutGroup && (
              <FlyoutPanel
                group={flyoutGroup}
                location={location}
                onClose={() => setFlyoutGroup(null)}
              />
            )}
          </AnimatePresence>
        </aside>
      )}

      {/* ---- Mobile drawer ---- */}
      {isMobile && (
        <AnimatePresence>
          {mobileOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                onClick={() => setMobileOpen(false)}
              />

              {/* Drawer */}
              <motion.aside
                key="drawer"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                style={{
                  background:
                    'linear-gradient(180deg, #141210 0%, #111009 100%)',
                  borderRight: '1px solid rgba(255,255,255,0.05)',
                }}
                className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col"
              >
                {renderSidebarContent(true)}
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      )}
    </>
  );
};

export default VerticalMenu;
