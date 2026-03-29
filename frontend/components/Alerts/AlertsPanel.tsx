"use client";

import { MapPin, ShieldCheck, X } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useAlertsStore, type Alert, type AlertSeverity } from "@/store/useAlertsStore";
import { useMapStore } from "@/store/useMapStore";

const SEVERITY_BORDER: Record<AlertSeverity, string> = {
  critical: "border-l-[#EF4444]",
  high: "border-l-[#F97316]",
  medium: "border-l-[#EAB308]",
  low: "border-l-[#64748B]",
};

function formatRelativeTime(value: string): string {
  const detectedAt = new Date(value);
  if (Number.isNaN(detectedAt.getTime())) {
    return "just now";
  }

  const diffMs = Date.now() - detectedAt.getTime();
  if (diffMs < 60000) {
    return "just now";
  }

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AlertsPanel() {
  const { alerts, unreadCount, panelOpen, acknowledgeAlert, acknowledgeAll, closePanel } =
    useAlertsStore(
      useShallow((state) => ({
        alerts: state.alerts,
        unreadCount: state.unreadCount,
        panelOpen: state.panelOpen,
        acknowledgeAlert: state.acknowledgeAlert,
        acknowledgeAll: state.acknowledgeAll,
        closePanel: state.closePanel,
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

  const closeWithTabSync = () => {
    closePanel();
    if (activeTab === "alerts") {
      setActiveTab("live");
    }
  };

  const handleLocate = async (alert: Alert) => {
    await acknowledgeAlert(alert.id);

    if (mapInstance) {
      mapInstance.flyTo({
        center: [alert.lon, alert.lat],
        zoom: Math.max(mapInstance.getZoom(), 6),
        duration: 900,
      });
    }

    const selected = entities[alert.entityId];
    if (selected) {
      setSelectedEntity(selected);
    }

    setActiveTab("live");
    closePanel();
  };

  return (
    <aside
      className={`absolute bottom-0 right-0 top-0 z-40 w-[320px] border-l border-[#1E2130] bg-[#0F1117]/95 transition-transform duration-300 ${
        panelOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
      }`}
      aria-hidden={!panelOpen}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-[#1E2130] px-4 py-3">
          <div className="flex items-center gap-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-[#64748B]">ALERTS</h2>
            <span className="rounded-full border border-[#1E2130] bg-[#141824] px-2 py-0.5 text-[10px] font-mono text-[#F8FAFC]">
              {unreadCount}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void acknowledgeAll()}
              className="text-[12px] text-[#22C55E] transition-colors hover:text-[#86EFAC]"
            >
              Mark all read
            </button>
            <button
              type="button"
              onClick={closeWithTabSync}
              className="rounded-md border border-[#1E2130] bg-[#141824] p-1 text-[#64748B] transition-colors hover:text-[#F8FAFC]"
              aria-label="Close alerts panel"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          {alerts.length === 0 ? (
            <div className="mt-24 flex flex-col items-center justify-center gap-2 text-center text-[#64748B]">
              <ShieldCheck size={28} />
              <p className="text-[13px]">No active alerts</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => {
                const severityBorder = SEVERITY_BORDER[alert.severity];

                return (
                  <article
                    key={alert.id}
                    className={`rounded-md border border-[#1E2130] border-l-4 px-3 py-2.5 ${severityBorder} ${
                      alert.acknowledged ? "bg-transparent" : "bg-[#0F1117]"
                    }`}
                  >
                    <div className={`space-y-1 ${alert.acknowledged ? "opacity-50" : "opacity-100"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[13px] font-semibold text-[#F8FAFC]">{alert.entityName}</p>
                          <p className="text-[11px] uppercase tracking-wide text-[#64748B]">{alert.type}</p>
                        </div>
                        <p className="text-right font-mono text-[11px] text-[#64748B]">
                          {formatRelativeTime(alert.detectedAt)}
                        </p>
                      </div>

                      <p
                        className="text-[12px] text-[#64748B]"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {alert.message}
                      </p>

                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => void acknowledgeAlert(alert.id)}
                          className="text-[11px] text-[#64748B] transition-colors hover:text-[#F8FAFC]"
                        >
                          {alert.acknowledged ? "Acknowledged" : "Mark read"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleLocate(alert)}
                          className="rounded-md border border-[#1E2130] bg-[#141824] p-1 text-[#64748B] transition-colors hover:text-[#F8FAFC]"
                          aria-label={`Locate ${alert.entityName}`}
                        >
                          <MapPin size={13} />
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
