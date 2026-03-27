# SENTINEL: Complete Project Kickoff Package

**Date:** March 27, 2026  
**Status:** Ready for Sprint Planning & Development  
**Prepared for:** Antigravity Development Platform

---

## 📦 What You Have

This package contains three comprehensive documents for building SENTINEL:

### 1. **SENTINEL_PRD.md** (Product Requirements Document)
   - Complete feature list and user stories
   - UI/UX specifications (colors, typography, layout)
   - Phasing & MVP definition
   - Success metrics
   - Open questions for stakeholder alignment

### 2. **SENTINEL_Tech_Stack.md** (Technical Architecture)
   - Full system architecture (frontend, backend, data flow)
   - API integrations with exact endpoints and authentication methods
   - Database schema (PostgreSQL + PostGIS)
   - Caching strategies
   - Deployment architecture
   - Security considerations

### 3. **SENTINEL_Claude_Skills.md** (AI-Assisted Development)
   - 8 recommended Claude skills for each development phase
   - Concrete prompts you can use with Antigravity
   - Expected outputs from Claude
   - Best practices for working with AI co-pilot

---

## 🎯 How to Use These Documents

### Before You Start Coding (Day 1)
1. **Read:** SENTINEL_PRD.md cover to cover
2. **Align:** Any questions? Use Section 8 "Open Questions" to get stakeholder sign-off
3. **Understand:** The target is Phase 1 MVP (Weeks 1–2) — don't plan for Phase 4 yet

### Architecture Review (Day 1–2)
1. **Read:** SENTINEL_Tech_Stack.md Sections 1–3 (Frontend & Backend overview)
2. **Validate:** Do you have enough compute? (yes — all free/cheap services)
3. **Familiarize:** External APIs (AIS, OpenSky, TLE) — sign up during day 2 morning
4. **Plan:** Set up Supabase and Redis

### Development Setup (Day 2–3)
1. **Credentials Ready:** Collect all API keys (you have them already)
2. **Use Claude Skills:** Ask Antigravity to scaffold the project structure
3. **Reference Tech Stack:** Keep Section 2 (Frontend Stack) and Section 3 (Backend Stack) open for library versions & file structure

### Throughout Development (Weeks 1–6)
1. **Use Claude Skills:** Reference SENTINEL_Claude_Skills.md for prompts matching your current phase
2. **Check PRD:** When uncertain about requirements, refer to the user stories and acceptance criteria
3. **Check Tech Stack:** When uncertain about integration, jump to the appropriate API section

---

## 🚀 Immediate Next Steps (This Week)

### Day 1: Project Setup
- [ ] Create GitHub repository
- [ ] Set up Vercel project for frontend
- [ ] Set up Railway.dev or Render for backend
- [ ] Create Supabase project
- [ ] Set up Redis Cloud account (free tier 30GB)

### Day 2: Credentials & Environment
- [ ] Verify all API credentials work:
  - [ ] AIS Stream API key test connection
  - [ ] OpenSky OAuth2 token refresh works
  - [ ] Groq API key test inference
  - [ ] TLE API responds
  - [ ] Space-Track login works
- [ ] Create `.env.example` with blanks for team
- [ ] Create `.env` locally with your credentials

### Day 3: Scaffolding with Antigravity
Use these prompts in Antigravity:

```
1. "Using Vite + React 18 + Redux Toolkit + MapLibre GL JS, 
   scaffold the SENTINEL frontend project structure. 
   Create all necessary folders from SENTINEL_Tech_Stack.md Section 3.2"

2. "Create a Node.js + Express backend scaffold for SENTINEL.
   Include services/adapters, middleware, Socket.io setup.
   Use the folder structure from SENTINEL_Tech_Stack.md Section 3.2"

3. "Generate React components for:
   - MapCanvas (MapLibre GL container)
   - LayerToggle (5 rounded buttons)
   - DetailPanel (slides in on click)
   - StatusBar (bottom entity counts)"
```

### Day 4–5: First Feature (AIS)
Use these prompts:

```
1. "Implement AISAdapter.js: 
   - Connect to AIS Stream WebSocket
   - Subscribe to bounding box (use global bbox initially)
   - Normalize messages to common Entity schema
   - Emit to Socket.io clients"

2. "Create entitySlice.js (Redux):
   - State shape: entities = { [entityId]: { position, metadata, ... } }
   - Reducer: addEntity, updatePosition, deleteEntity
   - Selector: selectVisibleEntities(bbox)"

3. "Render ships on MapCanvas:
   - For each ship in Redux state, add a green dot SVG icon
   - On hover, show tooltip
   - On click, populate DetailPanel"
```

---

## 📊 Success Criteria for Each Phase

### Phase 1 (MVP) — End of Week 2
- [ ] Map renders with dark basemap
- [ ] 5,000+ ships visible and updating every 5 seconds
- [ ] Click ship → detail panel shows name, flag, position, speed
- [ ] Layer toggles work (enable/disable layers instantly)
- [ ] No user authentication required (public access)
- [ ] Deploys to Vercel (frontend) + Railway (backend)

### Phase 2 — End of Week 4
- [ ] Aircraft layer with OpenSky data
- [ ] Route arc visualization (white line from origin to destination)
- [ ] Flight history timeline (last 5 routes clickable)
- [ ] "Analyse with AI" button triggers Groq LLM

### Phase 3 — End of Week 6
- [ ] HISTORY tab (playback of past N hours)
- [ ] REPORTS tab (summary stats)
- [ ] ALERTS tab (notifications)
- [ ] Service worker (offline basemap)

---

## 💡 Key Architecture Decisions Already Made

| Decision | Rationale | Flexibility |
|---|---|---|
| **MapLibre GL JS** (not CesiumJS) | Lower complexity, sufficient for MVP, free | Can swap if satellite accuracy becomes critical |
| **Redux Toolkit** (not Zustand) | Larger ecosystem, DevTools, more examples | Established pattern, not critical to swap |
| **Supabase** (not Firebase) | PostgreSQL + PostGIS needed for spatial queries | Critical for geo queries; don't change |
| **Socket.io** (not WebSub) | Bidirectional, built-in reconnection | Adequate; can optimize later with binary protocol |
| **Groq** (not OpenAI) | Free tier, fast latency, good for real-time | Can change; only LLM layer affected |
| **Passive polling** (not active alerts) | Simpler, matches free tier constraints | Deferred to Phase 4 |

---

## 🔒 Security Notes Before Day 1

1. **Never commit .env to Git** — use .env.example as template
2. **API Keys in backend only** — frontend makes requests via backend proxy
3. **AIS/ADS-B data is public** — no privacy concerns, but don't re-sell
4. **Groq key rotation** — plan annual rotation
5. **Space-Track ToS** — data for research only, no commercial use

---

## 📞 Common Questions You'll Ask

**Q: Should I use the Cloud versions of Redis/Supabase or self-host?**  
A: Cloud versions for MVP (easier, no DevOps burden). Switch to self-hosted only if costs become prohibitive (unlikely in free tier).

**Q: How many concurrent users can SENTINEL handle?**  
A: MVP designed for ~10–50 concurrent users. Phase 4 focuses on 1,000+ scaling.

**Q: Should I cache everything or just hot data?**  
A: Cache strategy from Tech Stack Section 7 is proven. Start with it; optimize after profiling.

**Q: Can I use a different map library?**  
A: Yes, but you'll rewrite MapCanvas component. MapLibre chosen for balance of simplicity + power.

**Q: How do I deploy without downtime?**  
A: Railway/Render handle zero-downtime deploys automatically. Vercel does for frontend.

---

## 🎓 Learning Resources (Reference During Dev)

| Topic | Resource | Time |
|---|---|---|
| Redux Toolkit | https://redux-toolkit.js.org/usage/usage-guide | 30 min |
| MapLibre GL JS | https://maplibre.org/maplibre-gl-js/docs/ | 1 hour |
| Socket.io | https://socket.io/docs/ | 30 min |
| PostGIS | https://postgis.net/docs/manual-3.3/ | 2 hours |
| Groq LLM | https://console.groq.com/docs/text-chat | 30 min |
| LangChain | https://python.langchain.com/ (or JS) | 1 hour |

---

## 📈 Performance Targets

| Metric | Target | Measurement |
|---|---|---|
| Time to First Meaningful Paint | <2.5s | Lighthouse |
| Entity Click → Detail Panel | <300ms | DevTools Network |
| Map Pan/Zoom | 60fps | Chrome DevTools |
| Position Update Latency | <5s (ships), <10s (aircraft) | Backend logs |
| Cache Hit Ratio | >80% | Redis INFO |
| Concurrent Users (MVP) | 10–50 without degradation | Load test |

---

## 🏁 Definition of Done (Before Phase 2)

**Phase 1 is complete when:**

1. ✅ Vercel deployment URL is live and responsive
2. ✅ 10,000+ ships rendering on map
3. ✅ Click ship → detail panel with name, flag, speed, position
4. ✅ Layer toggles enable/disable instantly (no refetch)
5. ✅ Status bar shows live counts
6. ✅ Caching working: revisit same bbox in 5s, data served from Redis
7. ✅ No console errors in production
8. ✅ <2.5s time to interactive
9. ✅ All user stories (US-001 through US-008) have passing acceptance tests
10. ✅ 0 regressions from main branch

---

## 🎬 Now You're Ready

You have:
- ✅ **PRD:** What to build (features, UX, success metrics)
- ✅ **Tech Stack:** How to build it (libraries, APIs, architecture)
- ✅ **Claude Skills:** Who to ask (AI co-pilot prompts for each phase)

**Next step:** Open Antigravity, paste the Claude Skills prompt for Phase 1 Day 3, and start scaffolding.

**Recommended timeline:** 
- Scaffold & setup: Days 1–3
- AIS integration: Days 4–5
- OpenSky + TLE: Week 2
- UI/Details/Caching: Week 2
- Deploy: End of Week 2

Good luck! 🚀

---

**Questions?** Refer back to the three docs in this order: PRD → Tech Stack → Claude Skills.

**Document Owner:** OSINT Intelligence Team  
**Last Updated:** March 27, 2026  
**Next Review:** After MVP launch, week 3 of development