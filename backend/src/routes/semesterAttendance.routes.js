import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import requireRole from "../middlewares/role.middleware.js";

import {
    getSemesterSeatingForAttendance,
    getSemesterSavedAttendance,
    saveSemesterAttendanceDraft,
    submitSemesterAttendance
} from "../controllers/semesterAttendance.controller.js";

const router = express.Router();

/* ================= SEATING ================= */
router.get(
    "/seating/:semesterSlotId",
    authMiddleware,
    requireRole("FACULTY"),
    getSemesterSeatingForAttendance
);

/* ================= GET SAVED ATTENDANCE ================= */
router.get(
    "/attendance/:semesterSlotId",
    authMiddleware,
    requireRole("FACULTY"),
    getSemesterSavedAttendance
);

/* ================= SAVE DRAFT ================= */
router.post(
    "/attendance/draft",
    authMiddleware,
    requireRole("FACULTY"),
    saveSemesterAttendanceDraft
);

/* ================= SUBMIT ================= */
router.post(
    "/attendance/submit",
    authMiddleware,
    requireRole("FACULTY"),
    submitSemesterAttendance
);

export default router;