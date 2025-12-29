import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageTitleSize = "default" | "large" | "small";

interface PageTitleProps {
  children: ReactNode;
  className?: string;
  size?: PageTitleSize;
  as?: "h1" | "h2" | "h3";
}

const sizeClasses: Record<PageTitleSize, string> = {
  small: "text-4xl md:text-6xl",
  default: "text-5xl md:text-8xl",
  large: "text-6xl md:text-9xl",
};

export function PageTitle({
  children,
  className,
  size = "default",
  as: Tag = "h1",
}: PageTitleProps) {
  return (
    <Tag
      className={cn(
        "font-bold font-(family-name:--font-bebas-neue) text-white tracking-tight leading-[0.9] uppercase",
        sizeClasses[size],
        className
      )}
    >
      {children}
    </Tag>
  );
}

