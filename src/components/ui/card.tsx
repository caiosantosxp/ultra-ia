import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * NexAgent Design System — Card Component
 *
 * Variants:
 * - default: White with subtle border and shadow
 * - glass: Dark glass effect for dark backgrounds
 * - glass-light: Light glass effect
 * - elevated: Stronger shadow for prominence
 */
function Card({
  className,
  size = "default",
  variant = "default",
  hover = false,
  ...props
}: React.ComponentProps<"div"> & {
  size?: "default" | "sm" | "lg"
  variant?: "default" | "glass" | "glass-light" | "elevated"
  hover?: boolean
}) {
  return (
    <div
      data-slot="card"
      data-size={size}
      data-variant={variant}
      className={cn(
        // Base styles
        "group/card flex flex-col overflow-hidden text-card-foreground transition-all duration-200",
        // Size variants
        size === "default" && "gap-4 rounded-[16px] p-[30px]",
        size === "sm" && "gap-3 rounded-[12px] p-5",
        size === "lg" && "gap-5 rounded-[20px] p-10",
        // Variant styles
        variant === "default" && "bg-white border border-[#f3f3f3] shadow-[0_2px_20px_rgba(0,0,0,0.05)] dark:bg-card dark:border-white/10",
        variant === "glass" && "glass-dark",
        variant === "glass-light" && "glass-light",
        variant === "elevated" && "bg-white border border-[#f3f3f3] shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:bg-card dark:border-white/10",
        // Hover effect
        hover && "hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(3,103,251,0.15)] cursor-pointer",
        // Image handling
        "has-[>img:first-child]:pt-0 *:[img:first-child]:rounded-t-[16px] *:[img:last-child]:rounded-b-[16px]",
        // Footer handling
        "has-data-[slot=card-footer]:pb-0",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "grid auto-rows-min items-start gap-2 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto]",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "text-lg leading-snug font-semibold text-[#161616] dark:text-white group-data-[size=sm]/card:text-base",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-[#787878] dark:text-white/60 leading-relaxed", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center gap-3 pt-4 mt-auto border-t border-[#f3f3f3] dark:border-white/10",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
