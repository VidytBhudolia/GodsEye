"use client";

import { useEffect, useState } from "react";
import {
  Ship,
  Plane,
  Satellite,
  Radio,
  Settings,
  SlidersHorizontal,
} from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useMapStore } from "@/store/useMapStore";
import LayerToggle from "./LayerToggle";
import FilterPanel from "./FilterPanel";

type LayerId = "ship" | "aircraft" | "satellite" | "signal";

export default function Sidebar() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { layerVisibility, toggleLayer, hydrateLayers } = useMapStore(
    useShallow((state) => ({
      layerVisibility: state.layerVisibility,
      toggleLayer: state.toggleLayer,
      hydrateLayers: state.hydrateLayers,
    }))
  );
  const counts = useMapStore(useShallow((state) => state.selectCounts()));
  const hasActiveFilters = useMapStore((state) => state.hasActiveFilters());

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
        <div className="relative">
          <LayerToggle
            label="Filters"
            icon={SlidersHorizontal}
            active={isFilterOpen}
            onClick={() => setIsFilterOpen((open) => !open)}
          />
          {hasActiveFilters && (
            <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full border border-[#0F1117] bg-[#22C55E]" />
          )}
        </div>

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

      <FilterPanel open={isFilterOpen} onClose={() => setIsFilterOpen(false)} />
    </aside>
  );
}
