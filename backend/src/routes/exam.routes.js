import express from "express";
import {
  getExams,
  addExam,
  updateExam,
  toggleExam,
  deleteExamPermanent,
} from "../controllers/exam.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import requireRole from "../middlewares/role.middleware.js";
import { getUpcomingExams } from "../controllers/exam.controller.js";


const router = express.Router();

/* ================= EXAMS ROUTES ================= */

// GET all exams
router.get(
  "/exams",
  authMiddleware,
  requireRole("ADMIN"),
  getExams
);

// GET upcoming exams (dashboard)
router.get(
  "/exams/upcoming",
  authMiddleware,
  requireRole("ADMIN"),
  getUpcomingExams
);


// CREATE exam
router.post(
  "/exams",
  authMiddleware,
  requireRole("ADMIN"),
  addExam
);

// UPDATE exam
router.put(
  "/exams/:id",
  authMiddleware,
  requireRole("ADMIN"),
  updateExam
);

// TOGGLE exam (delete / restore)
router.patch(
  "/exams/:id/toggle",
  authMiddleware,
  requireRole("ADMIN"),
  toggleExam
);

// DELETE exam permanently
router.delete(
  "/exams/:id",
  authMiddleware,
  requireRole("ADMIN"),
  deleteExamPermanent
);


export default router;
