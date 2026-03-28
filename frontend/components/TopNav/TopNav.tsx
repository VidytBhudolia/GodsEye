"use client";

import { useEffect, useState } from "react";
import { useMapStore } from "@/store/useMapStore";
import SearchBar from "./SearchBar";
import AlertsBadge from "@/components/Alerts/AlertsBadge";

export default function TopNav() {
  const [time, setTime] = useState("");
  const entities = useMapStore((state) => state.entities);
  
  const totalTracked = Object.keys(entities).length;

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
