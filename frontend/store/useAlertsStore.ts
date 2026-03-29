import { create } from "zustand";
import { buildBackendUrl } from "@/lib/backendUrl";
import { useMapStore } from "@/store/useMapStore";

const ALERT_LIMIT = 50;

export type AlertSeverity = "low" | "medium" | "high" | "critical";

export interface Alert {
  id: string;
  entityId: string;
  entityName: string;
  type: string;
  severity: AlertSeverity;
  message: string;
  detectedAt: string;
  lat: number;
  lon: number;
  acknowledged: boolean;
}

interface AlertsStore {
  alerts: Alert[];
  unreadCount: number;
  panelOpen: boolean;
  addAlert: (alert: Alert) => void;
  acknowledgeAlert: (id: string) => Promise<void>;
  acknowledgeAll: () => Promise<void>;
  togglePanel: () => void;
  setPanelOpen: (open: boolean) => void;
  closePanel: () => void;
}

function updateUnreadCount(alerts: Alert[]): number {
  return alerts.reduce((count, alert) => count + (alert.acknowledged ? 0 : 1), 0);
}

function clampAlerts(alerts: Alert[]): Alert[] {
  return alerts.slice(0, ALERT_LIMIT);
}

export const useAlertsStore = create<AlertsStore>((set, get) => ({
  alerts: [],
  unreadCount: 0,
  panelOpen: false,

  addAlert: (alert) => {
    set((state) => {
      const deduped = state.alerts.filter((existing) => existing.id !== alert.id);
      const nextAlerts = clampAlerts([alert, ...deduped]);

      return {
        alerts: nextAlerts,
        unreadCount: updateUnreadCount(nextAlerts),
      };
    });
  },

  acknowledgeAlert: async (id) => {
    set((state) => {
      const nextAlerts = state.alerts.map((alert) =>
        alert.id === id ? { ...alert, acknowledged: true } : alert
      );

      return {
        alerts: nextAlerts,
        unreadCount: updateUnreadCount(nextAlerts),
      };
    });

    try {
      await fetch(buildBackendUrl(`/api/alerts/${encodeURIComponent(id)}/acknowledge`), {
        method: "POST",
      });
    } catch {
      // Keep optimistic UI state if acknowledgement endpoint is temporarily unavailable.
    }
  },

  acknowledgeAll: async () => {
    const alertIds = get().alerts.map((alert) => alert.id);

    set((state) => {
      const nextAlerts = state.alerts.map((alert) => ({ ...alert, acknowledged: true }));
      return {
        alerts: nextAlerts,
        unreadCount: 0,
      };
    });

    try {
      await fetch(buildBackendUrl("/api/alerts/acknowledge-all"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: alertIds }),
      });
    } catch {
      // Keep optimistic UI state if bulk acknowledgement endpoint is temporarily unavailable.
    }
  },

  togglePanel: () => {
    const opening = !get().panelOpen;

    if (opening) {
      useMapStore.getState().setSelectedEntity(null);
    }

    set({ panelOpen: opening });
  },

  setPanelOpen: (open) => {
    if (open) {
      useMapStore.getState().setSelectedEntity(null);
    }

    set({ panelOpen: open });
  },

  closePanel: () => set({ panelOpen: false }),
}));
