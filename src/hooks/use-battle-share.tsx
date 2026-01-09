import { toast } from "sonner";
import { APP_TITLE } from "@/lib/constants";
import { copyToClipboard } from "@/lib/utils";

export function useBattleShare() {
  const shareBattle = async (url: string) => {
    // Prefer native share sheet on supported devices (mobile Safari/Chrome).
    // If the user cancels, we do nothing.
    const isSecure =
      typeof window !== "undefined" ? window.isSecureContext : false;

    if (
      typeof navigator !== "undefined" &&
      typeof window !== "undefined" &&
      "share" in navigator &&
      isSecure
    ) {
      try {
        // Types: TS libdom has navigator.share in modern versions, but keep it safe.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const shareData = {
          title: APP_TITLE,
          url,
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const canShare = (navigator as any).canShare
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (navigator as any).canShare(shareData)
          : true;
        if (!canShare) throw new Error("canShare returned false");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (navigator as any).share(shareData);
        return;
      } catch (err) {
        // User canceled the sheet — no further action.
        if (err instanceof DOMException && err.name === "AbortError") return;
        // Fall through to clipboard copy
      }
    }

    const ok = await copyToClipboard(url);
    if (ok) {
      toast.success("Link copied to clipboard");
    } else {
      toast.error(
        "Couldn’t copy link—please copy it manually from the address bar."
      );
    }
  };

  // Backwards-compatible no-op component (older call sites still render <ShareDialog />)
  // Keeping this avoids having to touch multiple control bars.
  const ShareDialog = () => null;

  return { shareBattle, ShareDialog };
}
