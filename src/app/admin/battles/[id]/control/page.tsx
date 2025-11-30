/**
 * Control page for managing live battles
 * Accessible by battle creators and admins
 */

import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { AdminBattleControl } from "@/components/admin/admin-battle-control";
import { AdminErrorBoundary } from "@/components/admin/error-boundary";
import { canManageBattle } from "@/lib/auth/roles";
import { getBattleById } from "@/lib/battle-storage";

export const dynamic = "force-dynamic";

export default async function AdminBattleControlPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { id } = await params;

  // Check if user can manage this battle
  const authCheck = await canManageBattle(id);
  if (!authCheck.authorized) {
    redirect("/");
  }

  const battle = await getBattleById(id);

  if (!battle) {
    notFound();
  }

  return (
    <AdminErrorBoundary>
      <AdminBattleControl initialBattle={battle} />
    </AdminErrorBoundary>
  );
}
