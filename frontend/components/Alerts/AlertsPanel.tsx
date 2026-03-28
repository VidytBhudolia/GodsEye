"use client";

import { useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { BellRing, CheckCheck, MapPin, X } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useAlertsStore, type AlertSeverity } from "@/store/useAlertsStore";
import { useMapStore } from "@/store/useMapStore";

const SEVERITY_STYLE: Record<AlertSeverity, { border: string; chip: string }> = {
  critical: {
    border: "border-l-[#EF4444]",
    chip: "bg-[#7F1D1D] text-[#FCA5A5]",
  },
  high: {
    border: "border-l-[#F97316]",
    chip: "bg-[#7C2D12] text-[#FDBA74]",
  },
  medium: {
    border: "border-l-[#38BDF8]",
    chip: "bg-[#0C4A6E] text-[#7DD3FC]",
  },
  low: {
    border: "border-l-[#22C55E]",
    chip: "bg-[#14532D] text-[#86EFAC]",
  },
};

export default function AlertsPanel() {
  const {
    alerts,
    panelOpen,
    acknowledgeAlert,
    acknowledgeAll,
    closePanel,
    hydrateAlerts,
  } = useAlertsStore(
    useShallow((state) => ({
      alerts: state.alerts,
      panelOpen: state.panelOpen,
      acknowledgeAlert: state.acknowledgeAlert,
      acknowledgeAll: state.acknowledgeAll,
      closePanel: state.closePanel,
      hydrateAlerts: state.hydrateAlerts,
    }))
  );

  const { entities, mapInstance, setSelectedEntity } = useMapStore(
    useShallow((state) => ({
      entities: state.entities,
      mapInstance: state.mapInstance,
      setSelectedEntity: state.setSelectedEntity,
    }))
  );
  const activeTab = useMapStore((state) => state.activeTab);
  const setActiveTab = useMapStore((state) => state.setActiveTab);

  useEffect(() => {
    if (panelOpen) {
      void hydrateAlerts();
    }
  }, [hydrateAlerts, panelOpen]);

  const handleFlyTo = async (alertId: string, entityId?: string) => {
    await acknowledgeAlert(alertId);

    if (!entityId) {
      return;
    }

    const entity = entities[entityId];
    if (!entity) {
      return;
    }

    setSelectedEntity(entity);

    if (mapInstance) {
      mapInstance.flyTo({
        center: [entity.position.lon, entity.position.lat],
        zoom: Math.max(mapInstance.getZoom(), 6),
        duration: 900,
      });
    }

    setActiveTab("live");
    closePanel();
  };

  const handleClosePanel = () => {
    closePanel();
    if (activeTab === "alerts") {
      setActiveTab("live");
    }
  };

  return (
    <aside
      className={`absolute bottom-0 right-0 top-0 z-40 w-[340px] border-l border-[#1E2130] bg-[#0F1117]/95 backdrop-blur-md transition-transform duration-300 ${
        panelOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
      }`}
      aria-hidden={!panelOpen}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-[#1E2130] px-4 py-3">
          <div className="flex items-center gap-2">
            <BellRing size={16} className="text-[#F97316]" />
            <h2 className="text-sm font-semibold tracking-wide text-[#F8FAFC]">Alerts</h2>
          </div>
          <button
            type="button"
            onClick={handleClosePanel}
            className="rounded-md border border-[#1E2130] bg-[#141824] p-1.5 text-[#64748B] transition-colors hover:text-[#F8FAFC]"
            aria-label="Close alerts panel"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center justify-between border-b border-[#1E2130] px-4 py-2">
          <span className="text-[10px] uppercase tracking-widest text-[#64748B]">Latest 50</span>
          <button
            type="button"
            onClick={() => void acknowledgeAll()}
            className="inline-flex items-center gap-1 text-[11px] text-[#38BDF8] transition-colors hover:text-[#7DD3FC]"
          >
            <CheckCheck size={13} />
            Mark all read
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {alerts.length === 0 ? (
            <div className="mt-20 rounded-lg border border-dashed border-[#1E2130] bg-[#141824]/50 p-6 text-center">
              <p className="text-sm font-medium text-[#94A3B8]">No active alerts</p>
              <p className="mt-1 text-xs text-[#64748B]">Incoming alert events will appear here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => {
                const severityStyle = SEVERITY_STYLE[alert.severity];

                return (
                  <article
                    key={alert.id}
                    className={`rounded-md border border-[#1E2130] border-l-4 bg-[#141824] p-3 transition-colors ${severityStyle.border} ${
                      alert.acknowledged ? "opacity-70" : "opacity-100"
                    }`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-medium text-[#F8FAFC]">{alert.title}</h3>
                        <p className="mt-1 text-xs text-[#94A3B8]">{alert.message}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${severityStyle.chip}`}>
                        {alert.severity}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-[#64748B]">
                        {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                      </span>

                      <div className="flex items-center gap-2">
                        {!alert.acknowledged && (
                          <button
                            type="button"
                            onClick={() => void acknowledgeAlert(alert.id)}
                            className="text-[11px] text-[#38BDF8] transition-colors hover:text-[#7DD3FC]"
                          >
                            Mark read
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => void handleFlyTo(alert.id, alert.entityId)}
                          className="inline-flex items-center gap-1 rounded-md border border-[#1E2130] bg-[#0F1117] px-2 py-1 text-[11px] text-[#F8FAFC] transition-colors hover:border-[#334155]"
                        >
                          <MapPin size={12} />
                          Locate
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
