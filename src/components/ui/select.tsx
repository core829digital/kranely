import * as React from "react"
import { cn } from "@/lib/utils"

const Select = React.forwardRef<HTMLSelectElement, React.ComponentProps<"select">>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-kranely-accent/50 focus:border-kranely-accent/50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors appearance-none cursor-pointer",
        className
      )}
      {...props}
    />
  )
)
Select.displayName = "Select"

export { Select }
