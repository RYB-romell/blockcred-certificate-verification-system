// backend/routes/students.js

import express from "express";

import {
  precheckStudent,
  linkFirebaseAccount,
  getStudentByEmail,
  getCurrentStudentProfile,
  updateCurrentStudentProfile,
  getAllStudents,
  createStudent,
  updateStudent,
  deleteStudent,
} from "../controllers/studentsController.js";

import {
  requireAuth,
  requireAdminRole,
  requireSelfOrAdminByParam,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * Health check
 * GET /api/students/health
 */
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Students route is working.",
  });
});

/**
 * Public student registration precheck
 * Used before creating Firebase account.
 *
 * POST /api/students/precheck
 */
router.post("/precheck", precheckStudent);

/**
 * Link approved student record to Firebase account
 * Requires logged-in Firebase user.
 *
 * POST /api/students/link-firebase
 */
router.post("/link-firebase", requireAuth, linkFirebaseAccount);

/**
 * Logged-in student profile
 *
 * GET   /api/students/me
 * PATCH /api/students/me
 */
router.get("/me", requireAuth, getCurrentStudentProfile);

router.patch("/me", requireAuth, updateCurrentStudentProfile);

/**
 * Admin-only student management
 *
 * GET    /api/students
 * POST   /api/students
 * PATCH  /api/students/:id
 * DELETE /api/students/:id
 */
router.get("/", requireAuth, requireAdminRole, getAllStudents);

router.post("/", requireAuth, requireAdminRole, createStudent);

router.patch("/:id", requireAuth, requireAdminRole, updateStudent);

router.delete("/:id", requireAuth, requireAdminRole, deleteStudent);

/**
 * Get student record by email
 * A student can only access their own record.
 * Admin can access any student record.
 *
 * GET /api/students/:email
 */
router.get(
  "/:email",
  requireAuth,
  requireSelfOrAdminByParam("email"),
  getStudentByEmail
);

export default router;
