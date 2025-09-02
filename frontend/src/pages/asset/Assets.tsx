import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

import {
  PlusIcon,
  SearchIcon,
  FilterIcon,
  EditIcon,
  TrashIcon,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../helper/api";

interface Employee {
  id: string;
  username: string;
  empId: string;
  email: string;
  company: string;
  role: string;
  team: string;
}

const Assets: React.FC = () => {
  const { user } = useAuth();

  // Utility function to format dates for HTML date input
  const formatDateForInput = (
    dateString: string | null | undefined
  ): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split("T")[0];
      }
    } catch (error) {
      console.error("Error formatting date:", error);
    }
    return "";
  };
  const [assets, setAssets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [teamFilter, setTeamFilter] = useState<string>("");
  const [editingAsset, setEditingAsset] = useState<string | null>(null);
  const predefinedPeripherals = [
    "Mouse",
    "Keyboard",
    "Monitor",
    "Earphones",
    "iPad",
    "Charger",
    "Mobile",
    "External SSD",
  ];
  const [loading, setLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Load assets and employees from database
  useEffect(() => {
    const loadAssets = async () => {
      try {
        // Fetch all assets, no company filter
        setLoading(true);
        // const response = await fetch("http://localhost:5050/api/assets");
        // const data = await response.json();
        const data = await apiRequest("/api/assets", { method: "GET" });
        if (data.success) {
          setLoading(false);
          console.log("Loaded assets:", data.assets);
          setAssets(data.assets);
        }
      } catch (error) {
        console.error("Error loading assets:", error);
        toast.error("Failed to load assets from database");
      } finally {
        setLoading(false);
      }
    };

    const loadEmployees = async () => {
      try {
        // Fetch all employees, no company filter
        const data = await apiRequest("/api/employees", { method: "GET" });

        // const data = await response.json();
        if (data.success) {
          console.log("Loaded employees:", data.employees);
          setEmployees(data.employees);
        }
      } catch (error) {
        console.error("Error loading employees:", error);
        toast.error("Failed to load employees from database");
      }
    };

    if (user?.company) {
      loadAssets();
      loadEmployees();
    }
  }, [user?.company]);

  useEffect(() => {
    if (confirmDeleteId) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [confirmDeleteId]);

  // Form state
  type AssetFormData = {
    name: string;
    tagNo: string;
    company: string;
    team: string;
    mobileNumber: string;
    os: string;
    model: string;
    ram: string;
    drive: string;
    serialNumber: string;
    condition: string;
    status: string;
    purchaseDate: string;
    peripherals: string[];
    assignedTo: string;
  };
  const [formData, setFormData] = useState<AssetFormData>({
    name: "",
    tagNo: "",
    company: user?.company || "MTPL",
    team: "",
    mobileNumber: "",
    os: "",
    model: "",
    ram: "",
    drive: "",
    serialNumber: "",
    condition: "",
    status: "In Stock",
    purchaseDate: "",
    peripherals: [],
    assignedTo: "",
  });

  // Filter assets based on user's company
  const companyAssets = assets; // Show all assets, regardless of company

  // Apply search and filters
  const filteredAssets = companyAssets.filter((asset) => {
    const matchesSearch =
      search === "" ||
      asset.name.toLowerCase().includes(search.toLowerCase()) ||
      asset.tagNo.toLowerCase().includes(search.toLowerCase()) ||
      asset.serial_number?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "" || asset.status === statusFilter;
    const matchesTeam = teamFilter === "" || asset.team === teamFilter;
    return matchesSearch && matchesStatus && matchesTeam;
  });

  // Company employees for assignment
  const companyEmployees = employees;

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // Allow assigning employees across companies (no override of company field)
    if (name === "assignedTo") {
      // Find the selected employee
      const selectedEmployee = employees.find((emp) => emp.empId === value);
      setFormData((prev) => ({
        ...prev,
        assignedTo: value,
        // If an employee is selected, update the company to match theirs
        company: selectedEmployee ? selectedEmployee.company : prev.company,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form data", formData);
    // Ensure date is in correct format
    const submitData = {
      ...formData,
      peripherals: formData.peripherals.join(", "),
    };
    if (submitData.purchaseDate) {
      try {
        const date = new Date(submitData.purchaseDate);
        if (!isNaN(date.getTime())) {
          submitData.purchaseDate = date.toISOString().split("T")[0];
        }
      } catch (error) {
        console.error("Error formatting date for submission:", error);
      }
    }

    try {
      const url = editingAsset
        ? `http://localhost:5050/api/assets/${editingAsset}`
        : "http://localhost:5050/api/assets";

      const method = editingAsset ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          editingAsset
            ? "Asset updated successfully"
            : "Asset added successfully"
        );
        resetForm();

        // Refresh the assets and employees list
        const loadAssets = async () => {
          try {
            // Fetch all assets, no company filter
            // const response = await fetch("http://localhost:5050/api/assets");
            // const data = await response.json();
            const data = await apiRequest("/api/assets", { method: "GET" });
            if (data.success) {
              setAssets(data.assets);
            }
          } catch (error) {
            console.error("Error loading assets:", error);
          }
        };

        const loadEmployees = async () => {
          try {
            // Fetch all employees, no company filter
            const response = await fetch(
              "http://localhost:5050/api/employees",
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
              }
            );
            const data = await response.json();
            if (data.success) {
              setEmployees(data.employees);
            }
          } catch (error) {
            console.error("Error loading employees:", error);
          }
        };

        loadAssets();
        loadEmployees();
      } else {
        toast.error(data.message || "Failed to save asset");
      }
    } catch (error) {
      console.error("Error saving asset:", error);
      toast.error("Failed to save asset. Please try again.");
    }
  };

  const handleEditAsset = (assetId: string) => {
    const asset = assets.find((a) => a.id === assetId);
    console.log("asset--->", asset);
    if (asset) {
      setFormData({
        name: asset.name,
        tagNo: asset.tagNo,
        company: asset.company,
        team: asset.team || "",
        mobileNumber: asset.mobile_number || "",
        os: asset.os || "",
        model: asset.model || "",
        ram: asset.ram || "",
        drive: asset.drive || "",
        serialNumber: asset.serialNumber || "",
        condition: asset.issue_condition || "",
        status: asset.status,
        purchaseDate: formatDateForInput(asset.dop),
        peripherals: asset.peripherals
          ? asset.peripherals.split(",").map((p: string) => p.trim())
          : [],
        assignedTo: asset.assigned_user_id || "",
      });
      setEditingAsset(assetId);
      setShowForm(true);
    }
  };

  // const handleDeleteAsset = async (assetId: string) => {
  //   if (window.confirm('Are you sure you want to delete this asset?')) {
  //     try {
  //       const response = await fetch(`http://localhost:5050/api/assets/${assetId}`, {
  //         method: 'DELETE',
  //       });

  //       if (response.ok) {
  //         toast.success('Asset deleted successfully');
  //         // Refresh the assets and employees list
  //         const loadAssets = async () => {
  //           try {
  //             // Fetch all assets, no company filter
  //             const response = await fetch('http://localhost:5050/api/assets');
  //             const data = await response.json();
  //             if (data.success) {
  //               setAssets(data.assets);
  //             }
  //           } catch (error) {
  //             console.error('Error loading assets:', error);
  //           }
  //         };

  //         const loadEmployees = async () => {
  //           try {
  //             // Fetch all employees, no company filter
  //             const response = await fetch('http://localhost:5050/api/employees');
  //             const data = await response.json();
  //             if (data.success) {
  //               setEmployees(data.employees);
  //             }
  //           } catch (error) {
  //             console.error('Error loading employees:', error);
  //           }
  //         };

  //         loadAssets();
  //         loadEmployees();
  //       } else {
  //         toast.error('Failed to delete asset');
  //       }
  //     } catch (error) {
  //       console.error('Error deleting asset:', error);
  //       toast.error('Failed to delete asset');
  //     }
  //   }
  // };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;

    try {
      const response = await fetch(
        `http://localhost:5050/api/assets/${confirmDeleteId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast.success("Asset deleted successfully");

        // Refresh assets
        // const assetRes = await fetch("http://localhost:5050/api/assets");
        // const assetData = await assetRes.json();
        const assetData = await apiRequest("/api/assets", { method: "GET" });
        if (assetData.success) setAssets(assetData.assets);

        // Refresh employees
        // const empRes = await fetch("http://localhost:5050/api/employees");
        // const empData = await empRes.json();
        const empData = await apiRequest("/api/employees", { method: "GET" });
        if (empData.success) setEmployees(empData.employees);
      } else {
        toast.error("Failed to delete asset");
      }
    } catch (error) {
      console.error("Error deleting asset:", error);
      toast.error("Failed to delete asset");
    } finally {
      setConfirmDeleteId(null); // Close modal
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      tagNo: "",
      company: user?.company || "MTPL",
      team: "",
      mobileNumber: "",
      os: "",
      model: "",
      ram: "",
      drive: "",
      serialNumber: "",
      condition: "",
      status: "In Stock",
      purchaseDate: "",
      peripherals: [],
      assignedTo: "",
    });
    setEditingAsset(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Asset Management</h1>
        {user?.role === "admin" && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-1" />
            {showForm ? "Cancel" : "Add Asset"}
          </button>
        )}
      </div>
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingAsset ? "Edit Asset" : "Add New Asset"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asset Name*
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  TAG Number*
                </label>
                <input
                  type="text"
                  name="tagNo"
                  value={formData.tagNo}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team
                </label>
                <select
                  name="team"
                  value={formData.team}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select Team</option>
                  <option value="Dev">Dev</option>
                  <option value="Support">Support</option>
                  <option value="Sales">Sales</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number
                </label>
                <input
                  type="text"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Operating System
                </label>
                <select
                  name="os"
                  value={formData.os}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select OS</option>
                  <option value="Windows">Windows</option>
                  <option value="Mac">Mac</option>
                  <option value="Linux">Linux</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RAM
                </label>
                <select
                  name="ram"
                  value={formData.ram}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select RAM</option>
                  <option value="8GB">8GB</option>
                  <option value="32GB">32GB</option>
                  <option value="64GB">64GB</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Drive
                </label>
                <select
                  name="drive"
                  value={formData.drive}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select Drive</option>
                  <option value="128GB SSD">128GB SSD</option>
                  <option value="512GB SSD">512GB SSD</option>
                  <option value="1TB SSD">1TB SSD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Serial Number
                </label>
                <input
                  type="text"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condition
                </label>
                <input
                  type="text"
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status*
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border rounded-md"
                >
                  <option value="Assigned">Assigned</option>
                  <option value="In Stock">In Stock</option>
                  <option value="Under Repair">Under Repair</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Purchase
                </label>
                <input
                  type="date"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              {/* <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Other Peripherals
                </label>
                <textarea name="peripherals" value={formData.peripherals} onChange={handleInputChange} rows={2} className="w-full p-2 border rounded-md" />
              </div> */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Other Peripherals
                </label>

                <div className="flex flex-wrap gap-2 mb-2">
                  {(Array.isArray(formData.peripherals)
                    ? formData.peripherals
                    : typeof formData.peripherals === "string"
                    ? JSON.parse(formData.peripherals)
                    : []
                  ).map((item: string, index: number) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full flex items-center space-x-2"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => {
                            const updatedPeripherals = Array.isArray(
                              prev.peripherals
                            )
                              ? prev.peripherals
                              : typeof prev.peripherals === "string"
                              ? JSON.parse(prev.peripherals)
                              : [];

                            return {
                              ...prev,
                              peripherals: updatedPeripherals.filter(
                                (p: string) => p !== item
                              ),
                            };
                          })
                        }
                        className="ml-1 text-blue-600 hover:text-red-600"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {predefinedPeripherals.map((peripheral) => (
                    <button
                      key={peripheral}
                      type="button"
                      onClick={() => {
                        if (!formData.peripherals.includes(peripheral)) {
                          setFormData((prev) => ({
                            ...prev,
                            peripherals: [...prev.peripherals, peripheral],
                          }));
                        }
                      }}
                      className={`border px-2 py-1 rounded-md text-sm ${
                        formData.peripherals.includes(peripheral)
                          ? "bg-blue-500 text-white"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      {peripheral}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign to Employee
                </label>
                <select
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Not Assigned</option>
                  {companyEmployees.map((employee) => (
                    <option key={employee.id} value={employee.empId}>
                      {employee.username} ({employee.empId} - {employee.team})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                {editingAsset ? "Update Asset" : "Add Asset"}
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
              placeholder="Search by name, tag, or serial number"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 p-2 border rounded-md w-full"
            />
          </div>
          <div className="flex items-center space-x-2">
            <FilterIcon className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 border rounded-md"
            >
              <option value="">All Status</option>
              <option value="Assigned">Assigned</option>
              <option value="In Stock">In Stock</option>
              <option value="Under Repair">Under Repair</option>
            </select>
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
      {/* Assets List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asset
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TAG No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Specs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                {user?.role === "admin" && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Loading assets...
                  </td>
                </tr>
              ) : filteredAssets.length > 0 ? (
                filteredAssets.map((asset) => {
                  // Find the assigned employee by empId
                  const assignedEmployee = employees.find(
                    (emp) => emp.empId === asset.assigned_user_id
                  );
                  return (
                    <tr key={asset.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {asset.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {asset.model}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {asset.tagNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {asset.team || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{asset.os}</div>
                        <div className="text-sm text-gray-500">
                          {asset.ram && asset.drive
                            ? `${asset.ram} / ${asset.drive}`
                            : "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            asset.status === "Assigned"
                              ? "bg-green-100 text-green-800"
                              : asset.status === "In Stock"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {asset.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {assignedEmployee
                          ? `${assignedEmployee.username} (${assignedEmployee.empId})`
                          : "-"}
                      </td>
                      {user?.role === "admin" && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEditAsset(asset.id)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <EditIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(asset.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={user?.role === "admin" ? 7 : 6}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No assets found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {confirmDeleteId && (
          <div className="fixed inset-0 top-0 left-0 w-screen h-screen bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-lg">
              <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
              <p>Are you sure you want to delete this asset?</p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="px-4 py-2 border rounded-md hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
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
export default Assets;
