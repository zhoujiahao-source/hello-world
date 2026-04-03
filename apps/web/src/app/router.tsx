import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout.js";
import { DashboardPage } from "../pages/DashboardPage.js";
import { EnginesPage } from "../pages/EnginesPage.js";
import { WorkspacesPage } from "../pages/WorkspacesPage.js";
import { WorkspaceDetailPage } from "../pages/WorkspaceDetailPage.js";
import { SessionsPage } from "../pages/SessionsPage.js";
import { SessionDetailPage } from "../pages/SessionDetailPage.js";
import { SchedulesPage } from "../pages/SchedulesPage.js";
import { SettingsPage } from "../pages/SettingsPage.js";
import { LogsPage } from "../pages/LogsPage.js";

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/engines" element={<EnginesPage />} />
        <Route path="/workspaces" element={<WorkspacesPage />} />
        <Route path="/workspaces/:id" element={<WorkspaceDetailPage />} />
        <Route path="/sessions" element={<SessionsPage />} />
        <Route path="/sessions/:id" element={<SessionDetailPage />} />
        <Route path="/schedules" element={<SchedulesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/logs" element={<LogsPage />} />
      </Route>
    </Routes>
  );
}
