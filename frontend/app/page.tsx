"use client";

import dynamic from "next/dynamic";
import { useMockEntities } from "@/hooks/useMockEntities";
import { useEffect } from "react";
import { socketClient } from "@/api/socketClient";
import { useMapStore } from "@/store/useMapStore";
import HistoryTab from "@/components/Tabs/HistoryTab";
import ReportsTab from "@/components/Tabs/ReportsTab";

const MapCanvas = dynamic(() => import("@/components/Map/MapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#080A0F]">
      <p className="text-[#64748B] text-sm font-mono animate-pulse">Initializing Map Engine...</p>
    </div>
  ),
});

export default function HomePage() {
  const activeTab = useMapStore((state) => state.activeTab);

  // Initialize mock data if enabled
  useMockEntities();

  // Initialize socket connection
  useEffect(() => {
    socketClient.connect();
    return () => socketClient.disconnect();
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#080A0F]">
      <MapCanvas />

      {activeTab === "history" && (
        <div className="absolute inset-0 z-30 overflow-y-auto bg-[#080A0F]/85 px-6 py-4">
          <HistoryTab />
        </div>
      )}

      {activeTab === "reports" && (
        <div className="absolute inset-0 z-30 overflow-y-auto bg-[#080A0F]/85 px-6 py-4">
          <ReportsTab />
        </div>
      )}
    </div>
  );
}
