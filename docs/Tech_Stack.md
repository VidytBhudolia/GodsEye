# SENTINEL: Technical Architecture & Stack Document

**Version:** 1.0  
**Date:** March 27, 2026  
**Project:** Global OSINT Intelligence Tracker  
**Audience:** Development team, DevOps, architects

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React 18)                             │
│ ┌────────────────────────────────────────────────────────────────────┐  │
│ │ UI Layer (Tailwind CSS)                                            │  │
│ │  - Sidebar buttons, detail panel, top nav bar, status bar         │  │
│ └────────────────────────────────────────────────────────────────────┘  │
│ ┌────────────────────────────────────────────────────────────────────┐  │
│ │ Map Canvas Layer (MapLibre GL JS, dark tiles)                     │  │
│ │  - Pan, zoom, entity icons, route arcs, hover tooltips           │  │
│ └────────────────────────────────────────────────────────────────────┘  │
│ ┌────────────────────────────────────────────────────────────────────┐  │
│ │ State Management (Redux Toolkit)                                  │  │
│ │  - Entity positions, layer visibility, selected entity, cache    │  │
│ └────────────────────────────────────────────────────────────────────┘  │
│ ┌────────────────────────────────────────────────────────────────────┐  │
│ │ Cache Layer (IndexedDB, localStorage, service worker)            │  │
│ └────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓↑
            ┌───────────────────────────────────────────────┐
            │         BACKEND (Node.js / Express)            │
            │  ┌───────────────────────────────────────┐    │
            │  │ Data Adapter Layer                     │    │
            │  │  - AIS normalizer                     │    │
            │  │  - OpenSky normalizer                 │    │
            │  │  - TLE normalizer                     │    │
            │  │  - Radio signal normalizer            │    │
            │  └───────────────────────────────────────┘    │
            │  ┌───────────────────────────────────────┐    │
            │  │ Caching Layer (Redis)                 │    │
            │  │  - Position cache (5s TTL)           │    │
            │  │  - Entity details cache (24h TTL)    │    │
            │  │  - Search cache (1h TTL)             │    │
            │  └───────────────────────────────────────┘    │
            │  ┌───────────────────────────────────────┐    │
            │  │ Database (Supabase PostgreSQL)        │    │
            │  │  - Historical positions               │    │
            │  │  - Enrichment data (cargo, etc)      │    │
            │  │  - User annotations                   │    │
            │  └───────────────────────────────────────┘    │
            │  ┌───────────────────────────────────────┐    │
            │  │ LLM Integration (Groq + LangChain)    │    │
            │  │  - Web search tool                    │    │
            │  │  - Response caching                   │    │
            │  └───────────────────────────────────────┘    │
            └───────────────────────────────────────────────┘
                    ↓↑              ↓↑              ↓↑
        ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
        │  AIS Stream    │  │  OpenSky REST  │  │  TLE + Space   │
        │  WebSocket     │  │  OAuth2        │  │  Track REST    │
        │  (Ships)       │  │  (Aircraft)    │  │  (Satellites)  │
        └────────────────┘  └────────────────┘  └────────────────┘
        
        ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
        │ airplanes.live │  │ KiwiSDR Map    │  │ Priyom.org     │
        │ REST (Mil Air) │  │ JSON (Receivers)  │ Web Scrape     │
        │                │  │ (Radio)        │  │ (Signals)      │
        └────────────────┘  └────────────────┘  └────────────────┘
        
        ┌────────────────┐
        │ SerpAPI / Groq │
        │ Web Search API │
        │ (LLM context)  │
        └────────────────┘
```

---

## 2. Frontend Stack

### 2.1 Core Libraries

| Layer | Library | Version | Purpose |
|---|---|---|---|
| **Framework** | React | 18.2+ | UI component rendering |
| **Map Library** | MapLibre GL JS | 3.3+ | Dark matter basemap rendering, pan/zoom |
| **Entity Rendering** | custom Canvas/SVG | — | Plot ships, aircraft, satellites on map |
| **State Mgmt** | Redux Toolkit | 1.9+ | Global state (entities, layers, selection) |
| **API Calls** | Axios + TanStack Query | 5.x | HTTP requests with caching & auto-retry |
| **Styling** | Tailwind CSS | 3.3+ | Utility-first dark theme styling |
| **UI Components** | Radix UI / Headless UI | latest | Accessible modals, buttons, tooltips |
| **WebSocket** | Socket.io-client | 4.5+ | AIS Stream connection management |
| **Route Animation** | Three.js (optional) | 150+ | 3D bezier curve rendering for routes |
| **Satellite Math** | satellite.js | 1.5+ | TLE propagation → position calculation |
| **Local Cache** | idb-keyval | 6.x | IndexedDB wrapper for entity details |
| **Build Tool** | Vite | 4.3+ | Fast dev server, optimized prod build |
| **HTTP/2 Push** | Workbox | 6.x | Service worker for offline maps |

### 2.2 Frontend File Structure

```
frontend/
├── public/
│   ├── index.html
│   └── service-worker.js          # Offline basemap tiles, cache-first
├── src/
│   ├── components/
│   │   ├── Map/
│   │   │   ├── MapCanvas.jsx      # MapLibre + entity rendering
│   │   │   └── EntityOverlay.jsx  # SVG icons for ships/aircraft/satellites
│   │   ├── Sidebar/
│   │   │   ├── LayerToggle.jsx    # 5 rounded buttons
│   │   │   └── LayerMenu.jsx      # Hover tooltips
│   │   ├── DetailPanel/
│   │   │   ├── EntityCard.jsx     # Header + metadata
│   │   │   ├── RouteTimeline.jsx  # History list
│   │   │   ├── RouteMapStrip.jsx  # Mini inline map
│   │   │   └── AIAnalysis.jsx     # "Analyse with AI" section
│   │   ├── TopNav/
│   │   │   ├── Navbar.jsx         # Tabs + search
│   │   │   └── SearchBar.jsx      # Global search input
│   │   ├── StatusBar/
│   │   │   └── StatusBar.jsx      # Counts + coordinates + time
│   │   └── Layout/
│   │       └── MainLayout.jsx     # 3-panel wrapper
│   ├── state/
│   │   ├── store.js               # Redux store setup
│   │   ├── entitySlice.js         # Entity positions/details reducer
│   │   ├── layerSlice.js          # Layer visibility state
│   │   ├── uiSlice.js             # Selected entity, panel open state
│   │   └── cacheSlice.js          # Cached entity data TTL
│   ├── api/
│   │   ├── aisClient.js           # AIS Stream WebSocket manager
│   │   ├── openskySky.js          # OpenSky OAuth2 + REST polling
│   │   ├── airplanesLive.js       # airplanes.live REST polling
│   │   ├── tleClient.js           # TLE fetch + cache
│   │   ├── groqClient.js          # Groq LLM + LangChain wrapper
│   │   └── backendAPI.js          # Axios instance to own backend
│   ├── hooks/
│   │   ├── useMapBbox.js          # Current visible bbox
│   │   ├── useEntityClick.js      # Handle entity selection
│   │   ├── useCachedQuery.js      # TanStack Query with TTL
│   │   └── useLayerVisibility.js  # Layer toggle state
│   ├── utils/
│   │   ├── normalization.js       # Convert AIS/OpenSky/TLE → common schema
│   │   ├── routing.js             # Bezier curve math for route arcs
│   │   ├── satellite.js           # TLE propagation to position
│   │   ├── cache.js               # IndexedDB + localStorage helpers
│   │   └── constants.js           # API keys, color palette, thresholds
│   ├── styles/
│   │   ├── globals.css            # Tailwind + custom dark theme
│   │   ├── map.css                # MapLibre dark style overrides
│   │   └── animations.css         # Fade in, slide, pulse keyframes
│   ├── App.jsx                    # Root component
│   └── index.jsx                  # React DOM render
├── vite.config.js
├── tailwind.config.js
└── package.json
```

### 2.3 Frontend Dependencies (package.json excerpt)

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-redux": "^8.1.0",
    "@reduxjs/toolkit": "^1.9.5",
    "maplibre-gl": "^3.3.0",
    "@maplibre/maplibre-gl-layer-control": "^1.0.0",
    "axios": "^1.4.0",
    "@tanstack/react-query": "^5.0.0",
    "socket.io-client": "^4.5.0",
    "satellite.js": "^1.5.0",
    "idb-keyval": "^6.2.0",
    "tailwindcss": "^3.3.0",
    "@headlessui/react": "^1.7.0",
    "three": "^r150",
    "workbox-window": "^6.6.0"
  },
  "devDependencies": {
    "vite": "^4.3.0",
    "@vitejs/plugin-react": "^4.0.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

## 3. Backend Stack

### 3.1 Core Libraries & Services

| Component | Technology | Version | Purpose |
|---|---|---|---|
| **Runtime** | Node.js | 18 LTS+ | JavaScript runtime |
| **Web Framework** | Express | 4.18+ | HTTP server, REST endpoints |
| **WebSocket** | Socket.io | 4.5+ | Real-time data push to frontend |
| **Database** | Supabase (PostgreSQL 15) | — | Time-series + historical data |
| **GIS** | PostGIS extension | 3.3 | Geospatial queries (radius search, bbox) |
| **Cache** | Redis | 7+ | Fast in-memory cache for positions, queries |
| **Job Queue** | Bull | 4.x | Scheduled polling tasks (AIS, OpenSky, TLE) |
| **LLM Framework** | LangChain | 0.0.x | Groq integration + web search tool |
| **Web Scraping** | Cheerio | 1.0+ | Priyom HTML scraping (radio schedules) |
| **HTTP Client** | node-fetch / axios | latest | Make API calls to external services |
| **Validation** | Zod | 3.x | Schema validation for normalized entities |
| **Auth** | jsonwebtoken | 9.x | JWT for future user features |
| **Logging** | winston | 3.x | Structured logging |
| **Environment** | dotenv | 16.x | .env config management |

### 3.2 Backend Architecture

```
backend/
├── src/
│   ├── server.js                  # Express app entry point, Socket.io setup
│   ├── routes/
│   │   ├── entities.js            # GET /api/entities?bbox=..., /api/entities/:id
│   │   ├── search.js              # POST /api/search (global search)
│   │   ├── history.js             # GET /api/history/:entityId?hours=24
│   │   ├── analysis.js            # POST /api/analysis/:entityId (Groq trigger)
│   │   └── health.js              # GET /health (status check)
│   ├── services/
│   │   ├── adapters/
│   │   │   ├── AISAdapter.js      # Subscribe to AIS Stream WS, emit normalized
│   │   │   ├── OpenSkyAdapter.js  # Poll OpenSky REST, normalize
│   │   │   ├── TLEAdapter.js      # Fetch TLEs, cache 12h
│   │   │   ├── AirplanesLive.js   # Poll /mil endpoint, normalize
│   │   │   ├── RadioAdapter.js    # Scrape Priyom, poll KiwiSDR
│   │   │   └── Normalizer.js      # Convert all → common Entity schema
│   │   ├── cache/
│   │   │   ├── redisClient.js     # Redis connection, TTL logic
│   │   │   ├── entityCache.js     # Get/set entity positions
│   │   │   └── queryCache.js      # Cache API responses
│   │   ├── database/
│   │   │   ├── supabase.js        # Supabase client
│   │   │   ├── queries.js         # Prepared statements
│   │   │   └── migrations/        # DB schema
│   │   ├── llm/
│   │   │   ├── groqClient.js      # Groq API wrapper
│   │   │   ├── langchain.js       # LangChain agent setup
│   │   │   ├── webSearch.js       # Tool: web search via SerpAPI
│   │   │   └── summaries.js       # Cache + expire LLM outputs
│   │   └── external/
│   │       ├── aisstream.js       # SDK for AIS Stream WebSocket
│   │       ├── opensky.js         # OpenSky OAuth2 token management
│   │       ├── spacetrack.js      # Space-Track session cookie mgmt
│   │       └── kiwisdr.js         # KiwiSDR API client
│   ├── middleware/
│   │   ├── auth.js                # JWT validation (future)
│   │   ├── rateLimit.js           # Rate limiting per IP
│   │   ├── errorHandler.js        # Centralized error handling
│   │   └── logger.js              # Winston logging
│   ├── jobs/
│   │   ├── pollingJobs.js         # Bull queue for periodic polling
│   │   ├── aisPolling.js          # AIS subscription manager
│   │   ├── openskPolling.js       # OpenSky bbox poll every 10s
│   │   ├── airplanesPolling.js    # airplanes.live /mil every 15s
│   │   ├── tleFetch.js            # Fetch TLEs daily
│   │   └── radioScrape.js         # Scrape Priyom daily
│   ├── websocket/
│   │   ├── events.js              # Socket.io event handlers
│   │   ├── namespaces.js          # /live-view, /history namespaces
│   │   └── broadcast.js           # Emit entity updates to connected clients
│   ├── utils/
│   │   ├── math.js                # Haversine distance, bbox overlap
│   │   ├── time.js                # UTC, epoch conversions
│   │   ├── geo.js                 # PostGIS queries
│   │   └── constants.js           # API endpoints, thresholds, config
│   └── config/
│       ├── database.js            # Supabase config
│       ├── redis.js               # Redis config
│       ├── groq.js                # Groq API key, model selection
│       └── external.js            # External API credentials
├── migrations/
│   └── 001_initial_schema.sql     # PostgreSQL + PostGIS init
├── .env.example
├── server.js
└── package.json
```

### 3.3 Backend API Endpoints

| Method | Endpoint | Purpose | Rate Limit | Caching |
|---|---|---|---|---|
| GET | `/api/entities` | Fetch entities in bbox | 10 req/s per IP | Redis 10s |
| GET | `/api/entities/:id` | Single entity details | 60 req/min per IP | Redis 24h |
| GET | `/api/history/:entityId` | Position history (hours param) | 30 req/min | Supabase 1h |
| POST | `/api/search` | Global search (ID, name, callsign) | 10 req/s | Redis 1h |
| POST | `/api/analysis/:entityId` | Trigger Groq LLM analysis | 5 req/min | DB cache 6h |
| GET | `/api/filters` | Available filter options | 100 req/min | Memory, no expire |
| GET | `/health` | Status check | Unlimited | N/A |

### 3.4 Backend Environment Variables (.env)

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyXXX...
SUPABASE_SERVICE_KEY=eyXXX...

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=xxx

# AIS Stream
AIS_STREAM_API_KEY=YOUR_API_KEY

# OpenSky Network
OPENSKY_CLIENT_ID=vidbsocial-api-client
OPENSKY_CLIENT_SECRET=YOUR_OPENSKY_SECRET

# Space-Track
SPACETRACK_USERNAME=vidbsocial@gmail.com
SPACETRACK_PASSWORD=YOUR_SPACETRACK_PASSWORD

# Groq
GROQ_API_KEY=YOUR_GROQ_API_KEY

# SerpAPI (for web search)
SERPAPI_API_KEY=xxx

# Application
NODE_ENV=production
PORT=3000
FRONTEND_URL=http://localhost:5173
LOG_LEVEL=info
```

---

## 4. External APIs & Integration Details

### 4.1 AIS Stream (Ships) — WebSocket

**URL:** `wss://stream.aisstream.io/v0/stream`  
**Auth:** API key in connection message  
**Method:** Persistent WebSocket, subscription-based  
**Rate limit:** Unlimited subscriptions  
**Data freshness:** Near real-time (~5s lag)

**Integration Pattern:**
```javascript
// Backend maintains persistent connection
const ws = new WebSocket('wss://stream.aisstream.io/v0/stream');
ws.on('open', () => {
  ws.send(JSON.stringify({
    Apikey: AIS_STREAM_API_KEY,
    BoundingBoxes: [[[-90,-180],[90,180]]]  // Global or narrow to region
  }));
});
ws.on('message', (data) => {
  const aisMessage = JSON.parse(data);
  // Normalize → Redis → emit to Socket.io clients
  broadcastToClients(aisMessage);
});
```

**Message types used:**
- `PositionReport` (Type 1–3) → Lat, lon, speed, heading, status
- `ShipStaticData` (Type 5) → Name, IMO, callsign, type, dimensions, destination, ETA

**Filtering options:**
- `BoundingBoxes`: Subscribe to specific geographic regions only
- `FilterMessageTypes`: Only receive specific message types
- `FiltersShipMMSI`: Watch specific MMSI numbers

**Reference:** https://aisstream.io/documentation

---

### 4.2 OpenSky Network (Aircraft) — REST + OAuth2

**Base URL:** `https://api.opensky-network.org`  
**Auth:** OAuth2 Client Credentials Flow  
**Rate limit:** 4,000 credits/day; 1 credit per small bbox query, 4 credits for global  
**Data freshness:** ~10–30 seconds lag

**OAuth2 Token Exchange:**
```javascript
// POST https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token
const tokenResponse = await axios.post(tokenEndpoint, 
  `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`,
  { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
);
const accessToken = tokenResponse.data.access_token;
// Token expires in 30 minutes, auto-refresh before expiry
```

**Key Endpoints:**

| Endpoint | Use | Credits | Query Params |
|---|---|---|---|
| `GET /states/all` | Live aircraft in bbox | 1–4 | `lamin`, `lamax`, `lomin`, `lomax`, `time` |
| `GET /states/own` | Your ADS-B sensors | 0 | — |
| `GET /flights/all` | Flights in time window | 1 | `begin`, `end` |
| `GET /flights/aircraft` | Full history of one aircraft | 1 | `icao24` |
| `GET /tracks` | Waypoint trajectory | 1 | `icao24`, `time` |
| `GET /flights/arrival` | Arrivals at airport | 1 | `airport`, `begin`, `end` |
| `GET /flights/departure` | Departures from airport | 1 | `airport`, `begin`, `end` |

**Response fields** (from `/states/all`):
```
icao24, callsign, origin_country, latitude, longitude, baro_altitude, 
on_ground, velocity, true_track, vertical_rate, sensors, geo_altitude, 
squawk, spi, position_source, category, [timestamp]
```

**Polling Strategy:**
```javascript
// Poll every 10s, narrow bbox (e.g., Middle East: [20, 40, 60, 80])
setInterval(async () => {
  const query = 'lamin=20&lamax=40&lomin=40&lomax=80';
  const response = await axios.get(`https://api.opensky-network.org/states/all?${query}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  // Normalize states → Redis cache (10s TTL) → broadcast via Socket.io
}, 10000);
```

**Reference:** https://openskynetwork.github.io/opensky-api/rest.html

---

### 4.3 airplanes.live (Military Aircraft) — REST (No Auth)

**Base URL:** `http://api.airplanes.live/v2`  
**Auth:** None required  
**Rate limit:** 1 request/second  
**Data freshness:** Real-time  

**Key Endpoints:**

| Endpoint | Use | Example |
|---|---|---|
| `/point/[lat]/[lon]/[radius]` | Aircraft near coordinates | `/point/25.2048/55.2708/250` (Dubai, 250nm radius) |
| `/hex/[hex]` | Single aircraft by Mode S hex | `/hex/abcdef` |
| `/callsign/[callsign]` | Search by callsign | `/callsign/RCH` (US military airlift) |
| `/type/[type]` | All aircraft of type | `/type/B52` (B-52 bombers) |
| `/squawk/[squawk]` | Aircraft squawking code | `/squawk/7700` (emergencies) |
| `/mil` | All military aircraft (⭐ unique to airplanes.live) | `/mil` |
| `/ladd` | LADD-blocked civilian aircraft | `/ladd` |

**Response fields:**
```
hex, type, squawk, flight, reg, flag, lat, lon, alt, heading, speed, 
baro_rate, category, seen_pos, seen, [messages]
```

**Integration Pattern:**
```javascript
// Poll military aircraft every 15s
setInterval(async () => {
  const response = await axios.get('http://api.airplanes.live/v2/mil');
  const militaryAircraft = response.data;
  // Normalize → Redis → broadcast
}, 15000);
```

**Reference:** https://airplanes.live/api-guide/

---

### 4.4 TLE APIs (Satellites) — REST (No Auth)

**Primary: Ivan Stanojević TLE API**  
**URL:** `https://tle.ivanstanojevic.me/api/tle`  
**Auth:** None  
**Rate limit:** Unlimited  
**Data freshness:** Updated daily, cached 12h  

**Endpoints:**

| Endpoint | Use |
|---|---|
| `GET /api/tle?search=ISS` | Search by name |
| `GET /api/tle?search=STARLINK&page=1&page_size=50` | Paginate results |
| `GET /api/tle/25544` | Fetch specific satellite by NORAD ID |

**Response:**
```json
{
  "satelliteId": 25544,
  "name": "ISS",
  "date": "2026-03-27T00:00:00Z",
  "line1": "1 25544U 98067A   26087.00000000  .00016717  00000+0  29721-3 0  9990",
  "line2": "2 25544  51.6418 247.4627 0006703 130.5360 325.0288 15.54359921391050"
}
```

**Secondary: Space-Track (More Complete)**  
**URL:** `https://www.space-track.org/basicspacedata`  
**Auth:** Session cookie (username/password login)  
**Rate limit:** 500 requests/day  

**Query structure:**
```
/basicspacedata/query/class/satcat/COUNTRY/PRC/orderby/INTLDES
```

**Integration Pattern:**
```javascript
// Fetch TLEs once on startup, cache for 12 hours
const tles = await axios.get('https://tle.ivanstanojevic.me/api/tle?search=STARLINK&page_size=1000');
redis.set('tle_cache', JSON.stringify(tles), 'EX', 12*3600);

// Client-side: propagate TLE to position every 2s using satellite.js
import { twoline2satrec, propagate, eciToGeodetic } from 'satellite.js';
const satrec = twoline2satrec(line1, line2);
const positionAndVelocity = propagate(satrec, now);
const position = eciToGeodetic(positionAndVelocity.position, earthRadius);
// position.longitude, position.latitude
```

**Reference:** https://tle.ivanstanojevic.me/api/tle/

---

### 4.5 Radio Signals (Priyom, KiwiSDR) — HTML Scrape + REST

**Priyom.org (Numbers Stations)**  
- **URL:** https://priyom.org/number-stations
- **Method:** HTML scrape + parse (no API)
- **Frequency:** Daily scrape, cache results
- **Fields extracted:** Station name, frequency, mode, schedule, country

```javascript
// Cheerio-based scraper
const cheerio = require('cheerio');
const response = await axios.get('https://priyom.org/number-stations');
const $ = cheerio.load(response.data);
const stations = $('table tr').map(row => ({
  name: $(row).find('td:eq(0)').text(),
  frequency: $(row).find('td:eq(1)').text(),
  mode: $(row).find('td:eq(2)').text(),
  schedule: $(row).find('td:eq(3)').text()
})).get();
```

**KiwiSDR (Public Receivers)**  
- **URL:** http://kiwisdr.com/.public/
- **Method:** REST JSON, no auth
- **Frequency:** Fetch once on startup, ~5 min refresh
- **Response:** Array of receiver locations, coordinates, available frequency ranges

```json
[
  {
    "name": "KiwiSDR Dubai UAE",
    "url": "http://dubai.kiwisdr.com",
    "location": "Dubai, UAE",
    "lat": 25.2048,
    "lon": 55.2708,
    "url_open": true,
    "sdr_type": "3",
    "modes": "am,usb,cw,lsb"
  }
]
```

**Reference:** https://priyom.org | http://kiwisdr.com/.public/

---

### 4.6 Groq LLM + LangChain (Web Search Integration)

**Groq API Base:** `https://api.groq.com/openai/v1`  
**Auth:** Bearer token (API key)  
**Models:** `llama-3.3-70b-versatile`, `mixtral-8x7b-32768`, `llama-3.1-8b-instant`  
**Rate limit:** ~14,400 tokens/min (free tier)  

**LangChain + Function Calling Pattern:**
```javascript
const { ChatGroq } = require('@langchain/groq');
const { DynamicStructuredTool } = require('@langchain/core/tools');
const { AgentExecutor, createOpenAIFunctionsAgent } = require('langchain/agents');

// Define web search tool
const searchTool = new DynamicStructuredTool({
  name: 'web_search',
  description: 'Search the web for information about a vessel, aircraft, or satellite',
  func: async (input) => {
    const results = await axios.get('https://api.serpapi.com/search', {
      params: { q: input.query, api_key: SERPAPI_API_KEY }
    });
    return results.data.organic_results.map(r => r.snippet).join('\n');
  }
});

// Create LLM agent
const model = new ChatGroq({
  apiKey: GROQ_API_KEY,
  modelName: 'llama-3.3-70b-versatile'
});

const tools = [searchTool];
const agent = await createOpenAIFunctionsAgent({ llm: model, tools });
const agentExecutor = new AgentExecutor({ agent, tools });

// Invoke
const result = await agentExecutor.invoke({
  input: `Tell me about the vessel MV ATLANTIC PIONEER flagged to Malta. Include any sanctions or incidents.`
});
// Result includes function calls to web_search + final synthesis
```

**Integration Workflow:**
```
User clicks "Analyse with AI"
  → Entity data assembled (name, flag, type, position, destination)
    → Query cache: does entity_id have LLM summary <6h old?
      → YES: return cached summary (100ms)
      → NO: call Groq agent with entity data + web search
        → Agent decides if web search needed
          → If YES: search → inject results → synthesize
          → If NO: respond from LLM knowledge
        → Cache result 6h → return to frontend
```

**Reference:** https://console.groq.com/docs/langchain

---

## 5. Data Flow & Normalization

### 5.1 Common Entity Schema

Every entity (ship, aircraft, satellite, signal) normalizes to:

```javascript
{
  id: string,                              // MMSI (ship), ICAO24 (aircraft), NORAD (satellite)
  type: 'ship' | 'aircraft' | 'satellite' | 'signal',
  position: {
    lat: number,
    lon: number,
    alt_m: number                           // optional for aircraft/satellites
  },
  metadata: {
    name: string,
    country: string (ISO code),
    country_flag: string (emoji),
    entity_type: string,                    // 'bulk carrier', 'A350', 'ISS', '7910kHz numbers'
    speed_knots: number,
    heading_deg: number,
    status: 'active' | 'inactive'
  },
  current_route: {
    origin: string,
    destination: string,
    eta: ISO8601,
    waypoints: [[lat, lon], ...]
  },
  enrichment: {
    cargo_manifest: string,
    squawk_code: string,
    satellite_purpose: string
  },
  ai_summary: string,
  cached_at: ISO8601,
  cache_ttl_seconds: number
}
```

### 5.2 Adapter Flow Example (Ships)

```
AIS Stream WebSocket emits message type 5 (ShipStaticData)
  ↓
AISAdapter.js receives
  ↓
Extracts: MMSI, name, type, dimensions, IMO, destination, ETA
  ↓
Normalizer.js converts to schema:
  {
    id: MMSI,
    type: 'ship',
    metadata: {
      name: parsed_name,
      country: imoToCountry(IMO),
      entity_type: mapShipType(type_code),
      ...
    },
    current_route: {
      destination: parsed_destination,
      eta: parsed_eta
    }
  }
  ↓
Redis set with TTL (5 seconds for positions)
  ↓
Socket.io emit to all connected clients
  ↓
Frontend receives via Socket.io listener
  ↓
Redux dispatch action to update entitySlice
  ↓
Map re-renders with new position (fast batch update)
```

---

## 6. Database Schema (Supabase PostgreSQL + PostGIS)

### 6.1 Core Tables

```sql
-- Entities (one row per tracked object)
CREATE TABLE entities (
  id BIGSERIAL PRIMARY KEY,
  entity_id TEXT UNIQUE NOT NULL,        -- MMSI / ICAO24 / NORAD
  entity_type TEXT NOT NULL,             -- 'ship' | 'aircraft' | 'satellite' | 'signal'
  name TEXT,
  country TEXT,
  flag_emoji TEXT,
  current_position GEOMETRY(Point, 4326) NOT NULL,
  last_updated_at TIMESTAMP DEFAULT NOW(),
  cached_at TIMESTAMP,
  cache_ttl_seconds INT,
  metadata JSONB,                        -- Free-form enrichment data
  INDEX idx_entity_type (entity_type),
  INDEX idx_country (country)
);

-- Position history (append-only log)
CREATE TABLE position_history (
  id BIGSERIAL PRIMARY KEY,
  entity_id TEXT NOT NULL,
  position GEOMETRY(Point, 4326) NOT NULL,
  altitude_m INT,
  speed_knots NUMERIC,
  heading_deg NUMERIC,
  recorded_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (entity_id) REFERENCES entities(entity_id),
  INDEX idx_entity_recorded (entity_id, recorded_at DESC)
);

-- Routes
CREATE TABLE routes (
  id BIGSERIAL PRIMARY KEY,
  entity_id TEXT NOT NULL,
  origin TEXT,
  destination TEXT,
  waypoints GEOMETRY(LineString, 4326),
  eta TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (entity_id) REFERENCES entities(entity_id)
);

-- LLM summaries (cache)
CREATE TABLE ai_summaries (
  id BIGSERIAL PRIMARY KEY,
  entity_id TEXT NOT NULL,
  summary TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  UNIQUE(entity_id),
  FOREIGN KEY (entity_id) REFERENCES entities(entity_id)
);

-- Create PostGIS indices
CREATE INDEX idx_entities_position ON entities USING GIST(current_position);
CREATE INDEX idx_position_history_position ON position_history USING GIST(position);
```

### 6.2 Sample GIS Queries

```sql
-- Find all ships within 250km of coordinates (example: Strait of Hormuz)
SELECT * FROM entities 
WHERE entity_type = 'ship' 
  AND ST_DWithin(
    current_position, 
    ST_SetSRID(ST_MakePoint(56.5, 26.5), 4326)::geography, 
    250000  -- 250km in meters
  )
ORDER BY ST_Distance(current_position, ST_SetSRID(ST_MakePoint(56.5, 26.5), 4326)::geography);

-- Get position trail for one ship (last 24 hours)
SELECT position, recorded_at FROM position_history
WHERE entity_id = '123456789'  -- MMSI
  AND recorded_at > NOW() - INTERVAL '24 hours'
ORDER BY recorded_at;
```

---

## 7. Caching Strategy

### 7.1 Cache Layers & TTLs

| Layer | Type | TTL | Key Pattern | Hit Rate Target |
|---|---|---|---|---|
| Browser IndexedDB | Entity details, LLM summaries | 24h, 6h | `entity:${id}:details` | 90% |
| Browser localStorage | Layer visibility, saved views | Persistent | `ui:layer:flights` | 95% |
| Service Worker | Basemap tiles | 30 days | Map tile URLs | 80% |
| Redis (position) | Ship/aircraft live positions | 5–10s | `pos:${entity_id}` | 85% |
| Redis (query) | API response cache | 10–60s | `query:${hash}` | 70% |
| Supabase | Historical data | Permanent | Tables | N/A |

### 7.2 Cache Invalidation

```javascript
// Position updates from adapters → Redis write
redis.set(`pos:${entityId}`, JSON.stringify(newPosition), 'EX', 5);

// Expiry automatic via TTL
// On read, if TTL expired, fetch fresh from API

// Manual invalidation on user action
redis.del(`query:${searchHash}`);  // If user updates search filters
```

---

## 8. Deployment Architecture

### 8.1 Infrastructure Overview

```
                        ┌─────────────────────────┐
                        │  Vercel (Frontend)      │
                        │  - Static assets        │
                        │  - Auto-deploy on push  │
                        │  - CDN distribution     │
                        └────────────┬────────────┘
                                     ↓
┌────────────────────────────────────────────────────────────┐
│           Backend (Docker on Railway/Render)               │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Node.js + Express + Socket.io                        │ │
│  │  - All adapters (AIS, OpenSky, TLE, etc.)          │ │
│  │  - Groq LLM integration                             │ │
│  │  - Redis + Supabase clients                         │ │
│  └──────────────────────────────────────────────────────┘ │
└────────┬────────────────────────────────┬─────────────────┘
         ↓                                ↓
    ┌─────────────────┐         ┌─────────────────┐
    │  Redis Cloud    │         │ Supabase        │
    │  (Cache layer)  │         │ (PostgreSQL)    │
    │  30GB free tier │         │ 500MB free tier │
    └─────────────────┘         └─────────────────┘
```

### 8.2 Deployment Steps

1. **Frontend (Vercel):**
   ```bash
   npm run build
   vercel --prod
   ```

2. **Backend (Docker → Railway/Render):**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install --production
   COPY src ./src
   EXPOSE 3000
   CMD ["node", "src/server.js"]
   ```

3. **Environment Setup:**
   ```bash
   # Create .env on hosting platform dashboard
   SUPABASE_URL=...
   SUPABASE_KEY=...
   REDIS_URL=...
   GROQ_API_KEY=...
   # etc.
   ```

---

## 9. Monitoring & Logging

### 9.1 Key Metrics to Track

| Metric | Tool | Alert Threshold |
|---|---|---|
| API response latency | Datadog / New Relic | >500ms P95 |
| Cache hit ratio | Redis INFO | <70% |
| WebSocket connection drops | Socket.io stats | >5 per minute |
| Groq API failures | Error logs | >2% of requests |
| Database query latency | Supabase metrics | >1000ms P95 |
| Frontend Time to Interactive | Vercel Analytics | >3s |

### 9.2 Logging Setup (Winston)

```javascript
const winston = require('winston');
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Usage
logger.info('AIS Stream connected');
logger.error('OpenSky API failed', { statusCode: 429, bbox });
```

---

## 10. Security Considerations

### 10.1 API Key Management

- Store all secrets in environment variables (never commit to repo)
- Rotate Groq API key annually
- Monitor Space-Track / OpenSky account for unusual activity
- Use `.env.example` as template for developers

### 10.2 Frontend Security

- No API keys in frontend code — all external API calls via backend proxy
- Implement CORS whitelisting on backend
- Use Content Security Policy headers
- Validate & sanitize all user search inputs

### 10.3 Data Privacy

- Position data is from public broadcasts (AIS, ADS-B) — no additional privacy concerns
- Cache historical data only for analytics, not personally identifiable info
- GDPR: no user registration = no personal data stored

---

**Document Owner:** Architecture Team  
**Last Updated:** March 27, 2026  
**Next Review:** After MVP deployment