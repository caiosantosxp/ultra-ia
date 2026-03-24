import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

/**
 * NexAgent Design System — Input Component
 *
 * Styling:
 * - Background: #f5f5f5 (whitesmoke)
 * - Border: none default, 2px solid #0367fb on focus
 * - Border Radius: 8px
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        // Base styles
        "h-11 w-full min-w-0 rounded-lg bg-[#f5f5f5] px-4 py-3 text-base text-[#161616] transition-all duration-200 outline-none",
        // Border
        "border border-[#d9d9d9]",
        // Placeholder
        "placeholder:text-[#787878]",
        // Focus state
        "focus-visible:border-[#0367fb] focus-visible:ring-2 focus-visible:ring-[#0367fb]/20 focus-visible:bg-white focus-visible:text-[#161616]",
        // File input
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#161616]",
        // Disabled state
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#f3f3f3]",
        // Invalid state
        "aria-invalid:border-[#EF4444] aria-invalid:focus-visible:border-[#EF4444]",
        // Responsive
        "md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
