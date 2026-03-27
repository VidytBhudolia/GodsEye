"use client";

import dynamic from "next/dynamic";

const MapCanvas = dynamic(() => import("@/components/Map/MapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen items-center justify-center bg-[#080A0F]">
      <p className="text-[#64748B] text-sm">Loading map…</p>
    </div>
  ),
});

export default function HomePage() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#080A0F]">
      <MapCanvas />
    </main>
  );
}
