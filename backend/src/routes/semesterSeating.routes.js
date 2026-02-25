import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import requireRole from "../middlewares/role.middleware.js";
import {
  getSemesterSlots,
  createSemesterSlot,
  generateSemesterSeating,
  deleteSemesterSlot,
  viewSemesterSeating
} from "../controllers/semesterSeating.controller.js";

import { downloadSemesterSeatingPDF } from "../controllers/semesterSeating.controller.js";

import {
  downloadSemesterAttendancePDF,
  downloadSemesterAttendanceExcel,
  printSemesterAttendance
} from "../controllers/semesterAttendance.controller.js";

const router = express.Router();

router.get(
  "/slots",
  authMiddleware,
  requireRole("ADMIN"),
  getSemesterSlots
);

router.post(
  "/slots",
  authMiddleware,
  requireRole("ADMIN"),
  createSemesterSlot
);

router.post(
  "/generate",
  authMiddleware,
  requireRole("ADMIN"),
  generateSemesterSeating
);

router.get(
  "/view/:slotId",
  authMiddleware,
  requireRole("ADMIN"),
  viewSemesterSeating
);

router.delete(
  "/slots/:id",
  authMiddleware,
  requireRole("ADMIN"),
  deleteSemesterSlot
);

router.get(
  "/pdf/:slotId",
  authMiddleware,
  requireRole("ADMIN"),
  downloadSemesterSeatingPDF
);

router.get(
  "/attendance/pdf/:slotId",
  authMiddleware,
  requireRole("ADMIN"),
  downloadSemesterAttendancePDF
);

router.get(
  "/attendance/excel/:slotId",
  authMiddleware,
  requireRole("ADMIN"),
  downloadSemesterAttendanceExcel
);

router.get(
  "/attendance/print/:slotId",
  authMiddleware,
  requireRole("ADMIN"),
  printSemesterAttendance
);

export default router;