"use client";

import { APP_TITLE } from "@/lib/constants";
import { motion } from "framer-motion";
import Link from "next/link";

interface RapGPTLogoProps {
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

export function RapGPTLogo({ size = "sm", animated = false }: RapGPTLogoProps) {
  const sizeClasses = {
    sm: "text-3xl md:text-4xl",
    md: "text-4xl md:text-6xl",
    lg: "text-6xl md:text-8xl",
  };

  const content = (
    <span className="bg-linear-to-r from-white via-gray-200 to-gray-400 text-transparent bg-clip-text">
      {APP_TITLE}
    </span>
  );

  const className = `${sizeClasses[size]} font-bold tracking-tighter leading-none font-(family-name:--font-bebas-neue)`;

  if (animated) {
    return (
      <Link href="/">
        <motion.h1
          className={className}
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
      <h1 className={className}>{content}</h1>
    </Link>
  );
}

