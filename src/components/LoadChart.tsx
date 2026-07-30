"use client";

import { useMemo, useState } from "react";
import type { DailyLoadPoint } from "@/lib/training-load";

const WIDTH = 800;
const HEIGHT = 260;
const MARGIN = { top: 16, right: 16, bottom: 24, left: 40 };

interface Props {
  series: DailyLoadPoint[];
}

export function LoadChart({ series }: Props) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const plotted = useMemo(() => series.slice(-56), [series]);

  const { xFor, yFor, ctlPath, atlPath, tsbPath, ctlAreaPath, yTicks } = useMemo(() => {
    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    const allValues = plotted.flatMap((p) => [p.ctl, p.atl, p.tsb]);
    const min = Math.min(0, ...allValues);
    const max = Math.max(1, ...allValues);
    const pad = (max - min) * 0.1 || 1;
    const yMin = min - pad;
    const yMax = max + pad;

    const xFor = (i: number) =>
      MARGIN.left + (plotted.length <= 1 ? 0 : (i / (plotted.length - 1)) * innerWidth);
    const yFor = (v: number) =>
      MARGIN.top + innerHeight - ((v - yMin) / (yMax - yMin)) * innerHeight;

    const lineFor = (key: "ctl" | "atl" | "tsb") =>
      plotted.map((p, i) => `${i === 0 ? "M" : "L"}${xFor(i)},${yFor(p[key])}`).join(" ");

    const ctlPath = lineFor("ctl");
    const atlPath = lineFor("atl");
    const tsbPath = lineFor("tsb");

    const baseline = yFor(0);
    const ctlAreaPath =
      plotted.length > 0
        ? `${lineFor("ctl")} L${xFor(plotted.length - 1)},${baseline} L${xFor(0)},${baseline} Z`
        : "";

    const yTicks = [yMin, (yMin + yMax) / 2, yMax].map((v) => ({ value: v, y: yFor(v) }));

    return { xFor, yFor, ctlPath, atlPath, tsbPath, ctlAreaPath, yTicks };
  }, [plotted]);

  const hovered = hoverIndex !== null ? plotted[hoverIndex] : null;

  return (
    <div className="viz-root rounded-lg border border-white/10 bg-slate-900 p-4">
      <style>{`
        .viz-root {
          --surface-1: #1a1a19;
          --text-primary: #ffffff;
          --text-secondary: #c3c2b7;
          --text-muted: #898781;
          --gridline: #2c2c2a;
          --series-ctl: #3987e5;
          --series-atl: #d95926;
          --series-tsb: #199e70;
        }
        @media (prefers-color-scheme: light) {
          .viz-root {
            --surface-1: #fcfcfb;
            --text-primary: #0b0b0b;
            --text-secondary: #52514e;
            --text-muted: #898781;
            --gridline: #e1e0d9;
            --series-ctl: #2a78d6;
            --series-atl: #eb6834;
            --series-tsb: #1baf7a;
          }
        }
      `}</style>

      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          Fitness, fatigue &amp; form (last 8 weeks)
        </h3>
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          className="text-xs underline"
          style={{ color: "var(--text-secondary)" }}
        >
          {showTable ? "Show chart" : "View as table"}
        </button>
      </div>

      {showTable ? (
        <div className="max-h-64 overflow-auto">
          <table className="w-full text-left text-xs" style={{ color: "var(--text-secondary)" }}>
            <thead>
              <tr>
                <th className="py-1 pr-4">Date</th>
                <th className="py-1 pr-4">CTL (fitness)</th>
                <th className="py-1 pr-4">ATL (fatigue)</th>
                <th className="py-1 pr-4">TSB (form)</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {plotted.map((p) => (
                <tr key={p.date} className="border-t" style={{ borderColor: "var(--gridline)" }}>
                  <td className="py-1 pr-4">{p.date}</td>
                  <td className="py-1 pr-4">{p.ctl.toFixed(1)}</td>
                  <td className="py-1 pr-4">{p.atl.toFixed(1)}</td>
                  <td className="py-1 pr-4">{p.tsb.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="w-full"
            role="img"
            aria-label="Chronic training load, acute training load, and training stress balance over the last 8 weeks"
            onMouseLeave={() => setHoverIndex(null)}
          >
            {yTicks.map((t) => (
              <g key={t.y}>
                <line
                  x1={MARGIN.left}
                  x2={WIDTH - MARGIN.right}
                  y1={t.y}
                  y2={t.y}
                  stroke="var(--gridline)"
                  strokeWidth={1}
                />
                <text x={4} y={t.y + 3} fontSize={10} fill="var(--text-muted)">
                  {Math.round(t.value)}
                </text>
              </g>
            ))}

            <path d={ctlAreaPath} fill="var(--series-ctl)" opacity={0.1} stroke="none" />
            <path d={ctlPath} fill="none" stroke="var(--series-ctl)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            <path d={atlPath} fill="none" stroke="var(--series-atl)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            <path d={tsbPath} fill="none" stroke="var(--series-tsb)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

            {plotted.map((p, i) => (
              <rect
                key={p.date}
                x={xFor(i) - (WIDTH / plotted.length) / 2}
                y={MARGIN.top}
                width={WIDTH / plotted.length}
                height={HEIGHT - MARGIN.top - MARGIN.bottom}
                fill="transparent"
                onMouseEnter={() => setHoverIndex(i)}
                onFocus={() => setHoverIndex(i)}
                tabIndex={0}
              />
            ))}

            {hovered && (
              <line
                x1={xFor(hoverIndex!)}
                x2={xFor(hoverIndex!)}
                y1={MARGIN.top}
                y2={HEIGHT - MARGIN.bottom}
                stroke="var(--text-muted)"
                strokeWidth={1}
              />
            )}
          </svg>

          {hovered && (
            <div className="mt-1 rounded border border-white/10 px-3 py-2 text-xs" style={{ color: "var(--text-secondary)" }}>
              <div className="mb-1 font-medium" style={{ color: "var(--text-primary)" }}>
                {hovered.date}
              </div>
              <div className="flex gap-4 tabular-nums">
                <span>
                  <span className="mr-1 inline-block h-0.5 w-3 align-middle" style={{ background: "var(--series-ctl)" }} />
                  CTL <strong style={{ color: "var(--text-primary)" }}>{hovered.ctl.toFixed(1)}</strong>
                </span>
                <span>
                  <span className="mr-1 inline-block h-0.5 w-3 align-middle" style={{ background: "var(--series-atl)" }} />
                  ATL <strong style={{ color: "var(--text-primary)" }}>{hovered.atl.toFixed(1)}</strong>
                </span>
                <span>
                  <span className="mr-1 inline-block h-0.5 w-3 align-middle" style={{ background: "var(--series-tsb)" }} />
                  TSB <strong style={{ color: "var(--text-primary)" }}>{hovered.tsb.toFixed(1)}</strong>
                </span>
              </div>
            </div>
          )}

          <div className="mt-3 flex gap-4 text-xs" style={{ color: "var(--text-secondary)" }}>
            <span>
              <span className="mr-1 inline-block h-0.5 w-3 align-middle" style={{ background: "var(--series-ctl)" }} />
              CTL — fitness
            </span>
            <span>
              <span className="mr-1 inline-block h-0.5 w-3 align-middle" style={{ background: "var(--series-atl)" }} />
              ATL — fatigue
            </span>
            <span>
              <span className="mr-1 inline-block h-0.5 w-3 align-middle" style={{ background: "var(--series-tsb)" }} />
              TSB — form
            </span>
          </div>
        </>
      )}
    </div>
  );
}
