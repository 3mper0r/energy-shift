import { describe, expect, it } from "vitest";
import { csvFileName, scenarioToCsv } from "@/lib/csv";
import { generateInsights } from "@/lib/insights";
import {
  ASSUMPTIONS,
  calculateScenario,
  DEFAULT_SCENARIO,
  evSalesShareInYear,
  normalizeInput,
  renewableShareInYear,
  type ScenarioInput,
} from "@/lib/scenario";

const scenario = (patch: Partial<ScenarioInput> = {}) => calculateScenario({ ...DEFAULT_SCENARIO, ...patch });

describe("calculateScenario", () => {
  it("is deterministic", () => {
    expect(scenario()).toEqual(scenario());
  });

  it("projects every year from 2025 to 2050", () => {
    const { projections } = scenario();
    expect(projections).toHaveLength(26);
    expect(projections[0]?.year).toBe(2025);
    expect(projections.at(-1)?.year).toBe(2050);
  });

  it("starts from the base-year calibration regardless of inputs", () => {
    const a = scenario({ evAdoption: 0, renewableShare: 20 }).projections[0]!;
    const b = scenario({ evAdoption: 100, renewableShare: 100 }).projections[0]!;
    expect(a.oilMbd).toBeCloseTo(b.oilMbd, 6);
    expect(a.evFleetShare).toBeCloseTo(ASSUMPTIONS.baseEvFleetShare, 6);
    expect(a.co2Gt).toBeCloseTo(a.baselineCo2Gt, 6);
  });

  it("reaches the EV sales and renewable targets in the target year and holds them", () => {
    const input = { ...DEFAULT_SCENARIO, evAdoption: 80, renewableShare: 70, targetYear: 2035 };
    expect(evSalesShareInYear(input, 2035)).toBeCloseTo(80);
    expect(evSalesShareInYear(input, 2050)).toBeCloseTo(80);
    expect(renewableShareInYear(input, 2035)).toBeCloseTo(70);
    expect(renewableShareInYear(input, 2045)).toBeCloseTo(70);
  });

  it("keeps the EV fleet share below the sales share while the fleet turns over", () => {
    const { summary } = scenario({ evAdoption: 80 });
    expect(summary.evFleetShare).toBeGreaterThan(ASSUMPTIONS.baseEvFleetShare);
    expect(summary.evFleetShare).toBeLessThan(80);
  });

  it("reduces oil demand and raises EV electricity as EV adoption increases", () => {
    const low = scenario({ evAdoption: 20 }).summary;
    const high = scenario({ evAdoption: 90 }).summary;
    expect(high.oilMbd).toBeLessThan(low.oilMbd);
    expect(high.oilDisplacedMbd).toBeGreaterThan(low.oilDisplacedMbd);
    expect(high.evElectricityTwh).toBeGreaterThan(low.evElectricityTwh);
    expect(high.lithiumDemandKt).toBeGreaterThan(low.lithiumDemandKt);
  });

  it("lowers grid intensity and emissions as renewable share increases", () => {
    const low = scenario({ renewableShare: 30 }).summary;
    const high = scenario({ renewableShare: 90 }).summary;
    expect(high.gridIntensity).toBeLessThan(low.gridIntensity);
    expect(high.co2Gt).toBeLessThan(low.co2Gt);
    expect(scenario({ renewableShare: 100 }).summary.gridIntensity).toBe(0);
  });

  it("orders lithium supply capacity slow < moderate < rapid without changing demand", () => {
    const [slow, moderate, rapid] = (["slow", "moderate", "rapid"] as const).map((l) => scenario({ lithiumSupply: l }).summary);
    expect(slow!.lithiumSupplyKt).toBeLessThan(moderate!.lithiumSupplyKt);
    expect(moderate!.lithiumSupplyKt).toBeLessThan(rapid!.lithiumSupplyKt);
    expect(slow!.lithiumDemandKt).toBeCloseTo(rapid!.lithiumDemandKt, 6);
  });

  it("flags a lithium deficit when demand outgrows slow supply", () => {
    const { summary } = scenario({ evAdoption: 100, targetYear: 2035, lithiumSupply: "slow" });
    expect(summary.lithiumCoverage).toBeLessThan(1);
    expect(summary.firstLithiumDeficitYear).not.toBeNull();
    expect(summary.peakLithiumDeficitKt).toBeGreaterThan(0);
  });

  it("produces an energy mix that sums to 100%", () => {
    const total = scenario().energyMix.reduce((sum, s) => sum + s.share, 0);
    expect(total).toBeCloseTo(100, 6);
  });

  it("caps regional EV shares at 100%", () => {
    const regions = scenario({ evAdoption: 100 }).regions;
    expect(Math.max(...regions.map((r) => r.evShare))).toBe(100);
  });

  it("classifies pathway status from the transition score", () => {
    expect(scenario({ evAdoption: 95, renewableShare: 95, lithiumSupply: "rapid" }).summary.status).toBe("Accelerated");
    expect(scenario({ evAdoption: 5, renewableShare: 25 }).summary.status).toBe("Lagging");
  });
});

describe("normalizeInput", () => {
  it("clamps and rounds out-of-range values", () => {
    expect(normalizeInput({ evAdoption: 140.6, targetYear: 2070, lithiumSupply: "rapid", renewableShare: 3 })).toEqual({
      evAdoption: 100,
      targetYear: 2050,
      lithiumSupply: "rapid",
      renewableShare: 20,
    });
  });
});

describe("generateInsights", () => {
  it("returns at most three insights with risks first", () => {
    const insights = generateInsights(scenario({ evAdoption: 100, targetYear: 2031, lithiumSupply: "slow", renewableShare: 30 }));
    expect(insights.length).toBeLessThanOrEqual(3);
    expect(insights[0]?.severity).toBe("alert");
  });

  it("recommends faster lithium expansion when supply falls short", () => {
    const shortfall = generateInsights(scenario({ evAdoption: 100, targetYear: 2035, lithiumSupply: "slow" })).find(
      (i) => i.id === "lithium-shortfall",
    );
    expect(shortfall?.action?.patch).toEqual({ lithiumSupply: "moderate" });
  });

  it("recommends more renewables when EVs charge on a fossil-heavy grid", () => {
    const insight = generateInsights(scenario({ evAdoption: 70, renewableShare: 35 })).find((i) => i.id === "dirty-charging");
    expect(insight?.action?.patch).toEqual({ renewableShare: 55 });
  });

  it("compares an aggressive timeline against modelled 2025 EV sales in the target year", () => {
    const result = scenario({ evAdoption: 100, targetYear: 2030 });
    const insight = generateInsights(result, 10).find((i) => i.id === "aggressive-timeline");
    const targetSales = result.projections.find((p) => p.year === 2030)!.evSalesMillions;
    expect(insight?.body).toContain(`~${Math.round(targetSales)}M EV sales that year`);
    expect(insight?.body).toContain("20M sold in 2025");
  });

  it("always returns at least one insight", () => {
    expect(generateInsights(scenario({ evAdoption: 30, renewableShare: 50, lithiumSupply: "moderate" })).length).toBeGreaterThan(0);
  });
});

describe("scenarioToCsv", () => {
  it("includes inputs, results and one row per projected year", () => {
    const result = scenario();
    const csv = scenarioToCsv(result, generateInsights(result));
    expect(csv).toContain("Input,EV adoption,60,% of new sales");
    expect(csv).toContain("Input,Lithium supply expansion,moderate");
    const yearRows = csv.split("\n").filter((line) => /^20\d\d,/.test(line));
    expect(yearRows).toHaveLength(26);
    expect(csvFileName(result)).toBe("energyshift-ev60-res65-moderate-2040.csv");
  });
});
