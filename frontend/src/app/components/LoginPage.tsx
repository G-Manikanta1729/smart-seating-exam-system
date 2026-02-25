import React, { useState } from "react";
import { GraduationCap, Eye, EyeOff } from "lucide-react";
import { Input } from "./Input";
import { Button } from "./Button";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";

interface LoginResponse {
  token: string;
  role: "ADMIN" | "FACULTY" | "STUDENT";
  id: number;
  name: string;
  email: string;
}

export function LoginPage() {
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState("admin"); // UI only
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post<LoginResponse>("/auth/login", {
        email,
        password,
      });

      /**
       * EXPECTED BACKEND RESPONSE (flat)
       * {
       *   token,
       *   role,
       *   id,
       *   name,
       *   email
       * }
       */
      const { token, role, id, name, email: userEmail } = res.data;

      if (!token || !role) {
        console.error("Invalid login response:", res.data);
        throw new Error("Invalid login response");
      }

      // BUILD USER OBJECT MANUALLY
      const user = {
        id,
        name,
        email: userEmail,
        role,
      };

      // STORE CORRECTLY
      localStorage.setItem("token", res.data.token);

      localStorage.setItem("user", JSON.stringify({
        role: res.data.role,
        name: res.data.name,
        email: res.data.email
      }));

      // REDIRECT BY ROLE
      if (role === "ADMIN") navigate("/admin");
      else if (role === "FACULTY") navigate("/faculty");
      else if (role === "STUDENT") navigate("/student");
      else navigate("/");

    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#F093FB]">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-3xl mb-4">
            <GraduationCap size={40} className="text-white" />
          </div>
          <h1 className="text-4xl text-white font-bold">Smart Seating</h1>
          <p className="text-white/70">Sign in to continue</p>
        </div>

        <div className="bg-white/95 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">

            {/* ROLE (UI ONLY) */}
            <div className="space-y-3">
              {["admin", "faculty", "student"].map((role) => (
                <label key={role} className="flex items-center gap-3">
                  <input
                    type="radio"
                    value={role}
                    checked={selectedRole === role}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  />
                  <span className="capitalize">{role}</span>
                </label>
              ))}
            </div>

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <Button type="submit" className="w-full">
              Login
            </Button>

            <p className="text-center text-sm text-gray-600 mt-2">
              New User?{" "}
              <button
                type="button"
                className="text-blue-600 underline"
                onClick={() => navigate("/register")}
              >
                Create an account
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}