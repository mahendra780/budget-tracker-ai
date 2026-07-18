import AnimatedCard from "./AnimatedCard";

function ChartCard({
  title,
  description,
  children,
  className = "",
}) {
  return (
    <AnimatedCard className={`p-5 sm:p-6 ${className}`}>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-[var(--text)]">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-[var(--muted-text)]">
            {description}
          </p>
        )}
      </div>
      {children}
    </AnimatedCard>
  );
}

export default ChartCard;
