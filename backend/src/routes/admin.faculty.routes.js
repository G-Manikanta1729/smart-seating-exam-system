import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import requireRole from "../middlewares/role.middleware.js";
import {
  getFacultyAllocation,
  saveFacultyAllocation,
  deleteFacultyAllocation
} from "../controllers/faculty.controller.js";

const router = express.Router();

/* GET room-wise allocation */
router.get(
  "/faculty/allocation",
  authMiddleware,
  requireRole("ADMIN"),
  getFacultyAllocation
);

/* SAVE allocation */
router.post(
  "/faculty/allocation",
  authMiddleware,
  requireRole("ADMIN"),
  saveFacultyAllocation
);

/* DELETE allocation */
router.delete(
  "/faculty/allocation",
  authMiddleware,
  requireRole("ADMIN"),
  deleteFacultyAllocation
);

export default router;
