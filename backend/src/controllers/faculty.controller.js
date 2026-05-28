import db from "../db/db.js";
import bcrypt from "bcrypt";

/* ================= FACULTY DASHBOARD ================= */
export const getFacultyDashboard = async (req, res) => {
  const facultyId = req.user.id;

  const sql = `
    /* ===== REGULAR EXAMS ===== */
    SELECT
      e.id,
      e.exam_name,
      TO_CHAR(e.exam_date, 'YYYY-MM-DD') AS exam_date,
     TO_CHAR(e.exam_time, 'HH12:MI AM')
|| ' - ' ||
TO_CHAR(
  (e.exam_time::time + (e.duration || ' minutes')::interval),
  'HH12:MI AM'
) AS exam_time,
      STRING_AGG(DISTINCT r.room_name, ', ') AS room_names,
      COUNT(DISTINCT sa.student_id) AS students,
      STRING_AGG(DISTINCT u.name, ', ') AS faculty_names,
      'regular' AS exam_type,
      e.id AS exam_id
    FROM faculty_allocation fa
    JOIN exams e ON e.id = fa.exam_id
    JOIN users u ON u.id = fa.faculty_id
    LEFT JOIN rooms r ON r.id = fa.room_id
    LEFT JOIN seating_arrangements sa
      ON sa.exam_id = e.id AND sa.room_id = r.id AND sa.is_deleted = 0
    WHERE e.exam_date >= CURRENT_DATE
      AND fa.faculty_id = $1
    GROUP BY
e.id,
e.exam_name,
e.exam_date,
e.exam_time,
e.duration

    UNION ALL

    /* ===== SEMESTER EXAMS ===== */
    SELECT
      s.id,
      'Semester Exam - Year ' || s.year AS exam_name,
      TO_CHAR(s.exam_date, 'YYYY-MM-DD') AS exam_date,
      TO_CHAR(s.exam_time, 'HH12:MI AM')
|| ' - ' ||
TO_CHAR(
  s.exam_time + interval '3 hours',
  'HH12:MI AM'
) AS exam_time,
      STRING_AGG(DISTINCT r.room_name, ', ') AS room_names,
      COUNT(DISTINCT ssa.student_id) AS students,
      STRING_AGG(DISTINCT u.name, ', ') AS faculty_names,
      'semester' AS exam_type,
      s.id AS exam_id
    FROM semester_faculty_allocation fa
    JOIN semester_exam_slots s ON s.id = fa.semester_slot_id
    JOIN users u ON u.id = fa.faculty_id
    LEFT JOIN rooms r ON r.id = fa.room_id
    LEFT JOIN semester_seating_arrangements ssa
      ON ssa.semester_slot_id = s.id AND ssa.room_id = r.id
    WHERE s.exam_date >= CURRENT_DATE
      AND fa.faculty_id = $2
    GROUP BY
s.id,
s.year,
s.exam_date,
s.exam_time
    ORDER BY exam_date ASC
  `;

  try {

  const result = await db.query(
    sql,
    [facultyId, facultyId]
  );

  return res.json({
    allocations: result.rows
  });

} catch (err) {

  console.error("FACULTY DASHBOARD ERROR:", err);

  return res.status(500).json({
    message: "Database error"
  });
}
};

/* ================= FACULTY SEATING VIEW ================= */
export const getFacultySeatingView = async (req, res) => {
  try {
    const facultyId = req.user.id;
    const examId = req.params.examId;
    const examType = req.query.examType?.toLowerCase();

    if (!examId || !examType) {
      return res.status(400).json({
        message: "examId and examType are required",
      });
    }

    let sql = "";
    let params = [];

    if (examType === "regular") {
      sql = `
        SELECT
          sa.seat_number,
          u.roll_number,
          u.name,
          u.branch,
          r.room_name
        FROM faculty_allocation fa
        JOIN seating_arrangements sa
          ON fa.exam_id = sa.exam_id
         AND fa.room_id = sa.room_id
        JOIN users u ON u.id = sa.student_id
        JOIN rooms r ON r.id = sa.room_id
        WHERE fa.exam_id = $1
          AND fa.faculty_id = $2
        ORDER BY r.room_name, sa.seat_number
      `;
      params = [examId, facultyId];
    }

    else if (examType === "semester") {
      sql = `
        SELECT
          ssa.seat_number,
          u.roll_number,
          u.name,
          u.branch,
          r.room_name
        FROM semester_faculty_allocation sfa
        JOIN semester_seating_arrangements ssa
          ON sfa.semester_slot_id = ssa.semester_slot_id
         AND sfa.room_id = ssa.room_id
        JOIN users u ON u.id = ssa.student_id
        JOIN rooms r ON r.id = ssa.room_id
        WHERE sfa.semester_slot_id = $1
          AND sfa.faculty_id = $2
        ORDER BY r.room_name, ssa.seat_number
      `;
      params = [examId, facultyId];
    }

    else {
      return res.status(400).json({ message: "Invalid examType" });
    }

    const result = await db.query(sql, params);
    
      return res.json(result.rows);

  } catch (error) {
    console.error("SEATING CONTROLLER ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
/* ================= FACULTY VIEW SEMESTER SEATING =================
export const viewSemesterSeatingForFaculty = (req, res) => {
  const { slotId } = req.params;

  if (!slotId) {
    return res.status(400).json({ message: "slotId required" });
  }

  const sql = `
    SELECT
      ssa.room_id,
      r.room_name,
      ssa.seat_number,
      s.roll_number,
      s.name,
      s.branch
    FROM semester_seating_arrangements ssa
    JOIN students s ON s.id = ssa.student_id
    JOIN rooms r ON r.id = ssa.room_id
    WHERE ssa.semester_slot_id = ?
    ORDER BY r.room_name, ssa.seat_number
  `;

  db.query(sql, [slotId], (err, rows) => {
    if (err) {
      console.error("SEMESTER SEATING FACULTY ERROR:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(rows);
  });
};
*/

/* ================= GET FACULTY LIST (ADMIN) ================= */
export const getFaculty = async (req, res) => {
  const sql = `
    SELECT id, name, email, branch, is_active
    FROM users
    WHERE role = 'faculty'
  `;
   try {

  const result = await db.query(sql);

  res.json(result.rows);

} catch (err) {

  console.error("GET FACULTY ERROR:", err);

  return res.status(500).json({
    message: "Database error"
  });
}
};


/* ================= CREATE FACULTY (ADMIN) ================= */
export const createFaculty = async (req, res) => {
  const { name, email, password, branch } = req.body;

  if (!name || !email) {
    return res.status(400).json({
      message: "Name and email are required"
    });
  }

  try {

    const hash = await bcrypt.hash(
      password || "password",
      10
    );

    const sql = `
      INSERT INTO users
      (
        name,
        email,
        password,
        branch,
        role,
        is_active
      )
      VALUES ($1, $2, $3, $4, 'faculty', true)
    `;

    await db.query(sql, [
      name,
      email,
      hash,
      branch
    ]);

    res.status(201).json({
      message: "Faculty created"
    });

  } catch (err) {

    console.error("CREATE FACULTY ERROR:", err);

    if (err.code === "23505") {
      return res.status(409).json({
        message: "Email already exists"
      });
    }

    return res.status(500).json({
      message: "Database error"
    });
  }
};

/* ================= UPDATE FACULTY (ADMIN) ================= */
export const updateFaculty = async (req, res) => {
  const { id } = req.params;
  const { name, email, password, is_active, branch } = req.body;

  if (!id) return res.status(400).json({ message: "Faculty id required" });

  let sql = `UPDATE users SET name = $1, email = $2, branch = $3`;
  const params = [name, email, branch];

  if (typeof is_active !== "undefined") {
    sql += `, is_active = $4`;
    params.push(is_active);
  }

  if (password) {
    try {
      const hash = await bcrypt.hash(password, 10);
      sql += `, password = $5`;
      params.push(hash);
    } catch (err) {
      console.error("UPDATE FACULTY HASH ERROR:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }

  sql += ` WHERE id = $${params.length + 1} AND role = 'faculty'`;
  params.push(id);

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("UPDATE FACULTY ERROR:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    res.json({ message: "Faculty updated" });
  });
};

/* ================= TOGGLE (ACTIVATE/DEACTIVATE) FACULTY ================= */
export const toggleFaculty = (req, res) => {
  const { id } = req.params;

  db.query(
    `UPDATE users SET is_active = NOT is_active WHERE id = $1 AND role = 'faculty'`,
    [id],
    (err, result) => {
      if (err) {
        console.error("TOGGLE FACULTY ERROR:", err);
        return res.status(500).json({ message: "Database error" });
      }

      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Faculty not found" });
      }

      res.json({ message: "Status updated" });
    }
  );
};

/* ================= PERMANENT DELETE FACULTY ================= */
export const deleteFacultyPermanent = (req, res) => {
  const { id } = req.params;

  db.query(
    "DELETE FROM users WHERE id = $1 AND role = 'faculty'",
    [id],
    (err, result) => {
      if (err) {
        console.error("DELETE FACULTY ERROR:", err);
        return res.status(500).json({ message: "Delete failed" });
      }

      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Faculty not found" });
      }

      res.json({ message: "Faculty permanently deleted" });
    }
  );
};

/* ================= GET ROOM-WISE FACULTY ALLOCATION ================= */
export const getFacultyAllocation = (req, res) => {
  const { examId } = req.query;

  if (!examId) {
    return res.status(400).json({ message: "examId is required" });
  }

  const sql = `
    SELECT
      r.id AS room_id,
      r.room_name,
      fa.faculty_id,
      u.name AS faculty_name
    FROM rooms r
    LEFT JOIN faculty_allocation fa
      ON r.id = fa.room_id AND fa.exam_id = $1
    LEFT JOIN users u
      ON fa.faculty_id = u.id
    WHERE r.is_active = true
    ORDER BY r.room_name
  `;

  db.query(sql, [examId], (err, result) => {
    if (err) {
      console.error("GET FACULTY ALLOCATION ERROR:", err);
      return res.status(500).json({ message: "Database error" });
    }

    res.json(result.rows);
  });
};

/* ================= SAVE FACULTY ALLOCATION ================= */
export const saveFacultyAllocation = (req, res) => {
  const { exam_id, room_id, faculty_id } = req.body;

  if (!exam_id || !room_id || !faculty_id) {
    return res.status(400).json({ message: "All fields required" });
  }

  // 1️⃣ Check if faculty already assigned to another room in SAME exam
  const checkSql = `
    SELECT room_id
    FROM faculty_allocation
    WHERE exam_id = $1
    AND faculty_id = $2
      AND room_id != $3
  `;

  db.query(checkSql, [exam_id, faculty_id, room_id], (err, result) => {
    if (err) {
      console.error("FACULTY CHECK ERROR:", err);
      return res.status(500).json({ message: "Database error" });
    }

   if (result.rows.length > 0) {
      return res.status(400).json({
        message: "This faculty is already assigned to another room for this exam",
      });
    }

    // 2️⃣ Safe to insert / update
    const saveSql = `
      INSERT INTO faculty_allocation
(
  exam_id,
  room_id,
  faculty_id,
  allocated_date,
  status
)
VALUES ($1, $2, $3, CURRENT_DATE, 'Assigned')

ON CONFLICT (exam_id, room_id)

DO UPDATE SET
faculty_id = EXCLUDED.faculty_id,
status = 'Assigned'
    `;

    db.query(saveSql, [exam_id, room_id, faculty_id], (err) => {
      if (err) {
        console.error("SAVE FACULTY ERROR:", err);
        return res.status(500).json({ message: "Database error" });
      }

      res.json({ message: "Faculty allocated successfully" });
    });
  });
};
/* ================= DELETE FACULTY ALLOCATION ================= */
export const deleteFacultyAllocation = (req, res) => {
  const { exam_id, room_id } = req.body;

  if (!exam_id || !room_id) {
    return res.status(400).json({ message: "exam_id and room_id are required" });
  }

  const sql = `DELETE FROM faculty_allocation WHERE exam_id = $1 AND room_id = $2`;
  db.query(sql, [exam_id, room_id], (err) => {
    if (err) {
      console.error("DELETE FACULTY ALLOCATION ERROR:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json({ message: "Faculty allocation removed" });
  });
};

export const getFacultySemesterSeating = (req, res) => {
  const slotId = req.params.id;

  const sql = `
    SELECT 
      ssa.seat_number,
      u.roll_number,
      u.name,
      r.room_name
    FROM semester_seating_arrangements ssa
    JOIN users u ON u.id = ssa.student_id
    JOIN rooms r ON r.id = ssa.room_id
    WHERE ssa.semester_slot_id = $1
    ORDER BY ssa.seat_number
  `;

  db.query(sql, [slotId], (err, result) => {
    if (err) {
      console.error("Semester seating error:", err);
      return res.status(500).json({ message: "Failed to load seating" });
    }

    res.json(result.rows);
  });
};

/* ================= AUTO ALLOCATE FACULTY (SYSTEM) ================= */
export const autoAllocateFaculty = (examId) => {
  return new Promise((resolve, reject) => {

    // 1️⃣ Fetch ONLY ACTIVE FACULTY
    db.query(
      `
      SELECT id
      FROM users
      WHERE role = 'faculty'
          AND is_active = true
      ORDER BY id
      `,
      (err, faculty) => {
        if (err || faculty.rows.length === 0) {
          return reject("No faculty available");
        }

        // 2️⃣ Fetch ACTIVE ROOMS
        db.query(
          `
          SELECT id
          FROM rooms
          WHERE is_active = true
          ORDER BY id
          `,
          (err, rooms) => {
            if (err || rooms.rows.length === 0) {
              return reject("No rooms available");
            }

            // 3️⃣ Remove old allocation for this exam
            db.query(
              "DELETE FROM faculty_allocation WHERE exam_id = $1",
              [examId],
              async () => {
                const values = [];
                let facultyIndex = 0;

                // 4️⃣ Round-robin assignment
                rooms.rows.forEach(room => {
                  const facultyMember =
                    faculty.rows[
  facultyIndex % faculty.rows.length
];

                  values.push([
                    examId,
                    room.id,
                    facultyMember.id,
                    new Date(),
                    "Assigned"
                  ]);

                  facultyIndex++;
                });

                // 5️⃣ Insert allocations
                try {

  for (const value of values) {

    await db.query(
      `
      INSERT INTO faculty_allocation
      (
        exam_id,
        room_id,
        faculty_id,
        allocated_date,
        status
      )
      VALUES ($1, $2, $3, $4, $5)
      `,
      value
    );
  }

  resolve();

} catch (err) {

  reject("Faculty allocation failed");
}
              }
            );
          }
        );
      }
    );
  });
};
