import db from "../db/db.js";
import bcrypt from "bcrypt";

/* ================= FACULTY DASHBOARD ================= */
export const getFacultyDashboard = (req, res) => {
  const facultyId = req.user.id;

  const sql = `
    /* ===== REGULAR EXAMS ===== */
    SELECT
      e.id,
      e.exam_name,
      DATE_FORMAT(e.exam_date, '%Y-%m-%d') AS exam_date,
      CONCAT(
        DATE_FORMAT(e.exam_time, '%h:%i %p'),
        ' - ',
        DATE_FORMAT(ADDTIME(e.exam_time, SEC_TO_TIME(e.duration*60)), '%h:%i %p')
      ) AS exam_time,
      GROUP_CONCAT(DISTINCT r.room_name SEPARATOR ', ') AS room_names,
      COUNT(DISTINCT sa.student_id) AS students,
      GROUP_CONCAT(DISTINCT u.name SEPARATOR ', ') AS faculty_names,
      'regular' AS exam_type,
      e.id AS exam_id
    FROM faculty_allocation fa
    JOIN exams e ON e.id = fa.exam_id
    JOIN users u ON u.id = fa.faculty_id
    LEFT JOIN rooms r ON r.id = fa.room_id
    LEFT JOIN seating_arrangements sa
      ON sa.exam_id = e.id AND sa.room_id = r.id AND sa.is_deleted = 0
    WHERE e.exam_date >= CURDATE()
      AND fa.faculty_id = ?
    GROUP BY e.id

    UNION ALL

    /* ===== SEMESTER EXAMS ===== */
    SELECT
      s.id,
      CONCAT('Semester Exam - Year ', s.year) AS exam_name,
      DATE_FORMAT(s.exam_date, '%Y-%m-%d') AS exam_date,
      CONCAT(
        DATE_FORMAT(s.exam_time, '%h:%i %p'),
        ' - ',
        DATE_FORMAT(ADDTIME(s.exam_time, '03:00:00'), '%h:%i %p')
      ) AS exam_time,
      GROUP_CONCAT(DISTINCT r.room_name SEPARATOR ', ') AS room_names,
      COUNT(DISTINCT ssa.student_id) AS students,
      GROUP_CONCAT(DISTINCT u.name SEPARATOR ', ') AS faculty_names,
      'semester' AS exam_type,
      s.id AS exam_id
    FROM semester_faculty_allocation fa
    JOIN semester_exam_slots s ON s.id = fa.semester_slot_id
    JOIN users u ON u.id = fa.faculty_id
    LEFT JOIN rooms r ON r.id = fa.room_id
    LEFT JOIN semester_seating_arrangements ssa
      ON ssa.semester_slot_id = s.id AND ssa.room_id = r.id
    WHERE s.exam_date >= CURDATE()
      AND fa.faculty_id = ?
    GROUP BY s.id
    ORDER BY exam_date ASC
  `;

  db.query(sql, [facultyId, facultyId], (err, rows) => {
    if (err) {
      console.error("FACULTY DASHBOARD ERROR:", err);
      return res.status(500).json({ message: "Database error" });
    }
    return res.json({ allocations: rows });
  });
};

/* ================= FACULTY SEATING VIEW ================= */
export const getFacultySeatingView = (req, res) => {
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
        WHERE fa.exam_id = ?
          AND fa.faculty_id = ?
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
        WHERE sfa.semester_slot_id = ?
          AND sfa.faculty_id = ?
        ORDER BY r.room_name, ssa.seat_number
      `;
      params = [examId, facultyId];
    }

    else {
      return res.status(400).json({ message: "Invalid examType" });
    }

    db.query(sql, params, (err, rows) => {
      if (err) {
        console.error("SEATING ERROR:", err);
        return res.status(500).json({ message: "Database error" });
      }

      return res.json(rows);
    });

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
export const getFaculty = (req, res) => {
  const sql = `
    SELECT id, name, email, branch, is_active
    FROM users
    WHERE role = 'FACULTY'
  `;
  db.query(sql, (err, rows) => {
    if (err) {
      console.error("GET FACULTY ERROR:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(rows);
  });
};


/* ================= CREATE FACULTY (ADMIN) ================= */
export const createFaculty = async (req, res) => {
  const { name, email, password, branch } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: "Name and email are required" });
  }

  try {
    const hash = await bcrypt.hash(password || "password", 10);

    const sql = `
      INSERT INTO users
      (name, email, password, branch, role, is_active)
      VALUES (?, ?, ?, ?, 'FACULTY', 1)
    `;

    db.query(sql, [name, email, hash, branch], (err) => {
      if (err) {
        console.error("CREATE FACULTY ERROR:", err);
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ message: "Email already exists" });
        }
        return res.status(500).json({ message: "Database error" });
      }

      res.status(201).json({ message: "Faculty created" });
    });
  } catch (err) {
    console.error("CREATE FACULTY HASH ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= UPDATE FACULTY (ADMIN) ================= */
export const updateFaculty = async (req, res) => {
  const { id } = req.params;
  const { name, email, password, is_active, branch } = req.body;

  if (!id) return res.status(400).json({ message: "Faculty id required" });

  let sql = `UPDATE users SET name = ?, email = ?, branch = ?`;
  const params = [name, email, branch];

  if (typeof is_active !== "undefined") {
    sql += `, is_active = ?`;
    params.push(is_active ? 1 : 0);
  }

  if (password) {
    try {
      const hash = await bcrypt.hash(password, 10);
      sql += `, password = ?`;
      params.push(hash);
    } catch (err) {
      console.error("UPDATE FACULTY HASH ERROR:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }

  sql += ` WHERE id = ? AND role = 'FACULTY'`;
  params.push(id);

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("UPDATE FACULTY ERROR:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    res.json({ message: "Faculty updated" });
  });
};

/* ================= TOGGLE (ACTIVATE/DEACTIVATE) FACULTY ================= */
export const toggleFaculty = (req, res) => {
  const { id } = req.params;

  db.query(
    `UPDATE users SET is_active = IF(is_active=1,0,1) WHERE id = ? AND role = 'FACULTY'`,
    [id],
    (err, result) => {
      if (err) {
        console.error("TOGGLE FACULTY ERROR:", err);
        return res.status(500).json({ message: "Database error" });
      }

      if (result.affectedRows === 0) {
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
    "DELETE FROM users WHERE id = ? AND role = 'FACULTY'",
    [id],
    (err, result) => {
      if (err) {
        console.error("DELETE FACULTY ERROR:", err);
        return res.status(500).json({ message: "Delete failed" });
      }

      if (result.affectedRows === 0) {
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
      ON r.id = fa.room_id AND fa.exam_id = ?
    LEFT JOIN users u
      ON fa.faculty_id = u.id
    WHERE r.is_active = 1
    ORDER BY r.room_name
  `;

  db.query(sql, [examId], (err, rows) => {
    if (err) {
      console.error("GET FACULTY ALLOCATION ERROR:", err);
      return res.status(500).json({ message: "Database error" });
    }

    res.json(rows);
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
    WHERE exam_id = ? AND faculty_id = ? AND room_id != ?
  `;

  db.query(checkSql, [exam_id, faculty_id, room_id], (err, rows) => {
    if (err) {
      console.error("FACULTY CHECK ERROR:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (rows.length > 0) {
      return res.status(400).json({
        message: "This faculty is already assigned to another room for this exam",
      });
    }

    // 2️⃣ Safe to insert / update
    const saveSql = `
      INSERT INTO faculty_allocation
        (exam_id, room_id, faculty_id, allocated_date, status)
      VALUES (?, ?, ?, CURDATE(), 'Assigned')
      ON DUPLICATE KEY UPDATE
        faculty_id = VALUES(faculty_id),
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

  const sql = `DELETE FROM faculty_allocation WHERE exam_id = ? AND room_id = ?`;
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
    WHERE ssa.semester_slot_id = ?
    ORDER BY ssa.seat_number
  `;

  db.query(sql, [slotId], (err, rows) => {
    if (err) {
      console.error("Semester seating error:", err);
      return res.status(500).json({ message: "Failed to load seating" });
    }

    res.json(rows);
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
      WHERE role = 'FACULTY'
        AND is_active = 1
      ORDER BY id
      `,
      (err, faculty) => {
        if (err || faculty.length === 0) {
          return reject("No faculty available");
        }

        // 2️⃣ Fetch ACTIVE ROOMS
        db.query(
          `
          SELECT id
          FROM rooms
          WHERE is_active = 1
          ORDER BY id
          `,
          (err, rooms) => {
            if (err || rooms.length === 0) {
              return reject("No rooms available");
            }

            // 3️⃣ Remove old allocation for this exam
            db.query(
              "DELETE FROM faculty_allocation WHERE exam_id = ?",
              [examId],
              () => {
                const values = [];
                let facultyIndex = 0;

                // 4️⃣ Round-robin assignment
                rooms.forEach(room => {
                  const facultyMember =
                    faculty[facultyIndex % faculty.length];

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
                db.query(
                  `
                  INSERT INTO faculty_allocation
                  (exam_id, room_id, faculty_id, allocated_date, status)
                  VALUES ?
                  `,
                  [values],
                  (err) => {
                    if (err) {
                      return reject("Faculty allocation failed");
                    }
                    resolve();
                  }
                );
              }
            );
          }
        );
      }
    );
  });
};
