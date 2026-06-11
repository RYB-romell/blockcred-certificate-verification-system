import { FaCreditCard, FaLock, FaRegClock } from "react-icons/fa";

const formatAmount = (amount, currency) => {
  const numericAmount = Number(amount || 0);
  const finalCurrency = currency || "XAF";

  if (!numericAmount) return finalCurrency;

  return `${numericAmount.toLocaleString()} ${finalCurrency}`;
};

const PaymentRequiredCard = ({
  subscriptionStatus = "inactive",
  amount = 5000,
  currency = "XAF",
  message = "Payment is required to access your certificates.",
  onPayNow,
  loading = false,
}) => {
  const finalStatus = String(subscriptionStatus || "inactive").toLowerCase();

  return (
    <>
      <style>{`
        .payment-required-card {
          background: var(--bc-surface);
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-xl);
          box-shadow: var(--bc-shadow-md);
          overflow: hidden;
        }

        .payment-required-accent {
          background: linear-gradient(135deg, var(--bc-primary), #172554 62%, var(--bc-accent));
          color: #ffffff;
          padding: 1.15rem;
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }

        .payment-required-icon {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.12);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .payment-required-body {
          padding: 1.25rem;
        }

        .payment-required-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
          margin: 1rem 0;
        }

        .payment-required-detail {
          background: var(--bc-surface-soft);
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-md);
          padding: 0.85rem;
        }

        .payment-required-label {
          color: var(--bc-muted);
          font-size: 0.78rem;
          font-weight: 750;
          margin-bottom: 0.2rem;
        }

        .payment-required-value {
          color: var(--bc-text);
          font-weight: 850;
          margin-bottom: 0;
          text-transform: capitalize;
        }

        .payment-required-note {
          color: var(--bc-muted);
          display: flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.9rem;
          margin-bottom: 0;
        }

        .payment-required-button {
          min-height: 42px;
          border: 1px solid var(--bc-primary);
          border-radius: var(--bc-radius-md);
          background: var(--bc-primary);
          color: #ffffff;
          padding: 0.6rem 1rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-weight: 850;
          transition: 0.15s ease;
        }

        .payment-required-button:hover:not(:disabled) {
          background: var(--bc-primary-hover);
          border-color: var(--bc-primary-hover);
        }

        .payment-required-button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        @media(max-width: 640px) {
          .payment-required-grid {
            grid-template-columns: 1fr;
          }

          .payment-required-button {
            width: 100%;
          }
        }
      `}</style>

      <section className="payment-required-card">
        <div className="payment-required-accent">
          <div className="payment-required-icon">
            <FaLock />
          </div>

          <div>
            <h2 className="h4 fw-bold mb-1">Payment Required</h2>
            <p className="mb-0 text-white-50">
              Activate access to view your certificate records.
            </p>
          </div>
        </div>

        <div className="payment-required-body">
          <p className="mb-0 text-muted">{message}</p>

          <div className="payment-required-grid">
            <div className="payment-required-detail">
              <p className="payment-required-label">Current access status</p>
              <p className="payment-required-value">{finalStatus}</p>
            </div>

            <div className="payment-required-detail">
              <p className="payment-required-label">Amount</p>
              <p className="payment-required-value">
                {formatAmount(amount, currency)}
              </p>
            </div>
          </div>

          <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
            <p className="payment-required-note">
              <FaRegClock />
              Use Pay Now to continue to checkout when payment is available.
            </p>

            <button
              type="button"
              className="payment-required-button"
              onClick={onPayNow}
              disabled={loading}
              aria-label="Pay now to unlock certificate access"
            >
              <FaCreditCard />
              {loading ? "Please wait..." : "Pay Now"}
            </button>
          </div>
        </div>
      </section>
    </>
  );
};

export default PaymentRequiredCard;
