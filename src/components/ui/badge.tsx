import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-kranely-accent/10 text-kranely-accent border border-kranely-accent/20",
        secondary: "bg-white/10 text-white/80 border border-white/10",
        destructive: "bg-red-500/10 text-red-400 border border-red-500/20",
        outline: "text-white/60 border border-white/20",
        success: "bg-green-500/10 text-green-400 border border-green-500/20",
        warning: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
        info: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
