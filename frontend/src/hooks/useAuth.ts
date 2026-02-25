import { useMemo } from "react";

export function useAuth() {
  const user = useMemo(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser || storedUser === "undefined") return null;
      return JSON.parse(storedUser);
    } catch {
      return null;
    }
  }, []);

  const token = localStorage.getItem("token");

  return {
    user,
    token,
    isAuthenticated: !!token,
    role: user?.role ?? null,
    name: user?.name ?? "Faculty",
    email: user?.email ?? "",
  };
}