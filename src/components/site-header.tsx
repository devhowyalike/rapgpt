"use client";

import { Home, Shield, Radio, Users, Menu, Mic2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "./auth/user-button";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useLiveBattles } from "@/lib/hooks/use-live-battles";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Cache admin status in memory to prevent flickering
let cachedAdminStatus: boolean | null = null;
let cachedUserId: string | null = null;

export function SiteHeader() {
  const { userId, isLoaded } = useAuth();
  const pathname = usePathname();
  // Start with cached value if available
  const [isAdmin, setIsAdmin] = useState(cachedAdminStatus ?? false);

  // Helper to check if a link is active
  const isActiveLink = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(href);
  };

  // Check admin status from database
  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!userId) {
      setIsAdmin(false);
      cachedAdminStatus = false;
      cachedUserId = null;
      return;
    }

    // If userId hasn't changed and we have cached status, use it
    if (cachedUserId === userId && cachedAdminStatus !== null) {
      setIsAdmin(cachedAdminStatus);
      return;
    }

    const checkAdminStatus = async () => {
      try {
        const response = await fetch("/api/user/me");
        if (response.ok) {
          const data = await response.json();
          const adminStatus = data.user?.role === "admin";
          setIsAdmin(adminStatus);
          // Cache the result
          cachedAdminStatus = adminStatus;
          cachedUserId = userId;
        }
      } catch (error) {
        console.error("[SiteHeader] Failed to check admin status:", error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [userId, isLoaded]);

  // Use custom hook to manage live battles (only enabled for admins)
  const { liveBattles } = useLiveBattles({ enabled: isAdmin });

  return (
    <div
      className="fixed top-0 left-0 right-0 z-30 p-3 bg-gray-900/95 border-b border-gray-800 backdrop-blur-sm"
      style={{ height: "var(--header-height)" }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between h-full">
        <div className="flex items-center gap-4">
          <UserButton />
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <>
              <Link
                href="/admin/dashboard"
                className={`flex items-center gap-2 text-sm transition-colors px-3 py-2 rounded-lg ${
                  isActiveLink("/admin")
                    ? "text-purple-300 bg-purple-900/30 font-medium"
                    : "text-purple-400 hover:text-purple-300 hover:bg-gray-800"
                }`}
                prefetch={false}
              >
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
              {liveBattles.length > 0 && (
                <Link
                  href={`/admin/battles/${liveBattles[0].id}/control`}
                  className="flex items-center gap-2 text-sm font-bold bg-red-600/20 border border-red-500/50 text-red-400 hover:bg-red-600/30 hover:text-red-300 transition-colors px-3 py-2 rounded-lg animate-pulse"
                  prefetch={false}
                >
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <Radio className="w-4 h-4" />
                  <span>LIVE</span>
                </Link>
              )}
            </>
          )}
          {/* Desktop Navigation Links */}
          <Link
            href="/"
            className={`hidden md:flex items-center gap-2 text-sm transition-colors px-3 py-2 rounded-lg ${
              isActiveLink("/")
                ? "text-white bg-gray-800 font-medium"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
            prefetch={false}
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>
          <Link
            href="/community"
            className={`hidden md:flex items-center gap-2 text-sm transition-colors px-3 py-2 rounded-lg ${
              isActiveLink("/community")
                ? "text-white bg-gray-800 font-medium"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
            prefetch={false}
          >
            <Users className="w-4 h-4" />
            <span>Community</span>
          </Link>

          <Link
            href="/new-battle"
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
          >
            <Mic2 size={16} />
            <span>Create Battle</span>
          </Link>

          {/* Mobile Hamburger Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="md:hidden flex items-center gap-2 text-sm transition-colors px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800">
                <Menu className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link
                  href="/"
                  className={`flex items-center gap-2 ${
                    isActiveLink("/") ? "text-white font-medium" : ""
                  }`}
                >
                  <Home className="w-4 h-4" />
                  Home
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/community"
                  className={`flex items-center gap-2 ${
                    isActiveLink("/community") ? "text-white font-medium" : ""
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Community
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
