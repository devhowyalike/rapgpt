"use client";

import { Home, Archive, Shield, Users, Radio } from "lucide-react";
import Link from "next/link";
import { UserButton } from "./auth/user-button";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import type { Battle } from "@/lib/shared";

// Cache admin status in memory to prevent flickering
let cachedAdminStatus: boolean | null = null;
let cachedUserId: string | null = null;

export function SiteHeader() {
  const { userId, isLoaded } = useAuth();
  const [liveBattles, setLiveBattles] = useState<Battle[]>([]);
  // Start with cached value if available
  const [isAdmin, setIsAdmin] = useState(cachedAdminStatus ?? false);

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

  // Fetch live battles for admins
  useEffect(() => {
    console.log("[SiteHeader] isAdmin:", isAdmin, "isLoaded:", isLoaded);
    if (!isAdmin) return;

    const fetchLiveBattles = async () => {
      try {
        console.log("[SiteHeader] Fetching live battles...");
        const response = await fetch("/api/battle/live");
        if (response.ok) {
          const data = await response.json();
          console.log("[SiteHeader] Live battles:", data.battles?.length || 0);
          setLiveBattles(data.battles || []);
        } else {
          console.error("[SiteHeader] Failed to fetch:", response.status);
        }
      } catch (error) {
        console.error("[SiteHeader] Failed to fetch live battles:", error);
      }
    };

    fetchLiveBattles();

    // Poll every 10 seconds
    const interval = setInterval(fetchLiveBattles, 10000);
    return () => clearInterval(interval);
  }, [isAdmin, isLoaded]);

  return (
    <div className="fixed top-0 left-0 right-0 z-30 p-3 bg-gray-900/95 border-b border-gray-800 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-800"
            prefetch={false}
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <Link
            href="/archive"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-800"
            prefetch={false}
          >
            <Archive className="w-4 h-4" />
            <span className="hidden sm:inline">Archive</span>
          </Link>
          <Link
            href="/community"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-800"
            prefetch={false}
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Community</span>
          </Link>
          {isAdmin && (
            <>
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors px-3 py-2 rounded-lg hover:bg-gray-800"
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
        </div>

        <UserButton />
      </div>
    </div>
  );
}
