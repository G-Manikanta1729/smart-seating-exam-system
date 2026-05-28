import db from "../db/db.js";
import PDFDocument from "pdfkit";
import { autoAllocateFaculty } from "./faculty.controller.js";


/* ================= GENERATE / REGENERATE ================= */
export const generateSeating = (req, res) => {
  const { examId } = req.params;

  //  Delete old seating
  db.query(
    "DELETE FROM seating_arrangements WHERE exam_id = $1",
    [examId],
    () => {

      //  Get exam
      db.query(
        "SELECT * FROM exams WHERE id = $1 AND is_active = TRUE",
        [examId],
        (err, exams) => {
          if (err || exams.rows.length === 0)
            return res.status(400).json({ message: "Invalid exam" });

          const exam = exams.rows[0];

          //  Get students
          db.query(
            `
            SELECT id, roll_number, name
            FROM users
            WHERE role = 'student'
              AND is_active = TRUE
              AND branch = $1
              AND year = $2
            ORDER BY roll_number ASC
            `,
            [exam.branch, exam.year],
            (err, students) => {
              if (err || students.rows.length === 0)
                return res.status(400).json({ message: "No students found" });

              //  Get rooms
              db.query(
                "SELECT * FROM rooms WHERE is_active = TRUE ORDER BY id",
                (err, rooms) => {
                  if (err || rooms.rows.length === 0)
                    return res.status(400).json({ message: "No rooms available" });

                  let index = 0;
                  const values = [];

                  // Seat allocation
                  rooms.rows.forEach(room => {
                    const roomCapacity = room.rows_count * room.cols_count;
                    for (let i = 1; i <= roomCapacity; i++) {
                      if (index >= students.rows.length) break;

                      const student = students.rows[index];
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

                  //  Insert seating using parameterized query for multiple rows
                  let insertQuery = `
                    INSERT INTO seating_arrangements
                    (exam_id, room_id, student_id, seat_label, is_deleted)
                    VALUES 
                  `;
                  
                  const placeholders = [];
                  const flatValues = [];
                  
                  values.forEach((row, idx) => {
                    const placeholderStart = idx * 5 + 1;
                    placeholders.push(`($${placeholderStart}, $${placeholderStart + 1}, $${placeholderStart + 2}, $${placeholderStart + 3}, $${placeholderStart + 4})`);
                    flatValues.push(...row);
                  });
                  
                  insertQuery += placeholders.join(", ");

                  db.query(insertQuery, flatValues, err => {
                    if (err) {
                      console.error("INSERT ERROR:", err);
                      return res.status(500).json({ message: "Insert failed" });
                    }

                    //  Mark seating generated
                    db.query(
                      "UPDATE exams SET seating_generated = TRUE WHERE id = $1",
                      [examId]
                    );

                    /* ================= AUTO FACULTY ALLOCATION ================= */

                    // Remove previous faculty allocation for this exam
                    db.query(
                      "DELETE FROM faculty_allocation WHERE exam_id = $1",
                      [examId],
                      () => {

                        // Get rooms used
                        db.query(
                          `
                          SELECT DISTINCT room_id
                          FROM seating_arrangements
                          WHERE exam_id = $1
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
                              WHERE role = 'faculty' AND is_active = TRUE
                              ORDER BY id
                              `,
                              (err, facultyRows) => {
                                if (err || facultyRows.rows.length === 0) {
                                  console.error("FACULTY FETCH ERROR:", err);
                                  return res.json({ message: "Seating generated (no faculty)" });
                                }

                                // Assign faculty round-robin
                                roomRows.rows.forEach((room, i) => {
                                  const facultyId =
                                    facultyRows.rows[i % facultyRows.rows.length].id;

                                  db.query(
                                    `
                                    INSERT INTO faculty_allocation
                                    (exam_id, room_id, faculty_id, allocated_date, status)
                                    VALUES ($1, $2, $3, CURRENT_DATE, 'Assigned')
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
                  });
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
    JOIN rooms r ON r.id = sa.room_id
    JOIN users u ON u.id = sa.student_id
    WHERE sa.exam_id = $1 AND sa.is_deleted = 0
    ORDER BY r.room_name, sa.seat_label
    `,
    [examId],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Fetch failed" });
      res.json(result.rows);
    }
  );
};

/* ================= UNDO ================= */
export const undoDeleteSeating = (req, res) => {
  const { examId } = req.params;

  db.query(
    "UPDATE seating_arrangements SET is_deleted = 0 WHERE exam_id = $1",
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
    JOIN rooms r ON r.id = sa.room_id
    JOIN users u ON u.id = sa.student_id
    WHERE sa.exam_id = $1 AND sa.is_deleted = 0
    ORDER BY r.room_name, sa.seat_label
    `,
    [examId],
    (err, result) => {
      if (err) {
        doc.text("Failed to generate PDF");
        return doc.end();
      }

      const rows = result.rows;
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
    "DELETE FROM seating_arrangements WHERE exam_id = $1",
    [examId],
    (err, result) => {
      if (err) {
        console.error("DELETE SEATING ERROR:", err);
        return res.status(500).json({ message: "Failed to delete seating" });
      }

      // remove faculty allocation too
      db.query(
        "DELETE FROM faculty_allocation WHERE exam_id = $1",
        [examId]
      );

      db.query(
        "UPDATE exams SET seating_generated = FALSE WHERE id = $1",
        [examId]
      );

      res.json({ message: "Seating deleted successfully" });
    }
  );
};
