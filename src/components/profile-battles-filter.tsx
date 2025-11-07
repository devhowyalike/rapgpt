"use client";

import { useState, useMemo } from "react";
import { type BattleDB } from "@/lib/db/schema";
import { MyBattleCard } from "@/components/my-battle-card";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileBattlesFilterProps {
  battles: BattleDB[];
  shareUrl: string;
  isOwnProfile: boolean;
  userIsProfilePublic: boolean;
}

interface Filters {
  public: boolean;
  paused: boolean;
  commentsEnabled: boolean;
  votingEnabled: boolean;
  hasMp3: boolean;
}

export function ProfileBattlesFilter({
  battles,
  shareUrl,
  isOwnProfile,
  userIsProfilePublic,
}: ProfileBattlesFilterProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    public: false,
    paused: false,
    commentsEnabled: false,
    votingEnabled: false,
    hasMp3: false,
  });

  // Apply filters to battles
  const filteredBattles = useMemo(() => {
    return battles.filter((battle) => {
      // Public filter - if checked, show only public battles
      if (filters.public && !battle.isPublic) return false;

      // Paused filter - if checked, show only paused battles
      if (filters.paused && battle.status !== "paused") return false;

      // Comments enabled filter - if checked, show only battles with comments enabled
      if (filters.commentsEnabled && !battle.commentsEnabled) return false;

      // Voting enabled filter - if checked, show only battles with voting enabled
      if (filters.votingEnabled && !battle.votingEnabled) return false;

      // MP3 filter - if checked, show only battles with generated songs
      if (filters.hasMp3 && !battle.generatedSong) return false;

      return true;
    });
  }, [battles, filters]);

  // Separate paused and completed battles
  const pausedBattles = filteredBattles.filter(
    (battle) => battle.status === "paused"
  );
  const completedBattles = filteredBattles.filter(
    (battle) => battle.status !== "paused"
  );

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some((value) => value === true);

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      public: false,
      paused: false,
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
          className="flex items-center gap-2 bg-gray-800/50 border-purple-500/20 hover:bg-gray-700/50 text-white"
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
            className="text-gray-400 hover:text-white"
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
            {/* Public Filter */}
            {isOwnProfile && (
              <FilterCheckbox
                id="public"
                label="Public"
                checked={filters.public}
                onCheckedChange={() => toggleFilter("public")}
              />
            )}

            {/* Paused Filter */}
            <FilterCheckbox
              id="paused"
              label="Paused"
              checked={filters.paused}
              onCheckedChange={() => toggleFilter("paused")}
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
        <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-12 text-center">
          <p className="text-gray-400">No battles match the selected filters</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Paused Battles Section */}
          {pausedBattles.length > 0 && (
            <div>
              <h3 className="font-bebas text-xl sm:text-2xl md:text-3xl text-white mb-4">
                Paused Battles ({pausedBattles.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                {pausedBattles.map((battle) => (
                  <MyBattleCard
                    key={battle.id}
                    battle={battle}
                    shareUrl={shareUrl}
                    showManagement={isOwnProfile}
                    userIsProfilePublic={userIsProfilePublic}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Battles Section */}
          {completedBattles.length > 0 && (
            <div>
              <h3 className="font-bebas text-xl sm:text-2xl md:text-3xl text-white mb-4">
                Completed Battles ({completedBattles.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                {completedBattles.map((battle) => (
                  <MyBattleCard
                    key={battle.id}
                    battle={battle}
                    shareUrl={shareUrl}
                    showManagement={isOwnProfile}
                    userIsProfilePublic={userIsProfilePublic}
                  />
                ))}
              </div>
            </div>
          )}
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
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
      <label
        htmlFor={id}
        className="text-sm text-gray-300 cursor-pointer select-none"
      >
        {label}
      </label>
    </div>
  );
}

