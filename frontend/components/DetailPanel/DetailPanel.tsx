"use client";

import { useMapStore } from "@/store/useMapStore";
import { formatDistanceToNow } from "date-fns";
import { X } from "lucide-react";

export default function DetailPanel() {
  const { selectedEntity, setSelectedEntity } = useMapStore();

  return (
    <aside className="w-[340px] bg-[#0F1117]/90 backdrop-blur-md border-l border-[#1E2130] shrink-0 relative overflow-hidden z-30">
      {/* Empty State / Placeholder */}
      <div className="absolute inset-0 flex items-center justify-center text-[#64748B] text-sm font-medium z-0">
        Click an entity to inspect
      </div>

      {/* Slide-in Content */}
      <div
        className={`absolute inset-0 bg-[#0F1117] z-10 transition-transform duration-300 ease-out flex flex-col ${
          selectedEntity ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedEntity && (
          <>
            <div className="flex items-center justify-between p-4 border-b border-[#1E2130]">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedEntity.metadata.country_flag}</span>
                <div>
                  <h2 className="text-lg font-semibold text-[#F8FAFC]">
                    {selectedEntity.metadata.name}
                  </h2>
                  <p className="text-xs text-[#64748B] uppercase tracking-wider">
                    {selectedEntity.metadata.entity_type}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEntity(null)}
                className="p-1 rounded bg-[#141824] hover:bg-[#1E2130] text-[#64748B] hover:text-[#F8FAFC] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Telemetry Section */}
              <section>
                <h3 className="text-[10px] font-semibold text-[#64748B] uppercase tracking-widest mb-3">
                  Live Telemetry
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#141824] p-3 rounded-lg border border-[#1E2130]">
                    <div className="text-[10px] text-[#64748B] uppercase mb-1">Speed</div>
                    <div className="font-mono text-sm text-[#F8FAFC]">
                      {selectedEntity.metadata.speed_knots.toFixed(1)} kts
                    </div>
                  </div>
                  <div className="bg-[#141824] p-3 rounded-lg border border-[#1E2130]">
                    <div className="text-[10px] text-[#64748B] uppercase mb-1">Heading</div>
                    <div className="font-mono text-sm text-[#F8FAFC]">
                      {selectedEntity.metadata.heading_deg.toFixed(1)}°
                    </div>
                  </div>
                  <div className="bg-[#141824] p-3 rounded-lg border border-[#1E2130]">
                    <div className="text-[10px] text-[#64748B] uppercase mb-1">Latitude</div>
                    <div className="font-mono text-sm text-[#F8FAFC]">
                      {selectedEntity.position.lat.toFixed(4)}
                    </div>
                  </div>
                  <div className="bg-[#141824] p-3 rounded-lg border border-[#1E2130]">
                    <div className="text-[10px] text-[#64748B] uppercase mb-1">Longitude</div>
                    <div className="font-mono text-sm text-[#F8FAFC]">
                      {selectedEntity.position.lon.toFixed(4)}
                    </div>
                  </div>
                  {selectedEntity.position.alt_m !== undefined && (
                    <div className="bg-[#141824] p-3 rounded-lg border border-[#1E2130] col-span-2">
                      <div className="text-[10px] text-[#64748B] uppercase mb-1">Altitude</div>
                      <div className="font-mono text-sm text-[#F8FAFC]">
                        {selectedEntity.position.alt_m.toFixed(0)} meters
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Status Section */}
              <section>
                <h3 className="text-[10px] font-semibold text-[#64748B] uppercase tracking-widest mb-3">
                  System Status
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Last Seen</span>
                    <span className="font-mono text-[#38BDF8]">
                      {formatDistanceToNow(new Date(selectedEntity.cached_at), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Status</span>
                    <span className="font-mono text-[#22C55E] uppercase">
                      {selectedEntity.metadata.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Source System</span>
                    <span className="font-mono text-[#F8FAFC] uppercase">
                      {selectedEntity.type === 'ship' ? 'AIS' : 'ADSB / TLE'}
                    </span>
                  </div>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
