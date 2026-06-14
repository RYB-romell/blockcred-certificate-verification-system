const SIZE_STYLES = {
  sm: {
    mark: 30,
    radius: 10,
    name: "0.95rem",
    subtitle: "0.68rem",
    gap: "0.55rem",
  },
  md: {
    mark: 38,
    radius: 12,
    name: "1.08rem",
    subtitle: "0.74rem",
    gap: "0.65rem",
  },
  lg: {
    mark: 48,
    radius: 15,
    name: "1.35rem",
    subtitle: "0.82rem",
    gap: "0.75rem",
  },
};

const BrandLogo = ({
  size = "md",
  showText = true,
  subtitle = "Credential verification",
  variant = "dark",
}) => {
  const sizing = SIZE_STYLES[size] || SIZE_STYLES.md;
  const isLight = variant === "light";

  return (
    <span
      className={`bc-brand-logo ${isLight ? "bc-brand-logo-light" : ""}`}
      style={{
        gap: sizing.gap,
      }}
    >
      <span
        className="bc-brand-mark"
        aria-hidden="true"
        style={{
          width: sizing.mark,
          height: sizing.mark,
          borderRadius: sizing.radius,
        }}
      >
        <svg
          viewBox="0 0 48 48"
          width="72%"
          height="72%"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M11 10h22c7 0 10 4 10 11v6c0 7-3 11-10 11H11V10z"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path
            d="M17 19h15M17 26h10"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="35" cy="32" r="7" fill="#19a8e4" />
          <path
            d="M31.5 32.5l2.4 2.5 4.8-6"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      {showText && (
        <span style={{ minWidth: 0 }}>
          <span
            className="bc-brand-name"
            style={{
              fontSize: sizing.name,
            }}
          >
            BlockCred
          </span>
          {subtitle && (
            <span
              className="bc-brand-subtitle"
              style={{
                fontSize: sizing.subtitle,
              }}
            >
              {subtitle}
            </span>
          )}
        </span>
      )}
    </span>
  );
};

export default BrandLogo;
