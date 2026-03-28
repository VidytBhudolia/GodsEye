"use client";

import type { LucideIcon } from "lucide-react";

interface LayerToggleProps {
  label: string;
  icon: LucideIcon;
  active: boolean;
  count?: number;
  onClick: () => void;
}

function formatCompactCount(value: number): string {
  if (value >= 1000) {
    const compact = value / 1000;
    return `${compact >= 10 ? compact.toFixed(0) : compact.toFixed(1)}k`;
  }
  return `${value}`;
}

export default function LayerToggle({ label, icon: Icon, active, count, onClick }: LayerToggleProps) {
  return (
    <div className="group relative flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={onClick}
        className={`h-10 w-10 rounded-full border transition-colors ${
          active
            ? "border-[#22C55E] bg-[#166534] text-[#22C55E]"
            : "border-[#1E2130] bg-[#1E2130] text-[#64748B] hover:border-[#334155]"
        }`}
      >
        <span className="flex h-full w-full items-center justify-center">
          <Icon size={16} />
        </span>
      </button>

      <div className="pointer-events-none absolute bottom-full mb-1.5 whitespace-nowrap rounded-lg border border-[#1E2130] bg-[#0F1117] px-2 py-1 text-[10px] text-[#F8FAFC] opacity-0 transition-opacity group-hover:opacity-100">
        {label}
      </div>

      {active && typeof count === "number" && (
        <span className="font-mono text-[9px] text-[#22C55E]">{formatCompactCount(count)}</span>
      )}
    </div>
  );
}
