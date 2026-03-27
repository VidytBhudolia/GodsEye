# GodsEye — Real-Time OSINT Map Dashboard

Global situational awareness platform tracking ships, aircraft, satellites, and radio signals on a unified dark-mode map with AI-powered intelligence summaries.

## Prerequisites

- Node.js 20+
- npm 9+

## Setup

```bash
# 1. Clone the repository
git clone https://github.com/vidbsocial/godseye.git
cd godseye

# 2. Copy environment template and fill in your API keys
cp .env.example .env

# 3. Install and start the frontend
cd frontend
npm install
npm run dev
# → http://localhost:3000

# 4. Install and start the backend (new terminal)
cd backend
npm install
npm run dev
# → http://localhost:4000
# Health check: GET http://localhost:4000/health
```

## Project Structure

```
GodsEye/
├── frontend/          # Next.js 14 App Router (TypeScript + Tailwind)
├── backend/           # Express + Socket.io (TypeScript)
├── docs/              # PRD, Tech Stack, UI Spec, Screenshots
├── .env.example       # Environment template
└── README.md
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, MapLibre GL JS |
| Backend | Node.js, Express, Socket.io, TypeScript |
| Database | Supabase (PostgreSQL + PostGIS) |
| Cache | Redis |
| LLM | Groq + LangChain |

## License

Private — All rights reserved.
