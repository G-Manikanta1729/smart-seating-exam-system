import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { Sidebar } from "../components/Sidebar";
import { LayoutDashboard, FileText, LogOut } from "lucide-react";

/* =========================
   TYPES
========================= */

interface Student {
  name: string;
  email: string;
}

/* =========================
   COMPONENT
========================= */

export default function StudentLayout() {
  const location = useLocation();
  const [student, setStudent] = useState<Student | null>(null);

  /* =========================
     FETCH STUDENT INFO (NAME + EMAIL)
  ========================= */

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await axios.get(
          "http://localhost:5000/api/student/dashboard",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setStudent(res.data.student);
      } catch (err) {
        console.error("Failed to load student info", err);
      }
    };

    fetchStudent();
  }, []);

  /* =========================
     SIDEBAR MENU
  ========================= */

  const menuItems = [
    {
      icon: <LayoutDashboard size={18} />,
      label: "Dashboard",
      active: location.pathname === "/student",
      onClick: () => (window.location.href = "/student"),
    },
    {
      icon: <FileText size={18} />,
      label: "Notifications",
      active: location.pathname === "/student/notifications",
      onClick: () => (window.location.href = "/student/notifications"),
    },
    {
      icon: <LogOut size={18} />,
      label: "Logout",
      onClick: () => {
        localStorage.removeItem("token");
        window.location.href = "/login";
      },
    },
  ];

  /* =========================
     LAYOUT
  ========================= */

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ===== FIXED SIDEBAR ===== */}
      <div className="w-72 fixed left-0 top-0 h-full z-20">
        <Sidebar
          menuItems={menuItems}
          userName={student?.name || "Student"}
          userEmail={student?.email || ""}
        />
      </div>

      {/* ===== SCROLLABLE CONTENT ===== */}
      <div className="flex-1 ml-72 overflow-y-auto bg-[#F8FAFC]">
        <Outlet />
      </div>
    </div>
  );
}