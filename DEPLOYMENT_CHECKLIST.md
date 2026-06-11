# BlockCred Deployment Checklist

## Frontend: Vercel

- [ ] Add `REACT_APP_API_BASE_URL` on Vercel.
- [ ] Set `REACT_APP_API_BASE_URL` to the deployed backend URL.
- [ ] Add `REACT_APP_SEPOLIA_RPC_URL`.
- [ ] Run `npm run build` locally before deployment.
- [ ] Confirm Firebase authorized domains include the Vercel domain.
- [ ] Test `/`, `/login`, `/register-student`, `/dashboard`, `/public-verifier`, and `/payment/callback`.

## Backend: Railway/Render

- [ ] Add all backend environment variables on Railway/Render.
- [ ] Set `FRONTEND_URL` to the deployed Vercel URL.
- [ ] Set `SUPABASE_URL`.
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] Set Firebase Admin credentials.
- [ ] Set `SEPOLIA_RPC_URL`.
- [ ] Set `CONTRACT_ADDRESS`.
- [ ] Set payment environment variables.
- [ ] Use `npm start` as the start command.
- [ ] Confirm `/api/health` works after deployment.

## Supabase

- [ ] Run `backend/database/payments.sql`.
- [ ] Confirm the `certificates` storage bucket exists.
- [ ] Confirm the `students` table has `subscription_status`.
- [ ] Confirm the `students` table has `firebase_uid`, `student_id`, and `email`.
- [ ] Confirm the `certificates` table has certificate ID, student fields, PDF URL/storage path, PDF hash, transaction hash, and revocation fields.
- [ ] Keep the service role key backend-only.

## Firebase

- [ ] Enable Email/Password authentication.
- [ ] Add deployed frontend domain to authorized domains.
- [ ] Confirm admin custom claims use `role: "admin"`.
- [ ] Confirm student accounts can register and link to approved student records.
- [ ] Confirm Firebase Admin credentials are configured only on the backend.

## Payment

- [ ] Keep `PAYMENT_PROVIDER=mock` for demos only.
- [ ] Disable or protect `POST /api/payments/mock-confirm/:reference` before production.
- [ ] Later configure Notch Pay or CamPay using official provider documentation.
- [ ] Add real webhook signature verification before accepting production payment updates.
- [ ] Confirm inactive students cannot access certificates until payment activation.

## Final Smoke Test

- [ ] Admin login works.
- [ ] Student registration works.
- [ ] Certificate issuing works on Sepolia.
- [ ] Certificate revocation works on Sepolia.
- [ ] Public verification works.
- [ ] Student dashboard works for active students.
- [ ] Payment-required screen works for inactive/pending students.
- [ ] Mock payment flow works in demo mode.
