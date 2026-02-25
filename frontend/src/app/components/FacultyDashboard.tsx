import React, { useEffect, useState } from "react";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { Card } from "./Card";
import { Button } from "./Button";
import api from "../../api/api";
import { useAuth } from "../../hooks/useAuth";
import { Modal } from "./Modal";
import { useNavigate } from "react-router-dom";

interface Exam {
  id: number;
  exam_name: string;
  exam_date: string;
  exam_time: string;
  room_names?: string | null;
  students: number;
  faculty_names?: string | null;
  exam_type: "regular" | "semester";
}

export function FacultyDashboard() {
  const { name } = useAuth();
  const [assignedExams, setAssignedExams] = useState<Exam[]>([]);
  const [viewOpen, setViewOpen] = useState(false);
  const [seating, setSeating] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/faculty/dashboard")
      .then((res) => setAssignedExams(res.data.allocations || []))
      .catch((err) => console.error(err));
  }, []);

  const openView = async (exam: Exam) => {
    try {
      setSelectedExam(exam);

      const examType =
        exam.exam_type === "semester" ? "SEMESTER" : "REGULAR";

      const res = await api.get(
        `/faculty/seating/${exam.id}?examType=${examType}`
      );

      setSeating(res.data || []);
      setViewOpen(true);
    } catch (err) {
      console.error(err);
      alert("Failed to load seating");
    }
  };

  const goToAttendance = (exam: Exam) => {
    const params = new URLSearchParams();
    params.set("examId", String(exam.id));
    // Pass exam type so attendance screen can distinguish REGULAR vs SEMESTER
    params.set("examType", exam.exam_type.toUpperCase());
    // If a single room is present, pass it to attendance; otherwise omit.
    if (exam.room_names && !exam.room_names.includes(",")) {
      params.set("room", exam.room_names);
    }
    navigate(`/faculty/attendance?${params.toString()}`, {
      state: { examName: exam.exam_name },
    });
  };

  const groupedSeating = seating.reduce((acc: any, s: any) => {
    acc[s.room_name] = acc[s.room_name] || [];
    acc[s.room_name].push(s);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl text-[#0F172A] mb-2">Faculty Dashboard</h1>
        <p className="text-[#64748B]">Welcome, {name}</p>
      </div>

      {/* TODAY'S SCHEDULE */}
      <Card title="Upcoming Examination Schedule">
        <div className="space-y-4">
          {assignedExams.length === 0 && (
            <p className="text-sm text-gray-500">No upcoming exams</p>
          )}

          {assignedExams.map((exam, index) => (
            <div
              key={index}
              className="border border-[#E2E8F0] rounded-lg p-4 hover:border-[#2563EB]"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg mb-2">{exam.exam_name}</h3>

                  <div className="space-y-2 text-sm text-[#64748B]">
                    <div className="flex gap-2">
                      <Calendar size={16} />
                      {exam.exam_date}
                    </div>
                    <div className="flex gap-2">
                      <Clock size={16} />
                      {exam.exam_time}
                    </div>
                    {exam.room_names ? (
                      <div className="flex gap-2">
                        <MapPin size={16} />
                        Room {exam.room_names}
                      </div>
                    ) : (
                      <div className="flex gap-2 items-center">
                        <MapPin size={16} />
                        <span className="text-sm text-red-600 font-medium">Unallocated</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Users size={16} />
                      {exam.students} Students
                    </div>
                    {exam.faculty_names && (
                      <div className="flex gap-2">
                        <span className="text-sm text-[#64748B]">Faculty:</span>
                        <span className="text-sm">{exam.faculty_names}</span>
                      </div>
                    )}
                  </div>
                </div>

                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                  Upcoming
                </span>
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <Button variant="secondary" onClick={() => openView(exam)}>
                  View Seating
                </Button>
                <Button onClick={() => goToAttendance(exam)}>Mark Attendance</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* VIEW MODAL */}
      <Modal isOpen={viewOpen} onClose={() => setViewOpen(false)} title={`Seating – ${selectedExam?.exam_name}`}>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {seating.length === 0 && <p className="text-center text-gray-500">No seating found</p>}

          {(Object.entries(groupedSeating) as [string, any[]][]).map(([room, seats]) => (
            <div key={room} className="space-y-6">
              <div className="bg-gray-800 text-white text-center py-3 rounded-lg font-bold">🧑‍🏫 BOARD</div>
              <div className="grid grid-cols-4 gap-4 justify-center">
                {seats.map((s: any) => (
                  <div key={s.seat_number} className="border rounded-xl p-3 text-center shadow bg-white">
                    <p className="text-xs text-gray-500">{s.seat_number}</p>
                    <p className="font-bold text-blue-600">{s.roll_number}</p>
                    <p className="text-sm text-gray-700">{s.name}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* QUICK STATS */}
      <div className="grid grid-cols-3 gap-6">
        <Card>
          <div className="text-center">
            <Calendar className="mx-auto mb-2 text-blue-600" />
            <p>Upcoming Exams</p>
            <p className="text-3xl">{assignedExams.length}</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <Users className="mx-auto mb-2 text-green-600" />
            <p>Total Students</p>
            <p className="text-3xl">{assignedExams.reduce((a, b) => a + b.students, 0)}</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <MapPin className="mx-auto mb-2 text-orange-500" />
            <p>Assigned Rooms</p>
            <p className="text-3xl">{assignedExams.length}</p>
          </div>
        </Card>
      </div>

      {/* GUIDELINES */}
      <Card title="Examination Guidelines">
        <ul className="space-y-2 text-sm text-[#64748B]">
          <li>• Arrive 30 minutes before exam time</li>
          <li>• Verify seating arrangement</li>
          <li>• Mark attendance before distributing papers</li>
          <li>• Maintain strict vigilance</li>
          <li>• Submit attendance after exam</li>
        </ul>
      </Card>
    </div>
  );
}