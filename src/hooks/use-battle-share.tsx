import { useState } from "react";
import { CheckCircle } from "lucide-react";
import { copyToClipboard } from "@/lib/utils";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

export function useBattleShare() {
  const [showCopiedDialog, setShowCopiedDialog] = useState(false);

  const shareBattle = async (url: string) => {
    await copyToClipboard(url);
    setShowCopiedDialog(true);
  };

  const ShareDialog = () => (
    <ConfirmationDialog
      open={showCopiedDialog}
      onOpenChange={setShowCopiedDialog}
      title="Link Copied"
      description="The battle link has been copied to your clipboard and is ready to paste."
      confirmLabel="OK"
      cancelLabel={null}
      onConfirm={() => setShowCopiedDialog(false)}
      variant="success"
      icon={CheckCircle}
    />
  );

  return { shareBattle, ShareDialog, showCopiedDialog, setShowCopiedDialog };
}
