import express from "express";
import {
  getStudents,
  addStudent,
  updateStudent,
  toggleStudent,
  deleteStudentPermanent,
} from "../controllers/admin.controller.js";
import auth from "../middlewares/auth.middleware.js";
import role from "../middlewares/role.middleware.js";
import { getDashboardStats } from "../controllers/admin.controller.js";


const router = express.Router();

router.get("/students", auth, role("ADMIN"), getStudents);
router.get(
  "/dashboard-stats", auth, role("ADMIN"), getDashboardStats);

router.post("/students", auth, role("ADMIN"), addStudent);
router.put("/students/:id", auth, role("ADMIN"), updateStudent);
router.patch("/students/:id/toggle", auth, role("ADMIN"), toggleStudent);
router.delete("/students/:id", auth, role("ADMIN"), deleteStudentPermanent);


export default router;
