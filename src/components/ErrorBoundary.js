import React from "react";
import { FaHome, FaRedo } from "react-icons/fa";
import BrandLogo from "./BrandLogo.js";
import ActionButton from "./ui/ActionButton.js";
import Card from "./ui/Card.js";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError() {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error, info) {
    console.error("BlockCred runtime error:", error, info);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <>
        <style>{`
          .bc-error-boundary {
            min-height: 100vh;
            display: grid;
            place-items: center;
            padding: 2rem 1rem;
            background:
              radial-gradient(circle at top left, rgba(37, 99, 235, 0.1), transparent 30rem),
              var(--bc-page-bg);
          }

          .bc-error-boundary-card {
            width: min(100%, 580px);
            padding: 1.5rem;
            text-align: center;
          }

          .bc-error-actions {
            display: flex;
            justify-content: center;
            gap: 0.75rem;
            flex-wrap: wrap;
            margin-top: 1.25rem;
          }

          @media (max-width: 560px) {
            .bc-error-actions .bc-button {
              width: 100%;
            }
          }
        `}</style>
        <main className="bc-error-boundary">
          <Card className="bc-error-boundary-card">
            <div className="d-flex justify-content-center mb-3">
              <BrandLogo size="md" />
            </div>
            <h1 className="h3 fw-bold mb-2">Something went wrong</h1>
            <p className="bc-page-muted mb-0">
              BlockCred could not load this page. Please refresh or return home.
            </p>
            <div className="bc-error-actions">
              <ActionButton
                variant="primary"
                onClick={() => window.location.reload()}
              >
                <FaRedo />
                Refresh Page
              </ActionButton>
              <ActionButton
                variant="secondary"
                onClick={() => {
                  window.location.href = "/";
                }}
              >
                <FaHome />
                Go Home
              </ActionButton>
            </div>
          </Card>
        </main>
      </>
    );
  }
}

export default ErrorBoundary;
