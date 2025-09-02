import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    // username: "",
    email: "",
    password: "",
    role: "",
    company: "",
    team: "", // Added team to form state
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Reset team if role changes away from employee
    if (name === "role" && value !== "employee") {
      setForm((prev) => ({ ...prev, team: "" }));
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log("Sending form data:", form); // Debug: Log what we're sending
      const response = await fetch("http://localhost:5050/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });

      const data = await response.json();
      console.log("Response:", data); // Debug: Log backend response
      if (data.success) {
        // Use the user data from backend response
        const user = data.user;
        const userRole = user.role;
        const userCompany = user.company;
        const userTeam = user.team;
        const userId = user.id;
        const empId = user.empId;
        const email = user.email;
        // Map username to name for frontend compatibility
        const userName = user.username || user.empId || "Unknown User";

        localStorage.setItem("token", data.token);

        const userToken = localStorage.getItem("token");

        console.log("Login with:", {
          userRole,
          userCompany,
          userTeam,
          userId,
          userName,
          empId,
          email,
          userToken,
        }); // Debug

        // Save user info to context
        login(userRole, userCompany, userTeam, userId, userName, empId);
        navigate("/dashboard");
      } else {
        // alert(data.message || 'Invalid credentials');
        setError(data.message || "Invalid credentilas");
      }
    } catch (error) {
      console.error("Login Error:", error);
      // alert('Server error');
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url('/login_bg.jpg')` }}
    >
      <div className="bg-white/70 backdrop-blur-md p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            IT Asset Management
          </h1>
          <p className="mt-2 text-gray-600">
            Login to manage assets and tickets
          </p>
        </div>
        {error && (
          <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 border border-red-400 rounded">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded-md pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded-md"
            >
              <option value="">Select Role</option>
              <option value="admin">Admin</option>
              <option value="employee">Employee</option>
            </select>
          </div>
          {/* Team dropdown, only show if role is employee */}
          {form.role === "employee" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Teams
              </label>
              <select
                name="team"
                value={form.team}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded-md"
              >
                <option value="">Select Team</option>
                <option value="Dev">Dev</option>
                <option value="Support">Support</option>
                <option value="Sales">Sales</option>
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company
            </label>
            <select
              name="company"
              value={form.company}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded-md"
            >
              <option value="">Select Company</option>
              <option value="MTPL">MTPL</option>
              <option value="NTPL">NTPL</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full px-4 py-2 rounded-md text-white flex justify-center items-center ${
              loading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {loading ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
            ) : (
              "Login"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
export default Login;
