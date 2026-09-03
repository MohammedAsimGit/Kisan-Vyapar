import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";
import { Spinner } from "./spinner";

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-[color,background-color,border-color,transform,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px disabled:pointer-events-none disabled:opacity-60";

export const buttonVariants: Record<
  "primary" | "secondary" | "outline" | "ghost" | "danger",
  string
> = {
  primary:
    "bg-primary text-primary-foreground shadow-sm hover:bg-primary-strong",
  secondary: "bg-surface text-foreground border border-border hover:bg-muted",
  outline: "border border-border bg-background text-foreground hover:bg-muted",
  ghost: "text-foreground hover:bg-muted",
  danger: "bg-danger text-white hover:bg-danger-strong",
};

export const buttonSizes: Record<"sm" | "md" | "lg", string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-base",
  lg: "h-13 px-7 text-base",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading = false, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(baseClasses, buttonVariants[variant], buttonSizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner className="size-4" /> : null}
      {children}
    </button>
  );
});

export function linkButtonClass(
  variant: keyof typeof buttonVariants = "primary",
  size: keyof typeof buttonSizes = "md",
  className?: string,
): string {
  return cn(baseClasses, buttonVariants[variant], buttonSizes[size], className);
}
