import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { desc, sql, eq } from "drizzle-orm";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { GuestProfileCallout } from "@/components/guest-profile-callout";
import { decrypt } from "@/lib/auth/encryption";
import { Users as UsersIcon, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";

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
    <div className="min-h-dvh bg-linear-to-br from-gray-900 via-purple-900 to-black">
      <SiteHeader />
      <div className="max-w-6xl mx-auto px-4 pt-[calc(var(--header-height)+3rem)] pb-16 md:pt-[calc(var(--header-height)+4rem)] md:pb-24">
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between mb-2 gap-2">
            <h1 className="font-bebas text-3xl sm:text-4xl md:text-6xl text-white flex items-center gap-2 sm:gap-3">
              <UsersIcon className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12" />
              Community
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm shrink-0">
              {totalUsers} {totalUsers === 1 ? "member" : "members"}
            </p>
          </div>
          <p className="text-gray-400 text-sm md:text-lg">
            Meet the RapGPT community and check out their battles
          </p>
        </div>

        {allUsers.length === 0 ? (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6 md:p-12 text-center">
            <h2 className="font-bebas text-2xl md:text-3xl text-white mb-2 md:mb-4">
              No Users Yet
            </h2>
            <p className="text-gray-400 text-sm md:text-base">
              Be the first to join the community!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 md:gap-4">
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
                  className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-3 md:p-6 hover:border-purple-500/40 transition-all hover:scale-105"
                >
                  <div className="flex flex-col items-center text-center gap-2 md:gap-3">
                    {user.imageUrl ? (
                      <Image
                        src={user.imageUrl}
                        alt={displayName}
                        width={80}
                        height={80}
                        className="rounded-full border-2 border-purple-500 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20"
                      />
                    ) : (
                      <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-purple-600/30 flex items-center justify-center border-2 border-purple-500">
                        <UsersIcon className="text-purple-300 w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-white text-sm md:text-lg line-clamp-1">
                        {displayName}
                      </h3>
                      <p className="text-xs md:text-sm text-gray-400">
                        Joined{" "}
                        {new Date(user.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {!isAuthenticated && <GuestProfileCallout />}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-6 md:mt-8 flex items-center justify-center gap-2">
            <Link
              href={`/community?page=${pageNumber - 1}`}
              className={`flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-lg transition-colors text-sm md:text-base ${
                hasPrevPage
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-gray-700 text-gray-500 cursor-not-allowed pointer-events-none"
              }`}
            >
              <ChevronLeft className="w-4 h-4 md:w-[18px] md:h-[18px]" />
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </Link>

            <span className="px-2 md:px-4 py-1.5 md:py-2 text-gray-300 text-sm md:text-base">
              Page {pageNumber} of {totalPages}
            </span>

            <Link
              href={`/community?page=${pageNumber + 1}`}
              className={`flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-lg transition-colors text-sm md:text-base ${
                hasNextPage
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-gray-700 text-gray-500 cursor-not-allowed pointer-events-none"
              }`}
            >
              Next
              <ChevronRight className="w-4 h-4 md:w-[18px] md:h-[18px]" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
