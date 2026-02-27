import db from "../db/db.js";
import PDFDocument from "pdfkit";


const logReportDownload = (req, reportType, examId = null) => {
  const userId = req.user?.id || null;

  db.query(
    `INSERT INTO reports 
     (report_type, exam_id, downloaded_by, created_at)
     VALUES (?, ?, ?, NOW())`,
    [reportType, examId, userId]
  );
};

/* ================= GET DATE RANGE FILTER ================= */
const getDateRangeFilter = (dateRange) => {
  const now = new Date();
  let startDate = new Date();

  switch (dateRange) {
    case "today":
      startDate.setHours(0, 0, 0, 0);
      break;
    case "week":
      startDate.setDate(now.getDate() - now.getDay());
      startDate.setHours(0, 0, 0, 0);
      break;
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "quarter":
      startDate.setMonth(now.getMonth() - 3);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "all":
    default:
      startDate = new Date(1900, 0, 1);
  }

  return startDate.toISOString().split("T")[0];
};

/* ================= GET ALL REPORTS (HISTORY ONLY) ================= */
export const getReports = (req, res) => {
  const sql = `
    SELECT r.*, e.exam_name, e.exam_date
    FROM reports r
    LEFT JOIN exams e ON r.exam_id = e.id
    ORDER BY r.created_at DESC
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ message: "Failed to load reports" });
    res.json(rows);
  });
};

/* ================= RECENT DOWNLOADS ================= */
export const getRecentDownloads = (req, res) => {
  db.query(
    `
    SELECT r.*, e.exam_name
    FROM reports r
    LEFT JOIN exams e ON r.exam_id = e.id
    ORDER BY r.created_at DESC
    LIMIT 5
    `,
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Failed to load recent downloads" });
      res.json(rows || []);
    }
  );
};

/* ================= DYNAMIC REPORT GENERATION ================= */
export const downloadReport = (req, res) => {
  const { examId, reportType, dateRange = "all", format = "pdf" } = req.query;
  const startDate = getDateRangeFilter(dateRange);

  if (!reportType) {
    return res.status(400).json({ message: "Report type required" });
  }

  logReportDownload(req, reportType, examId);

  if (format === "excel") {
    return generateExcelReport(res, examId, reportType, startDate);
  }

  // PDF Format
  generatePDFReport(res, examId, reportType, startDate);
};

const generateExcelReport = (res, examId, reportType, startDate) => {
  // Simple CSV generation without external dependencies
  const escapeCSV = (str) => {
    if (typeof str !== 'string') str = String(str);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  if (reportType === "FACULTY") {
    const sql = `
      SELECT e.exam_name, e.exam_date, r.room_name, u.name AS faculty, fa.allocated_date
      FROM faculty_allocation fa
      JOIN exams e ON e.id = fa.exam_id
      JOIN rooms r ON r.id = fa.room_id
      JOIN users u ON u.id = fa.faculty_id
      WHERE DATE(e.exam_date) >= ?
      ${examId ? "AND fa.exam_id = ?" : ""}
      ORDER BY e.exam_date
    `;

    db.query(sql, examId ? [startDate, examId] : [startDate], (err, rows) => {
      if (err) {
        return res.status(500).json({ message: "Failed to generate report" });
      }

      if (!rows || rows.length === 0) {
        rows = [];
      }

      const csvRows = [
        ["Exam", "Date", "Room", "Faculty", "Allocated Date"].map(escapeCSV).join(','),
        ...rows.map((r) =>
          [
            r.exam_name,
            new Date(r.exam_date).toLocaleDateString(),
            r.room_name,
            r.faculty,
            r.allocated_date,
          ].map(escapeCSV).join(',')
        ),
      ].join('\n');

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=faculty_allocation_${new Date().toISOString().split("T")[0]}.csv`
      );
      res.send(csvRows);
    });
    return;
  }

  if (reportType === "SEATING") {
    const sql = `
      SELECT 
        e.exam_name, 
        e.exam_date,
        r.room_name, 
        (r.rows_count * r.cols_count) AS capacity,
        COUNT(sa.id) AS students_allocated
      FROM seating_arrangements sa
      JOIN rooms r ON r.id = sa.room_id
      JOIN users u ON u.id = sa.student_id
      JOIN exams e ON e.id = sa.exam_id
      WHERE DATE(e.exam_date) >= ?
      ${examId ? "AND sa.exam_id = ?" : ""}
      GROUP BY e.exam_name, e.exam_date, r.room_name, r.capacity
      ORDER BY e.exam_name, r.room_name
    `;

    db.query(sql, examId ? [startDate, examId] : [startDate], (err, rows) => {
      if (err) {
        return res.status(500).json({ message: "Failed to generate report" });
      }

      if (!rows || rows.length === 0) {
        rows = [];
      }

      const csvRows = [
        ["Exam", "Date", "Room", "Capacity", "Students Allocated"].map(escapeCSV).join(','),
        ...rows.map((r) =>
          [
            r.exam_name,
            new Date(r.exam_date).toLocaleDateString(),
            r.room_name,
            r.capacity,
            r.students_allocated,
          ].map(escapeCSV).join(',')
        ),
      ].join('\n');

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=seating_arrangement_${new Date().toISOString().split("T")[0]}.csv`
      );
      res.send(csvRows);
    });
    return;
  }

  if (reportType === "ROOM") {
    const sql = `
      SELECT 
        e.exam_name,
        COUNT(DISTINCT sa.room_id) as rooms_used,
        SUM(r.capacity) as total_capacity,
        COUNT(sa.id) as occupied_seats,
        SUM(r.capacity) - COUNT(sa.id) as empty_seats
      FROM seating_arrangements sa
      JOIN rooms r ON r.id = sa.room_id
      JOIN exams e ON e.id = sa.exam_id
      WHERE DATE(e.exam_date) >= ?
      ${examId ? "AND sa.exam_id = ?" : ""}
      GROUP BY e.exam_name
    `;

    db.query(sql, examId ? [startDate, examId] : [startDate], (err, rows) => {
      if (err) {
        return res.status(500).json({ message: "Failed to generate report" });
      }

      if (!rows || rows.length === 0) {
        rows = [];
      }

      const csvRows = [
        ["Exam", "Rooms Used", "Total Capacity", "Occupied", "Empty"].map(escapeCSV).join(','),
        ...rows.map((r) =>
          [
            r.exam_name,
            r.rooms_used,
            r.total_capacity,
            r.occupied_seats,
            r.empty_seats,
          ].map(escapeCSV).join(',')
        ),
      ].join('\n');

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=room_utilization_${new Date().toISOString().split("T")[0]}.csv`
      );
      res.send(csvRows);
    });
    return;
  }

  if (reportType === "ATTENDANCE") {
    const sql = `
    SELECT 
      e.exam_name,
      u.roll_number,
      u.name AS student_name,
      a.status
    FROM attendance a
    JOIN exams e ON e.id = a.exam_id
    JOIN users u ON u.id = a.student_id
    WHERE a.is_submitted = 1
${examId ? "AND a.exam_id = ?" : ""}
    ORDER BY u.roll_number
  `;

    db.query(sql, examId ? [startDate, examId] : [startDate], (err, rows) => {
      if (err) {
        return res.status(500).json({ message: "Failed to generate attendance report" });
      }

      const csvRows = [
        ["Exam", "Roll Number", "Student Name", "Status"].join(","),
        ...rows.map(r =>
          [
            r.exam_name,
            r.roll_number,
            r.student_name,
            r.status
          ].join(",")
        )
      ].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=attendance_${Date.now()}.csv`
      );
      res.send(csvRows);
    });

    return;
  }

  res.status(400).json({ message: "Report type not supported for Excel" });
};

const generatePDFReport = (res, examId, reportType, startDate) => {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${reportType}_${new Date().toISOString().split("T")[0]}.pdf`
  );

  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);

  doc.fontSize(20).font("Helvetica-Bold").text(`${reportType} Report`, {
    align: "center",
  });
  doc.fontSize(10).font("Helvetica").text(`Generated: ${new Date().toLocaleString()}`, {
    align: "center",
  });
  doc.moveDown(2);

  /* ================= FACULTY ================= */
  if (reportType === "FACULTY") {
    const sql = `
      SELECT e.exam_name, e.exam_date, r.room_name, u.name AS faculty
      FROM faculty_allocation fa
      JOIN exams e ON e.id = fa.exam_id
      JOIN rooms r ON r.id = fa.room_id
      JOIN users u ON u.id = fa.faculty_id
      WHERE DATE(e.exam_date) >= ?
      ${examId ? "AND fa.exam_id = ?" : ""}
      ORDER BY e.exam_date
    `;

    db.query(sql, examId ? [startDate, examId] : [startDate], (err, rows) => {
      if (!rows || rows.length === 0) {
        doc.fillColor("red").fontSize(12).text("No faculty allocation found for the selected filters.");
        return doc.end();
      }

      rows.forEach((r, i) => {
        if (i > 0) doc.moveDown(0.5);
        doc.fillColor("black").fontSize(11)
          .text(`Exam: ${r.exam_name} | Date: ${new Date(r.exam_date).toLocaleDateString()}`)
          .text(`Room: ${r.room_name} | Faculty: ${r.faculty}`)
          .movDown(0.3);
      });

      doc.end();
    });
    return;
  }

  /* ================= SEATING ================= */
  if (reportType === "SEATING") {
    const sql = `
      SELECT 
        e.exam_name, 
        e.exam_date,
        r.id AS room_id,
        r.room_name, 
        r.capacity,
        COUNT(sa.id) AS students_allocated,
        GROUP_CONCAT(CONCAT(sa.seat_number, ' - ', u.roll_number, ' (', u.name, ')') SEPARATOR '\n') AS seating_details
      FROM seating_arrangements sa
      JOIN rooms r ON r.id = sa.room_id
      JOIN users u ON u.id = sa.student_id
      JOIN exams e ON e.id = sa.exam_id
      WHERE DATE(e.exam_date) >= ?
      ${examId ? "AND sa.exam_id = ?" : ""}
      GROUP BY e.exam_name, e.exam_date, r.id, r.room_name, r.capacity
      ORDER BY e.exam_name, r.room_name
    `;

    db.query(sql, examId ? [startDate, examId] : [startDate], (err, rows) => {
      if (err) {
        console.error("SEATING Report Error:", err);
        doc.fillColor("red").fontSize(12).text("Database error while generating report.");
        return doc.end();
      }

      if (!rows || rows.length === 0) {
        doc.fillColor("red").fontSize(12).text("No seating arrangements found for the selected filters.");
        return doc.end();
      }

      let currentExam = "";

      rows.forEach((r) => {
        if (r.exam_name !== currentExam) {
          if (currentExam) doc.addPage();
          currentExam = r.exam_name;

          doc.fillColor("blue").fontSize(16).font("Helvetica-Bold")
            .text(`${currentExam}`)
            .font("Helvetica").fontSize(10).fillColor("gray")
            .text(`Date: ${new Date(r.exam_date).toLocaleDateString()}`)
            .moveDown(1);
        }

        doc.fillColor("black").fontSize(11).font("Helvetica-Bold")
          .text(`Room: ${r.room_name}`)
          .font("Helvetica").fontSize(9)
          .text(`Capacity: ${r.capacity} | Students Allocated: ${r.students_allocated}`)
          .moveDown(0.3);
      });

      doc.end();
    });
    return;
  }

  /* ================= ATTENDANCE ================= */
  if (reportType === "ATTENDANCE") {
    const sql = `
    SELECT 
      e.exam_name,
      u.roll_number,
      u.name,
      a.status
    FROM attendance a
    JOIN exams e ON e.id = a.exam_id
    JOIN users u ON u.id = a.student_id
    WHERE a.is_submitted = 1
${examId ? "AND a.exam_id = ?" : ""}
    ORDER BY u.roll_number
  `;

    db.query(sql, examId ? [startDate, examId] : [startDate], (err, rows) => {
      if (!rows || rows.length === 0) {
        doc.text("No attendance records found");
        return doc.end();
      }

      let currentExam = "";

      rows.forEach(r => {
        if (r.exam_name !== currentExam) {
          if (currentExam) doc.moveDown(1);
          currentExam = r.exam_name;
          doc.fontSize(14).text(`Exam: ${currentExam}`);
          doc.moveDown(0.5);
        }

        doc.fontSize(10).text(
          `${r.roll_number} - ${r.name} : ${r.status}`
        );
      });

      doc.end();
    });

    return;
  }

  /* ================= ROOM UTILIZATION ================= */
  if (reportType === "ROOM") {
    const sql = `
      SELECT 
        e.exam_name,
        COUNT(DISTINCT sa.room_id) as rooms_used,
        SUM(r.capacity) as total_capacity,
        COUNT(sa.id) as occupied_seats,
        SUM(r.capacity) - COUNT(sa.id) as empty_seats
      FROM seating_arrangements sa
      JOIN rooms r ON r.id = sa.room_id
      JOIN exams e ON e.id = sa.exam_id
      WHERE DATE(e.exam_date) >= ?
      ${examId ? "AND sa.exam_id = ?" : ""}
      GROUP BY e.exam_name
    `;

    db.query(sql, examId ? [startDate, examId] : [startDate], (err, rows) => {
      if (!rows || rows.length === 0) {
        doc.fillColor("red").fontSize(12).text("No room utilization data found for the selected filters.");
        return doc.end();
      }

      rows.forEach((r, i) => {
        if (i > 0) doc.moveDown(1);
        const utilization = ((r.occupied_seats / r.total_capacity) * 100).toFixed(1);

        doc.fillColor("black").fontSize(11).font("Helvetica-Bold")
          .text(`${r.exam_name}`)
          .font("Helvetica").fontSize(10)
          .text(`Rooms Used: ${r.rooms_used}`)
          .text(`Total Capacity: ${r.total_capacity}`)
          .text(`Occupied Seats: ${r.occupied_seats}`)
          .text(`Empty Seats: ${r.empty_seats}`)
          .text(`Utilization: ${utilization}%`);
      });

      doc.end();
    });
    return;
  }

  doc.fillColor("red").fontSize(12).text("Report type not found.");
  doc.end();
};

/* ================= PRINT ================= */
export const printReport = (req, res) => {
  const { examId, reportType, dateRange = "all" } = req.query;

  if (!reportType) {
    return res.status(400).send("Report type is required");
  }

  // ✅ 3. NOW it is safe to log
  logReportDownload(req, reportType, examId);
  const startDate = getDateRangeFilter(dateRange);

  let sql = "";
  let params = [];

  if (reportType === "FACULTY") {
    sql = `
      SELECT e.exam_name, e.exam_date, r.room_name, u.name AS faculty
      FROM faculty_allocation fa
      JOIN exams e ON e.id = fa.exam_id
      JOIN rooms r ON r.id = fa.room_id
      JOIN users u ON u.id = fa.faculty_id
      WHERE DATE(e.exam_date) >= ?
      ${examId ? "AND fa.exam_id = ?" : ""}
      ORDER BY e.exam_date
    `;
    params = examId ? [startDate, examId] : [startDate];
  } else if (reportType === "SEATING") {
    sql = `
      SELECT 
        e.exam_name, 
        e.exam_date,
        r.room_name, 
        r.capacity,
        COUNT(sa.id) AS students_allocated
      FROM seating_arrangements sa
      JOIN rooms r ON r.id = sa.room_id
      JOIN users u ON u.id = sa.student_id
      JOIN exams e ON e.id = sa.exam_id
      WHERE DATE(e.exam_date) >= ?
      ${examId ? "AND sa.exam_id = ?" : ""}
      GROUP BY e.exam_name, e.exam_date, r.room_name, r.capacity
      ORDER BY e.exam_name, r.room_name
    `;
    params = examId ? [startDate, examId] : [startDate];
  } else if (reportType === "ROOM") {
    sql = `
      SELECT 
        e.exam_name,
        COUNT(DISTINCT sa.room_id) as rooms_used,
        SUM(r.capacity) as total_capacity,
        COUNT(sa.id) as occupied_seats
      FROM seating_arrangements sa
      JOIN rooms r ON r.id = sa.room_id
      JOIN exams e ON e.id = sa.exam_id
      WHERE DATE(e.exam_date) >= ?
      ${examId ? "AND sa.exam_id = ?" : ""}
      GROUP BY e.exam_name
    `;
    params = examId ? [startDate, examId] : [startDate];
  }

  else if (reportType === "ATTENDANCE") {
    sql = `
    SELECT
      e.exam_name,
      u.roll_number,
      u.name,
      a.status
    FROM attendance a
    JOIN users u ON u.id = a.student_id
    JOIN exams e ON e.id = a.exam_id
    WHERE a.is_submitted = 1
      ${examId ? "AND a.exam_id = ?" : ""}
  `;
    params = examId ? [startDate, examId] : [startDate];
  }
  if (!sql) {
    return res.status(400).send("Invalid report type");
  }

  db.query(sql, params, (err, rows) => {
    if (err || !rows || rows.length === 0) {
      return res.send(`
        <html>
          <head><title>${reportType} Report</title></head>
          <body onload="window.print()">
            <h2>${reportType} Report</h2>
            <p style="color: red;">No data found for the selected filters.</p>
          </body>
        </html>
      `);
    }

    let htmlContent = `
      <html>
        <head>
          <title>${reportType} Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h2 { color: #333; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #667eea; color: white; }
            tr:nth-child(even) { background-color: #f9f9f9; }
          </style>
        </head>
        <body onload="window.print()">
          <h2>${reportType} Report</h2>
          <p>Generated: ${new Date().toLocaleString()}</p>
    `;

    if (reportType === "FACULTY") {
      htmlContent += `
        <table>
          <tr>
            <th>Exam</th>
            <th>Date</th>
            <th>Room</th>
            <th>Faculty</th>
          </tr>
      `;
      rows.forEach((r) => {
        htmlContent += `
          <tr>
            <td>${r.exam_name}</td>
            <td>${new Date(r.exam_date).toLocaleDateString()}</td>
            <td>${r.room_name}</td>
            <td>${r.faculty}</td>
          </tr>
        `;
      });
    } else if (reportType === "SEATING") {
      htmlContent += `
        <table>
          <tr>
            <th>Exam</th>
            <th>Date</th>
            <th>Room</th>
            <th>Capacity</th>
            <th>Students Allocated</th>
          </tr>
      `;
      rows.forEach((r) => {
        htmlContent += `
          <tr>
            <td>${r.exam_name}</td>
            <td>${new Date(r.exam_date).toLocaleDateString()}</td>
            <td>${r.room_name}</td>
            <td>${r.capacity}</td>
            <td>${r.students_allocated}</td>
          </tr>
        `;
      });
    } else if (reportType === "ROOM") {
      htmlContent += `
        <table>
          <tr>
            <th>Exam</th>
            <th>Rooms Used</th>
            <th>Total Capacity</th>
            <th>Occupied</th>
          </tr>
      `;
      rows.forEach((r) => {
        htmlContent += `
          <tr>
            <td>${r.exam_name}</td>
            <td>${r.rooms_used}</td>
            <td>${r.total_capacity}</td>
            <td>${r.occupied_seats}</td>
          </tr>
        `;
      });
    }

    else if (reportType === "ATTENDANCE") {
      htmlContent += `
    <table>
      <tr>
        <th>Roll No</th>
        <th>Name</th>
        <th>Status</th>
      </tr>
  `;

      rows.forEach(r => {
        htmlContent += `
      <tr>
        <td>${r.roll_number}</td>
        <td>${r.name}</td>
        <td>${r.status}</td>
      </tr>
    `;
      });
    }

    htmlContent += `
        </table>
        </body>
      </html>
    `;

    res.send(htmlContent);
  });
};