import React, { useEffect, useState } from "react";
import { Users, DoorOpen, FileText, CheckCircle, TrendingUp } from "lucide-react";
import { StatCard } from "./StatCard";
import { Card } from "./Card";
import { Table } from "./Table";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

//  Format date: 2026-03-05T18:30:00.000Z → 2026-03-05
const formatSlotDate = (date: string | null | undefined) => {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return d.toISOString().split("T")[0];
};

//  Format time range: start → end
const formatTimeRange = (startTime: string, durationMinutes = 180) => {
  const [h, m, s] = startTime.split(":").map(Number);

  const start = new Date();
  start.setHours(h, m, s || 0);

  const end = new Date(start.getTime() + durationMinutes * 60000);

  const format = (d: Date) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return `${format(start)} - ${format(end)}`;
};

export function AdminDashboard() {
  const navigate = useNavigate();

  // ================= STATE =================
  const [stats, setStats] = useState({
    students: 0,
    rooms: 0,
    todayExams: 0,
    seatingGenerated: 0,
  });

  const [upcomingExams, setUpcomingExams] = useState<any[]>([]);
  const [semesterSlots, setSemesterSlots] = useState<any[]>([]);

  // ================= DATE =================
  const today = new Date().toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // ================= API CALLS =================
  useEffect(() => {
    api
      .get("/admin/dashboard-stats")
      .then((res) => setStats(res.data))
      .catch((err) =>
        console.error("Dashboard stats error:", err)
      );

    api
      .get("/admin/exams/upcoming")
      .then((res) => setUpcomingExams(res.data))
      .catch((err) =>
        console.error("Upcoming exams error:", err)
      );

    api
      .get("/admin/semester-seating/slots")
      .then((res) => setSemesterSlots(res.data))
      .catch((err) =>
        console.error("Semester slots error:", err)
      );
  }, []);

  // ================= TABLE COLUMNS =================
  const columns = [
    { key: "exam", header: "Exam Name" },
    { key: "date", header: "Date" },
    { key: "branch", header: "Branch" },
    { key: "year", header: "Year" },
    { key: "faculty_names", header: "Faculty" },
    {
      key: "status",
      header: "Status",
      render: (value: string) => (
        <span
          className={`px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm ${value === "Scheduled"
              ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white"
              : "bg-gradient-to-r from-yellow-400 to-orange-500 text-white"
            }`}
        >
          {value}
        </span>
      ),
    },
  ];

  const semesterColumns = [
    { key: "exam_date", header: "Slot Date", render: (value: string) => formatSlotDate(value), },
    { key: "exam_time", header: "Time", render: (value: string) => formatTimeRange(value), },
    { key: "rooms", header: "Rooms" },
    {
      key: "action",
      header: "Seating Arrangement",
      render: (_: any, row: any) => (
        <button
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg text-sm"
          onClick={() => navigate(`/admin/semester-seating?view=${row.id}`)}
        >
          View Seating
        </button>
      ),
    },
  ];

  // ================= UI =================
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl mb-2 font-bold">
              Admin Dashboard
            </h1>
            <p className="text-white/90 text-lg">
              Welcome back! Here's what's happening today.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl">
            <TrendingUp size={24} />
            <div>
              <p className="text-xs text-white/80">Today</p>
              <p className="text-lg font-bold">{today}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={stats.students.toString()}
          icon={<Users size={28} />}
          color="#667eea"
        />
        <StatCard
          title="Total Rooms"
          value={stats.rooms.toString()}
          icon={<DoorOpen size={28} />}
          color="#48BB78"
        />
        <StatCard
          title="Today's Exams"
          value={stats.todayExams.toString()}
          icon={<FileText size={28} />}
          color="#F59E0B"
        />
        <StatCard
          title="Seating Generated"
          value={stats.seatingGenerated.toString()}
          icon={<CheckCircle size={28} />}
          color="#8B5CF6"
        />
      </div>

      {/* Upcoming Exams */}
      <Card title="📅 Upcoming Examinations" gradient>
        <Table columns={columns} data={upcomingExams} />
      </Card>

      {/* Semester Seating Slots */}
      <Card title="🎓 Semester Slots" gradient>
        <Table
          columns={semesterColumns}
          data={semesterSlots.map((slot) => ({
            ...slot,
            rooms: slot.rooms || "Generated",
          }))}
        />
      </Card>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl text-[#2D3748] mb-4 font-bold">
          ⚡ Quick Actions
        </h2>

        <div className="grid grid-cols-3 gap-6">
          {/* Manage Students */}
          <div
            className="bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
            onClick={() => navigate("/admin/students")}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Users size={28} />
              </div>
              <span className="px-3 py-1 bg-white/20 rounded-full text-xs">
                Active
              </span>
            </div>
            <h4 className="text-xl mb-2 font-bold">
              Manage Students
            </h4>
            <p className="text-white/80 text-sm mb-4">
              Add, edit, or remove student records
            </p>
            <button className="text-white text-sm font-semibold hover:underline">
              Go to Students →
            </button>
          </div>

          {/* Create Exam */}
          <div
            className="bg-gradient-to-br from-[#48BB78] to-[#38A169] rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
            onClick={() => navigate("/admin/exams")}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <FileText size={28} />
              </div>
              <span className="px-3 py-1 bg-white/20 rounded-full text-xs">
                New
              </span>
            </div>
            <h4 className="text-xl mb-2 font-bold">
              Create Exam
            </h4>
            <p className="text-white/80 text-sm mb-4">
              Schedule a new examination
            </p>
            <button className="text-white text-sm font-semibold hover:underline">
              Create Exam →
            </button>
          </div>

          {/* Generate Seating */}
          <div
            className="bg-gradient-to-br from-[#F093FB] to-[#F5576C] rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
            onClick={() => navigate("/admin/seating")}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <CheckCircle size={28} />
              </div>
              <span className="px-3 py-1 bg-white/20 rounded-full text-xs">
                Auto
              </span>
            </div>
            <h4 className="text-xl mb-2 font-bold">
              Generate Seating
            </h4>
            <p className="text-white/80 text-sm mb-4">
              Create seating arrangements
            </p>
            <button className="text-white text-sm font-semibold hover:underline">
              Generate Now →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
