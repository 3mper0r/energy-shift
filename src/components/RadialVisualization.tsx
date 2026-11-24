"use client";

import { BatteryCharging, CloudFog, Fuel, Sun, Zap, type LucideIcon } from "lucide-react";
import type { ScenarioResult } from "@/lib/scenario";
import { fmt } from "@/lib/format";

const W = 560;
const H = 360;
const CX = W / 2;
const CY = 338;
const R_OUTER = 213;
const R_INNER = 170;
const R_RING = 127;
const R_GAUGE = 141;

/** Point on a circle around the hub, angle in degrees from 12 o'clock (negative = left). */
function polar(r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: CX + r * Math.sin(rad), y: CY - r * Math.cos(rad) };
}

function arcPath(r: number, fromDeg: number, toDeg: number) {
  const a = polar(r, fromDeg);
  const b = polar(r, toDeg);
  const large = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0;
  return `M ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y}`;
}

interface Node {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Angle of the indicator on the outer arc. */
  angle: number;
  /** Angle of its value marker on the inner arc. */
  valueAngle: number;
  value: string;
  description: string;
}

function IndicatorNode({ node }: { node: Node }) {
  const left = node.angle < 0;
  const p = polar(R_OUTER, node.angle);
  const v = polar(R_INNER, node.valueAngle);
  const Icon = node.icon;
  const labelX = left ? p.x - 9 : p.x + 9;
  return (
    <g>
      <title>{node.description}</title>
      <Icon x={labelX - (left ? 37 : -21) - 8} y={p.y - 30} width={16} height={16} color="#4a525c" strokeWidth={1.8} aria-hidden />
      <text x={labelX} y={p.y + 3.5} textAnchor={left ? "end" : "start"} fontSize={10.5} fill="#4a525c">
        {node.label}
      </text>
      <circle cx={p.x} cy={p.y} r={3.6} fill="#4a525c" />
      <circle cx={v.x} cy={v.y} r={3.4} fill="#b9c0c8" />
      <text
        x={left ? v.x - 7 : v.x + 7}
        y={v.y + 3}
        textAnchor={left ? "end" : "start"}
        fontSize={9.5}
        fill="#7d8590"
        className="tabular-nums"
      >
        {node.value}
      </text>
    </g>
  );
}

export function RadialVisualization({ result }: { result: ScenarioResult }) {
  const { input, summary: s } = result;
  const gaugeFrom = -100;
  const gaugeTo = gaugeFrom + (200 * input.evAdoption) / 100;
  const gaugeEnd = polar(R_GAUGE, gaugeTo);

  const nodes: Node[] = [
    {
      id: "oil",
      label: "Oil demand",
      icon: Fuel,
      angle: -48,
      valueAngle: -21,
      value: `${s.oilDisplacedMbd >= 0 ? "−" : "+"}${fmt.dec(Math.abs(s.oilDisplacedMbd))} mb/d`,
      description: `Oil: ${fmt.mbd(s.oilMbd)} in ${s.year}, ${fmt.mbd(s.oilDisplacedMbd)} displaced versus baseline`,
    },
    {
      id: "lithium",
      label: "Lithium",
      icon: BatteryCharging,
      angle: 48,
      valueAngle: 21,
      value: `${fmt.kt(s.lithiumDemandKt)} LCE`,
      description: `Lithium: ${fmt.kt(s.lithiumDemandKt)} LCE demand, ${fmt.pct(s.lithiumCoverage * 100)} covered by supply`,
    },
    {
      id: "emissions",
      label: "Emissions",
      icon: CloudFog,
      angle: -80,
      valueAngle: -60,
      value: `${fmt.dec(s.co2Gt)} Gt CO₂`,
      description: `Emissions: ${fmt.gt(s.co2Gt)} CO₂ from oil and power in ${s.year}`,
    },
    {
      id: "renewables",
      label: "Renewables",
      icon: Sun,
      angle: 80,
      valueAngle: 60,
      value: `${input.renewableShare}% of power`,
      description: `Renewables: ${input.renewableShare}% of electricity generation by ${s.year}`,
    },
  ];

  const top = polar(R_OUTER, 0);
  const ringTop = CY - R_RING;
  const summaryLabel = `EV adoption ${input.evAdoption}% of new sales by ${s.year}. Electricity demand ${fmt.signedPct(s.electricityGrowthPct)} versus 2025. ${nodes.map((n) => n.description).join(". ")}.`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMax meet"
      className="h-full w-full"
      role="img"
      aria-label={summaryLabel}
    >
      <defs>
        <filter id="es-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="es-glow-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
        <radialGradient id="es-ring-fill" cx="50%" cy="50%" r="50%">
          <stop offset="72%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#8fd3fb" stopOpacity="0.32" />
        </radialGradient>
      </defs>

      {/* Concentric guide arcs */}
      <circle cx={CX} cy={CY} r={R_OUTER} fill="none" stroke="#d6dade" strokeWidth={1} />
      <circle cx={CX} cy={CY} r={R_INNER} fill="none" stroke="#e1e4e8" strokeWidth={1} />

      {/* Adoption gauge just outside the ring */}
      <path d={arcPath(R_GAUGE, -100, 100)} fill="none" stroke="#dfe3e8" strokeWidth={2} strokeLinecap="round" />
      {input.evAdoption > 0 ? (
        <path
          d={arcPath(R_GAUGE, gaugeFrom, gaugeTo)}
          fill="none"
          stroke="#4b8fe6"
          strokeWidth={2}
          strokeLinecap="round"
          style={{ transition: "d 300ms ease" }}
        />
      ) : null}
      <circle cx={gaugeEnd.x} cy={gaugeEnd.y} r={4} fill="#fff" stroke="#4b8fe6" strokeWidth={2} />

      {/* Glowing ring */}
      <circle cx={CX} cy={CY} r={R_RING} fill="url(#es-ring-fill)" />
      <circle cx={CX} cy={CY} r={R_RING} fill="none" stroke="#6cc4f6" strokeWidth={16} opacity={0.45} filter="url(#es-glow)" />
      <circle cx={CX} cy={CY} r={R_RING} fill="none" stroke="#9edcfb" strokeWidth={6} filter="url(#es-glow-soft)" />
      <circle cx={CX} cy={CY} r={R_RING} fill="none" stroke="#d8f2ff" strokeWidth={2.6} />
      <circle cx={CX} cy={CY} r={R_RING} fill="none" stroke="#ffffff" strokeWidth={1} />

      {/* Energy connector from electricity hub into the ring */}
      <g className="es-flicker">
        <path
          d={`M ${CX} ${top.y} L ${CX + 3} ${top.y + 14} L ${CX - 3} ${top.y + 27} L ${CX + 4} ${top.y + 40} L ${CX - 4} ${top.y + 54} L ${CX + 2} ${top.y + 66} L ${CX - 2} ${top.y + 76} L ${CX} ${ringTop}`}
          fill="none"
          stroke="#7fd0fa"
          strokeWidth={5}
          filter="url(#es-glow-soft)"
        />
        <path
          d={`M ${CX} ${top.y} L ${CX + 3} ${top.y + 14} L ${CX - 3} ${top.y + 27} L ${CX + 4} ${top.y + 40} L ${CX - 4} ${top.y + 54} L ${CX + 2} ${top.y + 66} L ${CX - 2} ${top.y + 76} L ${CX} ${ringTop}`}
          fill="none"
          stroke="#ffffff"
          strokeWidth={1.2}
          className="es-flow"
        />
        <circle cx={CX} cy={ringTop} r={7} fill="#bfe9ff" filter="url(#es-glow-soft)" />
        <circle cx={CX} cy={ringTop} r={2.5} fill="#ffffff" />
      </g>

      {/* Electricity hub */}
      <g>
        <title>{`Electricity: ${fmt.twh(s.electricityTwh)} in ${s.year} (${fmt.signedPct(s.electricityGrowthPct)} vs 2025), of which EVs ${fmt.twh(s.evElectricityTwh)}`}</title>
        <Zap x={CX - 12} y={top.y - 62} width={24} height={24} color="#4b8fe6" fill="#4b8fe6" strokeWidth={1.4} aria-hidden />
        <text x={CX} y={top.y - 22} textAnchor="middle" fontSize={12} fill="#4b8fe6" fontWeight={500}>
          Electricity
        </text>
        <text x={CX} y={top.y - 9} textAnchor="middle" fontSize={9.5} fill="#7d8590" className="tabular-nums">
          {fmt.signedPct(s.electricityGrowthPct)} demand vs 2025
        </text>
        <circle cx={top.x} cy={top.y} r={6} fill="#4b8fe6" stroke="#ffffff" strokeWidth={2} />
      </g>

      {nodes.map((n) => (
        <IndicatorNode key={n.id} node={n} />
      ))}

      {/* Centre readout */}
      <text x={CX} y={CY - 26} textAnchor="middle" fontSize={56} fontWeight={500} fill="#15191f" letterSpacing={-1.5} className="tabular-nums">
        {input.evAdoption}%
      </text>
      <text x={CX} y={CY - 4} textAnchor="middle" fontSize={11.5} fill="#5f6772">
        EV share of new sales · {s.year}
      </text>
    </svg>
  );
}
