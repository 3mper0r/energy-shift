# EnergyShift — Energy Transition Intelligence

A single-page scenario explorer for the global energy transition. Move four levers and every metric, chart and recommendation recalculates instantly:

| Control | Range |
| --- | --- |
| EV adoption (share of new passenger car sales) | 0–100% |
| Target year (when targets are reached) | 2030–2050 |
| Lithium supply expansion | slow / moderate / rapid |
| Renewable electricity share | 20–100% |

The dashboard shows oil, electricity, lithium and emissions around a radial overview, energy demand projections to 2050, regional EV adoption, the energy mix in the target year, the lithium demand–supply balance and rule-based strategic insights. **Export Scenario** downloads the inputs, headline results, insights and the full yearly projection as CSV.

## Setup

Requires Node.js 24 and npm.

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # scenario model tests (Vitest)
npm run typecheck
npm run lint
npm run build && npm start
```

Stack: Next.js 16 (App Router), React 19, strict TypeScript, Tailwind CSS 4, Recharts, Lucide icons. No backend, database or external API.

## How it works

- `src/lib/scenario.ts`: the typed, pure, deterministic model. `calculateScenario(input)` returns yearly projections for 2025–2050, a target-year summary, the energy mix and the regional figures. Every coefficient lives in `ASSUMPTIONS`.
- `src/lib/insights.ts`: deterministic rules that turn a result into at most three ranked insights (risks first). Some carry a one-click adjustment (`patch`) that the UI can apply.
- `src/lib/csv.ts`: CSV export.
- `src/components/`: one component per dashboard card. `Dashboard.tsx` owns the scenario state.
- `tests/scenario.test.ts`: tests for the model, insights and CSV.

## Assumptions (illustrative, not a forecast)

The coefficients are round numbers chosen to be in a plausible order of magnitude. They are **not calibrated** to any dataset, and the app says so on screen.

- **Adoption:** the EV share of sales follows an S-curve from 20% (2025) to the target. The renewable share moves linearly from 32%. Both stay flat after the target year.
- **Fleet:** 1.5bn cars growing 1.2% a year. 1/18 of the fleet is replaced each year, so the EV fleet share lags the sales share.
- **Oil:** 0.0165 bbl/day per combustion car, plus 79 mb/d of other uses declining slowly.
- **Electricity:** 30,000 TWh of non-EV demand growing 2.2% a year, plus 2,300 kWh per EV.
- **Emissions:** 0.7 t CO₂/MWh for non-renewable power and 0.43 t CO₂ per barrel of oil. Savings are measured against a frozen-2025 baseline.
- **Lithium:** 65 kWh per EV × 0.7 kg LCE/kWh, with intensity falling 1.5% a year, plus other uses. Supply starts at 1,300 kt LCE and grows 5%, 9% or 14% a year.
- **Regions:** fixed multipliers on the global EV sales share, capped at 100%.
- **Simplifications:** gas and coal used outside power generation form one fixed, slowly declining block. The model does not cover nuclear, prices, policy or feedback effects.
