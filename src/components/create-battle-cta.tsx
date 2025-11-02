"use client";

import Link from "next/link";
import { SignInButton } from "@clerk/nextjs";

interface CreateBattleCTAProps {
  isAuthenticated: boolean;
}

export function CreateBattleCTA({ isAuthenticated }: CreateBattleCTAProps) {
  if (isAuthenticated) {
    return (
      <Link
        href="/new-battle"
        className="inline-block px-8 py-4 bg-linear-to-r from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700 rounded-lg text-white font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
      >
        Start Beefin'
      </Link>
    );
  }

  return (
    <SignInButton mode="modal" forceRedirectUrl="/new-battle">
      <button className="inline-block px-8 py-4 bg-linear-to-r from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700 rounded-lg text-white font-bold text-lg transition-all transform hover:scale-105 shadow-lg">
        Sign In to Create
      </button>
    </SignInButton>
  );
}

