"use client";

import { useMapStore } from "@/store/useMapStore";

export default function StatusBar() {
  const { cursorCoords, entities } = useMapStore();
  const activeCount = Object.keys(entities).length;

  return (
    <footer className="h-8 bg-[#0F1117] border-t border-[#1E2130] flex items-center justify-between px-4 text-[11px] font-mono text-[#64748B] z-40 shrink-0">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
          <span>SOCKET: CONNECTED</span>
        </div>
        <div>
          ENTITIES: <span className="text-[#F8FAFC]">{activeCount}</span>
        </div>
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
