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
      case 'message': return <MessageSquare size={20} className="text-blue-400" />;
      case 'document': return <FileText size={20} className="text-purple-400" />;
      case 'appointment': return <Calendar size={20} className="text-green-400" />;
      case 'mention': return <MessageSquare size={20} className="text-yellow-400" />;
      case 'like': return <Check size={20} className="text-pink-400" />;
      case 'reply': return <MessageSquare size={20} className="text-cyan-400" />;
      case 'system': return <AlertCircle size={20} className="text-orange-400" />;
      default: return <Bell size={20} className="text-[#f8f9fa]" />;
    }
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
      high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      normal: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      low: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return styles[priority] || styles.normal;
  };

  const NotificationItem = ({ notif }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={`p-4 border-b border-[#f8f9fa]/5 hover:bg-[#f8f9fa]/5 transition-all ${!notif.read ? 'bg-[#f8f9fa]/5' : ''
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
              <h4 className={`text-sm font-medium ${!notif.read ? 'text-[#f8f9fa]' : 'text-[#dee2e6]'}`}>
                {notif.title}
              </h4>
              {notif.priority && notif.priority !== 'normal' && (
                <span className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityBadge(notif.priority)}`}>
                  {notif.priority}
                </span>
              )}
            </div>
            <p className="text-xs text-[#dee2e6] line-clamp-2 mb-1">
              {notif.message}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#adb5bd]">
                {new Date(notif.created_date).toLocaleDateString('it-IT', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              {notif.sender_email && (
                <span className="text-xs text-[#adb5bd]">
                  da {notif.sender_email.split('@')[0]}
                </span>
              )}
            </div>
          </Link>
        </div>
        <div className="flex gap-1">
          {!notif.read && (
            <button
              onClick={() => markAsRead({ id: notif._id })}
              className="text-[#adb5bd] hover:text-green-400 transition-colors"
              title="Segna come letta"
            >
              <Check size={16} />
            </button>
          )}
          <button
            onClick={() => deleteNotification({ id: notif._id })}
            className="text-[#adb5bd] hover:text-red-400 transition-colors"
            title="Elimina"
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
      className="fixed inset-0 sm:inset-auto sm:right-4 sm:top-20 sm:w-[480px] sm:max-h-[600px] bg-[#343a40]/95 backdrop-blur-xl border border-[#f8f9fa]/20 sm:rounded-3xl shadow-2xl z-50 flex flex-col max-h-screen"
    >
      {/* Header */}
      <div className="p-6 border-b border-[#f8f9fa]/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-medium text-[#f8f9fa]">Centro Notifiche</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#f8f9fa]/10 transition-all"
          >
            <X size={20} className="text-[#f8f9fa]" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-[#dee2e6]">
            {unreadNotifications.length} non lette
          </span>
          <span className="text-[#adb5bd]">•</span>
          <span className="text-sm text-[#adb5bd]">
            {notifications.length} totali
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-3 border-b border-[#f8f9fa]/10 flex gap-2">
        <Button
          size="sm"
          onClick={markAllAsRead}
          disabled={unreadNotifications.length === 0}
          className="bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-600/30"
        >
          <CheckCheck size={14} className="mr-1" />
          Segna tutte lette
        </Button>
        <Button
          size="sm"
          onClick={deleteAllRead}
          disabled={readNotifications.length === 0}
          className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30"
        >
          <Trash2 size={14} className="mr-1" />
          Elimina lette
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="unread" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="bg-[#495057]/50 mx-6 mt-3">
          <TabsTrigger value="unread">Non Lette</TabsTrigger>
          <TabsTrigger value="all">Tutte</TabsTrigger>
          <TabsTrigger value="read">Lette</TabsTrigger>
        </TabsList>

        <TabsContent value="unread" className="flex-1 overflow-y-auto mt-0">
          <AnimatePresence mode="popLayout">
            {unreadNotifications.length === 0 ? (
              <div className="p-6 text-center text-[#adb5bd]">
                <CheckCheck size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Tutte le notifiche sono state lette!</p>
              </div>
            ) : (
              unreadNotifications.map((notif) => (
                <NotificationItem key={notif._id} notif={notif} />
              ))
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="all" className="flex-1 overflow-y-auto mt-0">
          <AnimatePresence mode="popLayout">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-[#adb5bd]">
                <Bell size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nessuna notifica</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <NotificationItem key={notif._id} notif={notif} />
              ))
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="read" className="flex-1 overflow-y-auto mt-0">
          <AnimatePresence mode="popLayout">
            {readNotifications.length === 0 ? (
              <div className="p-6 text-center text-[#adb5bd]">
                <Bell size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nessuna notifica letta</p>
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