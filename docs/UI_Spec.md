# SENTINEL: UI / UX Specification

**Version:** 1.0  
**Date:** March 27, 2026  
**Purpose:** UI reference document for Antigravity / Stitch iterations

---

## 1. Product Feel

SENTINEL should feel like a real production geospatial intelligence console: clean, dark, high-contrast, minimal, and deliberate. Avoid anything that looks overly AI-generated: no excessive glow, no fake sci-fi chrome, no decorative gradients that do not serve function.

Design references to emulate:
- Linear / Vercel / Planetscale for layout discipline and spacing
- Flight-tracker interfaces for dense but readable telemetry
- Dark tactical dashboards for focus, not theatrics

---

## 2. Layout

### Primary structure
- **Left sidebar**: narrow vertical rail with rounded icon buttons for layer toggles
- **Center canvas**: large interactive map taking most of the width
- **Right detail panel**: fixed-width panel that opens when an entity is selected
- **Top bar**: product name, search, tabs, user controls
- **Bottom status bar**: live counts, cursor coordinates, UTC time

### Width guidance
- Left rail: 64–72px
- Center map: flexible, ~60–68% of desktop width
- Right detail panel: 320–380px
- Top bar: 48–56px height
- Bottom status bar: 28–36px height

### Behavior
- The **map does not rotate like a globe** for MVP; it behaves like Google Maps: pan, zoom, smooth scroll, drag navigation
- The detail panel starts at the right edge and slides inward
- Only one selected entity at a time in MVP

---

## 3. Visual System

### Colors
- App background: `#080A0F`
- Surface cards: `#0F1117`
- Raised surface: `#141824`
- Border: `#1E2130`
- Primary accent: `#22C55E`
- Secondary accent: `#F97316`
- Informational accent: `#38BDF8`
- Text primary: `#F8FAFC`
- Text muted: `#64748B`
- Danger/alert: `#EF4444`

### Typography
- Primary UI font: **Inter**
- Data / telemetry font: **JetBrains Mono**
- Large object title: 20–24px Inter, semibold
- Section label: 10–11px uppercase, letter-spaced
- Data tile value: 15–18px mono

### Shape language
- Rounded but restrained
- Card radius: 8–12px
- Sidebar icon button radius: full pill / circle
- Borders: 1px, subtle, never glowing by default

### Motion
- Slide-in panel: 180–220ms ease-out
- Hover elevation: border + tiny background shift, not drop shadow
- Map object hover: scale up 1.1x to 1.2x
- Route highlight fade: 120–160ms

---

## 4. Map Experience

### Map base
Use a **dark flat map** style, not a spherical globe in MVP.

Desired behavior:
- Smooth drag to pan
- Scroll wheel to zoom
- Double click to zoom
- Inertia / momentum should feel polished but restrained
- Zoom controls bottom-right in a dark mini-card

### Why flat map first
A flat map better supports “scan and inspect” workflows, route overlays, and object density at this stage. It also matches the user expectation of how flight trackers and maps behave.

### Suggested look
- Deep navy-black oceans
- Dark grey landmasses
- Faint coastlines and borders
- Minimal labels by default
- No terrain bumps
- No unnecessary satellite imagery at MVP stage

---

## 5. Left Sidebar

### Purpose
This is a **layer control rail**, not a menu.

### Buttons
Use circular or rounded-rectangle icon buttons for:
1. Flights
2. Satellites
3. Ships
4. Radio / Signals
5. Threats / Intel notes (future or disabled)
6. Filters / Settings
7. User avatar at bottom

### Interaction states
- Default: muted icon, dark background
- Hover: subtle brighter border
- Active: green icon, dark green background tint, visible ring/border
- Disabled/future: 50% opacity

### Tooltips
Each icon shows tooltip on hover:
- “Flights”
- “Satellites”
- “Ships”
- “Signals”
- “Threats (coming later)”

### Extra left-rail feature
Add a small **active layer count chip** near the top or bottom, e.g. `3 LIVE`, to quickly show how many layers are on.

---

## 6. Center Map Canvas

### What appears on the map
- Aircraft markers
- Ship markers
- Satellite markers
- Radio signal / SDR nodes
- Current route arcs
- Historical route overlays
- Optional focus halo for selected object

### Map states
- **Default state**: multiple active layers visible, no right panel open
- **Selected state**: clicked object highlighted, related route shown, right panel open, other entities dimmed to 30–40%
- **History state**: one prior route displayed in orange dashed style

### Search bar
Top overlay search bar should support:
- ICAO24
- Callsign
- MMSI
- Vessel name
- Satellite name / NORAD

Placeholder:
`Search by ICAO, MMSI, callsign, vessel, satellite...`

---

## 7. Right Detail Panel

### General behavior
- Slides from right
- Fixed width
- Scrollable internally if content grows
- Should feel like a command panel, not a modal

### Recommended content order
1. Entity status badge
2. Entity title and subtitle
3. Telemetry summary tiles
4. Current route card
5. History section
6. Enrichment section
7. AI analysis section
8. Action links/buttons

### Example for aircraft
- Flight status: ACTIVE / LANDED / LOST SIGNAL
- Callsign
- Airline + aircraft type
- Altitude
- Speed
- Heading
- Squawk
- Origin / destination
- ETA if available
- Current route strip
- Previous routes list (last 5)

### Example for ships
- AIS status: ACTIVE / STALE / OFFLINE
- Vessel name
- Flag country
- IMO / MMSI
- Vessel type
- Speed / heading
- Last port / destination
- ETA
- Cargo/manifest if public
- Voyage history

### Example for satellites
- NORAD ID
- Operator / country
- Orbit class
- Altitude / inclination
- Current pass / next pass over selected region

---

## 8. Route & History UX

### Current route
- Bright white or soft cyan curve
- Slightly thicker than historical routes
- Should be immediately visible when object selected

### Historical route
- Dashed orange arc
- Lower opacity than current route
- Only one highlighted history route at a time for clarity

### Timeline design
History list item should show:
- Date/time
- Origin → destination
- Duration
- Tiny icon indicating replay / preview

Clicking a history row should:
1. Highlight that old route on main map
2. Update mini route strip in detail panel
3. Keep current route visible in more dominant style

---

## 9. Symbol System for Map Entities

### Recommended icon libraries
Use open-source icon systems with React support so Antigravity can implement them directly.

#### Primary recommendation: **Lucide**
Use Lucide for sidebar, panel actions, and clean UI icons. Lucide has explicit `satellite`, `satellite-dish`, and `ship` icons with React usage examples.[web:151][web:154][web:157]

#### Secondary recommendation: **Phosphor Icons**
Use Phosphor if you want a slightly softer, more modern icon family with a very large set of icons and multiple weights.[web:160][web:173]

#### Utility source: **Iconbuddy**
Use Iconbuddy to quickly compare and export matching open-source SVG icons across libraries before standardizing one family.[web:143]

### Best symbols by layer

#### Flights
- **Map marker**: custom minimal airplane silhouette, top-down orientation, rotatable by heading
- **Sidebar icon**: Lucide/Heroicons plane-like icon or Phosphor airplane icon
- **Hover state**: add small route tick / trail
- **Selected state**: white marker with green halo

#### Ships
- **Map marker**: simplified vessel triangle / ship bow marker oriented to heading for live map readability
- **Sidebar icon**: Lucide `ship` or Tabler `ship` for UI controls.[web:157][web:168]
- **Alternative static marker**: green outlined dot at low zoom, directional ship icon at higher zoom

#### Satellites
- **Map marker**: diamond or small crosshair + orbit ring for readability at small sizes
- **Sidebar icon**: Lucide `satellite` for satellite layer, or `satellite-dish` for SDR/ground-receiver contexts.[web:151][web:154]
- **Selected state**: orange marker with faint orbital pulse

#### Radio / Signals
- **Map marker**: concentric rings / radio-wave glyph / small antenna node
- **Sidebar icon**: radio-wave or dish icon from Phosphor/Lucide-style set
- **Signal schedule state**: muted when inactive, bright when active window is current

#### Threat / Intel Notes
- **Map marker**: pin with small shield or alert triangle
- **Sidebar icon**: shield / bug / radar depending on later scope

### Zoom-dependent icon strategy
- Low zoom: dots + tiny glyphs only
- Mid zoom: directional icons for flights and ships
- High zoom: labels + heading + richer hover cards

This avoids clutter and keeps the map readable.

---

## 10. Map Marker Recommendation Matrix

| Layer | Low zoom | Mid zoom | High zoom | Color |
|---|---|---|---|---|
| Flights | Small white dot | Rotated airplane glyph | Plane + callsign label | White / light cyan |
| Ships | Green dot | Bow-direction ship marker | Ship marker + vessel name | Green |
| Satellites | Orange dot/diamond | Satellite glyph | Satellite glyph + orbit info | Orange |
| Signals | Blue/cyan pulse dot | Radio node glyph | Radio node + freq label | Cyan |
| Threat notes | Red pin | Red pin + badge | Red pin + detail label | Red |

---

## 11. Good Open Symbol Sources

These are strong sources for assets and implementation reference:
- **Lucide**: clean open-source SVG icons with React examples, including satellite and ship icons.[web:151][web:157]
- **Phosphor Icons**: large modern icon family suitable for polished UI systems.[web:160][web:173]
- **Tabler Icons**: includes a ship icon and works well for outline-style controls.[web:168]
- **Bootstrap Icons**: open-source SVG icon set if you need extra generic controls.[web:146]
- **Open SVG Map Icons / CC0 map icons**: useful if you need public-domain map marker assets as a base.[web:147]
- **NATO / APP-6 style references**: useful for future threat or military overlays, but should be used carefully and consistently rather than mixed casually into the core civilian UI.[web:150]

---

## 12. Design Rules to Avoid “AI-generated look”

1. No excessive neon bloom
2. No random decorative HUD circles
3. No fake lens flares
4. No unnecessary gradients
5. Use a spacing system and consistent border radius
6. Use typography hierarchy to create seriousness
7. Keep icons from one main family, not five mixed styles
8. Put the polish into interaction states, not into visual noise

---

## 13. Stitch / Antigravity Guidance

Use this UI document as the persistent design reference.

### Important instruction for Antigravity
- Prefer **production SaaS realism** over concept-art aesthetics
- Keep the map as the hero element
- The right panel should feel information-dense but calm
- The left rail should feel like a tactical control strip
- Build the icon system so markers can evolve by zoom level
- Keep motion subtle and useful

### Iteration workflow
1. Upload reference screenshots
2. Ask Stitch to preserve the layout system from this document
3. Ask it to change only one axis at a time: typography, spacing, map styling, icon style, or panel density
4. Reject outputs that look overly cinematic or over-glowed

---

## 14. Future Reference Images to Upload

Best categories of reference images to collect:
- Flight tracker dashboards
- Trading terminals with strong panel density
- Dark GIS / map UIs
- Minimal admin dashboards
- Radar / tactical displays with restrained styling
- Real avionics / telemetry panels for information grouping inspiration

When reference images are uploaded later, extract from them:
- spacing rhythm
- chart density
- panel proportions
- button treatment
- label/value pair formatting
- how selected states are shown

---

## 15. Final UI Direction

**Short version:**
A dark, modern geospatial dashboard with a left-side tactical layer rail, a large Google-Maps-like center map, and a dense right-side details panel. The interface should look like a serious analyst tool, not a sci-fi concept render.

