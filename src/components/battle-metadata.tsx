import type { Stage } from "@/lib/shared/stages";

interface BattleMetadataProps {
  createdAt: Date;
  stage: Stage;
}

export function BattleMetadata({ createdAt, stage }: BattleMetadataProps) {
  return (
    <div className="text-xs text-gray-500 mb-2">
      <div>Created {createdAt.toLocaleDateString()}</div>
      <div>
        Stage: {stage.flag} {stage.name}, {stage.country}
      </div>
    </div>
  );
}
