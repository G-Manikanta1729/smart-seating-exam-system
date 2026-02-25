import PDFDocument from "pdfkit";
import db from "../db/db.js";

/* =========================
   GET SEMESTER SLOTS
========================= */
export const getSemesterSlots = (req, res) => {
  db.query(
    "SELECT * FROM semester_exam_slots ORDER BY exam_date, exam_time",
    (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error" });
      res.json(rows);
    }
  );
};

/* =========================
   CREATE SLOT
========================= */
export const createSemesterSlot = (req, res) => {
  const { year, exam_date, exam_time } = req.body;

  db.query(
    "INSERT INTO semester_exam_slots (year, exam_date, exam_time) VALUES (?,?,?)",
    [year, exam_date, exam_time],
    (err) => {
      if (err) return res.status(500).json({ message: "DB error" });
      res.json({ message: "Slot created" });
    }
  );
};

/* =========================
   DELETE SLOT
========================= */
export const deleteSemesterSlot = (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM semester_exam_slots WHERE id=?", [id], err => {
    if (err) return res.status(500).json({ message: "Delete failed" });
    res.json({ message: "Slot deleted" });
  });
};

/* =========================
   AUTO ALLOCATE FACULTY (SEMESTER – NEW TABLES)
========================= */
const autoAllocateFacultyForSemesterSlot = (slotId) => {
  return new Promise((resolve, reject) => {

    // Check if already allocated
    db.query(
      "SELECT COUNT(*) AS count FROM semester_faculty_allocation WHERE semester_slot_id=?",
      [slotId],
      (err, result) => {
        if (err) return reject(err);
        if (result[0].count > 0) return resolve();

        // Get all active faculty
        db.query(
          `SELECT id AS faculty_id
FROM users
WHERE role='FACULTY' AND is_active=1
ORDER BY id`,
          (err, faculty) => {
            if (err || !faculty.length)
              return reject("No faculty available");

            // Get last assigned faculty globally
            db.query(
              `SELECT faculty_id 
               FROM semester_faculty_allocation
               ORDER BY id DESC
               LIMIT 1`,
              (err, last) => {

                let startIndex = 0;

                if (!err && last.length > 0) {
                  const lastFacultyId = last[0].faculty_id;
                  const foundIndex = faculty.findIndex(f => f.faculty_id === lastFacultyId);
                  if (foundIndex !== -1) {
                    startIndex = (foundIndex + 1) % faculty.length;
                  }
                }

                // Get rooms
                db.query(
                  `SELECT DISTINCT room_id
                   FROM semester_seating_arrangements
                   WHERE semester_slot_id=?`,
                  [slotId],
                  (err, rooms) => {
                    if (err || !rooms.length)
                      return reject("No rooms found");

                    const values = [];
                    let index = startIndex;

                    rooms.forEach(r => {
                      const f = faculty[index % faculty.length];
                      values.push([
                        slotId,
                        r.room_id,
                        f.faculty_id,
                        new Date(),
                        "Assigned"
                      ]);
                      index++;
                    });

                    db.query(
                      `INSERT INTO semester_faculty_allocation
                       (semester_slot_id, room_id, faculty_id, allocated_date, status)
                       VALUES ?`,
                      [values],
                      err => {
                        if (err) return reject(err);
                        resolve();
                      }
                    );
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
/* =========================
   GENERATE SEMESTER SEATING
========================= */
export const generateSemesterSeating = (req, res) => {
  const { slot_id, room_ids } = req.body;

  if (!slot_id || !room_ids?.length) {
    return res.status(400).json({ message: "Slot or rooms missing" });
  }

  const BRANCH_ORDER = ["IT", "CSE", "ECE", "EEE", "CSD", "CSM", "MECH", "CIV"];

  db.query(
    "DELETE FROM semester_seating_arrangements WHERE semester_slot_id=?",
    [slot_id],
    err => {
      if (err) return res.status(500).json({ message: "Reset failed" });

      db.query(
        "SELECT year FROM semester_exam_slots WHERE id=?",
        [slot_id],
        (err, slot) => {
          if (err || !slot.length)
            return res.status(404).json({ message: "Slot not found" });

          db.query(
            `SELECT id, room_name, capacity
             FROM rooms
             WHERE id IN (?) AND is_active=1`,
            [room_ids],
            (err, rooms) => {
              if (err) return res.status(500).json({ message: "Room fetch error" });

              db.query(
                `SELECT id, branch, roll_number
                 FROM users
                 WHERE role='STUDENT' AND year=? AND is_active=1
                 ORDER BY branch, roll_number`,
                [slot[0].year],
                (err, students) => {
                  if (err)
                    return res.status(500).json({ message: "Student fetch error" });

                  const branchMap = {};
                  BRANCH_ORDER.forEach(b => (branchMap[b] = []));
                  students.forEach(s => branchMap[s.branch]?.push(s));

                  const inserts = [];
                  let branchIndex = 0;

                  rooms.forEach(room => {
                    let seat = 1;
                    while (seat <= room.capacity) {
                      let assigned = false;
                      for (let i = 0; i < BRANCH_ORDER.length; i++) {
                        const b = BRANCH_ORDER[branchIndex++ % BRANCH_ORDER.length];
                        if (branchMap[b]?.length) {
                          const st = branchMap[b].shift();
                          inserts.push([slot_id, room.id, seat++, st.id]);
                          assigned = true;
                          break;
                        }
                      }
                      if (!assigned) break;
                    }
                  });

                  db.query(
                    `INSERT INTO semester_seating_arrangements
                     (semester_slot_id, room_id, seat_number, student_id)
                     VALUES ?`,
                    [inserts],
                    async () => {
                      try {
                        await autoAllocateFacultyForSemesterSlot(slot_id);
                      } catch (e) {
                        console.error("Semester faculty allocation failed:", e);
                      }
                      res.json({
                        message: "Semester seating & faculty allocation generated"
                      });
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
};

/* =========================
   VIEW SEMESTER SEATING
========================= */
export const viewSemesterSeating = (req, res) => {
  const { slotId } = req.params;

  const sql = `
    SELECT
  r.id AS room_id,
  r.room_name,
  r.capacity,
  s.seat_number,
  u.roll_number,
  u.name,
  u.branch,
  u_fac.name AS faculty_name,
  u_fac.email AS faculty_email
FROM semester_seating_arrangements s
JOIN users u ON s.student_id = u.id
JOIN rooms r ON s.room_id = r.id
LEFT JOIN semester_faculty_allocation sfa
  ON sfa.semester_slot_id = s.semester_slot_id
 AND sfa.room_id = r.id
LEFT JOIN users u_fac
  ON u_fac.id = sfa.faculty_id
WHERE s.semester_slot_id = ?
ORDER BY r.room_name, s.seat_number
  `;

  db.query(sql, [slotId], (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });
    if (!rows.length)
      return res.status(404).json({ message: "No seating found" });
    res.json(rows);
  });
};

/* =========================
   DOWNLOAD PDF
========================= */
export const downloadSemesterSeatingPDF = (req, res) => {
  const { slotId } = req.params;

  // First get the exam slot details
  const slotSql = `
    SELECT year, exam_date, exam_time 
    FROM semester_exam_slots 
    WHERE id = ?
  `;

  db.query(slotSql, [slotId], (err, slots) => {
    if (err || !slots.length) {
      return res.status(404).json({ message: "Exam slot not found" });
    }

    const slot = slots[0];

    // Then get detailed seating with room capacity (UPDATED TABLES ONLY)
    const seatingSql = `
      SELECT 
  r.id AS room_id,
  r.room_name,
  r.capacity,
  u_fac.name AS faculty_name,
  u_fac.email AS faculty_email,
  s.seat_number,
  u.roll_number,
  u.name,
  u.branch,
  COUNT(s.id) OVER (PARTITION BY r.id) AS room_allocation
FROM semester_seating_arrangements s
JOIN rooms r ON r.id = s.room_id
JOIN users u ON u.id = s.student_id
LEFT JOIN semester_faculty_allocation sfa
  ON sfa.semester_slot_id = s.semester_slot_id
 AND sfa.room_id = r.id
LEFT JOIN users u_fac
  ON u_fac.id = sfa.faculty_id
WHERE s.semester_slot_id = ?
ORDER BY r.room_name, s.seat_number
    `;

    db.query(seatingSql, [slotId], (err, rows) => {
      if (err || !rows.length) {
        return res.status(404).json({ message: "No seating found" });
      }

      const doc = new PDFDocument({ margin: 40 });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=semester_seating_${new Date().toISOString().split("T")[0]}.pdf`
      );
      doc.pipe(res);

      // Header with exam details
      doc.fontSize(20).font("Helvetica-Bold").text("SEMESTER SEATING ARRANGEMENT", {
        align: "center",
      });
      doc.moveDown(0.3);
      doc.fontSize(10).font("Helvetica").text("Generated: " + new Date().toLocaleString(), {
        align: "center",
      });
      doc.moveDown(1);

      // Exam slot details
      doc.fontSize(12).font("Helvetica-Bold").text("Exam Details:");
      doc.fontSize(11).font("Helvetica")
        .text(`Year: ${slot.year}`)
        .text(`Date: ${new Date(slot.exam_date).toLocaleDateString()}`)
        .text(`Time: ${slot.exam_time}`)
        .moveDown(1);

      let currentRoom = "";
      const roomStats = {};

      // Calculate room stats
      rows.forEach((r) => {
        if (!roomStats[r.room_id]) {
          roomStats[r.room_id] = {
            room_name: r.room_name,
            capacity: r.capacity,
            allocated: r.room_allocation,
          };
        }
      });

      // Room Summary
      doc.fontSize(12).font("Helvetica-Bold").text("Room Summary:");
      Object.values(roomStats).forEach((room) => {
        const utilization = ((room.allocated / room.capacity) * 100).toFixed(1);
        doc.fontSize(10).font("Helvetica")
          .text(
            `${room.room_name}: ${room.allocated}/${room.capacity} students (${utilization}%)`
          );
      });
      doc.moveDown(1);

      // Detailed seating
      doc.fontSize(12).font("Helvetica-Bold").text("Seating Arrangement by Room:");
      doc.moveDown(0.5);

      rows.forEach((r, i) => {
        if (r.room_name !== currentRoom) {
          if (currentRoom) doc.addPage();
          if (i > 0) doc.moveDown(1);

          currentRoom = r.room_name;

          doc.fontSize(14).font("Helvetica-Bold").fillColor("blue")
            .text(`Room: ${currentRoom}`);
          doc.fontSize(11).font("Helvetica").fillColor("black")
            .text(
              `Capacity: ${roomStats[r.room_id].capacity} | Allocated: ${roomStats[r.room_id].allocated}`
            )
            .text(`Faculty/Invigilator: ${r.faculty_name || "Not Assigned"}`)
            .moveDown(0.5);

          doc.fontSize(10).text("Seat | Roll No | Name | Branch");
          doc.moveDown(0.3);
        }

        doc.fontSize(10).text(
          `${r.seat_number} | ${r.roll_number} | ${r.name.substring(0, 20)} | ${r.branch}`
        );
      });

      doc.end();
    });
  });
};