import db from "../db/db.js";
import bcrypt from "bcrypt";

/**
 * GET students (search + filter + pagination)
 */
export const getStudents = async (req, res) => {
  const {
    search = "",
    branch = "ALL",
    year = "ALL",
    page = 1,
    limit = 20, // DEFAULT 20 PER PAGE
  } = req.query;

  const pageSize = Number(limit);
  const offset = (page - 1) * pageSize;

  let where = `WHERE role='student'`;
  const params = [];

  if (search) {
    where += ` AND (name ILIKE $${params.length + 1} OR roll_number ILIKE $${params.length + 2})`;
    params.push(`%${search}%`, `%${search}%`);
  }

  if (branch !== "ALL") {
    where += ` AND branch = $${params.length + 1}`;
    params.push(branch);
  }

  if (year !== "ALL") {
    where += ` AND year = $${params.length + 1}`;
    params.push(year);
  }

  const sql = `
  SELECT
    id,
    name,
    roll_number,
    branch,
    year,
    is_active
  FROM users
  ${where}
  ORDER BY id DESC
  LIMIT $${params.length + 1}
  OFFSET $${params.length + 2}
`;

  try {
  const rows = await db.query(
    sql,
    [...params, pageSize, offset]
  );

  const totalQuery = `
    SELECT COUNT(*) AS total
    FROM users
    ${where}
  `;

  const totalResult = await db.query(
    totalQuery,
    params
  );

  res.json({
    data: rows.rows,
    total: Number(totalResult.rows[0].total)
  });

} catch (err) {
  console.error(err);
  return res.status(500).json({
    message: "DB error"
  });
}
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
    VALUES ($1, $2, $3, $4, $5, $6, 'student')
  `;

  try {
  await db.query(sql, [
    name,
    roll_number,
    branch,
    year,
    email,
    hash
  ]);

  res.json({
    message: "Student added"
  });

} catch (err) {
  console.error(err);

  res.status(500).json({
    message: "DB error"
  });
}
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
    SET name=$1, roll_number=$2, branch=$3, year=$4
  `;
  const params = [name, roll_number, branch, year];

  if (password) {
    const hash = await bcrypt.hash(password, 10);
    sql += `, password=$5`;
    params.push(hash);
  }

  sql += password
  ? ` WHERE id=$6`
  : ` WHERE id=$5`;
  params.push(id);

  try {
  await db.query(sql, params);

  res.json({
    message: "Student updated"
  });

} catch (err) {
  console.error(err);

  res.status(500).json({
    message: "DB error"
  });
}
};

/**
 * ACTIVATE / DEACTIVATE (soft delete)
 */
export const toggleStudent = async (req, res) => {
  const { id } = req.params;

  try {
    await db.query(
      `
      UPDATE users
      SET is_active = NOT is_active
      WHERE id=$1
      `,
      [id]
    );

    res.json({
      message: "Status updated"
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "DB error"
    });
  }
};

/**
 * DASHBOARD STATS
 */
export const getDashboardStats = async (req, res) => {
  try {

    const students = await db.query(
      "SELECT COUNT(*) AS total FROM users WHERE role='student' AND is_active=true"
    );

    const rooms = await db.query(
      "SELECT COUNT(*) AS total FROM rooms WHERE is_active=true"
    );

    const exams = await db.query(
      "SELECT COUNT(*) AS total FROM exams WHERE exam_date = CURRENT_DATE AND is_active=true"
    );

    const seating = await db.query(
      "SELECT COUNT(DISTINCT exam_id) AS total FROM seating_arrangements WHERE is_deleted=0"
    );

    res.json({
      students: students.rows[0].total,
      rooms: rooms.rows[0].total,
      todayExams: exams.rows[0].total,
      seatingGenerated: seating.rows[0].total
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: "DB error"
    });
  }
};

/**
 * PERMANENT DELETE student
 */
export const deleteStudentPermanent = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      "DELETE FROM users WHERE id = $1 AND role = 'student'",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    res.json({
      message: "Student permanently deleted"
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: "Delete failed"
    });
  }
};
