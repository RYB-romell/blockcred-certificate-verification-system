// backend/routes/payments.js

import express from "express";

import {
  getAdminPaymentRecords,
  getMyPaymentHistory,
  getPaymentStatus,
  initiatePayment,
  mockConfirmPayment,
  paymentWebhook,
} from "../controllers/paymentsController.js";

import {
  requireAdminRole,
  requireAuth,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/initiate", requireAuth, initiatePayment);

router.get("/my-history", requireAuth, getMyPaymentHistory);

router.get("/admin-records", requireAuth, requireAdminRole, getAdminPaymentRecords);

router.get("/status/:reference", requireAuth, getPaymentStatus);

// Mock/local testing only. Do not expose this route in production with a real payment gateway.
router.post("/mock-confirm/:reference", mockConfirmPayment);

// Public placeholder for future real payment gateway webhooks.
router.post("/webhook", paymentWebhook);

export default router;
