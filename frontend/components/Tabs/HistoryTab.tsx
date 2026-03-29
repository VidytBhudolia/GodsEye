"use client";

import { Clock3 } from "lucide-react";
import { useMapStore } from "@/store/useMapStore";

export default function HistoryTab() {
  const setActiveTab = useMapStore((state) => state.setActiveTab);

  return (
    <section className="mx-auto mt-12 max-w-[460px] rounded-lg border border-[#1E2130] bg-[#0F1117] p-8 text-center">
      <div className="mx-auto mb-4 text-[#64748B]">
        <Clock3 size={48} className="mx-auto" />
      </div>
      <h2 className="text-[14px] font-semibold uppercase tracking-widest text-[#64748B]">
        HISTORY PLAYBACK
      </h2>
      <p className="mx-auto mt-3 max-w-[280px] text-[12px] text-[#64748B]">
        Select an entity and use the route timeline to view historical paths. Full playback coming soon.
      </p>

      <button
        type="button"
        onClick={() => setActiveTab("live")}
        className="mt-6 rounded-md bg-[#166534] px-4 py-2 text-[12px] font-semibold text-[#22C55E] transition-colors hover:bg-[#1B6E3B]"
      >
        VIEW ROUTE HISTORY -&gt;
      </button>
    </section>
  );
}
