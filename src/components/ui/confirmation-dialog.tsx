"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, type LucideIcon } from "lucide-react";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string | null;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  variant?: "danger" | "warning" | "info" | "success";
  icon?: LucideIcon;
  errorMessage?: string;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  isLoading = false,
  variant = "danger",
  icon: Icon,
  errorMessage,
}: ConfirmationDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  // Determine colors based on variant
  const variantStyles = {
    danger: {
      iconBg: "bg-red-500/20",
      iconColor: "text-red-500",
      buttonBg: "bg-red-600 hover:bg-red-700",
    },
    warning: {
      iconBg: "bg-orange-500/20",
      iconColor: "text-orange-500",
      buttonBg: "bg-orange-600 hover:bg-orange-700",
    },
    info: {
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-500",
      buttonBg: "bg-blue-600 hover:bg-blue-700",
    },
    success: {
      iconBg: "bg-green-500/20",
      iconColor: "text-green-500",
      buttonBg: "bg-green-600 hover:bg-green-700",
    },
  };

  const styles = variantStyles[variant];
  const DisplayIcon = Icon || AlertTriangle;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-md bg-gray-900 border border-gray-800 rounded-lg shadow-2xl p-6 animate-in fade-in zoom-in-95"
        >
          <div className="flex items-center gap-4 mb-4">
            <div
              className={`shrink-0 w-12 h-12 rounded-full ${styles.iconBg} flex items-center justify-center`}
            >
              <DisplayIcon className={`w-6 h-6 ${styles.iconColor}`} />
            </div>
            <Dialog.Title className="text-xl font-bold text-white">
              {title}
            </Dialog.Title>
          </div>

          <Dialog.Description className="text-gray-400 mb-6 text-pretty">
            {description}
          </Dialog.Description>

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {errorMessage}
            </div>
          )}

          <div
            className={`flex gap-3 w-full ${!cancelLabel ? "justify-end" : ""}`}
          >
            {cancelLabel && (
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {cancelLabel}
              </button>
            )}
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className={`${
                cancelLabel ? "flex-1" : "min-w-[100px]"
              } px-4 py-2 ${
                styles.buttonBg
              } text-white rounded-lg transition-colors disabled:opacity-50`}
            >
              {isLoading ? "Processing..." : confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
