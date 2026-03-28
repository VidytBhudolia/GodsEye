"use client";

import { useShallow } from "zustand/react/shallow";
import { useAlertsStore } from "@/store/useAlertsStore";
import { useMapStore } from "@/store/useMapStore";

export default function ReportsTab() {
  const counts = useMapStore(useShallow((state) => state.selectCounts()));
  const socketConnected = useMapStore((state) => state.socketConnected);
  const hasActiveFilters = useMapStore((state) => state.hasActiveFilters());
  const selectedEntity = useMapStore((state) => state.selectedEntity);

  const { totalAlerts, unreadAlerts } = useAlertsStore(
    useShallow((state) => ({
      totalAlerts: state.alerts.length,
      unreadAlerts: state.unreadCount,
    }))
  );

  const totalEntities =
    counts.aircraft + counts.ships + counts.satellites + counts.signals;

  const cards = [
    { label: "Total Entities", value: totalEntities.toLocaleString(), tone: "text-[#38BDF8]" },
    { label: "Open Alerts", value: unreadAlerts.toLocaleString(), tone: "text-[#F97316]" },
    { label: "Alert Archive", value: totalAlerts.toLocaleString(), tone: "text-[#F8FAFC]" },
    { label: "Realtime Feed", value: socketConnected ? "Connected" : "Degraded", tone: socketConnected ? "text-[#22C55E]" : "text-[#EF4444]" },
    { label: "Filters", value: hasActiveFilters ? "Active" : "None", tone: hasActiveFilters ? "text-[#22C55E]" : "text-[#64748B]" },
    { label: "Focused Entity", value: selectedEntity?.metadata.name ?? "None", tone: "text-[#F8FAFC]" },
  ];

  return (
    <section className="mx-auto mt-8 w-full max-w-[780px] rounded-xl border border-[#1E2130] bg-[#0F1117]/95 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
      <h2 className="text-lg font-semibold tracking-wide text-[#F8FAFC]">Operational Snapshot</h2>
      <p className="mt-1 text-sm text-[#94A3B8]">
        Reporting widgets are scaffolded and ready for backend-backed analytics in a follow-up phase.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <article key={card.label} className="rounded-lg border border-[#1E2130] bg-[#141824] p-4">
            <p className="text-[10px] uppercase tracking-widest text-[#64748B]">{card.label}</p>
            <p className={`mt-2 truncate text-xl font-semibold ${card.tone}`}>{card.value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
