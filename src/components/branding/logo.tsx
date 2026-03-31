export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground">
        LL
      </div>
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">LeadLock</p>
        <p className="text-xs text-muted-foreground">Acquire. Book. Follow through.</p>
      </div>
    </div>
  );
}

