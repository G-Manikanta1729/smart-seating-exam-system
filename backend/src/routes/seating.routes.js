import express from "express";
import {
  generateSeating,
  getSeatingByExam,
  undoDeleteSeating,
  exportSeatingPDF
} from "../controllers/seating.controller.js";

import auth from "../middlewares/auth.middleware.js";
import role from "../middlewares/role.middleware.js";
import { deleteSeating } from "../controllers/seating.controller.js";

const router = express.Router();

// Generate seating
router.post(
  "/:examId/generate",
  auth,
  role("ADMIN"),
  generateSeating
);

// View seating (allow ADMIN or FACULTY)
router.get("/:examId", auth, (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  if (req.user.role !== "ADMIN" && req.user.role !== "FACULTY")
    return res.status(403).json({ message: "Access denied" });
  next();
}, getSeatingByExam);

// Undo seating
router.post(
  "/:examId/undo",
  auth,
  role("ADMIN"),
  undoDeleteSeating
);

// Export PDF
router.get(
  "/:examId/pdf",
  auth,
  role("ADMIN"),
  exportSeatingPDF
);

// Delete seating (soft delete)
router.delete(
  "/:examId",
  auth,
  role("ADMIN"),
  deleteSeating
);

export default router;
