import { useEffect, useState } from "react";
import { Pencil, Trash2, RotateCcw } from "lucide-react";
import api from "../../api/api";
import { Modal } from "./Modal";

interface Room {
  id: number;
  room_name: string;
  capacity: number;
  is_active: number;
}

export function ManageRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    occupied: 0,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const [form, setForm] = useState({
    room_name: "",
    rows_count: "",
    cols_count: "",
  });

  useEffect(() => {
    fetchRooms();
    fetchStats();
  }, [page]);

  const fetchRooms = async () => {
    const res = await api.get("/admin/rooms", { params: { page } });
    setRooms(res.data.data);
    setTotal(res.data.total);
  };

  const fetchStats = async () => {
    const res = await api.get("/admin/rooms/stats");
    setStats(res.data);
  };

  const openAdd = () => {
    setEditingRoom(null);
    setForm({ room_name: "", rows_count: "", cols_count: "" });
    setIsModalOpen(true);
  };

  const openEdit = (room: Room) => {
    setEditingRoom(room);
    setForm({
      room_name: room.room_name,
      rows_count: "",
      cols_count: "",
    });
    setIsModalOpen(true);
  };

  const submitRoom = async () => {
    const payload = {
      room_name: form.room_name,
      rows_count: Number(form.rows_count),
      cols_count: Number(form.cols_count),
    };

    if (editingRoom) {
      await api.put(`/admin/rooms/${editingRoom.id}`, payload);
    } else {
      await api.post("/admin/rooms", payload);
    }

    setIsModalOpen(false);
    fetchRooms();
    fetchStats();
  };

  const toggleStatus = async (id: number) => {
    await api.patch(`/admin/rooms/${id}/toggle`);
    fetchRooms();
    fetchStats();
  };

  const [deleteRoomId, setDeleteRoomId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDeleteRoom = (id: number) => {
    setDeleteRoomId(id);
    setIsDeleteModalOpen(true);
  };

  const makeRoomInactive = async () => {
    if (!deleteRoomId) return;

    await api.patch(`/admin/rooms/${deleteRoomId}/toggle`);
    setIsDeleteModalOpen(false);
    setDeleteRoomId(null);
    fetchRooms();
    fetchStats();
  };

  const deleteRoomPermanent = async () => {
    if (!deleteRoomId) return;

    await api.delete(`/admin/rooms/${deleteRoomId}`);
    setIsDeleteModalOpen(false);
    setDeleteRoomId(null);
    fetchRooms();
    fetchStats();
  };


  const totalPages = Math.ceil(total / 5);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-2xl p-8 flex justify-between items-center shadow-lg">
        <div>
          <h1 className="text-3xl font-bold text-white">Manage Rooms</h1>
          <p className="text-white/80 mt-1">
            Add, edit, or manage exam rooms
          </p>
        </div>
        <button
          onClick={openAdd}
          className="bg-white text-[#667eea] font-semibold px-6 py-3 rounded-xl shadow"
        >
          + Add Room
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow p-6 text-center">
          <p className="text-gray-500">Total Rooms</p>
          <h2 className="text-3xl font-bold">{stats.total}</h2>
        </div>
        <div className="bg-white rounded-2xl shadow p-6 text-center">
          <p className="text-gray-500">Available</p>
          <h2 className="text-3xl font-bold text-green-600">
            {stats.available}
          </h2>
        </div>
        <div className="bg-white rounded-2xl shadow p-6 text-center">
          <p className="text-gray-500">Occupied</p>
          <h2 className="text-3xl font-bold text-red-600">
            {stats.occupied}
          </h2>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <table className="w-full">
          <colgroup>
            <col style={{ width: "40%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "20%" }} />
          </colgroup>

          <thead className="bg-[#F5F6FC]">
            <tr>
              {/* EXTRA LEFT SPACE */}
              <th className="p-4 pl-8 text-left">Room Number</th>
              <th className="p-4 text-center">Seating Capacity</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {rooms.map((room) => (
              <tr key={room.id} className="border-t">
                {/* EXTRA LEFT SPACE */}
                <td className="p-4 pl-8 text-left">
                  {room.room_name}
                </td>

                <td className="p-4 text-center">
                  {room.capacity}
                </td>

                <td className="p-4 text-center">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${room.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                      }`}
                  >
                    {room.is_active ? "Available" : "Occupied"}
                  </span>
                </td>

                <td className="p-4">
                  <div className="flex justify-center gap-4">
                    <Pencil
                      onClick={() => openEdit(room)}
                      className="cursor-pointer text-blue-600"
                    />

                    {room.is_active ? (
                      <Trash2
                        onClick={() => handleDeleteRoom(room.id)}
                        className="cursor-pointer text-red-600"
                      />
                    ) : (
                      <RotateCcw
                        onClick={() => toggleStatus(room.id)}
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

      {/* PAGINATION */}
      <div className="flex justify-center gap-2">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i + 1)}
            className={`px-4 py-2 rounded ${page === i + 1 ? "bg-blue-600 text-white" : "border"
              }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoom ? "Edit Room" : "Add Room"}
      >
        <div className="space-y-4">
          <input
            placeholder="Room Number"
            className="border w-full p-3 rounded"
            value={form.room_name}
            onChange={(e) =>
              setForm({ ...form, room_name: e.target.value })
            }
          />
          <input
            placeholder="Rows"
            type="number"
            className="border w-full p-3 rounded"
            value={form.rows_count}
            onChange={(e) =>
              setForm({ ...form, rows_count: e.target.value })
            }
          />
          <input
            placeholder="Columns"
            type="number"
            className="border w-full p-3 rounded"
            value={form.cols_count}
            onChange={(e) =>
              setForm({ ...form, cols_count: e.target.value })
            }
          />
          <button
            onClick={submitRoom}
            className="bg-[#667eea] text-white px-6 py-3 rounded-xl"
          >
            Save
          </button>
        </div>
      </Modal>
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Room"
      >
        <div className="space-y-6 text-center">
          <p className="text-gray-600">
            Choose what you want to do with this room.
          </p>

          <div className="flex justify-center gap-4">
            <button
              onClick={makeRoomInactive}
              className="bg-yellow-500 text-white px-6 py-3 rounded-xl shadow hover:opacity-90"
            >
              Make Inactive
            </button>

            <button
              onClick={deleteRoomPermanent}
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
