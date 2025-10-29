import { getBattleById } from "@/lib/battle-storage";
import { notFound } from "next/navigation";

export default async function TestBattlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const battle = await getBattleById(id);

  if (!battle) {
    notFound();
  }

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-4">Battle Data</h1>
      <pre className="text-xs bg-gray-800 p-4 rounded overflow-auto">
        {JSON.stringify(battle, null, 2)}
      </pre>
    </div>
  );
}
