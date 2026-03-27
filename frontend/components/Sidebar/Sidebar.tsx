"use client";

import { Ship, Plane, Satellite, Radio } from "lucide-react";
import { useMapStore } from "@/store/useMapStore";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const { activeLayers, toggleLayer } = useMapStore();

  const layers = [
    { id: "aircraft", icon: Plane, label: "Flights" },
    { id: "ship", icon: Ship, label: "Ships" },
    { id: "satellite", icon: Satellite, label: "Satellites" },
    { id: "signal", icon: Radio, label: "Signals" },
  ];

  return (
    <aside className="w-[72px] bg-[#0F1117]/90 backdrop-blur-md border-r border-[#1E2130] flex flex-col items-center py-6 gap-6 z-30 shrink-0">
      <div className="text-[10px] font-semibold text-[#64748B] uppercase tracking-widest text-center w-full">
        Layers
      </div>
      
      <div className="flex flex-col gap-4">
        {layers.map((layer) => {
          const isActive = activeLayers.includes(layer.id);
          const Icon = layer.icon;
          
          return (
            <button
              key={layer.id}
              onClick={() => toggleLayer(layer.id)}
              title={layer.label}
              className={cn(
                "group relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200",
                isActive 
                  ? "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30" 
                  : "bg-transparent text-[#64748B] border border-transparent hover:border-[#1E2130] hover:bg-[#141824]"
              )}
            >
              <Icon size={20} className={cn("transition-transform", isActive ? "scale-100" : "scale-90 opacity-70 group-hover:opacity-100")} />
              
              {/* Optional Active Dot Indicator (Alternative to colored bg) */}
              {isActive && (
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#22C55E] rounded-full border-2 border-[#0F1117]" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-auto flex flex-col items-center gap-2 relative">
        <div className="absolute -top-10 text-[10px] font-mono text-[#38BDF8] bg-[#38BDF8]/10 px-2 py-0.5 rounded-full border border-[#38BDF8]/20">
          {activeLayers.length} LIVE
        </div>
        <div className="w-10 h-10 rounded-full bg-[#1E2130] border border-[#2A2E3D] flex items-center justify-center overflow-hidden">
          <span className="text-xs font-semibold text-[#F8FAFC]">OP</span>
        </div>
      </div>
    </aside>
  );
}
