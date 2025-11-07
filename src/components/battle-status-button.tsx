import { forwardRef } from "react";
import { Globe, Lock, Radio, MoreVertical } from "lucide-react";

interface BattleStatusButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isPublic: boolean;
  isArchived: boolean;
}

export const BattleStatusButton = forwardRef<
  HTMLButtonElement,
  BattleStatusButtonProps
>(({ isPublic, isArchived, ...props }, ref) => {
  return (
    <button
      ref={ref}
      {...props}
      className={`px-3 py-1.5 rounded flex items-center gap-1.5 text-xs transition-colors ${
        isPublic
          ? "bg-blue-600/30 text-blue-300 hover:bg-blue-600/40"
          : isArchived
          ? "bg-purple-600/30 text-purple-300 hover:bg-purple-600/40"
          : "bg-gray-600/30 text-gray-300 hover:bg-gray-600/40"
      }`}
      title="Manage battle"
    >
      {isPublic ? (
        <>
          <Globe size={12} />
          <span className="hidden md:inline">Public</span>
        </>
      ) : isArchived ? (
        <>
          <Radio size={12} />
          <span className="hidden md:inline">Live Event</span>
        </>
      ) : (
        <>
          <Lock size={12} />
          <span className="hidden md:inline">Unpublished</span>
        </>
      )}
      <MoreVertical size={12} className="ml-0.5 hidden md:inline" />
    </button>
  );
});

BattleStatusButton.displayName = "BattleStatusButton";
