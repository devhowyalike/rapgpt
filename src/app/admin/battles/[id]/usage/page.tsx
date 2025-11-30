import { ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { checkRole } from "@/lib/auth/roles";
import { getBattleById } from "@/lib/battle-storage";
import {
  getBattleTokenEvents,
  getBattleTokenTotals,
  getBattleTokenTotalsByModel,
} from "@/lib/usage-storage";

export const dynamic = "force-dynamic";

export default async function AdminBattleUsagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const isAdmin = await checkRole("admin");
  if (!isAdmin) {
    redirect("/");
  }

  const battle = await getBattleById(id);
  if (!battle) {
    redirect("/admin/battles-list");
  }

  const totals = await getBattleTokenTotals(id);
  const byModel = await getBattleTokenTotalsByModel(id);
  const events = await getBattleTokenEvents(id);

  const fmt = (n: number | string | undefined | null) =>
    n == null ? "0" : Number(n).toLocaleString();

  return (
    <div className="min-h-dvh bg-linear-to-br from-gray-900 via-purple-900 to-black">
      <SiteHeader />
      <div className="max-w-[1400px] mx-auto px-4 py-24">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="font-bebas text-6xl text-white mb-2 flex items-center gap-3">
              <Shield className="text-purple-400" size={48} />
              Usage: {battle.title}
            </h1>
            <p className="text-gray-400 text-lg">
              Total tokens:{" "}
              <span className="text-white">{fmt(totals.totalTokens)}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link
                href="/admin/battles-list"
                className="text-purple-400 border-purple-400 bg-gray-900/50 hover:bg-purple-400/10"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Battles
              </Link>
            </Button>
          </div>
        </div>

        <div className="mb-8 bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-purple-500/20">
            <h2 className="text-white font-semibold">By Model</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-purple-500/20">
                <TableHead className="text-gray-300">Provider</TableHead>
                <TableHead className="text-gray-300">Model</TableHead>
                <TableHead className="text-gray-300 text-right">
                  Input
                </TableHead>
                <TableHead className="text-gray-300 text-right">
                  Output
                </TableHead>
                <TableHead className="text-gray-300 text-right pr-6">
                  Total
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byModel.map((row) => (
                <TableRow
                  key={`${row.provider}-${row.model}`}
                  className="border-purple-500/20"
                >
                  <TableCell className="text-gray-300">
                    {row.provider}
                  </TableCell>
                  <TableCell className="text-gray-300">{row.model}</TableCell>
                  <TableCell className="text-gray-300 text-right">
                    {fmt(row.inputTokens)}
                  </TableCell>
                  <TableCell className="text-gray-300 text-right">
                    {fmt(row.outputTokens)}
                  </TableCell>
                  <TableCell className="text-gray-300 text-right pr-6">
                    {fmt(row.totalTokens)}
                  </TableCell>
                </TableRow>
              ))}
              {byModel.length === 0 && (
                <TableRow className="border-purple-500/20">
                  <TableCell
                    colSpan={5}
                    className="text-center text-gray-400 py-6"
                  >
                    No usage recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-purple-500/20">
            <h2 className="text-white font-semibold">Events</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-purple-500/20">
                <TableHead className="text-gray-300">Time</TableHead>
                <TableHead className="text-gray-300">Round</TableHead>
                <TableHead className="text-gray-300">Persona</TableHead>
                <TableHead className="text-gray-300">Provider</TableHead>
                <TableHead className="text-gray-300">Model</TableHead>
                <TableHead className="text-gray-300 text-right">
                  Input
                </TableHead>
                <TableHead className="text-gray-300 text-right">
                  Output
                </TableHead>
                <TableHead className="text-gray-300 text-right">
                  Cached
                </TableHead>
                <TableHead className="text-gray-300 text-right pr-6">
                  Total
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((e) => (
                <TableRow key={e.id} className="border-purple-500/20">
                  <TableCell className="text-gray-300">
                    {new Date(e.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {e.round ?? "-"}
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {e.personaId ?? "-"}
                  </TableCell>
                  <TableCell className="text-gray-300">{e.provider}</TableCell>
                  <TableCell className="text-gray-300">{e.model}</TableCell>
                  <TableCell className="text-gray-300 text-right">
                    {fmt(e.inputTokens)}
                  </TableCell>
                  <TableCell className="text-gray-300 text-right">
                    {fmt(e.outputTokens)}
                  </TableCell>
                  <TableCell className="text-orange-400 text-right">
                    {fmt(e.cachedInputTokens)}
                  </TableCell>
                  <TableCell className="text-gray-300 text-right pr-6">
                    {fmt(e.totalTokens)}
                  </TableCell>
                </TableRow>
              ))}
              {events.length === 0 && (
                <TableRow className="border-purple-500/20">
                  <TableCell
                    colSpan={9}
                    className="text-center text-gray-400 py-6"
                  >
                    No events recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
