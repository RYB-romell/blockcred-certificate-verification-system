import {
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaTimesCircle,
} from "react-icons/fa";

const STATUS_STYLES = {
  active: {
    background: "var(--bc-success-soft)",
    color: "var(--bc-success-strong)",
    border: "#a7f3d0",
    icon: <FaCheckCircle />,
  },
  valid: {
    background: "var(--bc-success-soft)",
    color: "var(--bc-success-strong)",
    border: "#a7f3d0",
    icon: <FaCheckCircle />,
  },
  linked: {
    background: "var(--bc-soft-blue)",
    color: "var(--bc-cobalt)",
    border: "#bfdbfe",
    icon: <FaCheckCircle />,
  },
  successful: {
    background: "var(--bc-success-soft)",
    color: "var(--bc-success-strong)",
    border: "#a7f3d0",
    icon: <FaCheckCircle />,
  },
  pending: {
    background: "var(--bc-warning-soft)",
    color: "var(--bc-warning-strong)",
    border: "#fde68a",
    icon: <FaClock />,
  },
  warning: {
    background: "var(--bc-warning-soft)",
    color: "var(--bc-warning-strong)",
    border: "#fde68a",
    icon: <FaExclamationTriangle />,
  },
  inactive: {
    background: "var(--bc-surface-soft)",
    color: "var(--bc-muted)",
    border: "var(--bc-border)",
    icon: <FaClock />,
  },
  unlinked: {
    background: "var(--bc-surface-soft)",
    color: "var(--bc-muted)",
    border: "var(--bc-border)",
    icon: <FaClock />,
  },
  revoked: {
    background: "var(--bc-danger-soft)",
    color: "var(--bc-danger-strong)",
    border: "#fecaca",
    icon: <FaTimesCircle />,
  },
  failed: {
    background: "var(--bc-danger-soft)",
    color: "var(--bc-danger-strong)",
    border: "#fecaca",
    icon: <FaTimesCircle />,
  },
  cancelled: {
    background: "var(--bc-danger-soft)",
    color: "var(--bc-danger-strong)",
    border: "#fecaca",
    icon: <FaTimesCircle />,
  },
  error: {
    background: "var(--bc-danger-soft)",
    color: "var(--bc-danger-strong)",
    border: "#fecaca",
    icon: <FaTimesCircle />,
  },
};

const formatLabel = (value) => {
  const text = String(value || "inactive").trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "Inactive";
};

const StatusBadge = ({ status, type }) => {
  const key = String(type || status || "inactive").toLowerCase();
  const style = STATUS_STYLES[key] || STATUS_STYLES.inactive;

  return (
    <span
      className="bc-badge"
      style={{
        background: style.background,
        color: style.color,
        border: `1px solid ${style.border}`,
      }}
    >
      {style.icon}
      {formatLabel(status || type)}
    </span>
  );
};

export default StatusBadge;
