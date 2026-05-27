import db from "../db/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

/**
 * REGISTER
 */
export const register = async (req, res) => {
  const { name, email, password, role, roll_number, branch, year } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ message: "Required fields missing" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO users
      (name, email, password, role, roll_number, branch, year)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    try {
  await db.query(sql, [
  name,
  email,
 hashedPassword,
  role.toLowerCase(),
  roll_number,
  branch.toUpperCase(),
  year
]);

  res.status(201).json({
    message: "User registered successfully"
  });

} catch (err) {

  if (err.code === "23505") {
    return res.status(409).json({
      message: "Email already exists"
    });
  }

  return res.status(500).json({
    message: "Database error"
  });
}
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * LOGIN (your existing code)
 */
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password required"
    });
  }

  try {
    const results = await db.query(
      "SELECT * FROM users WHERE email = $1 AND is_active = true",
      [email]
    );

    if (results.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    const user = results.rows[0];

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role.toUpperCase()
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d"
      }
    );

    res.json({
      token,
      id: user.id,
      role: user.role.toUpperCase(),
      name: user.name,
      email: user.email
    });

  } catch (err) {
    return res.status(500).json({
      message: "Database error"
    });
  }
};
