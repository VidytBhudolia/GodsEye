"use client";

import { Bell } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useAlertsStore } from "@/store/useAlertsStore";

export default function AlertsBadge() {
  const { unreadCount, panelOpen, togglePanel } = useAlertsStore(
    useShallow((state) => ({
      unreadCount: state.unreadCount,
      panelOpen: state.panelOpen,
      togglePanel: state.togglePanel,
    }))
  );

  return (
    <button
      type="button"
      onClick={togglePanel}
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
          className={`absolute -right-1 -top-1 min-w-[20px] rounded-full border border-[#0F1117] bg-[#F97316] px-1.5 py-[1px] text-[10px] font-semibold leading-none text-[#080A0F] ${
            unreadCount > 0 ? "animate-pulse" : ""
          }`}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}
