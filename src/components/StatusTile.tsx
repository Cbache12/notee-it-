export type Status = "good" | "warning" | "serious" | "critical";

const STATUS_COLOR: Record<Status, string> = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
};

function StatusIcon({ status }: { status: Status }) {
  const color = STATUS_COLOR[status];
  if (status === "good") {
    return (
      <svg width={16} height={16} viewBox="0 0 16 16" aria-hidden="true">
        <circle cx={8} cy={8} r={7} fill="none" stroke={color} strokeWidth={2} />
        <path d="M4.5 8.5 L7 11 L11.5 5.5" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === "critical") {
    return (
      <svg width={16} height={16} viewBox="0 0 16 16" aria-hidden="true">
        <circle cx={8} cy={8} r={7} fill="none" stroke={color} strokeWidth={2} />
        <path d="M5.5 5.5 L10.5 10.5 M10.5 5.5 L5.5 10.5" stroke={color} strokeWidth={2} strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 1.5 L15 14.5 L1 14.5 Z" fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <line x1={8} y1={6} x2={8} y2={10} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <circle cx={8} cy={12.2} r={0.9} fill={color} />
    </svg>
  );
}

interface Props {
  label: string;
  value: string;
  status: Status;
  statusLabel: string;
  description: string;
}

export function StatusTile({ label, value, status, statusLabel, description }: Props) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-900 p-4">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 text-3xl font-semibold tabular-nums text-slate-50">{value}</div>
      <div className="mt-2 flex items-center gap-1.5 text-sm font-medium" style={{ color: STATUS_COLOR[status] }}>
        <StatusIcon status={status} />
        <span>{statusLabel}</span>
      </div>
      <p className="mt-1 text-xs text-slate-400">{description}</p>
    </div>
  );
}
