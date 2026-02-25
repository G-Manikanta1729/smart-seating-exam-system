import { useEffect, useState } from "react";
import axios from "axios";
import {
  Bell,
  Calendar,
  MapPin,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Card } from "./Card";

/* =========================
   TYPES
========================= */

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "exam" | "seating" | "update" | "info";
}

/* =========================
   COMPONENT
========================= */

const StudentNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  /* =========================
     FETCH FROM BACKEND
  ========================= */

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5000/api/student/notifications",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // 🔹 Map backend → figma notification types
        const mapped = res.data.notifications.map((n: any, i: number) => ({
          id: i + 1,
          title: n.title,
          message: n.message,
          time: formatTime(n.time),
          read: n.read,
          type: getTypeFromTitle(n.title),
        }));

        setNotifications(mapped);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) return <p className="p-8">Loading...</p>;

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  return (
    <div className="p-8 bg-[#F8FAFC] min-h-screen">
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-gray-500">
            Stay updated with your examination schedule
          </p>
        </div>

        <span className="px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-600">
          {unreadCount === 0 ? "No Unread" : `${unreadCount} Unread`}
        </span>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <StatCard label="Total" value={notifications.length} />
        <StatCard label="Unread" value={unreadCount} color="red" />
        <StatCard
          label="Read"
          value={notifications.length - unreadCount}
          color="green"
        />
      </div>

      {/* ================= LIST ================= */}
      <Card>
        <div className="space-y-4">
          {notifications.map(n => (
            <NotificationItem key={n.id} notification={n} />
          ))}
        </div>

        <div className="text-center mt-6">
          <button
            onClick={markAllAsRead}
            className="text-sm text-blue-600 hover:underline"
          >
            Mark all as read
          </button>
        </div>
      </Card>
    </div>
  );
};

export default StudentNotifications;

/* =========================
   SUB COMPONENTS
========================= */

const StatCard = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) => (
  <Card>
    <p className="text-sm text-gray-500">{label}</p>
    <p
      className={`text-2xl font-bold ${color === "red"
          ? "text-red-600"
          : color === "green"
            ? "text-green-600"
            : "text-gray-900"
        }`}
    >
      {value}
    </p>
  </Card>
);

const NotificationItem = ({ notification }: { notification: Notification }) => {
  const { icon, border } = getStyle(notification.type);

  return (
    <div
      className={`p-4 rounded-xl border-l-4 ${border} ${notification.read ? "bg-white" : "bg-blue-50"
        } flex items-start gap-4`}
    >
      <div className="w-10 h-10 bg-white rounded-full border flex items-center justify-center">
        {icon}
      </div>

      <div className="flex-1">
        <div className="flex justify-between">
          <p className="font-semibold text-sm">{notification.title}</p>
          {!notification.read && (
            <span className="w-2 h-2 bg-blue-600 rounded-full mt-1"></span>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {notification.message}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {notification.time}
        </p>
      </div>
    </div>
  );
};

/* =========================
   HELPERS
========================= */

const getTypeFromTitle = (title: string) => {
  if (title.includes("Today")) return "exam";
  if (title.includes("Seating")) return "seating";
  if (title.includes("Update")) return "update";
  return "info";
};

const getStyle = (type: string) => {
  switch (type) {
    case "exam":
      return {
        icon: <Calendar size={18} className="text-blue-600" />,
        border: "border-blue-500",
      };
    case "seating":
      return {
        icon: <MapPin size={18} className="text-green-600" />,
        border: "border-green-500",
      };
    case "update":
      return {
        icon: <AlertCircle size={18} className="text-yellow-500" />,
        border: "border-yellow-500",
      };
    default:
      return {
        icon: <Bell size={18} className="text-gray-500" />,
        border: "border-gray-300",
      };
  }
};

const formatTime = (date: string) => {
  return new Date(date).toDateString();
};