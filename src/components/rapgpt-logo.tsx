"use client";

import { APP_TITLE } from "@/lib/constants";
import { motion } from "framer-motion";
import Link from "next/link";

interface RapGPTLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
  showDots?: boolean;
  className?: string;
}

export function RapGPTLogo({
  size = "sm",
  animated = false,
  showDots = false,
  className: customClassName = "",
}: RapGPTLogoProps) {
  const sizeClasses = {
    sm: "text-3xl md:text-4xl",
    md: "text-4xl md:text-6xl",
    lg: "text-6xl md:text-8xl",
    xl: "text-7xl md:text-9xl",
  };

  const content = (
    <span
      className="text-transparent bg-clip-text"
      style={{
        backgroundImage: showDots
          ? "radial-gradient(circle at 2px 2px, rgba(0,0,0,0.3) 1.5px, transparent 0), linear-gradient(to right, #ffffff, #e5e7eb, #9ca3af)"
          : "linear-gradient(to right, #ffffff, #e5e7eb, #9ca3af)",
        backgroundSize: showDots ? "5px 5px, 100% 100%" : "100% 100%",
      }}
    >
      {APP_TITLE}
    </span>
  );

  const baseClassName = `${sizeClasses[size]} font-bold tracking-normal leading-none font-(family-name:--font-bebas-neue) ${customClassName}`;

  if (animated) {
    return (
      <Link href="/">
        <motion.h1
          className={baseClassName}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {content}
        </motion.h1>
      </Link>
    );
  }

  return (
    <Link href="/">
      <h1 className={baseClassName}>{content}</h1>
    </Link>
  );
}
