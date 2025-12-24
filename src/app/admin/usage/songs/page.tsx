import { ChevronLeft, Shield } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SongCreationUsage } from "@/components/admin/song-creation-usage";
import { SiteHeader } from "@/components/site-header";
import { checkRole } from "@/lib/auth/roles";
import { getSunoCredits } from "@/lib/suno/client";
import { getAllTimeSongCreationTotals } from "@/lib/usage-storage";

export const dynamic = "force-dynamic";

export default async function AdminSongUsagePage() {
  // Check if user is admin
  const isAdmin = await checkRole("admin");

  if (!isAdmin) {
    redirect("/");
  }

  const songTotals = await getAllTimeSongCreationTotals();
  const sunoCredits = await getSunoCredits();

  return (
    <div className="min-h-dvh bg-linear-to-br from-gray-900 via-purple-900 to-black">
      <SiteHeader />
      <div className="max-w-7xl mx-auto px-4 py-24">
        <div className="mb-8">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ChevronLeft size={20} />
            Back to Dashboard
          </Link>
          <h1 className="font-bebas text-6xl text-white mb-2 flex items-center gap-3">
            <Shield className="text-purple-400" size={48} />
            All Time Song Usage
          </h1>
          <p className="text-gray-400 text-lg">
            Comprehensive breakdown of all-time song generation activity
          </p>
        </div>

        <div className="space-y-8">
          <SongCreationUsage totals={songTotals} sunoCredits={sunoCredits} />
        </div>
      </div>
    </div>
  );
}

