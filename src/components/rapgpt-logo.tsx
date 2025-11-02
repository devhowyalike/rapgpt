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
    sm: "text-xl md:text-2xl",
    md: "text-2xl md:text-4xl",
    lg: "text-2xl md:text-4xl lg:text-6xl",
  };

  const content = (
    <span className="bg-gradient-to-r from-yellow-400 via-red-500 to-purple-600 text-transparent bg-clip-text">
      {APP_TITLE}
    </span>
  );

  const className = `${sizeClasses[size]} font-bold tracking-wider leading-none`;

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

