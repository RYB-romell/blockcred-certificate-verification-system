const PageHeader = ({ title, subtitle, actions }) => {
  return (
    <header className="bc-page-header d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
      <div>
        <h1 className="bc-page-header-title mb-1">
          {title}
        </h1>
        {subtitle && (
          <p className="bc-page-header-subtitle mb-0">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="d-flex flex-wrap gap-2 justify-content-lg-end">
          {actions}
        </div>
      )}
    </header>
  );
};

export default PageHeader;
