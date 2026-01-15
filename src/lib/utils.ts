import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Checks if a modal/dialog is currently open in the DOM.
 * Useful for preventing global keyboard handlers from firing when modals are open.
 */
export function isModalOpen(): boolean {
  return !!document.querySelector('[role="dialog"], [aria-modal="true"]');
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === "undefined" || typeof document === "undefined") {
    return false;
  }

  // Try Clipboard API first (works in secure contexts)
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn("Clipboard API failed, trying fallback...", err);
    }
  }

  // Fallback for non-secure contexts (e.g. HTTP on local IP)
  try {
    // Preserve scroll positions; iOS Safari can jump when focusing a textarea.
    const windowScrollY = window.scrollY;
    const scrollContainer = document.querySelector(
      "[data-scroll-container]",
    ) as HTMLElement | null;
    const containerScrollTop = scrollContainer?.scrollTop ?? 0;

    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.setAttribute("readonly", "");

    // Keep it in the viewport (but invisible) to avoid scroll jumps on focus.
    // If it's off-screen, some mobile browsers try to scroll it into view.
    textArea.style.position = "fixed";
    textArea.style.left = "0";
    textArea.style.top = "0";
    textArea.style.width = "1px";
    textArea.style.height = "1px";
    textArea.style.opacity = "0";
    textArea.style.pointerEvents = "none";
    // Prevent iOS from zooming on focus (common when font-size < 16px).
    textArea.style.fontSize = "16px";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, textArea.value.length);

    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);

    // Restore scroll positions.
    if (scrollContainer) scrollContainer.scrollTop = containerScrollTop;
    window.scrollTo(0, windowScrollY);
    return successful;
  } catch (err) {
    console.error("Fallback clipboard copy failed", err);
    return false;
  }
}
