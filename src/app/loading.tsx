import { SkeletonCard, SkeletonGrid } from "@/components/Skeletons"

export default function Loading() {
  return (
    <div className="min-h-screen bg-kranely-app-bg">
      <div className="container mx-auto px-4 py-12">
        <div className="h-12 w-3/4 max-w-2xl mb-4 rounded-lg bg-white/5 animate-pulse" />
        <div className="h-6 w-1/2 max-w-md mb-12 rounded bg-white/5 animate-pulse" />
        <SkeletonGrid items={6} />
      </div>
    </div>
  )
}
