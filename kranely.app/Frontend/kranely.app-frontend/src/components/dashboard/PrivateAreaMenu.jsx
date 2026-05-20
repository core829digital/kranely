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
      name: 'Documents',
      page: 'Documents',
      icon: FileText,
      subItems: [
        { name: 'My Documents', page: 'Documents', icon: FolderOpen },
        { name: 'Upload Document', page: 'UploadDocument', icon: Upload },
        { name: 'Shared with Me', page: 'SharedDocuments', icon: Share2 }
      ]
    },
    {
      name: 'Messages',
      page: 'Messages',
      icon: MessageSquare,
      subItems: []
    },
    {
      name: 'Appointments',
      page: 'MyAppointments',
      icon: Calendar,
      subItems: []
    },
    {
      name: 'Settings',
      page: 'Settings',
      icon: Settings,
      subItems: []
    }
  ];


  if (user?.role === 'admin') {
    baseItems.splice(4, 0, {
      name: 'Management',
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
    <div className="sticky top-[76px] z-[100] bg-gradient-to-r from-[#1C1A18] to-[#535252] border-b border-white/ shadow-lg backdrop-blur-sm" style={{ overflow: 'visible' }}>
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
                      ? 'bg-white/ text-white'
                      : 'text-white/70 hover:bg-white/ hover:text-white'
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
                      className="absolute top-full left-0 mt-1 bg-gradient-to-br from-[#535252] to-[#535252] border border-white/ rounded-xl shadow-2xl overflow-hidden min-w-[200px]"
                      style={{ zIndex: 9999 }}
                    >
                      {item.subItems.map((subItem) => {
                        const SubIcon = subItem.icon;
                        return (
                          <Link
                            key={subItem.page}
                            to={createPageUrl(subItem.page)}
                            className="flex items-center gap-3 px-4 py-3 text-white/70 hover:bg-white/ hover:text-white transition-all"
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
              className="p-2 rounded-lg hover:bg-white/ transition-all"
              title="Global search"
            >
              <Search size={18} className="text-white" />
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