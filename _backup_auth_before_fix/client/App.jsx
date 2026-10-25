import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Guards
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';
import PublicOnlyRoute from './components/common/PublicOnlyRoute';

// Layout
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import AiChatDrawer from './components/common/AiChatDrawer';
import DigitalPassModal from './components/common/DigitalPassModal';
import QrScannerModal from './components/common/QrScannerModal';

// Public Auth Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// Protected Student Pages
import DashboardPage from './pages/DashboardPage';
import LiveTrackingPage from './pages/LiveTrackingPage';
import RoutesListPage from './pages/RoutesListPage';
import AlertsPage from './pages/AlertsPage';
import FavoritesPage from './pages/FavoritesPage';
import PreferencesPage from './pages/PreferencesPage';
import VerifyPassPage from './pages/VerifyPassPage';

// Admin Pages
import AdminDashboardPage from './pages/AdminDashboardPage';

// Route Handlers for specific student action URLs
function DigitalPassRouteHandler({ onOpenPassModal }) {
  useEffect(() => {
    if (onOpenPassModal) onOpenPassModal();
  }, [onOpenPassModal]);

  return <DashboardPage onOpenPassModal={onOpenPassModal} />;
}

function AssistantRouteHandler({ onOpenAI }) {
  useEffect(() => {
    if (onOpenAI) onOpenAI();
  }, [onOpenAI]);

  return <DashboardPage onOpenAI={onOpenAI} />;
}

// Authenticated Application Shell (Only mounted and rendered after valid authentication)
function AuthenticatedAppLayout() {
  const [aiOpen, setAiOpen] = useState(false);
  const [globalPassOpen, setGlobalPassOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [activeRouteContext, setActiveRouteContext] = useState(null);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased font-sans">
      {/* Top Navbar */}
      <Navbar
        onOpenAI={() => setAiOpen(true)}
        onOpenScanner={() => setScannerOpen(true)}
        unreadAlertsCount={2}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Modern Sidebar */}
        <Sidebar onOpenAI={() => setAiOpen(true)} />

        {/* Dynamic Route Pages */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <DashboardPage
                  onOpenAI={() => setAiOpen(true)}
                  onOpenPassModal={() => setGlobalPassOpen(true)}
                  onUpdateRouteContext={(ctx) => setActiveRouteContext(ctx)}
                />
              }
            />
            <Route
              path="/find-route"
              element={
                <DashboardPage
                  onOpenAI={() => setAiOpen(true)}
                  onOpenPassModal={() => setGlobalPassOpen(true)}
                  onUpdateRouteContext={(ctx) => setActiveRouteContext(ctx)}
                />
              }
            />
            <Route path="/live-buses" element={<LiveTrackingPage />} />
            <Route path="/live-map" element={<LiveTrackingPage />} />
            <Route path="/routes" element={<RoutesListPage />} />
            <Route path="/saved" element={<FavoritesPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/history" element={<FavoritesPage />} />
            <Route path="/preferences" element={<PreferencesPage />} />
            <Route path="/profile" element={<PreferencesPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route
              path="/digital-pass"
              element={
                <DigitalPassRouteHandler
                  onOpenPassModal={() => setGlobalPassOpen(true)}
                />
              }
            />
            <Route path="/scan-pass" element={<VerifyPassPage />} />
            <Route path="/verify-pass/:token" element={<VerifyPassPage />} />
            <Route
              path="/assistant"
              element={
                <AssistantRouteHandler
                  onOpenAI={() => setAiOpen(true)}
                />
              }
            />

            {/* Admin Routes Protected by AdminRoute Guard */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboardPage initialTab="analytics" />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/buses"
              element={
                <AdminRoute>
                  <AdminDashboardPage initialTab="buses" />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/routes"
              element={
                <AdminRoute>
                  <AdminDashboardPage initialTab="routes" />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/stops"
              element={
                <AdminRoute>
                  <AdminDashboardPage initialTab="stops" />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/drivers"
              element={
                <AdminRoute>
                  <AdminDashboardPage initialTab="drivers" />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <AdminDashboardPage initialTab="users" />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <AdminRoute>
                  <AdminDashboardPage initialTab="analytics" />
                </AdminRoute>
              }
            />

            {/* Default Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>

      {/* Slide-over College Bus AI Assistant Drawer */}
      <AiChatDrawer
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        onOpenPassModal={() => setGlobalPassOpen(true)}
        activeContext={activeRouteContext}
      />

      {/* Global Digital Pass Modal */}
      <DigitalPassModal
        isOpen={globalPassOpen}
        onClose={() => setGlobalPassOpen(false)}
      />

      {/* Conductor / Staff QR Scanner Modal */}
      <QrScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
      />
    </div>
  );
}

// Fallback client ID so GoogleOAuthProvider initializes safely without breaking the app
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-placeholder-client-id.apps.googleusercontent.com';

export default function App() {
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Authentication Pages (Only pages accessible without login) */}
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              }
            />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <RegisterPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/verify-email"
            element={
              <PublicOnlyRoute>
                <VerifyEmailPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicOnlyRoute>
                <ForgotPasswordPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <PublicOnlyRoute>
                <ResetPasswordPage />
              </PublicOnlyRoute>
            }
          />

          {/* All Other Routes Require Authentication */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AuthenticatedAppLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </GoogleOAuthProvider>
  );
}
