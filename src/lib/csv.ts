import type { Insight } from "./insights";
import type { ScenarioResult } from "./scenario";

const escape = (value: string | number): string => {
  const text = typeof value === "number" ? String(Number(value.toFixed(3))) : value;
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const row = (...cells: (string | number)[]) => cells.map(escape).join(",");

/** Serialise inputs, headline results, insights and yearly projections into one CSV document. */
export function scenarioToCsv(result: ScenarioResult, insights: Insight[]): string {
  const { input, summary: s } = result;
  const lines: string[] = [
    row("EnergyShift scenario export (illustrative model, not a forecast)"),
    "",
    row("Section", "Parameter", "Value", "Unit"),
    row("Input", "EV adoption", input.evAdoption, "% of new sales"),
    row("Input", "Target year", input.targetYear, "year"),
    row("Input", "Lithium supply expansion", input.lithiumSupply, ""),
    row("Input", "Renewable electricity share", input.renewableShare, "%"),
    row("Result", "Pathway status", s.status, ""),
    row("Result", "Transition score", s.transitionScore, "/100"),
    row("Result", "Oil demand", s.oilMbd, "mb/d"),
    row("Result", "Oil displaced vs baseline", s.oilDisplacedMbd, "mb/d"),
    row("Result", "EV fleet", s.evFleetMillions, "million vehicles"),
    row("Result", "EV share of fleet", s.evFleetShare, "%"),
    row("Result", "EV electricity demand", s.evElectricityTwh, "TWh"),
    row("Result", "Total electricity demand", s.electricityTwh, "TWh"),
    row("Result", "Grid carbon intensity", s.gridIntensity, "g CO2/kWh"),
    row("Result", "Oil + power CO2", s.co2Gt, "Gt"),
    row("Result", "CO2 avoided vs baseline (target year)", s.co2AvoidedGt, "Gt"),
    row("Result", "Cumulative CO2 avoided 2025-2050", s.cumulativeCo2AvoidedGt, "Gt"),
    row("Result", "Lithium demand", s.lithiumDemandKt, "kt LCE"),
    row("Result", "Lithium supply", s.lithiumSupplyKt, "kt LCE"),
    row("Result", "Lithium supply coverage", s.lithiumCoverage * 100, "%"),
    row("Result", "First lithium deficit year", s.firstLithiumDeficitYear ?? "none", ""),
    ...result.regions.map((r) => row("Region", `${r.name} EV sales share`, r.evShare, "%")),
    ...insights.map((i) => row("Insight", `${i.severity}: ${i.title}`, i.body, "")),
    "",
    row(
      "Year",
      "EV sales share %",
      "EV fleet share %",
      "EV fleet (M)",
      "Renewable share %",
      "Oil (mb/d)",
      "Electricity (TWh)",
      "EV electricity (TWh)",
      "Grid intensity (g/kWh)",
      "CO2 (Gt)",
      "Baseline CO2 (Gt)",
      "Lithium demand (kt LCE)",
      "Lithium supply (kt LCE)",
    ),
    ...result.projections.map((p) =>
      row(
        p.year,
        p.evSalesShare,
        p.evFleetShare,
        p.evFleetMillions,
        p.renewableShare,
        p.oilMbd,
        p.electricityTwh,
        p.evElectricityTwh,
        p.gridIntensity,
        p.co2Gt,
        p.baselineCo2Gt,
        p.lithiumDemandKt,
        p.lithiumSupplyKt,
      ),
    ),
  ];
  return lines.join("\n") + "\n";
}

export function csvFileName(result: ScenarioResult): string {
  const { evAdoption, targetYear, lithiumSupply, renewableShare } = result.input;
  return `energyshift-ev${evAdoption}-res${renewableShare}-${lithiumSupply}-${targetYear}.csv`;
}
