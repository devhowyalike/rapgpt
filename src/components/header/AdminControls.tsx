"use client";

import { Shield } from "lucide-react";
import Link from "next/link";

type AdminControlsProps = {
  isAdmin: boolean;
  isAdminActive: boolean;
};

export function AdminControls({ isAdmin, isAdminActive }: AdminControlsProps) {
  if (!isAdmin) return null;

  return (
    <Link
      href="/admin/dashboard"
      className={`hidden lg:flex items-center gap-2 text-sm transition-colors px-3 py-2 rounded-lg ${
        isAdminActive
          ? "text-purple-300 bg-purple-900/30 font-medium"
          : "text-purple-400 hover:text-purple-300 hover:bg-gray-800"
      }`}
      prefetch={false}
    >
      <Shield className="w-4 h-4" />
      <span>Admin</span>
    </Link>
  );
}
