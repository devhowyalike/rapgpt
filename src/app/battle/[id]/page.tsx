import { getBattleById } from "@/lib/battle-storage";
import { BattleController } from "@/components/battle-controller";
import { LiveBattleViewer } from "@/components/live-battle-viewer";
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

  // If battle is live, show the live viewer instead of the controller
  if (battle.isLive) {
    return <LiveBattleViewer initialBattle={battle} />;
  }

  return <BattleController initialBattle={battle} />;
}
