import { Logo } from "@/components/Logo"

export default function DashboardLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <Logo size="lg" showText={false} />
      <p className="text-white/60 text-sm animate-pulse">Caricamento...</p>
    </div>
  )
}
