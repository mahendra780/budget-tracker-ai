function LoadingSkeleton({
  rows = 3,
}) {
  return (
    <div className="space-y-3">
      {Array.from({
        length: rows,
      }).map((_, index) => (
        <div
          key={index}
          className="h-16 animate-pulse rounded-2xl bg-[var(--skeleton-bg)]"
        />
      ))}
    </div>
  );
}

export default LoadingSkeleton;
