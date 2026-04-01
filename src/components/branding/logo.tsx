export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 via-blue-500 to-violet-500 text-sm font-bold text-primary-foreground shadow-[0_0_30px_rgba(59,130,246,0.35)]">
        LL
      </div>
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-100">LeadLock</p>
        <p className="text-xs text-slate-400">Acquire. Book. Follow through.</p>
      </div>
    </div>
  );
}
