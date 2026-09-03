import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid = false, type = "text", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid || undefined}
      className={cn(
        "flex h-11 w-full rounded-lg border bg-background px-3.5 text-base text-foreground placeholder:text-muted-foreground shadow-inset transition-[border-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60",
        invalid ? "border-danger" : "border-border",
        className,
      )}
      {...props}
    />
  );
});

export function useFieldId() {
  return useId();
}
