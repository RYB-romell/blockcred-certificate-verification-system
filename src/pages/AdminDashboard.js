// src/pages/AdminDashboard.js

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import {
  FaArrowRight,
  FaCertificate,
  FaCheckCircle,
  FaCopy,
  FaDownload,
  FaFilePdf,
  FaExternalLinkAlt,
  FaRedo,
  FaSearch,
  FaShieldAlt,
  FaTimesCircle,
  FaUsers,
} from "react-icons/fa";
import { authFetch } from "../api.js";
import { getAdminContractWithSigner } from "../blockchain.js";
import AdminPageShell from "../components/layout/AdminPageShell.js";
import ActionButton from "../components/ui/ActionButton.js";
import AlertMessage from "../components/ui/AlertMessage.js";
import Card from "../components/ui/Card.js";
import ConfirmModal from "../components/ui/ConfirmModal.js";
import EmptyState from "../components/ui/EmptyState.js";
import PaginationControls from "../components/ui/PaginationControls.js";
import StatCard from "../components/ui/StatCard.js";
import StatusBadge from "../components/ui/StatusBadge.js";
import { downloadCsv } from "../utils/exportCsv.js";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [certificates, setCertificates] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCertificates: 0,
    activeCertificates: 0,
    revokedCertificates: 0,
    verifications: 0,
  });

  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [certificatePage, setCertificatePage] = useState(1);
  const [certificatePageSize, setCertificatePageSize] = useState(10);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });
  const [selectedRevokeCertificate, setSelectedRevokeCertificate] =
    useState(null);

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCertificatePage(1);
  }, [search, statusFilter]);

  const showMessage = (type, text) => {
    setMessage({ type, text });

    setTimeout(() => {
      setMessage({ type: "", text: "" });
    }, 6000);
  };

  const loadDashboard = async () => {
    await Promise.all([fetchCertificates(), fetchStats()]);
  };

  const fetchCertificates = async () => {
    setLoading(true);

    try {
      const response = await authFetch("/api/certificates");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch certificates.");
      }

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
      console.error("Fetch certificates error:", error);
      showMessage("error", error.message || "Failed to load certificates.");
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setStatsLoading(true);

    try {
      const response = await authFetch("/api/certificates/stats");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch dashboard stats.");
      }

      const payload = data?.data || data?.stats || data;

      setStats({
        totalStudents: payload.totalStudents || 0,
        totalCertificates: payload.totalCertificates || 0,
        activeCertificates: payload.activeCertificates || 0,
        revokedCertificates: payload.revokedCertificates || 0,
        verifications: payload.verifications || 0,
      });
    } catch (error) {
      console.error("Fetch stats error:", error);

      setStats({
        totalStudents: 0,
        totalCertificates: 0,
        activeCertificates: 0,
        revokedCertificates: 0,
        verifications: 0,
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const filteredCertificates = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return certificates.filter((certificate) => {
      const matchesSearch =
        !keyword ||
        String(certificate.cert_id || "").toLowerCase().includes(keyword) ||
        String(certificate.student_name || "").toLowerCase().includes(keyword) ||
        String(certificate.student_id || "").toLowerCase().includes(keyword) ||
        String(certificate.student_email || "").toLowerCase().includes(keyword) ||
        String(certificate.degree_program || "")
          .toLowerCase()
          .includes(keyword) ||
        String(certificate.degree || "").toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && !certificate.revoked) ||
        (statusFilter === "revoked" && certificate.revoked);

      return matchesSearch && matchesStatus;
    });
  }, [certificates, search, statusFilter]);

  const paginatedCertificates = useMemo(() => {
    const start = (certificatePage - 1) * certificatePageSize;
    return filteredCertificates.slice(start, start + certificatePageSize);
  }, [certificatePage, certificatePageSize, filteredCertificates]);

  useEffect(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(filteredCertificates.length / certificatePageSize)
    );

    if (certificatePage > totalPages) {
      setCertificatePage(totalPages);
    }
  }, [certificatePage, certificatePageSize, filteredCertificates.length]);

  const activeRate = useMemo(() => {
    if (!stats.totalCertificates) return 0;

    return Math.round(
      (stats.activeCertificates / stats.totalCertificates) * 100
    );
  }, [stats.activeCertificates, stats.totalCertificates]);

  const uploadedPdfCount = useMemo(() => {
    return certificates.filter((certificate) => Boolean(certificate.pdf_url))
      .length;
  }, [certificates]);

  const pdfCoverageRate = useMemo(() => {
    if (!stats.totalCertificates) return 0;

    return Math.round((uploadedPdfCount / stats.totalCertificates) * 100);
  }, [stats.totalCertificates, uploadedPdfCount]);

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
      console.error("Copy verification link error:", error);
      showMessage("error", "Could not copy verification link.");
    }
  };

  const exportCertificatesCsv = () => {
    downloadCsv("blockcred-dashboard-certificates.csv", filteredCertificates, [
      { header: "Certificate ID", key: "cert_id" },
      { header: "Student Name", key: "student_name" },
      { header: "Student Email", key: "student_email" },
      {
        header: "Program",
        value: (certificate) =>
          certificate.degree_program || certificate.degree || "",
      },
      { header: "Issue Date", key: "issue_date" },
      {
        header: "Status",
        value: (certificate) => (certificate.revoked ? "Revoked" : "Active"),
      },
      { header: "PDF URL", key: "pdf_url" },
      {
        header: "Transaction Hash",
        value: (certificate) =>
          certificate.transaction_hash ||
          certificate.blockchain_tx_hash ||
          certificate.tx_hash ||
          "",
      },
    ]);

    showMessage(
      "success",
      `Exported ${filteredCertificates.length} filtered certificate record(s).`
    );
  };

  const revokeCertificate = async (certId) => {
    if (!certId) {
      showMessage("error", "Certificate ID is missing.");
      return;
    }

    setActionLoading(true);

    try {
      showMessage("info", "Checking admin wallet...");

      const { contract } = await getAdminContractWithSigner();

      if (typeof contract.revokeCertificate !== "function") {
        throw new Error(
          "Your contract ABI does not contain revokeCertificate(). Check contract.js."
        );
      }

      showMessage("info", "Confirm the revocation transaction in MetaMask.");

      const tx = await contract.revokeCertificate(certId);

      showMessage("info", "Transaction sent. Waiting for confirmation...");

      await tx.wait();

      showMessage("info", "Blockchain confirmed. Updating database...");

      const response = await authFetch(`/api/certificates/${certId}/revoke`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          revoke_transaction_hash: tx.hash,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update database.");
      }

      showMessage("success", `Certificate ${certId} revoked.`);

      await loadDashboard();
      setSelectedRevokeCertificate(null);
    } catch (error) {
      console.error("Revoke error:", error);

      if (error?.code === "ACTION_REJECTED" || error?.code === 4001) {
        showMessage("error", "Transaction was rejected in MetaMask.");
      } else if (error?.reason) {
        showMessage("error", error.reason);
      } else {
        showMessage("error", error.message || "Failed to revoke certificate.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const confirmRevokeCertificate = () => {
    if (!selectedRevokeCertificate?.cert_id) {
      showMessage("error", "Certificate ID is missing.");
      return;
    }

    revokeCertificate(selectedRevokeCertificate.cert_id);
  };

  const statCards = [
    {
      label: "Total students",
      value: statsLoading ? "..." : stats.totalStudents,
      helper: "Registered records",
      icon: <FaUsers />,
    },
    {
      label: "Total certificates",
      value: statsLoading ? "..." : stats.totalCertificates,
      helper: "Issued credentials",
      icon: <FaCertificate />,
    },
    {
      label: "Active certificates",
      value: statsLoading ? "..." : stats.activeCertificates,
      helper: "Valid registry entries",
      icon: <FaCheckCircle />,
    },
    {
      label: "Revoked certificates",
      value: statsLoading ? "..." : stats.revokedCertificates,
      helper: "Blocked credentials",
      icon: <FaTimesCircle />,
    },
  ];

  const headerActions = (
    <>
      <div
        className="d-flex align-items-center gap-2 px-3 py-2"
        style={{
          background: "rgba(255, 255, 255, 0.08)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: 12,
          color: "#ffffff",
          minHeight: 38,
        }}
      >
        <FaShieldAlt />
        <span className="small" style={{ color: "#cbd5e1", fontWeight: 700 }}>
          Active rate
        </span>
        <strong>{statsLoading ? "..." : `${activeRate}%`}</strong>
      </div>

      <ActionButton
        variant="primary"
        onClick={loadDashboard}
        disabled={loading || statsLoading || actionLoading}
      >
        <FaRedo />
        Refresh
      </ActionButton>

      <ActionButton
        variant="secondary"
        onClick={() => navigate("/admin-certificate")}
      >
        Issue Certificate
        <FaArrowRight />
      </ActionButton>
    </>
  );

  return (
    <AdminPageShell
      title="Dashboard"
      subtitle="Certificates, students, blockchain activity, and revocation status."
      actions={headerActions}
    >
      <style>{`
        .admin-dashboard-insight {
          height: 100%;
          padding: var(--bc-space-5);
        }

        .admin-dashboard-health-card {
          min-height: 220px;
          padding: var(--bc-space-5);
          background: var(--bc-gradient);
          color: #ffffff;
          border-radius: var(--bc-radius-section);
          box-shadow: var(--bc-shadow-lg);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .admin-dashboard-health-card .admin-dashboard-muted {
          color: #dbeafe;
        }

        .admin-dashboard-coverage-card {
          min-height: 220px;
          padding: var(--bc-space-5);
          background: var(--bc-surface);
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-section);
          box-shadow: var(--bc-shadow-sm);
        }

        .admin-dashboard-health-icon {
          width: 44px;
          height: 44px;
          border-radius: var(--bc-radius-button);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.12);
          color: #ffffff;
          flex-shrink: 0;
        }

        .admin-dashboard-coverage-icon {
          width: 44px;
          height: 44px;
          border-radius: var(--bc-radius-button);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: var(--bc-soft-blue);
          color: var(--bc-cobalt);
          flex-shrink: 0;
        }

        .admin-dashboard-progress {
          height: 10px;
          border-radius: 999px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.18);
        }

        .admin-dashboard-progress-light {
          background: var(--bc-surface-soft);
        }

        .admin-dashboard-progress-fill {
          height: 100%;
          border-radius: inherit;
          background: var(--bc-success);
        }

        .admin-dashboard-progress-light .admin-dashboard-progress-fill {
          background: linear-gradient(90deg, var(--bc-cobalt), var(--bc-teal));
        }

        .admin-dashboard-toolbar {
          padding: 1rem;
          border-bottom: 1px solid var(--bc-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
          background: var(--bc-surface-soft);
        }

        .admin-dashboard-search-area {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          flex-wrap: wrap;
        }

        .admin-dashboard-search-wrap {
          position: relative;
          width: min(100%, 350px);
        }

        .admin-dashboard-search-icon {
          position: absolute;
          left: 0.85rem;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        .admin-dashboard-search-input,
        .admin-dashboard-filter {
          height: 38px;
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-button);
          background: var(--bc-surface);
          color: var(--bc-text);
          font-weight: 650;
          outline: none;
        }

        .admin-dashboard-search-input:focus,
        .admin-dashboard-filter:focus {
          border-color: var(--bc-cobalt);
          box-shadow: var(--bc-focus);
        }

        .admin-dashboard-search-input {
          width: 100%;
          padding: 0 0.8rem 0 2.35rem;
        }

        .admin-dashboard-filter {
          padding: 0 0.75rem;
        }

        .admin-dashboard-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          min-width: 980px;
        }

        .admin-dashboard-table th {
          position: sticky;
          top: 0;
          z-index: 2;
          background: var(--bc-surface-soft);
          color: var(--bc-text-soft);
          font-size: 0.72rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          font-weight: 850;
          padding: 0.8rem;
          border-bottom: 1px solid var(--bc-border);
        }

        .admin-dashboard-table td {
          padding: 0.8rem;
          border-bottom: 1px solid var(--bc-border);
          color: var(--bc-text-soft);
          font-size: 0.86rem;
          vertical-align: middle;
        }

        .admin-dashboard-table tbody tr:hover td {
          background: rgba(29, 78, 216, 0.035);
        }

        .admin-dashboard-qr {
          background: var(--bc-surface);
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-input);
          padding: 0.3rem;
          display: inline-flex;
        }

        .admin-dashboard-link {
          min-height: 38px;
          border-radius: var(--bc-radius-button);
          border: 1px solid var(--bc-border);
          background: var(--bc-surface);
          color: var(--bc-text-soft);
          padding: 0.5rem 0.75rem;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          text-decoration: none;
          white-space: nowrap;
        }

        @media(max-width: 768px) {
          .admin-dashboard-toolbar {
            align-items: flex-start;
          }

          .admin-dashboard-search-area,
          .admin-dashboard-search-wrap,
          .admin-dashboard-filter {
            width: 100%;
          }
        }
      `}</style>

      <AlertMessage
        type={message.type}
        message={message.text}
        onClose={() => setMessage({ type: "", text: "" })}
      />

      <section className="row g-3 mb-3">
        {statCards.map((card) => (
          <div className="col-sm-6 col-xl-3" key={card.label}>
            <StatCard
              label={card.label}
              value={card.value}
              helper={card.helper}
              icon={card.icon}
            />
          </div>
        ))}
      </section>

      <section className="row g-3 mb-3">
        <div className="col-lg-7">
          <div className="admin-dashboard-health-card">
            <div className="d-flex align-items-start justify-content-between gap-3 mb-4">
              <div>
                <p className="admin-dashboard-muted small fw-bold mb-1">
                  Trust / Registry Health
                </p>
                <h2 className="h4 fw-bold mb-2">Registry health</h2>
                <p className="admin-dashboard-muted mb-0">
                  {statsLoading
                    ? "Loading certificate registry health..."
                    : `${activeRate}% of issued certificates are currently active and trusted.`}
                </p>
              </div>

              <span className="admin-dashboard-health-icon">
                <FaShieldAlt />
              </span>
            </div>

            <div className="d-flex justify-content-between gap-3 mb-2">
              <span className="admin-dashboard-muted">Active rate</span>
              <strong>{statsLoading ? "..." : `${activeRate}%`}</strong>
            </div>

            <div
              className="admin-dashboard-progress"
              role="progressbar"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={activeRate}
              aria-label="Active certificate rate"
            >
              <div
                className="admin-dashboard-progress-fill"
                style={{ width: `${activeRate}%` }}
              />
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="admin-dashboard-coverage-card">
            <div className="d-flex align-items-start justify-content-between gap-3 mb-4">
              <div>
                <p className="bc-muted small fw-bold mb-1">
                  Upload coverage
                </p>
                <h2 className="h4 fw-bold mb-2">PDF files</h2>
                <p className="bc-muted mb-0">
                  {statsLoading
                    ? "Loading PDF coverage..."
                    : `${uploadedPdfCount} of ${stats.totalCertificates} certificates have uploaded PDF files.`}
                </p>
              </div>

              <span className="admin-dashboard-coverage-icon">
                <FaFilePdf />
              </span>
            </div>

            <div className="d-flex justify-content-between gap-3 mb-2">
              <span className="bc-muted">Upload coverage</span>
              <strong>{statsLoading ? "..." : `${pdfCoverageRate}%`}</strong>
            </div>

            <div
              className="admin-dashboard-progress admin-dashboard-progress-light"
              role="progressbar"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={pdfCoverageRate}
              aria-label="PDF upload coverage"
            >
              <div
                className="admin-dashboard-progress-fill"
                style={{ width: `${pdfCoverageRate}%` }}
              />
            </div>

            <p className="bc-muted small mb-0 mt-3">
              PDF coverage helps public verifiers compare stored files against
              blockchain-backed certificate hashes.
            </p>
          </div>
        </div>
      </section>

      <Card className="overflow-hidden">
        <div className="admin-dashboard-toolbar">
          <div>
            <h2 className="h5 fw-bold mb-1">Certificate records</h2>
            <p className="text-muted small mb-0">
              Showing {filteredCertificates.length} record(s).
            </p>
          </div>

          <div className="admin-dashboard-search-area">
            <div className="admin-dashboard-search-wrap">
              <FaSearch className="admin-dashboard-search-icon" />

              <input
                type="text"
                className="admin-dashboard-search-input"
                placeholder="Search record..."
                aria-label="Search certificate records"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <select
              className="admin-dashboard-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter certificate records by status"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="revoked">Revoked</option>
            </select>

            <ActionButton
              variant="ghost"
              onClick={exportCertificatesCsv}
              disabled={loading || actionLoading}
              aria-label="Export filtered dashboard certificate records as CSV"
            >
              <FaDownload />
              Export CSV
            </ActionButton>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5 px-3">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>

            <p className="text-primary fw-semibold mb-0">Loading records...</p>
          </div>
        ) : filteredCertificates.length === 0 ? (
          <EmptyState
            title="No certificates found"
            message="No certificate records match the current search and filter."
            action={
              <ActionButton
                variant="primary"
                onClick={() => navigate("/admin-certificate")}
              >
                Issue certificate
              </ActionButton>
            }
          />
        ) : (
          <div className="table-responsive">
            <table className="admin-dashboard-table">
              <thead>
                <tr>
                  <th>Certificate</th>
                  <th>Student</th>
                  <th>Program</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>PDF</th>
                  <th>QR</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {paginatedCertificates.map((certificate, index) => {
                  const verificationLink = getVerificationLink(
                    certificate.cert_id
                  );

                  return (
                    <tr key={certificate.cert_id || index}>
                      <td>
                        <div className="fw-bold text-dark font-monospace">
                          {certificate.cert_id || "N/A"}
                        </div>
                        <small className="text-muted">
                          {certificate.student_id || "No student ID"}
                        </small>
                      </td>

                      <td>
                        <div className="fw-bold text-dark">
                          {certificate.student_name || "N/A"}
                        </div>
                        <small className="text-muted">
                          {certificate.student_email || "No email"}
                        </small>
                      </td>

                      <td>
                        <div className="fw-semibold text-dark">
                          {certificate.degree_program ||
                            certificate.degree ||
                            "N/A"}
                        </div>
                        <small className="text-muted">
                          {certificate.completion_year || "No year"}
                        </small>
                      </td>

                      <td>{certificate.issue_date || "N/A"}</td>

                      <td>
                        <StatusBadge
                          status={certificate.revoked ? "revoked" : "active"}
                        />
                      </td>

                      <td>
                        {certificate.pdf_url ? (
                          <a
                            href={certificate.pdf_url}
                            target="_blank"
                            rel="noreferrer"
                            className="admin-dashboard-link"
                          >
                            PDF
                            <FaExternalLinkAlt />
                          </a>
                        ) : (
                          <span className="text-muted small">No PDF</span>
                        )}
                      </td>

                      <td>
                        {certificate.cert_id ? (
                          <div
                            className="admin-dashboard-qr"
                            title={verificationLink}
                          >
                            <QRCodeCanvas value={verificationLink} size={40} />
                          </div>
                        ) : (
                          <span className="text-muted small">N/A</span>
                        )}
                      </td>

                      <td>
                        <div className="d-flex flex-wrap gap-2">
                          <ActionButton
                            onClick={() =>
                              copyVerificationLink(certificate.cert_id)
                            }
                            disabled={!certificate.cert_id}
                          >
                            <FaCopy />
                            Copy
                          </ActionButton>

                          {!certificate.revoked && (
                            <ActionButton
                              variant="danger"
                              onClick={() =>
                                setSelectedRevokeCertificate(certificate)
                              }
                              disabled={actionLoading}
                            >
                              Revoke
                            </ActionButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <PaginationControls
              currentPage={certificatePage}
              totalItems={filteredCertificates.length}
              pageSize={certificatePageSize}
              onPageChange={setCertificatePage}
              onPageSizeChange={(nextPageSize) => {
                setCertificatePageSize(nextPageSize);
                setCertificatePage(1);
              }}
            />
          </div>
        )}
      </Card>

      <ConfirmModal
        open={Boolean(selectedRevokeCertificate)}
        title="Confirm Certificate Revocation"
        message="You are about to revoke this certificate. This action will mark the credential as invalid and may be recorded on-chain."
        confirmText="Revoke Certificate"
        cancelText="Cancel"
        variant="danger"
        loading={actionLoading}
        onConfirm={confirmRevokeCertificate}
        onCancel={() => setSelectedRevokeCertificate(null)}
      >
        <div className="d-grid gap-2">
          <div className="d-flex justify-content-between gap-3">
            <span className="text-muted">Certificate ID</span>
            <strong className="font-monospace text-end">
              {selectedRevokeCertificate?.cert_id || "N/A"}
            </strong>
          </div>
          <div className="d-flex justify-content-between gap-3">
            <span className="text-muted">Student</span>
            <strong className="text-end">
              {selectedRevokeCertificate?.student_name || "N/A"}
            </strong>
          </div>
          <div className="d-flex justify-content-between gap-3">
            <span className="text-muted">Programme/Degree</span>
            <strong className="text-end">
              {selectedRevokeCertificate?.degree_program ||
                selectedRevokeCertificate?.degree ||
                "N/A"}
            </strong>
          </div>
          <div className="d-flex justify-content-between gap-3">
            <span className="text-muted">Current status</span>
            <StatusBadge
              status={selectedRevokeCertificate?.revoked ? "revoked" : "active"}
            />
          </div>
          <p className="text-danger small fw-semibold mb-0 mt-2">
            Revoke carefully. Public verification will show this credential as
            invalid after confirmation.
          </p>
        </div>
      </ConfirmModal>
    </AdminPageShell>
  );
};

export default AdminDashboard;
