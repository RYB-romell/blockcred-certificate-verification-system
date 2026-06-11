import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaCreditCard,
  FaRedo,
} from "react-icons/fa";
import Layout from "../components/Layout.js";
import ActionButton from "../components/ui/ActionButton.js";
import AlertMessage from "../components/ui/AlertMessage.js";
import Card from "../components/ui/Card.js";
import EmptyState from "../components/ui/EmptyState.js";
import PageHeader from "../components/ui/PageHeader.js";
import PaginationControls from "../components/ui/PaginationControls.js";
import StatCard from "../components/ui/StatCard.js";
import StatusBadge from "../components/ui/StatusBadge.js";
import { getMyPaymentHistory } from "../services/paymentService.js";

const formatDate = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleString();
};

const formatAmount = (payment) => {
  const amount = Number(payment?.amount || 0);
  return `${Number.isFinite(amount) ? amount.toLocaleString() : "0"} ${
    payment?.currency || "XAF"
  }`;
};

const PaymentHistory = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [message, setMessage] = useState({ type: "", text: "" });

  const fetchHistory = async () => {
    setLoading(true);

    try {
      const data = await getMyPaymentHistory();
      setPayments(Array.isArray(data.payments) ? data.payments : []);
    } catch (error) {
      console.error("Fetch payment history error:", error);
      setMessage({
        type: "error",
        text: error.message || "Could not load payment history.",
      });
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const stats = useMemo(() => {
    const successful = payments.filter(
      (payment) => payment.status === "successful"
    ).length;
    const pending = payments.filter((payment) => payment.status === "pending")
      .length;
    const failed = payments.filter((payment) =>
      ["failed", "cancelled"].includes(payment.status)
    ).length;

    return {
      total: payments.length,
      successful,
      pending,
      failed,
      latestStatus: payments[0]?.status || "No payments",
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

  const headerActions = (
    <div className="d-flex flex-column flex-sm-row gap-2">
      <ActionButton variant="secondary" onClick={() => navigate("/dashboard")}>
        <FaArrowLeft />
        Back to My Credentials
      </ActionButton>
      <ActionButton variant="primary" onClick={fetchHistory} disabled={loading}>
        <FaRedo />
        Refresh
      </ActionButton>
    </div>
  );

  return (
    <Layout user="student" role="student">
      <style>{`
        .payment-history-page {
          min-height: calc(100vh - 64px);
          padding: var(--bc-space-6);
          background:
            radial-gradient(circle at top right, rgba(29, 78, 216, 0.1), transparent 34rem),
            var(--bc-bg);
        }

        .payment-history-container {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
        }

        .payment-history-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }

        .payment-history-table th {
          background: var(--bc-surface-soft);
          color: var(--bc-muted);
          font-size: 0.76rem;
          text-transform: uppercase;
          padding: 0.9rem 1rem;
          border-bottom: 1px solid var(--bc-border);
        }

        .payment-history-table td {
          padding: 1rem;
          border-bottom: 1px solid var(--bc-border);
          vertical-align: top;
        }

        .payment-reference {
          color: var(--bc-text);
          font-family: var(--bc-font-mono);
          font-weight: 800;
          overflow-wrap: anywhere;
        }

        .payment-muted {
          color: var(--bc-muted);
        }

        .payment-privacy-note {
          display: flex;
          align-items: flex-start;
          gap: 0.85rem;
          padding: 1rem;
          margin-bottom: 1rem;
          border: 1px solid rgba(29, 78, 216, 0.18);
          border-radius: var(--bc-radius-md);
          background: var(--bc-accent-soft);
          color: var(--bc-text);
        }

        .payment-privacy-note strong {
          display: block;
          margin-bottom: 0.15rem;
        }

        .payment-details summary {
          cursor: pointer;
          color: var(--bc-accent);
          font-weight: 800;
        }

        .payment-details code {
          display: block;
          margin-top: 0.5rem;
          padding: 0.65rem;
          border-radius: var(--bc-radius-sm);
          background: var(--bc-surface-soft);
          color: var(--bc-text);
          font-family: var(--bc-font-mono);
          font-size: 0.78rem;
          overflow-wrap: anywhere;
        }

        @media (max-width: 760px) {
          .payment-history-page {
            padding: var(--bc-space-4);
          }
        }
      `}</style>

      <main className="payment-history-page">
        <div className="payment-history-container">
          <PageHeader
            title="Payment History"
            subtitle="Review certificate access payments linked only to your student account."
            actions={headerActions}
          />

          <AlertMessage
            type={message.type}
            message={message.text}
            onClose={() => setMessage({ type: "", text: "" })}
          />

          <div className="payment-privacy-note">
            <FaCreditCard className="mt-1 text-primary" />
            <div>
              <strong>Private student payment records</strong>
              <span>
                This page only shows payments connected to your authenticated
                student account. Other students cannot access these records.
              </span>
            </div>
          </div>

          <section className="row g-3 mb-3">
            <div className="col-sm-6 col-xl-3">
              <StatCard
                label="Total payments"
                value={loading ? "..." : stats.total}
                helper="All payment attempts"
                icon={<FaCreditCard />}
              />
            </div>
            <div className="col-sm-6 col-xl-3">
              <StatCard
                label="Successful"
                value={loading ? "..." : stats.successful}
                helper="Access activated"
                icon={<FaCheckCircle />}
              />
            </div>
            <div className="col-sm-6 col-xl-3">
              <StatCard
                label="Pending"
                value={loading ? "..." : stats.pending}
                helper="Awaiting confirmation"
                icon={<FaClock />}
              />
            </div>
            <div className="col-sm-6 col-xl-3">
              <StatCard
                label="Last payment status"
                value={loading ? "..." : stats.latestStatus}
                helper={`${stats.failed} failed or cancelled`}
                icon={<FaCreditCard />}
              />
            </div>
          </section>

          <Card className="overflow-hidden">
            <div className="d-flex flex-column flex-md-row justify-content-between gap-3 p-4 border-bottom">
              <div>
                <h2 className="h5 fw-bold mb-1">Payment records</h2>
                <p className="payment-muted small mb-0">
                  Showing {payments.length} payment record(s) linked to your
                  student account.
                </p>
              </div>
              <StatusBadge status="Private student records" type="linked" />
            </div>

            {loading ? (
              <div className="text-center py-5 px-3">
                <div className="spinner-border text-primary mb-3" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-primary fw-semibold mb-0">
                  Loading payment history...
                </p>
              </div>
            ) : payments.length === 0 ? (
              <EmptyState
                title="No payment records found"
                message="Payments you start for certificate access will appear here."
              />
            ) : (
              <div className="table-responsive">
                <table className="payment-history-table">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Amount</th>
                      <th>Gateway</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Paid</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPayments.map((payment) => (
                      <tr key={payment.id || payment.payment_reference}>
                        <td>
                          <div className="payment-reference">
                            {payment.payment_reference || "N/A"}
                          </div>
                        </td>
                        <td>{formatAmount(payment)}</td>
                        <td>{payment.gateway || "N/A"}</td>
                        <td>
                          <StatusBadge
                            status={payment.status || "pending"}
                            type={payment.status || "pending"}
                          />
                        </td>
                        <td>
                          <FaCalendarAlt className="me-2 text-primary" />
                          {formatDate(payment.created_at)}
                        </td>
                        <td>{formatDate(payment.paid_at)}</td>
                        <td>
                          <details className="payment-details">
                            <summary>View details</summary>
                            <code>
                              Transaction ID:{" "}
                              {payment.gateway_transaction_id || "Not available"}
                            </code>
                          </details>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <PaginationControls
                  currentPage={page}
                  totalItems={payments.length}
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
        </div>
      </main>
    </Layout>
  );
};

export default PaymentHistory;
