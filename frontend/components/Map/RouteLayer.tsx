"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { useMapStore } from "@/store/useMapStore";

const CURRENT_ROUTE_SOURCE_ID = "source-current-route";
const CURRENT_ROUTE_LAYER_ID = "layer-current-route";
const HISTORICAL_ROUTE_SOURCE_ID = "source-historical-route";
const HISTORICAL_ROUTE_LAYER_ID = "layer-historical-route";
const AIRCRAFT_MARKER_SOURCE_ID = "source-route-aircraft-marker";
const AIRCRAFT_MARKER_LAYER_ID = "layer-route-aircraft-marker";
const AIRCRAFT_MARKER_ICON_ID = "icon-route-aircraft";

type Coordinate = [number, number];

type RouteLike = {
  waypoints?: unknown;
  origin?: unknown;
  destination?: unknown;
  origin_coords?: unknown;
  destination_coords?: unknown;
  origin_position?: unknown;
  destination_position?: unknown;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizeCoordinatePair(first: number, second: number): Coordinate | null {
  const firstLooksLikeLat = Math.abs(first) <= 90;
  const secondLooksLikeLon = Math.abs(second) <= 180;
  if (firstLooksLikeLat && secondLooksLikeLon) {
    return [second, first];
  }

  const firstLooksLikeLon = Math.abs(first) <= 180;
  const secondLooksLikeLat = Math.abs(second) <= 90;
  if (firstLooksLikeLon && secondLooksLikeLat) {
    return [first, second];
  }

  return null;
}

function toCoordinate(value: unknown): Coordinate | null {
  if (Array.isArray(value) && value.length >= 2 && isFiniteNumber(value[0]) && isFiniteNumber(value[1])) {
    return normalizeCoordinatePair(value[0], value[1]);
  }

  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    if (isFiniteNumber(record.lon) && isFiniteNumber(record.lat)) {
      return [record.lon, record.lat];
    }
    if (isFiniteNumber(record.lng) && isFiniteNumber(record.lat)) {
      return [record.lng, record.lat];
    }
    if (isFiniteNumber(record.longitude) && isFiniteNumber(record.latitude)) {
      return [record.longitude, record.latitude];
    }
  }

  return null;
}

function toCoordinateList(points: unknown): Coordinate[] {
  if (!Array.isArray(points)) {
    return [];
  }

  return points
    .map((point) => toCoordinate(point))
    .filter((point): point is Coordinate => point !== null);
}

function toCartesian([lon, lat]: Coordinate): [number, number, number] {
  const lonRad = (lon * Math.PI) / 180;
  const latRad = (lat * Math.PI) / 180;
  const cosLat = Math.cos(latRad);
  return [
    cosLat * Math.cos(lonRad),
    cosLat * Math.sin(lonRad),
    Math.sin(latRad),
  ];
}

function toLonLat([x, y, z]: [number, number, number]): Coordinate {
  const lon = (Math.atan2(y, x) * 180) / Math.PI;
  const lat = (Math.atan2(z, Math.sqrt(x * x + y * y)) * 180) / Math.PI;
  return [lon, lat];
}

function greatCircle(start: Coordinate, end: Coordinate, segments = 50): Coordinate[] {
  const total = Math.max(segments, 2);
  const startVector = toCartesian(start);
  const endVector = toCartesian(end);

  const dot = Math.max(
    -1,
    Math.min(
      1,
      startVector[0] * endVector[0] +
        startVector[1] * endVector[1] +
        startVector[2] * endVector[2]
    )
  );

  const omega = Math.acos(dot);
  if (omega === 0) {
    return [start, end];
  }

  const sinOmega = Math.sin(omega);
  const results: Coordinate[] = [];

  for (let i = 0; i < total; i += 1) {
    const t = i / (total - 1);
    const startScale = Math.sin((1 - t) * omega) / sinOmega;
    const endScale = Math.sin(t * omega) / sinOmega;

    const x = startScale * startVector[0] + endScale * endVector[0];
    const y = startScale * startVector[1] + endScale * endVector[1];
    const z = startScale * startVector[2] + endScale * endVector[2];

    results.push(toLonLat([x, y, z]));
  }

  return results;
}

function routeCoordinateFallback(route: RouteLike | undefined): Coordinate[] {
  if (!route) {
    return [];
  }

  const waypoints = toCoordinateList(route.waypoints);
  if (waypoints.length >= 2) {
    return waypoints;
  }

  const origin =
    toCoordinate(route.origin) ??
    toCoordinate(route.origin_coords) ??
    toCoordinate(route.origin_position);
  const destination =
    toCoordinate(route.destination) ??
    toCoordinate(route.destination_coords) ??
    toCoordinate(route.destination_position);

  if (origin && destination) {
    return greatCircle(origin, destination, 50);
  }

  return [];
}

function createPlaneIcon(size: number, fill: string): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to create route aircraft icon.");
  }

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = fill;
  ctx.strokeStyle = fill;
  ctx.lineWidth = size * 0.09;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(size * 0.5, size * 0.1);
  ctx.lineTo(size * 0.5, size * 0.92);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(size * 0.18, size * 0.52);
  ctx.lineTo(size * 0.82, size * 0.52);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(size * 0.36, size * 0.75);
  ctx.lineTo(size * 0.64, size * 0.75);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(size * 0.5, size * 0.04);
  ctx.lineTo(size * 0.6, size * 0.2);
  ctx.lineTo(size * 0.4, size * 0.2);
  ctx.closePath();
  ctx.fill();

  return ctx.getImageData(0, 0, size, size);
}

function ensureRouteLayers(map: maplibregl.Map) {
  if (!map.hasImage(AIRCRAFT_MARKER_ICON_ID)) {
    map.addImage(AIRCRAFT_MARKER_ICON_ID, createPlaneIcon(64, "#F8FAFC"));
  }

  if (!map.getSource(CURRENT_ROUTE_SOURCE_ID)) {
    map.addSource(CURRENT_ROUTE_SOURCE_ID, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
  }

  if (!map.getSource(HISTORICAL_ROUTE_SOURCE_ID)) {
    map.addSource(HISTORICAL_ROUTE_SOURCE_ID, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
  }

  if (!map.getSource(AIRCRAFT_MARKER_SOURCE_ID)) {
    map.addSource(AIRCRAFT_MARKER_SOURCE_ID, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
  }

  if (!map.getLayer(CURRENT_ROUTE_LAYER_ID)) {
    map.addLayer({
      id: CURRENT_ROUTE_LAYER_ID,
      type: "line",
      source: CURRENT_ROUTE_SOURCE_ID,
      paint: {
        "line-color": "#F8FAFC",
        "line-width": 2,
        "line-opacity": 0.9,
      },
    });
  }

  if (!map.getLayer(HISTORICAL_ROUTE_LAYER_ID)) {
    map.addLayer({
      id: HISTORICAL_ROUTE_LAYER_ID,
      type: "line",
      source: HISTORICAL_ROUTE_SOURCE_ID,
      paint: {
        "line-color": "#F97316",
        "line-width": 1.5,
        "line-opacity": 0.6,
        "line-dasharray": [2, 2],
      },
    });
  }

  if (!map.getLayer(AIRCRAFT_MARKER_LAYER_ID)) {
    map.addLayer({
      id: AIRCRAFT_MARKER_LAYER_ID,
      type: "symbol",
      source: AIRCRAFT_MARKER_SOURCE_ID,
      layout: {
        "icon-image": AIRCRAFT_MARKER_ICON_ID,
        "icon-size": 0.24,
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
        "icon-rotation-alignment": "map",
        "icon-rotate": ["coalesce", ["get", "heading"], 0],
      },
      paint: {
        "icon-opacity": 0.95,
      },
    });
  }
}

function setLineData(map: maplibregl.Map, sourceId: string, coordinates: Coordinate[]) {
  const source = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
  if (!source) {
    return;
  }

  source.setData({
    type: "FeatureCollection",
    features:
      coordinates.length >= 2
        ? [
            {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates,
              },
            },
          ]
        : [],
  });
}

function setAircraftMarker(
  map: maplibregl.Map,
  coordinate: Coordinate | null,
  heading: number | null
) {
  const source = map.getSource(AIRCRAFT_MARKER_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
  if (!source) {
    return;
  }

  source.setData({
    type: "FeatureCollection",
    features:
      coordinate && heading !== null
        ? [
            {
              type: "Feature",
              properties: { heading },
              geometry: {
                type: "Point",
                coordinates: coordinate,
              },
            },
          ]
        : [],
  });
}

export default function RouteLayer() {
  const mapInstance = useMapStore((state) => state.mapInstance);
  const selectedEntity = useMapStore((state) => state.selectedEntity);
  const historicalRoute = useMapStore((state) => state.historicalRoute);

  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mapInstance) {
      return;
    }

    const ensure = () => {
      if (!mapInstance.isStyleLoaded()) {
        return;
      }
      ensureRouteLayers(mapInstance);
    };

    ensure();
    mapInstance.on("styledata", ensure);

    return () => {
      mapInstance.off("styledata", ensure);
    };
  }, [mapInstance]);

  useEffect(() => {
    if (!mapInstance || !mapInstance.isStyleLoaded()) {
      return;
    }

    ensureRouteLayers(mapInstance);

    const isSatellite = selectedEntity?.type === "satellite";
    const currentCoordinates =
      selectedEntity && !isSatellite
        ? routeCoordinateFallback(selectedEntity.current_route as RouteLike | undefined)
        : [];

    const historicalCoordinates =
      selectedEntity && !isSatellite && historicalRoute
        ? toCoordinateList(historicalRoute)
        : [];

    setLineData(mapInstance, CURRENT_ROUTE_SOURCE_ID, currentCoordinates);
    setLineData(mapInstance, HISTORICAL_ROUTE_SOURCE_ID, historicalCoordinates);

    const canShowAircraftMarker =
      selectedEntity?.type === "aircraft" &&
      !isSatellite &&
      currentCoordinates.length >= 2;

    if (canShowAircraftMarker) {
      const markerCoordinate: Coordinate = [selectedEntity.position.lon, selectedEntity.position.lat];
      setAircraftMarker(
        mapInstance,
        markerCoordinate,
        isFiniteNumber(selectedEntity.metadata.heading_deg)
          ? selectedEntity.metadata.heading_deg
          : 0
      );
    } else {
      setAircraftMarker(mapInstance, null, null);
    }
  }, [mapInstance, selectedEntity, historicalRoute]);

  useEffect(() => {
    if (!mapInstance) {
      return;
    }

    const shouldAnimate = selectedEntity?.type === "aircraft";
    if (!shouldAnimate) {
      if (mapInstance.getLayer(AIRCRAFT_MARKER_LAYER_ID)) {
        mapInstance.setLayoutProperty(AIRCRAFT_MARKER_LAYER_ID, "icon-size", 0.24);
      }
      return;
    }

    const animate = (timestamp: number) => {
      if (mapInstance.getLayer(AIRCRAFT_MARKER_LAYER_ID)) {
        const pulse = 0.24 + Math.sin(timestamp / 220) * 0.015;
        mapInstance.setLayoutProperty(AIRCRAFT_MARKER_LAYER_ID, "icon-size", pulse);
      }
      animationFrameRef.current = window.requestAnimationFrame(animate);
    };

    animationFrameRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (mapInstance.getLayer(AIRCRAFT_MARKER_LAYER_ID)) {
        mapInstance.setLayoutProperty(AIRCRAFT_MARKER_LAYER_ID, "icon-size", 0.24);
      }
    };
  }, [mapInstance, selectedEntity?.id, selectedEntity?.type]);

  return null;
}
