import React, { useState } from "react";
import { GraduationCap, Eye, EyeOff } from "lucide-react";
import { Input } from "./Input";
import { Button } from "./Button";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";

type Role = "ADMIN" | "FACULTY" | "STUDENT";

export function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>("STUDENT");
  const [rollNumber, setRollNumber] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Basic role-based validation
      if (role === "STUDENT") {
        if (!rollNumber || !branch || !year) {
          setError("Roll number, branch and year are required for students.");
          setLoading(false);
          return;
        }
      }

      await api.post("/auth/register", {
        name,
        email,
        password,
        role,
        roll_number: role === "STUDENT" ? rollNumber : null,
        branch: role === "STUDENT" || role === "FACULTY" ? branch || null : null,
        year: role === "STUDENT" ? year || null : null,
      });

      alert("Registration successful. You can now log in.");
      navigate("/");
    } catch (err: any) {
      console.error("Register error:", err);
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const roleLabel =
    role === "ADMIN" ? "Admin" : role === "FACULTY" ? "Faculty" : "Student";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#F093FB]">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-3xl mb-4">
            <GraduationCap size={40} className="text-white" />
          </div>
          <h1 className="text-4xl text-white font-bold">Smart Seating</h1>
          <p className="text-white/70">{roleLabel} Registration</p>
        </div>

        <div className="bg-white/95 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Role selection */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Register as</p>
              <div className="flex items-center justify-between">
                {(["ADMIN", "FACULTY", "STUDENT"] as Role[]).map((r) => (
                  <label key={r} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      value={r}
                      checked={role === r}
                      onChange={() => setRole(r)}
                    />
                    <span className="capitalize">
                      {r.toLowerCase()}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <Input
              label="Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

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

            {(role === "STUDENT" || role === "FACULTY") && (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Branch
    </label>

    <select
      value={branch}
      onChange={(e) => setBranch(e.target.value)}
      required
      className="w-full border border-gray-300 rounded-lg px-4 py-2 
                 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
  </div>
)}

            {role === "STUDENT" && (
              <>
                <Input
                  label="Roll Number"
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  required
                />

                <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Year
  </label>

  <select
    value={year}
    onChange={(e) => setYear(e.target.value)}
    required
    className="w-full border border-gray-300 rounded-lg px-4 py-2 
               focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="">Select Year</option>
    <option value="1st Year">1st Year</option>
    <option value="2nd Year">2nd Year</option>
    <option value="3rd Year">3rd Year</option>
    <option value="4th Year">4th Year</option>
  </select>
</div>
              </>
            )}

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </Button>

            <p className="text-center text-sm text-gray-600 mt-2">
              Already have an account?{" "}
              <button
                type="button"
                className="text-blue-600 underline"
                onClick={() => navigate("/")}
              >
                Login
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}