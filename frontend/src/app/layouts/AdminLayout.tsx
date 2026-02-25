import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  DoorOpen,
  FileText,
  LayoutGrid,
  UserCheck,
  BarChart3,
  LogOut,
} from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { logout } from "../../utils/auth";
import { useAuth } from "../../hooks/useAuth";

export const AdminLayout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState("dashboard");

  const menuItems = [
    {
      icon: <LayoutDashboard size={20} />,
      label: "Dashboard",
      active: currentPage === "dashboard",
      onClick: () => {
        setCurrentPage("dashboard");
        navigate("/admin");
      },
    },
    {
      icon: <Users size={20} />,
      label: "Students",
      active: currentPage === "students",
      onClick: () => {
        setCurrentPage("students");
        navigate("/admin/students");
      },
    },
    {
      icon: <UserCheck size={20} />,
      label: "Faculty",
      active: currentPage === "faculty-manage",
      onClick: () => {
        setCurrentPage("faculty-manage");
        navigate("/admin/manage-faculty");
      },
    },
    {
      icon: <DoorOpen size={20} />,
      label: "Rooms",
      active: currentPage === "rooms",
      onClick: () => {
        setCurrentPage("rooms");
        navigate("/admin/rooms");
      },
    },
    {
      icon: <FileText size={20} />,
      label: "Exams",
      active: currentPage === "exams",
      onClick: () => {
        setCurrentPage("exams");
        navigate("/admin/exams");
      },
    },
    {
      icon: <LayoutGrid size={20} />,
      label: "Seating",
      active: currentPage === "seating",
      onClick: () => {
        setCurrentPage("seating");
        navigate("/admin/seating");
      },
    },
    {
      icon: <UserCheck size={20} />,
      label: "Faculty Allocation",
      active: currentPage === "faculty",
      onClick: () => {
        setCurrentPage("faculty");
        navigate("/admin/faculty");
      },
    },
    {
      icon: <LayoutGrid size={20} />,
      label: "Semester Seating",
      active: currentPage === "semester-seating",
      onClick: () => {
        setCurrentPage("semester-seating");
        navigate("/admin/semester-seating");
      },
    },
    {
      icon: <BarChart3 size={20} />,
      label: "Reports",
      active: currentPage === "reports",
      onClick: () => {
        setCurrentPage("reports");
        navigate("/admin/reports");
      },
    },
    {
      icon: <LogOut size={20} />,
      label: "Logout",
      onClick: () => {
        logout();
        navigate("/");
      },
    },
  ];

  return (
    <div className="flex h-screen">
      <Sidebar
        menuItems={menuItems}
        userName={user?.name || "User"}
        userEmail={user?.email || "user@example.com"}
      />
      <main className="flex-1 overflow-y-auto bg-[#F7FAFC] p-8">
        <Outlet />
      </main>
    </div>
  );
};
