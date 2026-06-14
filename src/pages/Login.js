// src/pages/Login.js

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import {
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaSearch,
  FaShieldAlt,
  FaSignInAlt,
  FaUserGraduate,
} from "react-icons/fa";
import { auth } from "../firebase.js";
import Layout from "../components/Layout.js";
import ActionButton from "../components/ui/ActionButton.js";
import AlertMessage from "../components/ui/AlertMessage.js";
import Card from "../components/ui/Card.js";
import BrandLogo from "../components/BrandLogo.js";

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  const emailIsReady = useMemo(() => {
    return email.trim().length > 0 && email.includes("@");
  }, [email]);

  const passwordIsReady = useMemo(() => {
    return password.length >= 6;
  }, [password]);

  const formIsReady = emailIsReady && passwordIsReady && !loading;

  const showMessage = (type, text) => {
    setMessage({ type, text });
  };

  const getFriendlyAuthError = (error) => {
    if (error?.code === "auth/invalid-email") {
      return "The email address is not valid.";
    }

    if (
      error?.code === "auth/user-not-found" ||
      error?.code === "auth/wrong-password" ||
      error?.code === "auth/invalid-credential"
    ) {
      return "Invalid email or password. Please check your details and try again.";
    }

    if (error?.code === "auth/too-many-requests") {
      return "Too many failed attempts. Please wait and try again.";
    }

    if (error?.code === "auth/network-request-failed") {
      return "Network error. Please check your internet connection.";
    }

    return error?.message || "Sign in failed. Please try again.";
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    const finalEmail = email.trim().toLowerCase();

    if (!finalEmail) {
      showMessage("warning", "Please enter your email address.");
      return;
    }

    if (!password) {
      showMessage("warning", "Please enter your password.");
      return;
    }

    setLoading(true);
    showMessage("info", "Signing in...");

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        finalEmail,
        password
      );

      const token = await userCredential.user.getIdTokenResult(true);
      const role = token.claims.role || "student";

      showMessage("success", "Signed in successfully. Redirecting...");

      setTimeout(() => {
        if (role === "admin") {
          navigate("/admin-dashboard");
        } else if (role === "student") {
          navigate("/dashboard");
        } else if (role === "employer") {
          navigate("/public-verifier");
        } else {
          navigate("/");
        }
      }, 500);
    } catch (error) {
      console.error("Login error:", error);
      showMessage("error", getFriendlyAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const finalEmail = email.trim().toLowerCase();

    if (!finalEmail) {
      showMessage("warning", "Enter your email address first, then request a password reset.");
      return;
    }

    if (!finalEmail.includes("@")) {
      showMessage("warning", "Please enter a valid email address.");
      return;
    }

    setResetLoading(true);
    showMessage("info", "Sending password reset instructions...");

    try {
      await sendPasswordResetEmail(auth, finalEmail);
      showMessage(
        "success",
        "Password reset instructions have been sent if this email is registered."
      );
    } catch (error) {
      console.error("Password reset error:", error);
      showMessage(
        "error",
        error?.code === "auth/too-many-requests"
          ? "Too many reset attempts. Please wait and try again."
          : "Could not send reset instructions. Please check the email and try again."
      );
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <Layout user={null}>
      <style>{`
        .login-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(37, 99, 235, 0.12), transparent 34rem),
            var(--bc-page-bg);
          padding: 3rem 1.25rem 4rem;
        }

        .login-container {
          max-width: 1120px;
          margin: 0 auto;
        }

        .login-shell {
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(380px, 0.75fr);
          gap: 1.75rem;
          align-items: stretch;
        }

        .login-trust-panel {
          min-height: 620px;
          border-radius: var(--bc-radius-section);
          border: 1px solid rgba(255, 255, 255, 0.14);
          background:
            linear-gradient(135deg, rgba(15, 23, 42, 0.97), rgba(29, 78, 216, 0.9));
          box-shadow: var(--bc-shadow-lg);
          padding: 1.75rem;
          color: #ffffff;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .login-hero-copy {
          max-width: 560px;
        }

        .login-label {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.42rem 0.7rem;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          color: #dbeafe;
          border: 1px solid rgba(255, 255, 255, 0.16);
          font-size: 0.78rem;
          font-weight: 800;
          margin-bottom: 1rem;
        }

        .login-title {
          font-size: clamp(2rem, 4vw, 3.2rem);
          font-weight: 850;
          letter-spacing: 0;
          color: #ffffff;
          line-height: 1;
          margin-bottom: 0.85rem;
        }

        .login-text {
          color: #cbd5e1;
          font-size: 1rem;
          line-height: 1.7;
          margin-bottom: 0;
        }

        .login-trust-list {
          display: grid;
          gap: 0.75rem;
          margin-top: 1.25rem;
        }

        .login-trust-item {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          padding: 0.85rem;
          border-radius: var(--bc-radius-lg);
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.08);
          color: #e2e8f0;
          font-weight: 750;
        }

        .login-trust-item strong {
          display: block;
          color: #ffffff;
          line-height: 1.2;
        }

        .login-trust-item span:last-child {
          color: #cbd5e1;
          font-size: 0.88rem;
          font-weight: 600;
        }

        .login-trust-icon {
          width: 34px;
          height: 34px;
          border-radius: var(--bc-radius-md);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.12);
          color: #bfdbfe;
          flex-shrink: 0;
        }

        .login-card {
          width: 100%;
          background: var(--bc-surface);
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-xl);
          box-shadow: var(--bc-shadow-md);
          overflow: hidden;
        }

        .login-card-body {
          padding: 1.5rem;
        }

        .login-card-logo {
          display: inline-flex;
          justify-content: center;
          margin-bottom: 1rem;
        }

        .login-card-title {
          font-size: 1.35rem;
          font-weight: 850;
          letter-spacing: 0;
          color: var(--bc-text);
          margin-bottom: 0.35rem;
        }

        .login-muted {
          color: var(--bc-muted);
        }

        .login-form-label {
          display: block;
          font-weight: 800;
          color: var(--bc-text-soft);
          font-size: 0.84rem;
          margin-bottom: 0.55rem;
        }

        .login-input-wrap {
          position: relative;
        }

        .login-input-icon {
          position: absolute;
          left: 0.9rem;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
        }

        .login-input {
          width: 100%;
          height: 46px;
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-md);
          padding: 0 0.9rem 0 2.55rem;
          outline: none;
          background: #ffffff;
          color: var(--bc-text);
          font-weight: 600;
          transition: 0.15s ease;
        }

        .login-input:focus {
          border-color: var(--bc-primary);
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.08);
        }

        .login-password-input {
          padding-right: 2.55rem;
        }

        .login-password-toggle {
          position: absolute;
          right: 0.85rem;
          top: 50%;
          transform: translateY(-50%);
          border: 0;
          background: transparent;
          color: #64748b;
          padding: 0;
        }

        .login-form-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.55rem;
        }

        .login-form-row .login-form-label {
          margin-bottom: 0;
        }

        .login-reset-link {
          border: 0;
          background: transparent;
          color: var(--bc-primary);
          font-size: 0.82rem;
          font-weight: 850;
          padding: 0;
          white-space: nowrap;
        }

        .login-reset-link:hover {
          color: var(--bc-primary-strong);
          text-decoration: underline;
        }

        .login-btn {
          width: 100%;
          min-height: 46px;
          border-radius: 12px;
          border: 1px solid #0f172a;
          background: #0f172a;
          color: #ffffff;
          font-weight: 850;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: 0.15s ease;
        }

        .login-btn:hover {
          background: #1e293b;
          border-color: #1e293b;
        }

        .login-submit-button {
          width: 100%;
          min-height: 46px !important;
        }

        .login-actions {
          background: var(--bc-surface-soft);
          border-top: 1px solid var(--bc-border);
          padding: 1.15rem 1.75rem 1.75rem;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        .login-secondary-btn {
          border: 1px solid #e2e8f0;
          background: #ffffff;
          color: #334155;
          border-radius: 12px;
          padding: 0.75rem;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          transition: 0.15s ease;
        }

        .login-secondary-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #0f172a;
        }

        @media(max-width: 900px) {
          .login-shell {
            grid-template-columns: 1fr;
          }

          .login-trust-panel {
            min-height: auto;
          }
        }

        @media(max-width: 576px) {
          .login-page {
            padding: 2.5rem 1rem 3.5rem;
          }

          .login-card-body {
            padding: 1.25rem;
          }

          .login-actions {
            grid-template-columns: 1fr;
            padding: 1rem 1.25rem;
          }

          .login-actions .bc-button {
            width: 100%;
          }
        }
      `}</style>

      <main className="login-page">
        <div className="login-container">
          <div className="login-shell">
            <section className="login-trust-panel">
              <div>
                <BrandLogo size="lg" variant="light" />

                <div className="login-label mt-4">
                  <FaShieldAlt />
                  Secure access
                </div>

                <h1 className="login-title">Access your credential workspace</h1>

                <p className="login-text login-hero-copy">
                  Sign in to manage issued certificates, view your credential
                  wallet, or continue institutional administration.
                </p>

                <div className="login-trust-list">
                  <div className="login-trust-item">
                    <span className="login-trust-icon">
                      <FaLock />
                    </span>
                    <span>
                      <strong>Protected account access</strong>
                      Sign in with your registered email and password.
                    </span>
                  </div>

                  <div className="login-trust-item">
                    <span className="login-trust-icon">
                      <FaShieldAlt />
                    </span>
                    <span>
                      <strong>Personalized workspace</strong>
                      BlockCred opens the right workspace after sign in.
                    </span>
                  </div>

                  <div className="login-trust-item">
                    <span className="login-trust-icon">
                      <FaSearch />
                    </span>
                    <span>
                      <strong>Public verification stays open</strong>
                      Anyone can verify certificates without signing in.
                    </span>
                  </div>
                </div>
              </div>

              <p className="login-text small mt-4">
                Public certificate verification remains available without
                signing in.
              </p>
            </section>

          <Card className="login-card">
            <div className="login-card-body">
              <div className="text-center mb-4">
                <div className="login-card-logo">
                  <BrandLogo size="md" showText={false} />
                </div>

                <h2 className="login-card-title">Sign in</h2>

                <p className="login-muted mb-0">
                  Use the account approved for your BlockCred workspace.
                </p>
              </div>

              {message.text && (
                <AlertMessage type={message.type} message={message.text} />
              )}

              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label className="login-form-label">Email address</label>

                  <div className="login-input-wrap">
                    <FaEnvelope className="login-input-icon" />

                    <input
                      type="email"
                      className="login-input"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <div className="login-form-row">
                    <label className="login-form-label">Password</label>
                    <button
                      type="button"
                      className="login-reset-link"
                      onClick={handleForgotPassword}
                      disabled={loading || resetLoading}
                    >
                      {resetLoading ? "Sending..." : "Forgot password?"}
                    </button>
                  </div>

                  <div className="login-input-wrap">
                    <FaLock className="login-input-icon" />

                    <input
                      type={showPassword ? "text" : "password"}
                      className="login-input login-password-input"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      disabled={loading}
                      required
                    />

                    <button
                      type="button"
                      className="login-password-toggle"
                      onClick={() => setShowPassword((previous) => !previous)}
                      disabled={loading}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <ActionButton
                  type="submit"
                  variant="primary"
                  className="login-submit-button mt-2"
                  disabled={!formIsReady}
                >
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm"
                        role="status"
                        aria-hidden="true"
                      />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <FaSignInAlt />
                    </>
                  )}
                </ActionButton>
              </form>
            </div>

            <div className="login-actions">
              <ActionButton
                variant="ghost"
                className="w-100"
                onClick={() => navigate("/register-student")}
              >
                <FaUserGraduate />
                Create Student Account
              </ActionButton>

              <ActionButton
                variant="ghost"
                className="w-100"
                onClick={() => navigate("/public-verifier")}
              >
                <FaSearch />
                Public Verifier
              </ActionButton>
            </div>
          </Card>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default Login;
