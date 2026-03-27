# SENTINEL: Claude Skills & Capabilities Reference

**Version:** 1.0  
**Date:** March 27, 2026  
**Project:** Global OSINT Intelligence Tracker  
**Purpose:** Leverage Claude via Anthropic Skills in Antigravity for AI-assisted development

---

## 1. Recommended Claude Skills for This Project

### Skill 1: "Codebase Analyzer"

**Purpose:** Understand and refactor existing code, suggest optimizations  
**Use Cases for SENTINEL:**

- **Code Review:** Ask Claude to review adapter code (AIS, OpenSky normalizers) for memory leaks or inefficient loops
  - *Example prompt:* "Review this AIS adapter code for performance issues when handling 50,000 simultaneous position updates per second."
  
- **Architecture Questions:** Ask Claude about Redux state design, WebSocket error handling patterns
  - *Example prompt:* "Should I store all historical positions in Redux, or only last N positions? How does this affect re-renders?"

- **Bug Hunting:** Feed Claude error logs from browser console or backend logs
  - *Example prompt:* "I'm getting 'Cannot read property "lat" of undefined' in my entity normalizer. Help me trace the issue."

**How to invoke in Antigravity:**
```
/claude codebase-analyzer
Analyze my adapter layer code for bottlenecks in MapLibre re-renders 
when 10,000+ entities update simultaneously.
```

---

### Skill 2: "SQL Query Optimizer"

**Purpose:** Write and optimize database queries, understand PostGIS  
**Use Cases for SENTINEL:**

- **Geospatial Queries:** Write efficient PostGIS queries for "ships within 250km of point" or "all satellites passing over region in next 2 hours"
  - *Example prompt:* "Write a PostGIS query to find all ships currently within the Persian Gulf (26°N–27.5°N, 50°E–56.5°E) and their distance to nearest port."

- **Performance Tuning:** Analyze query execution plans, recommend indices
  - *Example prompt:* "This query against position_history takes 3 seconds for 24 hours of data. Optimize it. Explain the execution plan."

- **Time-series Aggregation:** Build reports (e.g., "most active shipping lanes last week")
  - *Example prompt:* "Write a query to find the 10 most congested shipping routes (highest vessel density) last week, returning route origin-destination pairs ranked by average concurrent vessels."

**How to invoke:**
```
/claude sql-optimizer
I need a PostGIS query that finds all aircraft currently at FL350 
(35,000 feet) over Europe and groups them by origin country.
```

---

### Skill 3: "API Integration Helper"

**Purpose:** Understand external APIs, write integration code, debug authentication  
**Use Cases for SENTINEL:**

- **OAuth2 Debugging:** Help troubleshoot OpenSky OAuth2 token refresh failures
  - *Example prompt:* "My OpenSky token refresh fails with 'invalid_grant'. Is there a time sync issue?"

- **WebSocket Connection Management:** Write robust AIS Stream reconnection logic
  - *Example prompt:* "Write a resilient AIS Stream WebSocket handler with exponential backoff reconnection, heartbeat ping, and graceful degradation if connection dies."

- **Rate Limit Management:** Implement smart polling strategies to avoid hitting rate limits
  - *Example prompt:* "I have 4,000 credits/day for OpenSky. I want to poll 5 different bboxes simultaneously. How should I distribute polling frequency to maximize coverage while staying under quota?"

- **Groq + LangChain Integration:** Debug LLM agent tool calling issues
  - *Example prompt:* "My Groq agent is not calling the web_search tool even when I give it a query that needs web context. Debug the LangChain setup."

**How to invoke:**
```
/claude api-integration
Write a helper function to manage OpenSky OAuth2 tokens. 
It should auto-refresh 5 minutes before expiry and handle 
failed refresh attempts with exponential backoff.
```

---

### Skill 4: "Frontend Performance Coach"

**Purpose:** Optimize React rendering, reduce bundle size, improve UX  
**Use Cases for SENTINEL:**

- **Redux State Shape:** Decide best way to store 50,000 entity positions without causing re-render thrashing
  - *Example prompt:* "I'm rendering 50,000 ship icons on the map. Every position update from Redis triggers a Redux action. Should I batch updates or use a different state structure?"

- **MapLibre Layer Updates:** Optimize map re-renders when entities move
  - *Example prompt:* "What's the best way to update 10,000 entity positions on a MapLibre canvas every 5 seconds without re-creating layer objects?"

- **Component Memoization:** Know when to use React.memo, useMemo, useCallback
  - *Example prompt:* "Should I memoize the EntityCard detail panel? It receives 20 props. Will memoization help or hurt performance?"

- **Vite Bundle Analysis:** Understand where bloat comes from
  - *Example prompt:* "My Vite bundle is 2.5MB. Analyze why. Should I code-split the detail panel? Use dynamic imports?"

**How to invoke:**
```
/claude frontend-performance
My map pan/zoom is stuttering at 30fps instead of 60fps. 
The DevTools shows EntityOverlay component re-rendering 
on every position update. How do I fix this?
```

---

### Skill 5: "Security & Privacy Auditor"

**Purpose:** Review security practices, validate data handling  
**Use Cases for SENTINEL:**

- **API Key Security:** Verify no secrets are exposed in frontend code
  - *Example prompt:* "I'm building a Groq LLM integration. How should I proxy LLM calls through my backend to avoid exposing the Groq API key?"

- **Data Privacy:** Ensure compliance with any applicable regulations
  - *Example prompt:* "I'm caching historical vessel positions for 7 days. Is there any privacy concern with storing public AIS data? Any retention limits I should implement?"

- **WebSocket Security:** Validate authentication on Socket.io events
  - *Example prompt:* "How should I secure my Socket.io connection so only authenticated users receive entity position updates? Should I validate on each message?"

- **Environment Variable Leaks:** Catch accidental secret exposure
  - *Example prompt:* "Audit my .env.example for any accidentally-committed secrets or hints that could help an attacker."

**How to invoke:**
```
/claude security-auditor
Does my frontend expose the Groq API key? Review my 
groqClient.js and tell me if it's secure.
```

---

### Skill 6: "Documentation & API Spec Writer"

**Purpose:** Generate docs, write API specs, create runbooks  
**Use Cases for SENTINEL:**

- **OpenAPI / Swagger Spec:** Generate REST API documentation
  - *Example prompt:* "Write an OpenAPI 3.0 spec for my backend endpoints: GET /entities, GET /entities/:id, POST /analysis/:entityId"

- **Database Schema Docs:** Document tables and relationships
  - *Example prompt:* "Document the position_history table, including indices, typical query patterns, and retention policies."

- **Deployment Runbook:** Write step-by-step deployment guide
  - *Example prompt:* "Write a runbook for deploying SENTINEL backend to Railway.dev, including env vars, health checks, and rollback procedures."

- **User Guide:** Write end-user documentation
  - *Example prompt:* "Write a 2-page user guide for SENTINEL. Include: how to toggle layers, search for a vessel, click to see details, use AI analysis, and interpret the route timeline."

**How to invoke:**
```
/claude docs-writer
Generate an OpenAPI 3.0 spec for all my REST endpoints 
and export it as a JSON file I can import into Swagger UI.
```

---

### Skill 7: "Data & Analytics"

**Purpose:** Understand data flows, optimize queries, build reports  
**Use Cases for SENTINEL:**

- **Cache Hit Rate Analysis:** Understand cache performance
  - *Example prompt:* "My Redis cache has an 82% hit ratio for positions and 65% for queries. Is this good? Where should I focus optimization?"

- **Data Volume Projections:** Estimate storage needs
  - *Example prompt:* "If I store 7 days of position history for 50,000 ships, each updating every 5 seconds, how much disk space do I need in Supabase?"

- **Rate Limit Allocation:** Optimize API credit usage
  - *Example prompt:* "I want to poll 5 geographic regions with OpenSky (4,000 credits/day budget). How often can I poll each region?"

- **Anomaly Detection:** Design algorithms to find unusual activity
  - *Example prompt:* "How would I design an algorithm to detect when a ship suddenly goes offline (AIS transponder off) in a strategic region?"

**How to invoke:**
```
/claude data-analytics
Calculate: if I poll OpenSky every 10 seconds over a 
500×500km bbox, how many credits do I use per day?
```

---

### Skill 8: "System Design Interviewer"

**Purpose:** Validate architecture, scale to 100K users, identify bottlenecks  
**Use Cases for SENTINEL:**

- **Scale Questions:** How to handle 10x current load
  - *Example prompt:* "If I suddenly get 1,000 concurrent users (vs. today's ~10), what breaks first? How do I scale?"

- **Bottleneck Analysis:** Identify what limits growth
  - *Example prompt:* "Which is my biggest bottleneck: AIS Stream bandwidth, Redis memory, Supabase DB connections, or frontend render perf?"

- **Architecture Review:** Validate design decisions
  - *Example prompt:* "I'm using Socket.io to broadcast position updates to all clients. Is this the best approach for 50K entities? Should I switch to Server-Sent Events or WebRTC?"

- **Failover & Resilience:** Design high availability
  - *Example prompt:* "My AIS Stream connection is single-point-of-failure. How should I add redundancy?"

**How to invoke:**
```
/claude system-design
Design how to scale SENTINEL to support 10,000 concurrent 
users without the backend falling over.
```

---

## 2. Claude Skills Workflow in Antigravity

### Workflow Example: "Fix Map Performance"

```
You (in Antigravity):
"My map is stuttering when panning with 20K entities visible. 
Fix the performance."

Antigravity → Claude Frontend Performance Coach:
  - Claude analyzes your MapCanvas.jsx and EntityOverlay.jsx
  - Identifies: EntityOverlay re-rendering on every state change
  - Suggests: useMemo for entity array, React.memo for entity icons
  - Provides code fix

Antigravity Agent:
  - Applies changes to your codebase
  - Re-runs Vite build
  - Sends you a performance comparison screenshot

You:
"That helped, but still not 60fps. Let me also memoize the 
position state selector."

Antigravity → Claude:
  - Reviews new code
  - Confirms memoization approach
  - Tests with mock 50K dataset
  - Confirms 60fps achieved
```

---

## 3. Prompts for Each Phase of Development

### Phase 1 (MVP Setup) — Weeks 1–2

**Skill:** API Integration Helper + Codebase Analyzer  
**Prompts to use:**

1. "Set up a robust AIS Stream WebSocket connection with auto-reconnect, heartbeat, and error logging."
2. "Write OpenSky OAuth2 token manager. Auto-refresh 5 min before expiry."
3. "Create an entity normalizer that converts AIS, OpenSky, and TLE data into a common schema."
4. "How should I structure Redux state to handle 50K entities without memory bloat?"

---

### Phase 2 (Route Visualization) — Weeks 3–4

**Skill:** Frontend Performance Coach + API Integration Helper  
**Prompts to use:**

1. "Implement bezier curve rendering for route arcs. How do I compute great-circle waypoints?"
2. "Optimize map re-renders when entity routes update. Should I use a separate layer?"
3. "Implement the flight history timeline UI. How should I paginate past routes?"
4. "Debug why my Groq web_search tool isn't being called by the agent."

---

### Phase 3 (Advanced Features) — Weeks 5–6

**Skill:** Data & Analytics + SQL Query Optimizer  
**Prompts to use:**

1. "Write a PostGIS query to find anomalies: ships that went offline in the last hour."
2. "Build a report: top 10 busiest shipping lanes last week. How do I define 'busyness'?"
3. "Optimize my position_history query. Currently takes 3s for 24 hours of data."
4. "Design a threat-score algorithm: what makes a vessel 'suspicious'?"

---

### Phase 4 (Deployment & Scale) — Weeks 7+

**Skill:** System Design Interviewer + Security Auditor  
**Prompts to use:**

1. "Design SENTINEL for 10,000 concurrent users. What scales and what doesn't?"
2. "Audit my security: are there any API key leaks or data privacy issues?"
3. "Write a production deployment runbook for Railway.dev."
4. "Implement rate limiting on my REST endpoints. What are reasonable limits?"

---

## 4. How to Access Claude Skills in Antigravity

### Via Chat Input (Easiest)

```
@claude /codebase-analyzer <your query>
```

Example:
```
@claude /sql-optimizer
Write a query to find all satellites with high 
eccentricity (e > 0.5) passing over the Arctic 
Circle tomorrow.
```

### Via Code Generation

Ask Antigravity to generate code using specific Claude skills:

```
Generate a backend adapter for airplanes.live API. 
Claude should:
1. Use api-integration skill for connection management
2. Use codebase-analyzer skill to fit into existing normalizer pattern
3. Include error handling and rate limiting
```

### Via Performance Analysis

```
Use frontend-performance skill to analyze my bundle:
- Run `npm run build`
- Show me the breakdown
- Recommend code splits
```

---

## 5. Expected Output from Claude Skills

### From Codebase Analyzer
```
✓ Code review findings:
  - 3 potential memory leaks in event listeners
  - Suggestion: Add cleanup in useEffect return
  - Performance: EntityOverlay re-renders 1000x/sec (expected: 60x)

✓ Suggested refactoring:
  - Use useMemo for position selector
  - Memoize entity icon component
  - Batch Redux updates via requestAnimationFrame
```

### From SQL Optimizer
```
✓ Optimized query:
  - Original: 3.2 seconds
  - Optimized: 150 milliseconds (21x faster)
  - Reason: Added composite index on (entity_id, recorded_at)
  - Expected cardinality: 2.3M rows returned

✓ Execution plan analysis:
  [Seq Scan → Filter → Limit 10]
  ↓
  [Index Scan → Limit 10]
```

### From API Integration Helper
```
✓ Robust OAuth2 token manager:
  - Auto-refresh 5 min before expiry
  - Retry failed refreshes with exponential backoff (1s, 2s, 4s)
  - Handle 429 (rate limit) with queue
  - Tested against OpenSky rate limits

✓ Connection reliability: ~99.5% uptime expected
```

---

## 6. Best Practices When Using Claude Skills

| Practice | Why | Example |
|---|---|---|
| **Be specific** | Vague prompts = vague answers | ✓ "My MapLibre layer updates 10K entities/sec and fps drops to 20. Fix." vs. ✗ "Map is slow." |
| **Provide context** | Claude needs to understand constraints | ✓ "I have 4,000 credits/day OpenSky budget" vs. ✗ "Poll OpenSky faster" |
| **Include code snippets** | Claude can fix bugs faster with reference | ✓ Paste the problematic function vs. ✗ "My adapter is broken" |
| **Ask follow-ups** | Iterative refinement beats one-shot answers | ✓ "Good start. Now add exponential backoff." vs. ✗ "Done, moving on" |
| **Test suggestions** | Claude can be wrong; validate | ✓ "Tried your query. It's 40% faster, not 80%. Why?" |
| **Document findings** | Build team knowledge | ✓ "Claude says use useMemo for position selector. Here's the PR link." |

---

## 7. Skills Not to Over-Use (Watch Out For)

| Skill | Risk | Mitigation |
|---|---|---|
| Security Auditor | May suggest over-engineering | Get a second opinion on compliance needs |
| System Design | May suggest over-architecture for MVP | Remember: simple first, optimize later |
| Frontend Performance | May suggest premature optimization | Profile first, then optimize the hot path |
| SQL Optimizer | May suggest complex queries | Test query performance in production-scale test data |

---

## 8. Summary: Skills by Project Phase

| Phase | Primary Skills | Secondary Skills |
|---|---|---|
| **Phase 1 (Setup)** | API Integration Helper, Codebase Analyzer | Frontend Performance Coach |
| **Phase 2 (Routes)** | Frontend Performance Coach, Codebase Analyzer | API Integration Helper |
| **Phase 3 (Features)** | Data & Analytics, SQL Optimizer | Security Auditor |
| **Phase 4 (Deploy)** | System Design, Security Auditor | Data & Analytics |
| **Ongoing** | Documentation Writer (for runbooks & guides) | All others as needed |

---

**Document Owner:** Development Team  
**Last Updated:** March 27, 2026  
**Next Sync:** After MVP launch