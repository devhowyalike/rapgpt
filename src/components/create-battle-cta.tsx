"use client";

import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";

interface CreateBattleCTAProps {
  isAuthenticated: boolean;
  title?: string;
}

export function CreateBattleCTA({
  isAuthenticated,
  title = "Start Beefin'",
}: CreateBattleCTAProps) {
  if (isAuthenticated) {
    return (
      <Link
        href="/new-battle"
        className="inline-block px-8 py-4 bg-linear-to-r from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700 rounded-lg text-white font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
      >
        {title}
      </Link>
    );
  }

  return (
    <SignInButton mode="modal" forceRedirectUrl="/new-battle">
      <button className="inline-block px-8 py-4 bg-linear-to-r from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700 rounded-lg text-white font-bold text-lg transition-all transform hover:scale-105 shadow-lg">
        {title}
      </button>
    </SignInButton>
  );
}
