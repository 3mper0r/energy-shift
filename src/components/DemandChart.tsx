"use client";

import { useId, useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import type { ScenarioResult } from "@/lib/scenario";
import { fmt } from "@/lib/format";
import { Card, CardHeader, LegendDot } from "./ui";

const SERIES = [
  { key: "electricityEj", label: "Electricity", color: "#7cb3ee" },
  { key: "renewableElectricityEj", label: "Renewable power", color: "#4b8fe6" },
  { key: "oilEj", label: "Oil", color: "#1d55b8" },
] as const;

type Range = "full" | "target";

function ChartTooltip({ active, payload, label }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-sky-3/60 bg-sky-2/95 px-2.5 py-1.5 text-[11px] text-navy shadow-sm">
      <p className="font-semibold">{label}</p>
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="tabular-nums">
          {p.name}: {fmt.ej(Number(p.value))}
        </p>
      ))}
    </div>
  );
}

export function DemandChart({ result }: { result: ScenarioResult }) {
  const [range, setRange] = useState<Range>("full");
  const selectId = useId();
  const target = result.input.targetYear;
  const data = result.projections
    .filter((p) => range === "full" || p.year <= target)
    .map((p) => ({
      year: p.year,
      electricityEj: Math.round(p.electricityEj),
      renewableElectricityEj: Math.round(p.renewableElectricityEj),
      oilEj: Math.round(p.oilEj),
    }));
  const last = result.projections.at(-1);
  const oilChange = last ? (last.oilEj / (result.projections[0]?.oilEj ?? last.oilEj) - 1) * 100 : 0;

  return (
    <Card id="demand" labelledBy="demand-title" className="lg:col-span-2">
      <CardHeader
        id="demand-title"
        title="Energy demand projections to 2050"
        info="Final energy in exajoules (EJ). Oil = all oil uses; electricity includes EV charging. Targets are reached in the target year and held flat thereafter."
      >
        <label htmlFor={selectId} className="sr-only">
          Chart range
        </label>
        <select
          id={selectId}
          value={range}
          onChange={(e) => setRange(e.target.value as Range)}
          className="h-7 rounded-[8px] border border-line bg-white px-2 text-[11.5px] text-ink focus-visible:outline-2 focus-visible:outline-royal-2"
        >
          <option value="full">2025–2050</option>
          <option value="target">2025–{target}</option>
        </select>
      </CardHeader>

      <div className="h-[250px]" role="img" aria-label={`Line chart of oil, electricity and renewable power demand from 2025 to ${data.at(-1)?.year}. Oil changes ${fmt.signedPct(oilChange)} by 2050.`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 16, bottom: 0, left: -8 }}>
            <CartesianGrid stroke="#e8eaed" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#9aa1ab" }} tickLine={false} axisLine={false} interval={range === "full" ? 4 : "preserveStartEnd"} />
            <YAxis tick={{ fontSize: 10, fill: "#9aa1ab" }} tickLine={false} axisLine={false} unit=" EJ" width={56} />
            <Tooltip content={ChartTooltip} cursor={{ stroke: "#a9cff5", strokeWidth: 1 }} />
            {range === "full" ? (
              <ReferenceLine x={target} stroke="#142333" strokeDasharray="3 3" strokeOpacity={0.5} label={{ value: `Target ${target}`, position: "top", fontSize: 10, fill: "#5f6772" }} />
            ) : null}
            {SERIES.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={s.key === "oilEj" ? 2 : 1.6}
                dot={false}
                activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex flex-wrap gap-4">
          {SERIES.map((s) => (
            <LegendDot key={s.key} color={s.color} label={s.label} />
          ))}
        </div>
        <span className="rounded-md border border-line bg-white px-2 py-0.5 text-[11px] font-medium tabular-nums" title="Change in oil demand 2025 → 2050">
          Oil {fmt.signedPct(oilChange)} by 2050
        </span>
      </div>
    </Card>
  );
}
