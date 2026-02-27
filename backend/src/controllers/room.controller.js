import db from "../db/db.js";

/* ================= GET ROOMS (WITH PAGINATION) ================= */
export const getRooms = (req, res) => {
  const { page = 1 } = req.query;
  const limit = 5;
  const offset = (page - 1) * limit;

  const sql = `
    SELECT SQL_CALC_FOUND_ROWS
      id,
      room_name,
      rows_count,
      cols_count,
      (rows_count * cols_count) AS capacity,
      is_active
    FROM rooms
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `;

  db.query(sql, [limit, offset], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }

    db.query("SELECT FOUND_ROWS() AS total", (e, total) => {
      if (e) {
        console.error(e);
        return res.status(500).json({ message: "Database error" });
      }

      res.json({
        data: rows,
        total: total[0].total,
      });
    });
  });
};

/* ================= ROOM STATS ================= */
export const getRoomStats = (req, res) => {
  const sql = `
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS available,
      SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) AS occupied
    FROM rooms
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }

    res.json(result[0]);
  });
};

/* ================= ADD ROOM ================= */
export const addRoom = (req, res) => {
  const { room_name, rows_count, cols_count } = req.body;

  if (!room_name || !rows_count || !cols_count) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const sql = `
    INSERT INTO rooms (room_name, rows_count, cols_count)
    VALUES (?, ?, ?)
  `;

  db.query(sql, [room_name, rows_count, cols_count], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }

    res.json({ message: "Room added successfully" });
  });
};

/* ================= UPDATE ROOM ================= */
export const updateRoom = (req, res) => {
  const { id } = req.params;
  const { room_name, rows_count, cols_count } = req.body;

  if (!room_name || !rows_count || !cols_count) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const sql = `
    UPDATE rooms
    SET room_name = ?, rows_count = ?, cols_count = ?
    WHERE id = ?
  `;

  db.query(sql, [room_name, rows_count, cols_count, id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }

    res.json({ message: "Room updated successfully" });
  });
};

/* ================= ACTIVATE / DEACTIVATE ROOM ================= */
export const toggleRoom = (req, res) => {
  const { id } = req.params;

  const sql = `
    UPDATE rooms
    SET is_active = IF(is_active = 1, 0, 1)
    WHERE id = ?
  `;

  db.query(sql, [id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }

    res.json({ message: "Room status updated successfully" });
  });
};

/* ===========================
   DELETE ROOM PERMANENTLY
=========================== */
export const deleteRoomPermanent = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Room ID required" });
  }

  const sql = `DELETE FROM rooms WHERE id = ?`;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("DELETE ROOM ERROR:", err);
      return res.status(500).json({ message: "Delete failed" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.json({ message: "Room deleted permanently" });
  });
};

