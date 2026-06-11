import express from "express";
import { getActivityLogs } from "../controllers/activityLogsController.js";
import {
  requireAdminRole,
  requireAuth,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", requireAuth, requireAdminRole, getActivityLogs);

export default router;
