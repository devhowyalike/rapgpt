import { auth } from "@clerk/nextjs/server";
import { desc, eq, sql } from "drizzle-orm";
import { ChevronLeft, ChevronRight, Users as UsersIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { GuestProfileCallout } from "@/components/guest-profile-callout";
import { SiteHeader } from "@/components/site-header";
import { decrypt } from "@/lib/auth/encryption";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { APP_TITLE } from "@/lib/constants";

// Revalidate every 5 minutes
export const revalidate = 300;
export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

interface CommunityPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function CommunityPage({
  searchParams,
}: CommunityPageProps) {
  const { page = "1" } = await searchParams;
  const pageNumber = Math.max(1, Number.parseInt(page) || 1);
  const offset = (pageNumber - 1) * PAGE_SIZE;

  // Check authentication status
  const { sessionClaims } = await auth();
  const isAuthenticated = !!sessionClaims;

  // Fetch users with pagination and only needed fields (only public profiles)
  const [allUsers, totalCountResult] = await Promise.all([
    db
      .select({
        id: users.id,
        encryptedDisplayName: users.encryptedDisplayName,
        encryptedName: users.encryptedName,
        imageUrl: users.imageUrl,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.isProfilePublic, true))
      .orderBy(desc(users.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.isProfilePublic, true)),
  ]);

  const totalUsers = totalCountResult[0]?.count || 0;
  const totalPages = Math.ceil(totalUsers / PAGE_SIZE);
  const hasPrevPage = pageNumber > 1;
  const hasNextPage = pageNumber < totalPages;

  return (
    <>
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative pt-20 pb-6 md:pt-32 md:pb-8 overflow-hidden bg-black text-white selection:bg-yellow-500/30">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-purple-900/20 via-black to-black z-0" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl z-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-(family-name:--font-bebas-neue) mb-6 animate-slide-up flex flex-col items-center justify-center gap-4">
            <UsersIcon className="w-10 h-10 md:w-16 md:h-16 text-white" />
            Community
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed animate-slide-up [animation-delay:100ms] px-4">
            See what others have been cooking.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="bg-linear-to-b from-stage-darker to-stage-dark flex flex-col items-center pt-2 pb-4 px-4 md:pt-4 md:pb-6 md:px-6 min-h-[50vh]">
        <div className="max-w-7xl mx-auto w-full">
          {allUsers.length === 0 ? (
            <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-12 text-center max-w-2xl mx-auto mt-8">
              <h2 className="font-(family-name:--font-bebas-neue) text-3xl text-white mb-4">
                No Users Yet
              </h2>
              <p className="text-gray-400">
                Be the first to join the community!
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
              {allUsers.map((user) => {
                const displayName = user.encryptedDisplayName
                  ? decrypt(user.encryptedDisplayName)
                  : user.encryptedName
                  ? decrypt(user.encryptedName)
                  : "Anonymous User";

                return (
                  <Link
                    key={user.id}
                    href={`/profile/${user.id}`}
                    className="group bg-gray-900/30 border border-gray-800 rounded-lg p-2 sm:p-4 md:p-6 hover:bg-gray-800/50 hover:border-purple-500/40 transition-all duration-300 hover:-translate-y-1 w-[30%] sm:w-[22%] md:w-[18%] lg:w-[15%]"
                  >
                    <div className="flex flex-col items-center justify-center text-center gap-2 sm:gap-3 md:gap-4 h-full">
                      {user.imageUrl ? (
                        <div className="relative">
                          <Image
                            src={user.imageUrl}
                            alt={displayName}
                            width={80}
                            height={80}
                            className="rounded-full border-2 border-gray-700 group-hover:border-purple-500 transition-colors w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-gray-800 flex items-center justify-center border-2 border-gray-700 group-hover:border-purple-500 transition-colors">
                          <UsersIcon className="text-gray-400 group-hover:text-purple-400 w-6 h-6 sm:w-8 sm:h-8 transition-colors" />
                        </div>
                      )}
                      <div className="w-full">
                        <h3 className="font-semibold text-white text-xs sm:text-base md:text-lg line-clamp-1 group-hover:text-yellow-400 transition-colors truncate w-full">
                          {displayName}
                        </h3>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {!isAuthenticated && (
            <div className="mt-12">
              <GuestProfileCallout />
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2">
              <Link
                href={`/community?page=${pageNumber - 1}`}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border ${
                  hasPrevPage
                    ? "bg-gray-900 border-gray-700 text-white hover:bg-gray-800 hover:border-gray-600"
                    : "bg-gray-900/50 border-gray-800 text-gray-600 cursor-not-allowed pointer-events-none"
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Previous</span>
              </Link>

              <span className="px-4 py-2 text-gray-400 text-sm">
                Page {pageNumber} of {totalPages}
              </span>

              <Link
                href={`/community?page=${pageNumber + 1}`}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border ${
                  hasNextPage
                    ? "bg-gray-900 border-gray-700 text-white hover:bg-gray-800 hover:border-gray-600"
                    : "bg-gray-900/50 border-gray-800 text-gray-600 cursor-not-allowed pointer-events-none"
                }`}
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
