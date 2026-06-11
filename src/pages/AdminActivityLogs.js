import { useEffect, useMemo, useState } from "react";
import {
  FaClipboardList,
  FaCreditCard,
  FaFileSignature,
  FaRedo,
  FaSearch,
  FaUserGraduate,
} from "react-icons/fa";
import { authFetch } from "../api.js";
import AdminPageShell from "../components/layout/AdminPageShell.js";
import ActionButton from "../components/ui/ActionButton.js";
import AlertMessage from "../components/ui/AlertMessage.js";
import Card from "../components/ui/Card.js";
import EmptyState from "../components/ui/EmptyState.js";
import PaginationControls from "../components/ui/PaginationControls.js";
import StatCard from "../components/ui/StatCard.js";
import StatusBadge from "../components/ui/StatusBadge.js";

const actionOptions = [
  { value: "", label: "All actions" },
  { value: "student_created", label: "Student created" },
  { value: "student_updated", label: "Student updated" },
  { value: "student_deleted", label: "Student deleted" },
  { value: "student_account_linked", label: "Account linked" },
  { value: "certificate_issued", label: "Certificate issued" },
  { value: "certificate_upload_recovered", label: "Upload recovered" },
  { value: "certificate_revoked", label: "Certificate revoked" },
  { value: "payment_initiated", label: "Payment initiated" },
  { value: "payment_confirmed_mock", label: "Mock payment confirmed" },
];

const entityOptions = [
  { value: "", label: "All entities" },
  { value: "student", label: "Students" },
  { value: "certificate", label: "Certificates" },
  { value: "payment", label: "Payments" },
];

const formatAction = (action) => {
  return String(action || "activity")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatTime = (value) => {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
};

const getActionBadgeType = (action) => {
  if (String(action).includes("revoked") || String(action).includes("deleted")) {
    return "revoked";
  }

  if (String(action).includes("payment")) {
    return "pending";
  }

  if (String(action).includes("issued") || String(action).includes("created")) {
    return "valid";
  }

  return "linked";
};

const AdminActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [message, setMessage] = useState({ type: "", text: "" });

  const fetchLogs = async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams({ limit: "200" });

      if (actionFilter) params.set("action", actionFilter);
      if (entityFilter) params.set("entity_type", entityFilter);

      const response = await authFetch(`/api/activity-logs?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch activity logs.");
      }

      setLogs(Array.isArray(data.logs) ? data.logs : []);
    } catch (error) {
      console.error("Fetch activity logs error:", error);
      setMessage({
        type: "error",
        text: error.message || "Could not load activity logs.",
      });
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionFilter, entityFilter]);

  useEffect(() => {
    setPage(1);
  }, [actionFilter, entityFilter]);

  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return logs.slice(start, start + pageSize);
  }, [logs, page, pageSize]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(logs.length / pageSize));

    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [logs.length, page, pageSize]);

  const stats = useMemo(() => {
    return {
      total: logs.length,
      students: logs.filter((log) => log.entity_type === "student").length,
      certificates: logs.filter((log) => log.entity_type === "certificate")
        .length,
      payments: logs.filter((log) => log.entity_type === "payment").length,
    };
  }, [logs]);

  const headerActions = (
    <ActionButton variant="primary" onClick={fetchLogs} disabled={loading}>
      <FaRedo />
      Refresh
    </ActionButton>
  );

  return (
    <AdminPageShell
      title="Activity Log"
      subtitle="Track certificate, student, payment, and administrative actions."
      actions={headerActions}
    >
      <style>{`
        .activity-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: var(--bc-space-5);
          border-bottom: 1px solid var(--bc-border);
        }

        .activity-filters {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .activity-filter {
          min-width: 190px;
          border: 1px solid var(--bc-border);
          border-radius: 14px;
          padding: 0.75rem 0.9rem;
          background: var(--bc-surface);
          color: var(--bc-text);
          font-weight: 700;
        }

        .activity-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          min-width: 980px;
        }

        .activity-table th {
          background: var(--bc-surface-soft);
          color: var(--bc-muted);
          font-size: 0.76rem;
          text-transform: uppercase;
          padding: 0.9rem 1rem;
          border-bottom: 1px solid var(--bc-border);
          white-space: nowrap;
        }

        .activity-table td {
          padding: 0.85rem 1rem;
          border-bottom: 1px solid var(--bc-border);
          vertical-align: middle;
        }

        .activity-description {
          max-width: 360px;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .activity-entity {
          max-width: 260px;
        }

        .activity-entity-id,
        .activity-metadata-text {
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .activity-metadata-details {
          max-width: 300px;
        }

        .activity-metadata-details summary {
          cursor: pointer;
          color: var(--bc-accent);
          font-weight: 850;
          list-style: none;
        }

        .activity-metadata-details summary::-webkit-details-marker {
          display: none;
        }

        .activity-metadata-text {
          max-height: 160px;
          overflow: auto;
          margin: 0.55rem 0 0;
          padding: 0.75rem;
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-md);
          background: var(--bc-surface-soft);
          color: var(--bc-muted);
          font-size: 0.78rem;
          white-space: pre-wrap;
        }

        @media (max-width: 900px) {
          .activity-toolbar,
          .activity-filters,
          .activity-filter {
            width: 100%;
          }

          .activity-toolbar {
            align-items: stretch;
            flex-direction: column;
          }
        }
      `}</style>

      <AlertMessage
        type={message.type}
        message={message.text}
        onClose={() => setMessage({ type: "", text: "" })}
      />

      <section className="row g-3 mb-3">
        <div className="col-sm-6 col-xl-3">
          <StatCard
            label="Total logs"
            value={loading ? "..." : stats.total}
            helper="Latest audit records"
            icon={<FaClipboardList />}
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <StatCard
            label="Student actions"
            value={loading ? "..." : stats.students}
            helper="Access and account changes"
            icon={<FaUserGraduate />}
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <StatCard
            label="Certificate actions"
            value={loading ? "..." : stats.certificates}
            helper="Issue, recover, revoke"
            icon={<FaFileSignature />}
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <StatCard
            label="Payment actions"
            value={loading ? "..." : stats.payments}
            helper="Initiated and confirmed"
            icon={<FaCreditCard />}
          />
        </div>
      </section>

      <Card className="overflow-hidden">
        <div className="activity-toolbar">
          <div>
            <h2 className="h5 fw-bold mb-1">Audit records</h2>
            <p className="bc-page-muted small mb-0">
              Showing {logs.length} recent activity log record(s).
            </p>
          </div>

          <div className="activity-filters">
            <FaSearch className="text-primary" />
            <select
              className="activity-filter"
              value={actionFilter}
              onChange={(event) => setActionFilter(event.target.value)}
              aria-label="Filter activity logs by action"
            >
              {actionOptions.map((option) => (
                <option key={option.value || "all-actions"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              className="activity-filter"
              value={entityFilter}
              onChange={(event) => setEntityFilter(event.target.value)}
              aria-label="Filter activity logs by entity type"
            >
              {entityOptions.map((option) => (
                <option key={option.value || "all-entities"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5 px-3">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-primary fw-semibold mb-0">
              Loading activity logs...
            </p>
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            title="No activity logs found"
            message="Try another filter, or run the activity log SQL in Supabase if this is the first setup."
          />
        ) : (
          <div className="table-responsive">
            <table className="activity-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Entity</th>
                  <th>Description</th>
                  <th>Metadata</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatTime(log.created_at)}</td>
                    <td>
                      <StatusBadge
                        status={formatAction(log.action)}
                        type={getActionBadgeType(log.action)}
                      />
                    </td>
                    <td>
                      <div className="fw-bold text-dark">
                        {log.actor_email || "System"}
                      </div>
                      <small className="text-muted">
                        {log.actor_role || "No role"}
                      </small>
                    </td>
                    <td className="activity-entity">
                      <div className="fw-bold text-dark">
                        {log.entity_label || log.entity_id || "N/A"}
                      </div>
                      <small className="text-muted activity-entity-id">
                        {log.entity_type || "Unknown"}{" "}
                        {log.entity_id ? `- ${log.entity_id}` : ""}
                      </small>
                    </td>
                    <td>
                      <div className="activity-description">
                        {log.description || "No description."}
                      </div>
                    </td>
                    <td>
                      {log.metadata && Object.keys(log.metadata).length > 0 ? (
                        <details className="activity-metadata-details">
                          <summary>View metadata</summary>
                          <pre className="activity-metadata-text">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        <span className="text-muted small">No metadata</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <PaginationControls
              currentPage={page}
              totalItems={logs.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(nextPageSize) => {
                setPageSize(nextPageSize);
                setPage(1);
              }}
            />
          </div>
        )}
      </Card>
    </AdminPageShell>
  );
};

export default AdminActivityLogs;
