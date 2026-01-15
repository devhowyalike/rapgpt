"use client";

import {
  SignInButton,
  SignOutButton,
  useAuth,
  useClerk,
  useUser,
} from "@clerk/nextjs";
import { ChevronDown, LogOut, Settings, User } from "lucide-react";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getDisplayNameFromClerkUser } from "@/lib/get-display-name";

export function UserButton() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const clerk = useClerk();

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
      <SignInButton mode="modal" forceRedirectUrl="/">
        <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
          <User size={18} />
          <span className="hidden sm:inline">Sign In</span>
        </button>
      </SignInButton>
    );
  }

  const displayName = getDisplayNameFromClerkUser(user);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors text-white">
          <div className="relative w-8 h-8 shrink-0">
            <Image
              src={user?.imageUrl || ""}
              alt={displayName}
              fill
              className="rounded-full border-2 border-purple-500 object-cover"
            />
          </div>
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
