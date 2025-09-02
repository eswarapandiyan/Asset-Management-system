import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import {
  PlusIcon,
  SearchIcon,
  FilterIcon,
  EyeOffIcon,
  EyeIcon,
  Trash2,
  Edit,
} from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "../../helper/api";
const Employees: React.FC = () => {
  const { user } = useAuth();
  const { users, setUsers } = useData();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [teamFilter, setTeamFilter] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const hasFetched = React.useRef(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Load users from database on component mount
  useEffect(() => {
    // Guard against multiple calls in React 18 dev mode
    // const hasFetched = React.useRef(false);
    let isMounted = true;

    const loadUsers = async () => {
      console.log("Fetching employees...");
      try {
        setLoading(true);
        // const response = await fetch(`http://localhost:5050/api/employees`,{
        //                     method: "GET",
        //                     headers: {
        //                       "Authorization": `Bearer ${localStorage.getItem("token")}`
        //                     }
        //                   });
        const data = await apiRequest("/api/employees", { method: "GET" });
        console.log("data", data);
        if (data.success && isMounted) {
          setUsers(data.employees);
        }
      } catch (error) {
        console.error("Error loading employees:", error);
        toast.error("Failed to load employees from database");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (user?.company && !hasFetched.current) {
      hasFetched.current = true;
      loadUsers();
    }

    return () => {
      isMounted = false;
    };
  }, [user?.company, setUsers]);

  // Form state
  const [formData, setFormData] = useState({
    username: "",
    empId: "",
    email: "",
    password: "",
    company: user?.company || "MTPL",
    role: "employee", // Always set to employee since we're adding to employee table
    team: "",
  });
  // Redirect non-admin users
  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 className="text-xl font-semibold text-gray-700">Access Denied</h2>
        <p className="mt-2 text-gray-500">
          Only administrators can access this page.
        </p>
      </div>
    );
  }
  // Remove company filter, just apply search and team filters to all users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      search === "" ||
      u.empId.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase());
    const matchesTeam = teamFilter === "" || u.team === teamFilter;
    return matchesSearch && matchesTeam;
  });
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Action handlers
  // const handleDelete = async (employee: any) => {
  //   if (window.confirm(`Are you sure you want to delete ${employee.username}?`)) {
  //     try {
  //       const response = await fetch(`http://localhost:5050/api/employees/${employee.id}`, {
  //         method: 'DELETE',
  //       });

  //       if (response.ok) {
  //         toast.success('Employee deleted successfully');
  //         // Refresh the employee list
  //         const loadUsers = async () => {
  //           try {
  //             const response = await fetch(`http://localhost:5050/api/employees`);
  //             const data = await response.json();
  //             if (data.success) {
  //               setUsers(data.employees);
  //             }
  //           } catch (error) {
  //             console.error('Error loading employees:', error);
  //           }
  //         };
  //         loadUsers();
  //       } else {
  //         toast.error('Failed to delete employee');
  //       }
  //     } catch (error) {
  //       console.error('Error deleting employee:', error);
  //       toast.error('Failed to delete employee');
  //     }
  //   }
  // };

  const handleDelete = async (employeeId: string) => {
    try {
      const res = await fetch(
        `http://localhost:5050/api/employees/${employeeId}`,
        {
          method: "DELETE",
        }
      );
      if (res.ok) {
        toast.success("Employee deleted successfully");
        // Refresh the employee list
        const loadUsers = async () => {
          try {
            const data = await apiRequest("/api/employees", { method: "GET" });
            if (data.success) {
              setUsers(data.employees);
            }
          } catch (error) {
            console.error("Error loading employees:", error);
          }
        };
        loadUsers();
      } else {
        toast.error("Failed to delete employee");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting employee");
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const handleUpdate = (employee: any) => {
    setIsEditMode(true);
    setEditingEmployee(employee);
    setFormData({
      username: employee.username,
      empId: employee.empId,
      email: employee.email,
      password: "", // Password is not editable in this form
      company: employee.company,
      role: employee.role,
      team: employee.team,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = isEditMode
        ? `http://localhost:5050/api/employees/${editingEmployee.id}`
        : "http://localhost:5050/api/users";

      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          empId: formData.empId,
          email: formData.email,
          password: formData.password,
          company: formData.company,
          role: formData.role,
          team: formData.team,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          isEditMode
            ? "Employee updated successfully"
            : "Employee added successfully"
        );
        // Reset form
        setFormData({
          username: "",
          empId: "",
          email: "",
          password: "",
          company: user?.company || "MTPL",
          role: "employee", // Always set to employee
          team: "",
        });
        setShowForm(false);
        setIsEditMode(false);
        setEditingEmployee(null);

        // Refresh the employee list
        const loadUsers = async () => {
          try {
            const response = await fetch(
              `http://localhost:5050/api/employees`,
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
              }
            );
            const data = await response.json();
            if (data.success) {
              setUsers(data.employees);
            }
          } catch (error) {
            console.error("Error loading employees:", error);
          }
        };
        loadUsers();
      } else {
        toast.error(
          data.message ||
            (isEditMode
              ? "Failed to update employee"
              : "Failed to add employee")
        );
      }
    } catch (error) {
      console.error("Error saving employee:", error);
      toast.error("Failed to save employee. Please try again.");
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Employee</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (!showForm) {
              setIsEditMode(false);
              setEditingEmployee(null);
              setFormData({
                username: "",
                empId: "",
                email: "",
                password: "",
                company: user?.company || "MTPL",
                role: "employee",
                team: "",
              });
            }
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-1" />
          {showForm ? "Cancel" : "Add Employee"}
        </button>
      </div>
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            {isEditMode ? "Edit Employee" : "Add New Employee"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username*
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee ID*
                </label>
                <input
                  type="text"
                  name="empId"
                  value={formData.empId}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email*
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password*
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border rounded-md pr-10"
                />
                <span
                  className="absolute right-3 top-9 cursor-pointer text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company*
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <input
                  type="text"
                  name="role"
                  value="Employee"
                  disabled
                  className="w-full p-2 border rounded-md bg-gray-100"
                />
                <input type="hidden" name="role" value="employee" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team*
                </label>
                <select
                  name="team"
                  value={formData.team}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select Team</option>
                  <option value="Dev">Dev</option>
                  <option value="Support">Support</option>
                  <option value="Sales">Sales</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setIsEditMode(false);
                  setEditingEmployee(null);
                  setFormData({
                    username: "",
                    empId: "",
                    email: "",
                    password: "",
                    company: user?.company || "MTPL",
                    role: "employee",
                    team: "",
                  });
                }}
                className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                {isEditMode ? "Update Employee" : "Add Employee"}
              </button>
            </div>
          </form>
        </div>
      )}
      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by username, name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 p-2 border rounded-md w-full"
            />
          </div>
          <div className="flex items-center space-x-2">
            <FilterIcon className="h-5 w-5 text-gray-400" />
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="p-2 border rounded-md"
            >
              <option value="">All Teams</option>
              <option value="Dev">Dev</option>
              <option value="Support">Support</option>
              <option value="Sales">Sales</option>
            </select>
          </div>
        </div>
      </div>
      {/* Users List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Username
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Team
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Loading employees...
                </td>
              </tr>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {user.username}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {user.empId}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === "admin"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.team === "Dev"
                          ? "bg-purple-100 text-purple-800"
                          : user.team === "Support"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {user.team}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleUpdate(user)}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {confirmDeleteId && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
              <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
              <p className="mb-6">
                Are you sure you want to delete this employee?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDeleteId)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default Employees;
