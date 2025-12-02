"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import { ReactNode } from "react";

interface ProtectedActionProps {
  children: ReactNode;
  fallbackText?: string;
  className?: string;
}

/**
 * Wrapper component that protects actions requiring authentication
 * Shows a sign-in prompt if user is not authenticated
 */
export function ProtectedAction({
  children,
  fallbackText = "Sign in required",
  className,
}: ProtectedActionProps) {
  const { isSignedIn } = useAuth();

  if (!isSignedIn) {
    return (
      <div className={className}>
        <SignInButton mode="modal">
          <button
            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors border border-gray-600"
            title={fallbackText}
          >
            {fallbackText}
          </button>
        </SignInButton>
      </div>
    );
  }

  return <>{children}</>;
}
