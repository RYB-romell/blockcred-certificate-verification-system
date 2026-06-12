import { useEffect } from "react";
import ActionButton from "./ActionButton.js";

const ConfirmModal = ({
  open,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
  loading = false,
  onConfirm,
  onCancel,
  children,
}) => {
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !loading) {
        onCancel?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loading, onCancel, open]);

  if (!open) {
    return null;
  }

  const isDanger = variant === "danger";

  return (
    <div
      className="bc-confirm-overlay"
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 120,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(0.75rem, 2vw, 1.25rem)",
        background: "rgba(15, 23, 42, 0.58)",
        backdropFilter: "blur(10px)",
        overflowY: "auto",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bc-confirm-modal-title"
        className="bc-confirm-modal"
        style={{
          width: "min(100%, 640px)",
          maxHeight: "min(90vh, calc(100dvh - 2rem))",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          borderRadius: "24px",
          border: "1px solid var(--bc-border)",
          background: "var(--bc-surface)",
          boxShadow: "0 28px 80px rgba(15, 23, 42, 0.26)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "1.25rem 1.35rem",
            borderBottom: "1px solid var(--bc-border)",
            flexShrink: 0,
            background: isDanger
              ? "linear-gradient(135deg, rgba(220, 38, 38, 0.12), rgba(255, 255, 255, 0.96))"
              : "linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(255, 255, 255, 0.96))",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.75rem",
              color: isDanger ? "var(--bc-danger)" : "var(--bc-primary)",
              fontWeight: 800,
              fontSize: "0.78rem",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            {isDanger ? "Dangerous action" : "Confirmation"}
          </div>

          <h2
            id="bc-confirm-modal-title"
            style={{
              margin: 0,
              color: "var(--bc-text)",
              fontSize: "1.25rem",
              fontWeight: 900,
            }}
          >
            {title}
          </h2>

          {message && (
            <p
              className="bc-page-muted"
              style={{ margin: "0.55rem 0 0", lineHeight: 1.65 }}
            >
              {message}
            </p>
          )}
        </div>

        <div
          className="bc-confirm-modal-body"
          style={{
            flex: "1 1 auto",
            minHeight: 0,
            overflowY: "auto",
            overscrollBehavior: "contain",
            WebkitOverflowScrolling: "touch",
            padding: "1.25rem 1.35rem",
          }}
        >
          {children}
        </div>

        <div
          className="bc-confirm-modal-footer"
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75rem",
            flexWrap: "wrap",
            padding: "1rem 1.35rem 1.25rem",
            borderTop: "1px solid var(--bc-border)",
            background: "var(--bc-surface)",
            boxShadow: "0 -12px 28px rgba(15, 23, 42, 0.06)",
            flexShrink: 0,
            position: "sticky",
            bottom: 0,
            zIndex: 1,
          }}
        >
          <ActionButton
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </ActionButton>
          <ActionButton
            variant={isDanger ? "danger" : "primary"}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </ActionButton>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
