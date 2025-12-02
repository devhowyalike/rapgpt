import { notFound } from "next/navigation";
import { BattleController } from "@/components/battle-controller";
import { getBattleById } from "@/lib/battle-storage";

// Revalidate every 10 seconds for active battles
export const revalidate = 10;
export const dynamic = "force-dynamic";

export default async function BattlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const battle = await getBattleById(id);

  if (!battle) {
    notFound();
  }

  // Unified BattleController handles both regular and live battles
  return <BattleController initialBattle={battle} />;
}
