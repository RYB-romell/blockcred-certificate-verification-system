# BlockCred Deployment Guide

This guide prepares BlockCred for:

- Frontend on Vercel
- Backend on Railway
- Database and storage on Supabase
- Authentication on Firebase
- Blockchain verification on Ethereum Sepolia

Real CamPay/Notch Pay payment integration is reserved for a later phase.

## A. Supabase

1. Open your Supabase project.
2. Go to SQL Editor.
3. Run these SQL files from `backend/database/`:
   - `payments.sql`
   - `activity_logs.sql`
   - `institution_settings.sql`
4. Confirm these tables exist:
   - `students`
   - `certificates`
   - `payments`
   - `activity_logs`
   - `institution_settings`
5. Confirm certificate PDF storage bucket access matches the backend upload behavior.

Keep `SUPABASE_SERVICE_ROLE_KEY` backend-only. Do not add it to Vercel.

## B. Firebase

1. Enable Email/Password Authentication.
2. Add the Vercel frontend domain to Firebase authorized domains if needed.
3. Configure admin users with custom claims such as `role: "admin"`.
4. Student users can use the default student role unless your auth flow sets a role claim.
5. Add Firebase Admin credentials only to Railway backend environment variables.

## C. Railway Backend

1. Create a Railway service for the backend.
2. Set the service root directory to `backend` if Railway is deploying from the monorepo.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add backend environment variables from `backend/.env.example`.
6. Set deployment values:
   - `NODE_ENV=production`
   - `FRONTEND_URL=https://your-vercel-app.vercel.app`
   - `CORS_ORIGINS=https://your-vercel-app.vercel.app`
   - `SUPABASE_URL=...`
   - `SUPABASE_SERVICE_ROLE_KEY=...`
   - `FIREBASE_PROJECT_ID=...`
   - `FIREBASE_CLIENT_EMAIL=...`
   - `FIREBASE_PRIVATE_KEY=...`
   - `SEPOLIA_RPC_URL=...`
   - `CONTRACT_ADDRESS=...`
7. Confirm the health endpoint works:
   - `https://your-railway-backend.up.railway.app/api/health`

Expected health response includes:

```json
{
  "success": true,
  "message": "BlockCred API is running",
  "environment": "production",
  "timestamp": "..."
}
```

## D. Vercel Frontend

1. Import the project into Vercel.
2. Set the project root to the repository root.
3. Build command: `npm run build`
4. Output directory: `build`
5. Add frontend environment variables from `.env.example`.
6. Set:
   - `REACT_APP_API_BASE_URL=https://your-railway-backend.up.railway.app`
   - `REACT_APP_SEPOLIA_RPC_URL=...`
   - Firebase public config variables.

Never add backend secrets, service role keys, or Firebase private keys to Vercel.

## E. Sepolia

1. Use the current deployed Sepolia contract address in backend `CONTRACT_ADDRESS`.
2. Use a reliable Sepolia RPC URL for:
   - Backend `SEPOLIA_RPC_URL`
   - Frontend `REACT_APP_SEPOLIA_RPC_URL`
3. Confirm MetaMask is connected to Sepolia before issuing or revoking certificates.
4. Confirm the admin wallet owns or can call the contract functions.

## F. Production Safety

1. Set `NODE_ENV=production` on Railway.
2. Use `PAYMENT_PROVIDER=mock` only for local demos/testing.
3. In production, set `ALLOW_MOCK_PAYMENT_CONFIRM=false` or omit it.
4. Do not expose mock confirmation to public users.
5. Real CamPay/Notch Pay integration comes later.
6. Keep email in `EMAIL_PROVIDER=console` until a real provider is implemented.
7. Keep all secrets in Railway backend environment variables only.

## Final Smoke Test

1. Open the Vercel app.
2. Confirm login/register pages load.
3. Confirm public verifier can reach the Railway backend.
4. Confirm `/api/health` returns success.
5. Confirm admin pages load after Firebase admin login.
6. Confirm certificate issuance still requires MetaMask on Sepolia.
7. Confirm inactive students still see payment-required access.
