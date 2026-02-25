import React, { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Card } from "./Card";
import { Table } from "./Table";
import { Button } from "./Button";
import { Select } from "./Select";
import api from "../../api/api";

/* ================= TYPES ================= */
interface Exam {
  id: number;
  exam_name: string;
  exam_date: string;
}

interface Faculty {
  id: number;
  name: string;
}

interface Allocation {
  room_id: number;
  room: string;
  faculty_id: number | null;
  faculty: string;
  exam: string;
  date: string;
}

export function FacultyAllocation() {
  /* ================= STATE ================= */
  const [exams, setExams] = useState<Exam[]>([]);
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [selectedExam, setSelectedExam] = useState<number | null>(null);

  /* ================= FETCH EXAMS ================= */
  useEffect(() => {
    api.get("/admin/exams").then((res) => {
      setExams(res.data);
    });
  }, []);

  /* ================= FETCH FACULTY ================= */
  useEffect(() => {
    api.get("/faculty").then((res) => {
      setFacultyList(res.data);
    });
  }, []);

  /* ================= FETCH ALLOCATIONS (FIXED) ================= */
  useEffect(() => {
    if (!selectedExam) return;

    api
      .get(`/admin/faculty/allocation`, {
        params: { examId: selectedExam },
      })
      .then((res) => {
        const exam = exams.find((e) => e.id === selectedExam);

        const formatted: Allocation[] = res.data.map((r: any) => ({
          room_id: r.room_id,
          room: r.room_name,
          faculty_id: r.faculty_id,
          faculty: r.faculty_name || "",
          exam: exam?.exam_name || "",
          date: exam?.exam_date?.slice(0, 10) || "",
        }));

        setAllocations(formatted);
      });
  }, [selectedExam, exams]);

  /* ================= ASSIGN FACULTY ================= */
  const assignFaculty = (roomId: number, facultyId: number) => {
    if (!selectedExam) return;
    // send assignment to server and update local state
    api
      .post("/admin/faculty/allocation", {
        exam_id: selectedExam,
        room_id: roomId,
        faculty_id: facultyId,
      })
      .then(() => {
        setAllocations((prev) =>
          prev.map((a) =>
            a.room_id === roomId
              ? {
                ...a,
                faculty_id: facultyId,
                faculty:
                  facultyList.find((f) => f.id === facultyId)?.name || "",
              }
              : a
          )
        );
      })
      .catch((err) => {
        console.error("Assign faculty failed:", err);
        alert(err.response?.data?.message || "Failed to assign faculty");
      });
  };

  /* ================= SAVE ALL ALLOCATIONS ================= */
  const saveAllAllocations = async () => {
    if (!selectedExam) return alert("Select an exam first");

    try {
      const promises: Promise<any>[] = [];

      allocations.forEach((a) => {
        if (a.faculty_id) {
          promises.push(
            api.post("/admin/faculty/allocation", {
              exam_id: selectedExam,
              room_id: a.room_id,
              faculty_id: a.faculty_id,
            })
          );
        } else {
          // if no faculty selected, ensure any existing allocation is removed
          promises.push(
            api.delete("/admin/faculty/allocation", { data: { exam_id: selectedExam, room_id: a.room_id } })
          );
        }
      });

      await Promise.all(promises);
      alert("Allocations saved");
      // refresh allocations from server
      const res = await api.get(`/admin/faculty/allocation`, { params: { examId: selectedExam } });
      const exam = exams.find((e) => e.id === selectedExam);
      const formatted: Allocation[] = res.data.map((r: any) => ({
        room_id: r.room_id,
        room: r.room_name,
        faculty_id: r.faculty_id,
        faculty: r.faculty_name || "",
        exam: exam?.exam_name || "",
        date: exam?.exam_date?.slice(0, 10) || "",
      }));
      setAllocations(formatted);
    } catch (err: any) {
      console.error("Save allocations failed:", err);
      alert(err.response?.data?.message || "Failed to save allocations");
    }
  };

  /* ================= TABLE COLUMNS (UI SAME) ================= */
  const columns = [
    { key: "room", header: "Room Number" },
    { key: "exam", header: "Exam" },
    { key: "date", header: "Date" },
    {
      key: "faculty",
      header: "Assigned Faculty",
      render: (_: any, row: Allocation) => (
        <select
          className="px-3 py-1.5 border rounded bg-white text-sm"
          value={row.faculty_id ?? ""}
          onChange={(e) =>
            assignFaculty(row.room_id, Number(e.target.value))
          }
        >
          <option value="">Select Faculty</option>
          {/*{facultyList.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}*/}
          {facultyList
            .filter((f) => {
              // Allow current selected faculty for this row
              if (row.faculty_id === f.id) return true;
              // Block faculty already assigned to another room
              return !allocations.some(
                (a) => a.faculty_id === f.id && a.room_id !== row.room_id
              );
            })
            .map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}

        </select>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (_: any, row: Allocation) => (
        <span
          className={`px-3 py-1 rounded-full text-xs ${row.faculty
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
            }`}
        >
          {row.faculty ? "Assigned" : "Pending"}
        </span>
      ),
    },
  ];

  /* ================= UI (UNCHANGED) ================= */
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Faculty Allocation</h1>
          <p className="text-gray-500">
            Assign faculty members to examination rooms
          </p>
        </div>
        <Button onClick={saveAllAllocations}>
          <Save size={18} className="mr-2" />
          Save Allocation
        </Button>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-3 gap-6">
        <Card>
          <p>Total Rooms</p>
          <p className="text-2xl">{allocations.length}</p>
        </Card>

        <Card>
          <p>Assigned</p>
          <p className="text-2xl text-green-600">
            {allocations.filter((a) => a.faculty).length}
          </p>
        </Card>

        <Card>
          <p>Pending</p>
          <p className="text-2xl text-yellow-600">
            {allocations.filter((a) => !a.faculty).length}
          </p>
        </Card>
      </div>

      {/* EXAM SELECTION */}
      <Card>
        <Select
          label="Select Exam"
          options={exams.map((e) => ({
            value: String(e.id),
            label: `${e.exam_name} - ${e.exam_date.slice(0, 10)}`,
          }))}
          onChange={(e) => setSelectedExam(Number(e.target.value))}
        />
      </Card>

      {/* TABLE */}
      <Card title="Room-wise Faculty Allocation">
        <Table columns={columns} data={allocations} />
      </Card>

      {/* AVAILABLE FACULTY */}
      <Card title="Available Faculty Members">
        <div className="grid grid-cols-4 gap-3">
          {facultyList.map((f) => {
            const isAssigned = allocations.some(
              (a) => a.faculty_id === f.id
            );
            return (
              <div
                key={f.id}
                className={`p-3 border rounded-lg ${isAssigned
                    ? "bg-gray-100 text-gray-400"
                    : "bg-blue-50 border-blue-500"
                  }`}
              >
                {f.name}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
