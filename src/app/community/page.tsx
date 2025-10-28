import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { desc, sql } from "drizzle-orm";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { decrypt } from "@/lib/auth/encryption";
import { Users as UsersIcon, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

// Revalidate every 5 minutes
export const revalidate = 300;

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

  // Fetch users with pagination and only needed fields
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
      .orderBy(desc(users.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(users),
  ]);

  const totalUsers = totalCountResult[0]?.count || 0;
  const totalPages = Math.ceil(totalUsers / PAGE_SIZE);
  const hasPrevPage = pageNumber > 1;
  const hasNextPage = pageNumber < totalPages;

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-purple-900 to-black">
      <SiteHeader />
      <div className="max-w-6xl mx-auto px-4 py-24">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-bebas text-6xl text-white flex items-center gap-3">
              <UsersIcon size={48} />
              Community
            </h1>
            <p className="text-gray-400 text-sm">
              {totalUsers} {totalUsers === 1 ? "member" : "members"}
            </p>
          </div>
          <p className="text-gray-400 text-lg">
            Meet the RapGPT community and check out their battles
          </p>
        </div>

        {allUsers.length === 0 ? (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-12 text-center">
            <h2 className="font-bebas text-3xl text-white mb-4">
              No Users Yet
            </h2>
            <p className="text-gray-400">Be the first to join the community!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                  className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/40 transition-all hover:scale-105"
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    {user.imageUrl ? (
                      <Image
                        src={user.imageUrl}
                        alt={displayName}
                        width={80}
                        height={80}
                        className="rounded-full border-2 border-purple-500"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-purple-600/30 flex items-center justify-center border-2 border-purple-500">
                        <UsersIcon size={32} className="text-purple-300" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-white text-lg">
                        {displayName}
                      </h3>
                      <p className="text-sm text-gray-400">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <Link
              href={`/community?page=${pageNumber - 1}`}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                hasPrevPage
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-gray-700 text-gray-500 cursor-not-allowed pointer-events-none"
              }`}
            >
              <ChevronLeft size={18} />
              Previous
            </Link>

            <span className="px-4 py-2 text-gray-300">
              Page {pageNumber} of {totalPages}
            </span>

            <Link
              href={`/community?page=${pageNumber + 1}`}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                hasNextPage
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-gray-700 text-gray-500 cursor-not-allowed pointer-events-none"
              }`}
            >
              Next
              <ChevronRight size={18} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
