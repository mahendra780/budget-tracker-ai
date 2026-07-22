function LoadingSkeleton({
  rows = 3,
}) {
  return (
    <div className="space-y-3" role="status" aria-live="polite">
      <span className="sr-only">Loading content</span>
      {Array.from({
        length: rows,
      }).map((_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="loading-skeleton h-12 rounded-2xl"
        />
      ))}
    </div>
  );
}

export default LoadingSkeleton;
