// src/pages/AdminCertificates.js

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import {
  FaArrowRight,
  FaCertificate,
  FaCheckCircle,
  FaCopy,
  FaDownload,
  FaExternalLinkAlt,
  FaFilePdf,
  FaQrcode,
  FaRedo,
  FaSearch,
  FaTimesCircle,
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

const AdminCertificates = () => {
  const navigate = useNavigate();

  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revokingCertId, setRevokingCertId] = useState("");
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
    fetchCertificates();
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
      showMessage("error", error.message || "Could not fetch certificates.");
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  const revokeCertificate = async (certificate) => {
    if (!certificate?.cert_id) {
      showMessage("error", "Certificate ID is missing.");
      return;
    }

    setRevokingCertId(certificate.cert_id);

    try {
      showMessage("info", "Checking admin wallet...");

      const { contract } = await getAdminContractWithSigner();

      if (typeof contract.revokeCertificate !== "function") {
        throw new Error(
          "Your contract ABI does not contain revokeCertificate(). Check contract.js."
        );
      }

      showMessage("info", "Confirm the revocation transaction in MetaMask.");

      const tx = await contract.revokeCertificate(certificate.cert_id);

      showMessage("info", "Transaction sent. Waiting for confirmation...");

      await tx.wait();

      showMessage("info", "Blockchain confirmed. Updating database...");

      const response = await authFetch(
        `/api/certificates/${certificate.cert_id}/revoke`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            revoke_transaction_hash: tx.hash,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update database.");
      }

      showMessage("success", `Certificate ${certificate.cert_id} revoked.`);

      await fetchCertificates();
      setSelectedRevokeCertificate(null);
    } catch (error) {
      console.error("Revoke certificate error:", error);

      if (error?.code === "ACTION_REJECTED" || error?.code === 4001) {
        showMessage("error", "Revocation transaction was rejected in MetaMask.");
      } else if (error?.reason) {
        showMessage("error", error.reason);
      } else {
        showMessage("error", error.message || "Failed to revoke certificate.");
      }
    } finally {
      setRevokingCertId("");
    }
  };

  const confirmRevokeCertificate = () => {
    if (!selectedRevokeCertificate?.cert_id) {
      showMessage("error", "Certificate ID is missing.");
      return;
    }

    revokeCertificate(selectedRevokeCertificate);
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

  const exportCertificatesCsv = () => {
    downloadCsv("blockcred-certificate-registry.csv", filteredCertificates, [
      { header: "Certificate ID", key: "cert_id" },
      { header: "Student ID", key: "student_id" },
      { header: "Student Name", key: "student_name" },
      { header: "Student Email", key: "student_email" },
      {
        header: "Program/Degree",
        value: (certificate) =>
          certificate.degree_program || certificate.degree || "",
      },
      { header: "GPA", key: "gpa" },
      { header: "Completion Year", key: "completion_year" },
      { header: "Issue Date", key: "issue_date" },
      {
        header: "Status",
        value: (certificate) => (certificate.revoked ? "Revoked" : "Active"),
      },
      { header: "Revoked", key: "revoked" },
      { header: "PDF URL", key: "pdf_url" },
      {
        header: "PDF Hash",
        value: (certificate) =>
          certificate.pdf_hash || certificate.file_hash || certificate.hash || "",
      },
      {
        header: "Transaction Hash",
        value: (certificate) =>
          certificate.transaction_hash ||
          certificate.blockchain_tx_hash ||
          certificate.tx_hash ||
          "",
      },
      {
        header: "Revoke Transaction Hash",
        value: (certificate) =>
          certificate.revoke_transaction_hash ||
          certificate.revocation_tx_hash ||
          certificate.revoked_transaction_hash ||
          "",
      },
    ]);

    showMessage(
      "success",
      `Exported ${filteredCertificates.length} filtered certificate record(s).`
    );
  };

  const filteredCertificates = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return certificates.filter((certificate) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && !certificate.revoked) ||
        (statusFilter === "revoked" && certificate.revoked) ||
        (statusFilter === "pdf" && Boolean(certificate.pdf_url));

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

      return matchesStatus && matchesSearch;
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

  const stats = useMemo(() => {
    const active = certificates.filter((certificate) => !certificate.revoked);
    const revoked = certificates.filter((certificate) => certificate.revoked);
    const withPdf = certificates.filter((certificate) => certificate.pdf_url);

    return {
      all: certificates.length,
      active: active.length,
      revoked: revoked.length,
      withPdf: withPdf.length,
    };
  }, [certificates]);

  const activeRate = useMemo(() => {
    if (!stats.all) return 0;
    return Math.round((stats.active / stats.all) * 100);
  }, [stats]);

  const pdfCoverageRate = useMemo(() => {
    if (!stats.all) return 0;
    return Math.round((stats.withPdf / stats.all) * 100);
  }, [stats]);

  const statCards = [
    {
      key: "all",
      label: "Total records",
      value: stats.all,
      helper: "Issued certificates",
      icon: <FaCertificate />,
    },
    {
      key: "active",
      label: "Active",
      value: stats.active,
      helper: "Available to verify",
      icon: <FaCheckCircle />,
    },
    {
      key: "revoked",
      label: "Revoked",
      value: stats.revoked,
      helper: "Marked invalid",
      icon: <FaTimesCircle />,
    },
    {
      key: "pdf",
      label: "File coverage",
      value: `${pdfCoverageRate}%`,
      helper: `${stats.withPdf} files uploaded`,
      icon: <FaFilePdf />,
    },
  ];

  const headerActions = (
    <>
      <ActionButton
        variant="primary"
        onClick={fetchCertificates}
        disabled={loading || Boolean(revokingCertId)}
      >
        <FaRedo />
        Refresh
      </ActionButton>

      <ActionButton
        variant="secondary"
        onClick={() => navigate("/admin-certificate")}
      >
        Issue Credential
        <FaArrowRight />
      </ActionButton>
    </>
  );

  return (
    <AdminPageShell
      title="Certificate Records"
      subtitle="Review issued certificates, file attachments, sharing links, and revocation status."
      actions={headerActions}
    >
      <style>{`
        .certs-stat-button {
          width: 100%;
          height: 100%;
          border: 0;
          padding: 0;
          background: transparent;
          text-align: left;
        }

        .certs-stat-button.active > div {
          border-color: var(--bc-primary) !important;
          box-shadow: var(--bc-focus) !important;
        }

        .certs-health-card {
          background: var(--bc-gradient);
          color: #ffffff;
          border-radius: var(--bc-radius-section);
          padding: var(--bc-space-5);
          box-shadow: var(--bc-shadow-lg);
          border: 1px solid rgba(255, 255, 255, 0.12);
          height: 100%;
        }

        .certs-health-card .certs-muted {
          color: #dbeafe;
        }

        .certs-risk-card {
          background: var(--bc-surface);
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-section);
          padding: var(--bc-space-5);
          box-shadow: var(--bc-shadow-sm);
          height: 100%;
        }

        .certs-progress {
          height: 10px;
          border-radius: 999px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.18);
        }

        .certs-progress-light {
          background: var(--bc-surface-soft);
        }

        .certs-progress-fill {
          height: 100%;
          border-radius: inherit;
          background: var(--bc-success);
        }

        .certs-progress-danger {
          background: var(--bc-danger);
        }

        .certs-toolbar {
          padding: 1rem;
          border-bottom: 1px solid var(--bc-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
          background: var(--bc-surface-soft);
        }

        .certs-search-area {
          display: flex;
          gap: 0.55rem;
          flex-wrap: wrap;
          align-items: center;
        }

        .certs-search-wrap {
          position: relative;
          width: min(100%, 350px);
        }

        .certs-search-icon {
          position: absolute;
          left: 0.85rem;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        .certs-search-input,
        .certs-filter {
          min-height: 40px;
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-md);
          background: var(--bc-surface);
          color: var(--bc-text);
          font-weight: 650;
          outline: none;
        }

        .certs-search-input:focus,
        .certs-filter:focus {
          border-color: var(--bc-cobalt);
          box-shadow: var(--bc-focus);
        }

        .certs-search-input {
          width: 100%;
          padding: 0 0.8rem 0 2.35rem;
        }

        .certs-filter {
          padding: 0 0.75rem;
        }

        .certs-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          min-width: 1080px;
        }

        .certs-table th {
          position: sticky;
          top: 0;
          z-index: 2;
          background: var(--bc-surface-soft);
          color: var(--bc-muted);
          font-size: 0.72rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          font-weight: 850;
          padding: 0.8rem;
          border-bottom: 1px solid var(--bc-border);
        }

        .certs-table td {
          padding: 0.9rem 0.8rem;
          border-bottom: 1px solid var(--bc-border);
          color: var(--bc-text-soft);
          font-size: 0.86rem;
          vertical-align: middle;
        }

        .certs-table tbody tr:hover td {
          background: rgba(29, 78, 216, 0.035);
        }

        .certs-qr-box {
          background: var(--bc-surface);
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-sm);
          padding: 0.3rem;
          display: inline-flex;
        }

        .certs-link-button {
          min-height: 38px;
          border-radius: var(--bc-radius-md);
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

        .certs-link-button:hover {
          background: var(--bc-surface-soft);
          color: var(--bc-text);
        }

        .certs-loading {
          padding: var(--bc-space-12) var(--bc-space-4);
          text-align: center;
        }

        @media(max-width: 768px) {
          .certs-toolbar {
            flex-direction: column;
            align-items: flex-start;
          }

          .certs-search-area,
          .certs-search-wrap,
          .certs-filter {
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
        {statCards.map((card) => {
          const isActive = statusFilter === card.key;

          return (
            <div className="col-sm-6 col-xl-3" key={card.key}>
              <button
                type="button"
                onClick={() => setStatusFilter(card.key)}
                className={`certs-stat-button ${isActive ? "active" : ""}`}
                aria-pressed={isActive}
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
        <div className="col-lg-7">
          <div className="certs-health-card">
            <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
              <div>
                <p className="certs-muted small fw-bold mb-1">
                  Record status
                </p>
                <h2 className="h4 fw-bold mb-2">Ready to verify</h2>
                <p className="certs-muted mb-0">
                  {loading
                    ? "Preparing record summary..."
                    : "Active records are available for public verification."}
                </p>
              </div>

              <StatusBadge
                status={loading ? "Loading" : `${activeRate}% active`}
                type={activeRate > 0 ? "valid" : "pending"}
              />
            </div>

            <div className="d-flex justify-content-between gap-3 mb-2">
              <span className="certs-muted">Valid records</span>
              <strong>{loading ? "..." : `${stats.active} of ${stats.all}`}</strong>
            </div>

            <div
              className="certs-progress"
              role="progressbar"
              aria-label="Active certificate rate"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={activeRate}
            >
              <div
                className="certs-progress-fill"
                style={{ width: `${activeRate}%` }}
              />
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="certs-risk-card">
            <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
              <div>
                <p className="bc-muted small fw-bold mb-1">
                  Revocation status
                </p>
                <h2 className="h4 fw-bold mb-2">Invalid records</h2>
                <p className="bc-muted mb-0">
                  Revoked certificates stay searchable but are shown as invalid.
                </p>
              </div>

              <StatusBadge
                status={loading ? "Loading" : `${stats.revoked} revoked`}
                type={stats.revoked ? "revoked" : "valid"}
              />
            </div>

            <div className="d-flex justify-content-between gap-3 mb-2">
              <span className="bc-muted">File coverage</span>
              <strong>{loading ? "..." : `${pdfCoverageRate}%`}</strong>
            </div>

            <div
              className="certs-progress certs-progress-light"
              role="progressbar"
              aria-label="PDF coverage"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={pdfCoverageRate}
            >
              <div
                className="certs-progress-fill"
                style={{ width: `${pdfCoverageRate}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <Card className="overflow-hidden">
        <div className="certs-toolbar">
          <div>
            <h2 className="h5 fw-bold mb-1">Records list</h2>

            <p className="bc-muted small mb-0">
              Showing {filteredCertificates.length} record(s).
            </p>
          </div>

          <div className="certs-search-area">
            <div className="certs-search-wrap">
              <FaSearch className="certs-search-icon" />

              <input
                className="certs-search-input"
                placeholder="Search certificate, student, or program..."
                aria-label="Search certificate records"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <select
              className="certs-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter certificates"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="revoked">Revoked</option>
              <option value="pdf">With PDF</option>
            </select>

            <ActionButton
              variant="ghost"
              onClick={fetchCertificates}
              disabled={loading || Boolean(revokingCertId)}
            >
              <FaRedo />
              Refresh
            </ActionButton>

            <ActionButton
              variant="ghost"
              onClick={exportCertificatesCsv}
              disabled={loading || Boolean(revokingCertId)}
              aria-label="Export filtered certificate records as CSV"
            >
              <FaDownload />
              Export CSV
            </ActionButton>
          </div>
        </div>

        {loading ? (
          <div className="certs-loading">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>

            <p className="fw-semibold mb-1">Loading certificate records...</p>
            <p className="bc-muted small mb-0">
              Preparing issued certificates, file links, and current statuses.
            </p>
          </div>
        ) : filteredCertificates.length === 0 ? (
          <EmptyState
            title="No certificates found"
            message="No certificate matches the current search and filter."
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
            <table className="certs-table">
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
                            className="certs-link-button"
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
                          <div className="certs-qr-box" title={verificationLink}>
                            <QRCodeCanvas value={verificationLink} size={40} />
                          </div>
                        ) : (
                          <FaQrcode className="text-muted" />
                        )}
                      </td>

                      <td>
                        <div className="d-flex flex-wrap gap-2">
                          <ActionButton
                            onClick={() =>
                              copyVerificationLink(certificate.cert_id)
                            }
                            disabled={!certificate.cert_id}
                            aria-label={`Copy verification link for ${
                              certificate.cert_id || "certificate"
                            }`}
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
                              disabled={
                                Boolean(revokingCertId) || !certificate.cert_id
                              }
                              aria-label={`Revoke certificate ${
                                certificate.cert_id || ""
                              }`}
                            >
                              {revokingCertId === certificate.cert_id
                                ? "Revoking..."
                                : "Revoke"}
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
        message="You are about to mark this certificate as invalid across public verification."
        confirmText="Revoke Certificate"
        cancelText="Cancel"
        variant="danger"
        loading={Boolean(revokingCertId)}
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
            Revoke carefully. Public verification will show this certificate as
            invalid after confirmation.
          </p>
        </div>
      </ConfirmModal>
    </AdminPageShell>
  );
};

export default AdminCertificates;
