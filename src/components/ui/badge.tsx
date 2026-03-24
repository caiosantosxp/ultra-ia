import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * NexAgent Design System — Badge Variants
 *
 * Variants:
 * - default: Blue tag
 * - section: Section tag style
 * - success: Teal/green for positive status
 * - warning: Yellow-green for warnings
 * - destructive: Red for errors
 */
const badgeVariants = cva(
  "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden border border-transparent font-medium whitespace-nowrap transition-all focus-visible:ring-[3px] focus-visible:ring-[#0367fb]/30 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        /* NexAgent Primary - Blue */
        default:
          "h-6 px-3 rounded-[6px] bg-[#0367fb]/10 text-[#0367fb] text-xs",

        /* Section Tag */
        section:
          "h-8 px-4 rounded-[6px] bg-[#0367fb]/10 text-[#0367fb] text-sm tracking-wide",

        /* Secondary - Neutral */
        secondary:
          "h-6 px-3 rounded-[6px] bg-[#f3f3f3] text-[#787878] text-xs dark:bg-white/10 dark:text-white/70",

        /* Outline */
        outline:
          "h-6 px-3 rounded-[6px] border-[#d9d9d9] text-[#787878] text-xs dark:border-white/20 dark:text-white/60",

        /* Success - Teal */
        success:
          "h-6 px-3 rounded-[6px] bg-[#33e9bf]/15 text-[#1a9e7a] text-xs",

        /* Warning - Yellow Green */
        warning:
          "h-6 px-3 rounded-[6px] bg-[#c6eb00]/15 text-[#8fa600] text-xs",

        /* Destructive - Red */
        destructive:
          "h-6 px-3 rounded-[6px] bg-[#EF4444]/10 text-[#d9001b] text-xs",

        /* Popular Badge (Pricing) */
        popular:
          "h-7 px-4 rounded-full bg-gradient-to-r from-[#0367fb] via-[#33e9bf] to-[#c6eb00] text-white text-xs font-semibold shadow-sm",

        /* Glass - For dark backgrounds */
        glass:
          "h-6 px-3 rounded-[6px] glass-subtle text-white text-xs border-white/20",

        /* Link style */
        link:
          "text-[#0367fb] underline-offset-4 hover:underline p-0 h-auto text-xs",
      },
      size: {
        default: "",
        sm: "h-5 px-2 text-[11px]",
        lg: "h-8 px-4 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
