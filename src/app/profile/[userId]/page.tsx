import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { db } from "@/lib/db/client";
import { battles, users, type BattleDB } from "@/lib/db/schema";
import { desc, eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { decrypt } from "@/lib/auth/encryption";
import { getOrCreateUser } from "@/lib/auth/sync-user";
import { MyBattleCard } from "@/components/my-battle-card";
import { ProfileHeaderMenu } from "@/components/profile-header-menu";
import { GuestProfileCallout } from "@/components/guest-profile-callout";
import { Lock, Globe, User as UserIcon, Swords } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface ProfilePageProps {
  params: Promise<{
    userId: string;
  }>;
  searchParams: Promise<{
    viewAs?: string;
  }>;
}

export default async function ProfilePage({
  params,
  searchParams,
}: ProfilePageProps) {
  const { userId: profileUserId } = await params;
  const { viewAs } = await searchParams;

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
  const isViewingAsPublic = viewAs === "public";
  let userBattles: BattleDB[];
  if (isOwnProfile && !isViewingAsPublic) {
    // Show all battles for own profile (normal view)
    userBattles = await db
      .select()
      .from(battles)
      .where(eq(battles.createdBy, profileUserId))
      .orderBy(desc(battles.createdAt));
  } else if (
    profileUser.isProfilePublic ||
    (isOwnProfile && isViewingAsPublic)
  ) {
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

  // Get the current URL origin from headers
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const protocol = headersList.get("x-forwarded-proto") || "https";
  const shareUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

  return (
    <div className="min-h-dvh bg-linear-to-br from-gray-900 via-purple-900 to-black">
      <SiteHeader />
      <div className="max-w-6xl mx-auto px-4 pt-[calc(var(--header-height)+3rem)] pb-16 md:pt-[calc(var(--header-height)+4rem)] md:pb-24">
        {/* User Profile Header */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-4 md:p-8 mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6">
            {profileUser.imageUrl ? (
              <Image
                src={profileUser.imageUrl}
                alt={displayName}
                width={120}
                height={120}
                className="rounded-full border-2 md:border-4 border-purple-500 w-20 h-20 sm:w-24 sm:h-24 md:w-[120px] md:h-[120px]"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-[120px] md:h-[120px] rounded-full bg-purple-600/30 flex items-center justify-center border-2 md:border-4 border-purple-500">
                <UserIcon className="text-purple-300 w-10 h-10 sm:w-12 sm:h-12 md:w-[60px] md:h-[60px]" />
              </div>
            )}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-start justify-between gap-2 md:gap-4 mb-2">
                <h1 className="font-bebas text-3xl sm:text-4xl md:text-5xl text-white line-clamp-2">
                  {displayName}
                </h1>
                {isOwnProfile && (
                  <ProfileHeaderMenu
                    initialIsPublic={profileUser.isProfilePublic}
                    userId={profileUserId}
                  />
                )}
              </div>
              <p className="text-gray-400 mb-3 md:mb-4 text-sm md:text-base">
                Member since{" "}
                {new Date(profileUser.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                })}
              </p>
              {isOwnProfile && (
                <div className="flex items-center gap-2 justify-center md:justify-start flex-wrap">
                  {isViewingAsPublic ? (
                    <span className="px-2 md:px-3 py-1 rounded bg-blue-600/30 text-blue-300 flex items-center gap-1 text-xs md:text-sm">
                      <UserIcon className="w-3 h-3 md:w-[14px] md:h-[14px]" />
                      Viewing as Public
                    </span>
                  ) : profileUser.isProfilePublic ? (
                    <span className="px-2 md:px-3 py-1 rounded bg-green-600/30 text-green-300 flex items-center gap-1 text-xs md:text-sm">
                      <Globe className="w-3 h-3 md:w-[14px] md:h-[14px]" />
                      Public Profile
                    </span>
                  ) : (
                    <span className="px-2 md:px-3 py-1 rounded bg-gray-600/30 text-gray-300 flex items-center gap-1 text-xs md:text-sm">
                      <Lock className="w-3 h-3 md:w-[14px] md:h-[14px]" />
                      Private Profile
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Battles Section */}
        <div>
          <div className="flex items-center justify-between mb-4 md:mb-6 gap-2">
            <h2 className="font-bebas text-2xl sm:text-3xl md:text-4xl text-white">
              {isOwnProfile ? "My e-Beefs" : "e-Beefs"}
            </h2>
            {isOwnProfile && !isViewingAsPublic && userBattles.length > 0 && (
              <Link
                href="/new-battle"
                className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-semibold text-sm md:text-base"
              >
                <Swords className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Create Battle</span>
                <span className="sm:hidden">Create</span>
              </Link>
            )}
          </div>

          {!profileUser.isProfilePublic && !isOwnProfile ? (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6 md:p-12 text-center">
              <Lock className="w-12 h-12 md:w-16 md:h-16 text-gray-500 mx-auto mb-3 md:mb-4" />
              <h3 className="font-bebas text-2xl md:text-3xl text-white mb-2 md:mb-4">
                Private Profile
              </h3>
              <p className="text-gray-400 text-sm md:text-base">
                This user has set their profile to private.
              </p>
            </div>
          ) : userBattles.length === 0 ? (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6 md:p-12 text-center">
              <h3 className="font-bebas text-2xl md:text-3xl text-white mb-2 md:mb-4">
                {isOwnProfile ? "No Battles Yet" : "No Public Battles"}
              </h3>
              <p className="text-gray-400 mb-4 md:mb-6 text-sm md:text-base">
                {isOwnProfile
                  ? "Create your first battle to see it here"
                  : "This user hasn't published any battles yet"}
              </p>
              {isOwnProfile && (
                <Link
                  href="/new-battle"
                  className="inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-semibold text-sm md:text-base"
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
                  showManagement={isOwnProfile}
                  userIsProfilePublic={profileUser.isProfilePublic}
                />
              ))}
            </div>
          )}
        </div>

        {/* Guest Callout - Show to non-signed-in users */}
        {!clerkUserId && <GuestProfileCallout />}
      </div>
    </div>
  );
}
