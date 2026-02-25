import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import requireRole from "../middlewares/role.middleware.js";
import {
  getStudentProfile,
  updateStudentProfile,
  getStudentDashboard,
  getStudentNotifications,
} from "../controllers/student.controller.js";

const router = express.Router();

router.get(
  "/profile",
  authMiddleware,
  requireRole("STUDENT"),
  getStudentProfile
);

router.put(
  "/profile",
  authMiddleware,
  requireRole("STUDENT"),
  updateStudentProfile
);

router.get(
  "/dashboard",
  authMiddleware,
  requireRole("STUDENT"),
  getStudentDashboard
);

router.get(
  "/notifications",
  authMiddleware,
  requireRole("STUDENT"),
  getStudentNotifications
);

export default router;
