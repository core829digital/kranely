"use client"

import { useState, useEffect } from "react"
import { Bell, Check, CheckCheck, Trash2, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useOrgId } from "@/hooks/useOrgId"

interface NotificationBellProps {
  userEmail?: string
}

const priorityConfig: Record<string, { color: string; icon: string }> = {
  urgent: { color: "text-red-400 bg-red-400/10", icon: "🔴" },
  high: { color: "text-orange-400 bg-orange-400/10", icon: "🟠" },
  normal: { color: "text-blue-400 bg-blue-400/10", icon: "🔵" },
  low: { color: "text-white/40 bg-white/5", icon: "⚪" },
}

export function NotificationBell({ userEmail }: NotificationBellProps) {
  const orgId = useOrgId()
  const [open, setOpen] = useState(false)

  const notifications = useQuery(
    api.notifications.list,
    orgId && userEmail ? { organizationId: orgId, userEmail, isRead: false } : "skip"
  )
  const allNotifications = useQuery(
    api.notifications.list,
    orgId && userEmail ? { organizationId: orgId, userEmail } : "skip"
  )
  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    orgId && userEmail ? { organizationId: orgId, userEmail } : "skip"
  )

  const markAsRead = useMutation(api.notifications.markAsRead)
  const markAllAsRead = useMutation(api.notifications.markAllAsRead)
  const removeNotification = useMutation(api.notifications.remove)

  const handleMarkRead = async (id: Id<"notifications">) => {
    try { await markAsRead({ id }) } catch (e) { toast.error("Errore") }
  }

  const handleMarkAllRead = async () => {
    if (!userEmail || !orgId) return
    try { await markAllAsRead({ organizationId: orgId, userEmail }); toast.success("Tutte lette") } catch (e) { toast.error("Errore") }
  }

  const handleDelete = async (id: Id<"notifications">) => {
    try { await removeNotification({ id }) } catch (e) { toast.error("Errore") }
  }

  const formatTime = (timestamp: number) => {
    const now = Date.now() / 1000
    const diff = now - timestamp
    if (diff < 60) return "Adesso"
    if (diff < 3600) return `${Math.floor(diff / 60)} min fa`
    if (diff < 86400) return `${Math.floor(diff / 3600)} ore fa`
    return `${Math.floor(diff / 86400)} giorni fa`
  }

  if (!orgId || !userEmail) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
        title="Notifiche"
        aria-label="Notifiche"
      >
        <Bell className="w-5 h-5" />
        {(unreadCount || 0) > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 md:w-96 rounded-xl border border-white/10 bg-[#1C1A18] shadow-2xl shadow-black/50 z-50 overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <h3 className="text-sm font-semibold text-white">Notifiche</h3>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="h-6 px-2 text-xs text-kranely-accent hover:text-kranely-accent/80 hover:bg-white/5">
                  <CheckCheck className="w-3 h-3 mr-1" /> Segna tutte
                </Button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {(allNotifications || []).length === 0 ? (
                <div className="p-8 text-center text-white/40">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Nessuna notifica</p>
                </div>
              ) : (
                (allNotifications || []).slice(0, 20).map((n) => {
                  const pc = priorityConfig[n.priority] || priorityConfig.normal
                  return (
                    <div
                      key={n._id}
                      className={cn(
                        "p-3 border-b border-white/5 hover:bg-white/[0.03] transition-colors",
                        !n.isRead && "bg-kranely-accent/5"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {!n.isRead && <div className="w-1.5 h-1.5 rounded-full bg-kranely-accent mt-1.5 flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-medium text-white truncate">{n.title}</h4>
                            <Badge variant="outline" className={cn("text-[9px] px-1 py-0 border", pc.color)}>{n.priority}</Badge>
                          </div>
                          <p className="text-xs text-white/50 mt-0.5 line-clamp-2">{n.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-white/30">{formatTime(n._creationTime)}</span>
                            {n.link && (
                              <a href={n.link} className="text-[10px] text-kranely-accent hover:underline flex items-center gap-0.5">
                                <ExternalLink className="w-2.5 h-2.5" /> Vai
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          {!n.isRead && (
                            <button onClick={() => handleMarkRead(n._id)} className="p-1 rounded bg-white text-black hover:bg-green-100 hover:text-green-600" title="Segna come letto" aria-label="Segna come letto">
                              <Check className="w-3 h-3" />
                            </button>
                          )}
                          <button onClick={() => handleDelete(n._id)} className="p-1 rounded bg-white text-black hover:bg-red-100 hover:text-red-600" title="Elimina notifica" aria-label="Elimina notifica">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
