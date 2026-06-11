import { FaFileAlt } from "react-icons/fa";

const EmptyState = ({ title, message, action }) => {
  return (
    <div className="bc-empty-state text-center py-5 px-3">
      <div className="bc-empty-icon d-inline-flex align-items-center justify-content-center mb-3">
        <FaFileAlt size={24} />
      </div>

      <h3 className="h5 fw-bold mb-2">{title}</h3>
      {message && (
        <p className="bc-page-muted mb-3 mx-auto" style={{ maxWidth: 560 }}>
          {message}
        </p>
      )}
      {action}
    </div>
  );
};

export default EmptyState;
