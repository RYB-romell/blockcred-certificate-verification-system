import { useEffect, useMemo, useState } from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import {
  FaBuilding,
  FaCreditCard,
  FaEnvelope,
  FaIdBadge,
  FaLock,
  FaMoon,
  FaPhone,
  FaShieldAlt,
  FaSun,
  FaUserCircle,
} from "react-icons/fa";
import { auth } from "../firebase.js";
import { authFetch } from "../api.js";
import { institutionConfig } from "../config/institution.js";
import { useTheme } from "../context/ThemeContext.js";
import { getInstitutionSettings } from "../services/institutionSettingsService.js";
import AdminPageShell from "../components/layout/AdminPageShell.js";
import Layout from "../components/Layout.js";
import ActionButton from "../components/ui/ActionButton.js";
import AlertMessage from "../components/ui/AlertMessage.js";
import Card from "../components/ui/Card.js";
import PageHeader from "../components/ui/PageHeader.js";
import StatusBadge from "../components/ui/StatusBadge.js";

const emptyPasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const emptyStudentProfileForm = {
  name: "",
  contact: "",
  phone: "",
  address: "",
  department: "",
  programme: "",
  level: "",
};

const fallbackInstitutionSettings = {
  institution_name: institutionConfig.institutionName,
  institution_email: institutionConfig.institutionEmail,
  institution_phone: institutionConfig.institutionPhone,
  institution_address: institutionConfig.institutionAddress,
  verification_system_name: institutionConfig.verificationSystemName,
  support_email: institutionConfig.supportEmail || institutionConfig.institutionEmail,
  support_phone: institutionConfig.supportPhone || institutionConfig.institutionPhone,
  certificate_access_fee: institutionConfig.certificateAccessFee || 5000,
  currency: institutionConfig.currency || "XAF",
};

const formatDate = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleString();
};

const buildStudentProfileForm = (student = {}) => ({
  name: student.name || "",
  contact: student.contact || "",
  phone: student.phone || "",
  address: student.address || "",
  department: student.department || "",
  programme: student.programme || "",
  level: student.level || "",
});

const DetailRow = ({ label, value, icon, compact = false }) => (
  <div className="profile-detail-row">
    <span className="profile-detail-icon">{icon}</span>
    <div>
      <p className="profile-detail-label">{label}</p>
      <p
        className={`profile-detail-value ${compact ? "profile-detail-compact" : ""}`}
        title={value || "Not available"}
      >
        {value || "Not available"}
      </p>
    </div>
  </div>
);

const Profile = () => {
  const { theme, setTheme } = useTheme();
  const [claims, setClaims] = useState({});
  const [studentRecord, setStudentRecord] = useState(null);
  const [institutionSettings, setInstitutionSettings] = useState(
    fallbackInstitutionSettings
  );
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [studentProfileForm, setStudentProfileForm] = useState(
    emptyStudentProfileForm
  );
  const [editingStudentProfile, setEditingStudentProfile] = useState(false);
  const [savingStudentProfile, setSavingStudentProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const currentUser = auth.currentUser;
  const role = claims.role || claims.user_role || "student";
  const isStudent = role === "student";
  const isPasswordAccount = Boolean(
    currentUser?.providerData?.some((provider) => provider.providerId === "password")
  );

  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser) {
        setLoadingProfile(false);
        return;
      }

      setLoadingProfile(true);

      try {
        try {
          const settingsData = await getInstitutionSettings();
          setInstitutionSettings({
            ...fallbackInstitutionSettings,
            ...(settingsData.settings || {}),
          });
        } catch (settingsError) {
          console.warn("Institution settings fallback used:", settingsError);
          setInstitutionSettings(fallbackInstitutionSettings);
        }

        const token = await currentUser.getIdTokenResult(true);
        const nextClaims = token.claims || {};
        setClaims(nextClaims);

        const nextRole = nextClaims.role || nextClaims.user_role || "student";

        if (nextRole === "student" && currentUser.email) {
          let response = await authFetch("/api/students/me");
          let data = await response.json();

          if (!response.ok) {
            response = await authFetch(
              `/api/students/${encodeURIComponent(currentUser.email)}`
            );
            data = await response.json();
          }

          if (response.ok) {
            const nextStudent = data?.student || data?.data || data;
            setStudentRecord(nextStudent);
            setStudentProfileForm(buildStudentProfileForm(nextStudent));
          }
        }
      } catch (error) {
        console.error("Profile load error:", error);
        setMessage({
          type: "warning",
          text: "Some profile details could not be loaded.",
        });
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [currentUser]);

  const accountName = useMemo(() => {
    return (
      currentUser?.displayName ||
      studentRecord?.name ||
      claims.name ||
      currentUser?.email ||
      "BlockCred user"
    );
  }, [claims.name, currentUser, studentRecord]);

  const updatePasswordField = (field, value) => {
    setPasswordForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const updateStudentProfileField = (field, value) => {
    setStudentProfileForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleCancelStudentProfileEdit = () => {
    setStudentProfileForm(buildStudentProfileForm(studentRecord));
    setEditingStudentProfile(false);
  };

  const handleStudentProfileSave = async (event) => {
    event.preventDefault();

    if (!isStudent) return;

    setSavingStudentProfile(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await authFetch("/api/students/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(studentProfileForm),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Could not update your profile.");
      }

      const nextStudent = data?.student || studentRecord;
      setStudentRecord(nextStudent);
      setStudentProfileForm(buildStudentProfileForm(nextStudent));
      setEditingStudentProfile(false);
      setMessage({
        type: "success",
        text: data?.message || "Profile updated successfully.",
      });
    } catch (error) {
      console.error("Student profile update error:", error);
      setMessage({
        type: "error",
        text:
          error.message ||
          "Could not update your profile. Please try again or contact support.",
      });
    } finally {
      setSavingStudentProfile(false);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();

    if (!currentUser?.email) {
      setMessage({
        type: "error",
        text: "Password change requires an email/password account.",
      });
      return;
    }

    if (!isPasswordAccount) {
      setMessage({
        type: "info",
        text: "Password change is only available for email/password accounts.",
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({
        type: "warning",
        text: "New password must be at least 6 characters.",
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({
        type: "warning",
        text: "New password and confirmation do not match.",
      });
      return;
    }

    setChangingPassword(true);

    try {
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        passwordForm.currentPassword
      );

      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, passwordForm.newPassword);

      setPasswordForm(emptyPasswordForm);
      setMessage({
        type: "success",
        text: "Password updated successfully.",
      });
    } catch (error) {
      console.error("Password change error:", error);
      setMessage({
        type: "error",
        text:
          error?.code === "auth/wrong-password" ||
          error?.code === "auth/invalid-credential"
            ? "Current password is incorrect."
            : "Could not update password. Please sign in again and retry.",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const profileStatusBadge = (
    <StatusBadge
      status={`${role.charAt(0).toUpperCase()}${role.slice(1)} account`}
      type={role === "admin" ? "valid" : "linked"}
    />
  );

  if (loadingProfile) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "2rem",
          background: "var(--bc-bg)",
        }}
      >
        <Card style={{ width: "min(100%, 420px)", padding: "1.25rem" }}>
          <div className="d-flex align-items-center gap-3">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <div>
              <p className="fw-bold mb-1">Loading profile</p>
              <p className="bc-page-muted small mb-0">
                Preparing your account workspace...
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const profileContent = (
    <>
      <style>{`
        .profile-page {
          min-height: calc(100vh - 64px);
          padding: var(--bc-space-7) var(--bc-space-6) calc(var(--bc-space-16) + 40px);
          background:
            radial-gradient(circle at top right, rgba(29, 78, 216, 0.1), transparent 34rem),
            var(--bc-bg);
        }

        .profile-page-admin {
          min-height: auto;
          padding: 0 0 var(--bc-space-8);
          background: transparent;
        }

        .profile-page-admin .profile-page {
          min-height: auto;
          padding: 0;
          background: transparent;
        }

        .profile-container {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
        }

        .profile-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
          gap: 1.5rem;
          align-items: start;
        }

        .profile-card-title {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          margin: 0 0 1.2rem;
          font-size: 1rem;
          font-weight: 850;
          color: var(--bc-text);
        }

        .profile-detail-row {
          display: flex;
          align-items: flex-start;
          gap: 0.85rem;
          padding: 0.78rem 0;
          border-bottom: 1px solid var(--bc-border);
        }

        .profile-detail-row:last-child {
          border-bottom: 0;
        }

        .profile-detail-icon {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: var(--bc-accent-soft);
          color: var(--bc-accent);
          flex-shrink: 0;
        }

        .profile-detail-label {
          margin: 0 0 0.08rem;
          color: var(--bc-muted);
          font-size: 0.74rem;
          font-weight: 800;
          text-transform: uppercase;
        }

        .profile-detail-value {
          margin: 0;
          color: var(--bc-text);
          font-weight: 700;
          overflow-wrap: anywhere;
        }

        .profile-detail-compact {
          max-width: min(100%, 440px);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-family: var(--bc-font-mono);
          font-size: 0.86rem;
        }

        .profile-form-label {
          display: block;
          margin-bottom: 0.5rem;
          color: var(--bc-text);
          font-weight: 800;
        }

        .profile-theme-toggle {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        .profile-support-card {
          display: grid;
          gap: 0.75rem;
        }

        .profile-student-card-note {
          margin: -0.45rem 0 1rem;
          color: var(--bc-muted);
          font-size: 0.9rem;
          line-height: 1.55;
        }

        .profile-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1rem;
        }

        .profile-form-grid .full {
          grid-column: 1 / -1;
        }

        .profile-read-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.85rem;
        }

        .profile-read-tile {
          padding: 0.9rem;
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-md);
          background: var(--bc-surface-soft);
        }

        .profile-read-tile span {
          display: block;
          margin-bottom: 0.22rem;
          color: var(--bc-muted);
          font-size: 0.72rem;
          font-weight: 850;
          text-transform: uppercase;
        }

        .profile-read-tile strong {
          display: block;
          color: var(--bc-text);
          font-size: 0.94rem;
          overflow-wrap: anywhere;
        }

        .profile-technical-details {
          margin-top: 0.95rem;
          padding-top: 0.95rem;
          border-top: 1px solid var(--bc-border);
        }

        .profile-technical-details summary {
          cursor: pointer;
          color: var(--bc-muted);
          font-size: 0.84rem;
          font-weight: 800;
        }

        .profile-technical-code {
          display: block;
          margin-top: 0.65rem;
          padding: 0.75rem;
          border-radius: var(--bc-radius-sm);
          background: var(--bc-surface-soft);
          color: var(--bc-text);
          font-family: var(--bc-font-mono);
          font-size: 0.82rem;
          overflow-wrap: anywhere;
        }

        .profile-form-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-top: 1rem;
        }

        @media (max-width: 900px) {
          .profile-page {
            padding: var(--bc-space-4) var(--bc-space-4) calc(var(--bc-space-12) + 28px);
          }

          .profile-grid {
            grid-template-columns: 1fr;
          }

          .profile-form-grid,
          .profile-read-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <main className="profile-page">
        <div className="profile-container">
          {role !== "admin" && (
            <PageHeader
              title="Account Profile"
              subtitle="Manage your BlockCred account, institution details, password, and appearance."
              actions={profileStatusBadge}
            />
          )}

          <AlertMessage
            type={message.type}
            message={message.text}
            onClose={() => setMessage({ type: "", text: "" })}
          />

          <section className="profile-grid">
            <div className="d-grid gap-3">
              <Card>
                <h2 className="profile-card-title">
                  <FaUserCircle />
                  {isStudent ? "Student account" : "Account details"}
                </h2>

                {loadingProfile ? (
                  <p className="bc-page-muted mb-0">Loading profile details...</p>
                ) : (
                  <>
                    <DetailRow
                      label="Name"
                      value={accountName}
                      icon={<FaUserCircle />}
                    />
                    <DetailRow
                      label="Email"
                      value={currentUser?.email}
                      icon={<FaEnvelope />}
                    />
                    <DetailRow
                      label="Role"
                      value={role}
                      icon={<FaIdBadge />}
                    />
                    {isStudent && (
                      <>
                        <DetailRow
                          label="Student ID"
                          value={studentRecord?.student_id || claims.student_id}
                          icon={<FaIdBadge />}
                        />
                        <DetailRow
                          label="Subscription status"
                          value={studentRecord?.subscription_status}
                          icon={<FaShieldAlt />}
                        />
                      </>
                    )}
                    <DetailRow
                      label="Created date"
                      value={formatDate(currentUser?.metadata?.creationTime)}
                      icon={<FaIdBadge />}
                    />
                    {isStudent ? (
                      <details className="profile-technical-details">
                        <summary>Technical account details</summary>
                        <code className="profile-technical-code">
                          Firebase UID: {currentUser?.uid || "Not available"}
                        </code>
                      </details>
                    ) : (
                      <DetailRow
                        label="Firebase UID"
                        value={currentUser?.uid}
                        icon={<FaLock />}
                        compact
                      />
                    )}
                  </>
                )}
              </Card>

              {isStudent && (
                <Card>
                  <div className="d-flex flex-column flex-sm-row justify-content-between gap-3 mb-2">
                    <div>
                      <h2 className="profile-card-title mb-2">
                        <FaIdBadge />
                        Personal details
                      </h2>
                      <p className="profile-student-card-note">
                        Keep your student contact and programme details current.
                        Your Student ID, login email, access status, and account
                        link are managed by the institution.
                      </p>
                    </div>
                    {!editingStudentProfile && (
                      <ActionButton
                        variant="secondary"
                        onClick={() => setEditingStudentProfile(true)}
                      >
                        Edit Details
                      </ActionButton>
                    )}
                  </div>

                  {editingStudentProfile ? (
                    <form onSubmit={handleStudentProfileSave}>
                      <div className="profile-form-grid">
                        <div>
                          <label className="profile-form-label" htmlFor="student-name">
                            Full name
                          </label>
                          <input
                            id="student-name"
                            className="bc-input"
                            type="text"
                            value={studentProfileForm.name}
                            onChange={(event) =>
                              updateStudentProfileField("name", event.target.value)
                            }
                            required
                          />
                        </div>
                        <div>
                          <label className="profile-form-label" htmlFor="student-phone">
                            Phone
                          </label>
                          <input
                            id="student-phone"
                            className="bc-input"
                            type="text"
                            value={studentProfileForm.phone}
                            onChange={(event) =>
                              updateStudentProfileField("phone", event.target.value)
                            }
                            placeholder="Optional"
                          />
                        </div>
                        <div>
                          <label
                            className="profile-form-label"
                            htmlFor="student-contact"
                          >
                            Alternate contact
                          </label>
                          <input
                            id="student-contact"
                            className="bc-input"
                            type="text"
                            value={studentProfileForm.contact}
                            onChange={(event) =>
                              updateStudentProfileField("contact", event.target.value)
                            }
                            placeholder="Optional"
                          />
                        </div>
                        <div>
                          <label
                            className="profile-form-label"
                            htmlFor="student-department"
                          >
                            Department
                          </label>
                          <input
                            id="student-department"
                            className="bc-input"
                            type="text"
                            value={studentProfileForm.department}
                            onChange={(event) =>
                              updateStudentProfileField(
                                "department",
                                event.target.value
                              )
                            }
                            placeholder="Optional"
                          />
                        </div>
                        <div>
                          <label
                            className="profile-form-label"
                            htmlFor="student-programme"
                          >
                            Programme
                          </label>
                          <input
                            id="student-programme"
                            className="bc-input"
                            type="text"
                            value={studentProfileForm.programme}
                            onChange={(event) =>
                              updateStudentProfileField(
                                "programme",
                                event.target.value
                              )
                            }
                            placeholder="Optional"
                          />
                        </div>
                        <div>
                          <label className="profile-form-label" htmlFor="student-level">
                            Level
                          </label>
                          <input
                            id="student-level"
                            className="bc-input"
                            type="text"
                            value={studentProfileForm.level}
                            onChange={(event) =>
                              updateStudentProfileField("level", event.target.value)
                            }
                            placeholder="Optional"
                          />
                        </div>
                        <div className="full">
                          <label
                            className="profile-form-label"
                            htmlFor="student-address"
                          >
                            Address
                          </label>
                          <textarea
                            id="student-address"
                            className="bc-input"
                            rows="3"
                            value={studentProfileForm.address}
                            onChange={(event) =>
                              updateStudentProfileField("address", event.target.value)
                            }
                            placeholder="Optional"
                          />
                        </div>
                      </div>
                      <div className="profile-form-actions">
                        <ActionButton
                          type="submit"
                          variant="primary"
                          loading={savingStudentProfile}
                        >
                          Save Profile
                        </ActionButton>
                        <ActionButton
                          type="button"
                          variant="secondary"
                          disabled={savingStudentProfile}
                          onClick={handleCancelStudentProfileEdit}
                        >
                          Cancel
                        </ActionButton>
                      </div>
                    </form>
                  ) : (
                    <div className="profile-read-grid">
                      <div className="profile-read-tile">
                        <span>Phone</span>
                        <strong>{studentRecord?.phone || "Not configured"}</strong>
                      </div>
                      <div className="profile-read-tile">
                        <span>Alternate contact</span>
                        <strong>{studentRecord?.contact || "Not configured"}</strong>
                      </div>
                      <div className="profile-read-tile">
                        <span>Department</span>
                        <strong>
                          {studentRecord?.department || "Not configured"}
                        </strong>
                      </div>
                      <div className="profile-read-tile">
                        <span>Programme</span>
                        <strong>{studentRecord?.programme || "Not configured"}</strong>
                      </div>
                      <div className="profile-read-tile">
                        <span>Level</span>
                        <strong>{studentRecord?.level || "Not configured"}</strong>
                      </div>
                      <div className="profile-read-tile">
                        <span>Address</span>
                        <strong>{studentRecord?.address || "Not configured"}</strong>
                      </div>
                    </div>
                  )}
                </Card>
              )}

              <Card>
                <h2 className="profile-card-title">
                  <FaBuilding />
                  Institution details
                </h2>
                <DetailRow
                  label="Institution name"
                  value={institutionSettings.institution_name}
                  icon={<FaBuilding />}
                />
                <DetailRow
                  label="Institution email"
                  value={institutionSettings.institution_email}
                  icon={<FaEnvelope />}
                />
                <DetailRow
                  label="Institution phone"
                  value={institutionSettings.institution_phone}
                  icon={<FaPhone />}
                />
                <DetailRow
                  label="Institution address"
                  value={institutionSettings.institution_address}
                  icon={<FaBuilding />}
                />
                <DetailRow
                  label="Verification system"
                  value={institutionSettings.verification_system_name}
                  icon={<FaIdBadge />}
                />
                <DetailRow
                  label="Support email"
                  value={institutionSettings.support_email}
                  icon={<FaEnvelope />}
                />
                <DetailRow
                  label="Support phone"
                  value={institutionSettings.support_phone}
                  icon={<FaPhone />}
                />
                <DetailRow
                  label="Certificate access fee"
                  value={`${Number(
                    institutionSettings.certificate_access_fee || 0
                  ).toLocaleString()} ${institutionSettings.currency || "XAF"}`}
                  icon={<FaCreditCard />}
                />
              </Card>
            </div>

            <div className="d-grid gap-3 align-content-start">
              <Card>
                <h2 className="profile-card-title">
                  <FaMoon />
                  Appearance
                </h2>
                <p className="bc-page-muted">
                  Current mode:{" "}
                  <strong>{theme === "dark" ? "Dark" : "Light"}</strong>
                </p>
                <div className="profile-theme-toggle">
                  <ActionButton
                    variant={theme === "light" ? "primary" : "secondary"}
                    onClick={() => setTheme("light")}
                    aria-label="Switch to light mode"
                  >
                    <FaSun />
                    Light Mode
                  </ActionButton>
                  <ActionButton
                    variant={theme === "dark" ? "primary" : "secondary"}
                    onClick={() => setTheme("dark")}
                    aria-label="Switch to dark mode"
                  >
                    <FaMoon />
                    Dark Mode
                  </ActionButton>
                </div>
              </Card>

              <Card>
                <h2 className="profile-card-title">
                  <FaLock />
                  Change password
                </h2>

                {!isPasswordAccount ? (
                  <p className="bc-page-muted mb-0">
                    Password change is only available for email/password
                    accounts.
                  </p>
                ) : (
                  <form onSubmit={handlePasswordChange}>
                    <div className="mb-3">
                      <label className="profile-form-label" htmlFor="current-password">
                        Current password
                      </label>
                      <input
                        id="current-password"
                        className="bc-input"
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(event) =>
                          updatePasswordField("currentPassword", event.target.value)
                        }
                        autoComplete="current-password"
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="profile-form-label" htmlFor="new-password">
                        New password
                      </label>
                      <input
                        id="new-password"
                        className="bc-input"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(event) =>
                          updatePasswordField("newPassword", event.target.value)
                        }
                        autoComplete="new-password"
                        minLength={6}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label
                        className="profile-form-label"
                        htmlFor="confirm-new-password"
                      >
                        Confirm new password
                      </label>
                      <input
                        id="confirm-new-password"
                        className="bc-input"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(event) =>
                          updatePasswordField(
                            "confirmPassword",
                            event.target.value
                          )
                        }
                        autoComplete="new-password"
                        minLength={6}
                        required
                      />
                    </div>
                    <ActionButton
                      type="submit"
                      variant="primary"
                      loading={changingPassword}
                      className="w-100"
                      aria-label="Update account password"
                    >
                      Update Password
                    </ActionButton>
                  </form>
                )}
              </Card>
            </div>
          </section>
        </div>
      </main>
    </>
  );

  if (role === "admin") {
    return (
      <AdminPageShell
        title="Account Profile"
        subtitle="Manage your BlockCred account, institution details, password, and appearance."
        actions={profileStatusBadge}
      >
        <div className="profile-page-admin">{profileContent}</div>
      </AdminPageShell>
    );
  }

  return (
    <Layout user={role} role={role}>
      {profileContent}
    </Layout>
  );
};

export default Profile;
