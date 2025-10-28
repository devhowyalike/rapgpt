import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db/client";
import { battles, users, type BattleDB } from "@/lib/db/schema";
import { desc, eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { decrypt } from "@/lib/auth/encryption";
import { getOrCreateUser } from "@/lib/auth/sync-user";
import { MyBattleCard } from "@/components/my-battle-card";
import { ProfilePrivacyToggle } from "@/components/profile-privacy-toggle";
import { Lock, Globe, User as UserIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ProfilePageProps {
  params: Promise<{
    userId: string;
  }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { userId: profileUserId } = await params;

  // Get the profile user
  const profileUser = await db.query.users.findFirst({
    where: eq(users.id, profileUserId),
  });

  if (!profileUser) {
    notFound();
  }

  // Check if current user is viewing their own profile
  const { userId: clerkUserId } = await auth();
  let isOwnProfile = false;
  let currentUser = null;

  if (clerkUserId) {
    currentUser = await getOrCreateUser(clerkUserId);
    isOwnProfile = currentUser.id === profileUserId;
  }

  const displayName = profileUser.encryptedDisplayName
    ? decrypt(profileUser.encryptedDisplayName)
    : profileUser.encryptedName
    ? decrypt(profileUser.encryptedName)
    : "Anonymous User";

  // Determine what battles to show
  let userBattles: BattleDB[];
  if (isOwnProfile) {
    // Show all battles for own profile
    userBattles = await db
      .select()
      .from(battles)
      .where(
        and(eq(battles.createdBy, profileUserId), eq(battles.isFeatured, false))
      )
      .orderBy(desc(battles.createdAt));
  } else if (profileUser.isProfilePublic) {
    // Show only public battles for public profiles
    userBattles = await db
      .select()
      .from(battles)
      .where(
        and(
          eq(battles.createdBy, profileUserId),
          eq(battles.isFeatured, false),
          eq(battles.isPublic, true)
        )
      )
      .orderBy(desc(battles.createdAt));
  } else {
    // Private profile - show no battles
    userBattles = [];
  }

  const shareUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "";

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-purple-900 to-black">
      <SiteHeader />
      <div className="max-w-6xl mx-auto px-4 py-24">
        {/* User Profile Header */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {profileUser.imageUrl ? (
              <Image
                src={profileUser.imageUrl}
                alt={displayName}
                width={120}
                height={120}
                className="rounded-full border-4 border-purple-500"
              />
            ) : (
              <div className="w-30 h-30 rounded-full bg-purple-600/30 flex items-center justify-center border-4 border-purple-500">
                <UserIcon size={60} className="text-purple-300" />
              </div>
            )}
            <div className="flex-1 text-center md:text-left">
              <h1 className="font-bebas text-5xl text-white mb-2">
                {displayName}
              </h1>
              <p className="text-gray-400 mb-4">
                Member since{" "}
                {new Date(profileUser.createdAt).toLocaleDateString()}
              </p>
              <div className="flex items-center gap-2 justify-center md:justify-start flex-wrap">
                {profileUser.isProfilePublic ? (
                  <span className="px-3 py-1 rounded bg-green-600/30 text-green-300 flex items-center gap-1 text-sm">
                    <Globe size={14} />
                    Public Profile
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded bg-gray-600/30 text-gray-300 flex items-center gap-1 text-sm">
                    <Lock size={14} />
                    Private Profile
                  </span>
                )}
                {isOwnProfile && (
                  <>
                    <ProfilePrivacyToggle
                      initialIsPublic={profileUser.isProfilePublic}
                    />
                    <Link
                      href="/my-battles"
                      className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white text-sm transition-colors"
                    >
                      Manage Battles
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Battles Section */}
        <div>
          <h2 className="font-bebas text-4xl text-white mb-6">
            {isOwnProfile ? "My e-Beefs" : "Public e-Beefs"}
          </h2>

          {!profileUser.isProfilePublic && !isOwnProfile ? (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-12 text-center">
              <Lock className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="font-bebas text-3xl text-white mb-4">
                Private Profile
              </h3>
              <p className="text-gray-400">
                This user has set their profile to private.
              </p>
            </div>
          ) : userBattles.length === 0 ? (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-12 text-center">
              <h3 className="font-bebas text-3xl text-white mb-4">
                {isOwnProfile ? "No Battles Yet" : "No Public Battles"}
              </h3>
              <p className="text-gray-400 mb-6">
                {isOwnProfile
                  ? "Create your first battle to see it here"
                  : "This user hasn't published any battles yet"}
              </p>
              {isOwnProfile && (
                <Link
                  href="/my-battles/new"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-semibold"
                >
                  Create Your First Battle
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
              {userBattles.map((battle) => (
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
    </div>
  );
}
