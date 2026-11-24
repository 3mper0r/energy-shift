"use client";

import { RotateCcw } from "lucide-react";
import { useId } from "react";
import { INPUT_LIMITS, LITHIUM_SUPPLY_OPTIONS, type LithiumSupply, type ScenarioInput } from "@/lib/scenario";
import { LITHIUM_LABEL } from "@/lib/format";
import { cx, InfoTip } from "./ui";

function RangeField({
  label,
  value,
  min,
  max,
  step,
  display,
  hint,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  hint: string;
  onChange: (value: number) => void;
}) {
  const id = useId();
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <label htmlFor={id} className="text-[11.5px] text-muted">
          {label}
        </label>
        <output htmlFor={id} className="text-[13px] font-semibold tabular-nums text-ink">
          {display}
        </output>
      </div>
      <input
        id={id}
        type="range"
        className="es-range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={display}
        aria-describedby={`${id}-hint`}
        style={{ "--fill": `${fill}%` } as React.CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div id={`${id}-hint`} className="mt-0.5 flex justify-between text-[10.5px] text-subtle">
        <span>{hint}</span>
      </div>
    </div>
  );
}

function SupplyToggle({ value, onChange }: { value: LithiumSupply; onChange: (v: LithiumSupply) => void }) {
  const name = useId();
  return (
    <fieldset>
      <legend className="mb-1.5 flex items-center gap-1 text-[11.5px] text-muted">
        Lithium supply expansion
        <InfoTip
          align="left"
          label="About lithium supply expansion"
          text="Annual growth of lithium mining and refining capacity from 1,300 kt LCE in 2025: slow 5%, moderate 9%, rapid 14% per year."
        />
      </legend>
      <div className="grid grid-cols-3 gap-1 rounded-[10px] bg-app p-1">
        {LITHIUM_SUPPLY_OPTIONS.map((option) => (
          <label
            key={option}
            className={cx(
              "cursor-pointer rounded-[7px] py-1.5 text-center text-[12px] transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-royal-2",
              value === option ? "bg-navy font-medium text-white shadow-sm" : "text-muted hover:text-ink",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              className="sr-only"
            />
            {LITHIUM_LABEL[option]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function ScenarioControls({
  input,
  onChange,
  onReset,
  isDefault,
}: {
  input: ScenarioInput;
  onChange: (patch: Partial<ScenarioInput>) => void;
  onReset: () => void;
  isDefault: boolean;
}) {
  return (
    <div className="rounded-[14px] border border-line bg-white p-4 shadow-[0_1px_2px_rgb(20_35_51/0.04)]">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="controls-title" className="text-[13px] font-medium">
          Scenario controls
        </h2>
        <button
          type="button"
          onClick={onReset}
          disabled={isDefault}
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-royal-2 disabled:cursor-default disabled:opacity-40"
        >
          <RotateCcw className="size-3" aria-hidden />
          Reset
        </button>
      </div>
      <div className="flex flex-col gap-3.5" role="group" aria-labelledby="controls-title">
        <RangeField
          label="EV adoption (share of new sales)"
          value={input.evAdoption}
          {...INPUT_LIMITS.evAdoption}
          display={`${input.evAdoption}%`}
          hint="2025 baseline: 20% of sales"
          onChange={(v) => onChange({ evAdoption: v })}
        />
        <RangeField
          label="Target year"
          value={input.targetYear}
          {...INPUT_LIMITS.targetYear}
          display={String(input.targetYear)}
          hint="Targets reached in this year, then held"
          onChange={(v) => onChange({ targetYear: v })}
        />
        <RangeField
          label="Renewable electricity share"
          value={input.renewableShare}
          {...INPUT_LIMITS.renewableShare}
          display={`${input.renewableShare}%`}
          hint="2025 baseline: 32% of generation"
          onChange={(v) => onChange({ renewableShare: v })}
        />
        <SupplyToggle value={input.lithiumSupply} onChange={(v) => onChange({ lithiumSupply: v })} />
      </div>
    </div>
  );
}
