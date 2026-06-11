// src/pages/StudentDashboard.js

import { useEffect, useMemo, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaCertificate,
  FaCheckCircle,
  FaCopy,
  FaCreditCard,
  FaExternalLinkAlt,
  FaFilePdf,
  FaFingerprint,
  FaRedo,
  FaSearch,
  FaShieldAlt,
  FaTimesCircle,
  FaUserGraduate,
} from "react-icons/fa";
import { authFetch } from "../api.js";
import { auth } from "../firebase.js";
import Layout from "../components/Layout.js";
import ActionButton from "../components/ui/ActionButton.js";
import AlertMessage from "../components/ui/AlertMessage.js";
import Card from "../components/ui/Card.js";
import EmptyState from "../components/ui/EmptyState.js";
import StatCard from "../components/ui/StatCard.js";
import StatusBadge from "../components/ui/StatusBadge.js";
import PaymentRequiredCard from "../components/payment/PaymentRequiredCard.js";
import { initiatePayment } from "../services/paymentService.js";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState("");
  const [certificates, setCertificates] = useState([]);
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState({
    subscriptionStatus: "inactive",
    amount: 5000,
    currency: "XAF",
  });
  const [paymentMessage, setPaymentMessage] = useState(
    "Payment is required to access your certificates."
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  useEffect(() => {
    fetchStudentCertificates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });

    setTimeout(() => {
      setMessage({ type: "", text: "" });
    }, 6000);
  };

  const fetchStudentCertificates = async () => {
    setLoading(true);

    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error("No logged-in student found.");
      }

      const email = currentUser.email || "";
      setUserEmail(email);

      if (!email) {
        throw new Error("Student email not found in Firebase account.");
      }

      const response = await authFetch(
        `/api/certificates/student-certificates/${encodeURIComponent(email)}`
      );

      const data = await response.json();

      if (response.status === 402 && data?.payment_required) {
        setPaymentRequired(true);
        setPaymentInfo({
          subscriptionStatus: data.subscription_status || "inactive",
          amount: data.payment?.amount || 5000,
          currency: data.payment?.currency || "XAF",
        });
        setPaymentMessage(
          (data.message || "Payment is required to access your certificates.").replace(
            "access certificates",
            "access your certificates"
          )
        );
        setCertificates([]);
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch student certificates.");
      }

      setPaymentRequired(false);
      setPaymentInfo({
        subscriptionStatus: "active",
        amount: 5000,
        currency: "XAF",
      });
      setPaymentMessage("Payment is required to access your certificates.");

      if (Array.isArray(data)) {
        setCertificates(data);
      } else if (Array.isArray(data.data)) {
        setCertificates(data.data);
      } else if (Array.isArray(data.certificates)) {
        setCertificates(data.certificates);
      } else {
        setCertificates([]);
      }
    } catch (error) {
      console.error("Student certificate fetch error:", error);
      showMessage("error", error.message || "Failed to load certificates.");
      setPaymentRequired(false);
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  const getVerificationLink = (certId) => {
    return `${window.location.origin}/public-verifier?certId=${encodeURIComponent(
      certId
    )}`;
  };

  const copyVerificationLink = async (certId) => {
    try {
      const link = getVerificationLink(certId);
      await navigator.clipboard.writeText(link);
      showMessage("success", "Verification link copied.");
    } catch (error) {
      console.error("Copy link error:", error);
      showMessage("error", "Could not copy verification link.");
    }
  };

  const handlePayNow = async () => {
    setPaymentLoading(true);
    showMessage("info", "Starting payment...");

    try {
      const data = await initiatePayment();

      if (data.already_active) {
        showMessage(
          "success",
          data.message || "Your certificate access is already active."
        );
        await fetchStudentCertificates();
        return;
      }

      const checkoutUrl = data.payment?.checkout_url;

      if (!checkoutUrl) {
        showMessage(
          "warning",
          "Payment was initialized, but no checkout link was returned."
        );
        return;
      }

      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Payment initiation error:", error);
      showMessage("error", error.message || "Could not start payment.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const shortenHash = (hash) => {
    if (!hash) return "N/A";
    if (hash.length <= 28) return hash;

    return `${hash.slice(0, 16)}...${hash.slice(-12)}`;
  };

  const filteredCertificates = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return certificates.filter((certificate) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && !certificate.revoked) ||
        (statusFilter === "revoked" && certificate.revoked);

      const matchesSearch =
        !keyword ||
        String(certificate.cert_id || "").toLowerCase().includes(keyword) ||
        String(certificate.student_name || "").toLowerCase().includes(keyword) ||
        String(certificate.student_id || "").toLowerCase().includes(keyword) ||
        String(certificate.degree_program || "")
          .toLowerCase()
          .includes(keyword) ||
        String(certificate.degree || "").toLowerCase().includes(keyword) ||
        String(certificate.completion_year || "")
          .toLowerCase()
          .includes(keyword);

      return matchesStatus && matchesSearch;
    });
  }, [certificates, search, statusFilter]);

  const stats = useMemo(() => {
    const active = certificates.filter((certificate) => !certificate.revoked);
    const revoked = certificates.filter((certificate) => certificate.revoked);
    const withPdf = certificates.filter((certificate) => certificate.pdf_url);

    return {
      total: certificates.length,
      active: active.length,
      revoked: revoked.length,
      withPdf: withPdf.length,
      latest:
        certificates.length > 0
          ? certificates[0]?.issue_date ||
            certificates[0]?.completion_year ||
            "N/A"
          : "N/A",
    };
  }, [certificates]);

  const activeRate = useMemo(() => {
    if (!stats.total) return 0;
    return Math.round((stats.active / stats.total) * 100);
  }, [stats]);

  const statCards = [
    {
      key: "all",
      label: "Total Certificates",
      value: stats.total,
      helper: "Issued to your wallet",
      icon: <FaCertificate />,
    },
    {
      key: "active",
      label: "Active Certificates",
      value: stats.active,
      helper: "Ready to share",
      icon: <FaCheckCircle />,
    },
    {
      key: "revoked",
      label: "Revoked Certificates",
      value: stats.revoked,
      helper: "Marked invalid",
      icon: <FaTimesCircle />,
    },
    {
      key: "links",
      label: "Verification Links",
      value: stats.total,
      helper: "Public QR/link records",
      icon: <FaShieldAlt />,
    },
  ];

  const accessStatus = paymentRequired
    ? paymentInfo.subscriptionStatus === "pending"
      ? "Pending access"
      : "Payment required"
    : "Active access";

  const accessStatusType = paymentRequired
    ? paymentInfo.subscriptionStatus === "pending"
      ? "pending"
      : "warning"
    : "active";

  return (
    <Layout user="student">
      <style>{`
        .student-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(37, 99, 235, 0.1), transparent 34rem),
            var(--bc-page-bg);
          padding: 1.5rem 1.25rem 4rem;
        }

        .student-container {
          max-width: 1180px;
          margin: 0 auto;
        }

        .student-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding: 1.35rem;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: var(--bc-radius-section);
          background:
            linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(29, 78, 216, 0.9));
          box-shadow: var(--bc-shadow-lg);
        }

        .student-label {
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
          margin-bottom: 0.85rem;
        }

        .student-title {
          color: #ffffff;
          font-size: clamp(1.8rem, 3vw, 2.6rem);
          font-weight: 850;
          letter-spacing: 0;
          line-height: 1;
          margin-bottom: 0.55rem;
        }

        .student-muted {
          color: var(--bc-muted);
        }

        .student-header .student-muted {
          color: #cbd5e1;
        }

        .student-header strong {
          color: #ffffff;
        }

        .student-actions {
          display: flex;
          gap: 0.65rem;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .student-btn {
          min-height: 40px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          color: #334155;
          padding: 0.55rem 0.85rem;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          transition: 0.15s ease;
          text-decoration: none;
        }

        .student-btn:hover {
          background: #f8fafc;
          color: #0f172a;
          border-color: #cbd5e1;
        }

        .student-btn-primary {
          background: #0f172a;
          color: #ffffff;
          border-color: #0f172a;
        }

        .student-btn-primary:hover {
          background: #1e293b;
          color: #ffffff;
          border-color: #1e293b;
        }

        .student-card {
          background: var(--bc-surface);
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-xl);
          box-shadow: var(--bc-shadow-sm);
        }

        .student-stat-card {
          width: 100%;
          height: 100%;
          min-height: 148px;
          position: relative;
          overflow: hidden;
          text-align: left;
          background: var(--bc-surface);
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-xl);
          padding: 1.2rem 1.05rem 1.05rem;
          box-shadow: var(--bc-shadow-sm);
          transition: 0.15s ease;
        }

        .student-stat-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--bc-cobalt), var(--bc-teal));
        }

        .student-stat-card .bc-stat-card {
          height: 100%;
          min-height: 0;
          padding: 0.25rem 0 0;
          border: 0;
          background: transparent;
          box-shadow: none;
          overflow: visible;
        }

        .student-stat-card .bc-stat-card::before {
          display: none;
        }

        .student-stat-card .bc-page-muted {
          line-height: 1.35;
          margin-top: 0.55rem !important;
        }

        .student-stat-card:hover {
          background: var(--bc-surface-soft);
          border-color: rgba(37, 99, 235, 0.28);
          transform: translateY(-1px);
        }

        .student-stat-card.active {
          border-color: var(--bc-primary);
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.08);
        }

        .student-stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .student-stat-icon {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: #eff6ff;
          color: #2563eb;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .student-stat-label {
          color: #64748b;
          font-size: 0.84rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .student-stat-value {
          color: #0f172a;
          font-size: 1.8rem;
          font-weight: 850;
          letter-spacing: 0;
          margin-bottom: 0;
        }

        .student-summary {
          padding: 1rem;
          height: 100%;
        }

        .student-access-card {
          height: 100%;
          padding: 1.1rem;
          border-radius: var(--bc-radius-xl);
          border: 1px solid rgba(37, 99, 235, 0.16);
          background:
            linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(20, 184, 166, 0.05)),
            var(--bc-surface);
          box-shadow: var(--bc-shadow-sm);
        }

        .student-access-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .student-access-metric {
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-lg);
          background: rgba(255, 255, 255, 0.72);
          padding: 0.75rem;
        }

        .student-access-value {
          color: var(--bc-text);
          font-size: 1.15rem;
          font-weight: 850;
          margin: 0;
        }

        .student-trust-note {
          display: flex;
          gap: 0.65rem;
          align-items: flex-start;
          margin-top: 1rem;
          border: 1px solid rgba(37, 99, 235, 0.14);
          border-radius: var(--bc-radius-lg);
          background: rgba(37, 99, 235, 0.06);
          padding: 0.85rem;
        }

        .student-progress-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 0.65rem;
          font-size: 0.9rem;
        }

        .student-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
          padding: 1rem;
          border-bottom: 1px solid var(--bc-border);
          background: var(--bc-surface-soft);
        }

        .student-section-title {
          color: #0f172a;
          font-size: 1.15rem;
          font-weight: 850;
          letter-spacing: 0;
          margin-bottom: 0.2rem;
        }

        .student-search-area {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          flex-wrap: wrap;
        }

        .student-search-wrap {
          position: relative;
          width: min(100%, 360px);
        }

        .student-search-icon {
          position: absolute;
          left: 0.9rem;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
        }

        .student-search-input {
          width: 100%;
          height: 40px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 0 0.85rem 0 2.45rem;
          outline: none;
          background: #ffffff;
          color: #0f172a;
          font-weight: 600;
          transition: 0.15s ease;
        }

        .student-search-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.08);
        }

        .student-filter {
          height: 40px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          background: #ffffff;
          color: #334155;
          padding: 0 0.75rem;
          font-weight: 750;
          outline: none;
        }

        .student-cert {
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-xl);
          background: var(--bc-surface);
          overflow: hidden;
          height: 100%;
          box-shadow: var(--bc-shadow-sm);
        }

        .student-cert-head {
          padding: 1rem;
          border-bottom: 1px solid var(--bc-border);
          background:
            linear-gradient(135deg, rgba(37, 99, 235, 0.07), rgba(255, 255, 255, 0.9));
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
        }

        .student-status {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          border-radius: 999px;
          padding: 0.34rem 0.62rem;
          font-size: 0.74rem;
          font-weight: 850;
          white-space: nowrap;
        }

        .student-status-active {
          background: #ecfdf5;
          color: #059669;
          border: 1px solid #bbf7d0;
        }

        .student-status-revoked {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .student-cert-body {
          padding: 1rem;
        }

        .student-detail-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .student-detail {
          background: var(--bc-surface-soft);
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-lg);
          padding: 0.85rem;
        }

        .student-detail-label {
          color: #64748b;
          font-size: 0.78rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .student-detail-value {
          color: #0f172a;
          font-weight: 800;
          margin-bottom: 0;
          word-break: break-word;
        }

        .student-hash {
          background: var(--bc-surface-soft);
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-lg);
          padding: 0.85rem;
          margin-bottom: 1rem;
        }

        .student-cert-bottom {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 1rem;
          align-items: center;
        }

        .student-qr {
          background: #ffffff;
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-lg);
          padding: 0.65rem;
          display: inline-flex;
          box-shadow: var(--bc-shadow-xs);
        }

        .student-cert-actions {
          display: grid;
          gap: 0.5rem;
        }

        .student-empty {
          padding: 3rem 1rem;
          text-align: center;
        }

        .student-empty-icon {
          width: 58px;
          height: 58px;
          border-radius: 18px;
          background: #eff6ff;
          color: #2563eb;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          margin-bottom: 1rem;
        }

        @media(max-width: 768px) {
          .student-page {
            padding: 1rem 1rem 3.5rem;
          }

          .student-header,
          .student-toolbar {
            flex-direction: column;
            align-items: flex-start;
          }

          .student-actions,
          .student-btn {
            width: 100%;
          }

          .student-search-wrap,
          .student-filter {
            width: 100%;
          }

          .student-detail-grid {
            grid-template-columns: 1fr;
          }

          .student-access-grid {
            grid-template-columns: 1fr;
          }

          .student-cert-bottom {
            grid-template-columns: 1fr;
          }

          .student-qr {
            justify-self: center;
          }

          .student-cert-actions .student-btn,
          .student-cert-actions .bc-button {
            width: 100%;
          }
        }
      `}</style>

      <main className="student-page">
        <div className="student-container">
          <header className="student-header">
            <div>
              <div className="student-label">
                <FaUserGraduate />
                Credential wallet
              </div>

              <h1 className="student-title">My Credentials</h1>

              <p className="student-muted mb-0">
                View, download, and share your blockchain-backed academic
                certificates.
              </p>

              {userEmail && (
                <p className="student-muted small mt-2 mb-0">
                  Signed in as <strong>{userEmail}</strong>
                </p>
              )}
            </div>

            <div className="student-actions">
              <StatusBadge status={accessStatus} type={accessStatusType} />

              <a
                href="/public-verifier"
                target="_blank"
                rel="noreferrer"
                className="student-btn"
              >
                Open verifier
                <FaExternalLinkAlt />
              </a>

              <ActionButton
                onClick={fetchStudentCertificates}
                variant="primary"
                disabled={loading}
              >
                <FaRedo />
                {loading ? "Refreshing..." : "Refresh"}
              </ActionButton>
            </div>
          </header>

          {message.text && (
            <AlertMessage type={message.type} message={message.text} />
          )}

          {paymentRequired ? (
            <section className="row g-3">
              <div className="col-lg-8">
                <PaymentRequiredCard
                  subscriptionStatus={paymentInfo.subscriptionStatus}
                  amount={paymentInfo.amount}
                  currency={paymentInfo.currency}
                  message={paymentMessage}
                  onPayNow={handlePayNow}
                  loading={paymentLoading}
                />
              </div>

              <div className="col-lg-4">
                <Card className="student-access-card">
                  <StatusBadge
                    status={paymentInfo.subscriptionStatus || "inactive"}
                    type={
                      paymentInfo.subscriptionStatus === "pending"
                        ? "pending"
                        : "warning"
                    }
                  />

                  <h2 className="student-section-title mt-3">
                    Complete payment to unlock your issued credentials.
                  </h2>

                  <p className="student-muted small mb-0">
                    Once access is active, your certificates, QR codes, PDF
                    files, and verification links will appear in this wallet.
                  </p>
                </Card>
              </div>
            </section>
          ) : (
            <>
              <section className="row g-3 mb-3">
                {statCards.map((card) => {
                  const isFilterCard =
                    card.key === "all" ||
                    card.key === "active" ||
                    card.key === "revoked";

                  const isActive = statusFilter === card.key;

                  return (
                    <div className="col-sm-6 col-xl-3" key={card.key}>
                      <button
                        type="button"
                        onClick={() => {
                          if (isFilterCard) setStatusFilter(card.key);
                        }}
                        className={`student-stat-card ${
                          isActive && isFilterCard ? "active" : ""
                        }`}
                        style={{ cursor: isFilterCard ? "pointer" : "default" }}
                        aria-pressed={isFilterCard ? isActive : undefined}
                      >
                        <StatCard
                          label={card.label}
                          value={loading ? "..." : card.value}
                          helper={card.helper}
                          icon={card.icon}
                        />
                      </button>
                    </div>
                  );
                })}
              </section>

              <section className="row g-3 mb-3">
                <div className="col-12">
                  <Card className="student-access-card">
                    <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
                      <div>
                        <StatusBadge status="Active access" type="active" />

                        <h2 className="student-section-title mt-3">
                          Credential Access
                        </h2>

                        <p className="student-muted small mb-0">
                          Your certificates can be verified publicly using QR
                          codes or verification links.
                        </p>
                      </div>

                      <div className="student-actions">
                        <ActionButton
                          onClick={() => navigate("/payment-history")}
                          variant="ghost"
                        >
                          <FaCreditCard />
                          View Payment History
                        </ActionButton>

                        <ActionButton
                          onClick={fetchStudentCertificates}
                          variant="secondary"
                          disabled={loading}
                        >
                          <FaRedo />
                          {loading ? "Refreshing..." : "Refresh Wallet"}
                        </ActionButton>
                      </div>
                    </div>

                    <div className="student-access-grid">
                      <div className="student-access-metric">
                        <p className="student-muted small fw-bold mb-1">
                          Access status
                        </p>
                        <p className="student-access-value">Active</p>
                      </div>

                      <div className="student-access-metric">
                        <p className="student-muted small fw-bold mb-1">
                          Certificate count
                        </p>
                        <p className="student-access-value">
                          {loading ? "..." : stats.total}
                        </p>
                      </div>

                      <div className="student-access-metric">
                        <p className="student-muted small fw-bold mb-1">
                          Active rate
                        </p>
                        <p className="student-access-value">
                          {loading ? "..." : `${activeRate}%`}
                        </p>
                      </div>
                    </div>

                    <div className="student-trust-note">
                      <FaShieldAlt className="text-primary mt-1" />
                      <p className="student-muted small mb-0">
                        You can download certificate PDFs, copy verification
                        links, or share QR codes with employers and reviewers.
                      </p>
                    </div>
                  </Card>
                </div>
              </section>

              <Card className="overflow-hidden">
                <div className="student-toolbar">
                  <div>
                    <h2 className="student-section-title">
                      Certificate Wallet
                    </h2>

                    <p className="student-muted small mb-0">
                      Showing {filteredCertificates.length} of{" "}
                      {certificates.length} credential(s).
                    </p>
                  </div>

                  <div className="student-search-area">
                    <div className="student-search-wrap">
                      <FaSearch className="student-search-icon" />

                      <input
                        type="text"
                        className="student-search-input"
                        placeholder="Search certificate or degree..."
                        aria-label="Search certificates"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                      />
                    </div>

                    <select
                      className="student-filter"
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                      aria-label="Filter certificates by status"
                    >
                      <option value="all">All</option>
                      <option value="active">Active</option>
                      <option value="revoked">Revoked</option>
                    </select>

                    <ActionButton
                      onClick={fetchStudentCertificates}
                      variant="secondary"
                      disabled={loading}
                    >
                      <FaRedo />
                      Refresh
                    </ActionButton>
                  </div>
                </div>

                <div className="p-3">
                  {loading ? (
                    <div className="student-empty">
                      <div className="spinner-border text-primary mb-3" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>

                      <p className="text-primary fw-bold mb-0">
                        Loading your certificates...
                      </p>
                    </div>
                  ) : certificates.length === 0 ? (
                    <div className="student-empty">
                      <EmptyState
                        title="No certificates found"
                        message="No certificate has been issued to this email yet. Ask your institution to use your Firebase login email when issuing your certificate."
                      />
                    </div>
                  ) : filteredCertificates.length === 0 ? (
                    <div className="student-empty">
                      <EmptyState
                        title="No matching certificates"
                        message="Try changing your search keyword or status filter."
                      />
                    </div>
                  ) : (
                    <div className="row g-3">
                      {filteredCertificates.map((certificate, index) => {
                        const verificationLink = getVerificationLink(
                          certificate.cert_id
                        );

                        const degreeTitle =
                          certificate.degree_program ||
                          certificate.degree ||
                          "Academic Certificate";

                        return (
                          <div
                            className="col-xl-6"
                            key={certificate.cert_id || index}
                          >
                            <Card className="student-cert">
                              <div className="student-cert-head">
                                <div>
                                  <p className="student-muted small fw-bold mb-1">
                                    Certificate
                                  </p>

                                  <h3 className="h5 fw-bold mb-1">
                                    {degreeTitle}
                                  </h3>

                                  <p className="student-muted small mb-0">
                                    ID:{" "}
                                    <span className="font-monospace fw-bold text-dark">
                                      {certificate.cert_id || "N/A"}
                                    </span>
                                  </p>
                                </div>

                                <StatusBadge
                                  status={certificate.revoked ? "Revoked" : "Active"}
                                  type={certificate.revoked ? "revoked" : "active"}
                                />
                              </div>

                              <div className="student-cert-body">
                                <div className="student-detail-grid">
                                  <div className="student-detail">
                                    <p className="student-detail-label">
                                      Student name
                                    </p>

                                    <p className="student-detail-value">
                                      {certificate.student_name || "N/A"}
                                    </p>
                                  </div>

                                  <div className="student-detail">
                                    <p className="student-detail-label">
                                      Student ID
                                    </p>

                                    <p className="student-detail-value">
                                      {certificate.student_id || "N/A"}
                                    </p>
                                  </div>

                                  <div className="student-detail">
                                    <p className="student-detail-label">
                                      Issue date
                                    </p>

                                    <p className="student-detail-value">
                                      {certificate.issue_date || "N/A"}
                                    </p>
                                  </div>

                                  <div className="student-detail">
                                    <p className="student-detail-label">GPA</p>

                                    <p className="student-detail-value">
                                      {certificate.gpa || "N/A"}
                                    </p>
                                  </div>

                                  <div className="student-detail">
                                    <p className="student-detail-label">Year</p>

                                    <p className="student-detail-value">
                                      {certificate.completion_year || "N/A"}
                                    </p>
                                  </div>

                                  <div className="student-detail">
                                    <p className="student-detail-label">PDF</p>

                                    <p className="student-detail-value">
                                      {certificate.pdf_url ? "Available" : "N/A"}
                                    </p>
                                  </div>
                                </div>

                                <div className="student-hash">
                                  <div className="d-flex align-items-center gap-2 mb-1">
                                    <FaFingerprint className="text-primary" />
                                    <strong>PDF hash</strong>
                                  </div>

                                  <p
                                    className="font-monospace small text-break mb-0 student-muted"
                                    title={certificate.pdf_hash || ""}
                                  >
                                    {shortenHash(certificate.pdf_hash)}
                                  </p>
                                </div>

                                <div className="student-cert-bottom">
                                  <div className="text-center">
                                    <div className="student-qr">
                                      <QRCodeCanvas
                                        value={verificationLink}
                                        size={112}
                                      />
                                    </div>

                                    <p className="student-muted small mt-2 mb-0">
                                      Scan to verify
                                    </p>
                                  </div>

                                  <div className="student-cert-actions">
                                    {certificate.pdf_url && (
                                      <a
                                        href={certificate.pdf_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="student-btn student-btn-primary"
                                      >
                                        <FaFilePdf />
                                        View  Certificate PDF
                                        <FaExternalLinkAlt />
                                      </a>
                                    )}

                                    <a
                                      href={verificationLink}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="student-btn"
                                    >
                                      <FaShieldAlt />
                                      Open verification
                                      <FaArrowRight />
                                    </a>

                                    <ActionButton
                                      onClick={() =>
                                        copyVerificationLink(certificate.cert_id)
                                      }
                                      variant="ghost"
                                      disabled={!certificate.cert_id}
                                    >
                                      <FaCopy />
                                      Copy link
                                    </ActionButton>
                                  </div>
                                </div>

                                {certificate.revoked && (
                                  <div className="mt-3">
                                    <AlertMessage
                                      type="error"
                                      message="Certificate revoked: This credential should not be used for official verification."
                                    />
                                  </div>
                                )}
                              </div>
                            </Card>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Card>
            </>
          )}
        </div>
      </main>
    </Layout>
  );
};

export default StudentDashboard;
