import { motion, useReducedMotion } from "framer-motion";

function AnimatedCard({
  children,
  className = "",
  delay = 0,
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? false : {
        opacity: 0,
        y: 16,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.35,
        delay,
        ease: "easeOut",
      }}
      whileHover={prefersReducedMotion ? undefined : {
        y: -3,
      }}
      className={`rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--card-shadow)] transition-[transform,box-shadow,border-color] duration-200 hover:border-[color-mix(in_srgb,var(--primary)_22%,var(--card-border))] hover:shadow-[var(--card-shadow-hover)] ${className}`}
    >
      {children}
    </motion.div>
  );
}

export default AnimatedCard;
