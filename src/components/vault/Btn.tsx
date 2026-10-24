import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const btn = cva(
  "tap inline-flex select-none items-center justify-center gap-2 rounded-full font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary: "bg-foreground text-background hover:bg-foreground/90",
        accent: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-input bg-transparent text-foreground hover:bg-surface-2",
        ghost: "bg-transparent text-muted-foreground hover:text-foreground",
        chip: "border border-line bg-surface text-foreground data-[on=true]:border-foreground data-[on=true]:bg-foreground data-[on=true]:text-background",
        quiet: "bg-surface-2 text-foreground hover:bg-surface-2/80",
      },
      size: {
        lg: "min-h-14 px-7 text-base",
        md: "min-h-12 px-5 text-sm",
        sm: "min-h-11 px-4 text-sm",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export const Btn = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof btn>>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button ref={ref} type={type} className={cn(btn({ variant, size }), className)} {...props} />
  ),
);
Btn.displayName = "Btn";