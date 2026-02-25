import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import requireRole from "../middlewares/role.middleware.js";

/* CONTROLLERS */
import {
  getFacultyDashboard,
  saveFacultyAllocation,
  getFaculty,
  getFacultyAllocation,
  deleteFacultyAllocation,
  createFaculty,
  updateFaculty,
  toggleFaculty,
  deleteFacultyPermanent,
  getFacultySeatingView,
  getFacultySemesterSeating
} from "../controllers/faculty.controller.js";

/*  VERY IMPORTANT: router must be defined FIRST */
const router = express.Router();

/* ================= FACULTY DASHBOARD ================= */
router.get(
  "/dashboard",
  authMiddleware,
  requireRole("FACULTY"),
  getFacultyDashboard
);

/* ================= FACULTY SEATING VIEW ================= */
router.get(
  "/seating/:examId",
  authMiddleware,
  requireRole("FACULTY"),
  getFacultySeatingView
);

/* ================= FACULTY ALLOCATION (ADMIN) ================= */

// SAVE / UPDATE FACULTY ALLOCATION
router.post(
  "/allocation",
  authMiddleware,
  requireRole("ADMIN"),
  saveFacultyAllocation
);

// DELETE FACULTY ALLOCATION
router.delete(
  "/allocation",
  authMiddleware,
  requireRole("ADMIN"),
  deleteFacultyAllocation
);

// GET ROOM-WISE FACULTY ALLOCATION
router.get(
  "/allocation",
  authMiddleware,
  requireRole("ADMIN"),
  getFacultyAllocation
);

/* ================= FACULTY CRUD (ADMIN) ================= */

// GET FACULTY LIST
router.get(
  "/",
  authMiddleware,
  requireRole("ADMIN"),
  getFaculty
);

// CREATE FACULTY
router.post(
  "/",
  authMiddleware,
  requireRole("ADMIN"),
  createFaculty
);

// UPDATE FACULTY
router.put(
  "/:id",
  authMiddleware,
  requireRole("ADMIN"),
  updateFaculty
);

// TOGGLE FACULTY ACTIVE
router.patch(
  "/:id/toggle",
  authMiddleware,
  requireRole("ADMIN"),
  toggleFaculty
);

// DELETE FACULTY PERMANENT
router.delete(
  "/:id",
  authMiddleware,
  requireRole("ADMIN"),
  deleteFacultyPermanent
);

/* ================= FACULTY SEMESTER SEATING (ADMIN) ================= */
router.get(
  "/semester-seating/:slotId",
  authMiddleware,
  requireRole("ADMIN"),
  getFacultySemesterSeating
);

export default router;