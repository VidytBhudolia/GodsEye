# SENTINEL: Global OSINT Tracker
## Product Requirements Document (PRD)

**Version:** 1.0  
**Date:** March 27, 2026  
**Project Lead:** OSINT Intelligence Platform  
**Status:** Pre-Development (Ready for Sprint Planning)

---

## 1. Product Overview

**SENTINEL** is a web-based global situational awareness platform that ingests real-time open-source data feeds (ships, aircraft, satellites, radio signals) and presents them on a unified, interactive dark-mode map. Users can click any tracked entity to see enriched intelligence: position history, route analysis, cargo/flight manifests, vessel flags, and AI-generated contextual summaries powered by Groq LLM.

**Core thesis:** Multiple open intelligence feeds exist (AIS, ADS-B, TLE, SDR, numbers stations) but are fragmented across isolated tools. SENTINEL unifies them in one canvas and adds LLM-powered analysis to answer questions instantly.

**Target users:**
- OSINT hobbyists and independent researchers
- Geopolitical analysts and threat intelligence professionals
- Radio amateurs and satellite tracking enthusiasts
- Developers exploring real-time geospatial data visualization

**Primary use case:** User zooms to a region (e.g., Strait of Hormuz), sees ships, aircraft, and satellites overlaid, clicks a vessel to see its history and AI-generated threat assessment, then explores historical routes of related vessels to identify patterns.

---

## 2. User Stories & Core Features

### 2.1 Core User Stories

**US-001: Layer Toggle**
- As an OSINT analyst, I want to toggle data layers (ships, aircraft, satellites, radio signals) on/off independently so I can focus on the entity type I care about.
- Acceptance: Left sidebar has 5 icon buttons. Each button toggles visibility of one layer. Active layer shows green glow. Toggling a layer on/off takes <100ms with no re-fetch (cached data).

**US-002: Map Navigation**
- As a user, I want to pan and zoom around a world map freely (like Google Maps) so I can focus on any geographic region.
- Acceptance: Scroll wheel zooms. Mouse drag pans. Zoom level shown bottom-right. Zoom range: levels 1–18 (1=global, 18=street level). Pan/zoom feels smooth and responsive (<16ms per frame).

**US-003: Entity Click → Detail Panel**
- As a user, I want to click any entity (ship, aircraft, satellite) on the map and see a right-side detail panel with all publicly available information.
- Acceptance: Clicking an entity slides in a 320px right panel. Panel shows: entity name, type, current position, speed, heading, cargo/type, country flag. Clicking again or pressing X closes panel. Only one entity detail visible at a time.

**US-004: Route History Visualization**
- As a user, I want to see the current route arc for a selected aircraft/vessel and click "View History" to see its past routes overlaid on the map.
- Acceptance: Current route shown as white arc on map. Clicking "View flight/voyage history" shows a timeline of past 5 routes in the detail panel. Selecting a history item highlights that route as a faded orange dashed arc on the map. Past routes stay visible until user selects a different one.

**US-005: AI-Powered Intelligence Summary**
- As an analyst, I want to click "Analyse with AI" on any entity and get a contextual summary that includes web search results about that vessel/aircraft.
- Acceptance: Clicking button triggers a Groq LangChain agent. Agent takes entity data (name, flag, type, position, cargo hints) and searches the web for relevant intelligence. Returns a 150–300 word summary in the detail panel within 3 seconds. Summary includes citations (e.g., "According to Lloyd's List...").

**US-006: Real-time Data Feed Subscription**
- As the system, I need to ingest and display live data from multiple sources (AIS, ADS-B, TLE, radio schedules) and update the map in real time.
- Acceptance: AIS positions update every 5 seconds. ADS-B positions update every 10 seconds. Satellite positions computed client-side every 2 seconds from cached TLEs. Radio signals show schedule-based availability (not real-time). No API call per entity on load — all data cached.

**US-007: Search & Filter**
- As a user, I want to search for a specific ship, aircraft, or satellite by name, MMSI, ICAO24, or callsign.
- Acceptance: Top search bar accepts queries. Pressing Enter or clicking search icon highlights all matches on map in green. Can also filter by country flag, vessel type, or activity status (online/offline).

**US-008: Status & Statistics**
- As a user, I want to see at a glance how many entities are being tracked: ships, aircraft, satellites, active radio signals.
- Acceptance: Bottom status bar shows: ✈ {count} FLIGHTS | 🛰 {count} SATELLITES | ⚓ {count} SHIPS | 📻 {count} SIGNALS. Counts update as data comes in. Also shows current cursor coordinates and UTC time.

**US-009: Offline Basemap**
- As a user in a network-constrained environment, I want the basemap to work even if API connectivity is spotty.
- Acceptance: Basemap tiles cached locally using service worker. If tile fetch fails, serve from cache. This ensures map navigation never feels broken even with API latency.

---

### 2.2 Feature Set by Module

#### **Module A: Map & Visualization**
- [ ] Globe canvas renders dark ocean-blue basemap (MapLibre Dark Matter style)
- [ ] Zoom levels 1–18 supported
- [ ] Smooth 60fps pan/zoom interactions
- [ ] Entity icons: white plane (aircraft), green dot (ship), orange diamond (satellite), radio wave icon (signals)
- [ ] Current route arc visualization (white bezier curve)
- [ ] Historical route arc visualization (orange dashed curve)
- [ ] Entity hover tooltip: ID, type, flag, speed
- [ ] Entity focus mode: selected entity 100% opacity, others 30% opacity
- [ ] Heatmap layer option (future): shows density of ships/aircraft by region

#### **Module B: Data Ingestion & Caching**
- [ ] AIS Stream WebSocket integration (ships)
- [ ] OpenSky Network REST polling (aircraft via OAuth2)
- [ ] airplanes.live REST polling (military aircraft overlay)
- [ ] TLE API + Space-Track (satellites)
- [ ] Priyom + KiwiSDR integration (radio signals)
- [ ] Redis/Supabase caching layer
- [ ] IndexedDB browser cache for entity details
- [ ] Automatic TTL expiry and cache refresh

#### **Module C: Detail Panel & Intelligence**
- [ ] Entity card UI: name, type, country, current metrics (speed, heading, altitude, squawk)
- [ ] Route history timeline: clickable list of past 5 routes/flights
- [ ] Cargo/flight manifest display (sourced from public databases)
- [ ] "Analyse with AI" button → Groq LangChain web search integration
- [ ] Citation system: LLM-generated summaries include sources

#### **Module D: Layer Control**
- [ ] Left sidebar with 5 icon toggle buttons (flights, satellites, ships, radio, threats)
- [ ] Layer visibility state persisted to localStorage
- [ ] Active layer shows green glow, inactive shows grey
- [ ] Hovering layer button shows tooltip

#### **Module E: Search & Filter**
- [ ] Search bar autocomplete suggestions
- [ ] Filter by country flag
- [ ] Filter by entity type
- [ ] Filter by status (active/inactive, online/offline)
- [ ] Save search as "saved view"

#### **Module F: Navigation & Tabs**
- [ ] Top nav bar with LIVE VIEW | HISTORY | REPORTS | ALERTS
- [ ] LIVE VIEW: current map (default)
- [ ] HISTORY: playback of past N hours of entity movements
- [ ] REPORTS: summary stats, anomaly alerts, notable routes
- [ ] ALERTS: notifications of significant events (vessel AIS went dark, unusual squawk code)

---

## 3. Technical Requirements

### 3.1 Non-Functional Requirements

| Requirement | Target | Justification |
|---|---|---|
| **Responsiveness** | <100ms for layer toggle, <500ms for entity click | User should feel immediate feedback |
| **FPS** | 60fps on pan/zoom | Smooth interaction like Google Maps |
| **Time to Interactive** | <3 seconds on cold load | OSINT analysts need quick access |
| **Concurrent entities** | 50,000+ ships + 10,000+ aircraft simultaneously rendered | Real-world AIS/ADS-B data scale |
| **Update latency** | AIS updates <5s old, ADS-B <10s old | Data freshness critical for OSINT |
| **Cache hit ratio** | >80% of requests served from cache | Reduce API calls / cost |
| **Uptime** | 99% | Intelligence tool should be reliable |
| **Offline capability** | Map navigation works offline, data shows last cached state | Network resilience |

### 3.2 Data Model & Entity Schema

All entities normalize to this common schema before rendering:

```json
{
  "id": "string (MMSI/ICAO/NORAD)",
  "type": "ship | aircraft | satellite | signal",
  "position": {
    "lat": "number",
    "lon": "number",
    "alt_m": "number (optional, for aircraft/satellites)"
  },
  "metadata": {
    "name": "string",
    "country": "string (ISO 3166 alpha-2 code)",
    "country_flag": "string (emoji or SVG)",
    "entity_type": "string (tanker, cargo, A350, Starlink, etc.)",
    "speed_knots": "number (optional)",
    "heading_deg": "number (optional)",
    "status": "active | inactive | online | offline"
  },
  "current_route": {
    "origin": "string (port/airport/region code)",
    "destination": "string",
    "eta": "ISO 8601 datetime (optional)",
    "waypoints": "array of [lat, lon]"
  },
  "history": [
    {
      "timestamp": "ISO 8601",
      "lat": "number",
      "lon": "number",
      "alt_m": "number (optional)"
    }
  ],
  "enrichment": {
    "cargo_manifest": "string (optional, ships)",
    "aircraft_type": "string (optional, ADS-B)",
    "squawk_code": "string (optional, aircraft)",
    "satellite_purpose": "string (optional, satellites)",
    "signal_frequency": "string (optional, radio)"
  },
  "ai_summary": "string (LLM-generated, cached)",
  "ai_summary_timestamp": "ISO 8601",
  "cached_at": "ISO 8601",
  "cache_ttl_seconds": "number"
}
```

### 3.3 API Rate Limits & Budgeting

| API | Rate Limit | Cost/Query | Polling Strategy |
|---|---|---|---|
| **AIS Stream** | Unlimited WebSocket | Per-connection | Always-on, bounding box filter |
| **OpenSky REST** | 4,000 credits/day | 1–4 credits | Poll every 10s, narrow bbox |
| **airplanes.live** | 1 req/second | Free | Poll every 15s, global military filter |
| **TLE API** | Unlimited | Free | Fetch once on startup, TTL 12h |
| **Space-Track** | 500 requests/day | Free | Fetch active TLEs once daily |
| **Groq LLM** | ~14,400 tokens/min | Free | On-click only, cache responses 6h |
| **KiwiSDR Map** | Unlimited API | Free | Fetch receiver list once on startup |
| **Priyom.org** | Crawlable | Free | Scrape schedules once daily |

**Total daily cost:** ~$0 (all free tier or WebSocket-based)

### 3.4 Caching Strategy

**Browser Cache (IndexedDB):**
- Entity details (name, cargo, history) → TTL 24h
- LLM summaries → TTL 6h
- Search results → TTL 1h
- TLE data → TTL 12h

**Backend Cache (Redis, 5-minute windows):**
- AIS positions by bounding box → TTL 5s
- OpenSky aircraft states by bbox → TTL 10s
- Recent search queries → TTL 1h

**Service Worker:**
- Basemap tiles (OSM/CartoDB) → Cache-first, expires 30 days
- API responses → Network-first with cache fallback

---

## 4. UI/UX Specifications

### 4.1 Layout

```
┌─────────────────────────────────────────────────────────────┐
│ ◈ SENTINEL │ LIVE VIEW | HISTORY | REPORTS | ALERTS │ 🔔 👤 │
├──────┬─────────────────────────────────┬───────────────────┤
│      │                                 │                   │
│ ✈ 🛰 │   MAP CANVAS                   │  OBJECT DETAILS   │
│ ⚓ 📻 │   (Dark Matter tiles)          │  (Slide-in panel) │
│ 🛡️ ⚙️ │   Pan, zoom, zoom level        │                   │
│      │   indicator, entity icons      │                   │
│ │    │                                 │                   │
│      │                                 │                   │
├──────┴─────────────────────────────────┴───────────────────┤
│ ✈ 12,482  🛰 2,109  ⚓ 45,903  │  LAT 40.71 LON 74.00  14:02:44 │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Color Palette

- **Background:** #080A0F (deep black)
- **Surface cards:** #0F1117 (dark grey)
- **Border:** #1E2130 (subtle dark grey)
- **Primary accent:** #22C55E (neon green, Tailwind 500)
- **Warning accent:** #F97316 (orange, for anomalies)
- **Text primary:** #F8FAFC (almost white)
- **Text muted:** #64748B (medium grey)

### 4.3 Typography

- **Labels & UI text:** Inter Sans, 11–14px, #64748B or #F8FAFC
- **Data values:** JetBrains Mono, 12–18px, #F8FAFC (monospace for precision)
- **Entity names:** Inter Sans, 18–24px bold, #F8FAFC
- **Headers:** Inter Sans, 16–20px, #22C55E

### 4.4 Component Behaviors

**Left Sidebar Buttons:**
- Default: 40px diameter circle, #1E2130 background, #64748B icon
- Hover: #1E2130 background, cursor pointer
- Active: #166534 background (dark green), #22C55E icon, 1px #22C55E border
- Click: Toggle layer visibility immediately (no API call, cached data shown/hidden)

**Detail Panel:**
- Slides in from right when entity clicked
- 320px wide, full height
- Header: entity icon + status badge + name
- Sections: telemetry grid (2×3 tiles), current route map strip, flight/voyage history timeline, AI summary, action buttons
- Close: X button top-right or click outside panel

**Route History Timeline:**
- Vertical list of 5 most recent routes/flights
- Each row: date, route code, duration, external link icon
- Hover: subtle #1E2130 highlight
- Click: highlight that route as dashed orange arc on center map
- Only one historical route visible on map at a time

**Status Bar:**
- Fixed at bottom, 32px tall
- Left: entity counts (✈ 12,482 etc.)
- Center: current cursor coordinates (LAT, LON)
- Right: UTC time
- Color: #64748B muted, accent counts in #22C55E green

---

## 5. Phasing & MVP Definition

### Phase 1 (MVP, Weeks 1–2)
- [ ] Map canvas with dark basemap
- [ ] Layer toggles (left sidebar, 4 layers: flights, satellites, ships, radio)
- [ ] Entity icons on map, no animation
- [ ] Click entity → detail panel with static data
- [ ] AIS WebSocket integration (ships layer)
- [ ] OpenSky REST polling (aircraft layer)
- [ ] TLE data (satellites layer) with client-side propagation
- [ ] Basic search by ID/name
- [ ] Redis caching for API responses

### Phase 2 (Weeks 3–4)
- [ ] Route arc visualization (current white, history orange dashed)
- [ ] Flight/voyage history timeline in detail panel
- [ ] Click history → highlight on map
- [ ] Groq LLM "Analyse with AI" integration
- [ ] LangChain web search tool integration
- [ ] Radio signals layer (Priyom + KiwiSDR)
- [ ] localStorage persistence of layer toggle state

### Phase 3 (Weeks 5–6)
- [ ] HISTORY tab: playback of past N hours
- [ ] REPORTS tab: summary stats and anomaly detection
- [ ] ALERTS tab: notifications for unusual activity
- [ ] Filter UI: by country, entity type, status
- [ ] "Saved views" (user can bookmark regions/searches)
- [ ] Service worker for offline basemap

### Phase 4+ (Future)
- [ ] Heatmap layer (density of vessels/aircraft by region)
- [ ] Threat scoring algorithm (anomaly detection)
- [ ] Export route data (CSV, GeoJSON)
- [ ] User authentication & personal workspaces
- [ ] Collab features (shared views with team)
- [ ] Mobile app (React Native)

---

## 6. Success Metrics

| Metric | Target | Measurement |
|---|---|---|
| Time to First Meaningful Paint | <2.5s | Lighthouse audit on cold load |
| P95 Entity Click → Panel Show | <300ms | Browser DevTools performance tab |
| Cache Hit Ratio | >80% | Backend logs / Redis stats |
| User Session Duration | >5 min average | Analytics |
| Feature Adoption | >60% use route history feature | Analytics event tracking |
| Concurrent User Load | 100+ users, <500ms API latency | Load testing on Groq/OpenSky |

---

## 7. Dependencies & Risks

### External Dependencies
- **OpenSky Network API:** May have outages or rate limit changes
- **Groq LLM free tier:** May be deprecated or rate-limited in future
- **AIS Stream WebSocket:** Requires stable WS connection; implement reconnect logic
- **Space-Track:** DoD-operated; may change data access policies

### Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| OpenSky API rate limit exceeded | Aircraft layer goes stale | Implement token bucket; poll smaller bbox |
| Groq LLM latency >3s | User perceives slow AI analysis | Timeout to 3s, show cached summary instead |
| Map pan/zoom stutter on low-end hardware | Poor UX | Use requestAnimationFrame, optimize tile loading |
| Data cache grows unbounded | Memory leak, slow browser | Implement LRU cache with max size limits |
| AIS Stream disconnects silently | Ships layer stops updating | Implement heartbeat + auto-reconnect with exponential backoff |

---

## 8. Open Questions & Scope Clarifications

1. **Military/Sensitive Data:** Should we obscure or hide aircraft squawking certain codes (7600 emergency, military call signs)? Or fully display for OSINT transparency?
   - **Decision needed:** Depends on legal/ethical position. Default = display all.

2. **Data Retention:** How long do we keep historical position data? (Memory/storage cost vs. analytical value)
   - **Decision needed:** Proposed: 7 days for ships/aircraft, 30 days for satellites.

3. **Cargo Manifest Privacy:** Some shipping data is proprietary. Should we blank it if not public?
   - **Decision needed:** Only display if publicly available via AIS broadcast or Lloyd's List.

4. **Multi-select Entities:** Should users be able to select multiple entities and compare? (Scope creep risk)
   - **Decision needed:** Defer to Phase 4. MVP only single entity detail view.

5. **Export/Sharing:** Can users export views or share findings? Any IP/legal concerns?
   - **Decision needed:** MVP allows PDF export. Sharing deferred to auth + workspaces Phase 4.

---

**Document Owner:** OSINT Intelligence Team  
**Last Updated:** March 27, 2026  
**Next Review:** After MVP launch, week 3 of development