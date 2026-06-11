// src/components/Layout.js

import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import {
  FaBars,
  FaCheckCircle,
  FaCreditCard,
  FaHome,
  FaSearch,
  FaShieldAlt,
  FaSignInAlt,
  FaSignOutAlt,
  FaTimes,
  FaUserCircle,
  FaUserGraduate,
} from "react-icons/fa";
import { auth } from "../firebase.js";
import MetaMaskConnect from "./MetaMaskConnect.js";
import BrandLogo from "./BrandLogo.js";

const ROLE_LABELS = {
  student: { label: "Student" },
  employer: { label: "Verifier" },
  admin: { label: "Institution" },
};

const Layout = ({ children, user = null, role = null }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeRole = role || (typeof user === "string" ? user : null);
  const roleMeta = activeRole ? ROLE_LABELS[activeRole] : null;
  const isLoggedIn = Boolean(activeRole || user);
  const isAdmin = activeRole === "admin";
  const isStudent = activeRole === "student";

  const closeMobile = () => {
    setMobileOpen(false);
  };

  const goTo = (path) => {
    navigate(path);
    closeMobile();
  };

  const isActivePath = (path) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      closeMobile();
      navigate("/");
    } catch (error) {
      console.error("Sign out error:", error);
      alert("Could not sign out. Please try again.");
    }
  };

  return (
    <>
      <style>{`
        :root {
          --bc-navy: var(--bc-primary);
          --bc-blue: var(--bc-accent);
          --bc-blue-soft: var(--bc-accent-soft);
          --bc-green: var(--bc-success-strong);
          --bc-green-soft: var(--bc-success-soft);
          --bc-red: var(--bc-danger-strong);
          --bc-card: var(--bc-surface);
          --bc-shadow: var(--bc-shadow-sm);
        }

        *, *::before, *::after {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          background: var(--bc-bg);
          color: var(--bc-text);
          line-height: 1.5;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        button,
        input,
        select,
        textarea {
          font-family: inherit;
        }

        button {
          cursor: pointer;
        }

        button:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }

        a {
          text-decoration: none;
        }

        ::selection {
          background: rgba(37, 99, 235, 0.16);
          color: var(--bc-navy);
        }

        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: var(--bc-surface-soft);
        }

        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 999px;
        }

        .min-h-screen {
          min-height: 100vh;
        }

        .bg-slate-50 {
          background-color: #f8fafc;
        }

        .bg-slate-100 {
          background-color: #f1f5f9;
        }

        .text-slate-900 {
          color: #0f172a;
        }

        .text-slate-800 {
          color: #1e293b;
        }

        .text-slate-700 {
          color: #334155;
        }

        .text-slate-600 {
          color: #475569;
        }

        .text-slate-500 {
          color: #64748b;
        }

        .text-indigo-600 {
          color: var(--bc-blue);
        }

        .text-emerald-600 {
          color: var(--bc-green);
        }

        .text-red-600 {
          color: var(--bc-red);
        }

        .text-orange-500 {
          color: #f97316;
        }

        .text-sm {
          font-size: 0.875rem;
        }

        .text-xl {
          font-size: 1.25rem;
        }

        .text-2xl {
          font-size: 1.5rem;
        }

        .text-3xl {
          font-size: 1.875rem;
        }

        .text-4xl {
          font-size: 2.25rem;
        }

        .text-5xl {
          font-size: 3rem;
        }

        .font-semibold {
          font-weight: 600;
        }

        .font-bold {
          font-weight: 700;
        }

        .font-extrabold {
          font-weight: 800;
        }

        .uppercase {
          text-transform: uppercase;
        }

        .tracking-widest {
          letter-spacing: 0.12em;
        }

        .bc-app-shell {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--bc-bg);
        }

        .bc-main {
          flex: 1;
        }

        .bc-header {
          position: sticky;
          top: 0;
          z-index: 1050;
          background: rgba(255, 255, 255, 0.96);
          border-bottom: 1px solid var(--bc-border);
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .bc-header-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.25rem;
          min-height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .bc-logo {
          display: inline-flex;
          align-items: center;
          gap: 0.65rem;
          min-width: 0;
          border: 0;
          background: transparent;
          padding: 0;
          color: var(--bc-text);
          text-align: left;
        }

        .bc-desktop-nav {
          display: flex;
          align-items: center;
          gap: 0.45rem;
        }

        .bc-nav-btn,
        .bc-hdr-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          min-height: 36px;
          padding: 0.42rem 0.8rem;
          border-radius: 10px;
          border: 1px solid var(--bc-border);
          background: var(--bc-surface);
          color: var(--bc-text-soft);
          font-size: 0.82rem;
          font-weight: 700;
          transition: 0.15s ease;
          white-space: nowrap;
        }

        .bc-nav-btn:hover,
        .bc-hdr-btn:hover {
          background: var(--bc-surface-soft);
          color: var(--bc-navy);
          border-color: #cbd5e1;
        }

        .bc-nav-btn.active,
        .bc-hdr-btn.active,
        .bc-mobile-btn.active {
          background: var(--bc-blue-soft);
          color: var(--bc-navy);
          border-color: rgba(29, 78, 216, 0.28);
          box-shadow: 0 10px 22px rgba(29, 78, 216, 0.12);
        }

        .bc-nav-btn-primary {
          background: var(--bc-navy);
          color: #fff;
          border-color: var(--bc-navy);
        }

        .bc-nav-btn-primary:hover {
          background: #1e293b;
          color: #fff;
          border-color: #1e293b;
        }

        .bc-role-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          min-height: 36px;
          border-radius: 10px;
          padding: 0.42rem 0.75rem;
          background: var(--bc-green-soft);
          border: 1px solid #bbf7d0;
          color: var(--bc-green);
          font-size: 0.78rem;
          font-weight: 800;
          white-space: nowrap;
        }

        .bc-mobile-toggle {
          display: none;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          border: 1px solid var(--bc-border);
          background: var(--bc-surface);
          color: var(--bc-text);
          align-items: center;
          justify-content: center;
          font-size: 1rem;
        }

        .bc-mobile-panel {
          display: none;
          border-top: 1px solid var(--bc-border);
          background: var(--bc-surface);
        }

        .bc-mobile-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0.85rem 1.25rem;
        }

        .bc-mobile-menu {
          display: grid;
          gap: 0.5rem;
        }

        .bc-mobile-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.65rem;
          border-radius: 12px;
          padding: 0.75rem 0.85rem;
          border: 1px solid var(--bc-border);
          background: var(--bc-surface);
          color: var(--bc-text-soft);
          font-weight: 700;
          text-align: left;
          transition: 0.15s ease;
        }

        .bc-mobile-btn:hover {
          background: var(--bc-surface-soft);
          color: var(--bc-navy);
        }

        .bc-mobile-icon {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: var(--bc-blue-soft);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--bc-blue);
          flex-shrink: 0;
        }

        .bc-footer {
          margin-top: auto;
          background: var(--bc-surface);
          border-top: 1px solid var(--bc-border);
          color: var(--bc-muted);
        }

        .bc-footer-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1.2rem 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .bc-footer-brand {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          color: var(--bc-text);
          font-weight: 800;
        }

        .bc-footer-links {
          display: flex;
          align-items: center;
          gap: 0.9rem;
          flex-wrap: wrap;
        }

        .bc-footer-link {
          border: 0;
          background: transparent;
          padding: 0;
          color: var(--bc-muted);
          font-size: 0.82rem;
          font-weight: 700;
        }

        .bc-footer-link:hover {
          color: var(--bc-blue);
        }

        .spinner-border-sm {
          width: 0.85rem;
          height: 0.85rem;
        }

        @media(max-width: 900px) {
          .bc-desktop-nav {
            display: none;
          }

          .bc-mobile-toggle {
            display: inline-flex;
          }

          .bc-mobile-panel.open {
            display: block;
          }
        }

        @media(max-width: 576px) {
          .bc-header-inner {
            min-height: 60px;
            padding: 0 1rem;
          }

          .bc-logo {
            max-width: 210px;
          }

          .bc-footer-inner {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>

      <div className="bc-app-shell">
        <header className="bc-header admin-topbar">
          <div className="bc-header-inner">
            <button
              type="button"
              className="bc-logo"
              onClick={() => goTo("/")}
              aria-label="Go to BlockCred home"
            >
              <BrandLogo size="md" variant="dark" />
            </button>

            <nav className="bc-desktop-nav" aria-label="Main navigation">
              {!isLoggedIn && (
                <>
                  <button
                    type="button"
                    className="bc-nav-btn"
                    onClick={() => goTo("/")}
                  >
                    <FaHome />
                    Home
                  </button>

                  <button
                    type="button"
                    className="bc-nav-btn"
                    onClick={() => goTo("/public-verifier")}
                  >
                    <FaSearch />
                    Verify
                  </button>

                  <button
                    type="button"
                    className="bc-nav-btn bc-nav-btn-primary"
                    onClick={() => goTo("/login")}
                  >
                    <FaSignInAlt />
                    Sign In
                  </button>
                </>
              )}

              {roleMeta && (
                <span className="bc-role-pill">
                  <FaCheckCircle />
                  {roleMeta.label}
                </span>
              )}

              {isLoggedIn && <MetaMaskConnect />}

              {isStudent && (
                <>
                  <button
                    type="button"
                    className={`bc-hdr-btn ${
                      isActivePath("/dashboard") ? "active" : ""
                    }`}
                    onClick={() => goTo("/dashboard")}
                  >
                    <FaUserGraduate />
                    My Credentials
                  </button>
                  <button
                    type="button"
                    className={`bc-hdr-btn ${
                      isActivePath("/payment-history") ? "active" : ""
                    }`}
                    onClick={() => goTo("/payment-history")}
                  >
                    <FaCreditCard />
                    Payment History
                  </button>
                </>
              )}

              {isLoggedIn && (
                <button
                  type="button"
                  className={`bc-hdr-btn ${isActivePath("/profile") ? "active" : ""}`}
                  onClick={() => goTo("/profile")}
                >
                  <FaUserCircle />
                  Profile
                </button>
              )}

              {isLoggedIn && (
                <button
                  type="button"
                  className="bc-hdr-btn"
                  onClick={handleSignOut}
                >
                  <FaSignOutAlt />
                  Sign Out
                </button>
              )}
            </nav>

            <button
              type="button"
              className="bc-mobile-toggle"
              onClick={() => setMobileOpen((previous) => !previous)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>

          <div className={`bc-mobile-panel ${mobileOpen ? "open" : ""}`}>
            <div className="bc-mobile-inner">
              <div className="bc-mobile-menu">
                <button
                  type="button"
                  className="bc-mobile-btn"
                  onClick={() => goTo("/")}
                >
                  <span className="bc-mobile-icon">
                    <FaHome />
                  </span>
                  Home
                </button>

                <button
                  type="button"
                  className="bc-mobile-btn"
                  onClick={() => goTo("/public-verifier")}
                >
                  <span className="bc-mobile-icon">
                    <FaSearch />
                  </span>
                  Verify Certificate
                </button>

                {!isLoggedIn && (
                  <>
                    <button
                      type="button"
                      className="bc-mobile-btn"
                      onClick={() => goTo("/register-student")}
                    >
                      <span className="bc-mobile-icon">
                        <FaUserGraduate />
                      </span>
                      Create Student Account
                    </button>

                    <button
                      type="button"
                      className="bc-mobile-btn"
                      onClick={() => goTo("/login")}
                    >
                      <span className="bc-mobile-icon">
                        <FaSignInAlt />
                      </span>
                      Sign In
                    </button>
                  </>
                )}

                {isLoggedIn && roleMeta && (
                  <div className="bc-mobile-btn" style={{ cursor: "default" }}>
                    <span className="bc-mobile-icon">
                      <FaShieldAlt />
                    </span>
                    {roleMeta.label}
                  </div>
                )}

                {isStudent && (
                  <>
                    <button
                      type="button"
                      className={`bc-mobile-btn ${
                        isActivePath("/dashboard") ? "active" : ""
                      }`}
                      onClick={() => goTo("/dashboard")}
                    >
                      <span className="bc-mobile-icon">
                        <FaUserGraduate />
                      </span>
                      My Credentials
                    </button>
                    <button
                      type="button"
                      className={`bc-mobile-btn ${
                        isActivePath("/payment-history") ? "active" : ""
                      }`}
                      onClick={() => goTo("/payment-history")}
                    >
                      <span className="bc-mobile-icon">
                        <FaCreditCard />
                      </span>
                      Payment History
                    </button>
                  </>
                )}

                {isLoggedIn && (
                  <button
                    type="button"
                    className={`bc-mobile-btn ${
                      isActivePath("/profile") ? "active" : ""
                    }`}
                    onClick={() => goTo("/profile")}
                  >
                    <span className="bc-mobile-icon">
                      <FaUserCircle />
                    </span>
                    Profile
                  </button>
                )}

                {isLoggedIn && (
                  <button
                    type="button"
                    className="bc-mobile-btn"
                    onClick={handleSignOut}
                  >
                    <span className="bc-mobile-icon">
                      <FaSignOutAlt />
                    </span>
                    Sign Out
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="bc-main">{children}</main>

        {!isAdmin && (
          <footer className="bc-footer">
            <div className="bc-footer-inner">
              <div className="bc-footer-brand">
                <BrandLogo size="sm" variant="dark" subtitle="" />
              </div>

              <div className="bc-footer-links">
                <button
                  type="button"
                  className="bc-footer-link"
                  onClick={() => goTo("/")}
                >
                  Home
                </button>

                <button
                  type="button"
                  className="bc-footer-link"
                  onClick={() => goTo("/public-verifier")}
                >
                  Verify
                </button>

                <button
                  type="button"
                  className="bc-footer-link"
                  onClick={() => goTo("/login")}
                >
                  Sign In
                </button>

                <span style={{ fontSize: "0.82rem" }}>
                  © {new Date().getFullYear()}
                </span>
              </div>
            </div>
          </footer>
        )}
      </div>
    </>
  );
};

export default Layout;
