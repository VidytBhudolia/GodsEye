type OpenSkyBounds = {
  lamin: number;
  lamax: number;
  lomin: number;
  lomax: number;
};

type StoredViewport = OpenSkyBounds & {
  updatedAt: number;
};

const DEFAULT_VIEWPORT_STALE_MS = 45000;
const socketViewports = new Map<string, StoredViewport>();

function parsePositiveInt(input: string | undefined, fallback: number): number {
  if (!input) {
    return fallback;
  }

  const parsed = Number.parseInt(input, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

const VIEWPORT_STALE_MS = parsePositiveInt(process.env.OPENSKY_VIEWPORT_STALE_MS, DEFAULT_VIEWPORT_STALE_MS);

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeBounds(bounds: OpenSkyBounds): OpenSkyBounds | null {
  const lamin = clamp(bounds.lamin, -90, 90);
  const lamax = clamp(bounds.lamax, -90, 90);
  const lomin = clamp(bounds.lomin, -180, 180);
  const lomax = clamp(bounds.lomax, -180, 180);

  if (lamax <= lamin || lomax <= lomin) {
    return null;
  }

  return { lamin, lamax, lomin, lomax };
}

function pruneStaleViewports(now: number): void {
  for (const [socketId, viewport] of socketViewports.entries()) {
    if (now - viewport.updatedAt > VIEWPORT_STALE_MS) {
      socketViewports.delete(socketId);
    }
  }
}

export function updateSocketViewport(socketId: string, bounds: OpenSkyBounds): boolean {
  const normalized = normalizeBounds(bounds);
  if (!normalized) {
    return false;
  }

  socketViewports.set(socketId, {
    ...normalized,
    updatedAt: Date.now(),
  });

  return true;
}

export function removeSocketViewport(socketId: string): void {
  socketViewports.delete(socketId);
}

export function getAggregatedViewportBounds(): OpenSkyBounds | null {
  const now = Date.now();
  pruneStaleViewports(now);

  if (!socketViewports.size) {
    return null;
  }

  let lamin = 90;
  let lamax = -90;
  let lomin = 180;
  let lomax = -180;

  for (const viewport of socketViewports.values()) {
    lamin = Math.min(lamin, viewport.lamin);
    lamax = Math.max(lamax, viewport.lamax);
    lomin = Math.min(lomin, viewport.lomin);
    lomax = Math.max(lomax, viewport.lomax);
  }

  return { lamin, lamax, lomin, lomax };
}

export function getViewportStateSummary() {
  const now = Date.now();
  pruneStaleViewports(now);

  return {
    activeSockets: socketViewports.size,
    staleAfterMs: VIEWPORT_STALE_MS,
  };
}

export type { OpenSkyBounds };
