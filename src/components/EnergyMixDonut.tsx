"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, type TooltipContentProps } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import type { ScenarioResult } from "@/lib/scenario";
import { fmt } from "@/lib/format";
import { AlertNote, Card, CardHeader } from "./ui";

const COLORS: Record<string, string> = {
  "renewable-electricity": "#1d55b8",
  "fossil-electricity": "#a9cff5",
  oil: "#7cb3ee",
  "other-fuels": "#4b8fe6",
};

function MixTooltip({ active, payload }: TooltipContentProps<ValueType, NameType>) {
  const p = payload?.[0];
  if (!active || !p) return null;
  return (
    <div className="rounded-md border border-line bg-white px-2.5 py-1.5 text-[11px] shadow-sm">
      <span className="font-medium">{p.name}</span>: {fmt.ej(Number(p.value))}
    </div>
  );
}

export function EnergyMixDonut({ result }: { result: ScenarioResult }) {
  const { energyMix, summary: s } = result;
  const total = energyMix.reduce((sum, m) => sum + m.ej, 0);
  const delta = s.lowCarbonShareChangePts;

  return (
    <Card labelledBy="mix-title" className="flex flex-col">
      <CardHeader
        id="mix-title"
        title={`Global energy mix · ${s.year}`}
        info="Modelled final energy by source in the target year. The centre shows renewable power as a share of all modelled energy — lower than the renewable share of electricity because oil, gas and coal are still used directly."
      />
      <div className="flex flex-1 items-center gap-4">
        <div className="relative size-[150px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={energyMix}
                dataKey="ej"
                nameKey="label"
                innerRadius={50}
                outerRadius={74}
                startAngle={90}
                endAngle={-270}
                paddingAngle={1.5}
                stroke="#fff"
                strokeWidth={2}
                isAnimationActive={false}
              >
                {energyMix.map((m) => (
                  <Cell key={m.id} fill={COLORS[m.id]} />
                ))}
              </Pie>
              <Tooltip content={MixTooltip} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <div>
              <div className="text-[24px] leading-none font-medium tabular-nums">{fmt.pct(s.lowCarbonShareOfMix)}</div>
              <div className="mt-1 text-[9.5px] text-muted">renewable</div>
            </div>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[19px] leading-tight tabular-nums">{fmt.ej(total)}</div>
          <div className="mb-3 text-[11px] text-muted">Modelled final energy</div>
          <ul className="flex flex-col gap-2">
            {energyMix.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-2 text-[11.5px] text-muted">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="size-2 shrink-0 rounded-full" style={{ background: COLORS[m.id] }} aria-hidden />
                  <span className="truncate">{m.label}</span>
                </span>
                <span className="rounded-[5px] border border-line bg-white px-1.5 py-px text-[11px] font-medium text-ink tabular-nums">
                  {fmt.pct(m.share)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <AlertNote tone={delta >= 0 ? "ok" : "alert"}>
        Renewable share of energy {delta >= 0 ? "up" : "down"} {fmt.dec(Math.abs(delta))} pts vs 2025
      </AlertNote>
    </Card>
  );
}
