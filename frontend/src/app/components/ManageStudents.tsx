import { useEffect, useState } from "react";
import {
  Pencil,
  Trash2,
  RotateCcw,
  Search,
  Eye,
  EyeOff,
} from "lucide-react";
import api from "../../api/api";
import { Modal } from "./Modal";

interface Student {
  id: number;
  name: string;
  roll_number: string;
  branch: string;
  year: string;
  is_active: number;
}

export function ManageStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("ALL");
  const [year, setYear] = useState("ALL");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] =
    useState<Student | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [deleteStudentId, setDeleteStudentId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);


  const [form, setForm] = useState({
    name: "",
    roll_number: "",
    email: "",
    branch: "",
    year: "",
    password: "",
  });

  useEffect(() => {
    fetchStudents();
  }, [page, search, branch, year]);

  const fetchStudents = async () => {
    const res = await api.get("/admin/students", {
      params: {
        search,
        branch,
        year,
        page,
        limit: 20,
      },
    });

    const sorted = [...res.data.data].sort((a: Student, b: Student) =>
      a.roll_number.localeCompare(b.roll_number, undefined, {
        numeric: true,
        sensitivity: "base",
      })
    );

    setStudents(sorted);
    setTotal(res.data.total);
  };

  const openAdd = () => {
    setEditingStudent(null);
    setForm({
      name: "",
      roll_number: "",
      email: "",
      branch: "",
      year: "",
      password: "",
    });
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const openEdit = (s: Student) => {
    setEditingStudent(s);
    setForm({
      name: s.name,
      roll_number: s.roll_number,
      email: "",
      branch: s.branch,
      year: s.year,
      password: "",
    });
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const submitStudent = async () => {
    const payload = {
      name: form.name,
      roll_number: form.roll_number,
      email: form.email,
      branch: form.branch,
      year: form.year,
      password: form.password || undefined,
    };

    if (editingStudent) {
      await api.put(`/admin/students/${editingStudent.id}`, payload);
    } else {
      await api.post("/admin/students", payload);
    }

    setIsModalOpen(false);
    fetchStudents();
  };

  const toggleStatus = async (id: number) => {
    await api.patch(`/admin/students/${id}/toggle`);
    fetchStudents();
  };

  const totalPages = Math.ceil(total / 20);

  const handleDelete = (id: number) => {
    setDeleteStudentId(id);
    setIsDeleteModalOpen(true);
  };
  const makeInactive = async () => {
    if (!deleteStudentId) return;

    await api.patch(`/admin/students/${deleteStudentId}/toggle`);
    setIsDeleteModalOpen(false);
    setDeleteStudentId(null);
    fetchStudents();
  };

  const deletePermanent = async () => {
    if (!deleteStudentId) return;

    await api.delete(`/admin/students/${deleteStudentId}`);
    setIsDeleteModalOpen(false);
    setDeleteStudentId(null);
    fetchStudents();
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-2xl p-8 flex justify-between items-center shadow-lg">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Manage Students
          </h1>
          <p className="text-white/80 mt-1">
            Add, edit, or remove student records
          </p>
        </div>
        <button
          onClick={openAdd}
          className="bg-white text-[#667eea] font-semibold px-6 py-3 rounded-xl shadow"
        >
          + Add Student
        </button>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow flex items-center gap-4">
        <div className="flex items-center gap-2 flex-1 border rounded-xl px-4 py-3">
          <Search size={18} className="text-gray-400" />
          <input
            placeholder="Search by name or roll..."
            className="w-full outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          className="border rounded-xl px-4 py-3"
        >
          <option value="ALL">All Branches</option>
          <option value="CSE">CSE</option>
          <option value="IT">IT</option>
          <option value="CSD">CSD</option>
          <option value="CSM">CSM</option>
          <option value="ECE">ECE</option>
        </select>

        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="border rounded-xl px-4 py-3"
        >
          <option value="ALL">All Years</option>
          <option value="1st Year">1st Year</option>
          <option value="2nd Year">2nd Year</option>
          <option value="3rd Year">3rd Year</option>
          <option value="4th Year">4th Year</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#F5F6FC]">
            <tr>
              <th className="p-4 pl-8 text-left">Roll</th>
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-center">Branch</th>
              <th className="p-4 text-center">Year</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-4 pl-8">{s.roll_number}</td>
                <td className="p-4">{s.name}</td>
                <td className="p-4 text-center">{s.branch}</td>
                <td className="p-4 text-center">{s.year}</td>
                <td className="p-4 text-center">
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${s.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                      }`}
                  >
                    {s.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex justify-center gap-4">
                    <Pencil
                      onClick={() => openEdit(s)}
                      className="cursor-pointer text-blue-600"
                    />
                    {s.is_active ? (
                      <Trash2
                        onClick={() => handleDelete(s.id)}
                        className="cursor-pointer text-red-600"
                      />
                    ) : (
                      <RotateCcw
                        onClick={() => toggleStatus(s.id)}
                        className="cursor-pointer text-green-600"
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center gap-2">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i + 1)}
            className={`px-4 py-2 rounded ${page === i + 1
              ? "bg-blue-600 text-white"
              : "border"
              }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? "Edit Student" : "Add Student"}
      >
        <div className="space-y-4">
          <input
            className="border w-full p-3 rounded"
            placeholder="Name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />
          <input
            className="border w-full p-3 rounded"
            placeholder="Roll Number"
            value={form.roll_number}
            onChange={(e) =>
              setForm({ ...form, roll_number: e.target.value })
            }
          />
          <input
            className="border w-full p-3 rounded"
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />
          <select
            className="border w-full p-3 rounded"
            value={form.branch}
            onChange={(e) =>
              setForm({ ...form, branch: e.target.value })
            }
          >
            <option value="">Select Branch</option>
            <option value="CSE">CSE</option>
            <option value="IT">IT</option>
            <option value="CSD">CSD</option>
            <option value="CSM">CSM</option>
            <option value="ECE">ECE</option>
            <option value="EEE">EEE</option>
            <option value="MECH">MECH</option>
            <option value="CIVIL">CIVIL</option>
          </select>
          <select
            className="border w-full p-3 rounded"
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
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="border w-full p-3 rounded pr-10"
              placeholder="Password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
          <button
            onClick={submitStudent}
            className="bg-[#667eea] text-white px-6 py-3 rounded-xl"
          >
            Save
          </button>
        </div>
      </Modal>
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete this student?</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
            <button
              onClick={makeInactive}
              className="px-4 py-2 bg-yellow-500 text-white rounded"
            >
              Make Inactive
            </button>
            <button
              onClick={deletePermanent}
              className="px-4 py-2 bg-red-500 text-white rounded"
            >
              Delete Permanently
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
