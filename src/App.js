// src/App.js

import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  FaCheckCircle,
  FaFingerprint,
  FaLock,
} from "react-icons/fa";
import { auth } from "./firebase.js";

import ErrorBoundary from "./components/ErrorBoundary.js";
import Home from "./pages/Home.js";
import Login from "./pages/Login.js";
import AdminDashboard from "./pages/AdminDashboard.js";
import AdminCertificate from "./pages/AdminCertificate.js";
import AdminCertificates from "./pages/AdminCertificates.js";
import AdminStudents from "./pages/AdminStudents.js";
import StudentDashboard from "./pages/StudentDashboard.js";
import PublicVerifier from "./pages/PublicVerifier.js";
import RegisterStudent from "./pages/RegisterStudent.js";
import PaymentCallback from "./pages/PaymentCallback.js";
import AdminActivityLogs from "./pages/AdminActivityLogs.js";
import AdminInstitutionSettings from "./pages/AdminInstitutionSettings.js";
import AdminPayments from "./pages/AdminPayments.js";
import Profile from "./pages/Profile.js";
import PaymentHistory from "./pages/PaymentHistory.js";
import PrivacyPolicy from "./pages/PrivacyPolicy.js";
import TermsOfUse from "./pages/TermsOfUse.js";
import NotFound from "./pages/NotFound.js";

const getDefaultRoute = (currentRole) => {
  if (currentRole === "admin") return "/admin-dashboard";
  if (currentRole === "student") return "/dashboard";
  if (currentRole === "employer") return "/public-verifier";

  return "/";
};

const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  }, [location.pathname]);

  return null;
};

const LoadingScreen = () => {
  return (
    <>
      <style>{`
        .app-loading-shell {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background:
            radial-gradient(circle at top left, rgba(45,62,171,0.16), transparent 34%),
            radial-gradient(circle at bottom right, rgba(0,180,216,0.12), transparent 30%),
            linear-gradient(135deg, #F8F9FC 0%, #EEF2F7 100%);
        }

        .app-loading-card {
          position: relative;
          overflow: hidden;
          width: min(100%, 460px);
          background: #fff;
          border: 1px solid #E4E8F0;
          border-radius: 30px;
          box-shadow: 0 24px 70px rgba(15,27,60,0.14);
          padding: 2rem;
          text-align: center;
        }

        .app-loading-card::after {
          content: "";
          position: absolute;
          right: -90px;
          top: -90px;
          width: 220px;
          height: 220px;
          border-radius: 50%;
          background: rgba(45,62,171,0.06);
          border: 1px solid rgba(45,62,171,0.08);
        }

        .app-loading-content {
          position: relative;
          z-index: 1;
        }

        .app-loading-logo {
          width: 76px;
          height: 76px;
          border-radius: 24px;
          background: linear-gradient(135deg, #2D3EAB, #00B4D8);
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 16px 36px rgba(45,62,171,0.28);
          font-family: Manrope, Inter, sans-serif;
          font-weight: 900;
          font-size: 1.75rem;
          margin-bottom: 1.4rem;
        }

        .app-loading-title {
          font-family: Manrope, Inter, sans-serif;
          font-weight: 900;
          letter-spacing: 0;
          color: #0F1B3C;
          margin-bottom: 0.6rem;
        }

        .app-loading-text {
          color: #6B7A99;
          margin-bottom: 1.5rem;
        }

        .app-loading-dots {
          display: inline-flex;
          gap: 0.45rem;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .app-loading-dots span {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #2D3EAB;
          animation: appPulse 1.1s infinite ease-in-out;
        }

        .app-loading-dots span:nth-child(2) {
          animation-delay: 0.15s;
          background: #00B4D8;
        }

        .app-loading-dots span:nth-child(3) {
          animation-delay: 0.3s;
          background: #059669;
        }

        @keyframes appPulse {
          0%, 80%, 100% {
            transform: scale(0.75);
            opacity: 0.45;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .app-loading-feature {
          background: #F8FAFC;
          border: 1px solid #E4E8F0;
          border-radius: 18px;
          padding: 0.85rem;
          text-align: left;
        }

        .app-loading-feature-icon {
          width: 38px;
          height: 38px;
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #EEF0FB;
          color: #2D3EAB;
          flex-shrink: 0;
        }
      `}</style>

      <div className="app-loading-shell">
        <div className="app-loading-card">
          <div className="app-loading-content">
            <div className="app-loading-logo">BC</div>

            <h1 className="app-loading-title h2">Loading BlockCred</h1>

            <p className="app-loading-text">
              Checking your secure session and preparing the correct workspace.
            </p>

            <div className="app-loading-dots" aria-label="Loading">
              <span />
              <span />
              <span />
            </div>

            <div className="row g-3">
              <div className="col-sm-6">
                <div className="app-loading-feature h-100">
                  <div className="d-flex gap-3 align-items-start">
                    <div className="app-loading-feature-icon">
                      <FaLock />
                    </div>

                    <div>
                      <p className="fw-bold mb-1">Secure access</p>
                      <p className="text-muted small mb-0">
                        Firebase role check in progress.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-sm-6">
                <div className="app-loading-feature h-100">
                  <div className="d-flex gap-3 align-items-start">
                    <div className="app-loading-feature-icon">
                      <FaFingerprint />
                    </div>

                    <div>
                      <p className="fw-bold mb-1">Trusted records</p>
                      <p className="text-muted small mb-0">
                        Preparing certificate tools.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const ProtectedRoute = ({ user, role, allowedRoles, children }) => {
  const location = useLocation();

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={getDefaultRoute(role)} replace />;
  }

  return children;
};

const GuestOnlyRoute = ({ user, role, children }) => {
  if (user) {
    return <Navigate to={getDefaultRoute(role)} replace />;
  }

  return children;
};

const AppRoutes = ({ user, role }) => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/public-verifier" element={<PublicVerifier />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfUse />} />

      <Route
        path="/register-student"
        element={
          <GuestOnlyRoute user={user} role={role}>
            <RegisterStudent />
          </GuestOnlyRoute>
        }
      />

      <Route
        path="/login"
        element={
          <GuestOnlyRoute user={user} role={role}>
            <Login />
          </GuestOnlyRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute user={user} role={role} allowedRoles={["student"]}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/payment/callback"
        element={
          <ProtectedRoute user={user} role={role} allowedRoles={["student"]}>
            <PaymentCallback />
          </ProtectedRoute>
        }
      />

      <Route
        path="/payment-history"
        element={
          <ProtectedRoute user={user} role={role} allowedRoles={["student"]}>
            <PaymentHistory />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute
            user={user}
            role={role}
            allowedRoles={["admin", "student"]}
          >
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute user={user} role={role} allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin-certificate"
        element={
          <ProtectedRoute user={user} role={role} allowedRoles={["admin"]}>
            <AdminCertificate />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin-certificates"
        element={
          <ProtectedRoute user={user} role={role} allowedRoles={["admin"]}>
            <AdminCertificates />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin-students"
        element={
          <ProtectedRoute user={user} role={role} allowedRoles={["admin"]}>
            <AdminStudents />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin-activity-logs"
        element={
          <ProtectedRoute user={user} role={role} allowedRoles={["admin"]}>
            <AdminActivityLogs />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin-payments"
        element={
          <ProtectedRoute user={user} role={role} allowedRoles={["admin"]}>
            <AdminPayments />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin-settings"
        element={
          <ProtectedRoute user={user} role={role} allowedRoles={["admin"]}>
            <AdminInstitutionSettings />
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={<NotFound />}
      />
    </Routes>
  );
};

const AppStatusBadge = ({ user, role }) => {
  if (!user) return null;

  return (
    <div
      className="position-fixed d-none d-lg-flex align-items-center gap-2 px-3 py-2 rounded-pill shadow-sm"
      style={{
        right: 18,
        bottom: 18,
        zIndex: 1040,
        background: "#fff",
        border: "1px solid #E4E8F0",
        color: "#0F1B3C",
        fontSize: "0.82rem",
        fontWeight: 800,
      }}
      title={`Signed in as ${role || "user"}`}
    >
      <FaCheckCircle style={{ color: "#059669" }} />
      {role ? `${role.charAt(0).toUpperCase()}${role.slice(1)} session` : "Secure session"}
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);

      try {
        if (!currentUser) {
          setUser(null);
          setRole("");
          return;
        }

        const token = await currentUser.getIdTokenResult(true);
        const userRole = token.claims.role || "student";

        setUser(currentUser);
        setRole(userRole);
      } catch (error) {
        console.error("Auth state error:", error);
        setUser(null);
        setRole("");
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <ErrorBoundary>
        <ScrollToTop />
        <AppRoutes user={user} role={role} />
        <AppStatusBadge user={user} role={role} />
      </ErrorBoundary>
    </Router>
  );
};

export default App;
