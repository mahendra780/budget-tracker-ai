function EmptyState({
  icon: Icon,
  title,
  description,
  className = "",
}) {
  return (
    <div className={`flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--card-border)] bg-[var(--muted-bg)] p-6 text-center ${className}`}>
      {Icon && (
        <div className="mb-3 rounded-2xl bg-[var(--primary-soft)] p-3 text-[var(--primary)]">
          <Icon size={24} />
        </div>
      )}
      <p className="font-semibold text-[var(--text)]">
        {title}
      </p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-[var(--muted-text)]">
          {description}
        </p>
      )}
    </div>
  );
}

export default EmptyState;
