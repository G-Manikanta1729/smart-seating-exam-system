import pkg from 'pg';
const { Pool } = pkg;

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

/* ================= USERS ================= */

db.query(`
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) CHECK (role IN ('admin','faculty','student')) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  roll_number VARCHAR(20),
  branch VARCHAR(10) CHECK (branch IN ('CSE','IT','CSD','CSM','ECE','EEE','MECH','CIVIL')),
  year VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`)
.then(() => console.log("Users table ready"))
.catch((err) => console.error("Error creating users table:", err));

/* ================= ATTENDANCE ================= */

db.query(`
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  exam_type VARCHAR(20) CHECK (exam_type IN ('REGULAR','SEMESTER')) NOT NULL,
  exam_id INT NOT NULL,
  student_id INT NOT NULL,
  faculty_id INT NOT NULL,
  status VARCHAR(10) CHECK (status IN ('PRESENT','ABSENT')) NOT NULL,
  is_submitted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(exam_type, exam_id, student_id, faculty_id)
  
);
`)
.then(() => console.log("Attendance table ready"))
.catch((err) => console.error("Error creating attendance table:", err));

/* ================= EXAMS ================= */
db.query(`
CREATE TABLE IF NOT EXISTS exams (
  id SERIAL PRIMARY KEY,
  exam_name VARCHAR(100) NOT NULL,
  branch VARCHAR(10) CHECK (branch IN ('CSE','IT','CSD','CSM','ECE','EEE','MECH','CIVIL')) NOT NULL,
  year VARCHAR(20) NOT NULL,
  exam_date DATE NOT NULL,
  exam_time TIME NOT NULL,
  duration INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  seating_generated BOOLEAN DEFAULT FALSE
);
`)
.then(() => console.log("Exams table ready"))
.catch((err) => console.error("Error creating exams table:", err));

/* ================= FACULTY ALLOCATION ================= */
db.query(`
CREATE TABLE IF NOT EXISTS faculty_allocation (
  id SERIAL PRIMARY KEY,
  exam_id INT NOT NULL,
  room_id INT NOT NULL,
  faculty_id INT NOT NULL,
  allocated_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'Assigned',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`)
.then(() => console.log("Faculty Allocation table ready"))
.catch((err) => console.error("Error creating faculty allocation table:", err));

/* ================= REPORTS ================= */

db.query(`
CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  report_type VARCHAR(20) CHECK (report_type IN ('SEATING','FACULTY','ATTENDANCE','ROOM')) NOT NULL,
  exam_id INT,
  exam_name VARCHAR(255),
  generated_by VARCHAR(100),
  role VARCHAR(10) CHECK (role IN ('ADMIN','FACULTY')) NOT NULL,
  format VARCHAR(10) CHECK (format IN ('PDF','EXCEL','PRINT')) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`)
.then(() => console.log("Reports table ready"))
.catch((err) => console.error("Error creating reports table:", err));

/* ================= ROOMS ================= */

db.query(`
CREATE TABLE IF NOT EXISTS rooms (
  id SERIAL PRIMARY KEY,
  room_name VARCHAR(50) NOT NULL,
  rows_count INT NOT NULL,
  cols_count INT NOT NULL,
  capacity INT GENERATED ALWAYS AS (rows_count * cols_count) STORED,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`)
.then(() => console.log("Rooms table ready"))
.catch((err) => console.error("Error creating rooms table:", err));

/* ================= SEATING ARRANGEMENTS ================= */
db.query(`
CREATE TABLE IF NOT EXISTS seating_arrangements (
  id SERIAL PRIMARY KEY,
  exam_id INT NOT NULL,
  room_id INT NOT NULL,
  student_id INT NOT NULL,
  seat_label VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_deleted INT DEFAULT 0,
  seat_number INT
);
`)
.then(() => console.log("Seating Arrangements table ready"))
.catch((err) => console.error("Error creating seating arrangements table:", err));

/* ================= SEMESTER EXAM SLOTS ================= */
db.query(`
CREATE TABLE IF NOT EXISTS semester_exam_slots (
  id SERIAL PRIMARY KEY,
  year VARCHAR(20) NOT NULL,
  exam_date DATE NOT NULL,
  exam_time TIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  semester_slot_id INT
);
`)
.then(() => console.log("Semester exam slots table ready"))
.catch((err) => console.error("Error creating semester exam slots table:", err));

/* ================= SEMESTER FACULTY ALLOCATION ================= */
db.query(`
CREATE TABLE IF NOT EXISTS semester_faculty_allocation (
  id SERIAL PRIMARY KEY,
  semester_slot_id INT NOT NULL,
  room_id INT NOT NULL,
  faculty_id INT NOT NULL,
  allocated_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'Assigned',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`)
.then(() => console.log("Semester faculty allocation table ready"))
.catch((err) => console.error("Error creating semester faculty allocation table:", err));

/* ================= SEMESTER SEATING ARRANGEMENTS ================= */
db.query(`
CREATE TABLE IF NOT EXISTS semester_seating_arrangements (
  id SERIAL PRIMARY KEY,
  semester_slot_id INT NOT NULL,
  room_id INT NOT NULL,
  seat_number INT NOT NULL,
  student_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`)
.then(() => console.log("semester seating arrangements table ready"))
.catch((err) => console.error("Error creating seating arrangements table:", err));

export default db;
