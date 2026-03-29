"use client";

import { useEffect, useState } from "react";
import { useMapStore } from "@/store/useMapStore";
import SearchBar from "./SearchBar";
import AlertsBadge from "@/components/Alerts/AlertsBadge";
import { useAlertsStore } from "@/store/useAlertsStore";

const NAV_TABS = [
  { id: "live", label: "LIVE VIEW" },
  { id: "history", label: "HISTORY" },
  { id: "reports", label: "REPORTS" },
  { id: "alerts", label: "ALERTS" },
] as const;

export default function TopNav() {
  const [time, setTime] = useState("");
  const entities = useMapStore((state) => state.entities);
  const activeTab = useMapStore((state) => state.activeTab);
  const setActiveTab = useMapStore((state) => state.setActiveTab);
  const setSelectedEntity = useMapStore((state) => state.setSelectedEntity);
  const setAlertsPanelOpen = useAlertsStore((state) => state.setPanelOpen);
  const closeAlertsPanel = useAlertsStore((state) => state.closePanel);
  
  const totalTracked = Object.keys(entities).length;

  const handleTabChange = (tab: "live" | "history" | "reports" | "alerts") => {
    setActiveTab(tab);

    if (tab === "alerts") {
      setAlertsPanelOpen(true);
      return;
    }

    closeAlertsPanel();

    if (tab === "history" || tab === "reports") {
      setSelectedEntity(null);
    }
  };

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toUTCString().replace(" GMT", " UTC"));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-14 bg-[#0F1117]/90 backdrop-blur-md border-b border-[#1E2130] flex items-center gap-4 px-6 z-40 shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-6 h-6 rounded bg-[#22C55E] flex items-center justify-center shadow-[0_0_12px_rgba(34,197,94,0.3)]">
          <div className="w-3 h-3 rounded-full bg-[#080A0F]" />
        </div>
        <h1 className="text-lg font-semibold tracking-wide text-[#F8FAFC]">SENTINEL</h1>

        <nav className="ml-4 flex h-full items-end gap-3">
          {NAV_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`h-full border-b-2 px-1 pb-3 pt-3 text-[10px] font-semibold tracking-wider transition-colors ${
                  isActive
                    ? "border-[#22C55E] text-[#22C55E]"
                    : "border-transparent text-[#64748B] hover:text-[#F8FAFC]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex-1 flex justify-center">
        <SearchBar />
      </div>

      {/* Metrics */}
      <div className="flex items-center gap-6 text-sm font-mono shrink-0">
        <div className="flex flex-col items-center">
          <span className="text-[#64748B] text-[10px] uppercase tracking-wider">Live Entities</span>
          <span className="text-[#38BDF8] font-semibold">{totalTracked.toLocaleString()}</span>
        </div>

        <AlertsBadge />

        {/* Clock */}
        <div className="text-sm font-mono text-[#F8FAFC] min-w-[200px] text-right">
          {time || "Loading time..."}
        </div>
      </div>
    </header>
  );
}
