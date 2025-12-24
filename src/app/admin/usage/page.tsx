import { ChevronLeft, Shield } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AllTimeTokenUsage } from "@/components/admin/all-time-token-usage";
import { SongCreationUsage } from "@/components/admin/song-creation-usage";
import { SiteHeader } from "@/components/site-header";
import { checkRole } from "@/lib/auth/roles";
import { getSunoCredits } from "@/lib/suno/client";
import {
  getAllTimeBattleStats,
  getAllTimeTokenTotals,
  getAllTimeTokenTotalsByModel,
  getAllTimeSongCreationTotals,
} from "@/lib/usage-storage";

export const dynamic = "force-dynamic";

export default async function AdminUsagePage() {
  // Check if user is admin
  const isAdmin = await checkRole("admin");

  if (!isAdmin) {
    redirect("/");
  }

  const totals = await getAllTimeTokenTotals();
  const byModel = await getAllTimeTokenTotalsByModel();
  const battleStats = await getAllTimeBattleStats();
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
            Usage & Generation Analytics
          </h1>
          <p className="text-gray-400 text-lg">
            Detailed breakdown of all-time token consumption and song generation
          </p>
        </div>

        <div className="space-y-8">
          <SongCreationUsage totals={songTotals} sunoCredits={sunoCredits} />
          <AllTimeTokenUsage totals={totals} byModel={byModel} battleStats={battleStats} />
        </div>
      </div>
    </div>
  );
}
