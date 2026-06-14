import { useNavigate } from "react-router-dom";
import { FaHome, FaSearch } from "react-icons/fa";
import Layout from "../components/Layout.js";
import BrandLogo from "../components/BrandLogo.js";
import ActionButton from "../components/ui/ActionButton.js";
import Card from "../components/ui/Card.js";
import StatusBadge from "../components/ui/StatusBadge.js";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Layout user={null}>
      <style>{`
        .not-found-page {
          min-height: calc(100vh - 64px);
          display: grid;
          place-items: center;
          padding: 3rem 1.25rem;
          background:
            radial-gradient(circle at top left, rgba(37, 99, 235, 0.1), transparent 30rem),
            var(--bc-page-bg);
        }

        .not-found-card {
          width: min(100%, 620px);
          padding: 1.5rem;
          text-align: center;
        }

        .not-found-actions {
          display: flex;
          justify-content: center;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-top: 1.25rem;
        }

        @media (max-width: 560px) {
          .not-found-actions .bc-button {
            width: 100%;
          }
        }
      `}</style>

      <main className="not-found-page">
        <Card className="not-found-card">
          <div className="d-flex justify-content-center mb-3">
            <BrandLogo size="md" />
          </div>
          <StatusBadge status="404" type="pending" />
          <h1 className="mt-3 mb-2">Page not found</h1>
          <p className="bc-page-muted mb-0">
            The page you are looking for does not exist.
          </p>
          <div className="not-found-actions">
            <ActionButton variant="primary" onClick={() => navigate("/")}>
              <FaHome />
              Go Home
            </ActionButton>
            <ActionButton
              variant="secondary"
              onClick={() => navigate("/public-verifier")}
            >
              <FaSearch />
              Verify a Certificate
            </ActionButton>
          </div>
        </Card>
      </main>
    </Layout>
  );
};

export default NotFound;
