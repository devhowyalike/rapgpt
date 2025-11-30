"use client";

import { Radio, Shield } from "lucide-react";
import Link from "next/link";

type AdminControlsProps = {
  isAdmin: boolean;
  liveBattles: Array<{ id: string }>;
  isAdminActive: boolean;
};

export function AdminControls({
  isAdmin,
  liveBattles,
  isAdminActive,
}: AdminControlsProps) {
  if (!isAdmin) return null;

  return (
    <>
      {liveBattles.length > 0 && (
        <Link
          href={`/battle/${liveBattles[0].id}`}
          className="hidden md:flex items-center gap-2 text-sm font-bold bg-red-600/20 border border-red-500/50 text-red-400 hover:bg-red-600/30 hover:text-red-300 transition-colors px-3 py-2 rounded-lg animate-pulse"
          prefetch={false}
        >
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <Radio className="w-4 h-4" />
          <span className="hidden lg:inline">LIVE</span>
        </Link>
      )}

      <Link
        href="/admin/dashboard"
        className={`hidden md:flex items-center gap-2 text-sm transition-colors px-3 py-2 rounded-lg ${
          isAdminActive
            ? "text-purple-300 bg-purple-900/30 font-medium"
            : "text-purple-400 hover:text-purple-300 hover:bg-gray-800"
        }`}
        prefetch={false}
      >
        <Shield className="w-4 h-4" />
        <span className="hidden lg:inline">Admin</span>
      </Link>
    </>
  );
}
