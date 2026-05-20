import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../Backend/convex/_generated/api";
import {
  Bell,
  Check,
  MessageSquare,
  FileText,
  Calendar,
  X,
  Trash2,
  CheckCheck,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function NotificationCenter({ user, onClose }) {
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  const notifications = useQuery(api.notifications.list, {
    type: filterType,
    priority: filterPriority
  }) || [];

  const markAsRead = useMutation(api.notifications.markAsRead);
  const deleteNotification = useMutation(api.notifications.deleteNotification);

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    await Promise.all(unread.map(n =>
      markAsRead({ id: n._id })
    ));
  };

  const deleteAllRead = async () => {
    const read = notifications.filter(n => n.read);
    await Promise.all(read.map(n => deleteNotification({ id: n._id })));
  };

  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  const getIcon = (type) => {
    switch (type) {
      case 'message': return <MessageSquare size={20} className="text-[#FFC703]" />;
      case 'document': return <FileText size={20} className="text-[#FFC703]/70" />;
      case 'appointment': return <Calendar size={20} className="text-[#FFC703]/80" />;
      case 'mention': return <MessageSquare size={20} className="text-yellow-400" />;
      case 'like': return <Check size={20} className="text-[#FFC703]/60" />;
      case 'reply': return <MessageSquare size={20} className="text-[#FFC703]/80" />;
      case 'system': return <AlertCircle size={20} className="text-orange-400" />;
      default: return <Bell size={20} className="text-[#F0EBE8]" />;
    }
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      urgent: 'bg-red-500/10 text-red-400 border-red-500/20',
      high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      normal: 'bg-[#FFC703]/10 text-[#FFC703] border-[#FFC703]/20',
      low: 'bg-[#F0EBE8]/5 text-[#F0EBE8]/50 border-white/5'
    };
    return styles[priority] || styles.normal;
  };

  const NotificationItem = ({ notif }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={`p-4 border-b border-white/5 hover:bg-white/5 transition-all ${!notif.read ? 'bg-[#FFC703]/5' : ''
        }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getIcon(notif.type)}</div>
        <div className="flex-1 min-w-0">
          <Link
            to={notif.link || createPageUrl('Dashboard')}
            onClick={() => {
              markAsRead({ id: notif._id });
              if (onClose) onClose();
            }}
            className="block"
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className={`text-sm font-medium ${!notif.read ? 'text-white' : 'text-[#F0EBE8]/80'}`}>
                {notif.title}
              </h4>
              {notif.priority && notif.priority !== 'normal' && (
                <span className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityBadge(notif.priority)}`}>
                  {notif.priority}
                </span>
              )}
            </div>
            <p className="text-xs text-[#F0EBE8]/70 line-clamp-2 mb-1">
              {notif.message}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#F0EBE8]/40">
                {new Date(notif.created_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              {notif.sender_email && (
                <span className="text-xs text-[#F0EBE8]/40">
                  from {notif.sender_email.split('@')[0]}
                </span>
              )}
            </div>
          </Link>
        </div>
        <div className="flex gap-1">
          {!notif.read && (
            <button
              onClick={() => markAsRead({ id: notif._id })}
              className="text-[#F0EBE8]/40 hover:text-[#FFC703]/80 transition-colors"
              title="Mark as read"
            >
              <Check size={16} />
            </button>
          )}
          <button
            onClick={() => deleteNotification({ id: notif._id })}
            className="text-[#F0EBE8]/40 hover:text-red-400 transition-colors"
            title="Delete"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 sm:inset-auto sm:right-4 sm:top-20 sm:w-[480px] sm:max-h-[600px] bg-[#1C1A18]/95 backdrop-blur-xl border border-white/10 sm:rounded-3xl shadow-2xl z-50 flex flex-col max-h-screen"
    >
      {/* Header */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-medium text-[#F0EBE8]">Notification Center</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-all text-[#F0EBE8]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-[#F0EBE8]/80">
            {unreadNotifications.length} unread
          </span>
          <span className="text-[#F0EBE8]/30">•</span>
          <span className="text-sm text-[#F0EBE8]/50">
            {notifications.length} total
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-3 border-b border-white/5 flex gap-2">
        <Button
          size="sm"
          onClick={markAllAsRead}
          disabled={unreadNotifications.length === 0}
          className="bg-[#FFC703]/10 hover:bg-[#FFC703]/15 text-[#FFC703] border border-[#FFC703]/20"
        >
          <CheckCheck size={14} className="mr-1" />
          Mark all as read
        </Button>
        <Button
          size="sm"
          onClick={deleteAllRead}
          disabled={readNotifications.length === 0}
          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
        >
          <Trash2 size={14} className="mr-1" />
          Clear read
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="unread" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="bg-white/5 border border-white/10 mx-6 mt-3">
          <TabsTrigger value="unread" className="data-[state=active]:bg-[#FFC703] data-[state=active]:text-[#1C1A18] text-[#F0EBE8]/60">Unread</TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-[#FFC703] data-[state=active]:text-[#1C1A18] text-[#F0EBE8]/60">All</TabsTrigger>
          <TabsTrigger value="read" className="data-[state=active]:bg-[#FFC703] data-[state=active]:text-[#1C1A18] text-[#F0EBE8]/60">Read</TabsTrigger>
        </TabsList>

        <TabsContent value="unread" className="flex-1 overflow-y-auto mt-0 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {unreadNotifications.length === 0 ? (
              <div className="p-10 text-center text-[#F0EBE8]/30">
                <CheckCheck size={32} className="mx-auto mb-3 opacity-30 text-[#FFC703]" />
                <p className="text-sm">All caught up!</p>
              </div>
            ) : (
              unreadNotifications.map((notif) => (
                <NotificationItem key={notif._id} notif={notif} />
              ))
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="all" className="flex-1 overflow-y-auto mt-0 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {notifications.length === 0 ? (
              <div className="p-10 text-center text-[#F0EBE8]/30">
                <Bell size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
               notifications.map((notif) => (
                <NotificationItem key={notif._id} notif={notif} />
              ))
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="read" className="flex-1 overflow-y-auto mt-0 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {readNotifications.length === 0 ? (
              <div className="p-10 text-center text-[#F0EBE8]/30">
                <Bell size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No read notifications</p>
              </div>
            ) : (
               readNotifications.map((notif) => (
                <NotificationItem key={notif._id} notif={notif} />
              ))
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}