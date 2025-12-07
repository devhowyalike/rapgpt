"use client";

import { SignInButton } from "@clerk/nextjs";
import { Mic2 } from "lucide-react";
import Link from "next/link";

interface CreateBattleButtonProps {
  isSignedIn: boolean;
  mobileText?: string;
}

export function CreateBattleButton({
  isSignedIn,
  mobileText = "Battle",
}: CreateBattleButtonProps) {
  const classes =
    "flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium";

  const Content = () => (
    <>
      <Mic2 size={16} />
      <span className="hidden sm:inline">Create Battle</span>
      <span className="sm:hidden">{mobileText}</span>
    </>
  );

  if (isSignedIn) {
    return (
      <Link href="/new-battle" className={classes}>
        <Content />
      </Link>
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
