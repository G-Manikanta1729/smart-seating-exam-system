import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import requireRole from "../middlewares/role.middleware.js";

import {
  saveAttendanceDraft,
  submitAttendance,
  getSavedAttendance
} from "../controllers/attendance.controller.js";

const router = express.Router();

router.post(
  "/draft",
  authMiddleware,
  requireRole("FACULTY"),
  saveAttendanceDraft
);

router.post(
  "/submit",
  authMiddleware,
  requireRole("FACULTY"),
  submitAttendance
);

router.get(
  "/:examType/:examId",
  authMiddleware,
  requireRole("FACULTY"),
  getSavedAttendance
);

export default router;