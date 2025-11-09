"use client";

import {
  Home,
  Shield,
  Radio,
  Users,
  Menu,
  Mic2,
  User,
  ChevronLeft,
  LogOut,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "./auth/user-button";
import {
  useAuth,
  SignInButton,
  SignOutButton,
  useUser,
  useClerk,
} from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useLiveBattles } from "@/lib/hooks/use-live-battles";
import { RapGPTLogo } from "./rapgpt-logo";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// Cache admin status in memory to prevent flickering
let cachedAdminStatus: boolean | null = null;
let cachedUserId: string | null = null;

// Cache database user ID in memory to prevent flickering
let cachedDbUserId: string | null = null;
let cachedClerkUserId: string | null = null;

export function SiteHeader() {
  const { userId, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const clerk = useClerk();
  const pathname = usePathname();
  // Start with cached value if available
  const [isAdmin, setIsAdmin] = useState(cachedAdminStatus ?? false);
  const [showUserMenu, setShowUserMenu] = useState(false);
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

  const createBattleButtonClasses =
    "flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium";

  const CreateBattleContent = () => (
    <>
      <Mic2 size={16} />
      <span className="hidden sm:inline">Create Battle</span>
      <span className="sm:hidden">Battle</span>
    </>
  );

  return (
    <div
      className="fixed top-0 left-0 right-0 z-30 p-3 bg-gray-900/95 border-b border-gray-800 backdrop-blur-sm"
      style={{ height: "var(--header-height)" }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between h-full gap-4">
        {/* Left Section: Hamburger (mobile), Logo and Navigation Links */}
        <div className="flex items-center gap-4">
          {/* Mobile Hamburger Menu - Left of Logo */}
          <DropdownMenu
            onOpenChange={(open) => {
              if (!open) {
                // Reset to main menu when closing
                setShowUserMenu(false);
              }
            }}
          >
            <DropdownMenuTrigger asChild>
              <button className="md:hidden flex items-center gap-2 text-sm transition-colors px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800">
                <Menu className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                {!showUserMenu ? (
                  <motion.div
                    key="main-menu"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  >
                    {/* User Profile Section */}
                    {isSignedIn && user && (
                      <>
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onSelect={(e) => {
                            e.preventDefault();
                            setShowUserMenu(true);
                          }}
                        >
                          <div className="flex items-center gap-3 w-full py-2">
                            <img
                              src={user.imageUrl}
                              alt={displayName}
                              className="w-10 h-10 rounded-full border-2 border-purple-500"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-white truncate">
                                {displayName}
                              </div>
                              <div className="text-xs text-gray-400">
                                Account settings
                              </div>
                            </div>
                            <ChevronLeft className="w-4 h-4 rotate-180" />
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}

                    {/* Navigation Items */}
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
                    {dbUserId && (
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/profile/${dbUserId}`}
                          className={`flex items-center gap-2 ${
                            pathname?.startsWith(`/profile/${dbUserId}`)
                              ? "text-white font-medium"
                              : ""
                          }`}
                        >
                          <User className="w-4 h-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link
                        href="/community"
                        className={`flex items-center gap-2 ${
                          isActiveLink("/community")
                            ? "text-white font-medium"
                            : ""
                        }`}
                      >
                        <Users className="w-4 h-4" />
                        Community
                      </Link>
                    </DropdownMenuItem>

                    {/* Admin Section */}
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link
                            href="/admin/dashboard"
                            className={`flex items-center gap-2 ${
                              isActiveLink("/admin")
                                ? "text-white font-medium"
                                : ""
                            }`}
                          >
                            <Shield className="w-4 h-4" />
                            Admin
                          </Link>
                        </DropdownMenuItem>
                        {liveBattles.length > 0 && (
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/admin/battles/${liveBattles[0].id}/control`}
                              className="flex items-center gap-2 text-red-400"
                            >
                              <Radio className="w-4 h-4" />
                              LIVE Battle
                            </Link>
                          </DropdownMenuItem>
                        )}
                      </>
                    )}

                    {/* Sign In for guests */}
                    {!isSignedIn && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <SignInButton mode="modal">
                            <button className="flex items-center gap-2 w-full">
                              <User className="w-4 h-4" />
                              Sign In
                            </button>
                          </SignInButton>
                        </DropdownMenuItem>
                      </>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="user-menu"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 20, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  >
                    {/* User Submenu */}
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onSelect={(e) => {
                        e.preventDefault();
                        setShowUserMenu(false);
                      }}
                    >
                      <div className="flex items-center gap-2 text-gray-400 hover:text-white">
                        <ChevronLeft className="w-4 h-4" />
                        <span>Back</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />

                    {/* User Menu Items */}
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        clerk.openUserProfile();
                      }}
                      className="cursor-pointer"
                    >
                      <Settings className="w-4 h-4" />
                      Manage Account
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <SignOutButton>
                        <button className="flex items-center gap-2 w-full text-red-400">
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </SignOutButton>
                    </DropdownMenuItem>
                  </motion.div>
                )}
              </AnimatePresence>
            </DropdownMenuContent>
          </DropdownMenu>

          <RapGPTLogo size="sm" />

          {/* Desktop Navigation Links */}
          {dbUserId && (
            <Link
              href={`/profile/${dbUserId}`}
              className={`hidden md:flex items-center gap-2 text-sm transition-colors px-3 py-2 rounded-lg ${
                pathname?.startsWith(`/profile/${dbUserId}`)
                  ? "text-white bg-gray-800 font-medium"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
              prefetch={false}
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </Link>
          )}
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
        </div>

        {/* Right Section: Live Signal, Admin, User, Create Battle */}
        <div className="flex items-center gap-3">
          {/* Live Signal (Admin Only) */}
          {isAdmin && liveBattles.length > 0 && (
            <Link
              href={`/admin/battles/${liveBattles[0].id}/control`}
              className="hidden md:flex items-center gap-2 text-sm font-bold bg-red-600/20 border border-red-500/50 text-red-400 hover:bg-red-600/30 hover:text-red-300 transition-colors px-3 py-2 rounded-lg animate-pulse"
              prefetch={false}
            >
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <Radio className="w-4 h-4" />
              <span className="hidden lg:inline">LIVE</span>
            </Link>
          )}

          {/* Admin Icon */}
          {isAdmin && (
            <Link
              href="/admin/dashboard"
              className={`hidden md:flex items-center gap-2 text-sm transition-colors px-3 py-2 rounded-lg ${
                isActiveLink("/admin")
                  ? "text-purple-300 bg-purple-900/30 font-medium"
                  : "text-purple-400 hover:text-purple-300 hover:bg-gray-800"
              }`}
              prefetch={false}
            >
              <Shield className="w-4 h-4" />
              <span className="hidden lg:inline">Admin</span>
            </Link>
          )}

          {/* User Dropdown - Desktop Only, Signed In Only */}
          {isSignedIn && (
            <div className="hidden md:block">
              <UserButton />
            </div>
          )}

          {/* Create Battle Button */}
          {isSignedIn ? (
            <Link href="/new-battle" className={createBattleButtonClasses}>
              <CreateBattleContent />
            </Link>
          ) : (
            <SignInButton mode="modal" forceRedirectUrl="/new-battle">
              <button className={createBattleButtonClasses}>
                <CreateBattleContent />
              </button>
            </SignInButton>
          )}
        </div>
      </div>
    </div>
  );
}
