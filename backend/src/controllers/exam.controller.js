import db from "../db/db.js";

/* ===========================
   GET ALL EXAMS  ✅ FIXED
=========================== */
export const getExams = async (req, res) => {
  const sql = `
    SELECT 
      id,
      exam_name,
      branch,
      year,
      TO_CHAR(exam_date, 'YYYY-MM-DD') AS exam_date,
      exam_time,
      duration,
      is_active,
      seating_generated   -- 🔥 REQUIRED FOR SEATING UI
    FROM exams
    ORDER BY exam_date ASC
  `;

  try {

  const result = await db.query(sql);

  res.json(result.rows);

} catch (err) {

  console.error("GET EXAMS ERROR:", err);

  return res.status(500).json({
    message: "Database error"
  });
}
};

/* ===========================
   CREATE EXAM
=========================== */
export const addExam = async (req, res) => {
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
    VALUES ($1, $2, $3, $4, $5, $6)
  `;

  try {

  await db.query(
    sql,
    [
      exam_name,
      branch,
      year,
      exam_date,
      exam_time,
      duration
    ]
  );

  res.json({
    message: "Exam created successfully"
  });

} catch (err) {

  console.error("ADD EXAM ERROR:", err);

  return res.status(500).json({
    message: "Insert failed"
  });
}
};

/* ===========================
   UPDATE EXAM
=========================== */
export const updateExam = async (req, res) => {
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
      exam_name = $1,
branch = $2,
year = $3,
exam_date = $4,
exam_time = $5,
duration = $6
WHERE id = $7
  `;

  try {

  const result = await db.query(
    sql,
    [
      exam_name,
      branch,
      year,
      exam_date,
      exam_time,
      duration,
      id
    ]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({
      message: "Exam not found or no changes made"
    });
  }

  res.json({
    message: "Exam updated successfully"
  });

} catch (err) {

  console.error("UPDATE EXAM ERROR:", err);

  return res.status(500).json({
    message: "Update failed"
  });
}
};

/* ===========================
   TOGGLE EXAM (DELETE / RESTORE)
=========================== */
export const toggleExam = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Exam ID is required" });
  }

  const sql = `
    UPDATE exams
    SET is_active = NOT is_active
    WHERE id = $1
  `;

  try {

  const result = await db.query(sql, [id]);

  if (result.rowCount === 0) {
    return res.status(404).json({
      message: "Exam not found"
    });
  }

  res.json({
    message: "Exam status changed"
  });

} catch (err) {

  console.error("TOGGLE EXAM ERROR:", err);

  return res.status(500).json({
    message: "Status update failed"
  });
}
};

/* ===========================
   GET UPCOMING EXAMS (DASHBOARD)
=========================== */
export const getUpcomingExams = async (req, res) => {
  const sql = `
    SELECT
      id,
      exam_name AS exam,
      TO_CHAR(exam_date, 'YYYY-MM-DD') AS date,
        branch,
        year,
        COALESCE(
          (
            SELECT STRING_AGG(DISTINCT u.name, ', ')
            FROM faculty_allocation fa
            LEFT JOIN users u ON fa.faculty_id = u.id
            WHERE fa.exam_id = e.id
          ),
          'Unallocated'
        ) AS faculty_names,
      CASE
        WHEN is_active = true THEN 'Scheduled'
        ELSE 'Pending'
      END AS status
    FROM exams e
    WHERE exam_date >= CURRENT_DATE
    ORDER BY exam_date ASC
    LIMIT 5
  `;

  try {

  const result = await db.query(sql);

  res.json(result.rows);

} catch (err) {

  console.error("GET UPCOMING EXAMS ERROR:", err);

  return res.status(500).json({
    message: "Database error"
  });
}
};

/* ===========================
   DELETE EXAM PERMANENTLY
=========================== */
export const deleteExamPermanent = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Exam ID required" });
  }

  const sql = `DELETE FROM exams WHERE id = $1`;

  try {

  const result = await db.query(sql, [id]);

  if (result.rowCount === 0) {
    return res.status(404).json({
      message: "Exam not found"
    });
  }

  res.json({
    message: "Exam deleted permanently"
  });

} catch (err) {

  console.error("DELETE EXAM ERROR:", err);

  return res.status(500).json({
    message: "Delete failed"
  });
}
};
