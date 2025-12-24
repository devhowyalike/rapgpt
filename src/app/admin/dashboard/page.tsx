import { auth } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import { Shield, Swords } from "lucide-react";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminDashboardClient } from "@/components/admin/admin-dashboard-client";
import { MonthlyBattleStatsComponent } from "@/components/admin/monthly-battle-stats";
import { MonthlyTokenUsage } from "@/components/admin/monthly-token-usage";
import { SongCreationUsage } from "@/components/admin/song-creation-usage";
import { WebSocketStats } from "@/components/admin/websocket-stats";
import { SiteHeader } from "@/components/site-header";
import { decrypt } from "@/lib/auth/encryption";
import { checkRole } from "@/lib/auth/roles";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import {
  getAvailableBattleMonths,
  getAvailableMonths,
  getCurrentMonthBattleStats,
  getCurrentMonthTokenTotals,
  getMonthlyBattleStats,
  getMonthlyTokenTotals,
  getMonthlySongCreationTotals,
  getCurrentMonthSongCreationTotals,
} from "@/lib/usage-storage";
import { getSunoCredits } from "@/lib/suno/client";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  try {
    // Check if user is admin
    const isAdmin = await checkRole("admin");

    if (!isAdmin) {
      redirect("/");
    }

    // Get current user's Clerk ID
    const { userId: clerkUserId } = await auth();

    // Fetch all users
    const allUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));

    // Get current user from database to pass their ID
    const currentDbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkUserId!),
    });

    // Get available months for selectors
    const availableTokenMonths = await getAvailableMonths();
    const availableBattleMonths = await getAvailableBattleMonths();

    // Determine which month to show
    const resolvedSearchParams = await searchParams;
    const monthParam = resolvedSearchParams?.month as string | undefined;
    const yearParam = resolvedSearchParams?.year as string | undefined;

    let monthlyTokens;
    let monthlyBattleStats;
    let monthlySongTotals;
    if (monthParam && yearParam) {
      const month = Number.parseInt(monthParam);
      const year = Number.parseInt(yearParam);
      monthlyTokens = await getMonthlyTokenTotals(month, year);
      monthlyBattleStats = await getMonthlyBattleStats(month, year);
      monthlySongTotals = await getMonthlySongCreationTotals(month, year);
    } else {
      monthlyTokens = await getCurrentMonthTokenTotals();
      monthlyBattleStats = await getCurrentMonthBattleStats();
      monthlySongTotals = await getCurrentMonthSongCreationTotals();
    }

    // Fetch live Suno API credits
    const sunoCredits = await getSunoCredits();

    // Decrypt user data for display
    const decryptedUsers = allUsers.map((user) => {
      let displayName = "Anonymous";
      let email = "Unknown";

      try {
        displayName = user.encryptedDisplayName
          ? decrypt(user.encryptedDisplayName)
          : user.encryptedName
          ? decrypt(user.encryptedName)
          : "Anonymous";

        email = decrypt(user.encryptedEmail);
      } catch (error) {
        console.error("Error decrypting user data:", error);
      }

      return {
        ...user,
        displayName,
        email,
      };
    });

    return (
      <div className="min-h-dvh bg-linear-to-br from-gray-900 via-purple-900 to-black">
        <SiteHeader />
        <div className="max-w-7xl mx-auto px-4 py-24">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="font-bebas text-6xl text-white mb-2 flex items-center gap-3">
                <Shield className="text-purple-400" size={48} />
                Admin Dashboard
              </h1>
              <p className="text-gray-400 text-lg">Manage users and battles</p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/admin/battles-list"
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Swords size={20} />
                View All Battles
              </Link>
            </div>
          </div>

          {/* Song Creation Credits (Monthly) */}
          <div className="mb-8">
            <SongCreationUsage
              totals={monthlySongTotals}
              sunoCredits={sunoCredits}
              month={monthlyTokens.month}
              year={monthlyTokens.year}
              availableMonths={availableTokenMonths}
            />
          </div>

          {/* Monthly Token Usage */}
          <div className="mb-8">
            <MonthlyTokenUsage
              totals={monthlyTokens}
              availableMonths={availableTokenMonths}
            />
          </div>

          {/* Monthly Battle Stats */}
          <div className="mb-8">
            <MonthlyBattleStatsComponent
              stats={monthlyBattleStats}
              availableMonths={availableBattleMonths}
            />
          </div>

          {/* Live WebSocket Stats */}
          <div className="mb-8">
            <WebSocketStats />
          </div>

          <AdminDashboardClient
            users={decryptedUsers}
            currentUserId={currentDbUser?.id}
          />
        </div>
      </div>
    );
  } catch (error) {
    // Re-throw redirect errors so Next.js can handle them
    if (isRedirectError(error)) {
      throw error;
    }
    console.error("Admin dashboard error:", error);
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <Shield className="text-red-400 mx-auto mb-4" size={64} />
          <h1 className="font-bebas text-4xl text-white mb-4">
            Admin Dashboard Error
          </h1>
          <p className="text-gray-400 mb-4">
            There was an error loading the admin dashboard. Please check the
            server logs.
          </p>
          <pre className="bg-gray-800 text-red-400 p-4 rounded-lg text-left text-sm overflow-auto">
            {error instanceof Error ? error.message : "Unknown error"}
          </pre>
          <Link
            href="/"
            className="inline-block mt-6 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }
}
