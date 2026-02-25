import express from "express";
import {
  getRooms,
  getRoomStats,
  addRoom,
  updateRoom,
  toggleRoom,
  deleteRoomPermanent,
} from "../controllers/room.controller.js";

import auth from "../middlewares/auth.middleware.js";
import role from "../middlewares/role.middleware.js";

const router = express.Router();

/* ================= ROOMS ROUTES ================= */

// Get rooms (pagination)
router.get("/rooms", auth, role("ADMIN"), getRooms);

// Get room statistics
router.get("/rooms/stats", auth, role("ADMIN"), getRoomStats);

// Add room
router.post("/rooms", auth, role("ADMIN"), addRoom);

// Update room
router.put("/rooms/:id", auth, role("ADMIN"), updateRoom);

// Activate / Deactivate room
router.patch("/rooms/:id/toggle", auth, role("ADMIN"), toggleRoom);

// DELETE room permanently
router.delete("/rooms/:id", auth, role("ADMIN"), deleteRoomPermanent);


export default router;
