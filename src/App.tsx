import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ListingsProvider } from "./contexts/ListingsContext";
import { MessagingProvider } from "./contexts/MessagingContext";
import { ProductionProductionErrorBoundary } from "./components/ProductionProductionErrorBoundary";
import OfflineNotice from "./components/OfflineNotice";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import BrowsePage from "./pages/BrowsePage";
import AuthPage from "./pages/AuthPage";
import CreateListingPage from "./pages/CreateListingPage";
import ListingDetailPage from "./pages/ListingDetailPage";
import MessagesPage from "./pages/MessagesPage";
import FavoritesPage from "./pages/FavoritesPage";
import ProfilePage from "./pages/ProfilePage";
import UpdatePasswordPage from "./pages/UpdatePasswordPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import PrivacySettingsPage from "./pages/PrivacySettingsPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import VerificationPage from "./pages/VerificationPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is logged in and tries to access login/register, redirect to home
  return user ? <Navigate to="/" replace /> : <>{children}</>;
};

const AppContent: React.FC = () => {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <div className="min-h-screen bg-gray-50">
        <OfflineNotice />
        <Header />
        <main>
          <Routes>
            <Route
              path="/"
              element={
                <ProductionErrorBoundary>
                  <HomePage />
                </ProductionErrorBoundary>
              }
            />
            <Route
              path="/browse"
              element={
                <ProductionErrorBoundary>
                  <BrowsePage />
                </ProductionErrorBoundary>
              }
            />
            <Route
              path="/listing/:id"
              element={
                <ProductionErrorBoundary>
                  <ListingDetailPage />
                </ProductionErrorBoundary>
              }
            />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <ProductionErrorBoundary>
                    <AuthPage />
                  </ProductionErrorBoundary>
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <ProductionErrorBoundary>
                    <AuthPage />
                  </ProductionErrorBoundary>
                </PublicRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <ProductionErrorBoundary>
                    <ForgotPasswordPage />
                  </ProductionErrorBoundary>
                </PublicRoute>
              }
            />
            <Route
              path="/update-password"
              element={
                <PublicRoute>
                  <ProductionErrorBoundary>
                    <UpdatePasswordPage />
                  </ProductionErrorBoundary>
                </PublicRoute>
              }
            />
            <Route
              path="/reset-password"
              element={
                <PublicRoute>
                  <ProductionErrorBoundary>
                    <UpdatePasswordPage />
                  </ProductionErrorBoundary>
                </PublicRoute>
              }
            />
            <Route
              path="/terms"
              element={
                <ProductionErrorBoundary>
                  <TermsPage />
                </ProductionErrorBoundary>
              }
            />
            <Route
              path="/privacy"
              element={
                <ProductionErrorBoundary>
                  <PrivacyPage />
                </ProductionErrorBoundary>
              }
            />
            <Route
              path="/change-password"
              element={
                <ProtectedRoute>
                  <ProductionErrorBoundary>
                    <ChangePasswordPage />
                  </ProductionErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/privacy-settings"
              element={
                <ProtectedRoute>
                  <ProductionErrorBoundary>
                    <PrivacySettingsPage />
                  </ProductionErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/verification"
              element={
                <ProtectedRoute>
                  <ProductionErrorBoundary>
                    <VerificationPage />
                  </ProductionErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/verify-email"
              element={
                <ProductionErrorBoundary>
                  <VerifyEmailPage />
                </ProductionErrorBoundary>
              }
            />
            <Route
              path="/create"
              element={
                <ProtectedRoute>
                  <ProductionErrorBoundary>
                    <CreateListingPage />
                  </ProductionErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <ProductionErrorBoundary>
                    <MessagesPage />
                  </ProductionErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/favorites"
              element={
                <ProtectedRoute>
                  <ProductionErrorBoundary>
                    <FavoritesPage />
                  </ProductionErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProductionErrorBoundary>
                    <ProfilePage />
                  </ProductionErrorBoundary>
                </ProtectedRoute>
              }
            />
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

function App() {
  return (
    <ProductionErrorBoundary>
      <AuthProvider>
        <ListingsProvider>
          <MessagingProvider>
            <AppContent />
          </MessagingProvider>
        </ListingsProvider>
      </AuthProvider>
    </ProductionErrorBoundary>
  );
}

export default App;
