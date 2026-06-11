const Card = ({ children, className = "", style = {} }) => {
  return (
    <section
      className={`bc-card ${className}`.trim()}
      style={style}
    >
      {children}
    </section>
  );
};

export default Card;
