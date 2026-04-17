
import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import ResourceAllocation from './components/ResourceAllocation';
import ChatScreen from './components/ChatScreen';

import SplashScreen from './pages/SplashScreen';
import SignUp from './pages/auth/SignUp';
import SignIn from './pages/auth/SignIn';
import AddMembers from './pages/onboarding/AddMembers';
import DashboardLayout from './pages/dashboard/DashboardLayout';
import Overview from './pages/dashboard/Overview';
import EmployeeList from './pages/dashboard/EmployeeList';
import EmployeeProfile from './pages/dashboard/EmployeeProfile';
import ProjectList from './pages/dashboard/ProjectList';
import CreateProject from './pages/dashboard/CreateProject';
import Settings from './pages/dashboard/Settings';
import AllocationReports from './pages/dashboard/AllocationReports';
import OrganizationPage from './pages/dashboard/Organization';
import TeamsList from './pages/dashboard/TeamsList';

import { AuthProvider, useAuth } from './context/AuthContext';

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  return isAuthenticated ? <Outlet /> : <Navigate to="/signin" />;
}

function AppContent() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/signup" element={<SignUp />} />
      <Route path="/signin" element={<SignIn />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding/add-members" element={<AddMembers />} />

        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Overview />} />
          <Route path="employees" element={<EmployeeList />} />
          <Route path="projects" element={<ProjectList />} />
          <Route path="projects/create" element={<CreateProject />} />
          <Route path="employees" element={<EmployeeList />} />
          <Route path="employees/:employeeId" element={<EmployeeProfile />} />
          <Route path="allocation" element={<ResourceAllocation />} />
          <Route path="ai-reports" element={<AllocationReports />} />
          <Route path="ai-reports/:reportId" element={<AllocationReports />} />
          <Route path="organization" element={<OrganizationPage />} />
          <Route path="teams" element={<TeamsList />} />
          <Route path="chat" element={<div className="h-full bg-gray-100 p-8 flex items-center justify-center"><ChatScreen /></div>} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>

      {/* Redirect root to dashboard or signin */}
      <Route path="/" element={<SplashScreen />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
