import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import studentRoutes from "./routes/student.routes.js";
import facultyRoutes from "./routes/faculty.routes.js";
import adminFacultyRoutes from "./routes/admin.faculty.routes.js";
import roomRoutes from "./routes/room.routes.js";
import examRoutes from "./routes/exam.routes.js";
import seatingRoutes from "./routes/seating.routes.js";
import reportRoutes from "./routes/report.routes.js";
import semesterSeatingRoutes from "./routes/semesterSeating.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import semesterAttendanceRoutes from "./routes/semesterAttendance.routes.js";

import db from "./db/db.js";

dotenv.config();

const app = express();
/*const reportRoutes = require("./routes/report.routes");*/

app.use(
  cors({
    origin: "https://smart-exam-seating-and-attendance-m.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());

app.use(express.json());
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/admin", adminFacultyRoutes);  // admin allocation
app.use("/api/admin", roomRoutes);
app.use("/api/admin", examRoutes);
app.use("/api/admin/seating", seatingRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin/semester-seating", semesterSeatingRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/faculty/semester", semesterAttendanceRoutes);

// DB test
db.query("SELECT 1", () => {
  console.log("✅ MySQL connected");
});

app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

export default app;