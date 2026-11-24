"use client";

import { BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { cx } from "./ui";

export const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "demand", label: "Demand" },
  { id: "materials", label: "Materials" },
  { id: "insights", label: "Insights" },
  { id: "methodology", label: "Methodology" },
] as const;

function Logo() {
  return (
    <a href="#overview" className="flex items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-royal-2">
      <svg width="40" height="24" viewBox="0 0 40 24" aria-hidden>
        <rect x="1" y="14" width="7" height="9" rx="1.5" fill="#a9cff5" />
        <rect x="10" y="9" width="7" height="14" rx="1.5" fill="#7cb3ee" />
        <rect x="19" y="4" width="7" height="19" rx="1.5" fill="#4b8fe6" />
        <path d="M30 23 L34 12 L31.5 12 L35 1 L39 1 L36 9 L39 9 L32 23 Z" fill="#2a6fd6" />
      </svg>
      <span className="text-[17px] font-semibold tracking-[-0.01em] text-royal-2">EnergyShift</span>
    </a>
  );
}

export function TopNav() {
  const [active, setActive] = useState<string>("overview");

  useEffect(() => {
    const targets = SECTIONS.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-72px 0px -55% 0px" },
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-6 px-6">
        <Logo />
        <nav aria-label="Dashboard sections" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  onClick={() => setActive(s.id)}
                  aria-current={active === s.id ? "location" : undefined}
                  className={cx(
                    "rounded-[9px] px-3.5 py-2 text-[12.5px] transition-colors focus-visible:outline-2 focus-visible:outline-royal-2",
                    active === s.id ? "bg-navy font-medium text-white" : "text-muted hover:text-ink",
                  )}
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <a
            href="#methodology"
            aria-label="Read the model methodology"
            className="grid size-9 place-items-center rounded-[10px] border border-line bg-white text-ink transition-colors hover:bg-panel focus-visible:outline-2 focus-visible:outline-royal-2"
          >
            <BookOpen className="size-4" aria-hidden />
          </a>
          <span className="hidden h-9 items-center rounded-[10px] bg-panel px-3 text-[11.5px] text-muted lg:inline-flex">
            Model v1.0 · Illustrative
          </span>
        </div>
      </div>
    </header>
  );
}
