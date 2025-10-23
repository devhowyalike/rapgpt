"use client";

import {
  UserButton as ClerkUserButton,
  SignInButton,
  useAuth,
} from "@clerk/nextjs";
import Link from "next/link";
import { User } from "lucide-react";

export function UserButton() {
  const { isSignedIn } = useAuth();

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

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/my-battles"
        className="text-gray-300 hover:text-white transition-colors hidden sm:inline"
      >
        My Battles
      </Link>

      <ClerkUserButton
        appearance={{
          elements: {
            avatarBox: "w-10 h-10 border-2 border-purple-500",
            userButtonPopoverCard: "bg-gray-800 border border-gray-700",
            userButtonPopoverActions: "text-white",
            userButtonPopoverActionButton: "hover:bg-gray-700",
            userButtonPopoverActionButtonText: "text-gray-300",
            userButtonPopoverActionButtonIcon: "text-purple-400",
            userButtonPopoverFooter: "hidden",
          },
        }}
      >
        <ClerkUserButton.MenuItems>
          <ClerkUserButton.Link
            label="My Battles"
            labelIcon={<User size={16} />}
            href="/my-battles"
          />
          <ClerkUserButton.Action label="manageAccount" />
        </ClerkUserButton.MenuItems>
      </ClerkUserButton>
    </div>
  );
}
