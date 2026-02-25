import db from "../db/db.js";

/**
 * Get logged-in student profile
 */
export const getStudentProfile = (req, res) => {
  db.query(
    `SELECT id, name, email, branch, year, is_active
     FROM users WHERE id = ?`,
    [req.user.id],
    (err, result) => {
      if (err || result.length === 0)
        return res.status(404).json({ message: "Student not found" });

      res.json(result[0]);
    }
  );
};

/**
 * Student edits their profile (limited fields)
 */
export const updateStudentProfile = (req, res) => {
  const { name, branch, year } = req.body;

  db.query(
    `UPDATE users SET name=?, branch=?, year=? WHERE id=?`,
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
    WHERE id = ? AND role = 'STUDENT'
    `,
    [studentId],
    (err, studentResult) => {
      if (err || studentResult.length === 0) {
        return res.status(404).json({ message: "Student not found" });
      }

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
        WHERE sa.student_id = ?
          AND e.exam_date = CURDATE()
          AND sa.is_deleted = 0
      `;

      db.query(todayExamSql, [studentId], (err, todayExamResult) => {
        if (err) return res.status(500).json({ message: "Exam fetch error" });

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
          WHERE ssa.student_id = ?
            AND s.exam_date = CURDATE()
        `;

        db.query(semesterTodaySql, [studentId], (err, semesterToday) => {
          if (err) return res.status(500).json({ message: "Semester fetch error" });

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
            WHERE sa.student_id = ?
              AND e.exam_date > CURDATE()
              AND sa.is_deleted = 0
            ORDER BY e.exam_date
          `;

          db.query(upcomingSql, [studentId], (err, upcomingExams) => {
            if (err) return res.status(500).json({ message: "Upcoming exam error" });

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
              WHERE ssa.student_id = ?
                AND s.exam_date > CURDATE()
              ORDER BY s.exam_date
            `;

            db.query(semesterUpcomingSql, [studentId], (err, semesterUpcoming) => {
              if (err) return res.status(500).json({ message: "Semester upcoming error" });

              res.json({
                student: studentResult[0],
                todayExam: todayExamResult[0] || semesterToday[0] || null,
                upcomingExams: [...upcomingExams, ...semesterUpcoming],
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
        WHEN e.exam_date = CURDATE() THEN 'exam_today'
        WHEN e.exam_date > CURDATE() THEN 'upcoming_exam'
        ELSE 'info'
      END AS type
    FROM seating_arrangements sa
    JOIN exams e ON e.id = sa.exam_id
    JOIN rooms r ON r.id = sa.room_id
    WHERE sa.student_id = ?
      AND sa.is_deleted = 0
    ORDER BY e.exam_date DESC
  `;

  db.query(regularQuery, [studentId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Notification fetch failed" });
    }

    const regularNotifications = results.map((row, index) => ({
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
      WHERE ssa.student_id = ?
      ORDER BY s.exam_date DESC
    `;

    db.query(semesterQuery, [studentId], (err, semesterRows) => {
      if (err) {
        console.error(err);
        return res
          .status(500)
          .json({ message: "Semester notification error" });
      }

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