export default function MacroBar({
  label,
  value,
  target,
  unit = "g",
  colorClass = "bg-emerald-500",
}: {
  label: string;
  value: number;
  target: number;
  unit?: string;
  colorClass?: string;
}) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span>
          {Math.round(value)} / {Math.round(target)}
          {unit}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
