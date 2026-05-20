import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../Backend/convex/_generated/api";
import { Bell, MessageSquare, FileText, Calendar, X, Maximize2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import NotificationCenter from './NotificationCenter';


export default function NotificationBell({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCenter, setShowCenter] = useState(false);

  const rawNotifications = useQuery(api.notifications.list, {}) || [];

  // Deduplicate notifications by title + message + type
  const notifications = React.useMemo(() => {
    const seen = new Set();
    return rawNotifications.filter(n => {
      const key = `${n.title}|${n.message}|${n.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [rawNotifications]);

  const markAsReadMutation = useMutation(api.notifications.markAsRead);
  const deleteNotificationMutation = useMutation(api.notifications.deleteNotification);

  const deleteAllReadMutation = async () => {
    const readNotifs = notifications.filter(n => n.read);
    await Promise.all(readNotifs.map(n => deleteNotificationMutation({ id: n._id })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type) => {
    switch (type) {
      case 'message': return <MessageSquare size={16} className="text-blue-400" />;
      case 'document': return <FileText size={16} className="text-purple-400" />;
      case 'appointment': return <Calendar size={16} className="text-green-400" />;
      default: return <Bell size={16} className="text-[#f8f9fa]" />;
    }
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 rounded-lg hover:bg-[#f8f9fa]/10 transition-all"
        >
          <Bell size={20} className="text-[#f8f9fa]" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-medium shadow-lg"
              animate={{
                scale: [1, 1.2, 1],
                boxShadow: ['0 0 0 0 rgba(239, 68, 68, 0.7)', '0 0 0 6px rgba(239, 68, 68, 0)', '0 0 0 0 rgba(239, 68, 68, 0)']
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: 'loop'
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop to close dropdown */}
              <div
                className="fixed inset-0 z-[999]"
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="absolute right-0 top-full mt-2 w-[min(calc(100vw-2rem),384px)] max-h-[70vh] sm:max-h-96 overflow-y-auto bg-[#343a40]/95 backdrop-blur-xl border border-[#f8f9fa]/20 rounded-2xl shadow-2xl z-[1000]"
              >
                <div className="p-4 border-b border-[#f8f9fa]/10">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-[#f8f9fa]">Notifiche</h3>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">{unreadCount} nuove</span>
                      )}
                      <button
                        onClick={() => setIsOpen(false)}
                        className="text-[#adb5bd] hover:text-[#f8f9fa] transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-[#f8f9fa]/5">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-[#adb5bd]">
                      <Bell size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nessuna notifica</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif._id}
                        className={`p-4 hover:bg-[#f8f9fa]/5 transition-all ${!notif.read ? 'bg-[#f8f9fa]/5 border-l-2 border-l-blue-400' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">{getIcon(notif.type)}</div>
                          <div className="flex-1 min-w-0">
                            <Link
                              to={notif.link || createPageUrl('Dashboard')}
                              onClick={() => {
                                markAsReadMutation({ id: notif._id });
                                setIsOpen(false);
                              }}
                              className="block"
                            >
                              <h4 className="text-sm font-medium text-[#f8f9fa] mb-1">
                                {notif.title}
                              </h4>
                              <p className="text-xs text-[#dee2e6] line-clamp-2">
                                {notif.message}
                              </p>
                              <span className="text-xs text-[#adb5bd] mt-1 block">
                                {new Date(notif.created_date).toLocaleDateString('it-IT')}
                              </span>
                            </Link>
                          </div>
                          <button
                            onClick={() => deleteNotificationMutation({ id: notif._id })}
                            className="text-[#adb5bd] hover:text-[#f8f9fa] transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="p-3 border-t border-[#f8f9fa]/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          notifications.forEach(n => {
                            if (!n.read) markAsReadMutation({ id: n._id });
                          });
                        }}
                        className="text-xs text-[#f8f9fa] hover:underline"
                      >
                        Segna tutte come lette
                      </button>
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          setShowCenter(true);
                        }}
                        className="flex items-center gap-1 text-xs text-[#f8f9fa] hover:underline"
                      >
                        <Maximize2 size={12} />
                        Mostra tutto
                      </button>
                    </div>
                    {notifications.filter(n => n.read).length > 0 && (
                      <button
                        onClick={() => deleteAllReadMutation()}
                        className="text-xs text-red-400 hover:text-red-300 w-full text-left"
                      >
                        Elimina tutte le lette
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Notification Center Modal */}
      <AnimatePresence>
        {showCenter && (
          <>
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setShowCenter(false)}
            />
            <NotificationCenter user={user} onClose={() => setShowCenter(false)} />
          </>
        )}
      </AnimatePresence>
    </>
  );
}