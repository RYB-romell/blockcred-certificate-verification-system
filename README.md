# BlockCred

BlockCred is a blockchain-based certificate issuance and verification system. It lets an institution issue PDF certificates, store certificate hashes on Ethereum Sepolia, manage students, and give students payment-controlled access to their verified credentials.

## Project Overview

BlockCred combines a React frontend, Node.js/Express backend, Firebase Authentication, Supabase database/storage, and a Sepolia smart contract. Admins issue certificates after hashing the PDF, students access their dashboard after registration and payment activation, and anyone can verify a certificate publicly.

## Tech Stack

- React with Create React App
- Node.js and Express
- Firebase Authentication and Firebase Admin
- Supabase database and storage
- ethers.js
- MetaMask
- Ethereum Sepolia test network
- Bootstrap, React Icons, and QR code rendering

## Main Features

- Admin certificate issuance
- PDF SHA-256 hashing before blockchain submission
- Blockchain storage of certificate hash
- Public certificate verification
- Certificate revocation
- Student registration linked to approved student records
- Student certificate dashboard
- Payment-controlled certificate access
- Mock payment flow for local testing
- Provider structure for future Notch Pay or CamPay integration

## Folder Structure

```text
.
├── backend/
│   ├── controllers/
│   ├── database/
│   ├── middleware/
│   ├── routes/
│   ├── services/paymentProviders/
│   ├── index.js
│   └── .env.example
├── contracts/
├── public/
├── scripts/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── api.js
│   ├── blockchain.js
│   └── contract.js
├── .env.example
└── DEPLOYMENT_CHECKLIST.md
```

## Local Setup

1. Install frontend dependencies:

```bash
npm install
```

2. Install backend dependencies:

```bash
cd backend
npm install
```

3. Copy environment examples:

```bash
copy .env.example .env
copy backend\.env.example backend\.env
```

4. Start the backend:

```bash
cd backend
npm start
```

5. Start the frontend:

```bash
npm start
```

## Supabase Setup

- Create a Supabase project.
- Create/configure the `students` and `certificates` tables expected by the backend.
- Confirm `students` includes `student_id`, `email`, `firebase_uid`, and `subscription_status`.
- Confirm the `certificates` table stores certificate metadata, PDF URLs, PDF hashes, transaction hashes, and revocation fields.
- Create a public storage bucket named `certificates`.
- Run `backend/database/payments.sql` in the Supabase SQL Editor to create the `payments` table.
- Use `SUPABASE_SERVICE_ROLE_KEY` only on the backend.

## Firebase Setup

- Enable Email/Password authentication.
- Add local and deployed frontend domains to Firebase authorized domains.
- Configure Firebase Admin credentials in `backend/.env`.
- Set custom claims for admin users, for example `role: "admin"`.
- Student users default to the student role if no role claim is present.

## Blockchain/Sepolia Setup

- Deploy `contracts/BlockCred.sol` to Sepolia.
- Set `CONTRACT_ADDRESS` in backend deployment variables.
- Update `src/contract.js` only when intentionally changing the deployed frontend contract address.
- Set `SEPOLIA_RPC_URL` on the backend for server-side checks.
- Set `REACT_APP_SEPOLIA_RPC_URL` on the frontend for public verification.
- Keep MetaMask connected to Sepolia when issuing or revoking certificates.

## Payment Setup

- Local/demo mode uses `PAYMENT_PROVIDER=mock`.
- Run `backend/database/payments.sql` before testing payments.
- Inactive or pending students cannot access certificates.
- `POST /api/payments/initiate` creates a pending mock payment.
- `POST /api/payments/mock-confirm/:reference` confirms mock payments for local demos.
- Mock payments are for development only. In production, set `PAYMENT_PROVIDER` to `notchpay` or `campay`, set `ALLOW_MOCK_PAYMENT_CONFIRM=false`, and do not expose mock confirmation to public users.
- Real Notch Pay and CamPay providers are placeholders until official API details and webhook verification are added.

## Email Notifications

- Certificate issued emails use `EMAIL_PROVIDER=console` by default.
- In console mode, email content is logged by the backend for development and demos.
- Configure real provider credentials only in backend environment variables when SMTP, SendGrid, Resend, Mailgun, Brevo, or another provider is implemented.
- Email delivery failure does not block certificate issuance.

## Frontend Deployment On Vercel

For the full deployment walkthrough, see `DEPLOYMENT_GUIDE.md`.

- Deploy the project root to Vercel.
- Add `REACT_APP_API_BASE_URL` with the deployed backend URL.
- Add `REACT_APP_SEPOLIA_RPC_URL` with an Infura or Alchemy Sepolia RPC URL.
- Use `npm run build` as the build command.
- Confirm Firebase authorized domains include the Vercel domain.

## Backend Deployment On Railway/Render

- Deploy the `backend/` folder or configure the service root to `backend`.
- Use `npm start` to run `node index.js`.
- Add `FRONTEND_URL` with the deployed Vercel URL.
- Add Supabase, Firebase Admin, Sepolia, contract, payment, and email environment variables.
- Confirm `/api/health` returns a successful JSON response.

## Environment Variables

Frontend variables are documented in `.env.example`.

Backend variables are documented in `backend/.env.example`.

Never commit real `.env` files. Keep Supabase service role keys and Firebase private keys backend-only.

## Testing Checklist

- Frontend builds with `npm run build`.
- Backend syntax check passes with `npm run check` from `backend/`.
- Admin can issue a certificate.
- Admin can revoke a certificate.
- Public verifier can find and compare certificate records.
- Student registration precheck and Firebase linking work.
- Inactive student sees the payment-required screen.
- Mock payment can move a student from inactive to pending to active.
- Active student can view certificates, QR codes, PDF links, verification links, search, and filters.

## Production TODOs

- Disable or protect mock payment confirmation.
- Add real Notch Pay or CamPay integration using official API documentation.
- Verify real payment webhooks with provider signatures/secrets.
- Move any hardcoded frontend contract config into a controlled deployment process.
- Add monitoring/logging for backend errors.
- Add automated tests for certificate, student, payment, and verification flows.
