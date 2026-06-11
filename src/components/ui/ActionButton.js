const VARIANT_CLASSES = {
  primary: "bc-button-primary",
  secondary: "bc-button-secondary",
  danger: "bc-button-danger",
  ghost: "bc-button-ghost",
  success: "bc-button-success",
};

const ActionButton = ({
  children,
  onClick,
  type = "button",
  variant = "ghost",
  disabled = false,
  loading = false,
  className = "",
  ...buttonProps
}) => {
  const variantClass = VARIANT_CLASSES[variant] || VARIANT_CLASSES.ghost;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`bc-button ${variantClass} ${className}`.trim()}
      {...buttonProps}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
};

export default ActionButton;
