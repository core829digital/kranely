import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Settings,
  ChevronDown,
  FolderOpen,
  Upload,
  Share2,
  Calendar,
  Users,
  Building,
  Search
} from 'lucide-react';
import NotificationBell from './NotificationBell';
import GlobalSearch from './GlobalSearch';

const getMenuItems = (user) => {
  const baseItems = [
    {
      name: 'Dashboard',
      page: 'Dashboard',
      icon: LayoutDashboard,
      subItems: []
    },
    {
      name: 'Documenti',
      page: 'Documents',
      icon: FileText,
      subItems: [
        { name: 'I Miei Documenti', page: 'Documents', icon: FolderOpen },
        { name: 'Carica Documento', page: 'UploadDocument', icon: Upload },
        { name: 'Condivisi con me', page: 'SharedDocuments', icon: Share2 }
      ]
    },
    {
      name: 'Messaggi',
      page: 'Messages',
      icon: MessageSquare,
      subItems: []
    },
    {
      name: 'Appuntamenti',
      page: 'MyAppointments',
      icon: Calendar,
      subItems: []
    },
    {
      name: 'Impostazioni',
      page: 'Settings',
      icon: Settings,
      subItems: []
    }
  ];


  if (user?.role === 'admin') {
    baseItems.splice(4, 0, {
      name: 'Gestione',
      page: 'AdminAppointments',
      icon: Users,
      subItems: []
    });
  }

  return baseItems;
};

export default function PrivateAreaMenu() {
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    const getUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    getUser();
  }, []);

  const menuItems = getMenuItems(user);

  return (
    <div className="sticky top-[76px] z-[100] bg-gradient-to-r from-[#343a40] to-[#495057] border-b border-[#f8f9fa]/10 shadow-lg backdrop-blur-sm" style={{ overflow: 'visible' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6" style={{ overflow: 'visible' }}>
        <nav className="flex items-center gap-1 py-2 sm:py-3 flex-wrap" style={{ overflow: 'visible' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.includes(item.page.toLowerCase());
            const hasSubItems = item.subItems.length > 0;

            return (
              <div
                key={item.page}
                className="relative z-[110]"
                onMouseEnter={() => hasSubItems && setHoveredItem(item.name)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{ position: 'relative' }}
              >
                <Link
                  to={createPageUrl(item.page)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-[#f8f9fa]/20 text-[#f8f9fa]'
                      : 'text-[#dee2e6] hover:bg-[#f8f9fa]/10 hover:text-[#f8f9fa]'
                  }`}
                >
                  <Icon size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="hidden sm:inline">{item.name}</span>
                  {hasSubItems && <ChevronDown size={12} className="sm:w-[14px] sm:h-[14px]" />}
                </Link>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {hasSubItems && hoveredItem === item.name && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 mt-1 bg-gradient-to-br from-[#495057] to-[#6c757d] border border-[#f8f9fa]/20 rounded-xl shadow-2xl overflow-hidden min-w-[200px]"
                      style={{ zIndex: 9999 }}
                    >
                      {item.subItems.map((subItem) => {
                        const SubIcon = subItem.icon;
                        return (
                          <Link
                            key={subItem.page}
                            to={createPageUrl(subItem.page)}
                            className="flex items-center gap-3 px-4 py-3 text-[#dee2e6] hover:bg-[#f8f9fa]/10 hover:text-[#f8f9fa] transition-all"
                          >
                            <SubIcon size={16} />
                            <span className="text-sm">{subItem.name}</span>
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 rounded-lg hover:bg-[#f8f9fa]/10 transition-all"
              title="Ricerca globale"
            >
              <Search size={18} className="text-[#f8f9fa]" />
            </button>
            {user && <NotificationBell user={user} />}
          </div>
        </nav>
      </div>

      {/* Global Search Modal */}
      <AnimatePresence>
        {showSearch && user && (
          <GlobalSearch user={user} onClose={() => setShowSearch(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}