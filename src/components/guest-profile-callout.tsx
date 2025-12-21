"use client";

import { CreateBattleButton } from "./header/CreateBattleButton";

export function GuestProfileCallout() {
  return (
    <div className="bg-linear-to-r from-purple-900/30 via-pink-900/30 to-purple-900/30 backdrop-blur-sm border border-purple-500/30 rounded-lg p-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <h3 className="font-bebas text-xl sm:text-2xl text-white mb-1 text-pretty">
            Ready to Create Your Own Battles?
          </h3>
          <p className="text-purple-200 text-base sm:text-md text-pretty">
            Sign up to start cooking your own AI e-Beef
          </p>
        </div>

        <CreateBattleButton isSignedIn={false} guestText="Sign Up" isSignUp={true} />
      </div>
    </div>
  );
}
