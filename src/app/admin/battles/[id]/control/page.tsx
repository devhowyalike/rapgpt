/**
 * Admin control page for managing live battles
 */

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getBattleById } from "@/lib/battle-storage";
import { checkRole } from "@/lib/auth/roles";
import { notFound } from "next/navigation";
import { AdminBattleControl } from "@/components/admin/admin-battle-control";
import { AdminErrorBoundary } from "@/components/admin/error-boundary";

export default async function AdminBattleControlPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Check if user is admin (using Clerk session claims)
  const adminCheck = await checkRole("admin");
  if (!adminCheck) {
    redirect("/");
  }

  const { id } = await params;
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
