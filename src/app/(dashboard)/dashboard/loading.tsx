export default function DashboardLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="w-14 h-14 rounded-xl bg-kranely-accent flex items-center justify-center animate-pulse">
        <span className="text-kranely-app-bg font-bold text-3xl">K</span>
      </div>
      <p className="text-white/60 text-sm animate-pulse">Caricamento...</p>
    </div>
  )
}
