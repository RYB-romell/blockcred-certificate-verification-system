import express from "express";
import {
  getInstitutionSettings,
  updateInstitutionSettings,
} from "../controllers/institutionSettingsController.js";
import {
  requireAdminRole,
  requireAuth,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getInstitutionSettings);
router.patch("/", requireAuth, requireAdminRole, updateInstitutionSettings);

export default router;
