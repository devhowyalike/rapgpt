"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

type MenuLinkProps = {
  href: string;
  icon: ReactNode;
  label: string;
  isActive?: boolean;
};

export function MenuLink({ href, icon, label, isActive = false }: MenuLinkProps) {
  const activeClasses = isActive ? "text-white font-medium" : "";

  return (
    <DropdownMenuItem asChild>
      <Link href={href} className={`flex items-center gap-2 ${activeClasses}`}>
        {icon}
        {label}
      </Link>
    </DropdownMenuItem>
  );
}


