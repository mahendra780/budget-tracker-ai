import { motion, useReducedMotion } from "framer-motion";
import { clampPercentage } from "../../utils/formatters";

function ProgressBar({
  value,
  tone = "primary",
  height = "h-2.5",
  label = "Progress",
}) {
  const width = clampPercentage(value);
  const prefersReducedMotion = useReducedMotion();

  const toneClasses = {
    primary: "bg-[var(--primary)]",
    secondary: "bg-[var(--success)]",
    success: "bg-[var(--success)]",
    danger: "bg-[var(--danger)]",
    warning: "bg-[var(--warning)]",
  };

  return (
    <div
      className={`${height} w-full overflow-hidden rounded-full bg-[var(--muted-bg)]`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(width)}
    >
      <motion.div
        initial={prefersReducedMotion ? false : {
          width: 0,
        }}
        animate={{
          width: `${width}%`,
        }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.75,
          ease: "easeOut",
        }}
        className={`h-full rounded-full ${
          toneClasses[tone]
        }`}
      />
    </div>
  );
}

export default ProgressBar;
