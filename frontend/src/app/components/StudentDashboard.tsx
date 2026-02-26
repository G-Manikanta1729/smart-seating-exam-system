import { useEffect, useState } from "react";
import api from "../../api/api";
import axios from "axios";
import {
  Calendar,
  Clock,
  MapPin,
  Armchair,
  FileText as ExamIcon,
  Bell,
  IdCard,
  Smartphone
} from "lucide-react";

/* =========================
   TYPES
========================= */

interface Student {
  name: string;
  email: string;
  roll_number: string;
  branch: string;
  year: string;
}

interface Exam {
  exam_name: string;
  exam_date: string;
  exam_time: string;
  duration: number;
  room_number: string;
  bench_number: string;
}

/* =========================
   HELPERS
========================= */

const formatDate = (date: string) => date.split("T")[0];
const formatTime = (time: string) => time.substring(0, 5);

/* =========================
   COMPONENT
========================= */

const StudentDashboard = () => {
  const [student, setStudent] = useState<Student | null>(null);
  const [todayExam, setTodayExam] = useState<Exam | null>(null);
  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  /* =========================
     FETCH DASHBOARD DATA
  ========================= */

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          window.location.href = "/login";
          return;
        }

        const res = await api.get(
          "/student/dashboard",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setStudent(res.data.student);
        setTodayExam(res.data.todayExam);
        setUpcomingExams(res.data.upcomingExams);
      } catch (err) {
        console.error("Dashboard load failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <p className="text-lg font-semibold text-gray-600">
          Loading Dashboard...
        </p>
      </div>
    );
  }

  /* =========================
     UI
  ========================= */

  return (
    <div className="p-8 bg-[#F8FAFC] min-h-screen">
      {/* ================= WELCOME ================= */}
      <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold mb-1">
          Welcome, {student?.name} 👋
        </h2>
        <p className="text-sm opacity-90">
          Roll Number: {student?.roll_number} | {student?.year} Year –{" "}
          {student?.branch}
        </p>
      </div>

      {/* ================= TODAY'S EXAM ================= */}
      <div className="mt-6 bg-white p-6 rounded-2xl shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <ExamIcon size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold">
              Today&apos;s Exam
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                Today
              </span>
            </p>
            {todayExam && (
              <p className="text-blue-600 font-semibold">
                {todayExam.exam_name}
              </p>
            )}
          </div>
        </div>

        {todayExam ? (
          <div className="grid grid-cols-2 gap-6 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p>{formatDate(todayExam.exam_date)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock size={16} />
              <div>
                <p className="text-xs text-gray-500">Time</p>
                <p>{formatTime(todayExam.exam_time)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MapPin size={16} />
              <div>
                <p className="text-xs text-gray-500">Room Number</p>
                <p>{todayExam.room_number}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Armchair size={16} />
              <div>
                <p className="text-xs text-gray-500">Bench Number</p>
                <p>{todayExam.bench_number}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No exam scheduled for today.</p>
        )}
      </div>

      {/* ================= UPCOMING EXAMS ================= */}
      <div className="mt-6 bg-white p-6 rounded-2xl shadow">
        <h3 className="text-lg font-semibold mb-4">
          Upcoming Examinations
        </h3>

        {upcomingExams.length === 0 && (
          <p className="text-gray-500">No upcoming exams.</p>
        )}

        {upcomingExams.map((exam, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-5 mb-3 rounded-xl border border-gray-100 bg-white"
          >
            <div className="space-y-3 w-full">
              <p className="font-semibold text-[#2D3748]">
                {exam.exam_name}
              </p>

              <div className="grid grid-cols-4 gap-10 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>{formatDate(exam.exam_date)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span>{formatTime(exam.exam_time)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin size={16} />
                  <span>{exam.room_number}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Armchair size={16} />
                  <span>{exam.bench_number}</span>
                </div>
              </div>
            </div>

            <span className="ml-6 px-4 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-600">
              Upcoming
            </span>
          </div>
        ))}
      </div>

      {/* ================= IMPORTANT GUIDELINES ================= */}
      <div className="mt-6 bg-white p-6 rounded-2xl shadow">
        <h3 className="text-lg font-semibold mb-4 text-blue-600">
          Important Guidelines
        </h3>

        <div className="space-y-3">
          <Guideline icon={<Bell size={18} />} title="Reporting Time"
            text="Students must report to the examination hall 15 minutes before the scheduled time." />

          <Guideline icon={<IdCard size={18} />} title="Identity Card"
            text="Carry your valid college ID card for verification." />

          <Guideline icon={<Armchair size={18} />} title="Seating Arrangement"
            text="Sit only at your assigned bench number. Cross-check before starting." />

          <Guideline icon={<Smartphone size={18} />} title="Electronic Devices"
            text="Mobile phones and electronic devices are strictly prohibited." />
        </div>
      </div>
    </div>
  );
};

/* =========================
   GUIDELINE ITEM
========================= */

const Guideline = ({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) => (
  <div className="flex items-start gap-3 p-4 rounded-xl bg-[#F9FAFB]">
    <div className="text-blue-600 mt-1">{icon}</div>
    <div>
      <p className="font-semibold text-sm text-gray-800">{title}</p>
      <p className="text-sm text-gray-600">{text}</p>
    </div>
  </div>
);

export default StudentDashboard;