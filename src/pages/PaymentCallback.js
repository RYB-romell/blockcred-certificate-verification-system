import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FaArrowRight,
  FaCheckCircle,
  FaCreditCard,
  FaExclamationTriangle,
  FaRedo,
  FaShieldAlt,
} from "react-icons/fa";
import Layout from "../components/Layout.js";
import {
  confirmMockPayment,
  getPaymentStatus,
} from "../services/paymentService.js";
import ActionButton from "../components/ui/ActionButton.js";
import AlertMessage from "../components/ui/AlertMessage.js";
import Card from "../components/ui/Card.js";
import EmptyState from "../components/ui/EmptyState.js";
import StatusBadge from "../components/ui/StatusBadge.js";

const formatAmount = (amount, currency) => {
  const numericAmount = Number(amount || 0);
  const finalCurrency = currency || "XAF";

  if (!numericAmount) return finalCurrency;

  return `${numericAmount.toLocaleString()} ${finalCurrency}`;
};

const MOCK_CONFIRM_DISABLED_MESSAGE =
  "Demo payment confirmation is disabled in this environment.";

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const reference = searchParams.get("reference") || "";
  const isMock = searchParams.get("mock") === "true";

  const [payment, setPayment] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  const statusTheme = useMemo(() => {
    const status = String(payment?.status || "").toLowerCase();

    if (subscriptionStatus === "active" || status === "successful") {
      return {
        icon: <FaCheckCircle />,
        className: "payment-callback-success",
        label: "Payment confirmed",
        badgeType: "successful",
        title: "Access Activated",
        text: "Your certificate access is now active.",
      };
    }

    if (status === "failed" || status === "cancelled") {
      return {
        icon: <FaExclamationTriangle />,
        className: "payment-callback-error",
        label: "Payment not completed",
        badgeType: "failed",
        title: "Payment Not Completed",
        text: "Please try again or contact support.",
      };
    }

    return {
      icon: <FaCreditCard />,
      className: "payment-callback-pending",
      label: "Payment pending",
      badgeType: "pending",
      title: "Payment Pending",
      text: "Your payment is waiting for confirmation.",
    };
  }, [payment, subscriptionStatus]);

  const canConfirmMock = isMock && payment?.status === "pending";

  const showMessage = (type, text) => {
    setMessage({ type, text });
  };

  const loadPaymentStatus = async () => {
    if (!reference) {
      setLoading(false);
      showMessage("error", "Payment reference is missing.");
      return;
    }

    setLoading(true);

    try {
      const data = await getPaymentStatus(reference);

      setPayment(data.payment || null);
      setSubscriptionStatus(data.subscription_status || "inactive");
      setMessage({ type: "", text: "" });
    } catch (error) {
      console.error("Payment status error:", error);
      showMessage("error", error.message || "Could not check payment status.");
      setPayment(null);
      setSubscriptionStatus("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference]);

  const handleConfirmMockPayment = async () => {
    if (!reference) {
      showMessage("error", "Payment reference is missing.");
      return;
    }

    setConfirming(true);
    showMessage("info", "Confirming demo payment...");

    try {
      await confirmMockPayment(reference);
      showMessage(
        "success",
        "Payment confirmed. Certificate access is now active."
      );
      await loadPaymentStatus();
    } catch (error) {
      console.error("Demo payment confirmation error:", error);
      const errorMessage = error.message || "Could not confirm demo payment.";

      showMessage(
        "warning",
        errorMessage === MOCK_CONFIRM_DISABLED_MESSAGE
          ? "Payment confirmation is not available in this environment. Please use the configured production payment provider or contact support."
          : errorMessage
      );
    } finally {
      setConfirming(false);
    }
  };

  const goToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <Layout user="student">
      <style>{`
        .payment-callback-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(37, 99, 235, 0.12), transparent 34rem),
            var(--bc-page-bg);
          padding: 2rem 1rem 4rem;
        }

        .payment-callback-container {
          max-width: 940px;
          margin: 0 auto;
        }

        .payment-callback-card {
          background: var(--bc-surface);
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-xl);
          box-shadow: var(--bc-shadow-md);
          overflow: hidden;
        }

        .payment-callback-head {
          background:
            linear-gradient(135deg, rgba(15, 23, 42, 0.97), rgba(29, 78, 216, 0.9));
          color: #ffffff;
          padding: 1.35rem;
          display: flex;
          align-items: center;
          gap: 0.9rem;
        }

        .payment-callback-icon {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.12);
          flex-shrink: 0;
        }

        .payment-callback-body {
          padding: 1.25rem;
        }

        .payment-callback-result {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 1rem;
          align-items: center;
          padding: 1rem;
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-xl);
          background: var(--bc-surface-soft);
          margin-bottom: 1rem;
        }

        .payment-callback-result-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--bc-radius-md);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .payment-callback-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
          margin: 1rem 0;
        }

        .payment-callback-detail {
          background: var(--bc-surface-soft);
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-lg);
          padding: 0.85rem;
        }

        .payment-callback-label {
          color: var(--bc-muted);
          font-size: 0.78rem;
          font-weight: 750;
          margin-bottom: 0.2rem;
        }

        .payment-callback-value {
          color: var(--bc-text);
          font-weight: 850;
          margin-bottom: 0;
          word-break: break-word;
        }

        .payment-callback-status {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          border-radius: 999px;
          padding: 0.4rem 0.7rem;
          font-weight: 850;
          font-size: 0.82rem;
        }

        .payment-callback-success {
          background: #ecfdf5;
          color: #059669;
          border: 1px solid #bbf7d0;
        }

        .payment-callback-error {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .payment-callback-pending {
          background: var(--bc-warning-soft);
          color: var(--bc-warning-strong);
          border: 1px solid #fde68a;
        }

        .payment-callback-demo {
          border: 1px solid #fde68a;
          border-radius: var(--bc-radius-xl);
          background: var(--bc-warning-soft);
          padding: 1rem;
          margin-top: 1rem;
        }

        .payment-callback-next {
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-xl);
          background: var(--bc-surface);
          box-shadow: var(--bc-shadow-sm);
          padding: 1rem;
        }

        .payment-callback-next-list {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.75rem;
          margin-top: 0.85rem;
        }

        .payment-callback-next-step {
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-lg);
          background: var(--bc-surface-soft);
          padding: 0.8rem;
        }

        .payment-callback-next-step strong {
          color: var(--bc-text);
          display: block;
          margin-bottom: 0.25rem;
        }

        .payment-callback-actions {
          display: flex;
          gap: 0.65rem;
          flex-wrap: wrap;
          margin-top: 1rem;
        }

        .payment-callback-btn {
          min-height: 42px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          color: #334155;
          padding: 0.6rem 0.9rem;
          font-weight: 850;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .payment-callback-btn-primary {
          background: #0f172a;
          border-color: #0f172a;
          color: #ffffff;
        }

        .payment-callback-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        @media(max-width: 640px) {
          .payment-callback-result {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .payment-callback-result-icon {
            margin: 0 auto;
          }

          .payment-callback-grid {
            grid-template-columns: 1fr;
          }

          .payment-callback-next-list {
            grid-template-columns: 1fr;
          }

          .payment-callback-actions,
          .payment-callback-btn,
          .payment-callback-actions .bc-button {
            width: 100%;
          }
        }
      `}</style>

      <main className="payment-callback-page">
        <div className="payment-callback-container">
          <Card className="payment-callback-card">
            <div className="payment-callback-head">
              <div className="payment-callback-icon">
                <FaShieldAlt />
              </div>

              <div>
                <h1 className="h3 fw-bold mb-1">Payment Status</h1>
                <p className="mb-0 text-white-50">
                  Confirm your payment and activate certificate access.
                </p>
              </div>
            </div>

            <div className="payment-callback-body">
              {message.text && (
                <AlertMessage type={message.type} message={message.text} />
              )}

              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary mb-3" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="text-primary fw-bold mb-0">
                    Checking payment status...
                  </p>
                </div>
              ) : !reference ? (
                <>
                  <div className="payment-callback-result payment-callback-error">
                    <span className="payment-callback-result-icon">
                      <FaExclamationTriangle />
                    </span>

                    <div>
                      <StatusBadge status="Missing" type="failed" />
                      <h2 className="h4 fw-bold mt-3 mb-1">
                        Missing Payment Reference
                      </h2>
                      <p className="mb-0">
                        The payment reference is missing, so BlockCred cannot
                        check this payment status.
                      </p>
                    </div>
                  </div>

                  <EmptyState
                    title="Payment reference unavailable"
                    message="Return to your credential wallet and start the payment flow again."
                  />

                  <div className="payment-callback-actions">
                    <ActionButton onClick={goToDashboard} variant="primary">
                      Back to Dashboard
                      <FaArrowRight />
                    </ActionButton>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className={`payment-callback-result ${statusTheme.className}`}
                  >
                    <span className="payment-callback-result-icon">
                      {statusTheme.icon}
                    </span>

                    <div>
                      <StatusBadge
                        status={statusTheme.label}
                        type={statusTheme.badgeType}
                      />
                      <h2 className="h4 fw-bold mt-3 mb-1">
                        {statusTheme.title}
                      </h2>
                      <p className="mb-0">{statusTheme.text}</p>
                    </div>

                    <FaShieldAlt className="d-none d-md-block opacity-50" />
                  </div>

                  <div className="payment-callback-grid">
                    <div className="payment-callback-detail">
                      <p className="payment-callback-label">Payment reference</p>
                      <p className="payment-callback-value">
                        {reference}
                      </p>
                    </div>

                    <div className="payment-callback-detail">
                      <p className="payment-callback-label">Amount</p>
                      <p className="payment-callback-value">
                        {payment
                          ? formatAmount(payment.amount, payment.currency)
                          : "N/A"}
                      </p>
                    </div>

                    <div className="payment-callback-detail">
                      <p className="payment-callback-label">Payment status</p>
                      <p className="payment-callback-value text-capitalize">
                        {payment?.status || "Unknown"}
                      </p>
                    </div>

                    <div className="payment-callback-detail">
                      <p className="payment-callback-label">Access status</p>
                      <p className="payment-callback-value text-capitalize">
                        {subscriptionStatus || "Unknown"}
                      </p>
                    </div>
                  </div>

                  {canConfirmMock && (
                    <div className="payment-callback-demo">
                      <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
                        <div>
                          <StatusBadge status="Demo mode" type="warning" />
                          <h3 className="h5 fw-bold mt-3 mb-1">
                            Confirm demo payment
                          </h3>
                          <p className="mb-0">
                            Demo confirmation is for local testing and
                            demonstration only.
                          </p>
                        </div>

                        <ActionButton
                          onClick={handleConfirmMockPayment}
                          variant="primary"
                          disabled={confirming}
                        >
                          <FaCheckCircle />
                          {confirming
                            ? "Confirming..."
                            : "Confirm Demo Payment"}
                        </ActionButton>
                      </div>
                    </div>
                  )}

                  <Card className="payment-callback-next mt-3">
                    <h3 className="h5 fw-bold mb-1">
                      What happens after payment?
                    </h3>
                    <p className="text-muted small mb-0">
                      Access activation is automatic once the payment is
                      confirmed.
                    </p>

                    <div className="payment-callback-next-list">
                      <div className="payment-callback-next-step">
                        <strong>1. Payment confirmed</strong>
                        <span className="text-muted small">
                          BlockCred verifies the payment reference.
                        </span>
                      </div>

                      <div className="payment-callback-next-step">
                        <strong>2. Access becomes active</strong>
                        <span className="text-muted small">
                          Your student access status is updated.
                        </span>
                      </div>

                      <div className="payment-callback-next-step">
                        <strong>3. Credentials unlock</strong>
                        <span className="text-muted small">
                          Issued certificates appear in your wallet.
                        </span>
                      </div>
                    </div>
                  </Card>

                  <div className="payment-callback-actions">
                    <ActionButton
                      onClick={loadPaymentStatus}
                      variant="secondary"
                      disabled={loading || confirming}
                    >
                      <FaRedo />
                      Check Status Again
                    </ActionButton>

                    <ActionButton
                      onClick={goToDashboard}
                      variant="ghost"
                    >
                      Back to Dashboard
                      <FaArrowRight />
                    </ActionButton>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      </main>
    </Layout>
  );
};

export default PaymentCallback;
