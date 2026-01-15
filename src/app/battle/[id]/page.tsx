import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BattleController } from "@/components/battle-controller";
import { getBattleById } from "@/lib/battle-storage";
import { createMetadata } from "@/lib/metadata";

// Revalidate every 10 seconds for active battles
export const revalidate = 10;
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const battle = await getBattleById(id);

  if (!battle) {
    return createMetadata({
      title: "Battle Not Found",
      description: "This battle doesn't exist or has been removed.",
      noIndex: true,
    });
  }

  const persona1 = battle.persona1?.name ?? "Unknown";
  const persona2 = battle.persona2?.name ?? "Unknown";

  return createMetadata({
    title: `${persona1} vs ${persona2}`,
    description: `Watch the AI freestyle battle between ${persona1} and ${persona2}`,
    type: "article",
    image: battle.stageId ? `/stages/${battle.stageId}.webp` : undefined,
  });
}

export default async function BattlePage({ params }: Props) {
  const { id } = await params;
  const battle = await getBattleById(id);

  if (!battle) {
    notFound();
  }

  // Unified BattleController handles both regular and live battles
  return <BattleController initialBattle={battle} />;
}
