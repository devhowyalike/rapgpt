"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { User, Users } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminControls } from "@/components/header/AdminControls";
import { CreateBattleButton } from "@/components/header/CreateBattleButton";
import { DesktopNavLink } from "@/components/header/DesktopNavLink";
import { MobileMenu } from "@/components/header/MobileMenu";
import { useLiveBattles } from "@/lib/hooks/use-live-battles";
import { UserButton } from "./auth/user-button";
import { RapGPTLogo } from "./rapgpt-logo";

// Cache admin status in memory to prevent flickering
let cachedAdminStatus: boolean | null = null;
let cachedUserId: string | null = null;

// Cache database user ID in memory to prevent flickering
let cachedDbUserId: string | null = null;
let cachedClerkUserId: string | null = null;

export function SiteHeader() {
  const { userId, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const pathname = usePathname();
  // Start with cached value if available
  const [isAdmin, setIsAdmin] = useState(cachedAdminStatus ?? false);
  const [dbUserId, setDbUserId] = useState<string | null>(cachedDbUserId);

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

  // Fetch database user ID
  useEffect(() => {
    if (!user?.id) {
      setDbUserId(null);
      cachedDbUserId = null;
      cachedClerkUserId = null;
      return;
    }

    // If the Clerk user ID hasn't changed and we have a cached DB user ID, use it
    if (cachedClerkUserId === user.id && cachedDbUserId) {
      if (dbUserId !== cachedDbUserId) {
        setDbUserId(cachedDbUserId);
      }
      return;
    }

    const dbId = user.publicMetadata?.dbUserId as string | undefined;
    if (dbId) {
      setDbUserId(dbId);
      cachedDbUserId = dbId;
      cachedClerkUserId = user.id;
    } else {
      fetch("/api/user/me")
        .then((res) => res.json())
        .then((data) => {
          if (data.user?.id) {
            setDbUserId(data.user.id);
            cachedDbUserId = data.user.id;
            cachedClerkUserId = user.id;
          }
        })
        .catch(console.error);
    }
  }, [user, dbUserId]);

  // Use custom hook to manage live battles (only enabled for admins)
  const { liveBattles } = useLiveBattles({ enabled: isAdmin });

  const firstName = user?.firstName || "";
  const lastName = user?.lastName || "";
  const displayName =
    [firstName, lastName].filter(Boolean).join(" ") || user?.username || "User";

  return (
    <div
      className="fixed top-0 left-0 right-0 z-30 p-3 bg-gray-900/95 border-b border-gray-800 backdrop-blur-sm"
      style={{ height: "var(--header-height)" }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between h-full gap-4">
        {/* Left Section: Hamburger (mobile), Logo and Navigation Links */}
        <div className="flex items-center gap-4">
          {/* Mobile Hamburger Menu - Left of Logo */}
          <MobileMenu
            isSignedIn={Boolean(isSignedIn)}
            displayName={displayName}
            userImageUrl={user?.imageUrl}
            dbUserId={dbUserId}
            isAdmin={isAdmin}
            liveBattles={liveBattles as Array<{ id: string }>}
            pathname={pathname}
          />

          <RapGPTLogo size="sm" />

          {/* Desktop Navigation Links */}
          {dbUserId && (
            <DesktopNavLink
              href={`/profile/${dbUserId}`}
              icon={<User className="w-4 h-4" />}
              label="Profile"
              isActive={Boolean(pathname?.startsWith(`/profile/${dbUserId}`))}
            />
          )}
          <DesktopNavLink
            href="/community"
            icon={<Users className="w-4 h-4" />}
            label="Community"
            isActive={isActiveLink("/community")}
          />
        </div>

        {/* Right Section: Live Signal, Admin, User, Create Battle */}
        <div className="flex items-center gap-3">
          <AdminControls
            isAdmin={isAdmin}
            liveBattles={liveBattles as Array<{ id: string }>}
            isAdminActive={isActiveLink("/admin")}
          />

          {/* User Dropdown - Desktop Only, Signed In Only */}
          {isSignedIn && (
            <div className="hidden md:block">
              <UserButton />
            </div>
          )}

          {/* Create Battle Button */}
          <CreateBattleButton isSignedIn={Boolean(isSignedIn)} />
        </div>
      </div>
    </div>
  );
}
