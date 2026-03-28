"use client";

import { useMemo } from "react";
import { useMapStore } from "@/store/useMapStore";

export default function StatusBar() {
  const { cursorCoords, entities } = useMapStore();

  const counts = useMemo(() => {
    const values = Object.values(entities);
    return {
      aircraft: values.filter((entity) => entity.type === "aircraft").length,
      satellite: values.filter((entity) => entity.type === "satellite").length,
      ship: values.filter((entity) => entity.type === "ship").length,
      signal: values.filter((entity) => entity.type === "signal").length,
    };
  }, [entities]);

  return (
    <footer className="h-8 bg-[#0F1117] border-t border-[#1E2130] flex items-center justify-between px-4 text-[11px] font-mono text-[#64748B] z-40 shrink-0">
      <div className="flex items-center gap-4">
        <span>
          ✈ <span className="text-[#22C55E]">{counts.aircraft.toLocaleString()}</span> FLIGHTS
        </span>
        <span>
          🛰 <span className="text-[#22C55E]">{counts.satellite.toLocaleString()}</span> SATELLITES
        </span>
        <span>
          ⚓ <span className="text-[#22C55E]">{counts.ship.toLocaleString()}</span> SHIPS
        </span>
        <span>
          📻 <span className="text-[#22C55E]">{counts.signal.toLocaleString()}</span> SIGNALS
        </span>
      </div>
      
      <div className="flex items-center gap-4 text-[#38BDF8]">
        {cursorCoords ? (
          <>
            <span>LAT: {cursorCoords.lat.toFixed(5)}</span>
            <span>LON: {cursorCoords.lng.toFixed(5)}</span>
          </>
        ) : (
          <span>CURSOR: OFF MAP</span>
        )}
      </div>
    </footer>
  );
}
