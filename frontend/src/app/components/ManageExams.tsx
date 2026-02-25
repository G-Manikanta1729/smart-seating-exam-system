import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus, RotateCcw } from "lucide-react";
import api from "../../api/api";
import { Modal } from "./Modal";

interface Exam {
  id: number;
  exam_name: string;
  branch: string;
  year: string;
  exam_date: string;
  exam_time: string;
  duration: number;
  is_active: number;
}

/* ================= HELPERS ================= 
const formatDate = (date: string) => {
  return new Date(date).toISOString().slice(0, 10);
};*/
const formatDate = (date: string) => {
  if (!date) return "";

  // Accept either ISO datetime or YYYY-MM-DD string
  if (date.includes("T")) return date.split("T")[0];
  return date.length >= 10 ? date.slice(0, 10) : date;
};

const formatTime = (time: string) => {
  const [h, m] = time.split(":");
  let hour = Number(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${m} ${ampm}`;
};

export function ManageExams() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Exam | null>(null);
  const [deleteExamId, setDeleteExamId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [form, setForm] = useState({
    exam_name: "",
    branch: "",
    year: "",
    exam_date: "",
    exam_time: "",
    duration: "",
  });

  /* ================= FETCH ================= */
  const fetchExams = async () => {
    const res = await api.get("/admin/exams");
    setExams(res.data);
  };

  useEffect(() => {
    fetchExams();
  }, []);

  /* ================= CREATE / UPDATE ================= */
  const submitExam = async () => {
    const payload = {
      ...form,
      duration: Number(form.duration),
    };

    if (editing) {
      await api.put(`/admin/exams/${editing.id}`, payload);
    } else {
      await api.post("/admin/exams", payload);
    }

    closeModal();
    fetchExams();
  };

  /* ================= EDIT ================= */
  const editExam = (exam: Exam) => {
    setEditing(exam);
    setForm({
      exam_name: exam.exam_name,
      branch: exam.branch,
      year: exam.year,
      exam_date: exam.exam_date,
      exam_time: exam.exam_time,
      duration: String(exam.duration),
    });
    setOpen(true);
  };

  /* ================= TOGGLE ================= */
  const toggleExam = async (id: number) => {
    await api.patch(`/admin/exams/${id}/toggle`);
    fetchExams();
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
    setForm({
      exam_name: "",
      branch: "",
      year: "",
      exam_date: "",
      exam_time: "",
      duration: "",
    });
  };

  /* ================= Handling Delete ================= */
  const handleDeleteExam = (id: number) => {
    setDeleteExamId(id);
    setIsDeleteModalOpen(true);
  };

  const makeExamInactive = async () => {
    if (!deleteExamId) return;

    await api.patch(`/admin/exams/${deleteExamId}/toggle`);
    setIsDeleteModalOpen(false);
    setDeleteExamId(null);
    fetchExams();
  };

  const deleteExamPermanent = async () => {
    if (!deleteExamId) return;

    await api.delete(`/admin/exams/${deleteExamId}`);
    setIsDeleteModalOpen(false);
    setDeleteExamId(null);
    fetchExams();
  };


  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manage Exams</h1>
          <p className="text-gray-500">
            Create and manage examination schedules
          </p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white px-6 py-3 rounded-xl font-semibold"
        >
          <Plus size={18} />
          Create Exam
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow p-6">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b text-gray-600">
              <th className="pb-4">Exam Name</th>
              <th className="pb-4">Date</th>
              <th className="pb-4">Time</th>
              <th className="pb-4">Branch</th>
              <th className="pb-4">Year</th>
              <th className="pb-4">Duration</th>
              <th className="pb-4 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {exams.map((e) => (
              <tr
                key={e.id}
                className={`border-b ${!e.is_active ? "opacity-50" : ""
                  }`}
              >
                {/* NAME */}
                <td className="py-4 font-medium">
                  {e.exam_name}
                </td>

                {/* DATE */}
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <span>📅</span>
                    <span>{formatDate(e.exam_date)}</span>
                  </div>
                </td>

                {/* TIME */}
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <span>⏰</span>
                    <span>{formatTime(e.exam_time)}</span>
                  </div>
                </td>

                {/* BRANCH */}
                <td className="py-4">{e.branch}</td>

                {/* YEAR */}
                <td className="py-4">{e.year}</td>

                {/* DURATION */}
                <td className="py-4">
                  {Math.floor(e.duration / 60)} hours
                </td>

                {/* ACTIONS */}
                <td className="py-4 flex justify-center gap-4">
                  <Pencil
                    size={18}
                    className="text-blue-600 cursor-pointer hover:scale-110"
                    onClick={() => editExam(e)}
                  />

                  {e.is_active ? (
                    <Trash2
                      size={18}
                      className="text-red-600 cursor-pointer hover:scale-110"
                      onClick={() => handleDeleteExam(e.id)}
                    />
                  ) : (
                    <RotateCcw
                      size={18}
                      className="text-green-600 cursor-pointer hover:scale-110"
                      onClick={() => toggleExam(e.id)}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      <Modal
        isOpen={open}
        onClose={closeModal}
        title={editing ? "Edit Exam" : "Create New Exam"}
      >
        <div className="space-y-4">
          <label>Exam Name</label>
          <input
            className="w-full border p-3 rounded-xl"
            value={form.exam_name}
            onChange={(e) =>
              setForm({ ...form, exam_name: e.target.value })
            }
          />

          <label>Date</label>
          <input
            type="date"
            className="w-full border p-3 rounded-xl"
            value={form.exam_date}
            onChange={(e) =>
              setForm({ ...form, exam_date: e.target.value })
            }
          />

          <label>Time</label>
          <input
            type="time"
            className="w-full border p-3 rounded-xl"
            value={form.exam_time}
            onChange={(e) =>
              setForm({ ...form, exam_time: e.target.value })
            }
          />

          <label>Branch</label>
          <select
            className="w-full border p-3 rounded-xl"
            value={form.branch}
            onChange={(e) =>
              setForm({ ...form, branch: e.target.value })
            }
          >
            <option value="">Select Branch</option>
            <option value="CSE">CSE</option>
            <option value="IT">IT</option>
            <option value="ECE">ECE</option>
            <option value="CSD">CSD</option>
            <option value="EEE">EEE</option>
            <option value="MECH">MECH</option>
            <option value="CIVIL">CIVIL</option>
            <option value="CSM">CSM</option>
          </select>

          <label>Year</label>
          <select
            className="w-full border p-3 rounded-xl"
            value={form.year}
            onChange={(e) =>
              setForm({ ...form, year: e.target.value })
            }
          >
            <option value="">Select Year</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
          </select>

          <label>Duration</label>
          <select
            className="w-full border p-3 rounded-xl"
            value={form.duration}
            onChange={(e) =>
              setForm({ ...form, duration: e.target.value })
            }
          >
            <option value="">Select Duration</option>
            <option value="60">1 hour</option>
            <option value="120">2 hours</option>
            <option value="180">3 hours</option>
          </select>

          <button
            onClick={submitExam}
            className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white py-3 rounded-xl font-semibold"
          >
            {editing ? "Update Exam" : "Create Exam"}
          </button>
        </div>
      </Modal>
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Exam"
      >
        <div className="space-y-6 text-center">
          <p className="text-gray-600">
            Choose what you want to do with this exam.
          </p>

          <div className="flex justify-center gap-4">
            <button
              onClick={makeExamInactive}
              className="bg-yellow-500 text-white px-6 py-3 rounded-xl shadow hover:opacity-90"
            >
              Disable Exam
            </button>

            <button
              onClick={deleteExamPermanent}
              className="bg-red-600 text-white px-6 py-3 rounded-xl shadow hover:opacity-90"
            >
              Delete Permanently
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
