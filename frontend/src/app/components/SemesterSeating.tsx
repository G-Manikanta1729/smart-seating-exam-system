import { useEffect, useState } from "react";
import api from "../../api/api";
import { Button } from "./Button";
import { Card } from "./Card";
import { Download, Printer } from "lucide-react";

interface Slot {
  id: number;
  year: string;
  exam_date: string;
  exam_time: string;
}

interface Room {
  id: number;
  room_name: string;
}

interface SeatingRow {
  room_id: number;
  room_name: string;
  seat_number: number;
  roll_number: string;
  name: string;
  branch: string;
  faculty_name?: string;
}

export default function SemesterSeating() {
  /* ---------------- STATE ---------------- */
  const [slots, setSlots] = useState<Slot[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<number[]>([]);
  const [viewSlotId, setViewSlotId] = useState<number | null>(null);
  const [seating, setSeating] = useState<SeatingRow[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [facultyByRoom, setFacultyByRoom] = useState<Record<number, any>>({});

  const [year, setYear] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  // Semester exam duration in hours (change if needed)
  const SEMESTER_DURATION_HOURS = 3;

  /* ---------------- LOAD DATA ---------------- */
  useEffect(() => {
    loadSlots();
    loadRooms();
    loadFaculty();
  }, []);

  const loadSlots = async () => {
    const res = await api.get("/admin/semester-seating/slots");
    setSlots(res.data);
  };

  const loadRooms = async () => {
    try {
      const res = await api.get("/admin/rooms");
      const roomsData = res.data?.data ?? [];
      setRooms(roomsData);
    } catch (err) {
      console.error("Failed to load rooms", err);
      setRooms([]);
    }
  };

  const loadFaculty = async () => {
    try {
      const res = await api.get("/faculty");
      setFaculty(res.data);
    } catch (err) {
      console.error("Failed to load faculty", err);
      setFaculty([]);
    }
  };

  /* ---------------- CREATE SLOT ---------------- */
  const createSlot = async () => {
    if (!year || !date || !time) {
      alert("Please fill all fields");
      return;
    }

    await api.post("/admin/semester-seating/slots", {
      year,
      exam_date: date,
      exam_time: time,
    });

    setYear("");
    setDate("");
    setTime("");
    loadSlots();
  };

  /* ---------------- ROOM MULTI-SELECT ---------------- */
  const toggleRoom = (roomId: number) => {
    setSelectedRooms((prev) =>
      prev.includes(roomId)
        ? prev.filter((id) => id !== roomId)
        : [...prev, roomId]
    );
  };

  /* ---------------- GENERATE SEATING ---------------- */
  const generateSeating = async (slotId: number) => {
    if (selectedRooms.length === 0) {
      alert("Select at least one room");
      return;
    }

    await api.post("/admin/semester-seating/generate", {
      slot_id: slotId,
      room_ids: selectedRooms,
    });

    alert("Semester seating generated");
  };

  /* ---------------- VIEW SEATING ---------------- */
  const viewSeating = async (slotId: number) => {
    try {
      const res = await api.get(`/admin/semester-seating/view/${slotId}`);

      if (!res.data || res.data.length === 0) {
        alert("No seating data found. Please generate seating first.");
        return;
      }

      setSeating(res.data);
      setViewSlotId(slotId);

      // FIXED: map faculty_name directly
      const facultyMap: any = {};
      res.data.forEach((row: any) => {
        if (row.faculty_name) {
          facultyMap[row.room_id] = {
            name: row.faculty_name,
          };
        }
      });
      setFacultyByRoom(facultyMap);
    } catch (err: any) {
      console.error("Error fetching seating:", err);
      alert("Failed to load seating");
    }
  };

  /* ---------------- DELETE SLOT ---------------- */
  const deleteSlot = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this slot?")) return;

    await api.delete(`/admin/semester-seating/slots/${id}`);
    setSlots(slots.filter((slot) => slot.id !== id));
  };

  /* ---------------- GROUP BY ROOM ---------------- */
  const groupedSeating = seating.reduce((acc: any, row) => {
    if (!acc[row.room_id]) {
      acc[row.room_id] = {
        room_id: row.room_id,
        room_name: row.room_name,
        students: [],
      };
    }
    acc[row.room_id].students.push(row);
    return acc;
  }, {});

  /* ---------------- DOWNLOAD PDF ---------------- */
  const downloadPDF = async (slotId: number) => {
    const res = await api.get(
      `/admin/semester-seating/pdf/${slotId}`,
      { responseType: "blob" }
    );

    const blob = new Blob([res.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `semester_seating_${slotId}.pdf`;
    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(url);
  };

  /* ---------------- SEMESTER ATTENDANCE – PDF ---------------- */
  const downloadAttendancePDF = async (slotId: number) => {
    const res = await api.get(
      `/admin/semester-seating/attendance/pdf/${slotId}`,
      { responseType: "blob" }
    );

    const blob = new Blob([res.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `semester_attendance_${slotId}.pdf`;
    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(url);
  };

  /* ---------------- SEMESTER ATTENDANCE – EXCEL ---------------- */
  const downloadAttendanceExcel = async (slotId: number) => {
    const res = await api.get(
      `/admin/semester-seating/attendance/excel/${slotId}`,
      { responseType: "blob" }
    );

    const blob = new Blob([res.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `semester_attendance_${slotId}.xlsx`;
    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(url);
  };

  /* ---------------- SEMESTER ATTENDANCE – PRINT ---------------- */
  const printAttendance = async (slotId: number) => {
    const res = await api.get(
      `/admin/semester-seating/attendance/print/${slotId}`,
      { responseType: "text" as any }
    );

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.open();
    win.document.write(res.data as any);
    win.document.close();
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Semester Seating Arrangement</h1>

      <Card title="Create Semester Exam Slot">
        <div className="flex gap-4 flex-wrap">
          <input className="border px-3 py-2 rounded" placeholder="Year (e.g. 3rd Year)" value={year} onChange={(e) => setYear(e.target.value)} />
          <input type="date" className="border px-3 py-2 rounded" value={date} onChange={(e) => setDate(e.target.value)} />
          <input type="time" className="border px-3 py-2 rounded" value={time} onChange={(e) => setTime(e.target.value)} />
          <Button onClick={createSlot}>Create Slot</Button>
        </div>
      </Card>

      <Card title="Select Rooms (Semester)">
        <div className="grid grid-cols-3 gap-3">
          {rooms.map((room) => (
            <label key={room.id} className={`border rounded-lg p-3 cursor-pointer flex items-center gap-2 ${selectedRooms.includes(room.id) ? "bg-blue-100 border-blue-500" : ""}`}>
              <input type="checkbox" checked={selectedRooms.includes(room.id)} onChange={() => toggleRoom(room.id)} />
              <span className="font-medium text-gray-700">{room.room_name}</span>
            </label>
          ))}
        </div>
      </Card>

      <Card title="Semester Exam Slots">
        {slots.map((slot) => (
          <div
            key={slot.id}
            className="flex justify-between items-center border-b py-3"
          >
            {/* LEFT SIDE */}
            <span>
              <b>{slot.year}</b> –{" "}
              {new Date(slot.exam_date).toLocaleDateString()} –{" "}
              {(() => {
                const start = new Date(`1970-01-01T${slot.exam_time}`);
                const end = new Date(start);
                end.setHours(start.getHours() + SEMESTER_DURATION_HOURS);

                const formatTime = (date: Date) =>
                  date.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                return `${formatTime(start)} – ${formatTime(end)}`;
              })()}
            </span>

            <span className="text-sm font-medium text-blue-600 mt-1">
              Semester Attendance Report
            </span>

            {/* RIGHT SIDE */}
            <div className="flex flex-col items-end gap-2">
              {/* ACTION BUTTONS */}
              <div className="flex gap-2">
                <Button onClick={() => generateSeating(slot.id)}>
                  Generate Seating
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => viewSeating(slot.id)}
                >
                  View Seating
                </Button>

                <Button
                  variant="danger"
                  onClick={() => deleteSlot(slot.id)}
                >
                  Delete
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => downloadPDF(slot.id)}
                >
                  Download PDF
                </Button>
              </div>

              {/* SEMESTER ATTENDANCE LABEL + BUTTONS */}
              <div className="flex flex-col items-end gap-1">

                <div className="flex gap-2">
                  <Button
                    className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600"
                    onClick={() => downloadAttendancePDF(slot.id)}
                  >
                    <Download size={16} />
                    PDF
                  </Button>

                  <Button
                    className="flex items-center gap-1 bg-green-500 hover:bg-green-600"
                    onClick={() => downloadAttendanceExcel(slot.id)}
                  >
                    <Download size={16} />
                    Excel
                  </Button>

                  <Button
                    className="flex items-center gap-1 bg-gray-500 hover:bg-gray-600"
                    onClick={() => printAttendance(slot.id)}
                  >
                    <Printer size={16} />
                    Print
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </Card>

      {viewSlotId && seating.length > 0 && (
        <Card title="Semester Seating (Room-wise)">
          {Object.values(groupedSeating).map((roomData: any) => (
            <div key={roomData.room_id} className="mb-6">
              <h3 className="font-bold text-lg mb-1">Room {roomData.room_name}</h3>

              {facultyByRoom[roomData.room_id] && (
                <p className="text-sm text-green-700 mb-2">
                  👨‍🏫 Invigilator: {facultyByRoom[roomData.room_id].name}
                </p>
              )}

              <table className="w-full border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1">Bench</th>
                    <th className="border px-2 py-1">Roll No</th>
                    <th className="border px-2 py-1">Name</th>
                    <th className="border px-2 py-1">Branch</th>
                  </tr>
                </thead>
                <tbody>
                  {roomData.students.map((s: SeatingRow) => (
                    <tr key={s.seat_number}>
                      <td className="border px-2 py-1 text-center">{s.seat_number}</td>
                      <td className="border px-2 py-1">{s.roll_number}</td>
                      <td className="border px-2 py-1">{s.name}</td>
                      <td className="border px-2 py-1">{s.branch}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}