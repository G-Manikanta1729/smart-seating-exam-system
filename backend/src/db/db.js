import mysql from "mysql2";

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "pvpsit",
  database: "exam_management",
});

export default db;
