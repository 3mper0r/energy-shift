import { INPUT_LIMITS, type LithiumSupply, type ScenarioInput, type ScenarioResult } from "./scenario";
import { fmt } from "./format";

export type InsightSeverity = "alert" | "insight" | "opportunity";

export interface Insight {
  id: string;
  severity: InsightSeverity;
  title: string;
  body: string;
  /** Optional deterministic adjustment the user can apply with one click. */
  action?: { label: string; patch: Partial<ScenarioInput> };
}

const SEVERITY_ORDER: Record<InsightSeverity, number> = { alert: 0, insight: 1, opportunity: 2 };

const NEXT_SUPPLY: Record<LithiumSupply, LithiumSupply | null> = {
  slow: "moderate",
  moderate: "rapid",
  rapid: null,
};

/**
 * Rule-based strategic insights. Pure and deterministic: the same scenario
 * always yields the same ordered list.
 */
export function generateInsights(result: ScenarioResult, limit = 3): Insight[] {
  const { input, summary: s } = result;
  const insights: Insight[] = [];

  if (s.lithiumCoverage < 1) {
    const next = NEXT_SUPPLY[input.lithiumSupply];
    insights.push({
      id: "lithium-shortfall",
      severity: "alert",
      title: "Lithium supply shortfall",
      body: `Demand reaches ${fmt.kt(s.lithiumDemandKt)} LCE in ${s.year}, ${fmt.pct((1 / s.lithiumCoverage - 1) * 100)} above modelled supply. Secure offtake agreements and recycling capacity before ${s.firstLithiumDeficitYear ?? s.year}.`,
      action: next ? { label: `Switch to ${next} lithium expansion`, patch: { lithiumSupply: next } } : undefined,
    });
  } else if (s.firstLithiumDeficitYear !== null) {
    insights.push({
      id: "lithium-interim-deficit",
      severity: "alert",
      title: "Interim lithium squeeze",
      body: `Supply covers ${s.year} demand, but runs short from ${s.firstLithiumDeficitYear} (peak gap ${fmt.kt(s.peakLithiumDeficitKt)}). Stage capacity additions earlier.`,
    });
  }

  if (input.evAdoption >= 50 && input.renewableShare < 50) {
    const target = Math.min(INPUT_LIMITS.renewableShare.max, input.renewableShare + 20);
    insights.push({
      id: "dirty-charging",
      severity: "alert",
      title: "EVs charging on a fossil-heavy grid",
      body: `Grid intensity stays at ${fmt.int(s.gridIntensity)} g CO₂/kWh, eroding the EV benefit. Raising renewables to ${target}% cuts power-sector emissions materially.`,
      action: { label: `Raise renewables to ${target}%`, patch: { renewableShare: target } },
    });
  }

  if (input.targetYear <= 2033 && input.evAdoption >= 40) {
    const baseSales = result.projections[0]?.evSalesMillions ?? 0;
    const targetSales = result.projections.find((p) => p.year === input.targetYear)?.evSalesMillions ?? 0;
    insights.push({
      id: "aggressive-timeline",
      severity: "alert",
      title: "Aggressive fleet turnover",
      body: `Reaching ${input.evAdoption}% by ${input.targetYear} implies ~${fmt.int(targetSales)}M EV sales that year, ${fmt.dec(targetSales / baseSales)}× the ${fmt.int(baseSales)}M sold in 2025 — a steep battery and factory ramp.`,
      action: { label: "Extend target to 2040", patch: { targetYear: 2040 } },
    });
  }

  if (s.electricityGrowthPct >= 40) {
    insights.push({
      id: "grid-build-out",
      severity: "insight",
      title: "Grid capacity planning",
      body: `Electricity demand grows ${fmt.pct(s.electricityGrowthPct)} by ${s.year}; EVs alone add ${fmt.twh(s.evElectricityTwh)}. Prioritise transmission and smart-charging programmes.`,
    });
  }

  if (s.oilDisplacedMbd >= 5) {
    insights.push({
      id: "oil-displacement",
      severity: "opportunity",
      title: "Structural oil displacement",
      body: `${fmt.mbd(s.oilDisplacedMbd)} of oil demand is displaced in ${s.year}. Reassess long-cycle upstream investments and refinery utilisation.`,
    });
  } else if (input.evAdoption < 30) {
    const target = Math.min(INPUT_LIMITS.evAdoption.max, input.evAdoption + 20);
    insights.push({
      id: "oil-lock-in",
      severity: "insight",
      title: "Oil demand lock-in",
      body: `Oil demand remains near ${fmt.mbd(s.oilMbd)} in ${s.year}. Faster EV adoption is the largest lever on transport emissions.`,
      action: { label: `Raise EV adoption to ${target}%`, patch: { evAdoption: target } },
    });
  }

  if (input.evAdoption - s.evFleetShare >= 20) {
    insights.push({
      id: "fleet-lag",
      severity: "insight",
      title: "Fleet turnover lag",
      body: `EVs reach ${input.evAdoption}% of sales but only ${fmt.pct(s.evFleetShare)} of the fleet by ${s.year}. Oil demand responds a decade behind sales targets.`,
    });
  }

  if (s.lithiumCoverage >= 1.6) {
    insights.push({
      id: "lithium-headroom",
      severity: "insight",
      title: "Lithium supply headroom",
      body: `Supply exceeds demand by ${fmt.pct((s.lithiumCoverage - 1) * 100)} in ${s.year}. Price pressure is likely; phase capex to avoid stranded capacity.`,
    });
  }

  if (input.renewableShare >= 80) {
    insights.push({
      id: "clean-grid",
      severity: "opportunity",
      title: "Clean-power advantage",
      body: `Grid intensity falls to ${fmt.int(s.gridIntensity)} g CO₂/kWh. Electrifying industrial heat becomes the next high-impact lever.`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "balanced",
      severity: "insight",
      title: "Balanced transition",
      body: `No binding constraint detected. The pathway avoids ${fmt.gt(s.co2AvoidedGt)} CO₂ in ${s.year} versus a frozen-2025 baseline.`,
    });
  }

  return insights
    .map((insight, index) => ({ insight, index }))
    .sort((a, b) => SEVERITY_ORDER[a.insight.severity] - SEVERITY_ORDER[b.insight.severity] || a.index - b.index)
    .slice(0, limit)
    .map(({ insight }) => insight);
}
