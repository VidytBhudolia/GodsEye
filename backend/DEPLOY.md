## Railway Deployment Steps
1. Go to railway.app and create a new project from the GitHub repository.
2. Select the repository and set the root directory to /backend.
3. Add all environment variables from backend/.env.example with real values:

SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_SERVICE_KEY=

REDIS_URL=
REDIS_PASSWORD=

AISSTREAM_API_KEY=
AIS_STREAM_API_KEY=

OPENSKY_USERNAME=
OPENSKY_EMAIL=
OPENSKY_PASSWORD=
OPENSKY_CLIENT_SECRET=

SPACETRACK_USERNAME=
SPACETRACK_PASSWORD=

GROQ_API_KEY=
FIRECRAWL_API_KEY=
SERPAPI_API_KEY=

PORT=
FRONTEND_URL=
LOG_LEVEL=

OPENSKY_BBOX_LAMIN=
OPENSKY_BBOX_LAMAX=
OPENSKY_BBOX_LOMIN=
OPENSKY_BBOX_LOMAX=
OPENSKY_POLLING_INTERVAL_MS=
OPENSKY_VIEWPORT_STALE_MS=

ENTITY_BATCH_FLUSH_MS=
ENTITY_BATCH_MAX_SIZE=
ENTITY_BATCH_BUFFER_MAX=

4. Railway auto-deploys on every push to the main branch.
5. Copy the Railway URL (for example https://godseye-backend.railway.app) and set it as NEXT_PUBLIC_BACKEND_URL in Vercel frontend environment variables.
