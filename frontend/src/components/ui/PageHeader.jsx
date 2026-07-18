function PageHeader({
  eyebrow,
  title,
  description,
  action,
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#F97316]">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
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
