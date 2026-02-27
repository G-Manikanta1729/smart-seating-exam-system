import db from "../db/db.js";
import PDFDocument from "pdfkit";
import { autoAllocateFaculty } from "./faculty.controller.js";


/* ================= GENERATE / REGENERATE ================= */
export const generateSeating = (req, res) => {
  const { examId } = req.params;

  //  Delete old seating
  db.query(
    "DELETE FROM seating_arrangements WHERE exam_id=?",
    [examId],
    () => {

      //  Get exam
      db.query(
        "SELECT * FROM exams WHERE id=? AND is_active=1",
        [examId],
        (err, exams) => {
          if (err || exams.length === 0)
            return res.status(400).json({ message: "Invalid exam" });

          const exam = exams[0];

          //  Get students
          db.query(
            `
            SELECT id, roll_number, name
            FROM users
            WHERE role='STUDENT'
              AND is_active=1
              AND branch=?
              AND year=?
            ORDER BY roll_number ASC
            `,
            [exam.branch, exam.year],
            (err, students) => {
              if (err || students.length === 0)
                return res.status(400).json({ message: "No students found" });

              //  Get rooms
              db.query(
                "SELECT * FROM rooms WHERE is_active=1 ORDER BY id",
                (err, rooms) => {
                  if (err || rooms.length === 0)
                    return res.status(400).json({ message: "No rooms available" });

                  let index = 0;
                  const values = [];

                  // Seat allocation
                  rooms.forEach(room => {
                    const roomCapacity = room.rows_count * room.cols_count;
                    for (let i = 1; i <= roomCapacity; i++) {
                      if (index >= students.length) break;

                      const student = students[index];
                      if (!student || !student.id) break;

                      values.push([
                        examId,
                        room.id,
                        student.id,
                        `S${i}`,
                        0
                      ]);

                      index++;
                    }
                  });

                  if (values.length === 0)
                    return res.status(400).json({ message: "Insufficient capacity" });

                  //  Insert seating
                  db.query(
                    `
                    INSERT INTO seating_arrangements
                    (exam_id, room_id, student_id, seat_label, is_deleted)
                    VALUES ?
                    `,
                    [values],
                    err => {
                      if (err) {
                        console.error("INSERT ERROR:", err);
                        return res.status(500).json({ message: "Insert failed" });
                      }

                      //  Mark seating generated
                      db.query(
                        "UPDATE exams SET seating_generated=1 WHERE id=?",
                        [examId]
                      );

                      /* ================= AUTO FACULTY ALLOCATION ================= */

                      // Remove previous faculty allocation for this exam
                      db.query(
                        "DELETE FROM faculty_allocation WHERE exam_id=?",
                        [examId],
                        () => {

                          // Get rooms used
                          db.query(
                            `
                            SELECT DISTINCT room_id
                            FROM seating_arrangements
                            WHERE exam_id=?
                            `,
                            [examId],
                            (err, roomRows) => {
                              if (err) {
                                console.error("ROOM FETCH ERROR:", err);
                                return res.json({ message: "Seating generated (faculty skipped)" });
                              }

                              // Get active faculty
                              db.query(
                                `
                                SELECT id
                                FROM users
                                WHERE role='FACULTY' AND is_active=1
                                ORDER BY id
                                `,
                                (err, facultyRows) => {
                                  if (err || facultyRows.length === 0) {
                                    console.error("FACULTY FETCH ERROR:", err);
                                    return res.json({ message: "Seating generated (no faculty)" });
                                  }

                                  // Assign faculty round-robin
                                  roomRows.forEach((room, i) => {
                                    const facultyId =
                                      facultyRows[i % facultyRows.length].id;

                                    db.query(
                                      `
                                      INSERT INTO faculty_allocation
                                      (exam_id, room_id, faculty_id, allocated_date, status)
                                      VALUES (?, ?, ?, CURDATE(), 'Assigned')
                                      `,
                                      [examId, room.room_id, facultyId]
                                    );
                                  });

                                  /*res.json({
                                    message: "Seating & Faculty allocation generated successfully"
                                  });*/
                                  autoAllocateFaculty(examId)
                                    .then(() => {
                                      res.json({
                                        message: "Seating & faculty allocated successfully"
                                      });
                                    })
                                    .catch(err => {
                                      console.error("AUTO FACULTY ERROR:", err);
                                      res.status(500).json({
                                        message: "Seating done but faculty allocation failed"
                                      });
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
            }
          );
        }
      );
    }
  );
};

/* ================= VIEW SEATING ================= */
export const getSeatingByExam = (req, res) => {
  const { examId } = req.params;

  db.query(
    `
    SELECT r.room_name,
           sa.seat_label AS seat_number,
           sa.student_id,
           u.roll_number,
           u.name
    FROM seating_arrangements sa
    JOIN rooms r ON r.id=sa.room_id
    JOIN users u ON u.id=sa.student_id
    WHERE sa.exam_id=? AND sa.is_deleted=0
    ORDER BY r.room_name, sa.seat_label
    `,
    [examId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Fetch failed" });
      res.json(rows);
    }
  );
};

/* ================= UNDO ================= */
export const undoDeleteSeating = (req, res) => {
  const { examId } = req.params;

  db.query(
    "UPDATE seating_arrangements SET is_deleted=0 WHERE exam_id=?",
    [examId],
    () => res.json({ message: "Undo successful" })
  );
};

/* ================= EXPORT PDF ================= */
export const exportSeatingPDF = (req, res) => {
  const { examId } = req.params;

  const doc = new PDFDocument();
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=seating_${examId}.pdf`
  );
  doc.pipe(res);

  db.query(
    `
    SELECT r.room_name, sa.seat_label, u.roll_number, u.name
    FROM seating_arrangements sa
    JOIN rooms r ON r.id=sa.room_id
    JOIN users u ON u.id=sa.student_id
    WHERE sa.exam_id=? AND sa.is_deleted=0
    ORDER BY r.room_name, sa.seat_label
    `,
    [examId],
    (err, rows) => {
      if (err) {
        doc.text("Failed to generate PDF");
        return doc.end();
      }

      let currentRoom = "";
      rows.forEach(r => {
        if (r.room_name !== currentRoom) {
          doc.moveDown().fontSize(14).text(`Room: ${r.room_name}`);
          currentRoom = r.room_name;
        }
        doc.fontSize(10).text(
          `${r.seat_label} | ${r.roll_number} | ${r.name}`
        );
      });

      doc.end();
    }
  );
};

/* ===========================
   DELETE SEATING ARRANGEMENT
=========================== */
export const deleteSeating = (req, res) => {
  const { examId } = req.params;

  db.query(
    "DELETE FROM seating_arrangements WHERE exam_id = ?",
    [examId],
    (err) => {
      if (err) {
        console.error("DELETE SEATING ERROR:", err);
        return res.status(500).json({ message: "Failed to delete seating" });
      }

      // remove faculty allocation too
      db.query(
        "DELETE FROM faculty_allocation WHERE exam_id = ?",
        [examId]
      );

      db.query(
        "UPDATE exams SET seating_generated = 0 WHERE id = ?",
        [examId]
      );

      res.json({ message: "Seating deleted successfully" });
    }
  );
};