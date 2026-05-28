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
    WHERE ssa.semester_slot_id = $1
    ORDER BY ssa.seat_number
  `;

    db.query(sql, [semesterSlotId], (err, result) => {
        if (err) {
            console.error("SEMESTER SEATING ERROR:", err);
            return res.status(500).json({ message: "Failed to load semester seating" });
        }

        res.json(result.rows || []);
    });
};

/* ================= GET SAVED SEMESTER ATTENDANCE ================= */
export const getSemesterSavedAttendance = (req, res) => {
    const { semesterSlotId } = req.params;

    const sql = `
    SELECT student_id, status, is_submitted
    FROM attendance
    WHERE exam_type = 'SEMESTER'
      AND exam_id = $1
  `;

    db.query(sql, [semesterSlotId], (err, result) => {
        if (err) {
            console.error("FETCH SEMESTER ATTENDANCE ERROR:", err);
            return res.status(500).json({ message: "Database error" });
        }

        res.json(result.rows || []);
    });
};

/* ================= SAVE SEMESTER ATTENDANCE DRAFT ================= */
export const saveSemesterAttendanceDraft = (req, res) => {
    const { semesterSlotId, records } = req.body;
    const facultyId = req.user.id;

    if (!records || records.length === 0) {
        return res.status(400).json({ message: "No records to save" });
    }

    // Build parameterized insert/update query using ON CONFLICT
    // Assumes a unique constraint on (exam_type, exam_id, student_id) - if not, adjust.
    // Since attendance table may not have a unique constraint, we use a two-step approach:
    // 1. Delete existing entries for this exam and faculty to avoid duplicates
    // 2. Insert new ones.
    // This matches the MySQL ON DUPLICATE KEY UPDATE behavior more closely.

    const deleteSql = `
        DELETE FROM attendance
        WHERE exam_type = 'SEMESTER'
          AND exam_id = $1
          AND faculty_id = $2
    `;

    db.query(deleteSql, [semesterSlotId, facultyId], (err) => {
        if (err) {
            console.error("DELETE EXISTING SEMESTER ATTENDANCE ERROR:", err);
            return res.status(500).json({ message: "Save failed" });
        }

        // Now insert all records
        const insertSql = `
            INSERT INTO attendance
              (exam_type, exam_id, student_id, faculty_id, status, is_submitted)
            VALUES ($1, $2, $3, $4, $5, $6)
        `;

        // Execute inserts sequentially
        let completed = 0;
        let hasError = false;

        records.forEach(record => {
            db.query(insertSql, [
                "SEMESTER",
                semesterSlotId,
                record.student_id,
                facultyId,
                record.status,
                false  // is_submitted = 0 -> false
            ], (err) => {
                if (err && !hasError) {
                    hasError = true;
                    console.error("INSERT SEMESTER ATTENDANCE ERROR:", err);
                    return res.status(500).json({ message: "Save failed" });
                }
                completed++;
                if (completed === records.length && !hasError) {
                    res.json({ message: "Semester attendance draft saved" });
                }
            });
        });

        if (records.length === 0) {
            res.json({ message: "Semester attendance draft saved" });
        }
    });
};

/* ================= LOCK & SUBMIT SEMESTER ATTENDANCE ================= */
export const submitSemesterAttendance = (req, res) => {
    const { semesterSlotId } = req.body;
    const facultyId = req.user.id;

    const sql = `
    UPDATE attendance
    SET is_submitted = TRUE
    WHERE exam_type = 'SEMESTER'
      AND exam_id = $1
      AND faculty_id = $2
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
      AND a.exam_id = $1
      AND a.is_submitted = TRUE
    ORDER BY u.roll_number
  `;

    import("pdfkit").then(({ default: PDFDocument }) => {
        db.query(sql, [slotId], (err, result) => {
            if (err) {
                console.error("SEMESTER ATTENDANCE PDF ERROR:", err);
                return res.status(500).json({ message: "Failed to generate report" });
            }

            const rows = result.rows || [];
            if (rows.length === 0) {
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
      AND a.exam_id = $1
      AND a.is_submitted = TRUE
    ORDER BY u.roll_number
  `;

    db.query(sql, [slotId], (err, result) => {
        if (err) {
            console.error("SEMESTER ATTENDANCE EXCEL ERROR:", err);
            return res.status(500).json({ message: "Failed to generate report" });
        }

        const rows = result.rows || [];
        const header = ["Roll No", "Name", "Status"].join(",");
        const body = rows.map((r) => [r.roll_number, r.name, r.status].join(",")).join("\n");

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
      AND a.exam_id = $1
      AND a.is_submitted = TRUE
    ORDER BY u.roll_number
  `;

    db.query(sql, [slotId], (err, result) => {
        if (err) {
            console.error("SEMESTER ATTENDANCE PRINT ERROR:", err);
            return res.status(500).send("Failed to generate report");
        }

        const data = result.rows || [];

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
