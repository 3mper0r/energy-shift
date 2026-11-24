/**
 * EnergyShift scenario model.
 *
 * A deliberately small, deterministic model that links four levers
 * (EV adoption, target year, lithium supply expansion, renewable electricity share)
 * to oil demand, electricity demand, lithium balance and CO₂ emissions.
 *
 * All coefficients are ILLUSTRATIVE round numbers chosen to be in a plausible
 * order of magnitude. They are not calibrated forecasts. Every assumption lives
 * in `ASSUMPTIONS` so the UI can disclose it verbatim.
 */

export type LithiumSupply = "slow" | "moderate" | "rapid";

export interface ScenarioInput {
  /** EV share of new passenger vehicle sales reached by the target year, 0–100 %. */
  evAdoption: number;
  /** Year in which the EV and renewable targets are reached, 2030–2050. */
  targetYear: number;
  /** Pace at which lithium mining and refining capacity expands. */
  lithiumSupply: LithiumSupply;
  /** Renewable share of electricity generation reached by the target year, 20–100 %. */
  renewableShare: number;
}

export const INPUT_LIMITS = {
  evAdoption: { min: 0, max: 100, step: 1 },
  targetYear: { min: 2030, max: 2050, step: 1 },
  renewableShare: { min: 20, max: 100, step: 1 },
} as const;

export const LITHIUM_SUPPLY_OPTIONS: readonly LithiumSupply[] = ["slow", "moderate", "rapid"];

export const DEFAULT_SCENARIO: ScenarioInput = {
  evAdoption: 60,
  targetYear: 2040,
  lithiumSupply: "moderate",
  renewableShare: 65,
};

export const ASSUMPTIONS = {
  baseYear: 2025,
  endYear: 2050,
  /** EV share of the global passenger fleet in the base year (%). */
  baseEvFleetShare: 4,
  /** EV share of new passenger vehicle sales in the base year (%). */
  baseEvSalesShare: 20,
  /** Renewable share of global electricity in the base year (%). */
  baseRenewableShare: 32,
  /** Global passenger vehicle fleet in the base year (million vehicles). */
  baseFleetMillions: 1500,
  /** Annual growth of the vehicle fleet. */
  fleetGrowthRate: 0.012,
  /** Oil burned per combustion vehicle (barrels per day). */
  oilPerIceVehicleBpd: 0.0165,
  /** Oil demand outside passenger vehicles in the base year (mb/d). */
  baseOtherOilMbd: 79,
  /** Annual change of non-passenger-vehicle oil demand. */
  otherOilGrowthRate: -0.002,
  /** Electricity used per EV per year (kWh). */
  evKwhPerYear: 2300,
  /** Global electricity demand excluding EVs in the base year (TWh). */
  baseElectricityTwh: 30000,
  /** Annual growth of non-EV electricity demand. */
  electricityGrowthRate: 0.022,
  /** Emission factor of non-renewable generation (t CO₂ per MWh). */
  fossilGridIntensity: 0.7,
  /** CO₂ released per barrel of oil burned (t). */
  oilCo2PerBarrel: 0.43,
  /** Average battery size of a new EV (kWh). */
  batteryKwhPerEv: 65,
  /** Lithium carbonate equivalent per kWh of battery in the base year (kg LCE). */
  lceKgPerKwh: 0.7,
  /** Annual reduction in lithium intensity per kWh from chemistry improvements. */
  lithiumIntensityDecline: 0.015,
  /** Average vehicle lifetime; 1/lifetime of the fleet is retired and replaced each year. */
  vehicleLifetimeYears: 18,
  /** Lithium demand from stationary storage, electronics and industry in the base year (kt LCE). */
  baseOtherLithiumKt: 350,
  otherLithiumGrowthRate: 0.06,
  /** Lithium supply capacity in the base year (kt LCE). */
  baseLithiumSupplyKt: 1300,
  lithiumSupplyGrowthRate: { slow: 0.05, moderate: 0.09, rapid: 0.14 } satisfies Record<LithiumSupply, number>,
  /** Direct use of gas and coal outside power generation (EJ) in the base year. */
  baseOtherFuelsEj: 150,
  otherFuelsGrowthRate: -0.004,
  /** Energy conversion factors. */
  ejPerMbd: 2.12,
  ejPerTwh: 0.0036,
} as const;

/** Regional EV adoption relative to the global figure (illustrative multipliers). */
export const REGIONS = [
  { id: "china", name: "China", multiplier: 1.35 },
  { id: "europe", name: "Europe", multiplier: 1.25 },
  { id: "north-america", name: "North America", multiplier: 0.95 },
  { id: "india", name: "India", multiplier: 0.6 },
  { id: "latin-america", name: "Latin America", multiplier: 0.5 },
] as const;

export interface YearProjection {
  year: number;
  /** EV share of new sales (%). */
  evSalesShare: number;
  /** EV share of the vehicle fleet (%). */
  evFleetShare: number;
  evFleetMillions: number;
  evSalesMillions: number;
  renewableShare: number;
  oilMbd: number;
  baselineOilMbd: number;
  evElectricityTwh: number;
  electricityTwh: number;
  oilEj: number;
  electricityEj: number;
  renewableElectricityEj: number;
  /** Grid carbon intensity (g CO₂ per kWh). */
  gridIntensity: number;
  /** CO₂ from oil combustion and power generation (Gt). */
  co2Gt: number;
  baselineCo2Gt: number;
  lithiumDemandKt: number;
  lithiumSupplyKt: number;
}

export interface EnergyMixSlice {
  id: "renewable-electricity" | "fossil-electricity" | "oil" | "other-fuels";
  label: string;
  ej: number;
  share: number;
}

export interface RegionResult {
  id: string;
  name: string;
  /** EV share of new sales in the target year (%). */
  evShare: number;
}

export type PathwayStatus = "Accelerated" | "Progressing" | "Lagging";

export interface ScenarioSummary {
  year: number;
  oilMbd: number;
  oilDisplacedMbd: number;
  evFleetMillions: number;
  evFleetShare: number;
  evElectricityTwh: number;
  electricityTwh: number;
  /** Electricity demand growth vs. base year (%). */
  electricityGrowthPct: number;
  gridIntensity: number;
  co2Gt: number;
  co2AvoidedGt: number;
  /** Cumulative CO₂ avoided from the base year to 2050 (Gt). */
  cumulativeCo2AvoidedGt: number;
  lithiumDemandKt: number;
  lithiumSupplyKt: number;
  /** Supply ÷ demand in the target year. */
  lithiumCoverage: number;
  /** First year in which lithium demand exceeds supply, or null. */
  firstLithiumDeficitYear: number | null;
  /** Largest annual lithium deficit across the horizon (kt LCE, 0 if none). */
  peakLithiumDeficitKt: number;
  lowCarbonShareOfMix: number;
  /** Change in renewable share of the modelled mix vs. the base year (percentage points). */
  lowCarbonShareChangePts: number;
  /** 0–100 composite of adoption, clean power and material security. */
  transitionScore: number;
  status: PathwayStatus;
}

export interface ScenarioResult {
  input: ScenarioInput;
  projections: YearProjection[];
  summary: ScenarioSummary;
  energyMix: EnergyMixSlice[];
  regions: RegionResult[];
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Clamp and round user input into the supported domain. */
export function normalizeInput(input: ScenarioInput): ScenarioInput {
  return {
    evAdoption: clamp(Math.round(input.evAdoption), INPUT_LIMITS.evAdoption.min, INPUT_LIMITS.evAdoption.max),
    targetYear: clamp(Math.round(input.targetYear), INPUT_LIMITS.targetYear.min, INPUT_LIMITS.targetYear.max),
    lithiumSupply: LITHIUM_SUPPLY_OPTIONS.includes(input.lithiumSupply) ? input.lithiumSupply : "moderate",
    renewableShare: clamp(
      Math.round(input.renewableShare),
      INPUT_LIMITS.renewableShare.min,
      INPUT_LIMITS.renewableShare.max,
    ),
  };
}

/** Smooth S-curve progress (0 → 1) used for technology adoption. */
function sCurve(t: number): number {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

function progress(year: number, targetYear: number): number {
  const { baseYear } = ASSUMPTIONS;
  return (year - baseYear) / (targetYear - baseYear);
}

/** EV share of new sales (%) in a given year: S-curve to the target, then flat. */
export function evSalesShareInYear(input: ScenarioInput, year: number): number {
  const { baseEvSalesShare } = ASSUMPTIONS;
  return baseEvSalesShare + (input.evAdoption - baseEvSalesShare) * sCurve(progress(year, input.targetYear));
}

/** Renewable electricity share (%) in a given year; linear to target, then flat. */
export function renewableShareInYear(input: ScenarioInput, year: number): number {
  const { baseRenewableShare } = ASSUMPTIONS;
  const t = clamp(progress(year, input.targetYear), 0, 1);
  return baseRenewableShare + (input.renewableShare - baseRenewableShare) * t;
}

function fleetMillions(year: number): number {
  const a = ASSUMPTIONS;
  return a.baseFleetMillions * Math.pow(1 + a.fleetGrowthRate, year - a.baseYear);
}

function oilMbd(fleet: number, evShare: number, yearsElapsed: number): number {
  const a = ASSUMPTIONS;
  const iceVehicles = fleet * 1e6 * (1 - evShare / 100);
  const passengerOil = (iceVehicles * a.oilPerIceVehicleBpd) / 1e6;
  const otherOil = a.baseOtherOilMbd * Math.pow(1 + a.otherOilGrowthRate, yearsElapsed);
  return passengerOil + otherOil;
}

function powerCo2Gt(electricityTwh: number, renewableShare: number): number {
  // TWh × (t/MWh) = Mt; ÷ 1000 → Gt
  return (electricityTwh * (1 - renewableShare / 100) * ASSUMPTIONS.fossilGridIntensity) / 1000;
}

function oilCo2Gt(mbd: number): number {
  return (mbd * 1e6 * 365 * ASSUMPTIONS.oilCo2PerBarrel) / 1e9;
}

interface FleetState {
  evFleetMillions: number;
}

function projectYear(input: ScenarioInput, year: number, prev: FleetState | null): YearProjection {
  const a = ASSUMPTIONS;
  const n = year - a.baseYear;
  const fleet = fleetMillions(year);
  const evSalesShare = evSalesShareInYear(input, year);

  // Stock-flow fleet turnover: each year 1/lifetime of the fleet retires and is replaced,
  // plus net fleet growth. EVs retire at the same rate as the fleet average.
  let evFleet: number;
  let evSales: number;
  if (prev === null) {
    evFleet = (fleet * a.baseEvFleetShare) / 100;
    evSales = ((fleet / a.vehicleLifetimeYears + fleet * a.fleetGrowthRate) * evSalesShare) / 100;
  } else {
    const prevFleet = fleetMillions(year - 1);
    const newSales = prevFleet / a.vehicleLifetimeYears + (fleet - prevFleet);
    evSales = (newSales * evSalesShare) / 100;
    evFleet = Math.min(fleet, prev.evFleetMillions * (1 - 1 / a.vehicleLifetimeYears) + evSales);
  }
  const evFleetShare = (evFleet / fleet) * 100;

  const renewableShare = renewableShareInYear(input, year);
  const oil = oilMbd(fleet, evFleetShare, n);
  const baselineOil = oilMbd(fleet, a.baseEvFleetShare, n);

  const evElectricityTwh = (evFleet * 1e6 * a.evKwhPerYear) / 1e9;
  const baseDemandTwh = a.baseElectricityTwh * Math.pow(1 + a.electricityGrowthRate, n);
  const electricityTwh = baseDemandTwh + evElectricityTwh;
  const baselineElectricityTwh = baseDemandTwh + (fleet * 1e6 * (a.baseEvFleetShare / 100) * a.evKwhPerYear) / 1e9;

  const lceKgPerKwh = a.lceKgPerKwh * Math.pow(1 - a.lithiumIntensityDecline, n);
  const evLithiumKt = (evSales * 1e6 * a.batteryKwhPerEv * lceKgPerKwh) / 1e6;
  const otherLithiumKt = a.baseOtherLithiumKt * Math.pow(1 + a.otherLithiumGrowthRate, n);
  const lithiumSupplyKt = a.baseLithiumSupplyKt * Math.pow(1 + a.lithiumSupplyGrowthRate[input.lithiumSupply], n);

  return {
    year,
    evSalesShare,
    evFleetShare,
    evFleetMillions: evFleet,
    evSalesMillions: evSales,
    renewableShare,
    oilMbd: oil,
    baselineOilMbd: baselineOil,
    evElectricityTwh,
    electricityTwh,
    oilEj: oil * a.ejPerMbd,
    electricityEj: electricityTwh * a.ejPerTwh,
    renewableElectricityEj: electricityTwh * a.ejPerTwh * (renewableShare / 100),
    gridIntensity: (1 - renewableShare / 100) * a.fossilGridIntensity * 1000,
    co2Gt: oilCo2Gt(oil) + powerCo2Gt(electricityTwh, renewableShare),
    baselineCo2Gt: oilCo2Gt(baselineOil) + powerCo2Gt(baselineElectricityTwh, a.baseRenewableShare),
    lithiumDemandKt: evLithiumKt + otherLithiumKt,
    lithiumSupplyKt,
  };
}

function energyMixFor(p: YearProjection): EnergyMixSlice[] {
  const a = ASSUMPTIONS;
  const otherFuels = a.baseOtherFuelsEj * Math.pow(1 + a.otherFuelsGrowthRate, p.year - a.baseYear);
  const slices: Omit<EnergyMixSlice, "share">[] = [
    { id: "renewable-electricity", label: "Renewable power", ej: p.renewableElectricityEj },
    { id: "fossil-electricity", label: "Fossil power", ej: p.electricityEj - p.renewableElectricityEj },
    { id: "oil", label: "Oil", ej: p.oilEj },
    { id: "other-fuels", label: "Gas & coal (direct)", ej: otherFuels },
  ];
  const total = slices.reduce((sum, s) => sum + s.ej, 0);
  return slices.map((s) => ({ ...s, share: (s.ej / total) * 100 }));
}

export function pathwayStatus(score: number): PathwayStatus {
  if (score >= 70) return "Accelerated";
  if (score >= 45) return "Progressing";
  return "Lagging";
}

export function calculateScenario(rawInput: ScenarioInput): ScenarioResult {
  const input = normalizeInput(rawInput);
  const a = ASSUMPTIONS;

  const projections: YearProjection[] = [];
  for (let year = a.baseYear; year <= a.endYear; year++) {
    const prev = projections[projections.length - 1];
    projections.push(projectYear(input, year, prev ? { evFleetMillions: prev.evFleetMillions } : null));
  }

  const at = (year: number): YearProjection => {
    const p = projections[year - a.baseYear];
    if (!p) throw new Error(`No projection for ${year}`);
    return p;
  };
  const base = at(a.baseYear);
  const target = at(input.targetYear);

  const deficits = projections.map((p) => p.lithiumDemandKt - p.lithiumSupplyKt);
  const firstDeficit = projections.find((p) => p.lithiumDemandKt > p.lithiumSupplyKt);
  const lithiumCoverage = target.lithiumSupplyKt / target.lithiumDemandKt;

  const energyMix = energyMixFor(target);
  const renewableShareOf = (mix: EnergyMixSlice[]) => mix.find((m) => m.id === "renewable-electricity")?.share ?? 0;
  const lowCarbonShareOfMix = renewableShareOf(energyMix);

  const transitionScore = Math.round(
    100 * (0.4 * (input.evAdoption / 100) + 0.4 * (input.renewableShare / 100) + 0.2 * Math.min(1, lithiumCoverage)),
  );

  const summary: ScenarioSummary = {
    year: input.targetYear,
    oilMbd: target.oilMbd,
    oilDisplacedMbd: target.baselineOilMbd - target.oilMbd,
    evFleetMillions: target.evFleetMillions,
    evFleetShare: target.evFleetShare,
    evElectricityTwh: target.evElectricityTwh,
    electricityTwh: target.electricityTwh,
    electricityGrowthPct: (target.electricityTwh / base.electricityTwh - 1) * 100,
    gridIntensity: target.gridIntensity,
    co2Gt: target.co2Gt,
    co2AvoidedGt: target.baselineCo2Gt - target.co2Gt,
    cumulativeCo2AvoidedGt: projections.reduce((sum, p) => sum + (p.baselineCo2Gt - p.co2Gt), 0),
    lithiumDemandKt: target.lithiumDemandKt,
    lithiumSupplyKt: target.lithiumSupplyKt,
    lithiumCoverage,
    firstLithiumDeficitYear: firstDeficit?.year ?? null,
    peakLithiumDeficitKt: Math.max(0, ...deficits),
    lowCarbonShareOfMix,
    lowCarbonShareChangePts: lowCarbonShareOfMix - renewableShareOf(energyMixFor(base)),
    transitionScore,
    status: pathwayStatus(transitionScore),
  };

  const regions: RegionResult[] = REGIONS.map((r) => ({
    id: r.id,
    name: r.name,
    evShare: clamp(input.evAdoption * r.multiplier, 0, 100),
  }));

  return { input, projections, summary, energyMix, regions };
}
