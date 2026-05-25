"use client"

import { useAuth } from "@/lib/auth/auth-context"
import { LogOut } from "lucide-react"
import { NotificationBell } from "@/components/NotificationBell"
import GlobalSearch from "@/components/GlobalSearch"

export function Header() {
  const { user, signOut } = useAuth()

  const handleSignOut = () => {
    signOut()
    window.location.href = "/"
  }

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-white/10 bg-kranely-app-bg/80 px-4 md:px-6 backdrop-blur-xl">
      <div className="flex items-center gap-4 flex-1">
        <div className="hidden md:block">
          <GlobalSearch />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell userEmail={user?.email} />

        <div className="flex items-center gap-2 pl-3 border-l border-white/10">
          <div className="w-8 h-8 rounded-full bg-kranely-accent/20 flex items-center justify-center">
            <span className="text-kranely-accent text-sm font-semibold">
              {user?.fullName?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-white">{user?.fullName}</p>
            <p className="text-xs text-white/40">{user?.role}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-red-400 transition-colors"
            title="Esci"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
