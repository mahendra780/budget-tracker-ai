import { useEffect, useId, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

function ConfirmDialog({
  open,
  title = "Confirm action",
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return undefined;

    const previouslyFocused = document.activeElement;
    const focusDialog = () => dialogRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onCancel();

      if (event.key !== "Tab") return;

      const focusableElements = Array.from(
        dialogRef.current?.querySelectorAll(
          'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
        ) || []
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements.at(-1);

      if (!firstElement || !lastElement) {
        event.preventDefault();
        focusDialog();
        return;
      }

      if (
        event.shiftKey &&
        (document.activeElement === firstElement || document.activeElement === dialogRef.current)
      ) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    const frameId = requestAnimationFrame(focusDialog);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(frameId);
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          exit={{
            opacity: 0,
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm"
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
            initial={prefersReducedMotion ? false : {
              opacity: 0,
              scale: 0.96,
              y: 12,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={prefersReducedMotion ? undefined : {
              opacity: 0,
              scale: 0.96,
              y: 12,
            }}
            className="w-full max-w-md rounded-3xl bg-[var(--card-bg)] p-6 shadow-2xl"
          >
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--danger-soft)] text-[var(--danger)]">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h2 id={titleId} className="text-lg font-bold text-[var(--text)]">
                  {title}
                </h2>
                <p id={descriptionId} className="mt-2 text-sm leading-6 text-[var(--muted-text)]">
                  {description}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-2xl border border-[var(--card-border)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--muted-bg)]"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="rounded-2xl bg-[var(--danger)] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[rgba(220,61,87,0.18)] transition hover:brightness-95"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ConfirmDialog;
