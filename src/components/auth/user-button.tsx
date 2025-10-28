"use client";

import {
  UserButton as ClerkUserButton,
  SignInButton,
  useAuth,
  useUser,
} from "@clerk/nextjs";
import Link from "next/link";
import { User } from "lucide-react";
import { useEffect, useState } from "react";

export function UserButton() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      // Fetch the database user ID from the public metadata
      const dbUserId = user.publicMetadata?.dbUserId as string | undefined;
      if (dbUserId) {
        setUserId(dbUserId);
      } else {
        // Fallback: fetch from API
        fetch("/api/user/me")
          .then((res) => res.json())
          .then((data) => {
            if (data.id) {
              setUserId(data.id);
            }
          })
          .catch(console.error);
      }
    }
  }, [user]);

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
        My e-Beefs
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
          {userId && (
            <ClerkUserButton.Link
              label="My Profile"
              labelIcon={<User size={16} />}
              href={`/profile/${userId}`}
            />
          )}
          <ClerkUserButton.Link
            label="My eBeefs"
            labelIcon={<User size={16} />}
            href="/my-battles"
          />
          <ClerkUserButton.Action label="manageAccount" />
        </ClerkUserButton.MenuItems>
      </ClerkUserButton>
    </div>
  );
}
