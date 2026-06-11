// src/pages/PublicVerifier.js

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { ethers } from "ethers";
import {
  FaCheckCircle,
  FaCopy,
  FaDownload,
  FaEthereum,
  FaExclamationTriangle,
  FaExternalLinkAlt,
  FaFileAlt,
  FaFingerprint,
  FaRedo,
  FaSearch,
  FaShieldAlt,
  FaTimesCircle,
} from "react-icons/fa";
import { publicFetch } from "../api.js";
import Layout from "../components/Layout.js";
import ActionButton from "../components/ui/ActionButton.js";
import AlertMessage from "../components/ui/AlertMessage.js";
import Card from "../components/ui/Card.js";
import EmptyState from "../components/ui/EmptyState.js";
import StatusBadge from "../components/ui/StatusBadge.js";
import { contractAddress, contractABI } from "../contract.js";
import { downloadVerificationReceipt } from "../utils/verificationReceipt.js";

const SEPOLIA_RPC_URL = process.env.REACT_APP_SEPOLIA_RPC_URL;

const PublicVerifier = () => {
  const [searchParams] = useSearchParams();

  const [certId, setCertId] = useState("");
  const [certificate, setCertificate] = useState(null);
  const [blockchainData, setBlockchainData] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  useEffect(() => {
    const certIdFromUrl = searchParams.get("certId");

    if (certIdFromUrl) {
      setCertId(certIdFromUrl);
      verifyCertificate(certIdFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
  };

  const resetVerification = () => {
    setCertificate(null);
    setBlockchainData(null);
    setVerificationStatus(null);
  };

  const getVerificationLink = (id) => {
    return `${window.location.origin}/public-verifier?certId=${encodeURIComponent(
      id
    )}`;
  };

  const getProvider = () => {
  if (!SEPOLIA_RPC_URL) {
    throw new Error(
      "Missing REACT_APP_SEPOLIA_RPC_URL. Add it to your frontend .env file and restart React."
    );
  }

  return new ethers.providers.JsonRpcProvider(SEPOLIA_RPC_URL);
};

  const getBlockchainCertificate = async (finalCertId) => {
    const provider = getProvider();
    const contract = new ethers.Contract(contractAddress, contractABI, provider);

    if (typeof contract.getCertificate !== "function") {
      throw new Error("Smart contract ABI does not contain getCertificate().");
    }

    const result = await contract.getCertificate(finalCertId);

    const onChainCertId = String(result[0] || "").trim();
    const studentName = String(result[1] || "").trim();
    const degree = String(result[2] || "").trim();
    const pdfHash = String(result[3] || "").trim();
    const revoked = Boolean(result[4]);
    const issueDateRaw = result[5];

    const issueDate =
      issueDateRaw && issueDateRaw.toString
        ? Number(issueDateRaw.toString())
        : 0;

    return {
      exists: onChainCertId.length > 0,
      certId: onChainCertId,
      studentName,
      degree,
      pdfHash,
      revoked,
      issueDate,
    };
  };

  const buildVerificationStatus = (dbCertificate, chainCertificate) => {
    const dbCertId = String(dbCertificate.cert_id || "").trim().toLowerCase();
    const chainCertId = String(chainCertificate.certId || "")
      .trim()
      .toLowerCase();

    const dbHash = String(dbCertificate.pdf_hash || "").trim().toLowerCase();
    const chainHash = String(chainCertificate.pdfHash || "")
      .trim()
      .toLowerCase();

    const dbRevoked = Boolean(dbCertificate.revoked);
    const chainRevoked = Boolean(chainCertificate.revoked);

    const certificateIdMatches =
      Boolean(dbCertId) && Boolean(chainCertId) && dbCertId === chainCertId;

    const hashMatches =
      Boolean(dbHash) && Boolean(chainHash) && dbHash === chainHash;

    const revocationMatches = dbRevoked === chainRevoked;

    if (!chainCertificate.exists) {
      return {
        level: "error",
        title: "Not found on blockchain",
        text: "This certificate exists in the database, but it was not found on the blockchain.",
        certificateIdMatches: false,
        hashMatches: false,
        revocationMatches: false,
      };
    }

    if (!certificateIdMatches) {
      return {
        level: "error",
        title: "Certificate ID mismatch",
        text: "The database certificate ID does not match the blockchain record.",
        certificateIdMatches,
        hashMatches,
        revocationMatches,
      };
    }

    if (!hashMatches) {
      return {
        level: "error",
        title: "Hash mismatch",
        text: "The database PDF hash does not match the blockchain PDF hash.",
        certificateIdMatches,
        hashMatches,
        revocationMatches,
      };
    }

    if (!revocationMatches) {
      return {
        level: "warning",
        title: "Status mismatch",
        text: "The database revocation status does not match the blockchain status.",
        certificateIdMatches,
        hashMatches,
        revocationMatches,
      };
    }

    if (dbRevoked || chainRevoked) {
      return {
        level: "error",
        title: "Certificate revoked",
        text: "This certificate is authentic, but it has been revoked.",
        certificateIdMatches,
        hashMatches,
        revocationMatches,
      };
    }

    return {
      level: "success",
      title: "Certificate valid",
      text: "This certificate record is authentic and active.",
      certificateIdMatches,
      hashMatches,
      revocationMatches,
    };
  };

  const verifyCertificate = async (idFromButton) => {
    const finalCertId = String(idFromButton || certId || "").trim();

    if (!finalCertId) {
      resetVerification();
      showMessage("warning", "Please enter a Certificate ID.");
      return;
    }

    setLoading(true);
    resetVerification();
    showMessage("info", "Checking certificate...");

    try {
      const response = await publicFetch(
        `/api/certificates/${encodeURIComponent(finalCertId)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Certificate not found.");
      }

      const dbCertificate = data?.data || data?.certificate || data;
      const chainCertificate = await getBlockchainCertificate(finalCertId);
      const status = buildVerificationStatus(dbCertificate, chainCertificate);

      setCertificate(dbCertificate);
      setBlockchainData(chainCertificate);
      setVerificationStatus(status);

      window.history.replaceState(
        null,
        "",
        `/public-verifier?certId=${encodeURIComponent(finalCertId)}`
      );

      showMessage(status.level, status.text);
    } catch (error) {
      console.error("Verification error:", error);

      resetVerification();
      showMessage("error", error.message || "Certificate verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const copyVerificationLink = async () => {
    if (!certificate?.cert_id) return;

    try {
      await navigator.clipboard.writeText(
        getVerificationLink(certificate.cert_id)
      );

      showMessage("success", "Verification link copied.");
    } catch (error) {
      console.error("Copy link error:", error);
      showMessage("error", "Could not copy verification link.");
    }
  };

  const downloadReceipt = () => {
    if (!certificate || !verificationStatus) {
      showMessage("warning", "Verify a certificate before downloading a receipt.");
      return;
    }

    downloadVerificationReceipt({
      certificate,
      verification: verificationStatus,
      blockchain: blockchainData,
      verificationUrl: getVerificationLink(certificate.cert_id),
    });

    showMessage("success", "Verification receipt downloaded.");
  };

  const formatBlockchainDate = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp * 1000).toLocaleString();
  };

  const shortenHash = (hash) => {
    if (!hash) return "N/A";
    if (hash.length <= 24) return hash;

    return `${hash.slice(0, 14)}...${hash.slice(-10)}`;
  };

  const statusTheme = useMemo(() => {
    if (!verificationStatus) {
      return {
        icon: <FaShieldAlt />,
        className: "verifier-neutral",
        label: "Ready",
        badgeType: "pending",
      };
    }

    if (verificationStatus.level === "success") {
      return {
        icon: <FaCheckCircle />,
        className: "verifier-success",
        label: "Verified",
        badgeType: "valid",
      };
    }

    if (verificationStatus.level === "warning") {
      return {
        icon: <FaExclamationTriangle />,
        className: "verifier-warning",
        label: "Review",
        badgeType: "warning",
      };
    }

    return {
      icon: <FaTimesCircle />,
      className: "verifier-danger",
      label: "Invalid",
      badgeType: "failed",
    };
  }, [verificationStatus]);

  const resultSummary = useMemo(() => {
    if (!verificationStatus) {
      return {
        title: "Ready to Verify",
        message:
          "Enter a certificate ID or scan a QR code from a certificate.",
      };
    }

    if (verificationStatus.level === "success") {
      return {
        title: "Certificate Verified",
        message:
          "This credential matches the institutional record and blockchain proof.",
      };
    }

    if (
      verificationStatus.title?.toLowerCase().includes("revoked") ||
      certificate?.revoked ||
      blockchainData?.revoked
    ) {
      return {
        title: "Certificate Revoked",
        message: "This certificate exists but has been marked invalid.",
      };
    }

    return {
      title: "Verification Warning",
      message: "Certificate data does not fully match blockchain proof.",
    };
  }, [verificationStatus, certificate, blockchainData]);

  const checks = [
    {
      label: "Database record",
      value: certificate ? "Found" : "Not found",
      passed: Boolean(certificate),
      icon: <FaFileAlt />,
    },
    {
      label: "Blockchain record",
      value: blockchainData?.exists ? "Found" : "Not found",
      passed: Boolean(blockchainData?.exists),
      icon: <FaEthereum />,
    },
    {
      label: "Certificate ID",
      value: verificationStatus?.certificateIdMatches ? "Matched" : "Mismatch",
      passed: Boolean(verificationStatus?.certificateIdMatches),
      icon: <FaShieldAlt />,
    },
    {
      label: "PDF hash",
      value: verificationStatus?.hashMatches ? "Matched" : "Mismatch",
      passed: Boolean(verificationStatus?.hashMatches),
      icon: <FaFingerprint />,
    },
    {
      label: "Revocation",
      value: verificationStatus?.revocationMatches ? "Confirmed" : "Mismatch",
      passed: Boolean(verificationStatus?.revocationMatches),
      icon: <FaCheckCircle />,
    },
  ];

  return (
    <Layout user={null}>
      <style>{`
        .verifier-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(37, 99, 235, 0.12), transparent 34rem),
            var(--bc-page-bg);
          padding: 3rem 1.25rem 4rem;
        }

        .verifier-container {
          max-width: 1100px;
          margin: 0 auto;
        }

        .verifier-header {
          max-width: 100%;
          margin-bottom: 1.5rem;
          padding: 1.4rem;
          border-radius: var(--bc-radius-section);
          border: 1px solid rgba(255, 255, 255, 0.14);
          background:
            linear-gradient(135deg, rgba(15, 23, 42, 0.97), rgba(29, 78, 216, 0.9));
          box-shadow: var(--bc-shadow-lg);
        }

        .verifier-label {
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

        .verifier-title {
          font-size: clamp(2rem, 4vw, 3.2rem);
          font-weight: 850;
          letter-spacing: 0;
          color: #0f172a;
          line-height: 1;
          margin-bottom: 0.85rem;
        }

        .verifier-text {
          color: #64748b;
          font-size: 1rem;
          line-height: 1.7;
          margin-bottom: 0;
        }

        .verifier-search-card {
          background: var(--bc-surface);
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-xl);
          box-shadow: var(--bc-shadow-md);
          padding: 1.1rem;
          margin-bottom: 1rem;
        }

        .verifier-search-row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 0.75rem;
        }

        .verifier-input-wrap {
          position: relative;
        }

        .verifier-input-icon {
          position: absolute;
          left: 0.9rem;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
        }

        .verifier-input {
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

        .verifier-input:focus {
          border-color: var(--bc-primary);
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.08);
        }

        .verifier-btn {
          min-height: 46px;
          border-radius: 12px;
          border: 1px solid #0f172a;
          background: #0f172a;
          color: #ffffff;
          font-weight: 850;
          padding: 0 1rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          white-space: nowrap;
          transition: 0.15s ease;
        }

        .verifier-btn:hover {
          background: #1e293b;
          border-color: #1e293b;
        }

        .verifier-btn-outline {
          background: #ffffff;
          color: #334155;
          border-color: #e2e8f0;
        }

        .verifier-btn-outline:hover {
          background: #f8fafc;
          color: #ffffff;
          border-color: #cbd5e1;
        }

        .verifier-verify-button {
          min-height: 46px !important;
          padding: 0 1rem !important;
        }

        .verifier-card {
          background: var(--bc-surface);
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-xl);
          box-shadow: var(--bc-shadow-md);
          overflow: hidden;
        }

        .verifier-result-head {
          padding: 1.25rem;
          border-bottom: 1px solid var(--bc-border);
          background: var(--bc-surface-soft);
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
        }

        .verifier-status {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          border-radius: 999px;
          padding: 0.42rem 0.7rem;
          font-size: 0.78rem;
          font-weight: 850;
          white-space: nowrap;
        }

        .verifier-success .verifier-status {
          background: #ecfdf5;
          color: #059669;
          border: 1px solid #bbf7d0;
        }

        .verifier-warning .verifier-status {
          background: #fffbeb;
          color: #d97706;
          border: 1px solid #fde68a;
        }

        .verifier-danger .verifier-status {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .verifier-neutral .verifier-status {
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
        }

        .verifier-body {
          padding: 1.25rem;
        }

        .verifier-muted {
          color: var(--bc-muted);
        }

        .verifier-detail {
          background: var(--bc-surface-soft);
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-lg);
          padding: 0.85rem;
          height: 100%;
        }

        .verifier-detail-label {
          color: var(--bc-muted);
          font-size: 0.78rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .verifier-detail-value {
          color: var(--bc-text);
          font-weight: 800;
          margin-bottom: 0;
          word-break: break-word;
        }

        .verifier-check {
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-lg);
          padding: 0.85rem;
          height: 100%;
          background: var(--bc-surface);
        }

        .verifier-check-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .verifier-check-icon {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #f1f5f9;
          color: #475569;
        }

        .verifier-check-passed {
          color: #059669;
        }

        .verifier-check-failed {
          color: #dc2626;
        }

        .verifier-hash {
          background: var(--bc-surface-soft);
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-lg);
          padding: 0.9rem;
        }

        .verifier-side {
          background: var(--bc-surface-soft);
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-xl);
          padding: 1rem;
          text-align: center;
        }

        .verifier-qr {
          display: inline-flex;
          background: #ffffff;
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-lg);
          padding: 0.8rem;
          margin-bottom: 1rem;
        }

        .verifier-empty {
          background: var(--bc-surface);
          border: 1px dashed #cbd5e1;
          border-radius: var(--bc-radius-xl);
          padding: 1.25rem;
          color: var(--bc-muted);
        }

        .verifier-how {
          margin-top: 1rem;
          padding: 1rem;
          border-radius: var(--bc-radius-xl);
          border: 1px solid var(--bc-border);
          background: var(--bc-surface);
          box-shadow: var(--bc-shadow-sm);
        }

        .verifier-how-list {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.75rem;
          margin-top: 0.9rem;
        }

        .verifier-how-step {
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-lg);
          background: var(--bc-surface-soft);
          padding: 0.8rem;
        }

        .verifier-how-step strong {
          color: var(--bc-text);
          display: block;
          margin-bottom: 0.25rem;
        }

        .verifier-summary-band {
          border-radius: var(--bc-radius-lg);
          padding: 1rem;
          margin-bottom: 1.25rem;
          border: 1px solid var(--bc-border);
          background: var(--bc-surface-soft);
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 0.85rem;
          align-items: flex-start;
        }

        .verifier-summary-icon {
          width: 44px;
          height: 44px;
          border-radius: var(--bc-radius-md);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: var(--bc-primary);
          color: #ffffff;
          flex-shrink: 0;
        }

        .verifier-success .verifier-summary-band {
          background: var(--bc-success-soft);
          border-color: #a7f3d0;
        }

        .verifier-success .verifier-summary-icon {
          background: var(--bc-success-strong);
        }

        .verifier-warning .verifier-summary-band {
          background: var(--bc-warning-soft);
          border-color: #fde68a;
        }

        .verifier-warning .verifier-summary-icon {
          background: var(--bc-warning-strong);
        }

        .verifier-danger .verifier-summary-band {
          background: var(--bc-danger-soft);
          border-color: #fecaca;
        }

        .verifier-danger .verifier-summary-icon {
          background: var(--bc-danger-strong);
        }

        @media(max-width: 768px) {
          .verifier-page {
            padding: 2.5rem 1rem 3.5rem;
          }

          .verifier-search-row {
            grid-template-columns: 1fr;
          }

          .verifier-btn {
            width: 100%;
          }

          .verifier-verify-button {
            width: 100%;
          }

          .verifier-result-head {
            flex-direction: column;
          }

          .verifier-how-list {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <main className="verifier-page">
        <div className="verifier-container">
          <header className="verifier-header">
            <div className="verifier-label">
              <FaShieldAlt />
              Public verifier
            </div>

            <h1 className="verifier-title">Verify a Certificate</h1>

            <p className="verifier-text">
              Confirm academic credentials using blockchain-backed certificate
              records.
            </p>
          </header>

          <Card className="verifier-search-card">
            <label className="fw-bold mb-2 d-block">Certificate ID</label>

            <div className="verifier-search-row">
              <div className="verifier-input-wrap">
                <FaSearch className="verifier-input-icon" />

                <input
                  type="text"
                  className="verifier-input"
                  placeholder="e.g. CT23A004"
                  value={certId}
                  onChange={(event) => setCertId(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      verifyCertificate();
                    }
                  }}
                  disabled={loading}
                />
              </div>

              <ActionButton
                onClick={() => verifyCertificate()}
                disabled={loading}
                variant="primary"
                className="verifier-verify-button"
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" />
                    Checking
                  </>
                ) : (
                  <>
                    Verify
                    <FaSearch />
                  </>
                )}
              </ActionButton>
            </div>

            {message.text && (
              <div className="mt-3">
                <AlertMessage type={message.type} message={message.text} />
              </div>
            )}

            <p className="verifier-muted small mb-0 mt-3">
              Enter the certificate ID or scan a QR code from a certificate.
            </p>
          </Card>

          <Card className="verifier-how">
            <h2 className="h5 fw-bold mb-1">How this verification works</h2>
            <p className="verifier-muted small mb-0">
              BlockCred compares institutional records with blockchain proof and
              revocation status.
            </p>

            <div className="verifier-how-list">
              <div className="verifier-how-step">
                <strong>1. Database search</strong>
                <span className="verifier-muted small">
                  The certificate ID is searched in the institutional database.
                </span>
              </div>

              <div className="verifier-how-step">
                <strong>2. Blockchain proof</strong>
                <span className="verifier-muted small">
                  The certificate hash is compared with blockchain proof.
                </span>
              </div>

              <div className="verifier-how-step">
                <strong>3. Revocation check</strong>
                <span className="verifier-muted small">
                  Revocation status is checked against the record.
                </span>
              </div>

              <div className="verifier-how-step">
                <strong>4. Public result</strong>
                <span className="verifier-muted small">
                  The verification result is displayed publicly.
                </span>
              </div>
            </div>
          </Card>

          {!certificate && !loading && (
            <div className="verifier-empty">
              <EmptyState
                title="Ready to verify"
                message="Search using the certificate ID printed on the certificate or included in the QR verification link."
              />
            </div>
          )}

          {certificate && verificationStatus && (
            <Card className={`verifier-card ${statusTheme.className}`}>
              <div className="verifier-result-head">
                <div>
                  <p className="verifier-muted small fw-bold mb-1">
                    Verification result
                  </p>

                  <h2 className="h3 fw-bold mb-1">
                    {resultSummary.title}
                  </h2>

                  <p className="verifier-muted mb-0">
                    Certificate ID:{" "}
                    <span className="font-monospace fw-bold text-dark">
                      {certificate.cert_id}
                    </span>
                  </p>
                </div>

                <StatusBadge
                  status={statusTheme.label}
                  type={statusTheme.badgeType}
                />
              </div>

              <div className="verifier-body">
                <div className="verifier-summary-band">
                  <span className="verifier-summary-icon">
                    {statusTheme.icon}
                  </span>

                  <span>
                    <strong className="d-block mb-1">
                      {resultSummary.title}
                    </strong>
                    <span className="verifier-muted">
                      {resultSummary.message}
                    </span>
                  </span>
                </div>

                <div className="row g-4">
                  <div className="col-lg-8">
                    <h3 className="h5 fw-bold mb-3">Certificate Details</h3>

                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <div className="verifier-detail">
                          <p className="verifier-detail-label">
                            Certificate ID
                          </p>
                          <p className="verifier-detail-value font-monospace">
                            {certificate.cert_id || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="verifier-detail">
                          <p className="verifier-detail-label">Student name</p>
                          <p className="verifier-detail-value">
                            {certificate.student_name || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="verifier-detail">
                          <p className="verifier-detail-label">Student ID</p>
                          <p className="verifier-detail-value">
                            {certificate.student_id || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="verifier-detail">
                          <p className="verifier-detail-label">
                            Degree program
                          </p>
                          <p className="verifier-detail-value">
                            {certificate.degree_program ||
                              certificate.degree ||
                              "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="col-md-3">
                        <div className="verifier-detail">
                          <p className="verifier-detail-label">GPA</p>
                          <p className="verifier-detail-value">
                            {certificate.gpa || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="col-md-3">
                        <div className="verifier-detail">
                          <p className="verifier-detail-label">Year</p>
                          <p className="verifier-detail-value">
                            {certificate.completion_year || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="verifier-detail">
                          <p className="verifier-detail-label">Issue date</p>
                          <p className="verifier-detail-value">
                            {certificate.issue_date || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="verifier-detail">
                          <p className="verifier-detail-label">
                            Blockchain time
                          </p>
                          <p className="verifier-detail-value">
                            {formatBlockchainDate(blockchainData?.issueDate)}
                          </p>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="verifier-detail">
                          <p className="verifier-detail-label">PDF file</p>
                          <p className="verifier-detail-value">
                            {certificate.pdf_url ? "Available" : "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="verifier-detail">
                          <p className="verifier-detail-label">
                            Revocation status
                          </p>
                          <p className="verifier-detail-value">
                            {certificate.revoked ? "Revoked" : "Not revoked"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <h3 className="h5 fw-bold mb-3">Verification Checks</h3>

                    <div className="row g-3 mb-4">
                      {checks.map((check) => (
                        <div className="col-md-6 col-xl-3" key={check.label}>
                          <div className="verifier-check">
                            <div className="verifier-check-top">
                              <span className="verifier-check-icon">
                                {check.icon}
                              </span>

                              {check.passed ? (
                                <FaCheckCircle className="verifier-check-passed" />
                              ) : (
                                <FaTimesCircle className="verifier-check-failed" />
                              )}
                            </div>

                            <p className="verifier-detail-label">
                              {check.label}
                            </p>

                            <p className="verifier-detail-value">
                              {check.value}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="verifier-hash">
                          <p className="fw-bold mb-1">Database PDF hash</p>

                          <p
                            className="font-monospace small text-break mb-0 verifier-muted"
                            title={certificate.pdf_hash || ""}
                          >
                            {shortenHash(certificate.pdf_hash)}
                          </p>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="verifier-hash">
                          <p className="fw-bold mb-1">Blockchain PDF hash</p>

                          <p
                            className="font-monospace small text-break mb-0 verifier-muted"
                            title={blockchainData?.pdfHash || ""}
                          >
                            {shortenHash(blockchainData?.pdfHash)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <AlertMessage
                        type={
                          verificationStatus.level === "success"
                            ? "success"
                            : verificationStatus.level === "warning"
                            ? "warning"
                            : "error"
                        }
                        message={`${verificationStatus.title}: ${verificationStatus.text}`}
                      />
                    </div>
                  </div>

                  <div className="col-lg-4">
                    <div className="verifier-side">
                      <div className="verifier-qr">
                        <QRCodeCanvas
                          value={getVerificationLink(certificate.cert_id)}
                          size={160}
                        />
                      </div>

                      <h3 className="h5 fw-bold mb-2">Share result</h3>

                      <p className="verifier-muted small mb-3">
                        Use this QR code or copy the public verification link.
                      </p>

                      <div className="d-grid gap-2">
                        {certificate.pdf_url && (
                          <a
                            href={certificate.pdf_url}
                            target="_blank"
                            rel="noreferrer"
                            className="verifier-btn"
                          >
                            <FaFileAlt />
                            Open PDF
                            <FaExternalLinkAlt />
                          </a>
                        )}

                        <ActionButton
                          onClick={copyVerificationLink}
                          variant="ghost"
                          className="w-100"
                        >
                          <FaCopy />
                          Copy Verification Link
                        </ActionButton>

                        <ActionButton
                          onClick={downloadReceipt}
                          variant="secondary"
                          className="w-100"
                          disabled={!certificate || !verificationStatus}
                          aria-label="Download verification receipt"
                        >
                          <FaDownload />
                          Download Verification Receipt
                        </ActionButton>

                        <ActionButton
                          onClick={() => {
                            resetVerification();
                            setCertId("");
                            window.history.replaceState(
                              null,
                              "",
                              "/public-verifier"
                            );
                            showMessage("info", "Ready for a new search.");
                          }}
                          variant="ghost"
                          className="w-100"
                        >
                          <FaRedo />
                          Verify Another
                        </ActionButton>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>
    </Layout>
  );
};

export default PublicVerifier;
