import express from "express";
import { downloadReport, printReport, getRecentDownloads } from "../controllers/report.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/download", authMiddleware, downloadReport);
router.get("/print", authMiddleware, printReport);
router.get("/recent", authMiddleware, getRecentDownloads);

export default router;
