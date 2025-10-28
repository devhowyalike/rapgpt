import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { battles } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getOrCreateUser } from "@/lib/auth/sync-user";
import { MyBattleCard } from "@/components/my-battle-card";
import { SiteHeader } from "@/components/site-header";

export default async function MyBattlesPage() {
  // Require authentication
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    redirect("/sign-in");
  }

  // Get or create user from database (syncs from Clerk if needed)
  const user = await getOrCreateUser(clerkUserId);

  // Fetch user's battles
  const myBattles = await db
    .select()
    .from(battles)
    .where(and(eq(battles.createdBy, user.id), eq(battles.isFeatured, false)))
    .orderBy(desc(battles.createdAt));

  const shareUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "";

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-purple-900 to-black">
      <SiteHeader />
      <div className="max-w-6xl mx-auto px-4 py-24">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-bebas text-6xl text-white mb-2">My e-Beefs</h1>
            <p className="text-gray-400 text-lg">
              Create and manage your personal battles
            </p>
          </div>
          <Link
            href="/my-battles/new"
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-semibold"
          >
            <Plus size={20} />
            Create Battle
          </Link>
        </div>

        {myBattles.length === 0 ? (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-12 text-center">
            <h2 className="font-bebas text-3xl text-white mb-4">
              No Battles Yet
            </h2>
            <p className="text-gray-400 mb-6">
              Create your first battle to see it here
            </p>
            <Link
              href="/my-battles/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-semibold"
            >
              <Plus size={20} />
              Create Your First Battle
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
            {myBattles.map((battle) => (
              <MyBattleCard
                key={battle.id}
                battle={battle}
                shareUrl={shareUrl}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
