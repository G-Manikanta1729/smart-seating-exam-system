import db from "../db/db.js";

/* ===========================
   GET ALL EXAMS  ✅ FIXED
=========================== */
export const getExams = (req, res) => {
  const sql = `
    SELECT 
      id,
      exam_name,
      branch,
      year,
      DATE_FORMAT(exam_date, '%Y-%m-%d') AS exam_date,
      exam_time,
      duration,
      is_active,
      seating_generated   -- 🔥 REQUIRED FOR SEATING UI
    FROM exams
    ORDER BY exam_date ASC
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("GET EXAMS ERROR:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(rows);
  });
};

/* ===========================
   CREATE EXAM
=========================== */
export const addExam = (req, res) => {
  const {
    exam_name,
    branch,
    year,
    exam_date,
    exam_time,
    duration,
  } = req.body;

  if (
    !exam_name ||
    !branch ||
    !year ||
    !exam_date ||
    !exam_time ||
    !duration
  ) {
    return res.status(400).json({ message: "All fields required" });
  }

  const sql = `
    INSERT INTO exams
    (exam_name, branch, year, exam_date, exam_time, duration)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [exam_name, branch, year, exam_date, exam_time, duration],
    (err) => {
      if (err) {
        console.error("ADD EXAM ERROR:", err);
        return res.status(500).json({ message: "Insert failed" });
      }
      res.json({ message: "Exam created successfully" });
    }
  );
};

/* ===========================
   UPDATE EXAM
=========================== */
export const updateExam = (req, res) => {
  const { id } = req.params;
  const {
    exam_name,
    branch,
    year,
    exam_date,
    exam_time,
    duration,
  } = req.body;

  if (!id) {
    return res.status(400).json({ message: "Exam ID is required" });
  }

  const sql = `
    UPDATE exams
    SET
      exam_name = ?,
      branch = ?,
      year = ?,
      exam_date = ?,
      exam_time = ?,
      duration = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [
      exam_name,
      branch,
      year,
      exam_date,
      exam_time,
      duration,
      id,
    ],
    (err, result) => {
      if (err) {
        console.error("UPDATE EXAM ERROR:", err);
        return res.status(500).json({ message: "Update failed" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Exam not found or no changes made",
        });
      }

      res.json({ message: "Exam updated successfully" });
    }
  );
};

/* ===========================
   TOGGLE EXAM (DELETE / RESTORE)
=========================== */
export const toggleExam = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Exam ID is required" });
  }

  const sql = `
    UPDATE exams
    SET is_active = IF(is_active=1, 0, 1)
    WHERE id = ?
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("TOGGLE EXAM ERROR:", err);
      return res.status(500).json({ message: "Status update failed" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Exam not found" });
    }

    res.json({ message: "Exam status changed" });
  });
};

/* ===========================
   GET UPCOMING EXAMS (DASHBOARD)
=========================== */
export const getUpcomingExams = (req, res) => {
  const sql = `
    SELECT
      id,
      exam_name AS exam,
      DATE_FORMAT(exam_date, '%Y-%m-%d') AS date,
        branch,
        year,
        COALESCE(
          (
            SELECT GROUP_CONCAT(DISTINCT u.name SEPARATOR ', ')
            FROM faculty_allocation fa
            LEFT JOIN users u ON fa.faculty_id = u.id
            WHERE fa.exam_id = e.id
          ),
          'Unallocated'
        ) AS faculty_names,
      CASE
        WHEN is_active = 1 THEN 'Scheduled'
        ELSE 'Pending'
      END AS status
    FROM exams e
    WHERE exam_date >= CURDATE()
    ORDER BY exam_date ASC
    LIMIT 5
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("GET UPCOMING EXAMS ERROR:", err);
      return res.status(500).json({ message: "Database error" });
    }

    res.json(rows);
  });
};

/* ===========================
   DELETE EXAM PERMANENTLY
=========================== */
export const deleteExamPermanent = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Exam ID required" });
  }

  const sql = `DELETE FROM exams WHERE id = ?`;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("DELETE EXAM ERROR:", err);
      return res.status(500).json({ message: "Delete failed" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Exam not found" });
    }

    res.json({ message: "Exam deleted permanently" });
  });
};
