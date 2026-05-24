import { motion } from "framer-motion";
import { clampPercentage } from "../../utils/formatters";

function ProgressBar({
  value,
  tone = "primary",
  height = "h-2.5",
}) {
  const width = clampPercentage(value);

  const toneClasses = {
    primary: "bg-[#F97316]",
    secondary: "bg-[#14B8A6]",
    success: "bg-emerald-500",
    danger: "bg-rose-500",
    warning: "bg-amber-500",
  };

  return (
    <div
      className={`${height} w-full overflow-hidden rounded-full bg-[var(--muted-bg)]`}
    >
      <motion.div
        initial={{
          width: 0,
        }}
        animate={{
          width: `${width}%`,
        }}
        transition={{
          duration: 0.75,
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
