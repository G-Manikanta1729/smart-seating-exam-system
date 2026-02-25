import React from 'react';
import {
  LayoutDashboard,
  Users,
  DoorOpen,
  FileText,
  LayoutGrid,
  UserCheck,
  BarChart3,
  LogOut
} from 'lucide-react';

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

interface SidebarProps {
  menuItems: MenuItem[];
  userName?: string;
  userEmail?: string;
}

export function Sidebar({ menuItems, userName = "User", userEmail = "user@example.com" }: SidebarProps) {
  // Get initials from user name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 1);
  };

  return (
    <div className="w-72 h-screen bg-white border-r border-[#E2E8F0] flex flex-col shadow-xl">
      <div className="p-6 border-b border-[#E2E8F0] bg-gradient-to-br from-[#667eea] to-[#764ba2]">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <LayoutGrid size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl text-white font-bold">Smart Seating</h1>
            <p className="text-sm text-white/80">Arrangement System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.filter(item => item.label !== "Logout").map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 font-medium ${item.active
                ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg transform scale-105'
                : 'text-[#718096] hover:bg-gradient-to-r hover:from-[#F7FAFC] hover:to-[#EDF2F7] hover:text-[#667eea] hover:scale-102'
              }`}
          >
            <span className={item.active ? 'transform scale-110' : ''}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-[#E2E8F0] space-y-3 bg-gradient-to-br from-[#F7FAFC] to-white">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white shadow-md">
          <div className="w-10 h-10 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-full flex items-center justify-center text-white font-bold">
            {getInitials(userName)}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-[#2D3748]">{userName}</p>
            <p className="text-xs text-[#718096]">{userEmail}</p>
          </div>
        </div>

        {menuItems.find(item => item.label === "Logout") && (
          <button
            onClick={menuItems.find(item => item.label === "Logout")?.onClick}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 font-medium text-[#718096] hover:bg-gradient-to-r hover:from-[#F7FAFC] hover:to-[#EDF2F7] hover:text-[#667eea] hover:scale-102"
          >
            <span>{menuItems.find(item => item.label === "Logout")?.icon}</span>
            <span>Logout</span>
          </button>
        )}
      </div>
    </div>
  );
}
