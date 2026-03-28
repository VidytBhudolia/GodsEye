"use client";

import { useEffect, useMemo } from "react";
import { Ship, Plane, Satellite, Radio, Settings } from "lucide-react";
import { useMapStore } from "@/store/useMapStore";
import LayerToggle from "./LayerToggle";

type LayerId = "ship" | "aircraft" | "satellite" | "signal";

export default function Sidebar() {
  const activeLayers = useMapStore((state) => state.activeLayers);
  const toggleLayer = useMapStore((state) => state.toggleLayer);
  const hydrateLayers = useMapStore((state) => state.hydrateLayers);
  const entities = useMapStore((state) => state.entities);

  useEffect(() => {
    hydrateLayers();
  }, [hydrateLayers]);

  const counts = useMemo(() => {
    const values = Object.values(entities);
    return {
      aircraft: values.filter((entity) => entity.type === "aircraft").length,
      ship: values.filter((entity) => entity.type === "ship").length,
      satellite: values.filter((entity) => entity.type === "satellite").length,
      signal: values.filter((entity) => entity.type === "signal").length,
    };
  }, [entities]);

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
          const isActive = activeLayers.includes(layer.id);
          
          return (
            <LayerToggle
              key={layer.id}
              label={layer.label}
              icon={layer.icon}
              active={isActive}
              count={counts[layer.id as keyof typeof counts]}
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
