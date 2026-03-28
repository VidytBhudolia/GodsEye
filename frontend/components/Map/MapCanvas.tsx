"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { useMapStore } from "@/store/useMapStore";
import type { Entity } from "@/types/contract";
import RouteLayer from "./RouteLayer";

type LayerKey = "ship" | "aircraft" | "satellite" | "signal";

const LAYER_MAP: Record<LayerKey, string> = {
  ship: "layer-ship",
  aircraft: "layer-aircraft",
  satellite: "layer-satellite",
  signal: "layer-signal",
};

const SOURCE_MAP: Record<LayerKey, string> = {
  ship: "ships-source",
  aircraft: "aircraft-source",
  satellite: "sats-source",
  signal: "signal-source",
};

const BASE_ICON_SIZE: Record<LayerKey, number> = {
  ship: 0.36,
  aircraft: 0.42,
  satellite: 0.36,
  signal: 0.36,
};

type EntityFeature = {
  type: "Feature";
  properties: {
    id: string;
    name: string;
    heading: number;
    speed: number;
    country: string;
    type: LayerKey;
  };
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
};

type EntityFeatureCollection = {
  type: "FeatureCollection";
  features: EntityFeature[];
};

function isWithinPaddedBounds(
  lon: number,
  lat: number,
  bounds: maplibregl.LngLatBounds,
  paddingRatio = 0.1
): boolean {
  const north = bounds.getNorth();
  const south = bounds.getSouth();
  const east = bounds.getEast();
  const west = bounds.getWest();

  const latPadding = (north - south) * paddingRatio;
  const paddedNorth = north + latPadding;
  const paddedSouth = south - latPadding;

  if (lat < paddedSouth || lat > paddedNorth) {
    return false;
  }

  const lonPadding = Math.abs(east - west) * paddingRatio;
  const paddedWest = west - lonPadding;
  const paddedEast = east + lonPadding;

  if (paddedEast - paddedWest >= 360) {
    return true;
  }

  if (paddedWest <= paddedEast) {
    return lon >= paddedWest && lon <= paddedEast;
  }

  return lon >= paddedWest || lon <= paddedEast;
}

function buildGeoJSON(
  entities: Entity[],
  type: LayerKey,
  bounds: maplibregl.LngLatBounds | null
): EntityFeatureCollection {
  const features: EntityFeature[] = [];

  for (const entity of entities) {
    if (entity.type !== type) {
      continue;
    }

    const { lon, lat } = entity.position;
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
      continue;
    }

    if (bounds && !isWithinPaddedBounds(lon, lat, bounds, 0.1)) {
      continue;
    }

    features.push({
      type: "Feature",
      properties: {
        id: entity.id,
        name: entity.metadata.name,
        heading: entity.metadata.heading_deg ?? 0,
        speed: entity.metadata.speed_knots ?? 0,
        country: entity.metadata.country,
        type,
      },
      geometry: {
        type: "Point",
        coordinates: [lon, lat],
      },
    });
  }

  return {
    type: "FeatureCollection",
    features,
  };
}

function setSourceData(
  map: maplibregl.Map,
  sourceId: string,
  data: EntityFeatureCollection
) {
  const source = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
  if (source) {
    source.setData(data);
  }
}

function setLayerVisibility(map: maplibregl.Map, activeLayers: LayerKey[]) {
  (Object.keys(LAYER_MAP) as LayerKey[]).forEach((type) => {
    if (!map.getLayer(LAYER_MAP[type])) {
      return;
    }

    map.setLayoutProperty(
      LAYER_MAP[type],
      "visibility",
      activeLayers.includes(type) ? "visible" : "none"
    );
  });
}

function setSelectionStyles(map: maplibregl.Map, selectedEntityId: string | null) {
  (Object.keys(LAYER_MAP) as LayerKey[]).forEach((type) => {
    if (!map.getLayer(LAYER_MAP[type])) {
      return;
    }

    if (selectedEntityId) {
      map.setPaintProperty(LAYER_MAP[type], "icon-opacity", [
        "case",
        ["==", ["get", "id"], selectedEntityId],
        1,
        0.25,
      ]);
      map.setLayoutProperty(LAYER_MAP[type], "icon-size", [
        "case",
        ["==", ["get", "id"], selectedEntityId],
        BASE_ICON_SIZE[type] * 1.3,
        BASE_ICON_SIZE[type],
      ]);
      return;
    }

    map.setPaintProperty(LAYER_MAP[type], "icon-opacity", 1);
    map.setLayoutProperty(LAYER_MAP[type], "icon-size", BASE_ICON_SIZE[type]);
  });
}

function buildTriangleIcon(size: number, fill: string): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2D context unavailable while creating map icon.");
  }

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(size * 0.5, size * 0.15);
  ctx.lineTo(size * 0.82, size * 0.85);
  ctx.lineTo(size * 0.18, size * 0.85);
  ctx.closePath();
  ctx.fill();

  return ctx.getImageData(0, 0, size, size);
}

function buildDiamondIcon(size: number, fill: string): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2D context unavailable while creating map icon.");
  }

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(size * 0.5, size * 0.1);
  ctx.lineTo(size * 0.9, size * 0.5);
  ctx.lineTo(size * 0.5, size * 0.9);
  ctx.lineTo(size * 0.1, size * 0.5);
  ctx.closePath();
  ctx.fill();

  return ctx.getImageData(0, 0, size, size);
}

function buildPlaneIcon(size: number, fill: string): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2D context unavailable while creating map icon.");
  }

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = fill;
  ctx.strokeStyle = fill;
  ctx.lineWidth = size * 0.09;
  ctx.lineCap = "round";

  // Plane body
  ctx.beginPath();
  ctx.moveTo(size * 0.5, size * 0.12);
  ctx.lineTo(size * 0.5, size * 0.9);
  ctx.stroke();

  // Main wings
  ctx.beginPath();
  ctx.moveTo(size * 0.2, size * 0.5);
  ctx.lineTo(size * 0.8, size * 0.5);
  ctx.stroke();

  // Tail wings
  ctx.beginPath();
  ctx.moveTo(size * 0.35, size * 0.72);
  ctx.lineTo(size * 0.65, size * 0.72);
  ctx.stroke();

  // Nose
  ctx.beginPath();
  ctx.moveTo(size * 0.5, size * 0.05);
  ctx.lineTo(size * 0.6, size * 0.2);
  ctx.lineTo(size * 0.4, size * 0.2);
  ctx.closePath();
  ctx.fill();

  return ctx.getImageData(0, 0, size, size);
}

function buildCircleIcon(size: number, fill: string): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2D context unavailable while creating map icon.");
  }

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(size * 0.5, size * 0.5, size * 0.22, 0, Math.PI * 2);
  ctx.fill();

  return ctx.getImageData(0, 0, size, size);
}

function ensureEntityIcons(map: maplibregl.Map) {
  if (!map.hasImage("icon-aircraft")) {
    map.addImage("icon-aircraft", buildPlaneIcon(64, "#F8FAFC"));
  }
  if (!map.hasImage("icon-ship")) {
    map.addImage("icon-ship", buildTriangleIcon(64, "#22C55E"));
  }
  if (!map.hasImage("icon-satellite")) {
    map.addImage("icon-satellite", buildDiamondIcon(64, "#F97316"));
  }
  if (!map.hasImage("icon-signal")) {
    map.addImage("icon-signal", buildCircleIcon(64, "#38BDF8"));
  }
}

export default function MapCanvas() {
  const filteredEntities = useMapStore((state) => state.selectFilteredEntities());
  const activeLayers = useMapStore((state) => state.activeLayers);
  const selectedEntityId = useMapStore((state) => state.selectedEntity?.id ?? null);
  const activeTab = useMapStore((state) => state.activeTab);
  const hasReceivedEntityData = useMapStore((state) => state.hasReceivedEntityData);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const entitiesRef = useRef<Entity[]>(filteredEntities);
  const updateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const hideMap = activeTab === "history" || activeTab === "reports";

  const syncSources = useCallback(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) {
      return;
    }

    const bounds = map.getBounds();

    setSourceData(map, SOURCE_MAP.aircraft, buildGeoJSON(entitiesRef.current, "aircraft", bounds));
    setSourceData(map, SOURCE_MAP.ship, buildGeoJSON(entitiesRef.current, "ship", bounds));
    setSourceData(map, SOURCE_MAP.satellite, buildGeoJSON(entitiesRef.current, "satellite", bounds));
    setSourceData(map, SOURCE_MAP.signal, buildGeoJSON(entitiesRef.current, "signal", bounds));
  }, []);

  const queueSourceSync = useCallback(() => {
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
    }

    updateTimerRef.current = setTimeout(() => {
      syncSources();
      updateTimerRef.current = null;
    }, 200);
  }, [syncSources]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          "carto-dark": {
            type: "raster",
            tiles: [
              "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
              "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
              "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
              "https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            attribution:
              '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          },
        },
        layers: [
          {
            id: "carto-dark-layer",
            type: "raster",
            source: "carto-dark",
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [-40, 20],
      zoom: 2,
      attributionControl: {},
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

    map.on("load", () => {
      ensureEntityIcons(map);
      setMapLoaded(true);

      (Object.keys(LAYER_MAP) as LayerKey[]).forEach((type) => {
        if (!map.getSource(SOURCE_MAP[type])) {
          map.addSource(SOURCE_MAP[type], {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
          });
        }

        if (!map.getLayer(LAYER_MAP[type])) {
          map.addLayer({
            id: LAYER_MAP[type],
            type: "symbol",
            source: SOURCE_MAP[type],
            layout: {
              "icon-image":
                type === "aircraft"
                  ? "icon-aircraft"
                  : type === "ship"
                  ? "icon-ship"
                  : type === "satellite"
                  ? "icon-satellite"
                  : "icon-signal",
              "icon-size": BASE_ICON_SIZE[type],
              "icon-allow-overlap": true,
              "icon-ignore-placement": true,
              "icon-rotation-alignment": "map",
              "icon-rotate":
                type === "aircraft" || type === "ship"
                  ? ["coalesce", ["get", "heading"], 0]
                  : 0,
            },
            paint: {},
          });
        }

        map.on("click", LAYER_MAP[type], (e) => {
          if (e.features && e.features.length > 0) {
            const entityId = e.features[0].properties?.id;
            const entity = useMapStore.getState().entities[entityId];
            if (entity) {
              useMapStore.getState().setSelectedEntity(entity);
            }
          }
        });

        map.on("mouseenter", LAYER_MAP[type], () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", LAYER_MAP[type], () => {
          map.getCanvas().style.cursor = "";
        });
      });

      setLayerVisibility(map, useMapStore.getState().activeLayers);
      setSelectionStyles(map, useMapStore.getState().selectedEntity?.id ?? null);
      queueSourceSync();
    });

    map.on("mousemove", (e) => {
      useMapStore.getState().setCursorCoords({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    });

    map.on("mouseout", () => {
      useMapStore.getState().setCursorCoords(null);
    });

    map.on("click", (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: Object.values(LAYER_MAP).filter((layerId) => map.getLayer(layerId)),
      });
      if (!features.length) {
        useMapStore.getState().setSelectedEntity(null);
      }
    });

    map.on("moveend", queueSourceSync);
    map.on("zoomend", queueSourceSync);

    mapRef.current = map;
    useMapStore.getState().setMapInstance(map);

    return () => {
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
        updateTimerRef.current = null;
      }

      map.off("moveend", queueSourceSync);
      map.off("zoomend", queueSourceSync);
      map.remove();
      useMapStore.getState().setMapInstance(null);
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, [queueSourceSync]);

  useEffect(() => {
    entitiesRef.current = filteredEntities;
    queueSourceSync();
  }, [filteredEntities, queueSourceSync]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) {
      return;
    }

    setLayerVisibility(map, activeLayers);
  }, [activeLayers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) {
      return;
    }

    setSelectionStyles(map, selectedEntityId);
  }, [selectedEntityId]);

  return (
    <div
      className={`absolute inset-0 transition-opacity duration-200 ${
        hideMap ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div ref={mapContainerRef} className="absolute inset-0 h-full w-full" />
      {!mapLoaded && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-[#080A0F]">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#22C55E]" />
        </div>
      )}
      <div
        className={`pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-md border border-[#1E2130] bg-[#0F1117]/90 px-3 py-1 text-[11px] font-mono text-[#64748B] transition-opacity duration-300 ${
          mapLoaded && !hasReceivedEntityData ? "opacity-100" : "opacity-0"
        }`}
      >
        Connecting to data feeds...
      </div>
      <RouteLayer />
    </div>
  );
}
