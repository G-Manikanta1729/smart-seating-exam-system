import db from "../db/db.js";

/* ================= GET ROOMS (WITH PAGINATION) ================= */
export const getRooms = (req, res) => {
  const { page = 1 } = req.query;
  const limit = 5;
  const offset = (page - 1) * limit;

  // PostgreSQL uses COUNT(*) OVER() for total count without a separate query
  const sql = `
    SELECT
      id,
      room_name,
      rows_count,
      cols_count,
      (rows_count * cols_count) AS capacity,
      is_active,
      COUNT(*) OVER() AS total_count
    FROM rooms
    ORDER BY id DESC
    LIMIT $1 OFFSET $2
  `;

  db.query(sql, [limit, offset], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }

    const rows = result.rows || [];
    const total = rows.length > 0 ? parseInt(rows[0].total_count) : 0;

    // Remove the total_count from each row before sending
    const cleanRows = rows.map(({ total_count, ...row }) => row);

    res.json({
      data: cleanRows,
      total: total,
    });
  });
};

/* ================= ROOM STATS ================= */
export const getRoomStats = (req, res) => {
  // PostgreSQL uses BOOLEAN (TRUE/FALSE) instead of TINYINT(1)
  const sql = `
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) AS available,
      SUM(CASE WHEN is_active = FALSE THEN 1 ELSE 0 END) AS occupied
    FROM rooms
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }

    res.json(result.rows[0]);
  });
};

/* ================= ADD ROOM ================= */
export const addRoom = (req, res) => {
  const { room_name, rows_count, cols_count } = req.body;

  if (!room_name || !rows_count || !cols_count) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // PostgreSQL uses $1, $2, $3 instead of ?
  const sql = `
    INSERT INTO rooms (room_name, rows_count, cols_count)
    VALUES ($1, $2, $3)
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
    SET room_name = $1, rows_count = $2, cols_count = $3
    WHERE id = $4
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

  // PostgreSQL uses NOT instead of IF() function
  const sql = `
    UPDATE rooms
    SET is_active = NOT is_active
    WHERE id = $1
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

  const sql = `DELETE FROM rooms WHERE id = $1`;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("DELETE ROOM ERROR:", err);
      return res.status(500).json({ message: "Delete failed" });
    }

    // PostgreSQL uses rowCount instead of affectedRows
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.json({ message: "Room deleted permanently" });
  });
};
