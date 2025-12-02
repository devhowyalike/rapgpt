"use client";

import { SignInButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

interface SignInPromptProps {
  message?: string;
  className?: string;
  /** Optional custom redirect URL. Defaults to current page. */
  redirectUrl?: string;
}

export function SignInPrompt({
  message = "Sign in to participate",
  className = "",
  redirectUrl,
}: SignInPromptProps) {
  const pathname = usePathname();
  const redirect = redirectUrl ?? pathname;

  return (
    <div className={`text-center py-3 ${className}`}>
      <p className="text-gray-400 text-sm mb-3">{message}</p>
      <SignInButton mode="modal" forceRedirectUrl={redirect}>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors text-sm font-medium">
          Sign In
        </button>
      </SignInButton>
    </div>
  );
}
