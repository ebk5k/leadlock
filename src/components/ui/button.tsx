import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[linear-gradient(135deg,rgba(114,147,255,1)_0%,rgba(90,107,255,1)_55%,rgba(124,92,255,0.94)_100%)] text-primary-foreground shadow-[0_18px_40px_rgba(74,99,255,0.4)] hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(74,99,255,0.45)]",
        secondary:
          "border border-white/10 bg-white/10 text-secondary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur hover:bg-white/14",
        ghost: "bg-transparent text-foreground hover:bg-white/8",
        outline:
          "border border-white/12 bg-[rgba(255,255,255,0.02)] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-white/18 hover:bg-white/8"
      },
      size: {
        md: "h-11 px-5",
        lg: "h-12 px-6 text-[15px]",
        sm: "h-9 px-4 text-[13px]"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
