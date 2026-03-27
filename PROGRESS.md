# GodsEye Technical Progress & Handoff Document

**Project Status:** Tactical UI Complete | Backend Data Feeds in Progress  
**Last Updated:** March 27, 2026

---

## 1. System Architecture

The project is divided into three main layers: `frontend`, `backend`, and `shared`.

### A. Shared Contract (`/shared/contract.ts`)
The single source of truth for TypeScript types. All services (AIS, OpenSky, Satellites) must be normalized to the `Entity` interface.

### B. Frontend (Next.js 14 + Tailwind v4 + Zustand)
- **State**: Managed in `useMapStore.ts`. Do not use Redux.
- **Map**: MapLibre GL JS centered on tactical situational awareness.
- **Interactivity**: Sidebar toggles filter layers via Zustand. Clicking an entity on the map triggers the `DetailPanel`.
- **Mocking**: `useMockEntities.ts` provides a high-fidelity simulation for UI testing. Toggle via `NEXT_PUBLIC_USE_MOCK=true`.

### C. Backend (Express + Socket.io + Redis + Supabase)
- **Adapters**: Located in `src/services/adapters/`.
  - `AISAdapter`: WebSocket stream from aisstream.io.
  - `OpenSkyAdapter`: REST polling from OpenSky Network.
- **Normalizer**: `Normalizer.ts` converts external raw data into our `Entity` schema.
- **Real-time**: Normalized entities are emitted via `io.emit("entity:update", entity)`.

---

## 2. Work Completed to Date

### Phase 1: Infrastructure
- Supabase schema initialized with PostGIS spatial indexing.
- Express server and Next.js boilerplate established.
- Basic map rendering verified.

### Phase 2: Tactical UI (Current State)
- **TopNav**: Logo, live UTC clock, and aggregate counters.
- **Sidebar**: Layer toggles with active detection status.
- **DetailPanel**: Telemetry inspector with slide-in animation.
- **StatusBar**: Mouse coordinate tracking.

### Phase 3: Live Data (Active)
- **Normalizer Service**: Developed and verified against AIS/OpenSky specs.
- **WebSocket Sink**: Socket.io logic is ready to broadcast real-world telemetry.

---

## 3. Immediate Next Steps (Handoff)

1. **Backend Stabilization**:
   - Ensure `AIS_STREAM_API_KEY` and `OPENSKY_CLIENT_SECRET` are correctly injected from `.env`.
   - Update `fetchOpenSkyStates` in `OpenSkyAdapter.ts` to use a dynamic bounding box instead of global to save credits.
2. **Database Integration**:
   - Implement `upsertEntities` in `supabaseClient.ts` to persist live positions for history tracking.
3. **Frontend Phase 3**:
   - Refactor `MapCanvas` to use `@/shared/contract` directly.
   - Disable mocks and verify live movement from the backend socket.

---

## 4. Key References
- **Tech Stack**: `docs/Tech_Stack.md`
- **UI Spec**: `docs/UI_Spec.md`
- **Database**: `Supabase Dashboard` (PostGIS tables: `entities`, `position_history`)
