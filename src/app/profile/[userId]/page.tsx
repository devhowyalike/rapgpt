import { auth } from "@clerk/nextjs/server";
import { and, desc, eq } from "drizzle-orm";
import { Globe, Lock, Swords, User as UserIcon } from "lucide-react";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GuestProfileCallout } from "@/components/guest-profile-callout";
import { ProfileBattlesFilter } from "@/components/profile-battles-filter";
import { ProfileHeaderMenu } from "@/components/profile-header-menu";
import { SiteHeader } from "@/components/site-header";
import { PageHero } from "@/components/page-hero";
import { decrypt } from "@/lib/auth/encryption";
import { getOrCreateUser } from "@/lib/auth/sync-user";
import { db } from "@/lib/db/client";
import { type BattleDB, battles, users } from "@/lib/db/schema";

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
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* Hero Section - Matches Homepage Design */}
      <PageHero 
        className="pt-24 pb-0 md:pt-32 md:pb-0"
        containerClassName="flex flex-col items-center"
      >
        {/* Avatar */}
        <div className="mb-4 animate-slide-up">
          {profileUser.imageUrl ? (
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-linear-to-r from-purple-600 to-blue-600 opacity-75 blur-sm" />
              <Image
                src={profileUser.imageUrl}
                alt={displayName}
                width={96}
                height={96}
                className="relative rounded-full border-2 border-white/20 w-20 h-20 md:w-24 md:h-24 object-cover"
              />
            </div>
          ) : (
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-linear-to-r from-purple-600 to-blue-600 opacity-75 blur-sm" />
              <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-black border-2 border-white/20 flex items-center justify-center">
                <UserIcon className="text-gray-400 w-10 h-10 md:w-12 md:h-12" />
              </div>
            </div>
          )}
        </div>

        {/* Name & Menu */}
        <div className="flex items-center gap-4 justify-center mb-3 animate-slide-up [animation-delay:100ms]">
          <h1 className="font-bebas text-3xl md:text-5xl text-white tracking-wide wrap-break-word max-w-[80vw] text-center">
            {displayName}
          </h1>
          {isOwnProfile && (
            <div className="shrink-0">
              <ProfileHeaderMenu
                initialIsPublic={profileUser.isProfilePublic}
                userId={profileUserId}
              />
            </div>
          )}
        </div>

        {/* Info & Badges */}
        <div className="flex flex-col items-center gap-3 animate-slide-up [animation-delay:200ms]">
          <p className="text-gray-400 text-lg">
            Member since{" "}
            {new Date(profileUser.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
            })}
          </p>

          {isOwnProfile && (
            <div className="flex items-center gap-2 justify-center flex-wrap">
              {isViewingAsPublic ? (
                <span className="px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 flex items-center gap-1.5 text-sm">
                  <UserIcon className="w-3.5 h-3.5" />
                  Viewing as Public
                </span>
              ) : profileUser.isProfilePublic ? (
                <span className="px-3 py-1 rounded-full border border-green-500/30 bg-green-500/10 text-green-300 flex items-center gap-1.5 text-sm">
                  <Globe className="w-3.5 h-3.5" />
                  Public Profile
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full border border-gray-500/30 bg-gray-500/10 text-gray-300 flex items-center gap-1.5 text-sm">
                  <Lock className="w-3.5 h-3.5" />
                  Private Profile
                </span>
              )}
            </div>
          )}
        </div>
      </PageHero>

      {/* Battles Section */}
      <div
        className={`bg-linear-to-b from-stage-darker to-stage-dark flex flex-col items-center p-6 pt-6 pb-12 ${
          !clerkUserId ? "min-h-[30vh]" : "flex-1"
        }`}
      >
        <div className="max-w-6xl mx-auto w-full">
          {!profileUser.isProfilePublic && !isOwnProfile ? (
            <div className="bg-gray-900/50 border border-white/10 rounded-xl p-8 text-center max-w-md mx-auto mt-8">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="font-bebas text-2xl text-white mb-2">
                Private Profile
              </h3>
              <p className="text-gray-400 text-sm text-pretty">
                This user has chosen to keep their battle history private.
              </p>
            </div>
          ) : userBattles.length === 0 ? (
            <div className="bg-gray-900/50 border border-white/10 rounded-xl p-8 text-center max-w-md mx-auto mt-8">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Swords className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="font-bebas text-2xl text-white mb-2">
                {isOwnProfile ? "No Battles Yet" : "No Public Battles"}
              </h3>
              <p className="text-gray-400 text-sm mb-6 text-pretty">
                {isOwnProfile
                  ? "Step into the arena and create your first AI rap battle."
                  : "This user hasn't published any battles yet."}
              </p>
              {isOwnProfile && (
                <Link
                  href="/new-battle"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-all hover:scale-105 font-bold text-sm"
                >
                  Create Your First Battle
                </Link>
              )}
            </div>
          ) : (
            <ProfileBattlesFilter
              battles={userBattles}
              shareUrl={shareUrl}
              isOwnProfile={isOwnProfile}
              userIsProfilePublic={profileUser.isProfilePublic}
            />
          )}
        </div>
      </div>

      {/* Guest Callout - Show to non-signed-in users */}
      {!clerkUserId && (
        <div className="bg-stage-dark border-t border-white/5 pt-12 pb-24 flex-1">
          <div className="max-w-4xl mx-auto px-4">
            <GuestProfileCallout />
          </div>
        </div>
      )}
    </div>
  );
}
