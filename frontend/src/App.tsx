import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Dashboard from './pages/dashboard/Dashboard';
import Assets from './pages/asset/Assets';
import Employees from './pages/employees/Employees';
import Layout from './components/Layout';
import Tickets from './pages/ticket/Tickets';
import ProtectedRoute from './components/ProtectedRoute';
import RoleBasedRoute from './components/RoleBasedRoute';
import Login from './pages/login/Login';
export function App() {
  return (
      <AuthProvider>
        <DataProvider>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute>
                  <Layout />
                </ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="assets" element={<RoleBasedRoute adminOnly={true}>
                  <Assets />
                </RoleBasedRoute>} />
              <Route path="employees" element={<RoleBasedRoute adminOnly={true}>
                  <Employees />
                </RoleBasedRoute>} />
              <Route path="tickets" element={<Tickets />} />
            </Route>
          </Routes>
        </DataProvider>
      </AuthProvider>
  );
}