import { cva } from "class-variance-authority"

/**
 * NexAgent Design System — Button Variants
 *
 * Primary: Blue (#0367fb) - main CTAs
 * Secondary: Black outline - secondary actions
 * Ghost: Transparent - tertiary actions
 */
export const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding font-medium whitespace-nowrap transition-all duration-200 ease-out outline-none select-none focus-visible:ring-3 focus-visible:ring-[#0367fb]/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        /* NexAgent Primary - Blue */
        default:
          "bg-[#0367fb] text-white rounded-[10px] hover:bg-[#0061ff] active:scale-[0.98] shadow-sm hover:shadow-md",

        /* NexAgent Primary with Arrow */
        primary:
          "bg-[#0367fb] text-white rounded-[10px] hover:bg-[#0061ff] active:scale-[0.98] shadow-sm hover:shadow-md gap-2",

        /* NexAgent Secondary - Black Outline */
        secondary:
          "bg-transparent border-[#161616] text-[#161616] rounded-[10px] hover:bg-[#161616] hover:text-white active:scale-[0.98] dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-[#161616]",

        /* NexAgent Outline - Light border */
        outline:
          "border-[#d9d9d9] bg-white text-[#161616] rounded-[10px] hover:bg-[#f3f3f3] hover:border-[#787878] dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10",

        /* Ghost - No background */
        ghost:
          "hover:bg-[#f3f3f3] text-[#161616] rounded-[10px] dark:hover:bg-white/10 dark:text-white",

        /* Link style */
        link:
          "text-[#0367fb] underline-offset-4 hover:underline p-0 h-auto",

        /* Destructive */
        destructive:
          "bg-[#EF4444]/10 text-[#EF4444] rounded-[10px] hover:bg-[#EF4444]/20 focus-visible:ring-[#EF4444]/30",

        /* NexAgent Glass - Dark translucent */
        glass:
          "glass-dark text-white rounded-[10px] hover:bg-[#041c40]/80 border-white/10",

        /* NexAgent Glass Light */
        "glass-light":
          "glass-light text-[#161616] rounded-[10px] hover:bg-white/70",

        /* NexAgent Nav Link */
        nav:
          "bg-transparent text-[#787878] rounded-[10px] hover:text-[#161616] hover:bg-[#f3f3f3] dark:text-white/70 dark:hover:text-white dark:hover:bg-white/10",

        /* Featured/Gradient - for special CTAs */
        featured:
          "bg-gradient-to-r from-[#0367fb] via-[#33e9bf] to-[#c6eb00] text-white rounded-[10px] hover:opacity-90 active:scale-[0.98] shadow-md",

        /* Icon only - subtle */
        "icon-ghost":
          "bg-transparent hover:bg-[#f3f3f3] text-[#787878] hover:text-[#161616] rounded-[10px] dark:hover:bg-white/10 dark:text-white/60 dark:hover:text-white",
      },
      size: {
        /* NexAgent sizes */
        default:
          "h-10 gap-2 px-4 text-sm rounded-[10px]",
        xs:
          "h-7 gap-1 px-2.5 text-xs rounded-[8px] [&_svg:not([class*='size-'])]:size-3",
        sm:
          "h-8 gap-1.5 px-3 text-sm rounded-[8px] [&_svg:not([class*='size-'])]:size-3.5",
        lg:
          "h-11 gap-2 px-5 text-base rounded-[10px]",
        xl:
          "h-12 gap-2.5 px-6 text-base rounded-[12px] font-semibold",

        /* Icon sizes */
        icon:
          "size-10 rounded-[10px]",
        "icon-xs":
          "size-7 rounded-[8px] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-8 rounded-[8px] [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg":
          "size-11 rounded-[10px]",

        /* Special sizes */
        pill:
          "h-11 gap-2 px-6 rounded-full text-base",
        submit:
          "size-14 rounded-full [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
