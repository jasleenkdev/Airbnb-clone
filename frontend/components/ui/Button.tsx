import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/cn";

type Variant = "brand" | "dark" | "outline" | "ghost" | "link";

const VARIANTS: Record<Variant, string> = {
  brand: "bg-brand-gradient text-white hover:brightness-95 active:scale-[0.98]",
  dark: "bg-gray-900 text-white hover:bg-black active:scale-[0.98]",
  outline: "border border-gray-900 bg-white text-gray-900 hover:bg-gray-50 active:scale-[0.98]",
  ghost: "text-gray-900 hover:bg-gray-100",
  link: "px-0 py-0 font-semibold text-gray-900 underline underline-offset-2 hover:text-black",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Button({ variant = "dark", loading, size = "md", className, children, disabled, ...rest }: ButtonProps) {
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-5 py-2.5 text-[15px]", lg: "px-6 py-3.5 text-base" };
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        variant !== "link" && sizes[size],
        VARIANTS[variant],
        className,
      )}
    >
      {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
