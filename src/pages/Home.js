// src/pages/Home.js

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaBuilding,
  FaCheckCircle,
  FaSearch,
  FaUserGraduate,
} from "react-icons/fa";
import Layout from "../components/Layout.js";
import BrandLogo from "../components/BrandLogo.js";
import ActionButton from "../components/ui/ActionButton.js";
import Card from "../components/ui/Card.js";
import StatusBadge from "../components/ui/StatusBadge.js";

const Home = () => {
  const navigate = useNavigate();
  const [certificateId, setCertificateId] = useState("");
  const demoCertId = process.env.REACT_APP_DEMO_CERT_ID?.trim();
  const demoVerifierPath = demoCertId
    ? `/public-verifier?certId=${encodeURIComponent(demoCertId)}`
    : "/public-verifier";

  const goTo = (path) => () => navigate(path);

  const verifyFromHero = (event) => {
    event.preventDefault();

    const finalCertId = certificateId.trim() || demoCertId;

    if (finalCertId) {
      navigate(`/public-verifier?certId=${encodeURIComponent(finalCertId)}`);
      return;
    }

    navigate("/public-verifier");
  };

  const audiences = [
    {
      icon: <FaSearch />,
      title: "For Employers",
      text: "Verify certificates instantly using a certificate ID or QR link.",
    },
    {
      icon: <FaUserGraduate />,
      title: "For Students",
      text: "Access, download, and share issued academic credentials.",
    },
    {
      icon: <FaBuilding />,
      title: "For Institutions",
      text: "Issue, revoke, audit, and manage tamper-evident certificates.",
    },
  ];

  const steps = [
    "Enter certificate ID",
    "BlockCred checks records and blockchain proof",
    "Verification result is displayed",
  ];

  const trustItems = [
    "Deployed live",
    "Sepolia test network",
    "Public verification enabled",
    demoCertId ? `Demo certificate: ${demoCertId}` : "Demo verification ready",
  ];

  return (
    <Layout user={null}>
      <style>{`
        .home-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(37, 99, 235, 0.1), transparent 32rem),
            var(--bc-page-bg);
        }

        .home-container {
          width: 100%;
          max-width: 1120px;
          margin: 0 auto;
          padding: 0 1.25rem;
        }

        .home-hero {
          padding: 4.5rem 0 3.25rem;
          color: #ffffff;
          background: linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.14);
        }

        .home-hero-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(320px, 420px);
          gap: 2rem;
          align-items: center;
        }

        .home-eyebrow {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-bottom: 1.25rem;
        }

        .home-title {
          max-width: 720px;
          margin: 0 0 1rem;
          color: #ffffff;
          font-size: clamp(2.35rem, 5vw, 4.35rem);
          line-height: 1;
          letter-spacing: 0;
          font-weight: 900;
        }

        .home-subtitle {
          max-width: 660px;
          margin: 0;
          color: #cbd5e1;
          font-size: 1.08rem;
          line-height: 1.7;
        }

        .home-verify-card {
          padding: 1.1rem;
          background: rgba(255, 255, 255, 0.97);
          border-color: rgba(255, 255, 255, 0.22);
          box-shadow: var(--bc-shadow-lg);
        }

        .home-verify-title {
          margin: 0 0 0.75rem;
          color: var(--bc-text);
          font-size: 1rem;
          font-weight: 850;
        }

        .home-verify-form {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 0.75rem;
          min-width: 0;
        }

        .home-verify-input {
          width: 100%;
          min-width: 0;
          height: 46px;
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-md);
          padding: 0 0.9rem;
          color: var(--bc-text);
          background: var(--bc-surface);
          font-weight: 700;
        }

        .home-verify-input:focus {
          outline: 0;
          border-color: var(--bc-primary);
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        }

        .home-link-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .home-note {
          margin-top: 1rem;
          color: var(--bc-muted);
          font-size: 0.9rem;
          line-height: 1.55;
        }

        .home-section {
          padding: 3rem 0;
        }

        .home-section-muted {
          background: var(--bc-surface);
          border-top: 1px solid var(--bc-border);
          border-bottom: 1px solid var(--bc-border);
        }

        .home-section-head {
          max-width: 680px;
          margin-bottom: 1.4rem;
        }

        .home-section-title {
          margin: 0 0 0.5rem;
          color: var(--bc-text);
          font-size: clamp(1.55rem, 3vw, 2.1rem);
          font-weight: 850;
          letter-spacing: 0;
        }

        .home-muted {
          color: var(--bc-muted);
        }

        .home-card {
          height: 100%;
          padding: 1.2rem;
        }

        .home-icon {
          width: 40px;
          height: 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          color: var(--bc-primary);
          background: var(--bc-accent-soft);
          margin-bottom: 1rem;
        }

        .home-steps {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1rem;
        }

        .home-step {
          display: flex;
          gap: 0.85rem;
          align-items: flex-start;
        }

        .home-step-number {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #ffffff;
          background: var(--bc-gradient);
          font-weight: 900;
        }

        .home-trust-strip {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.75rem;
        }

        .home-trust-item {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          min-width: 0;
          padding: 0.85rem;
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-md);
          background: var(--bc-surface-soft);
          color: var(--bc-text);
          font-weight: 800;
          overflow-wrap: anywhere;
        }

        .home-cta {
          padding: 1.4rem;
          border-radius: var(--bc-radius-section);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: #ffffff;
          background: linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%);
          box-shadow: var(--bc-shadow-lg);
        }

        .home-cta p {
          color: #cbd5e1;
        }

        @media (max-width: 860px) {
          .home-hero {
            padding: 3.25rem 0 2.75rem;
          }

          .home-hero-grid,
          .home-steps,
          .home-trust-strip {
            grid-template-columns: 1fr;
          }

          .home-verify-form {
            grid-template-columns: 1fr;
          }

          .home-verify-form .bc-button,
          .home-link-row .bc-button {
            width: 100%;
          }
        }
      `}</style>

      <main className="home-page">
        <section className="home-hero">
          <div className="home-container">
            <div className="home-hero-grid">
              <div>
                <div className="home-eyebrow">
                  <BrandLogo size="md" variant="light" />
                  <StatusBadge status="Public verification" type="valid" />
                </div>

                <h1 className="home-title">
                  Verify Academic Credentials Instantly
                </h1>

                <p className="home-subtitle">
                  Tamper-evident certificates backed by database records and
                  blockchain hash checks. No wallet or login needed for public
                  verification.
                </p>
              </div>

              <Card className="home-verify-card">
                <h2 className="home-verify-title">Verify a certificate</h2>
                <form className="home-verify-form" onSubmit={verifyFromHero}>
                  <input
                    className="home-verify-input"
                    type="text"
                    value={certificateId}
                    onChange={(event) => setCertificateId(event.target.value)}
                    placeholder="Enter certificate ID, e.g. SID_CT23A100"
                    aria-label="Certificate ID"
                  />
                  <ActionButton type="submit" variant="primary">
                    <FaSearch />
                    Verify Certificate
                  </ActionButton>
                </form>

                <div className="home-link-row">
                  <ActionButton
                    variant="secondary"
                    onClick={goTo(demoVerifierPath)}
                  >
                    Try Demo Verification
                    <FaArrowRight />
                  </ActionButton>
                  <ActionButton variant="ghost" onClick={goTo("/login")}>
                    Sign In
                  </ActionButton>
                  <ActionButton
                    variant="ghost"
                    onClick={goTo("/register-student")}
                  >
                    Create Student Account
                  </ActionButton>
                </div>

                <p className="home-note">
                  Currently running on Ethereum Sepolia for demonstration and
                  testing.
                </p>
              </Card>
            </div>
          </div>
        </section>

        <section className="home-section">
          <div className="home-container">
            <div className="row g-3">
              {audiences.map((audience) => (
                <div className="col-md-4" key={audience.title}>
                  <Card className="home-card">
                    <div className="home-icon">{audience.icon}</div>
                    <h2 className="h5 fw-bold mb-2">{audience.title}</h2>
                    <p className="home-muted mb-0">{audience.text}</p>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="home-section home-section-muted">
          <div className="home-container">
            <div className="home-section-head">
              <h2 className="home-section-title">How it works</h2>
              <p className="home-muted mb-0">
                A simple public check for academic certificate authenticity.
              </p>
            </div>

            <div className="home-steps">
              {steps.map((step, index) => (
                <Card className="home-card" key={step}>
                  <div className="home-step">
                    <span className="home-step-number">{index + 1}</span>
                    <strong>{step}</strong>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="home-section">
          <div className="home-container">
            <div className="home-trust-strip">
              {trustItems.map((item) => (
                <div className="home-trust-item" key={item}>
                  <FaCheckCircle className="text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="home-section pt-0">
          <div className="home-container">
            <div className="home-cta">
              <div className="row align-items-center g-3">
                <div className="col-lg-8">
                  <h2 className="h3 fw-bold mb-2">
                    Ready to verify a certificate?
                  </h2>
                  <p className="mb-0">
                    Search by certificate ID and view the public verification
                    result in seconds.
                  </p>
                </div>
                <div className="col-lg-4 text-lg-end">
                  <ActionButton
                    variant="secondary"
                    onClick={goTo("/public-verifier")}
                  >
                    Verify a Certificate
                    <FaArrowRight />
                  </ActionButton>
                  <ActionButton
                    variant="ghost"
                    className="ms-lg-2 mt-2 mt-lg-0"
                    onClick={goTo("/login")}
                  >
                    Login
                  </ActionButton>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default Home;
