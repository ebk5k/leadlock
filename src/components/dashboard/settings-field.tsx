export function SettingsField({
  label,
  value,
  multiline = false
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  const baseClassName =
    "w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-slate-100 outline-none";

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-100">{label}</label>
      {multiline ? (
        <textarea className={`${baseClassName} min-h-28 py-3`} defaultValue={value} readOnly />
      ) : (
        <input className={`${baseClassName} h-11`} defaultValue={value} readOnly />
      )}
    </div>
  );
}
