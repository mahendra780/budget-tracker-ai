function PageHeader({
  eyebrow,
  title,
  description,
  action,
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {eyebrow && (
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#F97316]">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-2 text-3xl font-bold text-[var(--text)]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-text)]">
            {description}
          </p>
        )}
      </div>

      {action}
    </div>
  );
}

export default PageHeader;
