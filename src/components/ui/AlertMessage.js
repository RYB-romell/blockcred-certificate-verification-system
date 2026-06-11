const ALERT_STYLE = {
  success: {
    background: "var(--bc-success-soft)",
    color: "#065f46",
    border: "#a7f3d0",
  },
  error: {
    background: "var(--bc-danger-soft)",
    color: "#991b1b",
    border: "#fecaca",
  },
  warning: {
    background: "var(--bc-warning-soft)",
    color: "#92400e",
    border: "#fde68a",
  },
  info: {
    background: "var(--bc-accent-soft)",
    color: "#1e40af",
    border: "#bfdbfe",
  },
};

const AlertMessage = ({ type = "info", message, onClose }) => {
  if (!message) return null;

  const style = ALERT_STYLE[type] || ALERT_STYLE.info;

  return (
    <div
      className="bc-alert-message alert d-flex align-items-start justify-content-between gap-3"
      style={{
        background: style.background,
        color: style.color,
        border: `1px solid ${style.border}`,
      }}
    >
      <span>{message}</span>
      {onClose && (
        <button
          type="button"
          className="btn-close"
          aria-label="Close alert"
          onClick={onClose}
        />
      )}
    </div>
  );
};

export default AlertMessage;
