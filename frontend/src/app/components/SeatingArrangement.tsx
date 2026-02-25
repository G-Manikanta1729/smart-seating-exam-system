import { useEffect, useState } from "react";
import api from "../../api/api";
import { Modal } from "./Modal";

interface Exam {
  id: number;
  exam_name: string;
  branch: string;
  year: string;
  exam_date: string;
  seating_generated: number;
}

interface Seat {
  room_name: string;
  seat_number: string;
  roll_number: string;
  name: string;
}

export function SeatingArrangement() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [seating, setSeating] = useState<Seat[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<number | null>(null);

  /* ================= FETCH EXAMS ================= */
  const fetchExams = async () => {
    const res = await api.get("/admin/exams");
    setExams(res.data);
  };

  useEffect(() => {
    fetchExams();
  }, []);

  /* ================= GENERATE / REGENERATE ================= */
  const generateSeating = async (examId: number) => {
    try {
      setLoadingId(examId);
      await api.post(`/admin/seating/${examId}/generate`);
      alert("Seating generated successfully");
      fetchExams();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to generate seating");
    } finally {
      setLoadingId(null);
    }
  };

  /* ================= VIEW ================= */
  const openView = async (exam: Exam) => {
    try {
      setSelectedExam(exam);
      const res = await api.get(`/admin/seating/${exam.id}`);
      setSeating(res.data);
      setViewOpen(true);
    } catch {
      alert("Failed to load seating");
    }
  };

  /* ================= CTRL + Z (UNDO) ================= */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "z" && selectedExam) {
        api
          .post(`/admin/seating/${selectedExam.id}/undo`)
          .then(() => openView(selectedExam));
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedExam]);

  /* ================= GROUP BY ROOM ================= */
  const grouped = seating.reduce((acc: any, s) => {
    acc[s.room_name] = acc[s.room_name] || [];
    acc[s.room_name].push(s);
    return acc;
  }, {});

  /* ================= EXPORT PDF ================= */
  /*const exportPDF = (examId: number) => {
    window.open(
      `http://localhost:5000/api/admin/seating/${examId}/pdf`
    );
  };*/
  const exportPDF = async (examId: number) => {
    try {
      const res = await api.get(
        `/admin/seating/${examId}/pdf`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `seating_exam_${examId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Failed to download PDF");
    }
  };

  /* ================= DELETE SEATING ================= */
  const deleteSeating = async (examId: number) => {
    const confirm = window.confirm(
      "Are you sure you want to delete this seating arrangement?"
    );
    if (!confirm) return;

    try {
      await api.delete(`/admin/seating/${examId}`);
      alert("Seating deleted successfully");
      fetchExams(); // 🔁 reload table
    } catch (err) {
      alert("Failed to delete seating");
      console.error(err);
    }
  };


  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 rounded-2xl text-white shadow">
        <h1 className="text-3xl font-bold">Seating Arrangement</h1>
        <p className="opacity-90">Generate & manage exam seating</p>
      </div>

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left">Exam</th>
              <th className="p-4 text-center">Branch</th>
              <th className="p-4 text-center">Year</th>
              <th className="p-4 text-center">Date</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {exams.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">
                  No exams found
                </td>
              </tr>
            )}

            {exams.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="p-4">{e.exam_name}</td>
                <td className="p-4 text-center">{e.branch}</td>
                <td className="p-4 text-center">{e.year}</td>
                <td className="p-4 text-center">
                  {e.exam_date.slice(0, 10)}
                </td>

                <td className="p-4 flex justify-center gap-2">
                  <button
                    onClick={() => generateSeating(e.id)}
                    disabled={loadingId === e.id}
                    className={`px-4 py-2 rounded text-white ${loadingId === e.id
                      ? "bg-gray-400"
                      : "bg-green-600"
                      }`}
                  >
                    {e.seating_generated ? "Regenerate" : "Generate"}
                  </button>

                  <button
                    disabled={!e.seating_generated}
                    onClick={() => openView(e)}
                    className={`px-4 py-2 rounded text-white ${e.seating_generated
                      ? "bg-blue-600"
                      : "bg-gray-400"
                      }`}
                  >
                    View
                  </button>

                  <button
                    disabled={!e.seating_generated}
                    onClick={() => exportPDF(e.id)}
                    className={`px-4 py-2 rounded text-white ${e.seating_generated
                      ? "bg-purple-600"
                      : "bg-gray-400"
                      }`}
                  >
                    PDF
                  </button>

                  <button
                    className="bg-red-600 text-white px-3 py-1 rounded"
                    onClick={() => {
                      setExamToDelete(e.id);
                      setDeleteOpen(true);
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* VIEW MODAL */}
      <Modal
        isOpen={viewOpen}
        onClose={() => setViewOpen(false)}
        title={`Seating – ${selectedExam?.exam_name}`}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {Object.keys(grouped).map((room) => (
            <div key={room} className="space-y-6">

              {/* 🧑‍🏫 BOARD */}
              <div className="bg-gray-800 text-white text-center py-3 rounded-lg font-bold">
                🧑‍🏫 BOARD
              </div>

              {/* 🪑 CLASSROOM */}
              <div className="grid grid-cols-4 gap-4 justify-center">
                {grouped[room].map((s: Seat) => (
                  <div
                    key={s.seat_number}
                    className="border rounded-xl p-3 text-center shadow bg-white"
                  >
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
      <Modal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Confirm Delete"
      >
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this seating arrangement?
        </p>

        <div className="flex justify-end gap-3">
          {/* Cancel */}
          <button
            className="px-4 py-2 border rounded"
            onClick={() => setDeleteOpen(false)}
          >
            Cancel
          </button>

          {/* Make Inactive (UI only, no logic disturbed) */}
          <button
            className="px-4 py-2 bg-yellow-500 text-white rounded"
            onClick={() => {
              setDeleteOpen(false);
              alert("Make Inactive can be implemented later");
            }}
          >
            Make Inactive
          </button>

          {/* Delete Permanently */}
          <button
            className="px-4 py-2 bg-red-600 text-white rounded"
            onClick={() => {
              if (examToDelete) {
                deleteSeating(examToDelete);
              }
              setDeleteOpen(false);
            }}
          >
            Delete Permanently
          </button>
        </div>
      </Modal>
    </div>
  );
}
