"use client";

import { Download } from "lucide-react";
import type { ScenarioResult } from "@/lib/scenario";
import { fmt } from "@/lib/format";
import { Button, cx, InfoTip } from "./ui";

const STATUS_STYLE = {
  Accelerated: { pill: "bg-[#e4f6ea] text-[#17733a]", dot: "bg-ok" },
  Progressing: { pill: "bg-[#fdf3dc] text-[#8a5a00]", dot: "bg-warn" },
  Lagging: { pill: "bg-[#fde6e3] text-[#a12a1f]", dot: "bg-alert" },
} as const;

function Sparkline({ values, label }: { values: number[]; label: string }) {
  const w = 64;
  const h = 26;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - 2 - ((v - min) / span) * (h - 4)}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label}>
      <polyline points={points} fill="none" stroke="#4b8fe6" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

export function ScenarioMetrics({ result, onExport }: { result: ScenarioResult; onExport: () => void }) {
  const s = result.summary;
  const style = STATUS_STYLE[s.status];
  const rows: { label: string; value: string; tip: string }[] = [
    { label: "Oil demand", value: fmt.mbd(s.oilMbd), tip: "All oil uses. Passenger vehicles scale with the combustion share of the fleet." },
    { label: "EV fleet share", value: fmt.pct(s.evFleetShare), tip: "Share of all passenger vehicles on the road that are electric, after fleet turnover." },
    { label: "EV electricity", value: fmt.twh(s.evElectricityTwh), tip: "2,300 kWh per EV per year." },
    { label: "Grid intensity", value: `${fmt.int(s.gridIntensity)} g CO₂/kWh`, tip: "Non-renewable generation at 0.7 t CO₂/MWh." },
    { label: "Lithium coverage", value: fmt.pct(s.lithiumCoverage * 100), tip: "Lithium supply capacity divided by demand in the target year." },
  ];
  const co2Series = result.projections.map((p) => p.co2Gt);

  return (
    <div className="flex h-full flex-col rounded-[14px] border border-line bg-white p-4 shadow-[0_1px_2px_rgb(20_35_51/0.04)]">
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-medium">Scenario outcome · {s.year}</h2>
        <InfoTip label="About scenario outcome" text="Headline results for the selected target year, recalculated instantly from the controls." />
      </div>
      <span className={cx("mt-1.5 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-medium", style.pill)}>
        <span className={cx("size-1.5 rounded-full", style.dot)} aria-hidden />
        {s.status} pathway · score {s.transitionScore}
      </span>

      <dl className="mt-3 flex flex-col gap-2.5 text-[12px]">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-3" title={r.tip}>
            <dt className="text-muted">{r.label}:</dt>
            <dd className="font-semibold tabular-nums">{r.value}</dd>
          </div>
        ))}
        <div className="flex items-end justify-between gap-3">
          <div>
            <dt className="text-muted">Oil + power CO₂</dt>
            <dd className="mt-0.5 text-[12px] font-semibold tabular-nums">
              {fmt.gt(s.co2Gt)}{" "}
              <span className="text-[10.5px] font-normal text-muted">
                ({s.co2AvoidedGt >= 0 ? "−" : "+"}
                {fmt.dec(Math.abs(s.co2AvoidedGt))} vs. baseline)
              </span>
            </dd>
          </div>
          <Sparkline values={co2Series} label={`CO₂ trajectory 2025–2050, from ${fmt.gt(co2Series[0] ?? 0)} to ${fmt.gt(co2Series.at(-1) ?? 0)}`} />
        </div>
      </dl>

      <div className="mt-auto flex flex-col gap-2 pt-4">
        <a
          href="#insights"
          className="inline-flex h-9 items-center justify-center rounded-[9px] bg-navy text-[12.5px] font-medium text-white transition-colors hover:bg-navy-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-2"
        >
          View strategic insights
        </a>
        <Button onClick={onExport}>
          <Download className="size-3.5" aria-hidden />
          Export CSV
        </Button>
      </div>
    </div>
  );
}
