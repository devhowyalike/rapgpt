"use client";

import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Mic2, User } from "lucide-react";
import Link from "next/link";

interface CreateBattleButtonProps {
  isSignedIn: boolean;
  mobileText?: string;
  guestText?: string;
  isSignUp?: boolean;
}

export function CreateBattleButton({
  isSignedIn,
  mobileText = "Battle",
  guestText = "Sign In",
  isSignUp = false,
}: CreateBattleButtonProps) {
  const classes =
    "flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium cursor-pointer";

  const Content = () => (
    <>
      {isSignedIn ? <Mic2 size={16} /> : <User size={16} />}
      <span className="hidden sm:inline">
        {isSignedIn ? "Create Battle" : guestText}
      </span>
      <span className="sm:hidden">{isSignedIn ? mobileText : guestText}</span>
    </>
  );

  if (isSignedIn) {
    return (
      <Link href="/new-battle" className={classes}>
        <Content />
      </Link>
    );
  }

  if (isSignUp) {
    return (
      <SignUpButton mode="modal" forceRedirectUrl="/new-battle">
        <button className={classes}>
          <Content />
        </button>
      </SignUpButton>
    );
  }

  return (
    <SignInButton mode="modal" forceRedirectUrl="/new-battle">
      <button className={classes}>
        <Content />
      </button>
    </SignInButton>
  );
}
