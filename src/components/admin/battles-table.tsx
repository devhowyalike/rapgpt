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
  Music,
  Check,
  X,
} from "lucide-react";
import type { Battle } from "@/lib/shared";
import { ROUNDS_PER_BATTLE, getDisplayRound } from "@/lib/shared";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

type SortField =
  | "title"
  | "status"
  | "createdAt"
  | "verses"
  | "comments"
  | "matchup"
  | "creator"
  | "round"
  | "musicGenerated";
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
  const [selectedBattles, setSelectedBattles] = React.useState<Set<string>>(
    new Set()
  );
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = React.useState(false);

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

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      const deletePromises = Array.from(selectedBattles).map((battleId) =>
        fetch(`/api/battle/${battleId}/delete`, {
          method: "DELETE",
        })
      );

      const responses = await Promise.all(deletePromises);
      const failedDeletes = responses.filter((res) => !res.ok);

      if (failedDeletes.length > 0) {
        setErrorMessage(
          `Failed to delete ${failedDeletes.length} of ${selectedBattles.size} battles`
        );
        setIsDeleting(false);
      } else {
        setIsDeleting(false);
        setShowBulkDeleteDialog(false);
        setSelectedBattles(new Set());
        router.refresh();
      }
    } catch (error) {
      console.error("Error deleting battles:", error);
      setErrorMessage("Failed to delete battles");
      setIsDeleting(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBattles(new Set(sortedBattles.map((b) => b.id)));
    } else {
      setSelectedBattles(new Set());
    }
  };

  const handleSelectBattle = (battleId: string, checked: boolean) => {
    const newSelected = new Set(selectedBattles);
    if (checked) {
      newSelected.add(battleId);
    } else {
      newSelected.delete(battleId);
    }
    setSelectedBattles(newSelected);
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
            `${a.personas.left.name} vs. ${a.personas.right.name}`.toLowerCase();
          bValue =
            `${b.personas.left.name} vs. ${b.personas.right.name}`.toLowerCase();
          break;
        case "creator":
          aValue = (a.creator?.displayName || "Unknown").toLowerCase();
          bValue = (b.creator?.displayName || "Unknown").toLowerCase();
          break;
        case "round":
          aValue = a.currentRound;
          bValue = b.currentRound;
          break;
        case "musicGenerated":
          aValue = a.generatedSong?.audioUrl ? 1 : 0;
          bValue = b.generatedSong?.audioUrl ? 1 : 0;
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
      {selectedBattles.size > 0 && (
        <div className="px-4 py-3 bg-purple-900/20 border-b border-purple-500/20 flex items-center justify-between">
          <span className="text-sm text-gray-300">
            {selectedBattles.size} battle{selectedBattles.size !== 1 ? "s" : ""}{" "}
            selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowBulkDeleteDialog(true)}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete Selected
          </Button>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow className="border-purple-500/20 hover:bg-gray-700/50">
            <TableHead className="w-12">
              <Checkbox
                checked={
                  sortedBattles.length > 0 &&
                  selectedBattles.size === sortedBattles.length
                }
                onCheckedChange={handleSelectAll}
                aria-label="Select all battles"
              />
            </TableHead>
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
            <TableHead className="text-gray-300 text-center">
              <SortButton field="musicGenerated">Music Generated</SortButton>
            </TableHead>
            <TableHead className="text-gray-300">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedBattles.map((battle) => (
            <TableRow
              key={battle.id}
              className={`border-purple-500/20 transition-colors ${
                selectedBattles.has(battle.id)
                  ? "bg-gray-700/50 hover:bg-gray-700/70"
                  : "hover:bg-gray-700/50"
              }`}
            >
              <TableCell>
                <Checkbox
                  checked={selectedBattles.has(battle.id)}
                  onCheckedChange={(checked) =>
                    handleSelectBattle(battle.id, checked as boolean)
                  }
                  aria-label={`Select ${battle.title}`}
                />
              </TableCell>
              <TableCell className="font-medium text-white">
                <Link
                  href={`/battle/${battle.id}`}
                  className="flex items-center gap-2 hover:text-purple-400 transition-colors underline underline-offset-2"
                >
                  {battle.isLive && (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <Radio className="w-4 h-4 text-red-400" />
                    </div>
                  )}
                  <span className="truncate max-w-[200px]">{battle.title}</span>
                </Link>
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    battle.status === "completed"
                      ? "bg-green-900/30 text-green-400 border border-green-500/30"
                      : battle.status === "paused"
                      ? "bg-orange-900/30 text-orange-400 border border-orange-500/30"
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
                {getDisplayRound(battle)}/{ROUNDS_PER_BATTLE}
              </TableCell>
              <TableCell className="text-center">
                {battle.generatedSong?.audioUrl ? (
                  <div className="flex items-center justify-center gap-1">
                    <Music className="w-4 h-4 text-green-400" />
                    <Check className="w-4 h-4 text-green-400" />
                  </div>
                ) : (
                  <X className="w-4 h-4 text-gray-500 mx-auto" />
                )}
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

      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Battle?"
        description={`Are you sure you want to delete "${
          battleToDelete?.title || "this battle"
        }"? This will also delete all votes and comments. This action cannot be undone.`}
        confirmLabel="Delete Battle"
        onConfirm={handleDelete}
        isLoading={isDeleting}
        variant="danger"
        icon={AlertTriangle}
        errorMessage={errorMessage || undefined}
      />

      <ConfirmationDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
        title={`Delete ${selectedBattles.size} Battle${
          selectedBattles.size !== 1 ? "s" : ""
        }?`}
        description={`Are you sure you want to delete ${
          selectedBattles.size
        } selected battle${
          selectedBattles.size !== 1 ? "s" : ""
        }? This will also delete all associated votes and comments. This action cannot be undone.`}
        confirmLabel="Delete Battles"
        onConfirm={handleBulkDelete}
        isLoading={isDeleting}
        variant="danger"
        icon={AlertTriangle}
        errorMessage={errorMessage || undefined}
      />
    </div>
  );
}
