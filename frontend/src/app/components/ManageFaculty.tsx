import { useEffect, useState } from "react";
import { Pencil, Trash2, RotateCcw, Eye, EyeOff } from "lucide-react";
import api from "../../api/api";
import { Modal } from "./Modal";

interface Faculty {
  id: number;
  name: string;
  email: string;
  branch: string;
  is_active: number;
}

export function ManageFaculty() {
  const [list, setList] = useState<Faculty[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Faculty | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", branch: "" });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchList();
  }, [page]);

  const fetchList = async () => {
    try {
      const res = await api.get("/faculty");
      setList(res.data);
    } catch (err) {
      setError("Failed to fetch faculty list");
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", email: "", password: "", branch: "" });
    setError("");
    setIsModalOpen(true);
  };

  const openEdit = (f: Faculty) => {
    setEditing(f);
    setForm({ name: f.name, email: f.email || "", password: "", branch: f.branch || "" });
    setError("");
    setIsModalOpen(true);
  };

  const submit = async () => {
    setError("");

    if (!form.name || !form.email) {
      setError("Name and email are required");
      return;
    }

    if (!form.branch) {
      setError("Branch is required");
      return;
    }

    if (!editing && !form.password) {
      setError("Password is required for new faculty");
      return;
    }

    try {
      const payload: any = { name: form.name, email: form.email, branch: form.branch, };
      if (form.password) payload.password = form.password;

      if (editing) {
        await api.put(`/faculty/${editing.id}`, payload);
      } else {
        await api.post(`/faculty`, payload);
      }

      setIsModalOpen(false);
      setForm({ name: "", email: "", password: "", branch: "" });
      fetchList();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save faculty");
    }
  };

  const toggle = async (id: number) => {
    try {
      await api.patch(`/faculty/${id}/toggle`);
      fetchList();
    } catch (err) {
      setError("Failed to update status");
    }
  };

  const confirmDelete = (id: number) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const makeInactive = async () => {
    if (!deleteId) return;
    try {
      await api.patch(`/faculty/${deleteId}/toggle`);
      setIsDeleteModalOpen(false);
      setDeleteId(null);
      fetchList();
    } catch (err) {
      setError("Failed to update status");
    }
  };

  const deletePermanent = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/faculty/${deleteId}`);
      setIsDeleteModalOpen(false);
      setDeleteId(null);
      fetchList();
    } catch (err) {
      setError("Failed to delete faculty");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-2xl p-8 flex justify-between items-center shadow-lg">
        <div>
          <h1 className="text-3xl font-bold text-white">Manage Faculty</h1>
          <p className="text-white/80 mt-1">Add, edit, or remove faculty accounts</p>
        </div>
        <button onClick={openAdd} className="bg-white text-[#667eea] font-semibold px-6 py-3 rounded-xl shadow">
          + Add Faculty
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#F5F6FC]">
            <tr>
              <th className="p-4 pl-8 text-left">Name</th>
              <th className="p-4 text-left">Email</th>
              <th className="p-4 text-left">Branch</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((f) => (
              <tr key={f.id} className="border-t">
                <td className="p-4 pl-8">{f.name}</td>
                <td className="p-4">{f.email}</td>
                <td className="p-4 text-center">
                  {f.branch || <span className="text-gray-500">N/A</span>}
                </td>
                <td className="p-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-sm ${f.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {f.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex justify-center gap-4">
                    <Pencil onClick={() => openEdit(f)} className="cursor-pointer text-blue-600" />
                    {f.is_active ? (
                      <Trash2 onClick={() => confirmDelete(f.id)} className="cursor-pointer text-red-600" />
                    ) : (
                      <RotateCcw onClick={() => toggle(f.id)} className="cursor-pointer text-green-600" />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? "Edit Faculty" : "Add Faculty"}>
        <div className="space-y-4">
          {error && <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>}
          <input className="border w-full p-3 rounded" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="border w-full p-3 rounded" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
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
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="border w-full p-3 rounded pr-10"
              placeholder={editing ? "Password (optional)" : "Password (required)"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
            <button onClick={submit} className="bg-[#667eea] text-white px-6 py-3 rounded-xl">Save</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete">
        <div className="space-y-4">
          <p>Are you sure you want to delete this faculty?</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
            <button onClick={makeInactive} className="px-4 py-2 bg-yellow-500 text-white rounded">Make Inactive</button>
            <button onClick={deletePermanent} className="px-4 py-2 bg-red-500 text-white rounded">Delete Permanently</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
