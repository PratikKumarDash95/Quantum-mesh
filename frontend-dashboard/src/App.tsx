import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { Shell } from './components/Shell';
import { LoginPage } from './pages/LoginPage';
import { LandingPage } from './pages/LandingPage';
import { ProfilePage } from './pages/ProfilePage';
import { OverviewPage } from './pages/OverviewPage';
import { ServicesPage } from './pages/ServicesPage';
import { AlertsPage } from './pages/AlertsPage';
import { AiPage } from './pages/AiPage';
import { BenchmarksPage } from './pages/BenchmarksPage';
import { ApiKeysPage } from './pages/workspace/ApiKeysPage';
import { UsagePage } from './pages/workspace/UsagePage';
import { LogsPage } from './pages/workspace/LogsPage';
import { BillingPage } from './pages/workspace/BillingPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Authenticated */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Shell>
                <ProfilePage />
              </Shell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Shell>
                <OverviewPage />
              </Shell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/services"
          element={
            <ProtectedRoute>
              <Shell>
                <ServicesPage />
              </Shell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/alerts"
          element={
            <ProtectedRoute>
              <Shell>
                <AlertsPage />
              </Shell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai"
          element={
            <ProtectedRoute>
              <Shell>
                <AiPage />
              </Shell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/benchmarks"
          element={
            <ProtectedRoute>
              <Shell>
                <BenchmarksPage />
              </Shell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/workspace/api-keys"
          element={
            <ProtectedRoute>
              <Shell>
                <ApiKeysPage />
              </Shell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/workspace/usage"
          element={
            <ProtectedRoute>
              <Shell>
                <UsagePage />
              </Shell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/workspace/logs"
          element={
            <ProtectedRoute>
              <Shell>
                <LogsPage />
              </Shell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/workspace/billing"
          element={
            <ProtectedRoute>
              <Shell>
                <BillingPage />
              </Shell>
            </ProtectedRoute>
          }
        />
        <Route path="/workspace" element={<Navigate to="/workspace/api-keys" replace />} />
        <Route path="/landing" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
