import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-xs font-medium transition-colors select-none",
  {
    variants: {
      variant: {
        default:
          "border-border bg-secondary text-secondary-foreground",
        accent:
          "border-primary/20 bg-accent text-accent-foreground font-semibold",
        outline:
          "border-border bg-card text-foreground",
        subtle:
          "border-transparent bg-muted text-muted-foreground",
        positive:
          "border-emerald-600/20 bg-emerald-50 text-emerald-800",
        attention:
          "border-amber-600/20 bg-amber-50 text-amber-900",
        critical:
          "border-red-600/20 bg-red-50 text-red-800",
        jurisdiction:
          "border-primary/30 bg-primary/5 text-primary tracking-wide uppercase text-[11px] font-semibold",
      },
      size: {
        default: "text-xs px-2.5 py-0.5",
        sm: "text-[11px] px-2 py-0.5",
        lg: "text-sm px-3 py-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
