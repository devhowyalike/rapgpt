"use client";

import {
  SignInButton,
  SignOutButton,
  useAuth,
  useUser,
  useClerk,
} from "@clerk/nextjs";
import { User, ChevronDown, LogOut, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Cache user ID in memory to prevent flickering
let cachedDbUserId: string | null = null;
let cachedClerkUserId: string | null = null;

export function UserButton() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const clerk = useClerk();
  // Start with cached value if available
  const [userId, setUserId] = useState<string | null>(cachedDbUserId);

  useEffect(() => {
    if (!user?.id) {
      setUserId(null);
      cachedDbUserId = null;
      cachedClerkUserId = null;
      return;
    }

    // If the Clerk user ID hasn't changed and we have a cached DB user ID, use it
    if (cachedClerkUserId === user.id && cachedDbUserId) {
      setUserId(cachedDbUserId);
      return;
    }

    // Fetch the database user ID from the public metadata
    const dbUserId = user.publicMetadata?.dbUserId as string | undefined;
    if (dbUserId) {
      setUserId(dbUserId);
      cachedDbUserId = dbUserId;
      cachedClerkUserId = user.id;
    } else {
      // Fallback: fetch from API
      fetch("/api/user/me")
        .then((res) => res.json())
        .then((data) => {
          if (data.user?.id) {
            setUserId(data.user.id);
            cachedDbUserId = data.user.id;
            cachedClerkUserId = user.id;
          }
        })
        .catch(console.error);
    }
  }, [user]);

  // Show loading skeleton while auth is loading on first mount
  if (!isLoaded) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gray-700/50 rounded-full animate-pulse" />
        <div className="hidden sm:block w-24 h-4 bg-gray-700/50 rounded animate-pulse" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
          <User size={18} />
          <span className="hidden sm:inline">Sign In</span>
        </button>
      </SignInButton>
    );
  }

  const firstName = user?.firstName || "";
  const lastName = user?.lastName || "";
  const displayName =
    [firstName, lastName].filter(Boolean).join(" ") || user?.username || "User";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors text-white">
          <img
            src={user?.imageUrl}
            alt={displayName}
            className="w-8 h-8 rounded-full border-2 border-purple-500"
          />
          <span className="hidden sm:inline text-sm font-medium">
            {displayName}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="sm:hidden">
          {displayName}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="sm:hidden" />
        {userId && (
          <DropdownMenuItem asChild>
            <Link
              href={`/profile/${userId}`}
              className="flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Profile
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => clerk.openUserProfile()}
          className="cursor-pointer"
        >
          <Settings className="w-4 h-4" />
          Manage Account
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <SignOutButton>
            <button className="flex items-center gap-2 w-full">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </SignOutButton>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
