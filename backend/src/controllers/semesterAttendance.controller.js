// import db from "../db/db.js";

// /* ================= GET SEMESTER SEATING FOR FACULTY ================= */
// export const getSemesterSeatingForAttendance = (req, res) => {
//   const { semesterSlotId } = req.params;

//   const sql = `
//     SELECT 
//       ssa.student_id,
//       ssa.seat_number,
//       r.room_name,
//       u.roll_number,
//       u.name
//     FROM semester_seating_arrangements ssa
//     JOIN rooms r 
//       ON r.id = ssa.room_id
//     JOIN users u 
//       ON u.id = ssa.student_id
//     WHERE ssa.semester_slot_id = ?
//     ORDER BY ssa.seat_number
//   `;

//   db.query(sql, [semesterSlotId], (err, rows) => {
//     if (err) {
//       console.error("SEMESTER SEATING ERROR:", err);
//       return res.status(500).json({ message: "Failed to load semester seating" });
//     }

//     res.json(rows || []);
//   });
// };

// /* ================= GET SAVED SEMESTER ATTENDANCE ================= */
// export const getSemesterSavedAttendance = (req, res) => {
//   const { semesterSlotId } = req.params;

//   const sql = `
//     SELECT student_id, status, is_submitted
//     FROM attendance
//     WHERE exam_type = 'SEMESTER'
//       AND exam_id = ?
//   `;

//   db.query(sql, [semesterSlotId], (err, rows) => {
//     if (err) {
//       console.error("FETCH SEMESTER ATTENDANCE ERROR:", err);
//       return res.status(500).json({ message: "Database error" });
//     }

//     res.json(rows || []);
//   });
// };

// /* ================= SAVE SEMESTER ATTENDANCE DRAFT ================= */
// export const saveSemesterAttendanceDraft = (req, res) => {
//   const { semesterSlotId, records } = req.body;
//   const facultyId = req.user.id;

//   const values = records.map(r => [
//     "SEMESTER",
//     semesterSlotId,
//     r.student_id,
//     facultyId,
//     r.status,
//     0
//   ]);

//   const sql = `
//     INSERT INTO attendance
//       (exam_type, exam_id, student_id, faculty_id, status, is_submitted)
//     VALUES ?
//     ON DUPLICATE KEY UPDATE
//       status = VALUES(status),
//       is_submitted = 0
//   `;

//   db.query(sql, [values], err => {
//     if (err) {
//       console.error("SAVE SEMESTER DRAFT ERROR:", err);
//       return res.status(500).json({ message: "Save failed" });
//     }

//     res.json({ message: "Semester attendance draft saved" });
//   });
// };

// /* ================= LOCK & SUBMIT SEMESTER ATTENDANCE ================= */
// export const submitSemesterAttendance = (req, res) => {
//   const { semesterSlotId } = req.body;
//   const facultyId = req.user.id;

//   const sql = `
//     UPDATE attendance
//     SET is_submitted = 1
//     WHERE exam_type = 'SEMESTER'
//       AND exam_id = ?
//       AND faculty_id = ?
//   `;

//   db.query(sql, [semesterSlotId, facultyId], err => {
//     if (err) {
//       console.error("SUBMIT SEMESTER ATTENDANCE ERROR:", err);
//       return res.status(500).json({ message: "Submit failed" });
//     }

//     res.json({ message: "Semester attendance submitted successfully" });
//   });
// };

import db from "../db/db.js";

/* ================= GET SEMESTER SEATING FOR FACULTY ================= */
export const getSemesterSeatingForAttendance = (req, res) => {
    const { semesterSlotId } = req.params;

    const sql = `
    SELECT 
      ssa.student_id,
      ssa.seat_number,
      r.room_name,
      u.roll_number,
      u.name
    FROM semester_seating_arrangements ssa
    JOIN rooms r 
      ON r.id = ssa.room_id
    JOIN users u 
      ON u.id = ssa.student_id
    WHERE ssa.semester_slot_id = ?
    ORDER BY ssa.seat_number
  `;

    db.query(sql, [semesterSlotId], (err, rows) => {
        if (err) {
            console.error("SEMESTER SEATING ERROR:", err);
            return res.status(500).json({ message: "Failed to load semester seating" });
        }

        res.json(rows || []);
    });
};

/* ================= GET SAVED SEMESTER ATTENDANCE ================= */
export const getSemesterSavedAttendance = (req, res) => {
    const { semesterSlotId } = req.params;

    const sql = `
    SELECT student_id, status, is_submitted
    FROM attendance
    WHERE exam_type = 'SEMESTER'
      AND exam_id = ?
  `;

    db.query(sql, [semesterSlotId], (err, rows) => {
        if (err) {
            console.error("FETCH SEMESTER ATTENDANCE ERROR:", err);
            return res.status(500).json({ message: "Database error" });
        }

        res.json(rows || []);
    });
};

/* ================= SAVE SEMESTER ATTENDANCE DRAFT ================= */
export const saveSemesterAttendanceDraft = (req, res) => {
    const { semesterSlotId, records } = req.body;
    const facultyId = req.user.id;

    const values = records.map(r => [
        "SEMESTER",
        semesterSlotId,
        r.student_id,
        facultyId,
        r.status,
        0
    ]);

    const sql = `
    INSERT INTO attendance
      (exam_type, exam_id, student_id, faculty_id, status, is_submitted)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      status = VALUES(status),
      is_submitted = 0
  `;

    db.query(sql, [values], err => {
        if (err) {
            console.error("SAVE SEMESTER DRAFT ERROR:", err);
            return res.status(500).json({ message: "Save failed" });
        }

        res.json({ message: "Semester attendance draft saved" });
    });
};

/* ================= LOCK & SUBMIT SEMESTER ATTENDANCE ================= */
export const submitSemesterAttendance = (req, res) => {
    const { semesterSlotId } = req.body;
    const facultyId = req.user.id;

    const sql = `
    UPDATE attendance
    SET is_submitted = 1
    WHERE exam_type = 'SEMESTER'
      AND exam_id = ?
      AND faculty_id = ?
  `;

    db.query(sql, [semesterSlotId, facultyId], err => {
        if (err) {
            console.error("SUBMIT SEMESTER ATTENDANCE ERROR:", err);
            return res.status(500).json({ message: "Submit failed" });
        }

        res.json({ message: "Semester attendance submitted successfully" });
    });
};

/* ================= SEMESTER ATTENDANCE REPORT – PDF ================= */
export const downloadSemesterAttendancePDF = (req, res) => {
    const { slotId } = req.params;

    const sql = `
    SELECT 
      u.roll_number,
      u.name,
      a.status
    FROM attendance a
    JOIN users u ON u.id = a.student_id
    WHERE a.exam_type = 'SEMESTER'
      AND a.exam_id = ?
      AND a.is_submitted = 1
    ORDER BY u.roll_number
  `;

    import("pdfkit").then(({ default: PDFDocument }) => {
        db.query(sql, [slotId], (err, rows) => {
            if (err) {
                console.error("SEMESTER ATTENDANCE PDF ERROR:", err);
                return res.status(500).json({ message: "Failed to generate report" });
            }

            if (!rows || rows.length === 0) {
                return res.status(404).json({ message: "No attendance records found" });
            }

            const doc = new PDFDocument({ margin: 40 });
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename=semester_attendance_${slotId}.pdf`
            );
            doc.pipe(res);

            doc.fontSize(20).font("Helvetica-Bold").text("Attendance Report", {
                align: "center",
            });
            doc
                .fontSize(10)
                .font("Helvetica")
                .text(`Generated: ${new Date().toLocaleString()}`, {
                    align: "center",
                });
            doc.moveDown(2);

            doc.fontSize(12).font("Helvetica-Bold").text("Roll No    Name                        Status");
            doc.moveDown(0.5);

            rows.forEach((r) => {
                const name = (r.name || "").toString().substring(0, 25);
                doc
                    .fontSize(10)
                    .font("Helvetica")
                    .text(`${r.roll_number}    ${name.padEnd(25, " ")}    ${r.status}`);
            });

            doc.end();
        });
    });
};

/* ================= SEMESTER ATTENDANCE REPORT – EXCEL (CSV) ================= */
export const downloadSemesterAttendanceExcel = (req, res) => {
    const { slotId } = req.params;

    const sql = `
    SELECT 
      u.roll_number,
      u.name,
      a.status
    FROM attendance a
    JOIN users u ON u.id = a.student_id
    WHERE a.exam_type = 'SEMESTER'
      AND a.exam_id = ?
      AND a.is_submitted = 1
    ORDER BY u.roll_number
  `;

    db.query(sql, [slotId], (err, rows) => {
        if (err) {
            console.error("SEMESTER ATTENDANCE EXCEL ERROR:", err);
            return res.status(500).json({ message: "Failed to generate report" });
        }

        const header = ["Roll No", "Name", "Status"].join(",");
        const body = (rows || [])
            .map((r) => [r.roll_number, r.name, r.status].join(","))
            .join("\n");

        const csv = `${header}\n${body}`;

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=semester_attendance_${slotId}.xlsx`
        );
        res.send(csv);
    });
};

/* ================= SEMESTER ATTENDANCE REPORT – PRINT (HTML) ================= */
export const printSemesterAttendance = (req, res) => {
    const { slotId } = req.params;

    const sql = `
    SELECT 
      u.roll_number,
      u.name,
      a.status
    FROM attendance a
    JOIN users u ON u.id = a.student_id
    WHERE a.exam_type = 'SEMESTER'
      AND a.exam_id = ?
      AND a.is_submitted = 1
    ORDER BY u.roll_number
  `;

    db.query(sql, [slotId], (err, rows) => {
        if (err) {
            console.error("SEMESTER ATTENDANCE PRINT ERROR:", err);
            return res.status(500).send("Failed to generate report");
        }

        const data = rows || [];

        let tableRows = "";
        data.forEach((r) => {
            tableRows += `
        <tr>
          <td>${r.roll_number}</td>
          <td>${r.name}</td>
          <td>${r.status}</td>
        </tr>
      `;
        });

        const html = `
      <html>
        <head>
          <title>Attendance Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h2 { color: #333; }
            table { border-collapse: collapse; width: 100%; margin-top: 16px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #667eea; color: white; }
            tr:nth-child(even) { background-color: #f9f9f9; }
          </style>
        </head>
        <body onload="window.print()">
          <h2>Attendance Report</h2>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <table>
            <tr>
              <th>Roll No</th>
              <th>Name</th>
              <th>Status</th>
            </tr>
            ${tableRows || "<tr><td colspan='3'>No attendance records found</td></tr>"}
          </table>
        </body>
      </html>
    `;

        res.send(html);
    });
};