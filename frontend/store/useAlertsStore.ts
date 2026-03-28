import { create } from "zustand";
import { useMapStore } from "@/store/useMapStore";
import { buildBackendUrl } from "@/lib/backendUrl";

const ALERT_LIMIT = 50;

function alertsEndpoint(path = ""): string {
  return buildBackendUrl(`/api/alerts${path}`);
}

export type AlertSeverity = "critical" | "high" | "medium" | "low";

export interface Alert {
  id: string;
  entityId?: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  timestamp: string;
  acknowledged: boolean;
}

interface AlertsStore {
  alerts: Alert[];
  unreadCount: number;
  panelOpen: boolean;
  addAlert: (alertInput: Alert | Partial<Alert>) => void;
  hydrateAlerts: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  acknowledgeAll: () => Promise<void>;
  setPanelOpen: (open: boolean) => void;
  togglePanel: () => void;
  closePanel: () => void;
}

function toSeverity(value: unknown): AlertSeverity {
  const normalized = String(value ?? "").toLowerCase();
  if (
    normalized === "critical" ||
    normalized === "high" ||
    normalized === "medium" ||
    normalized === "low"
  ) {
    return normalized;
  }
  return "medium";
}

function toAlert(raw: Alert | Partial<Alert>): Alert {
  return {
    id: String(raw.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    entityId: raw.entityId,
    title: String(raw.title ?? "Entity alert"),
    message: String(raw.message ?? "An entity raised an operational alert."),
    severity: toSeverity(raw.severity),
    timestamp: raw.timestamp ? String(raw.timestamp) : new Date().toISOString(),
    acknowledged: Boolean(raw.acknowledged),
  };
}

function withLimit(alerts: Alert[]): Alert[] {
  return alerts.slice(0, ALERT_LIMIT);
}

function unreadCountFor(alerts: Alert[]): number {
  return alerts.reduce((count, alert) => count + (alert.acknowledged ? 0 : 1), 0);
}

function mergeIncomingAlert(alerts: Alert[], incomingAlert: Alert): Alert[] {
  const deduped = alerts.filter((alert) => alert.id !== incomingAlert.id);
  return withLimit([incomingAlert, ...deduped]);
}

export const useAlertsStore = create<AlertsStore>((set, get) => ({
  alerts: [],
  unreadCount: 0,
  panelOpen: false,

  addAlert: (alertInput) => {
    const alert = toAlert(alertInput);

    set((state) => {
      const mergedAlerts = mergeIncomingAlert(state.alerts, alert);
      return {
        alerts: mergedAlerts,
        unreadCount: unreadCountFor(mergedAlerts),
      };
    });
  },

  hydrateAlerts: async () => {
    try {
      const response = await fetch(`${alertsEndpoint()}?limit=${ALERT_LIMIT}`);
      if (!response.ok) {
        return;
      }

      const payload = await response.json();
      const payloadAlerts = Array.isArray(payload?.alerts)
        ? payload.alerts
        : Array.isArray(payload)
        ? payload
        : [];

      const normalizedAlerts = withLimit(payloadAlerts.map((raw: Partial<Alert>) => toAlert(raw)));
      set({
        alerts: normalizedAlerts,
        unreadCount:
          typeof payload?.unreadCount === "number"
            ? payload.unreadCount
            : unreadCountFor(normalizedAlerts),
      });
    } catch {
      // Alerts API can be unavailable in local/dev snapshots; keep UI functional.
    }
  },

  refreshUnreadCount: async () => {
    try {
      const response = await fetch(alertsEndpoint("/unread-count"));
      if (!response.ok) {
        return;
      }

      const payload = await response.json();
      if (typeof payload?.unreadCount === "number") {
        set({ unreadCount: payload.unreadCount });
      }
    } catch {
      // Non-blocking by design; unread count still computed from local alerts.
    }
  },

  acknowledgeAlert: async (alertId) => {
    set((state) => {
      const updatedAlerts = state.alerts.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      );
      return {
        alerts: updatedAlerts,
        unreadCount: unreadCountFor(updatedAlerts),
      };
    });

    try {
      await fetch(alertsEndpoint(`/${encodeURIComponent(alertId)}/ack`), {
        method: "POST",
      });
    } catch {
      // Keep optimistic client state when API is unavailable.
    }
  },

  acknowledgeAll: async () => {
    set((state) => {
      const updatedAlerts = state.alerts.map((alert) => ({ ...alert, acknowledged: true }));
      return {
        alerts: updatedAlerts,
        unreadCount: 0,
      };
    });

    try {
      await fetch(alertsEndpoint("/ack-all"), {
        method: "POST",
      });
    } catch {
      // Keep optimistic client state when API is unavailable.
    }
  },

  setPanelOpen: (open) => {
    if (open) {
      useMapStore.getState().setSelectedEntity(null);
    }
    set({ panelOpen: open });
  },

  togglePanel: () => {
    const nextOpen = !get().panelOpen;
    if (nextOpen) {
      useMapStore.getState().setSelectedEntity(null);
    }
    set({ panelOpen: nextOpen });
  },

  closePanel: () => set({ panelOpen: false }),
}));
