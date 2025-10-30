"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { type ReactNode } from "react";

interface MobileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}

export function MobileDrawer({
  open,
  onOpenChange,
  title,
  children,
}: MobileDrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 md:hidden bg-gray-900 border-t border-gray-800 rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom h-[85vh] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <Dialog.Title className="text-lg font-bold text-white">
              {title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

