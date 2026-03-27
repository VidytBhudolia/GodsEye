"use client";

import { useRef, useEffect } from "react";
import maplibregl from "maplibre-gl";
import { useMapStore } from "@/store/useMapStore";

const LAYER_MAP: Record<string, string> = {
  ship: "layer-ship",
  aircraft: "layer-aircraft",
  satellite: "layer-satellite",
  signal: "layer-signal",
};

export default function MapCanvas() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

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
      Object.keys(LAYER_MAP).forEach((type) => {
        if (!map.getSource(`source-${type}`)) {
          map.addSource(`source-${type}`, {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
          });

          map.addLayer({
            id: LAYER_MAP[type],
            type: "circle",
            source: `source-${type}`,
            paint: {
              "circle-radius": type === "ship" ? 4 : 5,
              "circle-color": type === "ship" ? "#22C55E" : "#38BDF8",
              "circle-stroke-width": 1,
              "circle-stroke-color": "#0F1117",
            },
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

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const syncMapData = (state: ReturnType<typeof useMapStore.getState>) => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const { entities, activeLayers } = state;

    const grouped: Record<string, any[]> = {
      ship: [],
      aircraft: [],
      satellite: [],
      signal: [],
    };

    Object.values(entities).forEach((e) => {
      if (activeLayers.includes(e.type)) {
        grouped[e.type].push({
          type: "Feature",
          properties: { id: e.id },
          geometry: {
            type: "Point",
            coordinates: [e.position.lon, e.position.lat],
          },
        });
      }
    });

    Object.keys(LAYER_MAP).forEach((type) => {
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
        }
      }
    });
  };

  useEffect(() => {
    // Subscribe gives us continuous updates when items change
    const unsubscribe = useMapStore.subscribe(syncMapData);
    
    // Attempt an initial sync
    syncMapData(useMapStore.getState());
    
    return () => unsubscribe();
  }, []);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full"
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
    />
  );
}
