import { useEffect, useId, useRef } from "react";

/**
 * Focus management for chart popover menus (Indicators / Compare / Signal).
 * - Escape closes
 * - Focus moves into the panel on open
 * - Focus returns to the trigger on close
 * - Optional outside-click dismiss
 */
export function useChartMenu(opts: {
  open: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
  /** When true, mousedown outside the panel closes it. Default true. */
  closeOnOutside?: boolean;
}) {
  const { open, onClose, triggerRef, closeOnOutside = true } = opts;
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const wasOpen = useRef(false);

  useEffect(() => {
    if (!open) {
      if (wasOpen.current) {
        wasOpen.current = false;
        const t = triggerRef?.current;
        // Restore focus to the control that opened the menu.
        if (t && typeof t.focus === "function") {
          window.setTimeout(() => t.focus(), 0);
        }
      }
      return;
    }
    wasOpen.current = true;
    const panel = panelRef.current;
    if (!panel) return;

    const focusables = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);

    // Prefer the first input, else first button that isn't the close control.
    const nodes = focusables();
    const preferred =
      nodes.find((n) => n.tagName === "INPUT") ||
      nodes.find((n) => n.getAttribute("aria-label")?.toLowerCase().startsWith("close") === false) ||
      nodes[0];
    preferred?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const list = focusables();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    const onPointer = (e: MouseEvent) => {
      if (!closeOnOutside) return;
      const target = e.target as Node | null;
      if (!target) return;
      if (panel.contains(target)) return;
      if (triggerRef?.current?.contains(target)) return;
      onClose();
    };

    document.addEventListener("keydown", onKey, true);
    document.addEventListener("mousedown", onPointer, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("mousedown", onPointer, true);
    };
  }, [open, onClose, triggerRef, closeOnOutside]);

  return { panelRef, titleId };
}
