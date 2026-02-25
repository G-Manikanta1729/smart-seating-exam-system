import db from "../db/db.js";

/* ================= SAVE DRAFT ================= */
export const saveAttendanceDraft = (req, res) => {
  const { examType, examId, records } = req.body;
  const facultyId = req.user.id;

  const values = records.map(r => [
    examType,
    examId,
    r.student_id,
    facultyId,
    r.status,
    0 // is_submitted = false
  ]);

  const sql = `
    INSERT INTO attendance
    (exam_type, exam_id, student_id, faculty_id, status, is_submitted)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      status = VALUES(status),
      is_submitted = 0
  `;

  db.query(sql, [values], err => {
    if (err) return res.status(500).json({ message: "Save failed" });
    res.json({ message: "Attendance draft saved" });
  });
};

/* ================= LOCK & SUBMIT ================= */
export const submitAttendance = (req, res) => {
  const { examType, examId } = req.body;
  const facultyId = req.user.id;

  const sql = `
    UPDATE attendance
    SET is_submitted = 1
    WHERE exam_type = ?
      AND exam_id = ?
      AND faculty_id = ?
  `;

  db.query(sql, [examType, examId, facultyId], err => {
    if (err) return res.status(500).json({ message: "Submit failed" });
    res.json({ message: "Attendance submitted successfully" });
  });
};

/* ================= GET SAVED ATTENDANCE ================= */
export const getSavedAttendance = (req, res) => {
  const { examType, examId } = req.params;

  const sql = `
    SELECT student_id, status, is_submitted
    FROM attendance
    WHERE exam_type = ?
      AND exam_id = ?
  `;

  db.query(sql, [examType, examId], (err, rows) => {
    if (err) {
      console.error("FETCH ATTENDANCE ERROR:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(rows);
  });
};