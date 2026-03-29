"use client";

import { Bell } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useAlertsStore } from "@/store/useAlertsStore";
import { useMapStore } from "@/store/useMapStore";

export default function AlertsBadge() {
  const { unreadCount, panelOpen, togglePanel } = useAlertsStore(
    useShallow((state) => ({
      unreadCount: state.unreadCount,
      panelOpen: state.panelOpen,
      togglePanel: state.togglePanel,
    }))
  );
  const activeTab = useMapStore((state) => state.activeTab);
  const setActiveTab = useMapStore((state) => state.setActiveTab);

  const handleToggle = () => {
    const opening = !panelOpen;
    togglePanel();

    if (opening) {
      setActiveTab("alerts");
      return;
    }

    if (activeTab === "alerts") {
      setActiveTab("live");
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`relative flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
        panelOpen
          ? "border-[#22C55E] bg-[#166534] text-[#22C55E]"
          : "border-[#1E2130] bg-[#141824] text-[#64748B] hover:border-[#334155] hover:text-[#F8FAFC]"
      }`}
      aria-label="Toggle alerts panel"
      aria-pressed={panelOpen}
    >
      <Bell size={16} />
      {unreadCount > 0 && (
        <span
          className={`absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#EF4444] px-1 text-[9px] font-semibold leading-none text-[#F8FAFC] ${
            unreadCount > 0 ? "animate-pulse" : ""
          }`}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}
