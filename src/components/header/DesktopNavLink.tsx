"use client";

import Link from "next/link";
import { ReactNode } from "react";

type DesktopNavLinkProps = {
  href: string;
  icon: ReactNode;
  label: string;
  isActive: boolean;
};

export function DesktopNavLink({
  href,
  icon,
  label,
  isActive,
}: DesktopNavLinkProps) {
  const baseClasses =
    "hidden md:flex items-center gap-2 text-sm transition-colors px-3 py-2 rounded-lg";
  const activeClasses = isActive
    ? "text-white bg-gray-800 font-medium"
    : "text-gray-400 hover:text-white hover:bg-gray-800";

  return (
    <Link
      href={href}
      className={`${baseClasses} ${activeClasses}`}
      prefetch={false}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
