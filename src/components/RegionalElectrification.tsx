"use client";

import type { ScenarioResult } from "@/lib/scenario";
import { fmt } from "@/lib/format";
import { Card, CardHeader } from "./ui";

const BAR_COLORS = ["#1d55b8", "#2a6fd6", "#4b8fe6", "#7cb3ee", "#a9cff5"];

export function RegionalElectrification({ result }: { result: ScenarioResult }) {
  const { summary: s, input } = result;
  const kpis = [
    { value: fmt.dec(s.evFleetMillions / 1000, 2), unit: "bn", label: "EVs on the road" },
    { value: fmt.int(s.cumulativeCo2AvoidedGt), unit: "Gt", label: "CO₂ avoided to 2050" },
    { value: fmt.dec(s.oilDisplacedMbd), unit: "mb/d", label: "Oil displaced" },
  ];

  return (
    <Card labelledBy="regions-title">
      <CardHeader
        id="regions-title"
        title="Regional electrification"
        info="EV share of new sales in the target year. Regional values apply illustrative multipliers to the global setting (China 1.35×, Europe 1.25×, North America 0.95×, India 0.6×, Latin America 0.5×), capped at 100%."
      />
      <dl className="grid grid-cols-3 gap-2">
        {kpis.map((k) => (
          <div key={k.label}>
            <dd className="text-[24px] leading-tight font-normal tracking-[-0.02em] tabular-nums">
              {k.value}
              <span className="ml-1 text-[13px] text-muted">{k.unit}</span>
            </dd>
            <dt className="mt-1 text-[11px] text-muted">{k.label}</dt>
          </div>
        ))}
      </dl>

      <ul className="mt-4 flex flex-col gap-2.5" aria-label={`EV share of new sales by region in ${input.targetYear}`}>
        {result.regions.map((r, i) => (
          <li key={r.id}>
            <div className="mb-1 text-[11.5px] text-muted">{r.name}</div>
            <div className="flex items-center gap-2.5">
              <div
                className="h-3 flex-1 overflow-hidden rounded-[3px] bg-track"
                role="progressbar"
                aria-label={`${r.name} EV share of new sales`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(r.evShare)}
              >
                <div
                  className="h-full rounded-[3px] transition-[width] duration-300"
                  style={{ width: `${r.evShare}%`, background: BAR_COLORS[i] }}
                />
              </div>
              <span className="w-9 text-right text-[11px] font-medium tabular-nums">{fmt.pct(r.evShare)}</span>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
