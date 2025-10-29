import Link from "next/link";
import { Sparkles } from "lucide-react";

export function GuestProfileCallout() {
  return (
    <div className="bg-linear-to-r from-purple-900/30 via-pink-900/30 to-purple-900/30 backdrop-blur-sm border border-purple-500/30 rounded-lg p-6 mt-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <h3 className="font-bebas text-2xl text-white mb-1">
            Ready to Create Your Own Battles?
          </h3>
          <p className="text-purple-200 text-sm">
            Sign up to start cooking your own AI e-Beef
          </p>
        </div>

        <Link
          href="/sign-in"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-semibold text-sm whitespace-nowrap"
        >
          <Sparkles className="w-4 h-4" />
          Sign Up Free
        </Link>
      </div>
    </div>
  );
}
