"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Clock3 } from "lucide-react";
import { useMapStore } from "@/store/useMapStore";
import type { EntityType } from "@/types/contract";

type RouteHistoryItem = {
  id: string;
  dateLabel: string;
  routeLabel: string;
  durationLabel: string;
  points: [number, number][];
};

type RouteApiShape = {
  id?: string | number;
  route_id?: string | number;
  date?: string;
  timestamp?: string;
  started_at?: string;
  origin?: string;
  destination?: string;
  duration?: string | number;
  duration_minutes?: number;
  duration_seconds?: number;
  points?: Array<[number, number]>;
};

function formatDate(value: string | undefined): string {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatDuration(route: RouteApiShape): string {
  if (typeof route.duration === "string" && route.duration.trim().length > 0) {
    return route.duration;
  }

  if (typeof route.duration === "number") {
    const totalMinutes = route.duration > 1000 ? Math.round(route.duration / 60) : Math.round(route.duration);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }

  if (typeof route.duration_minutes === "number") {
    const hours = Math.floor(route.duration_minutes / 60);
    const minutes = Math.round(route.duration_minutes % 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }

  if (typeof route.duration_seconds === "number") {
    const totalMinutes = Math.max(1, Math.round(route.duration_seconds / 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }

  return "n/a";
}

function parseRouteRows(payload: unknown): RouteHistoryItem[] {
  const rows =
    Array.isArray(payload)
      ? payload
      : typeof payload === "object" && payload !== null
      ? (payload as { routes?: unknown; data?: unknown }).routes ??
        (payload as { routes?: unknown; data?: unknown }).data
      : [];

  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map((item, index) => {
    const route = (item ?? {}) as RouteApiShape;
    const points = Array.isArray(route.points)
      ? route.points.filter(
          (point): point is [number, number] =>
            Array.isArray(point) &&
            point.length >= 2 &&
            typeof point[0] === "number" &&
            typeof point[1] === "number"
        )
      : [];

    const origin = route.origin ?? "UNK";
    const destination = route.destination ?? "UNK";
    const id = String(route.id ?? route.route_id ?? index);

    return {
      id,
      dateLabel: formatDate(route.date ?? route.timestamp ?? route.started_at),
      routeLabel: `${origin} -> ${destination}`,
      durationLabel: formatDuration(route),
      points,
    };
  });
}

interface RouteTimelineProps {
  entityId: string | null;
  entityType: EntityType | null;
}

export default function RouteTimeline({ entityId, entityType }: RouteTimelineProps) {
  const setHistoricalRoute = useMapStore((state) => state.setHistoricalRoute);
  const selectedHistoryRouteId = useMapStore((state) => state.selectedHistoryRouteId);
  const setSelectedHistoryRouteId = useMapStore((state) => state.setSelectedHistoryRouteId);

  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [routes, setRoutes] = useState<RouteHistoryItem[]>([]);

  useEffect(() => {
    setHistoricalRoute(null);
    setSelectedHistoryRouteId(null);

    if (!entityId || entityType === "satellite") {
      setRoutes([]);
      setIsLoading(false);
      setHasError(false);
      return;
    }

    const controller = new AbortController();
    const fetchHistory = async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        const response = await fetch(`/api/history/${encodeURIComponent(entityId)}/routes`, {
          method: "GET",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Route history request failed");
        }

        const payload = await response.json();
        setRoutes(parseRouteRows(payload));
      } catch {
        if (!controller.signal.aborted) {
          setHasError(true);
          setRoutes([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchHistory();

    return () => {
      controller.abort();
    };
  }, [entityId, entityType, setHistoricalRoute, setSelectedHistoryRouteId]);

  if (entityType === "satellite") {
    return null;
  }

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Clock3 size={13} className="text-[#64748B]" />
        <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B]">
          Route History
        </h3>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[0, 1, 2].map((row) => (
            <div
              key={row}
              className="h-14 animate-pulse rounded-lg border border-[#1E2130] bg-[#141824]"
            />
          ))}
        </div>
      )}

      {!isLoading && hasError && (
        <p className="text-xs text-[#64748B]">Route history unavailable</p>
      )}

      {!isLoading && !hasError && routes.length === 0 && (
        <p className="text-xs text-[#64748B]">No route history</p>
      )}

      {!isLoading && !hasError && routes.length > 0 && (
        <div className="space-y-2">
          {routes.map((route) => {
            const isActive = selectedHistoryRouteId === route.id;

            return (
              <button
                key={route.id}
                type="button"
                onClick={() => {
                  setSelectedHistoryRouteId(route.id);
                  setHistoricalRoute(route.points.length >= 2 ? route.points : null);
                }}
                className={`flex w-full items-center justify-between rounded-r-lg border border-[#1E2130] px-3 py-2 text-left transition-colors ${
                  isActive
                    ? "border-l-2 border-l-[#F97316] bg-[#141824]"
                    : "border-l-2 border-l-transparent bg-[#0F1117] hover:bg-[#1E2130]"
                }`}
              >
                <div>
                  <div className="font-mono text-[11px] text-[#64748B]">{route.dateLabel}</div>
                  <div className="text-sm text-[#F8FAFC]">{route.routeLabel}</div>
                  <div className="font-mono text-[11px] text-[#64748B]">{route.durationLabel}</div>
                </div>
                <ChevronRight size={14} className="text-[#64748B]" />
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
