import ActionButton from "./ActionButton.js";

const PaginationControls = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}) => {
  if (!totalItems) {
    return null;
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const startItem = (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalItems);

  return (
    <div
      className="bc-pagination-controls"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        flexWrap: "wrap",
        padding: "1rem 0 0",
      }}
    >
      <div className="bc-page-muted small">
        Showing <strong>{startItem}</strong>-<strong>{endItem}</strong> of{" "}
        <strong>{totalItems}</strong> records
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          flexWrap: "wrap",
        }}
      >
        <label
          className="bc-page-muted small"
          style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}
        >
          Rows
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            aria-label="Rows per page"
            style={{
              border: "1px solid var(--bc-border)",
              borderRadius: "10px",
              padding: "0.45rem 0.65rem",
              background: "var(--bc-surface)",
              color: "var(--bc-text)",
              fontWeight: 700,
            }}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div className="bc-page-muted small" aria-live="polite">
          Page <strong>{safePage}</strong> / <strong>{totalPages}</strong>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <ActionButton
            variant="secondary"
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage <= 1}
          >
            Previous
          </ActionButton>
          <ActionButton
            variant="secondary"
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage >= totalPages}
          >
            Next
          </ActionButton>
        </div>
      </div>
    </div>
  );
};

export default PaginationControls;
