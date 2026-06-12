import { createHashRouter } from "react-router";
import { MainLayout } from "./components/layouts/MainLayout";
import { AuthLayout } from "./components/layouts/AuthLayout";
import { LoginScreen } from "./components/auth/LoginScreen";
import { RegisterScreen } from "./components/auth/RegisterScreen";
import { VerifyEmailScreen } from "./components/auth/VerifyEmailScreen";
import { PasswordResetScreen } from "./components/auth/PasswordResetScreen";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AdminRoute } from "./components/auth/AdminRoute";
import { Dashboard } from "./components/dashboard/Dashboard";
import { PatientList } from "./components/patients/PatientList";
import { PatientProfile } from "./components/patients/PatientProfile";
import { CreatePatient } from "./components/patients/CreatePatient";
import { AppointmentCalendar } from "./components/appointments/AppointmentCalendar";
import { AppointmentSchedule } from "./components/appointments/AppointmentSchedule";
import { Settings } from "./components/settings/Settings";
import { Finance } from "./components/finance/Finance";
import { AdminPanel } from "./components/admin/AdminPanel";

export const router = createHashRouter([
  {
    path: "/auth",
    Component: AuthLayout,
    children: [
      { path: "login", Component: LoginScreen },
      { path: "register", Component: RegisterScreen },
      { path: "verify-email", Component: VerifyEmailScreen },
      { path: "reset-password", Component: PasswordResetScreen },
    ],
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "patients",
        element: (
          <ProtectedRoute>
            <PatientList />
          </ProtectedRoute>
        ),
      },
      {
        path: "patients/:id",
        element: (
          <ProtectedRoute>
            <PatientProfile />
          </ProtectedRoute>
        ),
      },
      {
        path: "patients/new",
        element: (
          <ProtectedRoute>
            <CreatePatient />
          </ProtectedRoute>
        ),
      },
      {
        path: "appointments",
        element: (
          <ProtectedRoute>
            <AppointmentCalendar />
          </ProtectedRoute>
        ),
      },
      {
        path: "appointments/schedule",
        element: (
          <ProtectedRoute>
            <AppointmentSchedule />
          </ProtectedRoute>
        ),
      },
      {
        path: "finance",
        element: (
          <ProtectedRoute>
            <Finance />
          </ProtectedRoute>
        ),
      },
      {
        path: "settings",
        element: (
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin",
        element: (
          <AdminRoute>
            <AdminPanel />
          </AdminRoute>
        ),
      },
    ],
  },
]);
