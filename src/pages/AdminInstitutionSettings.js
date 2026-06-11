import { useEffect, useState } from "react";
import {
  FaBuilding,
  FaCreditCard,
  FaEnvelope,
  FaSave,
  FaShieldAlt,
} from "react-icons/fa";
import AdminPageShell from "../components/layout/AdminPageShell.js";
import ActionButton from "../components/ui/ActionButton.js";
import AlertMessage from "../components/ui/AlertMessage.js";
import Card from "../components/ui/Card.js";
import StatusBadge from "../components/ui/StatusBadge.js";
import {
  getInstitutionSettings,
  updateInstitutionSettings,
} from "../services/institutionSettingsService.js";

const defaultSettings = {
  institution_name: "BlockCred Institution",
  institution_email: "info@blockcred.local",
  institution_phone: "Not configured",
  institution_address: "Not configured",
  verification_system_name: "BlockCred",
  certificate_access_fee: 5000,
  currency: "XAF",
  payment_provider: "mock",
  support_email: "support@blockcred.local",
  support_phone: "Not configured",
};

const textFields = [
  "institution_name",
  "institution_email",
  "institution_phone",
  "institution_address",
  "verification_system_name",
  "currency",
  "payment_provider",
  "support_email",
  "support_phone",
];

const normalizeFormSettings = (settings = {}) => {
  return {
    ...defaultSettings,
    ...settings,
    certificate_access_fee: Number(settings.certificate_access_fee ?? 5000),
  };
};

const AdminInstitutionSettings = () => {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const loadSettings = async () => {
    setLoading(true);

    try {
      const data = await getInstitutionSettings();
      setSettings(normalizeFormSettings(data.settings));
    } catch (error) {
      console.error("Load institution settings error:", error);
      setMessage({
        type: "error",
        text:
          error.message ||
          "Could not load institution settings. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const updateField = (field, value) => {
    setSettings((previous) => ({
      ...previous,
      [field]:
        field === "certificate_access_fee"
          ? value === ""
            ? ""
            : Number(value)
          : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const payload = textFields.reduce((nextPayload, field) => {
        nextPayload[field] = settings[field];
        return nextPayload;
      }, {});

      payload.certificate_access_fee = Number(settings.certificate_access_fee);

      const data = await updateInstitutionSettings(payload);
      setSettings(normalizeFormSettings(data.settings));
      setMessage({
        type: "success",
        text: "Institution settings updated successfully.",
      });
    } catch (error) {
      console.error("Update institution settings error:", error);
      setMessage({
        type: "error",
        text:
          error.message ||
          "Could not update institution settings. Please review the form and try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const input = (field, label, type = "text", props = {}) => (
    <div className="settings-field">
      <label className="settings-label" htmlFor={field}>
        {label}
      </label>
      <input
        id={field}
        className="bc-input"
        type={type}
        value={settings[field] ?? ""}
        onChange={(event) => updateField(field, event.target.value)}
        disabled={loading || saving}
        {...props}
      />
    </div>
  );

  return (
    <AdminPageShell
      title="Institution Settings"
      subtitle="Manage institutional identity, support details, and payment configuration."
      actions={
        <StatusBadge
          status={settings.payment_provider || "mock"}
          type={settings.payment_provider === "mock" ? "pending" : "linked"}
        />
      }
    >
      <style>{`
        .settings-page {
          display: grid;
          gap: var(--bc-space-6);
          padding-bottom: calc(var(--bc-space-12) + 24px);
        }

        .settings-form-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.08fr) minmax(320px, 0.92fr);
          gap: var(--bc-space-6);
          align-items: start;
        }

        .settings-column {
          display: grid;
          gap: var(--bc-space-5);
          align-content: start;
        }

        .settings-page .bc-card {
          padding: 1.25rem;
        }

        .settings-card-title {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          margin: 0 0 1.15rem;
          color: var(--bc-text);
          font-size: 1rem;
          font-weight: 850;
        }

        .settings-card-title svg {
          color: var(--bc-accent);
        }

        .settings-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1.25rem 1rem;
        }

        .settings-field-full {
          grid-column: 1 / -1;
        }

        .settings-label {
          display: block;
          margin-bottom: 0.55rem;
          color: var(--bc-text);
          font-weight: 800;
          font-size: 0.88rem;
        }

        .settings-page .bc-input {
          min-height: 46px;
        }

        .settings-helper {
          color: var(--bc-muted);
          font-size: 0.88rem;
          line-height: 1.6;
        }

        .settings-summary {
          display: grid;
          gap: 0.95rem;
        }

        .settings-summary-row {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          padding-bottom: 0.95rem;
          border-bottom: 1px solid var(--bc-border);
        }

        .settings-actions {
          position: sticky;
          bottom: 1rem;
          z-index: 5;
          display: flex;
          justify-content: flex-end;
          gap: 0.65rem;
          padding: 0.85rem;
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-lg);
          background: rgba(255, 255, 255, 0.95);
          box-shadow: var(--bc-shadow-sm);
          backdrop-filter: blur(12px);
          margin-top: 0.25rem;
        }

        .settings-summary-row:last-child {
          border-bottom: 0;
          padding-bottom: 0;
        }

        .settings-summary-label {
          color: var(--bc-muted);
          font-size: 0.78rem;
          font-weight: 900;
          text-transform: uppercase;
        }

        .settings-summary-value {
          color: var(--bc-text);
          font-weight: 900;
          text-align: right;
          overflow-wrap: anywhere;
        }

        @media (max-width: 920px) {
          .settings-form-grid,
          .settings-grid {
            grid-template-columns: 1fr;
          }

          .settings-summary-row {
            flex-direction: column;
          }

          .settings-summary-value {
            text-align: left;
          }

          .settings-actions {
            position: static;
            flex-direction: column;
          }

          .settings-actions .bc-button {
            width: 100%;
          }
        }
      `}</style>

      <form className="settings-page" onSubmit={handleSubmit}>
        <AlertMessage
          type={message.type}
          message={message.text}
          onClose={() => setMessage({ type: "", text: "" })}
        />

        {loading ? (
          <Card>
            <p className="bc-page-muted mb-0">Loading institution settings...</p>
          </Card>
        ) : (
          <>
            <div className="settings-form-grid">
              <div className="settings-column">
                <Card>
                  <h2 className="settings-card-title">
                    <FaBuilding />
                    Institution Identity
                  </h2>

                  <div className="settings-grid">
                    {input("institution_name", "Institution name", "text", {
                      required: true,
                    })}
                    {input(
                      "verification_system_name",
                      "Verification system name"
                    )}
                    {input("institution_email", "Institution email", "email")}
                    {input("institution_phone", "Institution phone")}
                    <div className="settings-field-full">
                      {input("institution_address", "Institution address")}
                    </div>
                  </div>
                </Card>

                <Card>
                  <h2 className="settings-card-title">
                    <FaCreditCard />
                    Payment Configuration
                  </h2>

                  <p className="settings-helper">
                    These values describe certificate access pricing and the
                    selected provider. Secret gateway credentials must remain in
                    backend environment variables.
                  </p>

                  <div className="settings-grid">
                    {input("certificate_access_fee", "Certificate access fee", "number", {
                      min: "0",
                      step: "1",
                    })}
                    {input("currency", "Currency", "text", {
                      maxLength: 8,
                    })}
                    <div className="settings-field">
                      <label className="settings-label" htmlFor="payment_provider">
                        Payment provider
                      </label>
                      <select
                        id="payment_provider"
                        className="bc-input"
                        value={settings.payment_provider || "mock"}
                        onChange={(event) =>
                          updateField("payment_provider", event.target.value)
                        }
                        disabled={loading || saving}
                      >
                        <option value="mock">Mock</option>
                        <option value="notchpay">Notch Pay</option>
                        <option value="campay">CamPay</option>
                      </select>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="settings-column">
                <Card>
                  <h2 className="settings-card-title">
                    <FaEnvelope />
                    Support Contact
                  </h2>

                  <div className="d-grid gap-3">
                    {input("support_email", "Support email", "email")}
                    {input("support_phone", "Support phone")}
                  </div>
                </Card>

                <Card>
                  <h2 className="settings-card-title">
                    <FaShieldAlt />
                    Settings Summary
                  </h2>

                  <div className="settings-summary">
                    <div className="settings-summary-row">
                      <span className="settings-summary-label">System</span>
                      <span className="settings-summary-value">
                        {settings.verification_system_name}
                      </span>
                    </div>
                    <div className="settings-summary-row">
                      <span className="settings-summary-label">Access fee</span>
                      <span className="settings-summary-value">
                        {Number(
                          settings.certificate_access_fee || 0
                        ).toLocaleString()}{" "}
                        {settings.currency || "XAF"}
                      </span>
                    </div>
                    <div className="settings-summary-row">
                      <span className="settings-summary-label">Provider</span>
                      <StatusBadge
                        status={settings.payment_provider || "mock"}
                        type={
                          settings.payment_provider === "mock"
                            ? "pending"
                            : "linked"
                        }
                      />
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            <div className="settings-actions">
              <ActionButton
                type="button"
                variant="secondary"
                onClick={loadSettings}
                disabled={saving}
              >
                Refresh
              </ActionButton>
              <ActionButton
                type="submit"
                variant="primary"
                loading={saving}
                disabled={loading}
              >
                <FaSave />
                Save Changes
              </ActionButton>
            </div>
          </>
        )}
      </form>
    </AdminPageShell>
  );
};

export default AdminInstitutionSettings;
