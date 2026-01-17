"use client";

import { ChevronDown, ChevronUp, Filter, X } from "lucide-react";
import { useMemo, useState } from "react";
import { MyBattleCard } from "@/components/my-battle-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { type BattleDB } from "@/lib/db/schema";

interface DecryptedContexts {
  [battleId: string]: {
    player1CustomContext?: string;
    player2CustomContext?: string;
  };
}

interface CollapsibleBattleSectionProps {
  title: string;
  battles: BattleDB[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  shareUrl: string;
  isOwnProfile: boolean;
  userIsProfilePublic: boolean;
  decryptedContexts?: DecryptedContexts;
}

function CollapsibleBattleSection({
  title,
  battles,
  isOpen,
  onOpenChange,
  shareUrl,
  isOwnProfile,
  userIsProfilePublic,
  decryptedContexts,
}: CollapsibleBattleSectionProps) {
  if (battles.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleTrigger className="flex items-center gap-2 mb-4 cursor-pointer group w-full">
        <h3 className="font-bebas text-xl sm:text-2xl md:text-3xl text-white">
          {title} ({battles.length})
        </h3>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 group-hover:text-white transition-colors" />
        ) : (
          <ChevronDown className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 group-hover:text-white transition-colors" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-col gap-3">
          {battles.map((battle) => {
            const contexts = decryptedContexts?.[battle.id];
            return (
              <MyBattleCard
                key={battle.id}
                battle={battle}
                shareUrl={shareUrl}
                showManagement={isOwnProfile}
                userIsProfilePublic={userIsProfilePublic}
                variant="horizontal"
                player1CustomContext={contexts?.player1CustomContext}
                player2CustomContext={contexts?.player2CustomContext}
              />
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

interface ProfileBattlesFilterProps {
  battles: BattleDB[];
  shareUrl: string;
  isOwnProfile: boolean;
  decryptedContexts?: DecryptedContexts;
  userIsProfilePublic: boolean;
}

interface Filters {
  live: boolean;
  published: boolean;
  private: boolean;
  paused: boolean;
  completed: boolean;
  commentsEnabled: boolean;
  votingEnabled: boolean;
  hasMp3: boolean;
}

export function ProfileBattlesFilter({
  battles,
  shareUrl,
  isOwnProfile,
  userIsProfilePublic,
  decryptedContexts,
}: ProfileBattlesFilterProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [isLiveOpen, setIsLiveOpen] = useState(true);
  const [isPublishedOpen, setIsPublishedOpen] = useState(true);
  const [isPausedOpen, setIsPausedOpen] = useState(true);
  const [isCompletedOpen, setIsCompletedOpen] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    live: false,
    published: false,
    private: false,
    paused: false,
    completed: false,
    commentsEnabled: false,
    votingEnabled: false,
    hasMp3: false,
  });

  // Apply filters to battles
  const filteredBattles = useMemo(() => {
    return battles.filter((battle) => {
      // Live filter - if checked, show only live battles
      if (filters.live && !battle.isLive) return false;

      // Published filter - if checked, show only public battles
      if (filters.published && !battle.isPublic) return false;

      // Private filter - if checked, show only private battles
      if (filters.private && battle.isPublic) return false;

      // Paused filter - if checked, show only paused battles
      if (filters.paused && battle.status !== "paused") return false;

      // Completed filter - if checked, show only completed battles
      if (filters.completed && battle.status === "paused") return false;

      // Comments enabled filter - if checked, show only battles with comments enabled
      if (filters.commentsEnabled && !battle.commentsEnabled) return false;

      // Voting enabled filter - if checked, show only battles with voting enabled
      if (filters.votingEnabled && !battle.votingEnabled) return false;

      // MP3 filter - if checked, show only battles with generated songs
      if (filters.hasMp3 && !battle.generatedSong) return false;

      return true;
    });
  }, [battles, filters]);

  // Group battles
  const liveBattles = filteredBattles.filter((battle) => battle.isLive);
  const publishedBattles = filteredBattles.filter(
    (battle) => battle.isPublic && !battle.isLive
  );
  const pausedBattles = filteredBattles.filter(
    (battle) => !battle.isPublic && battle.status === "paused" && !battle.isLive
  );
  const completedBattles = filteredBattles.filter(
    (battle) => !battle.isPublic && battle.status !== "paused" && !battle.isLive
  );

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(
    (value) => value === true
  );

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      live: false,
      published: false,
      private: false,
      paused: false,
      completed: false,
      commentsEnabled: false,
      votingEnabled: false,
      hasMp3: false,
    });
  };

  // Toggle filter checkbox
  const toggleFilter = (key: keyof Filters) => {
    setFilters((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Count active filters
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Filter Button and Controls */}
      <div className="flex items-center justify-between gap-4">
        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant="outline"
          className="flex items-center gap-2 bg-gray-800/50 border-purple-500/20 hover:bg-purple-600/30 hover:border-purple-500/40 text-white hover:text-white"
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {hasActiveFilters && (
          <Button
            onClick={clearFilters}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-black hover:bg-gray-200"
          >
            <X className="w-4 h-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6">
          <div className="flex flex-wrap gap-6">
            {/* Live Filter */}
            <FilterCheckbox
              id="live"
              label="Live"
              checked={filters.live}
              onCheckedChange={() => toggleFilter("live")}
            />

            {/* Published Filter */}
            {isOwnProfile && (
              <FilterCheckbox
                id="published"
                label="Published"
                checked={filters.published}
                onCheckedChange={() => toggleFilter("published")}
              />
            )}

            {/* Private Filter */}
            {isOwnProfile && (
              <FilterCheckbox
                id="private"
                label="Private"
                checked={filters.private}
                onCheckedChange={() => toggleFilter("private")}
              />
            )}

            {/* Paused Filter */}
            <FilterCheckbox
              id="paused"
              label="Paused"
              checked={filters.paused}
              onCheckedChange={() => toggleFilter("paused")}
            />

            {/* Completed Filter */}
            <FilterCheckbox
              id="completed"
              label="Completed"
              checked={filters.completed}
              onCheckedChange={() => toggleFilter("completed")}
            />

            {/* Comments Enabled Filter */}
            {isOwnProfile && (
              <FilterCheckbox
                id="commentsEnabled"
                label="Comments"
                checked={filters.commentsEnabled}
                onCheckedChange={() => toggleFilter("commentsEnabled")}
              />
            )}

            {/* Voting Enabled Filter */}
            {isOwnProfile && (
              <FilterCheckbox
                id="votingEnabled"
                label="Voting"
                checked={filters.votingEnabled}
                onCheckedChange={() => toggleFilter("votingEnabled")}
              />
            )}

            {/* MP3 Filter */}
            <FilterCheckbox
              id="hasMp3"
              label="MP3"
              checked={filters.hasMp3}
              onCheckedChange={() => toggleFilter("hasMp3")}
            />
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="text-sm text-gray-400">
        Showing {filteredBattles.length} of {battles.length} battles
      </div>

      {/* Battles Display */}
      {filteredBattles.length === 0 ? (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-8 text-center">
          <p className="text-gray-400">No battles match the selected filters</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Live Battles Section */}
          <CollapsibleBattleSection
            title="Live Battles"
            battles={liveBattles}
            isOpen={isLiveOpen}
            onOpenChange={setIsLiveOpen}
            shareUrl={shareUrl}
            isOwnProfile={isOwnProfile}
            userIsProfilePublic={userIsProfilePublic}
            decryptedContexts={decryptedContexts}
          />

          {/* Published Battles Section */}
          <CollapsibleBattleSection
            title="Published Battles"
            battles={publishedBattles}
            isOpen={isPublishedOpen}
            onOpenChange={setIsPublishedOpen}
            shareUrl={shareUrl}
            isOwnProfile={isOwnProfile}
            userIsProfilePublic={userIsProfilePublic}
            decryptedContexts={decryptedContexts}
          />

          {/* Paused Battles Section */}
          <CollapsibleBattleSection
            title="Paused Battles"
            battles={pausedBattles}
            isOpen={isPausedOpen}
            onOpenChange={setIsPausedOpen}
            shareUrl={shareUrl}
            isOwnProfile={isOwnProfile}
            userIsProfilePublic={userIsProfilePublic}
            decryptedContexts={decryptedContexts}
          />

          {/* Completed Battles Section */}
          <CollapsibleBattleSection
            title="Completed Battles"
            battles={completedBattles}
            isOpen={isCompletedOpen}
            onOpenChange={setIsCompletedOpen}
            shareUrl={shareUrl}
            isOwnProfile={isOwnProfile}
            userIsProfilePublic={userIsProfilePublic}
            decryptedContexts={decryptedContexts}
          />
        </div>
      )}
    </div>
  );
}

// Helper component for filter checkbox
interface FilterCheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: () => void;
}

function FilterCheckbox({
  id,
  label,
  checked,
  onCheckedChange,
}: FilterCheckboxProps) {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <label
        htmlFor={id}
        className="text-sm text-gray-300 cursor-pointer select-none"
      >
        {label}
      </label>
    </div>
  );
}
