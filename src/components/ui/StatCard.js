const StatCard = ({ label, value, helper, icon }) => {
  return (
    <div className="bc-stat-card h-100">
      <div className="d-flex align-items-center justify-content-between gap-3">
        <div>
          <p className="bc-stat-label mb-1">
            {label}
          </p>
          <h2 className="bc-stat-value mb-0">
            {value}
          </h2>
          {helper && (
            <p className="bc-page-muted small mb-0 mt-1">
              {helper}
            </p>
          )}
        </div>

        {icon && (
          <div className="bc-stat-icon">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
