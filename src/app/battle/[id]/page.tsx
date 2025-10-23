import { getBattleById } from "@/lib/battle-storage";
import { BattleController } from "@/components/battle-controller";
import { notFound } from "next/navigation";

// Revalidate every 10 seconds for active battles
export const revalidate = 10;

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

  return <BattleController initialBattle={battle} />;
}
