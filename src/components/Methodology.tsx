import { ASSUMPTIONS as A } from "@/lib/scenario";
import { Card } from "./ui";

/** Annual rate as a percentage without floating-point noise (0.022 → "2.2"). */
const rate = (r: number) => String(Number((r * 100).toFixed(2)));

const ITEMS: { label: string; value: string }[] = [
  { label: "Base year", value: `${A.baseYear}: EVs ${A.baseEvSalesShare}% of sales, ${A.baseEvFleetShare}% of fleet; renewables ${A.baseRenewableShare}% of power` },
  { label: "Vehicle fleet", value: `${A.baseFleetMillions.toLocaleString("en-US")}M cars, +${rate(A.fleetGrowthRate)}%/yr, ${A.vehicleLifetimeYears}-year lifetime` },
  { label: "Oil", value: `${A.oilPerIceVehicleBpd} bbl/day per combustion car; ${A.baseOtherOilMbd} mb/d other uses, ${rate(A.otherOilGrowthRate)}%/yr` },
  { label: "Electricity", value: `${A.baseElectricityTwh.toLocaleString("en-US")} TWh non-EV demand, +${rate(A.electricityGrowthRate)}%/yr; ${A.evKwhPerYear.toLocaleString("en-US")} kWh per EV/yr` },
  { label: "Emissions", value: `${A.fossilGridIntensity} t CO₂/MWh non-renewable power; ${A.oilCo2PerBarrel} t CO₂ per barrel` },
  { label: "Lithium demand", value: `${A.batteryKwhPerEv} kWh/EV × ${A.lceKgPerKwh} kg LCE/kWh (−${rate(A.lithiumIntensityDecline)}%/yr) + ${A.baseOtherLithiumKt} kt other, +${rate(A.otherLithiumGrowthRate)}%/yr` },
  { label: "Lithium supply", value: `${A.baseLithiumSupplyKt.toLocaleString("en-US")} kt LCE, growing ${rate(A.lithiumSupplyGrowthRate.slow)}% / ${rate(A.lithiumSupplyGrowthRate.moderate)}% / ${rate(A.lithiumSupplyGrowthRate.rapid)}% per year` },
  { label: "Baseline", value: "CO₂ and oil savings are measured against a frozen-2025 world (EV fleet share and renewable share unchanged)" },
];

export function Methodology() {
  return (
    <Card id="methodology" labelledBy="methodology-title" className="mt-4">
      <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between">
        <h2 id="methodology-title" className="text-[13px] font-medium">
          Methodology & assumptions
        </h2>
        <p className="text-[11px] font-medium text-alert">Illustrative model — not a validated forecast</p>
      </div>
      <p className="mt-2 max-w-4xl text-[11.5px] leading-relaxed text-muted">
        EnergyShift is a transparent, deterministic stock-flow model for exploring trade-offs, not for predicting outcomes. EV
        sales share follows an S-curve from today to the target in the target year; renewable share moves linearly. Both are
        held flat afterwards. Each year 1/{A.vehicleLifetimeYears} of the fleet is replaced, so the EV fleet lags sales. Round
        coefficients below are chosen for plausible orders of magnitude and are not calibrated to any dataset. Insights are
        rule-based. Gas and coal used outside the power sector are simplified into one fixed declining block; nuclear is
        not modelled separately.
      </p>
      <dl className="mt-3 grid gap-x-6 gap-y-2 text-[11.5px] sm:grid-cols-2 xl:grid-cols-4">
        {ITEMS.map((item) => (
          <div key={item.label} className="rounded-lg bg-panel px-3 py-2">
            <dt className="font-medium text-ink">{item.label}</dt>
            <dd className="mt-0.5 leading-snug text-muted">{item.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
