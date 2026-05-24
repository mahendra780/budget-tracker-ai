function EmptyState({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--card-border)] bg-[var(--muted-bg)] p-6 text-center">
      {Icon && (
        <div className="mb-3 rounded-2xl bg-[var(--card-bg)] p-3 text-[#F97316]">
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
