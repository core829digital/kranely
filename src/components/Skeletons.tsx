export function SkeletonCard() {
  return (
    <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02] animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-white/5" />
        <div className="w-16 h-4 rounded bg-white/5" />
      </div>
      <div className="w-20 h-3 rounded bg-white/5 mb-2" />
      <div className="w-28 h-7 rounded bg-white/5" />
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border border-white/10 overflow-hidden">
      <div className="bg-white/5 border-b border-white/10 p-3">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-4 w-24 rounded bg-white/5" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-white/5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-3 flex gap-4">
            {Array.from({ length: cols }).map((_, j) => (
              <div key={j} className="h-4 flex-1 rounded bg-white/5" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonList({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="p-4 rounded-xl border border-white/10 bg-white/[0.02] animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-5 h-5 rounded bg-white/5" />
            <div className="flex-1 space-y-2">
              <div className="w-48 h-4 rounded bg-white/5" />
              <div className="w-72 h-3 rounded bg-white/5" />
              <div className="flex gap-4">
                <div className="w-20 h-3 rounded bg-white/5" />
                <div className="w-24 h-3 rounded bg-white/5" />
                <div className="w-16 h-3 rounded bg-white/5" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonGrid({ items = 6 }: { items?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="p-4 rounded-xl border border-white/10 bg-white/[0.02] animate-pulse">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-white/5" />
            <div className="flex-1 space-y-2">
              <div className="w-32 h-4 rounded bg-white/5" />
              <div className="w-20 h-3 rounded bg-white/5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="w-full h-3 rounded bg-white/5" />
            <div className="w-3/4 h-3 rounded bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function PageSkeleton({ stats = 4, type = "table" }: { stats?: number; type?: "table" | "list" | "grid" }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="w-48 h-8 rounded bg-white/5 animate-pulse" />
          <div className="w-64 h-4 rounded bg-white/5 animate-pulse" />
        </div>
        <div className="w-28 h-10 rounded-lg bg-white/5 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: stats }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
      <div className="flex gap-3">
        <div className="w-64 h-10 rounded-lg bg-white/5 animate-pulse" />
        <div className="w-32 h-10 rounded-lg bg-white/5 animate-pulse" />
        <div className="w-32 h-10 rounded-lg bg-white/5 animate-pulse" />
      </div>
      {type === "table" && <SkeletonTable />}
      {type === "list" && <SkeletonList />}
      {type === "grid" && <SkeletonGrid />}
    </div>
  )
}
