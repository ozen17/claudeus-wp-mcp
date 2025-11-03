import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const tagVariants = cva(
  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
  {
    variants: {
      variant: {
        primary: "bg-primary/10 text-primary",
        accent: "bg-accent/10 text-accent",
        secondary: "bg-white/5 text-neutral",
        success: "bg-success/10 text-success",
        warning: "bg-warning/10 text-warning",
        destructive: "bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
)

export interface TagProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof tagVariants> {}

const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(tagVariants({ variant, className }))}
        {...props}
      />
    )
  }
)
Tag.displayName = "Tag"

export { Tag, tagVariants }
