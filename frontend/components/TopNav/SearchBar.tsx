"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plane, Radio, Satellite, Search, Ship } from "lucide-react";
import { useMapStore } from "@/store/useMapStore";
import type { Entity } from "@/types/contract";

function getEntityIcon(type: Entity["type"]) {
  if (type === "aircraft") {
    return Plane;
  }
  if (type === "ship") {
    return Ship;
  }
  if (type === "satellite") {
    return Satellite;
  }
  return Radio;
}

function searchableText(entity: Entity): string {
  return [
    entity.metadata.name,
    entity.id,
    entity.metadata.entity_type,
    entity.metadata.country,
  ]
    .join(" ")
    .toLowerCase();
}

export default function SearchBar() {
  const entities = useMapStore((state) => state.entities);
  const setSelectedEntity = useMapStore((state) => state.setSelectedEntity);
  const mapInstance = useMapStore((state) => state.mapInstance);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query.trim().toLowerCase());
    }, 300);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [query]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!wrapperRef.current) {
        return;
      }

      if (!wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const results = useMemo(() => {
    if (!debouncedQuery) {
      return [];
    }

    return Object.values(entities)
      .filter((entity) => searchableText(entity).includes(debouncedQuery))
      .slice(0, 8);
  }, [debouncedQuery, entities]);

  const handleResultClick = (entity: Entity) => {
    setSelectedEntity(entity);

    if (mapInstance) {
      mapInstance.flyTo({
        center: [entity.position.lon, entity.position.lat],
        zoom: Math.max(mapInstance.getZoom(), 6),
        duration: 900,
      });
    }

    setQuery("");
    setDebouncedQuery("");
    setIsOpen(false);
  };

  const showDropdown = isOpen && query.trim().length > 0;

  return (
    <div ref={wrapperRef} className="relative w-full max-w-[520px]">
      <div className="flex h-10 items-center gap-2 rounded-full border border-[#1E2130] bg-[#0F1117] px-3">
        <Search size={14} className="text-[#64748B]" />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setQuery("");
              setDebouncedQuery("");
              setIsOpen(false);
            }
          }}
          className="w-full bg-transparent text-sm text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none"
          placeholder="Search by ICAO, MMSI, callsign, vessel, satellite..."
          aria-label="Search entities"
        />
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-[#1E2130] bg-[#0F1117]">
          {results.length === 0 && (
            <div className="px-3 py-3 text-[12px] text-[#64748B]">No entities found</div>
          )}

          {results.map((entity) => {
            const Icon = getEntityIcon(entity.type);
            return (
              <button
                key={entity.id}
                type="button"
                onClick={() => handleResultClick(entity)}
                className="flex w-full items-center justify-between border-b border-[#1E2130] px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-[#141824]"
              >
                <div className="flex items-center gap-2">
                  <Icon size={14} className="text-[#64748B]" />
                  <div>
                    <div className="text-sm text-[#F8FAFC]">{entity.metadata.name}</div>
                    <div className="text-[11px] text-[#64748B]">{entity.id}</div>
                  </div>
                </div>
                <span className="text-sm">{entity.metadata.country_flag || "??"}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
