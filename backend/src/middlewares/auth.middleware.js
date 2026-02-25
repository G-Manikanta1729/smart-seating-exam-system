import jwt from "jsonwebtoken";
import db from "../db/db.js";

export default function authMiddleware(req, res, next) {
  const token =
    req.headers.authorization?.split(" ")[1]?.trim() ||
    req.query.token?.trim();
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    db.query(
      "SELECT is_active FROM users WHERE id = ?",
      [decoded.id],
      (err, result) => {
        if (err || result.length === 0) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        if (result[0].is_active === 0) {
          return res.status(403).json({ message: "Account deactivated" });
        }

        next();
      }
    );
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}