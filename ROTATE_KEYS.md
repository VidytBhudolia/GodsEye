## Keys requiring manual rotation
- GROQ_API_KEY: exposed in docs/Tech_Stack.md (git history)
  -> Rotate at: https://console.groq.com/keys
- OPENSKY_CLIENT_SECRET: exposed in docs/Tech_Stack.md
  -> Rotate at: https://opensky-network.org/my-opensky
- SPACETRACK_PASSWORD: exposed in docs/Tech_Stack.md
  -> Rotate at: https://www.space-track.org/auth/login

Instructions: after rotating, update .env locally and update environment variables on Railway (backend) and Vercel (frontend).
