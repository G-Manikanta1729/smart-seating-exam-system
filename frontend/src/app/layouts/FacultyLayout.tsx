import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export function FacultyLayout() {
  const { name, email } = useAuth();
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-[#6D5BD0] to-[#4C3FCF] text-white flex flex-col">
        <div className="p-6 text-xl font-semibold">
          Smart Seating
          <div className="text-xs opacity-80">Arrangement System</div>
        </div>

        <nav className="space-y-2 px-4 flex-1">
          <NavLink
            to="/faculty"
            end
            className={({ isActive }) =>
              `block px-4 py-2 rounded-lg ${isActive ? "bg-white/20" : "hover:bg-white/10"
              }`
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/faculty/attendance"
            className="block px-4 py-2 rounded-lg hover:bg-white/10"
          >
            Mark Attendance
          </NavLink>

          <NavLink
            to="/"
            className="block px-4 py-2 rounded-lg hover:bg-white/10"
          >
            Logout
          </NavLink>
        </nav>

        {/* Faculty Card (BOTTOM like Figma) */}
        <div className="p-4 border-t border-white/20" mt-auto>
          <div className="flex items-center gap-3 bg-white/20 rounded-lg p-3">

            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-white text-[#4C3FCF] 
                    flex items-center justify-center font-bold">
              {name?.charAt(0).toUpperCase()}
            </div>

            {/* Faculty Info */}
            <div className="leading-tight">
              <p className="text-sm font-semibold">{name}</p>
              <p className="text-xs opacity-80">{email}</p>
            </div>

          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}