import db from "../db/db.js";

/**
 * Get logged-in student profile
 */
export const getStudentProfile = (req, res) => {
  db.query(
    `SELECT id, name, email, branch, year, is_active
     FROM users WHERE id = $1`,
    [req.user.id],
    (err, result) => {
      if (err || result.rows.length === 0)
        return res.status(404).json({ message: "Student not found" });

      res.json(result.rows[0]);
    }
  );
};

/**
 * Student edits their profile (limited fields)
 */
export const updateStudentProfile = (req, res) => {
  const { name, branch, year } = req.body;

  db.query(
    `UPDATE users SET name = $1, branch = $2, year = $3 WHERE id = $4`,
    [name, branch, year, req.user.id],
    (err) => {
      if (err) return res.status(500).json({ message: "Update failed" });
      res.json({ message: "Profile updated" });
    }
  );
};

/**
 * Get student dashboard data
 */
export const getStudentDashboard = (req, res) => {
  const studentId = req.user.id;

  db.query(
    `
    SELECT name, email, roll_number, branch, year
    FROM users
    WHERE id = $1 AND role = 'student'
    `,
    [studentId],
    (err, studentResult) => {
      if (err || studentResult.rows.length === 0) {
        console.error("Student not found in DB:", err);
        return res.status(404).json({ message: "Student not found" });
      }

      const student = studentResult.rows[0];
      console.log("Student data fetched:", student); // ✅ helps debugging

      // ---------- REGULAR TODAY ----------
      const todayExamSql = `
        SELECT
          e.exam_name,
          e.exam_date,
          e.exam_time,
          e.duration,
          r.room_name AS room_number,
          sa.seat_label AS bench_number
        FROM exams e
        JOIN seating_arrangements sa ON sa.exam_id = e.id
        JOIN rooms r ON r.id = sa.room_id
        WHERE sa.student_id = $1
          AND e.exam_date = CURRENT_DATE
          AND sa.is_deleted = FALSE
      `;

      db.query(todayExamSql, [studentId], (err, todayExamResult) => {
        if (err) return res.status(500).json({ message: "Exam fetch error" });

        const todayExam = todayExamResult.rows[0] || null;

        // ---------- SEMESTER TODAY ----------
        const semesterTodaySql = `
          SELECT
            CONCAT('Semester Exam - ', s.year) AS exam_name,
            s.exam_date,
            s.exam_time,
            180 AS duration,
            r.room_name AS room_number,
            ssa.seat_number AS bench_number
          FROM semester_exam_slots s
          JOIN semester_seating_arrangements ssa ON s.id = ssa.semester_slot_id
          JOIN rooms r ON r.id = ssa.room_id
          WHERE ssa.student_id = $1
            AND s.exam_date = CURRENT_DATE
        `;

        db.query(semesterTodaySql, [studentId], (err, semesterTodayResult) => {
          if (err) return res.status(500).json({ message: "Semester fetch error" });

          const semesterToday = semesterTodayResult.rows[0] || null;
          const todayExamData = todayExam || semesterToday;

          // ---------- REGULAR UPCOMING ----------
          const upcomingSql = `
            SELECT
              e.exam_name,
              e.exam_date,
              e.exam_time,
              e.duration,
              r.room_name AS room_number,
              sa.seat_label AS bench_number
            FROM exams e
            JOIN seating_arrangements sa ON sa.exam_id = e.id
            JOIN rooms r ON r.id = sa.room_id
            WHERE sa.student_id = $1
              AND e.exam_date > CURRENT_DATE
              AND sa.is_deleted = FALSE
            ORDER BY e.exam_date
          `;

          db.query(upcomingSql, [studentId], (err, upcomingResult) => {
            if (err) return res.status(500).json({ message: "Upcoming exam error" });

            const upcomingExams = upcomingResult.rows || [];

            // ---------- SEMESTER UPCOMING ----------
            const semesterUpcomingSql = `
              SELECT
                CONCAT('Semester Exam - ', s.year) AS exam_name,
                s.exam_date,
                s.exam_time,
                180 AS duration,
                r.room_name AS room_number,
                ssa.seat_number AS bench_number
              FROM semester_exam_slots s
              JOIN semester_seating_arrangements ssa ON s.id = ssa.semester_slot_id
              JOIN rooms r ON r.id = ssa.room_id
              WHERE ssa.student_id = $1
                AND s.exam_date > CURRENT_DATE
              ORDER BY s.exam_date
            `;

            db.query(semesterUpcomingSql, [studentId], (err, semesterUpcomingResult) => {
              if (err) return res.status(500).json({ message: "Semester upcoming error" });

              const semesterUpcoming = semesterUpcomingResult.rows || [];
              const allUpcoming = [...upcomingExams, ...semesterUpcoming];

              res.json({
                student: student,
                todayExam: todayExamData,
                upcomingExams: allUpcoming,
              });
            });
          });
        });
      });
    }
  );
};

export const getStudentNotifications = (req, res) => {
  const studentId = req.user.id;

  const regularQuery = `
    SELECT 
      e.exam_name,
      e.exam_date,
      e.exam_time,
      sa.seat_label,
      r.room_name,
      CASE
        WHEN e.exam_date = CURRENT_DATE THEN 'exam_today'
        WHEN e.exam_date > CURRENT_DATE THEN 'upcoming_exam'
        ELSE 'info'
      END AS type
    FROM seating_arrangements sa
    JOIN exams e ON e.id = sa.exam_id
    JOIN rooms r ON r.id = sa.room_id
    WHERE sa.student_id = $1
      AND sa.is_deleted = FALSE
    ORDER BY e.exam_date DESC
  `;

  db.query(regularQuery, [studentId], (err, regularResult) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Notification fetch failed" });
    }

    const regularRows = regularResult.rows || [];
    const regularNotifications = regularRows.map((row, index) => ({
      id: index + 1,
      type: "exam",
      title:
        row.type === "exam_today"
          ? `Exam Today: ${row.exam_name}`
          : `Upcoming Exam: ${row.exam_name}`,
      message: `Exam at ${row.exam_time} in ${row.room_name}, Bench ${row.seat_label}`,
      time: row.exam_date,
      read: false,
      priority: row.type === "exam_today" ? "high" : "medium",
    }));

    // 🔹 SEMESTER NOTIFICATIONS
    const semesterQuery = `
      SELECT
        CONCAT('Semester Exam - ', s.year) AS exam_name,
        s.exam_date,
        s.exam_time,
        ssa.seat_number AS seat_label,
        r.room_name
      FROM semester_seating_arrangements ssa
      JOIN semester_exam_slots s ON s.id = ssa.semester_slot_id
      JOIN rooms r ON r.id = ssa.room_id
      WHERE ssa.student_id = $1
      ORDER BY s.exam_date DESC
    `;

    db.query(semesterQuery, [studentId], (err, semesterResult) => {
      if (err) {
        console.error(err);
        return res
          .status(500)
          .json({ message: "Semester notification error" });
      }

      const semesterRows = semesterResult.rows || [];
      const semesterNotifications = semesterRows.map((row, index) => ({
        id: regularNotifications.length + index + 1,
        type: "exam",
        title:
          row.exam_date === new Date().toISOString().split("T")[0]
            ? `Semester Exam Today: ${row.exam_name}`
            : `Upcoming Semester Exam: ${row.exam_name}`,
        message: `Exam at ${row.exam_time} in ${row.room_name}, Bench ${row.seat_label}`,
        time: row.exam_date,
        read: false,
        priority:
          row.exam_date === new Date().toISOString().split("T")[0]
            ? "high"
            : "medium",
      }));

      // FINAL RESPONSE
      res.json({
        notifications: [...regularNotifications, ...semesterNotifications],
      });
    });
  });
};
