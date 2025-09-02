import React, { useState, createContext, useContext, useCallback } from "react";
import { Team } from "./AuthContext";
import { toast } from "sonner";
import { apiRequest } from "../helper/api";
// Asset Types
export interface Asset {
  id: string;
  name: string;
  tagNo: string;
  // company: Company;
  team?: Team;
  mobileNumber?: string;
  os?: string;
  model?: string;
  ram?: string;
  drive?: string;
  serialNumber?: string;
  condition?: string;
  status: "Assigned" | "In Stock" | "Under Repair";
  purchaseDate?: string;
  peripherals?: string[];
  assignedTo?: string;
  assigned_user_id?: string;
}
// User Types
export interface TeamMember {
  id: string;
  username: string;
  empId: string;
  email: string;
  password: string;
  // company: Company;
  role: "admin" | "employee";
  team: Team;
}
// Ticket Types
export interface Ticket {
  id: string;
  serialNo: string;
  empId: string;
  description: string;
  createdAt: string;
  status: "Open" | "In Progress" | "Resolved";
  // company: Company;
}
interface DataContextType {
  assets: Asset[];
  users: TeamMember[];
  employees: TeamMember[]; // add this
  tickets: Ticket[];
  loading: boolean;
  // loadAssets: (company?: string) => Promise<void>;
  // loadUsers: (company?: string) => Promise<void>;
  loadAssets: () => Promise<void>;
  loadUsers: () => Promise<void>;
  loadEmployees: () => Promise<void>; // add this
  // loadTickets: (company?: string) => Promise<void>;
  loadTickets: () => Promise<void>;
  addAsset: (asset: Omit<Asset, "id">) => Promise<void>;
  updateAsset: (id: string, asset: Partial<Asset>) => Promise<void>;
  addUser: (user: Omit<TeamMember, "id">) => Promise<void>;
  setUsers: (users: TeamMember[]) => void;
  addTicket: (ticket: Omit<Ticket, "id" | "createdAt">) => Promise<void>;
  updateTicketStatus: (id: string, status: Ticket["status"]) => Promise<void>;
}
// Initialize with empty arrays - data will be loaded from backend
const DataContext = createContext<DataContextType | undefined>(undefined);
export const DataProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [users, setUsers] = useState<TeamMember[]>([]);
  const [employees, setEmployees] = useState<TeamMember[]>([]); // add this
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);

  // Load data from backend
  const loadAssets = useCallback(async () => {
    try {
      setLoading(true);
      // const url = 'http://localhost:5050/api/assets'; // Always fetch all assets
      // const response = await fetch(url);
      // const data = await response.json();
      const data = await apiRequest("/api/assets", { method: "GET" });
      if (data.success) {
        setAssets(data.assets);
      }
    } catch (error) {
      console.error("Error loading assets:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      // const url = company ? `http://localhost:5050/api/users?company=${company}` : 'http://localhost:5050/api/users';
      const url = "http://localhost:5050/api/users";
      const response = await fetch(url);
      const data = await response.json();
      console.log("load users", data);
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5050/api/employees`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setEmployees(data.employees);
      }
    } catch (error) {
      console.error("Error loading employees:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      // Note: You'll need to implement tickets API endpoint in backend
      const url = "http://localhost:5050/api/tickets";
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setTickets(data.tickets);
      }
    } catch (error) {
      console.error("Error loading tickets:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addAsset = async (asset: Omit<Asset, "id">) => {
    try {
      // const response = await fetch("http://localhost:5050/api/assets", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(asset),
      // });
      // const data = await response.json();
      const data = await apiRequest("/api/assets", {
        method: "POST",
        body: asset,
      });
      if (data.success) {
        await loadAssets();
      }
    } catch (error) {
      console.error("Error adding asset:", error);
    }
  };

  const updateAsset = async (id: string, updatedAsset: Partial<Asset>) => {
    try {
      const response = await fetch(`http://localhost:5050/api/assets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedAsset),
      });
      const data = await response.json();
      if (data.success) {
        await loadAssets();
      }
    } catch (error) {
      console.error("Error updating asset:", error);
    }
  };

  const addUser = async (user: Omit<TeamMember, "id">) => {
    try {
      const response = await fetch("http://localhost:5050/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      const data = await response.json();
      if (data.success) {
        // await loadUsers(user.company);
        await loadUsers();
      }
    } catch (error) {
      console.error("Error adding user:", error);
    }
  };

  const setUsersDirect = (newUsers: TeamMember[]) => {
    setUsers(newUsers);
  };

  const addTicket = async (ticket: Omit<Ticket, "id" | "createdAt">) => {
    try {
      // Extract needed fields
      const asset = assets.find((a) => a.serialNumber === ticket.serialNo);
      const user = users.find((u) => u.id === ticket.empId);

      console.log("Asset--->", asset);
      console.log("user---->", user);
      if (!asset || !user) {
        console.error("Asset or User not found");
        return;
      }

      // Prepare backend payload with expected keys
      const payload = {
        empId: user.empId,
        serialNo: asset.serialNumber || "",
        issue_description: ticket.description,
        status: ticket.status || "Open",
      };

      const response = await fetch("http://localhost:5050/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Ticket submitted successfully");
        await loadTickets();
      } else {
        console.error("Failed to add ticket:", data.message);
      }
    } catch (error) {
      console.error("Error adding ticket:", error);
    }
  };

  const updateTicketStatus = async (id: string, status: Ticket["status"]) => {
    try {
      // Note: You'll need to implement tickets API endpoint in backend
      const response = await fetch(`http://localhost:5050/api/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (data.success) {
        await loadTickets();
      }
    } catch (error) {
      console.error("Error updating ticket status:", error);
    }
  };

  return (
    <DataContext.Provider
      value={{
        assets,
        users,
        employees, // add this
        tickets,
        loading,
        loadAssets,
        loadUsers,
        loadEmployees, // add this
        loadTickets,
        addAsset,
        updateAsset,
        addUser,
        setUsers: setUsersDirect,
        addTicket,
        updateTicketStatus,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
