"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowUpDown,
  Radio,
  MoreVertical,
  Eye,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import type { Battle } from "@/lib/shared";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";

type SortField =
  | "title"
  | "status"
  | "createdAt"
  | "verses"
  | "comments"
  | "matchup"
  | "creator"
  | "round";
type SortDirection = "asc" | "desc";

interface BattlesTableProps {
  battles: Battle[];
}

export function BattlesTable({ battles }: BattlesTableProps) {
  const router = useRouter();
  const [sortField, setSortField] = React.useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] =
    React.useState<SortDirection>("desc");
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [battleToDelete, setBattleToDelete] = React.useState<Battle | null>(
    null
  );
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleDeleteClick = (battle: Battle) => {
    setBattleToDelete(battle);
    setErrorMessage(null);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!battleToDelete) return;

    setIsDeleting(true);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/battle/${battleToDelete.id}/delete`, {
        method: "DELETE",
      });

      if (response.ok) {
        setShowDeleteDialog(false);
        setBattleToDelete(null);
        router.refresh();
      } else {
        const data = await response.json();
        setErrorMessage(data.error || "Failed to delete battle");
        setIsDeleting(false);
      }
    } catch (error) {
      console.error("Error deleting battle:", error);
      setErrorMessage("Failed to delete battle");
      setIsDeleting(false);
    }
  };

  const sortedBattles = React.useMemo(() => {
    return [...battles].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "createdAt":
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case "verses":
          aValue = a.verses.length;
          bValue = b.verses.length;
          break;
        case "comments":
          aValue = a.comments.length;
          bValue = b.comments.length;
          break;
        case "matchup":
          aValue =
            `${a.personas.left.name} vs ${a.personas.right.name}`.toLowerCase();
          bValue =
            `${b.personas.left.name} vs ${b.personas.right.name}`.toLowerCase();
          break;
        case "creator":
          aValue = (a.creator?.displayName || "Unknown").toLowerCase();
          bValue = (b.creator?.displayName || "Unknown").toLowerCase();
          break;
        case "round":
          aValue = a.currentRound;
          bValue = b.currentRound;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [battles, sortField, sortDirection]);

  const SortButton = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <Button
      variant="ghost"
      onClick={() => handleSort(field)}
      className="-ml-3 h-8 data-[state=open]:bg-accent"
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-purple-500/20 hover:bg-gray-700/50">
            <TableHead className="text-gray-300">
              <SortButton field="title">Title</SortButton>
            </TableHead>
            <TableHead className="text-gray-300">
              <SortButton field="status">Status</SortButton>
            </TableHead>
            <TableHead className="text-gray-300">
              <SortButton field="matchup">Matchup</SortButton>
            </TableHead>
            <TableHead className="text-gray-300">
              <SortButton field="creator">Creator</SortButton>
            </TableHead>
            <TableHead className="text-gray-300">
              <SortButton field="createdAt">Created</SortButton>
            </TableHead>
            <TableHead className="text-gray-300 text-center">
              <SortButton field="verses">Verses</SortButton>
            </TableHead>
            <TableHead className="text-gray-300 text-center">
              <SortButton field="comments">Comments</SortButton>
            </TableHead>
            <TableHead className="text-gray-300">
              <SortButton field="round">Round</SortButton>
            </TableHead>
            <TableHead className="text-gray-300">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedBattles.map((battle) => (
            <TableRow
              key={battle.id}
              className="border-purple-500/20 hover:bg-gray-700/50 transition-colors"
            >
              <TableCell className="font-medium text-white">
                <div className="flex items-center gap-2">
                  {battle.isLive && (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <Radio className="w-4 h-4 text-red-400" />
                    </div>
                  )}
                  <span className="truncate max-w-[200px]">{battle.title}</span>
                </div>
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    battle.status === "completed"
                      ? "bg-green-900/30 text-green-400 border border-green-500/30"
                      : battle.status === "ongoing"
                      ? "bg-blue-900/30 text-blue-400 border border-blue-500/30"
                      : battle.status === "upcoming"
                      ? "bg-yellow-900/30 text-yellow-400 border border-yellow-500/30"
                      : "bg-gray-700/50 text-gray-400 border border-gray-600/30"
                  }`}
                >
                  {battle.status}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm">
                  <span
                    className="font-medium truncate max-w-[80px]"
                    style={{ color: battle.personas.left.accentColor }}
                  >
                    {battle.personas.left.name}
                  </span>
                  <span className="text-gray-500">vs</span>
                  <span
                    className="font-medium truncate max-w-[80px]"
                    style={{ color: battle.personas.right.accentColor }}
                  >
                    {battle.personas.right.name}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-gray-400 text-sm">
                {battle.creator?.displayName || "Unknown"}
              </TableCell>
              <TableCell className="text-gray-400 text-sm whitespace-nowrap">
                {new Date(battle.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </TableCell>
              <TableCell className="text-center text-gray-300">
                {battle.verses.length}
              </TableCell>
              <TableCell className="text-center text-gray-300">
                {battle.comments.length}
              </TableCell>
              <TableCell className="text-gray-400 text-sm">
                {battle.currentRound}/3
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-gray-700/50"
                    >
                      <span className="sr-only">Open menu</span>
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/battle/${battle.id}`}
                        className="flex items-center cursor-pointer"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDeleteClick(battle)}
                      className="text-red-400 focus:text-red-400 focus:bg-red-900/20 cursor-pointer"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {sortedBattles.length === 0 && (
        <div className="p-8 text-center text-gray-400">
          No battles found. Create one first!
        </div>
      )}

      <Dialog.Root open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-gray-900 border border-gray-800 rounded-lg shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1">
                <Dialog.Title className="text-xl font-bold text-white mb-2">
                  Delete Battle?
                </Dialog.Title>
                <Dialog.Description className="text-gray-400 mb-4">
                  Are you sure you want to delete "
                  {battleToDelete?.title || "this battle"}"? This will also
                  delete all votes and comments. This action cannot be undone.
                </Dialog.Description>

                {errorMessage && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {errorMessage}
                  </div>
                )}

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowDeleteDialog(false)}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? "Deleting..." : "Delete Battle"}
                  </button>
                </div>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
