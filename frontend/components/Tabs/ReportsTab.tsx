"use client";

import {
  Plane,
  Ship,
  Satellite,
  BellRing,
  Globe,
  TriangleAlert,
} from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useAlertsStore } from "../../store/useAlertsStore";
import { useMapStore } from "../../store/useMapStore";

export default function ReportsTab() {
  const counts = useMapStore(useShallow((state) => state.selectCounts()));
  const { alerts, unreadAlerts } = useAlertsStore(
    useShallow((state) => ({
      alerts: state.alerts,
      unreadAlerts: state.unreadCount,
    }))
  );

  const severityCounts = alerts.reduce(
    (acc: Record<"critical" | "high" | "medium" | "low", number>, alert) => {
      acc[alert.severity] += 1;
      return acc;
    },
    { critical: 0, high: 0, medium: 0, low: 0 }
  );

  const cards = [
    {
      label: "Total Aircraft",
      value: counts.aircraft.toLocaleString(),
      icon: Plane,
      detail: null,
    },
    {
      label: "Total Ships",
      value: counts.ships.toLocaleString(),
      icon: Ship,
      detail: null,
    },
    {
      label: "Total Satellites",
      value: counts.satellites.toLocaleString(),
      icon: Satellite,
      detail: null,
    },
    {
      label: "Active Alerts",
      value: unreadAlerts.toLocaleString(),
      icon: BellRing,
      detail: null,
    },
    {
      label: "Most Active Region",
      value: "--",
      icon: Globe,
      detail: "Coming soon",
    },
    {
      label: "Anomalies Detected",
      value: alerts.length.toLocaleString(),
      icon: TriangleAlert,
      detail: `C:${severityCounts.critical} H:${severityCounts.high} M:${severityCounts.medium} L:${severityCounts.low}`,
    },
  ];

  return (
    <section className="mx-auto mt-8 w-full max-w-[860px] rounded-lg border border-[#1E2130] bg-[#0F1117]/95 p-6">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <article key={card.label} className="rounded-lg border border-[#1E2130] bg-[#0F1117] p-5">
            <div className="mb-2 flex items-center gap-2 text-[#64748B]">
              <card.icon size={14} />
              <p className="text-[11px] uppercase tracking-widest">{card.label}</p>
            </div>
            <p className="font-mono text-[32px] leading-none text-[#22C55E]">{card.value}</p>
            {card.detail && <p className="mt-2 text-[11px] text-[#64748B]">{card.detail}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
