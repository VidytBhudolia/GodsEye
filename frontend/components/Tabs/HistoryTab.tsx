"use client";

import { Clock3 } from "lucide-react";
import { useMapStore } from "@/store/useMapStore";

export default function HistoryTab() {
  const setActiveTab = useMapStore((state) => state.setActiveTab);

  return (
    <section className="mx-auto mt-10 max-w-[640px] rounded-xl border border-[#1E2130] bg-[#0F1117]/95 p-8 text-center shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#1E2130] bg-[#141824] text-[#38BDF8]">
        <Clock3 size={22} />
      </div>

      <h2 className="text-xl font-semibold tracking-wide text-[#F8FAFC]">History Timeline</h2>
      <p className="mt-3 text-sm text-[#94A3B8]">
        Historical playback and route timeline exports will be available in a later phase.
      </p>

      <button
        type="button"
        onClick={() => setActiveTab("live")}
        className="mt-6 rounded-md border border-[#1E2130] bg-[#141824] px-4 py-2 text-sm font-medium text-[#F8FAFC] transition-colors hover:border-[#334155]"
      >
        Return to Live View
      </button>
    </section>
  );
}
