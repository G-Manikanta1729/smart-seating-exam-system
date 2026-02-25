import db from "../db/db.js";
import bcrypt from "bcrypt";

/**
 * GET students (search + filter + pagination)
 */
export const getStudents = (req, res) => {
  const {
    search = "",
    branch = "ALL",
    year = "ALL",
    page = 1,
    limit = 20, // DEFAULT 20 PER PAGE
  } = req.query;

  const pageSize = Number(limit);
  const offset = (page - 1) * pageSize;

  let where = `WHERE role='STUDENT'`;
  const params = [];

  if (search) {
    where += ` AND (name LIKE ? OR roll_number LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  if (branch !== "ALL") {
    where += ` AND branch = ?`;
    params.push(branch);
  }

  if (year !== "ALL") {
    where += ` AND year = ?`;
    params.push(year);
  }

  const sql = `
    SELECT SQL_CALC_FOUND_ROWS
      id, name, roll_number, branch, year, is_active
    FROM users
    ${where}
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `;

  db.query(
    sql,
    [...params, pageSize, offset],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "DB error" });
      }

      db.query(
        "SELECT FOUND_ROWS() AS total",
        (e, total) => {
          res.json({
            data: rows,
            total: total[0].total,
          });
        }
      );
    }
  );
};

/**
 * ADD student
 */
export const addStudent = async (req, res) => {
  const { name, roll_number, branch, year, email, password } =
    req.body;

  const hash = await bcrypt.hash(password, 10);

  const sql = `
    INSERT INTO users
    (name, roll_number, branch, year, email, password, role)
    VALUES (?, ?, ?, ?, ?, ?, 'STUDENT')
  `;

  db.query(
    sql,
    [name, roll_number, branch, year, email, hash],
    () => res.json({ message: "Student added" })
  );
};

/**
 * UPDATE student
 */
export const updateStudent = async (req, res) => {
  const { id } = req.params;
  const { name, roll_number, branch, year, password } =
    req.body;

  let sql = `
    UPDATE users
    SET name=?, roll_number=?, branch=?, year=?
  `;
  const params = [name, roll_number, branch, year];

  if (password) {
    const hash = await bcrypt.hash(password, 10);
    sql += `, password=?`;
    params.push(hash);
  }

  sql += ` WHERE id=?`;
  params.push(id);

  db.query(sql, params, () =>
    res.json({ message: "Student updated" })
  );
};

/**
 * ACTIVATE / DEACTIVATE (soft delete)
 */
export const toggleStudent = (req, res) => {
  const { id } = req.params;

  db.query(
    `UPDATE users
     SET is_active = IF(is_active=1,0,1)
     WHERE id=?`,
    [id],
    () => res.json({ message: "Status updated" })
  );
};

/**
 * DASHBOARD STATS
 */
export const getDashboardStats = (req, res) => {
  const stats = {};

  // Total students
  db.query(
    "SELECT COUNT(*) AS total FROM users WHERE role='STUDENT' AND is_active=1",
    (err, students) => {
      if (err) return res.status(500).json({ message: "DB error" });
      stats.students = students[0].total;

      // Total rooms
      db.query(
        "SELECT COUNT(*) AS total FROM rooms WHERE is_active=1",
        (err, rooms) => {
          if (err) return res.status(500).json({ message: "DB error" });
          stats.rooms = rooms[0].total;

          // Total exams scheduled for today
          db.query(
            "SELECT COUNT(*) AS total FROM exams WHERE exam_date = CURDATE() AND is_active=1",
            (err, exams) => {
              if (err) return res.status(500).json({ message: "DB error" });
              stats.todayExams = exams[0].total;

              // Seating generated
              db.query(
                "SELECT COUNT(DISTINCT exam_id) AS total FROM seating_arrangements WHERE is_deleted=0",
                (err, seating) => {
                  if (err) return res.status(500).json({ message: "DB error" });
                  stats.seatingGenerated = seating[0].total;

                  res.json(stats);
                }
              );
            }
          );
        }
      );
    }
  );
};

/**
 * PERMANENT DELETE student
 */
export const deleteStudentPermanent = (req, res) => {
  const { id } = req.params;

  db.query(
    "DELETE FROM users WHERE id = ? AND role = 'STUDENT'",
    [id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Delete failed" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Student not found" });
      }

      res.json({ message: "Student permanently deleted" });
    }
  );
};
