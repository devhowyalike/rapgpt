import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  variant?: "default" | "accent" | "highlight";
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  variant = "default",
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-12 h-12",
    "2xl": "w-16 h-16",
  };

  const variantClasses = {
    default: "border-2 border-white border-t-transparent",
    accent: "border-b-2 border-purple-500",
    highlight: "border-t-4 border-b-4 border-yellow-400",
  };

  return (
    <div
      className={cn(
        "rounded-full animate-spin",
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
    />
  );
}
