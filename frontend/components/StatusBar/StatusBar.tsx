"use client";

import { useEffect, useState } from "react";
import { shallow } from "zustand/shallow";
import { useMapStore } from "@/store/useMapStore";

export default function StatusBar() {
  const counts = useMapStore((state) => state.selectCounts(), shallow);
  const cursorCoords = useMapStore((state) => state.cursorCoords);
  const socketConnected = useMapStore((state) => state.socketConnected);
  const [utcTime, setUtcTime] = useState("");

  useEffect(() => {
    const updateClock = () => {
      setUtcTime(new Date().toUTCString().replace(" GMT", " UTC"));
    };

    updateClock();
    const interval = window.setInterval(updateClock, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  return (
    <footer className="h-8 bg-[#0F1117] border-t border-[#1E2130] flex items-center justify-between px-4 text-[11px] font-mono text-[#64748B] z-40 shrink-0">
      <div className="flex items-center gap-4">
        <span>
          ✈ <span className="text-[#22C55E]">{counts.aircraft.toLocaleString()}</span> FLIGHTS
        </span>
        <span>
          🛰 <span className="text-[#22C55E]">{counts.satellites.toLocaleString()}</span> SATELLITES
        </span>
        <span>
          ⚓ <span className="text-[#22C55E]">{counts.ships.toLocaleString()}</span> SHIPS
        </span>
        <span>
          📻 <span className="text-[#22C55E]">{counts.signals.toLocaleString()}</span> SIGNALS
        </span>
      </div>
      
      <div className="flex items-center gap-4">
        {cursorCoords ? (
          <>
            <span className="text-[#38BDF8]">LAT: {cursorCoords.lat.toFixed(5)}</span>
            <span className="text-[#38BDF8]">LON: {cursorCoords.lng.toFixed(5)}</span>
          </>
        ) : (
          <span className="text-[#38BDF8]">CURSOR: OFF MAP</span>
        )}

        {socketConnected ? (
          <span className="text-[#F8FAFC]">{utcTime || "Loading UTC..."}</span>
        ) : (
          <span className="flex items-center gap-1.5 text-[#EF4444]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#EF4444]" />
            Reconnecting...
          </span>
        )}
      </div>
    </footer>
  );
}
