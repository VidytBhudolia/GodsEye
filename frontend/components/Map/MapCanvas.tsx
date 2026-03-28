"use client";

import { useRef, useEffect } from "react";
import maplibregl from "maplibre-gl";
import { useMapStore } from "@/store/useMapStore";
import RouteLayer from "./RouteLayer";

type LayerKey = "ship" | "aircraft" | "satellite" | "signal";

const LAYER_MAP: Record<LayerKey, string> = {
  ship: "layer-ship",
  aircraft: "layer-aircraft",
  satellite: "layer-satellite",
  signal: "layer-signal",
};

const BASE_ICON_SIZE: Record<LayerKey, number> = {
  ship: 0.36,
  aircraft: 0.42,
  satellite: 0.36,
  signal: 0.36,
};

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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  function syncMapData(state: ReturnType<typeof useMapStore.getState>) {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const { entities, activeLayers, selectedEntity } = state;
    const selectedEntityId = selectedEntity?.id;

    const grouped: Record<
      LayerKey,
      Array<{
        type: "Feature";
        properties: { id: string; heading: number };
        geometry: { type: "Point"; coordinates: [number, number] };
      }>
    > = {
      ship: [],
      aircraft: [],
      satellite: [],
      signal: [],
    };

    Object.values(entities).forEach((e) => {
      if (activeLayers.includes(e.type)) {
        grouped[e.type].push({
          type: "Feature",
          properties: {
            id: e.id,
            heading: e.metadata.heading_deg ?? 0,
          },
          geometry: {
            type: "Point",
            coordinates: [e.position.lon, e.position.lat],
          },
        });
      }
    });

    (Object.keys(LAYER_MAP) as LayerKey[]).forEach((type) => {
      const source = map.getSource(`source-${type}`) as maplibregl.GeoJSONSource;
      if (source) {
        source.setData({
          type: "FeatureCollection",
          features: grouped[type] || [],
        });

        if (map.getLayer(LAYER_MAP[type])) {
          map.setLayoutProperty(
            LAYER_MAP[type],
            "visibility",
            activeLayers.includes(type) ? "visible" : "none"
          );

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
          } else {
            map.setPaintProperty(LAYER_MAP[type], "icon-opacity", 1);
            map.setLayoutProperty(LAYER_MAP[type], "icon-size", BASE_ICON_SIZE[type]);
          }
        }
      }
    });
  }

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

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

      (Object.keys(LAYER_MAP) as LayerKey[]).forEach((type) => {
        if (!map.getSource(`source-${type}`)) {
          map.addSource(`source-${type}`, {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
          });

          map.addLayer({
            id: LAYER_MAP[type],
            type: "symbol",
            source: `source-${type}`,
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
        }
      });
      
      // Trigger initial sync manually once map is loaded and sources exist
      syncMapData(useMapStore.getState());
    });

    map.on("mousemove", (e) => {
      useMapStore.getState().setCursorCoords({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    });

    map.on("mouseout", () => {
      useMapStore.getState().setCursorCoords(null);
    });

    map.on("click", (e) => {
      // Find what was clicked.
      const features = map.queryRenderedFeatures(e.point, {
        layers: Object.values(LAYER_MAP).filter(l => map.getLayer(l)),
      });
      // If none of our entity layers were clicked, deselect.
      if (!features.length) {
        useMapStore.getState().setSelectedEntity(null);
      }
    });

    mapRef.current = map;
    useMapStore.getState().setMapInstance(map);

    return () => {
      map.remove();
      useMapStore.getState().setMapInstance(null);
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    // Subscribe gives us continuous updates when items change
    const unsubscribe = useMapStore.subscribe(syncMapData);
    
    // Attempt an initial sync
    syncMapData(useMapStore.getState());
    
    return () => unsubscribe();
  }, []);

  return (
    <>
      <div ref={mapContainerRef} className="absolute inset-0 h-full w-full" />
      <RouteLayer />
    </>
  );
}
