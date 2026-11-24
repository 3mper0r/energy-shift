const number = (value: number, digits = 0) =>
  value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const fmt = {
  int: (v: number) => number(v),
  dec: (v: number, digits = 1) => number(v, digits),
  pct: (v: number, digits = 0) => `${number(v, digits)}%`,
  signedPct: (v: number) => `${v >= 0 ? "+" : "−"}${number(Math.abs(v))}%`,
  mbd: (v: number) => `${number(v, 1)} mb/d`,
  twh: (v: number) => `${number(v)} TWh`,
  kt: (v: number) => (v >= 1000 ? `${number(v / 1000, 1)} Mt` : `${number(v)} kt`),
  gt: (v: number) => `${number(v, 1)} Gt`,
  ej: (v: number) => `${number(v)} EJ`,
};

export const LITHIUM_LABEL = { slow: "Slow", moderate: "Moderate", rapid: "Rapid" } as const;
