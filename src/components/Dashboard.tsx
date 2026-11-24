"use client";

import { Download } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { csvFileName, scenarioToCsv } from "@/lib/csv";
import { generateInsights } from "@/lib/insights";
import { calculateScenario, DEFAULT_SCENARIO, type ScenarioInput } from "@/lib/scenario";
import { DemandChart } from "./DemandChart";
import { EnergyMixDonut } from "./EnergyMixDonut";
import { InsightsPanel } from "./InsightsPanel";
import { LithiumChart } from "./LithiumChart";
import { Methodology } from "./Methodology";
import { RadialVisualization } from "./RadialVisualization";
import { RegionalElectrification } from "./RegionalElectrification";
import { ScenarioControls } from "./ScenarioControls";
import { ScenarioMetrics } from "./ScenarioMetrics";
import { TopNav } from "./TopNav";
import { Button, cx } from "./ui";

function useSecondsSince(timestamp: number) {
  const [now, setNow] = useState(timestamp);
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return Math.max(0, Math.round((now - timestamp) / 1000));
}

function downloadFile(name: string, content: string) {
  // BOM so Excel decodes UTF-8 characters such as "CO₂" correctly.
  const url = URL.createObjectURL(new Blob(["﻿", content], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

const STATUS_DOT = { Accelerated: "bg-ok", Progressing: "bg-warn", Lagging: "bg-alert" } as const;

export function Dashboard() {
  const [input, setInput] = useState<ScenarioInput>(DEFAULT_SCENARIO);
  const [changedAt, setChangedAt] = useState(() => Date.now());
  const result = useMemo(() => calculateScenario(input), [input]);
  const insights = useMemo(() => generateInsights(result), [result]);
  const seconds = useSecondsSince(changedAt);

  const update = useCallback((patch: Partial<ScenarioInput>) => {
    setInput((prev) => ({ ...prev, ...patch }));
    setChangedAt(Date.now());
  }, []);
  const reset = useCallback(() => {
    setInput(DEFAULT_SCENARIO);
    setChangedAt(Date.now());
  }, []);
  const exportCsv = useCallback(() => downloadFile(csvFileName(result), scenarioToCsv(result, insights)), [result, insights]);

  const isDefault = (Object.keys(DEFAULT_SCENARIO) as (keyof ScenarioInput)[]).every((k) => input[k] === DEFAULT_SCENARIO[k]);
  const { status } = result.summary;

  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-[1440px] px-6 pt-5 pb-10">
        {/* Page header */}
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[19px] font-medium tracking-[-0.01em]">Global energy transition scenario</h1>
            <p className="mt-1 flex items-center gap-2 text-[11.5px] text-muted" aria-live="polite">
              <span className="inline-flex items-center gap-1 font-medium text-ink">
                <span className={cx("size-1.5 rounded-full", STATUS_DOT[status])} aria-hidden />
                {status} pathway
              </span>
              <span>·</span>
              <span>
                EV {input.evAdoption}% · Renewables {input.renewableShare}% · Target {input.targetYear}
              </span>
              <span>·</span>
              <span suppressHydrationWarning>Recalculated {seconds < 2 ? "just now" : `${seconds}s ago`}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={reset} disabled={isDefault}>
              Reset scenario
            </Button>
            <Button variant="primary" onClick={exportCsv}>
              <Download className="size-3.5" aria-hidden />
              Export Scenario
            </Button>
          </div>
        </div>

        {/* Hero panel */}
        <section
          id="overview"
          aria-label="Scenario overview"
          className="grid gap-4 rounded-[16px] border border-line bg-panel p-4 lg:grid-cols-[minmax(250px,280px)_1fr_minmax(250px,270px)]"
        >
          <div className="lg:self-start">
            <ScenarioControls input={input} onChange={update} onReset={reset} isDefault={isDefault} />
          </div>
          <div className="relative order-first h-[300px] overflow-hidden sm:h-[360px] lg:order-none lg:-mb-4 lg:h-auto lg:min-h-[380px]">
            <div className="absolute inset-0">
              <RadialVisualization result={result} />
            </div>
          </div>
          <ScenarioMetrics result={result} onExport={exportCsv} />
        </section>

        {/* Second row */}
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <DemandChart result={result} />
          <RegionalElectrification result={result} />
        </div>

        {/* Third row */}
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <EnergyMixDonut result={result} />
          <LithiumChart result={result} />
          <InsightsPanel result={result} insights={insights} onApply={update} />
        </div>

        <Methodology />
      </main>
    </>
  );
}
