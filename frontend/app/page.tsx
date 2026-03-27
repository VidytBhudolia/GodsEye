"use client";

import dynamic from "next/dynamic";
import { useMockEntities } from "@/hooks/useMockEntities";
import { useEffect } from "react";
import { socketClient } from "@/api/socketClient";

const MapCanvas = dynamic(() => import("@/components/Map/MapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#080A0F]">
      <p className="text-[#64748B] text-sm font-mono animate-pulse">Initializing Map Engine...</p>
    </div>
  ),
});

export default function HomePage() {
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
    </div>
  );
}
