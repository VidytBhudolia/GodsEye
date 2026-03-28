"use client";

import { useEffect } from "react";
import { Ship, Plane, Satellite, Radio, Settings } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useMapStore } from "@/store/useMapStore";
import LayerToggle from "./LayerToggle";

type LayerId = "ship" | "aircraft" | "satellite" | "signal";

export default function Sidebar() {
  const { layerVisibility, toggleLayer, hydrateLayers } = useMapStore(
    useShallow((state) => ({
      layerVisibility: state.layerVisibility,
      toggleLayer: state.toggleLayer,
      hydrateLayers: state.hydrateLayers,
    }))
  );
  const counts = useMapStore(useShallow((state) => state.selectCounts()));

  useEffect(() => {
    hydrateLayers();
  }, [hydrateLayers]);

  const layers: Array<{ id: LayerId; icon: typeof Plane; label: string }> = [
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
          const isActive = layerVisibility[layer.id];
          const layerCount =
            layer.id === "aircraft"
              ? counts.aircraft
              : layer.id === "ship"
              ? counts.ships
              : layer.id === "satellite"
              ? counts.satellites
              : counts.signals;
          
          return (
            <LayerToggle
              key={layer.id}
              label={layer.label}
              icon={layer.icon}
              active={isActive}
              count={layerCount}
              onClick={() => toggleLayer(layer.id)}
            />
          );
        })}
      </div>

      <div className="mt-auto flex flex-col items-center gap-4">
        <LayerToggle
          label="Settings"
          icon={Settings}
          active={false}
          onClick={() => {
            // Settings panel is out of scope for this phase.
          }}
        />

        <div className="w-8 h-8 rounded-full bg-[#141824] border border-[#1E2130]" />
      </div>
    </aside>
  );
}
