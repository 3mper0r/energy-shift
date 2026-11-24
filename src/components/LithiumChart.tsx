"use client";

import { Bar, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import type { ScenarioResult } from "@/lib/scenario";
import { fmt, LITHIUM_LABEL } from "@/lib/format";
import { AlertNote, Card, CardHeader, LegendDot } from "./ui";

interface Row {
  year: number;
  covered: number;
  shortfall: number;
  supply: number;
  demand: number;
}

function LithiumTooltip({ active, payload, label }: TooltipContentProps<ValueType, NameType>) {
  const row = payload?.[0]?.payload as Row | undefined;
  if (!active || !row) return null;
  return (
    <div className="rounded-md border border-sky-3/60 bg-sky-2/95 px-2.5 py-1.5 text-[11px] text-navy shadow-sm">
      <p className="font-semibold">{label}</p>
      <p className="tabular-nums">Demand: {fmt.kt(row.demand)} LCE</p>
      <p className="tabular-nums">Supply: {fmt.kt(row.supply)} LCE</p>
      {row.shortfall > 0 ? <p className="font-medium tabular-nums">Shortfall: {fmt.kt(row.shortfall)}</p> : null}
    </div>
  );
}

export function LithiumChart({ result }: { result: ScenarioResult }) {
  const { summary: s, input } = result;
  const data: Row[] = result.projections.map((p) => ({
    year: p.year,
    demand: p.lithiumDemandKt,
    supply: p.lithiumSupplyKt,
    covered: Math.min(p.lithiumDemandKt, p.lithiumSupplyKt),
    shortfall: Math.max(0, p.lithiumDemandKt - p.lithiumSupplyKt),
  }));
  const yMax = Math.ceil((Math.max(...data.map((d) => d.demand)) * 1.25) / 1000) * 1000;

  const message =
    s.firstLithiumDeficitYear === null
      ? `Supply covers demand in every year (${LITHIUM_LABEL[input.lithiumSupply].toLowerCase()} expansion)`
      : `Deficit from ${s.firstLithiumDeficitYear}, peaking at ${fmt.kt(s.peakLithiumDeficitKt)} LCE per year`;

  return (
    <Card id="materials" labelledBy="lithium-title" className="flex flex-col">
      <CardHeader
        id="lithium-title"
        title="Lithium demand projection"
        info="Annual lithium demand in kt of lithium carbonate equivalent (LCE): new EV batteries (65 kWh, 0.7 kg LCE/kWh falling 1.5%/yr) plus other uses. Dark = demand met by supply, light = shortfall. Dashed line = supply capacity."
      />
      <div
        className="h-[170px] flex-1"
        role="img"
        aria-label={`Bar chart of lithium demand 2025–2050 against supply capacity. ${message}.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 6, right: 4, bottom: 0, left: -14 }} barCategoryGap="22%">
            <CartesianGrid stroke="#e8eaed" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#9aa1ab" }} tickLine={false} axisLine={false} interval={4} />
            <YAxis
              tick={{ fontSize: 10, fill: "#9aa1ab" }}
              tickLine={false}
              axisLine={false}
              domain={[0, yMax]}
              allowDataOverflow
              tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}M` : String(v))}
              width={44}
            />
            <Tooltip content={LithiumTooltip} cursor={{ fill: "rgb(169 207 245 / 0.25)" }} />
            <ReferenceLine x={input.targetYear} stroke="#142333" strokeDasharray="3 3" strokeOpacity={0.45} />
            <Bar dataKey="covered" stackId="l" fill="#4b8fe6" isAnimationActive={false} />
            <Bar dataKey="shortfall" stackId="l" fill="#a9cff5" radius={[2, 2, 0, 0]} isAnimationActive={false} />
            <Line dataKey="supply" type="monotone" stroke="#142333" strokeWidth={1.3} strokeDasharray="4 3" dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap gap-3">
        <LegendDot color="#4b8fe6" label="Demand met" />
        <LegendDot color="#a9cff5" label="Shortfall" />
        <LegendDot color="#142333" label="Supply capacity" />
      </div>
      <AlertNote tone={s.firstLithiumDeficitYear === null ? "ok" : "alert"}>{message}</AlertNote>
    </Card>
  );
}
