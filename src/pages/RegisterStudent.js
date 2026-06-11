// src/pages/RegisterStudent.js

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  FaCheckCircle,
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaIdCard,
  FaLock,
  FaRedo,
  FaSignInAlt,
  FaUserGraduate,
} from "react-icons/fa";
import { auth } from "../firebase.js";
import { authFetch, publicFetch } from "../api.js";
import Layout from "../components/Layout.js";
import ActionButton from "../components/ui/ActionButton.js";
import AlertMessage from "../components/ui/AlertMessage.js";
import Card from "../components/ui/Card.js";
import StatusBadge from "../components/ui/StatusBadge.js";
import BrandLogo from "../components/BrandLogo.js";

const RegisterStudent = () => {
  const navigate = useNavigate();

  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [studentRecord, setStudentRecord] = useState(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  const showMessage = (type, text) => {
    setMessage({ type, text });
  };

  const passwordChecks = useMemo(() => {
    return {
      length: password.length >= 6,
      match: password.length > 0 && password === confirmPassword,
      hasLetter: /[a-zA-Z]/.test(password),
      hasNumber: /\d/.test(password),
    };
  }, [password, confirmPassword]);

  const passwordStrength = useMemo(() => {
    const score = Object.values(passwordChecks).filter(Boolean).length;

    if (!password) {
      return {
        label: "Not started",
        percent: 0,
        className: "bg-secondary",
      };
    }

    if (score <= 1) {
      return {
        label: "Weak",
        percent: 30,
        className: "bg-danger",
      };
    }

    if (score <= 3) {
      return {
        label: "Good",
        percent: 70,
        className: "bg-warning",
      };
    }

    return {
      label: "Strong",
      percent: 100,
      className: "bg-success",
    };
  }, [password, passwordChecks]);

  const verifyStudentRecord = async (event) => {
    event.preventDefault();

    const finalStudentId = studentId.trim();
    const finalEmail = email.trim().toLowerCase();

    if (!finalStudentId) {
      showMessage("warning", "Student ID is required.");
      return;
    }

    if (!finalEmail) {
      showMessage("warning", "Student email is required.");
      return;
    }

    if (!finalEmail.includes("@")) {
      showMessage("warning", "Please enter a valid student email.");
      return;
    }

    setLoading(true);
    setStudentRecord(null);
    showMessage("info", "Checking student record...");

    try {
      const response = await publicFetch("/api/students/precheck", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          student_id: finalStudentId,
          email: finalEmail,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Student verification failed.");
      }

      const verifiedStudent = result.student || result.data || result;

      setStudentRecord(verifiedStudent);
      setStudentId(verifiedStudent?.student_id || finalStudentId);
      setEmail(verifiedStudent?.email || finalEmail);
      setStep(2);

      showMessage("success", "Student record verified.");
    } catch (error) {
      console.error("Student verification error:", error);
      showMessage("error", error.message || "Student verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const createStudentAccount = async (event) => {
    event.preventDefault();

    if (!studentRecord) {
      showMessage("error", "Please verify your student record first.");
      return;
    }

    if (password.length < 6) {
      showMessage("warning", "Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      showMessage("warning", "Passwords do not match.");
      return;
    }

    setLoading(true);
    showMessage("info", "Creating account...");

    try {
      const finalStudentId = String(studentRecord.student_id || "").trim();

      const finalEmail = String(studentRecord.email || "")
        .trim()
        .toLowerCase();

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        finalEmail,
        password
      );

      await userCredential.user.getIdToken(true);

      showMessage("info", "Linking student account...");

      const response = await authFetch("/api/students/link-firebase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          student_id: finalStudentId,
          email: finalEmail,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not link Firebase account.");
      }

      showMessage("success", "Account created successfully. Redirecting...");

      setTimeout(() => {
        navigate("/dashboard");
      }, 900);
    } catch (error) {
      console.error("Create account error:", error);

      if (error?.code === "auth/email-already-in-use") {
        showMessage(
          "error",
          "This email already has an account. Please sign in instead."
        );
      } else if (error?.code === "auth/invalid-email") {
        showMessage("error", "The student email address is invalid.");
      } else if (error?.code === "auth/weak-password") {
        showMessage("error", "Password is too weak. Use at least 6 characters.");
      } else {
        showMessage("error", error.message || "Failed to create account.");
      }
    } finally {
      setLoading(false);
    }
  };

  const goBackToStepOne = () => {
    setStep(1);
    setStudentRecord(null);
    setPassword("");
    setConfirmPassword("");
    showMessage("info", "You can verify another student record.");
  };

  return (
    <Layout user={null}>
      <style>{`
        .register-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(37, 99, 235, 0.12), transparent 34rem),
            var(--bc-page-bg);
          padding: 3rem 1.25rem 4rem;
        }

        .register-container {
          max-width: 1120px;
          margin: 0 auto;
        }

        .register-shell {
          display: grid;
          grid-template-columns: minmax(0, 0.85fr) minmax(460px, 1fr);
          gap: 1.75rem;
          align-items: start;
        }

        .register-intro {
          border-radius: var(--bc-radius-section);
          border: 1px solid rgba(255, 255, 255, 0.14);
          background:
            linear-gradient(135deg, rgba(15, 23, 42, 0.97), rgba(29, 78, 216, 0.9));
          box-shadow: var(--bc-shadow-lg);
          color: #ffffff;
          padding: 1.5rem;
          min-height: 620px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .register-label {
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

        .register-title {
          font-size: clamp(2rem, 4vw, 3.2rem);
          font-weight: 850;
          letter-spacing: 0;
          color: #0f172a;
          line-height: 1;
          margin-bottom: 0.85rem;
        }

        .register-text {
          color: #64748b;
          font-size: 1rem;
          line-height: 1.7;
          margin-bottom: 0;
        }

        .register-card {
          background: var(--bc-surface);
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-xl);
          box-shadow: var(--bc-shadow-md);
          overflow: hidden;
        }

        .register-card-head {
          padding: 1.45rem;
          border-bottom: 1px solid var(--bc-border);
          background: var(--bc-surface-soft);
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          align-items: flex-start;
        }

        .register-step-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.42rem 0.7rem;
          border-radius: 999px;
          background: var(--bc-soft-blue);
          color: var(--bc-primary);
          font-size: 0.78rem;
          font-weight: 850;
          white-space: nowrap;
        }

        .register-body {
          padding: 1.45rem;
        }

        .register-muted {
          color: var(--bc-muted);
        }

        .register-form-label {
          display: block;
          font-weight: 800;
          color: var(--bc-text-soft);
          font-size: 0.84rem;
          margin-bottom: 0.55rem;
        }

        .register-input-wrap {
          position: relative;
        }

        .register-input-icon {
          position: absolute;
          left: 0.9rem;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
        }

        .register-input {
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

        .register-input:focus {
          border-color: var(--bc-primary);
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.08);
        }

        .register-password-input {
          padding-right: 2.55rem;
        }

        .register-password-toggle {
          position: absolute;
          right: 0.85rem;
          top: 50%;
          transform: translateY(-50%);
          border: 0;
          background: transparent;
          color: #64748b;
          padding: 0;
        }

        .register-btn {
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

        .register-btn:hover {
          background: #1e293b;
          border-color: #1e293b;
        }

        .register-btn-success {
          background: #059669;
          border-color: #059669;
        }

        .register-btn-success:hover {
          background: #047857;
          border-color: #047857;
        }

        .register-btn-outline {
          background: #ffffff;
          color: #334155;
          border-color: #e2e8f0;
        }

        .register-btn-outline:hover {
          background: #f8fafc;
          color: #ffffff;
          border-color: #cbd5e1;
        }

        .register-action-button {
          width: 100%;
          min-height: 46px !important;
        }

        .register-info {
          background: var(--bc-surface-soft);
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-lg);
          padding: 1rem;
        }

        .register-record {
          background: #ecfdf5;
          border-bottom: 1px solid #bbf7d0;
          padding: 1rem 1.25rem;
        }

        .register-record-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.85rem;
        }

        .register-record-label {
          font-size: 0.75rem;
          color: #047857;
          font-weight: 700;
          margin-bottom: 0.2rem;
        }

        .register-record-value {
          margin-bottom: 0;
          color: #064e3b;
          font-weight: 850;
          word-break: break-word;
        }

        .register-check {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #cbd5e1;
          font-size: 0.86rem;
          margin-bottom: 0.5rem;
        }

        .register-check.ok {
          color: #059669;
          font-weight: 750;
        }

        .register-actions {
          background: var(--bc-surface-soft);
          border-top: 1px solid var(--bc-border);
          padding: 1.15rem 1.45rem 1.45rem;
        }

        .register-steps {
          display: grid;
          gap: 0.75rem;
          margin-top: 1.25rem;
        }

        .register-step {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 0.75rem;
          align-items: start;
          padding: 0.9rem;
          border-radius: var(--bc-radius-lg);
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.08);
        }

        .register-step-index {
          width: 32px;
          height: 32px;
          border-radius: var(--bc-radius-md);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.14);
          color: #bfdbfe;
          font-weight: 900;
        }

        .register-step strong {
          color: #ffffff;
          display: block;
          margin-bottom: 0.2rem;
        }

        .register-step span {
          color: #cbd5e1;
          font-size: 0.86rem;
        }

        .register-note {
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: var(--bc-radius-lg);
          background: rgba(255, 255, 255, 0.08);
          padding: 1rem;
          color: #dbeafe;
        }

        @media(max-width: 768px) {
          .register-page {
            padding: 2.5rem 1rem 3.5rem;
          }

          .register-shell {
            grid-template-columns: 1fr;
          }

          .register-intro {
            min-height: auto;
          }

          .register-card-head {
            flex-direction: column;
          }

          .register-record-grid {
            grid-template-columns: 1fr;
          }

          .register-action-button,
          .register-actions .bc-button {
            width: 100%;
          }
        }
      `}</style>

      <main className="register-page">
        <div className="register-container">
          <div className="register-shell">
            <section className="register-intro">
              <div>
                <BrandLogo size="lg" variant="light" />

                <div className="register-label mt-4">
                  <FaUserGraduate />
                  Student onboarding
                </div>

                <h1 className="register-title">Create Student Account</h1>

                <p className="register-text">
                  Link your approved student record to a secure login.
                </p>

                <div className="register-steps">
                  <div className="register-step">
                    <span className="register-step-index">1</span>
                    <span>
                      <strong>Verify Student Record</strong>
                      Confirm your institutional student ID and email.
                    </span>
                  </div>

                  <div className="register-step">
                    <span className="register-step-index">2</span>
                    <span>
                      <strong>Create Secure Login</strong>
                      Create a Firebase-authenticated student account.
                    </span>
                  </div>

                  <div className="register-step">
                    <span className="register-step-index">3</span>
                    <span>
                      <strong>Access Credential Wallet</strong>
                      Open your certificate wallet after registration.
                    </span>
                  </div>
                </div>
              </div>

              <div className="register-note mt-4">
                <strong className="d-block mb-1">
                  Institution-approved access only
                </strong>
                Only students already added by the institution can create an
                account.
              </div>
            </section>

            <section>

          {message.text && (
            <AlertMessage type={message.type} message={message.text} />
          )}

          <Card className="register-card">
            <div className="register-card-head">
              <div>
                <h2 className="h4 fw-bold mb-1">
                  {step === 1
                    ? "Step 1: Verify Student Record"
                    : "Step 2: Create Secure Login"}
                </h2>

                <p className="register-muted mb-0">
                  {step === 1
                    ? "Use the Student ID and email approved by your institution."
                    : "Your approved student record has been verified."}
                </p>
              </div>

              <span className="register-step-badge">
                {step === 1 ? <FaIdCard /> : <FaLock />}
                Step {step} of 3
              </span>
            </div>

            {step === 1 && (
              <form onSubmit={verifyStudentRecord} className="register-body">
                <div className="mb-3">
                  <label className="register-form-label">Student ID</label>

                  <div className="register-input-wrap">
                    <FaIdCard className="register-input-icon" />

                    <input
                      className="register-input"
                      placeholder="eg. CT23A003"
                      value={studentId}
                      onChange={(event) => setStudentId(event.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="register-form-label">Student email</label>

                  <div className="register-input-wrap">
                    <FaEnvelope className="register-input-icon" />

                    <input
                      type="email"
                      className="register-input"
                      placeholder="student@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <ActionButton
                  type="submit"
                  variant="primary"
                  className="register-action-button"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" />
                      Checking account details...
                    </>
                  ) : (
                    <>
                      Verify Student Record
                      <FaCheckCircle />
                    </>
                  )}
                </ActionButton>
              </form>
            )}

            {step === 2 && studentRecord && (
              <>
                <div className="register-record">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <StatusBadge
                      status="Student account verified"
                      type="successful"
                    />
                  </div>

                  <div className="register-record-grid">
                    <div>
                      <p className="register-record-label">Name</p>
                      <p className="register-record-value">
                        {studentRecord.name || "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="register-record-label">Student ID</p>
                      <p className="register-record-value font-monospace">
                        {studentRecord.student_id || "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="register-record-label">Email</p>
                      <p className="register-record-value">
                        {studentRecord.email || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={createStudentAccount} className="register-body">
                  <div className="mb-3">
                    <label className="register-form-label">Password</label>

                    <div className="register-input-wrap">
                      <FaLock className="register-input-icon" />

                      <input
                        type={showPassword ? "text" : "password"}
                        className="register-input register-password-input"
                        placeholder="Create password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        disabled={loading}
                        required
                      />

                      <button
                        type="button"
                        className="register-password-toggle"
                        onClick={() => setShowPassword((previous) => !previous)}
                        disabled={loading}
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="register-form-label">
                      Confirm password
                    </label>

                    <div className="register-input-wrap">
                      <FaLock className="register-input-icon" />

                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        className="register-input register-password-input"
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(event) =>
                          setConfirmPassword(event.target.value)
                        }
                        disabled={loading}
                        required
                      />

                      <button
                        type="button"
                        className="register-password-toggle"
                        onClick={() =>
                          setShowConfirmPassword((previous) => !previous)
                        }
                        disabled={loading}
                        aria-label="Toggle confirm password visibility"
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  <div className="register-info mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <strong>Password strength</strong>
                      <span className="register-muted small">
                        {passwordStrength.label}
                      </span>
                    </div>

                    <div className="progress rounded-pill mb-3" style={{ height: 8 }}>
                      <div
                        className={`progress-bar ${passwordStrength.className}`}
                        style={{ width: `${passwordStrength.percent}%` }}
                      />
                    </div>

                    <div
                      className={
                        passwordChecks.length
                          ? "register-check ok"
                          : "register-check"
                      }
                    >
                      <FaCheckCircle />
                      At least 6 characters
                    </div>

                    <div
                      className={
                        passwordChecks.hasLetter
                          ? "register-check ok"
                          : "register-check"
                      }
                    >
                      <FaCheckCircle />
                      Contains a letter
                    </div>

                    <div
                      className={
                        passwordChecks.hasNumber
                          ? "register-check ok"
                          : "register-check"
                      }
                    >
                      <FaCheckCircle />
                      Contains a number
                    </div>

                    <div
                      className={
                        passwordChecks.match
                          ? "register-check ok"
                          : "register-check"
                      }
                    >
                      <FaCheckCircle />
                      Passwords match
                    </div>
                  </div>

                  <ActionButton
                    type="submit"
                    variant="primary"
                    className="register-action-button"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create account
                        <FaUserGraduate />
                      </>
                    )}
                  </ActionButton>

                  <ActionButton
                    onClick={goBackToStepOne}
                    variant="ghost"
                    className="register-action-button mt-3"
                    disabled={loading}
                  >
                    <FaRedo />
                    Verify another account
                  </ActionButton>
                </form>
              </>
            )}

            <div className="register-actions">
              <ActionButton
                onClick={() => navigate("/login")}
                variant="ghost"
                className="register-action-button"
              >
                <FaSignInAlt />
                Already have an account? Sign in
              </ActionButton>
            </div>
          </Card>
            </section>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default RegisterStudent;
