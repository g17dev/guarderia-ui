import * as React from "react"
import { type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"
import { LoaderCircle } from "lucide-react"
import { buttonVariants } from "./buttonVariants"


function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    loading?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
      disabled={props.disabled || loading}
      aria-busy={loading || props["aria-busy"]}
    >
      {loading && !asChild && <LoaderCircle className="animate-spin motion-reduce:animate-none" size={16} aria-hidden="true" />}
      {children}
    </Comp>
  )
}

export { Button }
