import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-none border border-transparent bg-clip-padding text-xs font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/70 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-[#17201d] text-white hover:bg-[#2c3d34]",
        outline:
          "border-[#cbd8c9] bg-white text-[#17201d] hover:border-[#8eaa91] hover:bg-[#edf4e9] hover:text-[#17201d] aria-expanded:bg-[#edf4e9] aria-expanded:text-[#17201d]",
        secondary:
          "bg-[#e6efe3] text-[#294b31] hover:bg-[#d4e5d0] hover:text-[#1d3824] aria-expanded:bg-[#d4e5d0] aria-expanded:text-[#1d3824]",
        ghost:
          "text-[#385640] hover:bg-[#edf4e9] hover:text-[#17201d] aria-expanded:bg-[#edf4e9] aria-expanded:text-[#17201d]",
        destructive:
          "bg-[#fff0f0] text-[#a53d3d] hover:bg-[#ffe0e0] focus-visible:border-[#d66b6b] focus-visible:ring-[#d66b6b]/40",
        link: "text-[#315f3b] underline-offset-4 hover:text-[#17201d] hover:underline",
      },
      size: {
        default:
          "h-9 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-7 gap-1 rounded-none px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 rounded-none px-3 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-1.5 px-4 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-9",
        "icon-xs": "size-7 rounded-none [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-none",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
