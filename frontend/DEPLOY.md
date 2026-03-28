# GodsEye Frontend Deployment (Vercel)

## 1. Prerequisites
- Vercel account and project linked to this `frontend/` directory.
- Reachable backend service URL (HTTP/S) for socket and REST endpoints.

## 2. Environment Variables
Configure the following variable in Vercel project settings:

- `NEXT_PUBLIC_BACKEND_URL`
  - Example: `https://api.your-domain.com`
  - Local fallback is `http://localhost:4000` when not provided.

For local development, copy values from `.env.local.example`.

## 3. Build Configuration
This project is configured for standalone output:
- `next.config.ts` uses `output: "standalone"`.
- `vercel.json` uses:
  - `installCommand`: `npm install`
  - `buildCommand`: `npm run build`

## 4. Deploy Steps
1. Push changes to your Git provider branch.
2. Import/connect repository in Vercel.
3. Set `Root Directory` to `frontend`.
4. Add `NEXT_PUBLIC_BACKEND_URL` in project environment variables.
5. Trigger deployment.

## 5. Post-Deploy Validation
- Open the deployed app.
- Verify socket connection status in status bar.
- Verify route history and AI analysis requests resolve against backend.
- Verify alerts panel loads and marks alerts read.
