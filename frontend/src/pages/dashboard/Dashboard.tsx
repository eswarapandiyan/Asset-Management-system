import React, { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import {
  MonitorIcon,
  UsersIcon,
  TicketIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  ClockIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const {
    assets,
    tickets,
    users,
    employees, // add this
    loadAssets,
    loadUsers,
    loadEmployees, // add this
    loadTickets,
  } = useData();
  const navigate = useNavigate();

  // Load data when component mounts
  useEffect(() => {
    loadAssets(); // fetch all assets, no company filter
    // loadUsers(user?.company); // keep users filtered by company
    // loadTickets(user?.company); // keep tickets filtered by company
    loadUsers();
    loadTickets();
    if (user?.role === "admin") {
      loadEmployees(); // load all employees for admin
    }
  }, [
    user?.company,
    user?.role,
    loadAssets,
    loadUsers,
    loadTickets,
    loadEmployees,
  ]);

  // Debug: Log user data
  console.log("Dashboard - Current user:", user);
  console.log("Dashboard - User role:", user?.role);
  // Filter data based on user's company
  // For employees section, use employees (not filtered by company)
  const totalEmployees = employees.length;
  const devCount = employees.filter((e) => e.team === "Dev").length;
  const supportCount = employees.filter((e) => e.team === "Support").length;
  const salesCount = employees.filter((e) => e.team === "Sales").length;
  // Calculate statistics
  const ticketFilter =
    user?.role === "employee"
      ? tickets.filter((ticket) => ticket.empId === user.empId)
      : tickets;
  const totalAssets = assets.length;
  const assignedAssets = assets.filter(
    (asset) => asset.status === "Assigned"
  ).length;
  const inStockAssets = assets.filter(
    (asset) => asset.status === "In Stock"
  ).length;
  const underRepairAssets = assets.filter(
    (asset) => asset.status === "Under Repair"
  ).length;
  const openTickets = ticketFilter.filter(
    (ticket) => ticket.status === "Open"
  ).length;
  const inProgressTickets = ticketFilter.filter(
    (ticket) => ticket.status === "In Progress"
  ).length;
  const resolvedTickets = ticketFilter.filter(
    (ticket) => ticket.status === "Resolved"
  ).length;
  // Get assets assigned to current employee
  const userAssets =
    user?.role === "employee"
      ? assets.filter((asset) => asset.assignedTo === user.empId) // or user.empId if that's how it is in your user object
      : [];

  console.log("ticketFilter", ticketFilter);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{user?.company} Dashboard</h1>
      {/* Stats Overview */}
      <div
        className={`grid grid-cols-1 ${
          user?.role === "admin" ? "md:grid-cols-3" : "md:grid-cols-2"
        } gap-6`}
      >
        {user?.role !== "employee" && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-500">
                <MonitorIcon className="h-8 w-8" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-700">Assets</h3>
                <p className="text-3xl font-bold">{totalAssets}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
              <div className="text-center p-2 bg-gray-50 rounded">
                <p className="font-medium">Assigned</p>
                <p className="font-bold text-blue-500">{assignedAssets}</p>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <p className="font-medium">In Stock</p>
                <p className="font-bold text-green-500">{inStockAssets}</p>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <p className="font-medium">Repair</p>
                <p className="font-bold text-yellow-500">{underRepairAssets}</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/assets")}
              className="mt-4 w-full py-2 text-sm text-blue-600 hover:text-blue-800"
            >
              View all assets →
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-500">
              <TicketIcon className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-700">Tickets</h3>
              <p className="text-3xl font-bold">{ticketFilter.length}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
            <div className="text-center p-2 bg-gray-50 rounded">
              <p className="font-medium">Open</p>
              <p className="font-bold text-red-500">{openTickets}</p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <p className="font-medium">In Progress</p>
              <p className="font-bold text-yellow-500">{inProgressTickets}</p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <p className="font-medium">Resolved</p>
              <p className="font-bold text-green-500">{resolvedTickets}</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/tickets")}
            className="mt-4 w-full py-2 text-sm text-green-600 hover:text-green-800"
          >
            View all tickets →
          </button>
        </div>
        {user?.role === "admin" ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-500">
                <UsersIcon className="h-8 w-8" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-700">
                  Employees
                </h3>
                <p className="text-3xl font-bold">{totalEmployees}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
              <div className="text-center p-2 bg-gray-50 rounded">
                <p className="font-medium">Dev</p>
                <p className="font-bold text-purple-500">{devCount}</p>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <p className="font-medium">Support</p>
                <p className="font-bold text-purple-500">{supportCount}</p>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <p className="font-medium">Sales</p>
                <p className="font-bold text-purple-500">{salesCount}</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/employees")}
              className="mt-4 w-full py-2 text-sm text-purple-600 hover:text-purple-800"
            >
              Manage employees →
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-indigo-100 text-indigo-500">
                <MonitorIcon className="h-8 w-8" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-700">
                  My Assets
                </h3>
                <p className="text-3xl font-bold">{userAssets.length}</p>
              </div>
            </div>
            <div className="mt-4">
              {userAssets.length > 0 ? (
                <ul className="space-y-2">
                  {userAssets.slice(0, 2).map((asset) => (
                    <li
                      key={asset.id}
                      className="p-2 bg-gray-50 rounded text-sm"
                    >
                      <p className="font-medium">{asset.name}</p>
                      <p className="text-gray-500">TAG: {asset.tagNo}</p>
                    </li>
                  ))}
                  {userAssets.length > 2 && (
                    <p className="text-sm text-gray-500 text-center">
                      +{userAssets.length - 2} more assets
                    </p>
                  )}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No assets assigned to you
                </p>
              )}
            </div>
            <button
              onClick={() => navigate("/tickets")}
              className="mt-4 w-full py-2 text-sm text-indigo-600 hover:text-indigo-800"
            >
              Raise a ticket →
            </button>
          </div>
        )}
      </div>
      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Tickets</h2>
        {ticketFilter.length > 0 ? (
          <div className="space-y-4">
            {ticketFilter.slice(0, 5).map((ticket) => {
              const asset = assets.find(
                (a) => a.serialNumber === ticket.serialNo
              );
              const ticketUser = users.find((u) => u.empId === ticket.empId);
              let statusIcon;
              let statusColor;
              if (ticket.status === "Open") {
                statusIcon = (
                  <AlertCircleIcon className="h-5 w-5 text-red-500" />
                );
                statusColor = "text-red-500";
              } else if (ticket.status === "In Progress") {
                statusIcon = <ClockIcon className="h-5 w-5 text-yellow-500" />;
                statusColor = "text-yellow-500";
              } else {
                statusIcon = (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                );
                statusColor = "text-green-500";
              }
              return (
                <div
                  key={ticket.id}
                  className="flex items-start p-4 border rounded-lg"
                >
                  <div className="flex-shrink-0 mr-3">{statusIcon}</div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h4 className="font-medium">
                        {asset?.name || "Unknown Asset"}
                      </h4>
                      <span className={`text-sm font-medium ${statusColor}`}>
                        {ticket.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {ticket.description}
                    </p>
                    <div className="mt-2 text-xs text-gray-500 flex justify-between">
                      <span>
                        Reported by: {ticketUser?.empId || "Unknown User"}
                      </span>
                      <span>
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No tickets found</p>
        )}
        {tickets.length > 5 && (
          <button
            onClick={() => navigate("/tickets")}
            className="mt-4 w-full py-2 text-sm text-blue-600 hover:text-blue-800"
          >
            View all tickets →
          </button>
        )}
      </div>
    </div>
  );
};
export default Dashboard;
