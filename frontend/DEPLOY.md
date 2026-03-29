## Vercel Deployment Steps
1. Go to vercel.com -> New Project -> Import GitHub repo
2. Set root directory to /frontend
3. Framework preset: Next.js (auto-detected)
4. Add environment variable:
   NEXT_PUBLIC_BACKEND_URL = https://your-railway-url.railway.app
   (get this from the backend Railway deployment)
5. Click Deploy
6. Vercel auto-deploys on every push to main branch

## Local .env.local for development
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
