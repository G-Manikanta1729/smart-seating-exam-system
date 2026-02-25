import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  role: "ADMIN" | "STUDENT" | "FACULTY";
  exp: number;
}

export const getUserRole = (): DecodedToken["role"] | null => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const decoded = jwtDecode<DecodedToken>(token);
    return decoded.role;
  } catch {
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    const decoded = jwtDecode<DecodedToken>(token);

    // ⏰ exp is in seconds, Date.now() is ms
    if (decoded.exp * 1000 < Date.now()) {
      logout();
      return false;
    }

    return true;
  } catch {
    logout();
    return false;
  }
};

export const logout = () => {
  localStorage.removeItem("token");
};
