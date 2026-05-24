import { motion } from "framer-motion";

function AnimatedCard({
  children,
  className = "",
  delay = 0,
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 16,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.35,
        delay,
        ease: "easeOut",
      }}
      whileHover={{
        y: -3,
      }}
      className={`rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--card-shadow)] ${className}`}
    >
      {children}
    </motion.div>
  );
}

export default AnimatedCard;
