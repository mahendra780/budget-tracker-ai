import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import AnimatedCard from "./AnimatedCard";
import { formatCurrency } from "../../utils/formatters";

function StatCard({
  title,
  value,
  icon: Icon,
  tone = "primary",
  helper,
  delay = 0,
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const target = Number(value || 0);
    const duration = 650;
    const startTime = performance.now();

    const frame = (time) => {
      const progress = Math.min(
        (time - startTime) / duration,
        1
      );

      setDisplayValue(target * progress);

      if (progress < 1) {
        requestAnimationFrame(frame);
      }
    };

    const frameId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [value]);

  const toneClasses = {
    primary: "bg-[#FFF4EC] text-[#F97316]",
    secondary: "bg-[#EAFBF8] text-[#14B8A6]",
    success: "bg-emerald-50 text-emerald-600",
    danger: "bg-rose-50 text-rose-600",
  };

  return (
    <AnimatedCard
      delay={delay}
      className="p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[var(--muted-text)]">
            {title}
          </p>
          <p className="mt-3 text-2xl font-bold text-[var(--text)]">
            {formatCurrency(displayValue)}
          </p>
          {helper && (
            <p className="mt-2 text-sm text-[var(--muted-text)]">
              {helper}
            </p>
          )}
        </div>

        <motion.div
          whileHover={{
            scale: 1.08,
          }}
          className={`rounded-2xl p-3 ${
            toneClasses[tone]
          }`}
        >
          <Icon size={22} />
        </motion.div>
      </div>
    </AnimatedCard>
  );
}

export default StatCard;
