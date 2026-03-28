# GodsEye Technical Progress & Handoff Document

**Project Status:** Backend Core Refactor Complete | Phase 3: AI Enrichment Active  
**Last Updated:** March 28, 2026

---

## 1. System Architecture

The project is structured into three primary layers to ensure separation of concerns and type safety.

### A. Shared Contract (`/shared/contract.ts`)
- **Source of Truth**: Defines the `Entity`, `Position`, `Metadata`, and `EntityType` interfaces.
- **Normalization Target**: All external feeds (AIS, OpenSky, Satellites) are normalized to this schema.
- **Resolution**: Frontend imports are now resolved via a `@shared` alias in `tsconfig.json` to avoid fragile relative paths.

### B. Frontend (Next.js 14 + Tailwind v4 + Zustand)
- **State Management**: `useMapStore.ts` (Zustand) handles map state, selected entities, and visibility toggles.
- **Tactical UI**: 
  - **Sidebar**: Independent layer toggling (Ships, Planes, Satellites).
  - **DetailPanel**: Real-time telemetry inspector with smooth slide-in/out animations.
  - **TopNav**: Aggregated active counts and UTC tactical clock.
- **Real-time Map**: MapLibre GL JS driven by tactical situational awareness icons.

### C. Backend (Express + Socket.io + Redis + Supabase)
- **Normalization Layer**: `Normalizer.ts` converts heterogeneous data:
  - **Aviation**: Maps OpenSky state vectors (ICAO24, velocity, altitude) to `Entity`.
  - **Maritime**: Maps AIS Stream messages (PositionReport, ShipStaticData) including destination and ETA.
- **Data Adapters**:
  - `AISAdapter`: WebSocket stream client with reconnection logic.
  - `OpenSkyAdapter`: REST-based poller with bounded-box optimization.
- **Persistence**: 
  - **PostgreSQL/PostGIS**: Live entity state and spatial history stored in Supabase.
  - **Redis**: Caching layer for high-frequency updates and feed status.

---

## 2. Work Completed to Date

### Phase 1: Infrastructure (Complete)
- [x] Next.js/Express dual-scaffold.
- [x] Supabase PostGIS spatial tables initialized.
- [x] Shared type contract established and linked.

### Phase 2: Core Data Loop (Complete)
- [x] **Adapters**: Functional AIS Stream and OpenSky integrations.
- [x] **Normalization**: Verified mapping of ship/plane telemetry to the central schema.
- [x] **Socket Layer**: Real-time broadcast of `entity:update` events.
- [x] **Tactical Dashboard**: Layout, Sidebar, and DetailPanel linked to Zustand.
- [x] **Module Resolution Fix**: Resolved critical TypeScript resolution issues for shared types in the frontend.

### Phase 3: Enrichment & Refinement (Active)
- [/] **AI Summarizer**: Integrating Groq for generating AI-assisted tactical summaries in the `DetailPanel`.
- [/] **History Tracking**: Storing and retrieving historical paths in the map view.
- [/] **UI Polish**: Iterating on visual fidelity based on `screenshots/` reference.

---

## 3. Immediate Next Steps (Handoff)

1. **Phase 3: AI Enrichment**:
   - Finalize the `Research Agent` loop to pull public intelligence derived from ICAO24/MMSI identifiers.
   - Implement the `ai_summary` field in the `DetailPanel` using the Groq-powered summary endpoint.
2. **Spatial Analytics**:
   - Implement "Detection Hub" logic to identify entities entering specific bounding boxes.
3. **Security Audit**:
   - Perform final review of `.env` handling to ensure no production secrets are leaked in dev logs.
4. **Performance Tuning**:
   - Optimize the MapLibre layer for high-density entity counts (1k+ entities).

---

## 4. Key References
- **Tech Stack**: `docs/Tech_Stack.md`
- **UI Spec**: `docs/UI_Spec.md`
- **Agents**: `Agents.md` (Defines roles for GodsEye development)
- **Database**: Supabase `entities` and `position_history` tables.
