"use client";

import { SignInButton, SignOutButton, useClerk } from "@clerk/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  Home,
  Info,
  Menu,
  Radio,
  Settings,
  Shield,
  User,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MenuLink } from "./MenuLink";

type LiveBattle = { id: string };

type MobileMenuProps = {
  isSignedIn: boolean;
  displayName: string;
  userImageUrl?: string;
  dbUserId: string | null;
  isAdmin: boolean;
  liveBattles: LiveBattle[];
  pathname: string | null;
};

export function MobileMenu({
  isSignedIn,
  displayName,
  userImageUrl,
  dbUserId,
  isAdmin,
  liveBattles,
  pathname,
}: MobileMenuProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const clerk = useClerk();

  const isActiveLink = (href: string) => {
    if (href === "/") return pathname === "/";
    return Boolean(pathname?.startsWith(href));
  };

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (!open) setShowUserMenu(false);
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
              {isSignedIn && (
                <>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onSelect={(e) => {
                      e.preventDefault();
                      setShowUserMenu(true);
                    }}
                  >
                    <div className="flex items-center gap-3 w-full py-2">
                      <div className="relative w-10 h-10 shrink-0">
                        <Image
                          src={userImageUrl || ""}
                          alt={displayName}
                          fill
                          className="rounded-full border-2 border-purple-500 object-cover"
                        />
                      </div>
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
              <MenuLink
                href="/"
                icon={<Home className="w-4 h-4" />}
                label="Home"
                isActive={isActiveLink("/")}
              />
              {dbUserId && (
                <MenuLink
                  href={`/profile/${dbUserId}`}
                  icon={<User className="w-4 h-4" />}
                  label="Profile"
                  isActive={isActiveLink(`/profile/${dbUserId}`)}
                />
              )}
              <MenuLink
                href="/community"
                icon={<Users className="w-4 h-4" />}
                label="Community"
                isActive={isActiveLink("/community")}
              />
              <MenuLink
                href="/learn-more"
                icon={<Info className="w-4 h-4" />}
                label="Learn More"
                isActive={isActiveLink("/learn-more")}
              />

              {/* Admin Section */}
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <MenuLink
                    href="/admin/dashboard"
                    icon={<Shield className="w-4 h-4" />}
                    label="Admin"
                    isActive={isActiveLink("/admin")}
                  />
                  {liveBattles.length > 0 && (
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/battle/${liveBattles[0].id}`}
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
                    <User className="w-4 h-4" />
                    Sign Out
                  </button>
                </SignOutButton>
              </DropdownMenuItem>
            </motion.div>
          )}
        </AnimatePresence>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
