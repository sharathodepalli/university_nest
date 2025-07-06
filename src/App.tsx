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
import ErrorBoundary from "./components/ErrorBoundary";
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
import RealTimeTest from "./components/RealTimeTest";
import UpdatePasswordPage from "./pages/UpdatePasswordPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";

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
                <ErrorBoundary>
                  <HomePage />
                </ErrorBoundary>
              }
            />
            <Route
              path="/browse"
              element={
                <ErrorBoundary>
                  <BrowsePage />
                </ErrorBoundary>
              }
            />
            <Route
              path="/listing/:id"
              element={
                <ErrorBoundary>
                  <ListingDetailPage />
                </ErrorBoundary>
              }
            />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <ErrorBoundary>
                    <AuthPage />
                  </ErrorBoundary>
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <ErrorBoundary>
                    <AuthPage />
                  </ErrorBoundary>
                </PublicRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <ErrorBoundary>
                    <ForgotPasswordPage />
                  </ErrorBoundary>
                </PublicRoute>
              }
            />
            <Route
              path="/update-password"
              element={
                <PublicRoute>
                  <ErrorBoundary>
                    <UpdatePasswordPage />
                  </ErrorBoundary>
                </PublicRoute>
              }
            />
            <Route
              path="/create"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <CreateListingPage />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <MessagesPage />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/favorites"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <FavoritesPage />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <ProfilePage />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/realtime-test"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <RealTimeTest />
                  </ErrorBoundary>
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
    <ErrorBoundary>
      <AuthProvider>
        <ListingsProvider>
          <MessagingProvider>
            <AppContent />
          </MessagingProvider>
        </ListingsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
