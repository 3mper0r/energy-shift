"use client";

import { AlertTriangle, Info } from "lucide-react";
import { useId, type ButtonHTMLAttributes, type ReactNode } from "react";

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function Card({
  id,
  className,
  children,
  as: Tag = "section",
  labelledBy,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
  as?: "section" | "div";
  labelledBy?: string;
}) {
  return (
    <Tag
      id={id}
      aria-labelledby={labelledBy}
      className={cx("rounded-[14px] border border-line bg-white/80 p-4 shadow-[0_1px_2px_rgb(20_35_51/0.03)]", className)}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({
  id,
  title,
  info,
  children,
}: {
  id: string;
  title: string;
  info?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-3 flex min-h-7 items-center justify-between gap-3">
      <h2 id={id} className="text-[13px] font-medium text-ink">
        {title}
      </h2>
      <div className="flex items-center gap-1.5">
        {children}
        {info ? <InfoTip label={`About: ${title}`} text={info} /> : null}
      </div>
    </div>
  );
}

/** Accessible tooltip: shown on hover and keyboard focus, described via aria-describedby. */
export function InfoTip({ label, text, align = "right" }: { label: string; text: string; align?: "left" | "right" }) {
  const id = useId();
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={label}
        aria-describedby={id}
        className="grid size-6 place-items-center rounded-full text-subtle transition-colors hover:bg-app hover:text-ink focus-visible:bg-app focus-visible:text-ink focus-visible:outline-2 focus-visible:outline-royal-2"
      >
        <Info className="size-3.5" aria-hidden />
      </button>
      <span
        id={id}
        role="tooltip"
        className={cx(
          "pointer-events-none invisible absolute top-7 z-30 w-60 rounded-lg bg-navy px-3 py-2 text-[11px] leading-relaxed font-normal text-white/90 opacity-0 shadow-lg transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100",
          align === "right" ? "right-0" : "left-0",
        )}
      >
        {text}
      </span>
    </span>
  );
}

type ButtonVariant = "primary" | "secondary";

export function Button({
  variant = "secondary",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      type="button"
      className={cx(
        "inline-flex h-9 items-center justify-center gap-2 rounded-[9px] px-4 text-[12.5px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-2 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary"
          ? "bg-navy text-white hover:bg-navy-hover"
          : "border border-line bg-white text-ink hover:bg-panel",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function AlertNote({ tone = "alert", children }: { tone?: "alert" | "ok"; children: ReactNode }) {
  return (
    <p
      className="mt-3 flex items-center gap-2 rounded-lg bg-app/70 px-3 py-2 text-[11.5px] text-muted"
      role="status"
      aria-live="polite"
    >
      <AlertTriangle
        className={cx("size-3.5 shrink-0", tone === "alert" ? "text-alert" : "text-ok")}
        aria-hidden
        fill="currentColor"
        stroke="white"
      />
      <span>{children}</span>
    </p>
  );
}

export function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11.5px] text-muted">
      <span className="size-2 rounded-full" style={{ background: color }} aria-hidden />
      {label}
    </span>
  );
}
