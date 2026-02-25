import mysql from "mysql2";

const db = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: process.env.MYSQL_PORT,
  ssl: {
    rejectUnauthorized: false,
  },
});

/* ================= USERS ================= */

db.query(`
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','faculty','student') NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  roll_number VARCHAR(20),
  branch ENUM('CSE','IT','CSD','CSM','ECE','EEE','MECH','CIVIL'),
  year VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`, (err) => {
  if (err) {
    console.error("Error creating users table:", err);
  } else {
    console.log("Users table ready");
  }
});


/* ================= ATTENDANCE ================= */

db.query(`
CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  exam_type ENUM('REGULAR','SEMESTER') NOT NULL,
  exam_id INT NOT NULL,
  student_id INT NOT NULL,
  faculty_id INT NOT NULL,
  status ENUM('PRESENT','ABSENT') NOT NULL,
  is_submitted TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
`);

/* ================= EXAMS ================= */
db.query(`
CREATE TABLE IF NOT EXISTS exams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  exam_name VARCHAR(100) NOT NULL,
  branch ENUM('CSE','IT','CSD','CSM','ECE','EEE','MECH','CIVIL') NOT NULL,
  year VARCHAR(20) NOT NULL,
  exam_date DATE NOT NULL,
  exam_time TIME NOT NULL,
  duration INT NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  seating_generated TINYINT(1) DEFAULT 0
);
`);

/* ================= FACULTY ALLOCATION ================= */
db.query(`
CREATE TABLE IF NOT EXISTS faculty_allocation (
  id INT AUTO_INCREMENT PRIMARY KEY,
  exam_id INT NOT NULL,
  room_id INT NOT NULL,
  faculty_id INT NOT NULL,
  allocated_date DATE NOT NULL,
  status ENUM('Assigned','Pending') DEFAULT 'Assigned',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
`);

/* ================= REPORTS ================= */

db.query(`
CREATE TABLE IF NOT EXISTS reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_type ENUM('SEATING','FACULTY','ATTENDANCE','ROOM') NOT NULL,
  exam_id INT,
  exam_name VARCHAR(255),
  generated_by VARCHAR(100),
  role ENUM('ADMIN','FACULTY') NOT NULL,
  format ENUM('PDF','EXCEL','PRINT') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`);

/* ================= ROOMS ================= */

db.query(`
CREATE TABLE IF NOT EXISTS rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_name VARCHAR(50) NOT NULL,
  rows_count INT NOT NULL,
  cols_count INT NOT NULL,
  capacity INT,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`);

/* ================= SEATING ARRANGEMENTS ================= */
db.query(`
CREATE TABLE IF NOT EXISTS seating_arrangements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  exam_id INT NOT NULL,
  room_id INT NOT NULL,
  student_id INT NOT NULL,
  seat_label VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_deleted TINYINT DEFAULT 0,
  seat_number INT
);
`);

/* ================= SEMESTER EXAM SLOTS ================= */
db.query(`
CREATE TABLE IF NOT EXISTS semester_exam_slots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  year VARCHAR(20) NOT NULL,
  exam_date DATE NOT NULL,
  exam_time TIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  semester_slot_id INT
);
`);

/* ================= SEMESTER FACULTY ALLOCATION ================= */
db.query(`
CREATE TABLE IF NOT EXISTS semester_faculty_allocation (
  id INT AUTO_INCREMENT PRIMARY KEY,
  semester_slot_id INT NOT NULL,
  room_id INT NOT NULL,
  faculty_id INT NOT NULL,
  allocated_date DATE NOT NULL,
  status ENUM('Assigned') DEFAULT 'Assigned',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`);

/* ================= SEMESTER SEATING ARRANGEMENTS ================= */
db.query(`
CREATE TABLE IF NOT EXISTS semester_seating_arrangements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  semester_slot_id INT NOT NULL,
  room_id INT NOT NULL,
  seat_number INT NOT NULL,
  student_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`);

export default db;