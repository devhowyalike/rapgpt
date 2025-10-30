import { getAllBattles } from "@/lib/battle-storage";
import { Shield, ArrowLeft } from "lucide-react";
import { checkRole } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { BattlesTable } from "@/components/admin/battles-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Revalidate every 5 seconds to show live status
export const revalidate = 5;
export const dynamic = "force-dynamic";

export default async function BattlesListPage() {
  // Check if user is admin
  const isAdmin = await checkRole("admin");
  if (!isAdmin) {
    redirect("/");
  }

  const battles = await getAllBattles();

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-purple-900 to-black">
      <SiteHeader />
      <div className="max-w-[1400px] mx-auto px-4 py-24">
        <div className="mb-8">
          <h1 className="font-bebas text-6xl text-white mb-2 flex items-center gap-3">
            <Shield className="text-purple-400" size={48} />
            All Battles
          </h1>
          <p className="text-gray-400 text-lg mb-4">
            Monitor and manage all battles ({battles.length} total)
          </p>
          <Button variant="outline" asChild>
            <Link href="/admin/dashboard" className="text-purple-400 border-purple-400 bg-gray-900/50 hover:bg-purple-400/10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Admin Dashboard
            </Link>
          </Button>
        </div>

        <BattlesTable battles={battles} />
      </div>
    </div>
  );
}
