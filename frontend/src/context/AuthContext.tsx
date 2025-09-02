import React, { useEffect, useState, createContext, useContext } from "react";
export type UserRole = "admin" | "employee";
export type Company = "MTPL" | "NTPL";
export type Team = "Dev" | "Support" | "Sales";
export interface User {
  id: string;
  name: string;
  role: UserRole;
  company: Company;
  team?: Team;
  empId?: string;
}
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    role: UserRole,
    company: Company,
    team?: Team,
    userId?: string,
    userName?: string,
    empId?: string
  ) => void;
  logout: () => void;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // Check for saved user in localStorage
    const savedUser = localStorage.getItem("itam_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);
  const login = (
    role: UserRole,
    company: Company,
    team?: Team,
    userId?: string,
    userName?: string,
    empId?: string
  ) => {
    console.log("AuthContext login called with:", {
      role,
      company,
      team,
      userId,
      userName,
      empId,
    }); // Debug
    const newUser: User = {
      id: userId || "admin-user",
      name: userName || (userId ? `User ${userId}` : "Admin"),
      role,
      company,
      team,
      empId,
    };
    console.log("Created user object:", newUser); // Debug
    setUser(newUser);
    localStorage.setItem("itam_user", JSON.stringify(newUser));
  };
  const logout = () => {
    setUser(null);
    localStorage.removeItem("itam_user");
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
