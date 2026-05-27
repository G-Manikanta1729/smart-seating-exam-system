import db from "../db/db.js";

/* ================= SAVE DRAFT ================= */
export const saveAttendanceDraft = async (req, res) => {
  const { examType, examId, records } = req.body;
  const facultyId = req.user.id;

  try {

  for (const r of records) {

    await db.query(
      `
      INSERT INTO attendance
      (
        exam_type,
        exam_id,
        student_id,
        faculty_id,
        status,
        is_submitted
      )
      VALUES ($1, $2, $3, $4, $5, false)

      ON CONFLICT (exam_type, exam_id, student_id, faculty_id)

      DO UPDATE SET
        status = EXCLUDED.status,
        is_submitted = false
      `,
      [
        examType,
        examId,
        r.student_id,
        facultyId,
        r.status
      ]
    );
  }

  res.json({
    message: "Attendance draft saved"
  });

} catch (err) {

  console.error(err);

  res.status(500).json({
    message: "Save failed"
  });
}
};

/* ================= LOCK & SUBMIT ================= */
export const submitAttendance = async (req, res) => {
  const { examType, examId } = req.body;
  const facultyId = req.user.id;

  try {

  await db.query(
    `
    UPDATE attendance
    SET is_submitted = true
    WHERE exam_type = $1
      AND exam_id = $2
      AND faculty_id = $3
    `,
    [examType, examId, facultyId]
  );

  res.json({
    message: "Attendance submitted successfully"
  });

} catch (err) {

  console.error(err);

  res.status(500).json({
    message: "Submit failed"
  });
}
};

/* ================= GET SAVED ATTENDANCE ================= */
export const getSavedAttendance = async (req, res) => {
  const { examType, examId } = req.params;

  try {

  const result = await db.query(
    `
    SELECT student_id, status, is_submitted
    FROM attendance
    WHERE exam_type = $1
      AND exam_id = $2
    `,
    [examType, examId]
  );

  res.json(result.rows);

} catch (err) {

  console.error("FETCH ATTENDANCE ERROR:", err);

  return res.status(500).json({
    message: "Database error"
  });
}
};
