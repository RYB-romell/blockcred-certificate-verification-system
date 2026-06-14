import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaClock,
  FaCreditCard,
  FaDownload,
  FaMoneyBillWave,
  FaRedo,
  FaSearch,
  FaTimesCircle,
} from "react-icons/fa";
import AdminPageShell from "../components/layout/AdminPageShell.js";
import ActionButton from "../components/ui/ActionButton.js";
import AlertMessage from "../components/ui/AlertMessage.js";
import Card from "../components/ui/Card.js";
import EmptyState from "../components/ui/EmptyState.js";
import PaginationControls from "../components/ui/PaginationControls.js";
import StatCard from "../components/ui/StatCard.js";
import StatusBadge from "../components/ui/StatusBadge.js";
import { getAdminPaymentRecords } from "../services/paymentService.js";
import { downloadCsv, formatDateForCsv } from "../utils/exportCsv.js";

const formatDate = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleString();
};

const formatAmount = (amount, currency = "XAF") => {
  const value = Number(amount || 0);
  return `${Number.isFinite(value) ? value.toLocaleString() : "0"} ${currency}`;
};

const formatProvider = (provider) => {
  const normalized = String(provider || "mock").toLowerCase();

  if (normalized === "mock") return "Demo provider";
  if (normalized === "notchpay") return "Notch Pay";
  if (normalized === "campay") return "CamPay";

  return provider || "Not available";
};

const getStatusType = (status) => {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "successful") return "successful";
  if (normalized === "pending") return "pending";
  if (normalized === "failed" || normalized === "cancelled") return "failed";

  return "inactive";
};

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [gatewayFilter, setGatewayFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [message, setMessage] = useState({ type: "", text: "" });

  const fetchPayments = useCallback(async () => {
    setLoading(true);

    try {
      const data = await getAdminPaymentRecords({
        search,
        status: statusFilter,
        gateway: gatewayFilter,
        limit: 500,
      });

      setPayments(Array.isArray(data.payments) ? data.payments : []);
      setPage(1);
    } catch (error) {
      console.error("Fetch admin payment records error:", error);
      setMessage({
        type: "error",
        text:
          error.message ||
          "Could not load payment records. Please try again.",
      });
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [gatewayFilter, search, statusFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  const stats = useMemo(() => {
    const successful = payments.filter(
      (payment) => payment.status === "successful"
    );
    const pending = payments.filter((payment) => payment.status === "pending");
    const failed = payments.filter((payment) =>
      ["failed", "cancelled"].includes(payment.status)
    );
    const revenue = successful.reduce(
      (total, payment) => total + Number(payment.amount || 0),
      0
    );

    return {
      total: payments.length,
      successful: successful.length,
      pending: pending.length,
      failed: failed.length,
      revenue,
      currency: successful[0]?.currency || payments[0]?.currency || "XAF",
    };
  }, [payments]);

  const paginatedPayments = useMemo(() => {
    const start = (page - 1) * pageSize;
    return payments.slice(start, start + pageSize);
  }, [page, pageSize, payments]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(payments.length / pageSize));

    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, pageSize, payments.length]);

  const handleExportCsv = () => {
    downloadCsv("blockcred-payment-records.csv", payments, [
      { header: "Payment Reference", key: "payment_reference" },
      { header: "Student Email", key: "student_email" },
      { header: "Student ID", key: "student_id" },
      { header: "Amount", key: "amount" },
      { header: "Currency", key: "currency" },
      { header: "Provider", key: "gateway" },
      { header: "Status", key: "status" },
      { header: "Provider Reference", key: "gateway_transaction_id" },
      {
        header: "Created At",
        value: (payment) => formatDateForCsv(payment.created_at),
      },
      {
        header: "Paid At",
        value: (payment) => formatDateForCsv(payment.paid_at),
      },
    ]);

    setMessage({
      type: "success",
      text: "Payment records CSV export started.",
    });
  };

  return (
    <AdminPageShell
      title="Payments"
      subtitle="Review certificate access payments, provider status, and revenue activity."
      actions={
        <ActionButton
          variant="secondary"
          onClick={fetchPayments}
          disabled={loading}
        >
          <FaRedo />
          Refresh
        </ActionButton>
      }
    >
      <style>{`
        .payments-page {
          display: grid;
          gap: var(--bc-space-4);
        }

        .payments-toolbar {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 1rem;
          padding: 1rem;
          border-bottom: 1px solid var(--bc-border);
          background: var(--bc-surface);
        }

        .payments-filters {
          display: grid;
          grid-template-columns: minmax(260px, 1.4fr) minmax(150px, 0.7fr) minmax(150px, 0.7fr) auto;
          align-items: end;
          gap: 0.75rem;
          flex: 1;
          max-width: 860px;
        }

        .payments-search {
          position: relative;
          min-width: 0;
        }

        .payments-search svg {
          position: absolute;
          left: 0.9rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--bc-muted);
        }

        .payments-search .bc-input {
          padding-left: 2.35rem;
        }

        .payments-filters .bc-input,
        .payments-filters .bc-button {
          height: 42px;
        }

        .payments-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          min-width: 1080px;
        }

        .payments-table th {
          background: var(--bc-surface-soft);
          color: var(--bc-muted);
          font-size: 0.74rem;
          font-weight: 900;
          letter-spacing: 0;
          text-transform: uppercase;
          padding: 0.9rem 1rem;
          border-bottom: 1px solid var(--bc-border);
          white-space: nowrap;
        }

        .payments-table td {
          padding: 0.85rem 1rem;
          border-bottom: 1px solid var(--bc-border);
          vertical-align: middle;
        }

        .payments-ref {
          font-family: var(--bc-font-mono);
          font-weight: 900;
          color: var(--bc-text);
          max-width: 260px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .payments-muted {
          color: var(--bc-muted);
          max-width: 240px;
          display: inline-block;
          overflow: hidden;
          text-overflow: ellipsis;
          vertical-align: bottom;
          white-space: nowrap;
        }

        .payments-amount {
          white-space: nowrap;
        }

        @media (max-width: 860px) {
          .payments-toolbar {
            align-items: stretch;
            flex-direction: column;
          }

          .payments-filters,
          .payments-search {
            grid-template-columns: 1fr;
            width: 100%;
          }

          .payments-filters .bc-button {
            width: 100%;
          }
        }
      `}</style>

      <div className="payments-page">
        <AlertMessage
          type={message.type}
          message={message.text}
          onClose={() => setMessage({ type: "", text: "" })}
        />

        <section className="row g-3">
          <div className="col-sm-6 col-xl">
            <StatCard
              label="Total payments"
              value={loading ? "..." : stats.total}
              helper="Records matching current filters"
              icon={<FaCreditCard />}
            />
          </div>
          <div className="col-sm-6 col-xl">
            <StatCard
              label="Successful payments"
              value={loading ? "..." : stats.successful}
              helper="Completed access payments"
              icon={<FaMoneyBillWave />}
            />
          </div>
          <div className="col-sm-6 col-xl">
            <StatCard
              label="Pending payments"
              value={loading ? "..." : stats.pending}
              helper="Awaiting confirmation"
              icon={<FaClock />}
            />
          </div>
          <div className="col-sm-6 col-xl">
            <StatCard
              label="Failed / cancelled"
              value={loading ? "..." : stats.failed}
              helper="Needs attention"
              icon={<FaTimesCircle />}
            />
          </div>
          <div className="col-sm-6 col-xl">
            <StatCard
              label="Confirmed revenue"
              value={
                loading
                  ? "..."
                  : `${stats.revenue.toLocaleString()} ${stats.currency}`
              }
              helper="Successful payments only"
              icon={<FaMoneyBillWave />}
            />
          </div>
        </section>

        <Card className="overflow-hidden">
          <div className="payments-toolbar">
            <div>
              <h2 className="bc-section-title mb-1">Payment Activity</h2>
              <p className="bc-page-muted mb-0">
                Showing {payments.length} payment record(s).
              </p>
            </div>

            <div className="payments-filters">
              <div className="payments-search">
                <FaSearch />
                <input
                  type="text"
                  className="bc-input"
                  placeholder="Search reference, email, student ID..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Search payment records"
                />
              </div>

              <select
                className="bc-input"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter by payment status"
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="successful">Successful</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                className="bc-input"
                value={gatewayFilter}
                onChange={(event) => setGatewayFilter(event.target.value)}
                aria-label="Filter by payment provider"
              >
                <option value="all">All providers</option>
                <option value="mock">Demo provider</option>
                <option value="notchpay">Notch Pay</option>
                <option value="campay">CamPay</option>
              </select>

              <ActionButton
                variant="primary"
                onClick={handleExportCsv}
                disabled={loading || payments.length === 0}
              >
                <FaDownload />
                Export CSV
              </ActionButton>
            </div>
          </div>

          <div className="p-2 p-md-3">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary mb-3" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-primary fw-bold mb-0">
                  Loading payment records...
                </p>
              </div>
            ) : payments.length === 0 ? (
              <EmptyState
                title="No payment records found"
                message="Try a different search, status, or provider filter."
              />
            ) : (
              <>
                <div className="table-responsive">
                  <table className="payments-table">
                    <thead>
                      <tr>
                        <th>Reference</th>
                        <th>Student Email</th>
                        <th>Student ID</th>
                        <th>Amount</th>
                        <th>Provider</th>
                        <th>Status</th>
                        <th>Created Date</th>
                        <th>Paid Date</th>
                        <th>Provider Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedPayments.map((payment) => (
                        <tr key={payment.id || payment.payment_reference}>
                          <td>
                            <div className="payments-ref">
                              {payment.payment_reference || "Not available"}
                            </div>
                          </td>
                          <td>
                            <span className="payments-muted">
                              {payment.student_email || "Not available"}
                            </span>
                          </td>
                          <td>
                            <span className="payments-muted">
                              {payment.student_id || "Not available"}
                            </span>
                          </td>
                          <td>
                            <strong className="payments-amount">
                              {formatAmount(payment.amount, payment.currency)}
                            </strong>
                          </td>
                          <td>
                            <StatusBadge
                              status={formatProvider(payment.gateway)}
                              type={
                                String(payment.gateway || "mock").toLowerCase() ===
                                "mock"
                                  ? "pending"
                                  : "linked"
                              }
                            />
                          </td>
                          <td>
                            <StatusBadge
                              status={payment.status || "pending"}
                              type={getStatusType(payment.status)}
                            />
                          </td>
                          <td>{formatDate(payment.created_at)}</td>
                          <td>{formatDate(payment.paid_at)}</td>
                          <td>
                            <span className="payments-muted">
                              {payment.gateway_transaction_id ||
                                "Not available"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <PaginationControls
                  currentPage={page}
                  totalItems={payments.length}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                />
              </>
            )}
          </div>
        </Card>
      </div>
    </AdminPageShell>
  );
};

export default AdminPayments;
