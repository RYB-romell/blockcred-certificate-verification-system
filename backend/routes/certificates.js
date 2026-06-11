// backend/routes/certificates.js

import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";

import {
  uploadSingleCertificate,
  recoverCertificateUpload,
  getAllCertificates,
  getCertificateStats,
  getStudentCertificates,
  getCertificateById,
  revokeCertificate,
} from "../controllers/certificatesController.js";

import {
  requireAuth,
  requireAdminRole,
  requireSelfOrAdminByParam,
} from "../middleware/authMiddleware.js";

const router = express.Router();

const uploadDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDir);
  },

  filename: (req, file, callback) => {
    const timestamp = Date.now();
    const safeOriginalName = file.originalname
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9._-]/g, "");

    callback(null, `${timestamp}-${safeOriginalName}`);
  },
});

const fileFilter = (req, file, callback) => {
  const isPdf =
    file.mimetype === "application/pdf" ||
    file.originalname.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    callback(new Error("Only PDF certificate files are allowed."));
    return;
  }

  callback(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

/**
 * Health check
 * GET /api/certificates/health
 */
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Certificates route is working.",
  });
});

/**
 * Admin certificate dashboard routes
 *
 * GET /api/certificates
 * GET /api/certificates/stats
 */
router.get("/", requireAuth, requireAdminRole, getAllCertificates);

router.get("/stats", requireAuth, requireAdminRole, getCertificateStats);

/**
 * Admin certificate upload
 *
 * POST /api/certificates/upload
 * FormData field name: pdf
 */
router.post(
  "/upload",
  requireAuth,
  requireAdminRole,
  upload.single("pdf"),
  uploadSingleCertificate
);

/**
 * Admin certificate recovery upload
 * Used when blockchain transaction succeeds but database upload/save fails.
 *
 * POST /api/certificates/recover-upload
 * FormData field name: pdf
 */
router.post(
  "/recover-upload",
  requireAuth,
  requireAdminRole,
  upload.single("pdf"),
  recoverCertificateUpload
);

/**
 * Student certificate access
 * Student can access own certificates.
 * Admin can access all.
 *
 * GET /api/certificates/student-certificates/:studentIdentifier
 */
router.get(
  "/student-certificates/:studentIdentifier",
  requireAuth,
  requireSelfOrAdminByParam("studentIdentifier"),
  getStudentCertificates
);

/**
 * Public certificate verifier
 * This must stay below fixed routes like /stats and /student-certificates.
 *
 * GET /api/certificates/:certId
 */
router.get("/:certId", getCertificateById);

/**
 * Admin revocation route
 *
 * POST /api/certificates/:certId/revoke
 */
router.post("/:certId/revoke", requireAuth, requireAdminRole, revokeCertificate);

export default router;