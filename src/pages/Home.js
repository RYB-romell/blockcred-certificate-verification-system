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
import { siteConfig } from "../config/site.js";

const Home = () => {
  const navigate = useNavigate();
  const [certificateId, setCertificateId] = useState("");
  const demoCertId = (
    process.env.REACT_APP_DEMO_CERT_ID || siteConfig.demoCertificateId
  )?.trim();
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
    {
      title: "Enter certificate ID",
      text: "Use the ID printed on the certificate or shared verification link.",
    },
    {
      title: "BlockCred checks proof",
      text: "The database record and blockchain hash proof are compared.",
    },
    {
      title: "View the result",
      text: "The public verification status is displayed immediately.",
    },
  ];

  const trustItems = [
    siteConfig.institutionName,
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
          position: relative;
          overflow: hidden;
          padding: 4.75rem 0 3.5rem;
          color: #ffffff;
          background:
            linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 64, 175, 0.94) 100%),
            #0f172a;
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

        .home-authority {
          margin-top: 0.9rem;
          color: #e0f2fe;
          font-size: 0.92rem;
          font-weight: 800;
        }

        .home-verify-card {
          padding: 1.25rem;
          background: rgba(255, 255, 255, 0.97);
          border-color: rgba(255, 255, 255, 0.22);
          box-shadow: var(--bc-shadow-lg);
        }

        .home-verify-title {
          margin: 0 0 0.35rem;
          color: var(--bc-text);
          font-size: 1rem;
          font-weight: 850;
        }

        .home-verify-subtitle {
          margin: 0 0 1rem;
          color: var(--bc-muted);
          font-size: 0.9rem;
          line-height: 1.55;
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

        .home-demo-row {
          margin-top: 0.85rem;
        }

        .home-demo-link {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          border: 0;
          background: transparent;
          color: var(--bc-primary);
          font-weight: 850;
          padding: 0;
          text-decoration: none;
        }

        .home-demo-link:hover {
          color: var(--bc-primary-strong);
          text-decoration: underline;
        }

        .home-note {
          margin-top: 0.9rem;
          color: var(--bc-muted);
          font-size: 0.9rem;
          line-height: 1.55;
        }

        .home-verify-meta {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.6rem;
          margin-top: 1rem;
        }

        .home-verify-meta span {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          min-width: 0;
          padding: 0.7rem;
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-sm);
          background: var(--bc-surface-soft);
          color: var(--bc-text);
          font-size: 0.82rem;
          font-weight: 800;
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

          .home-verify-meta {
            grid-template-columns: 1fr;
          }

          .home-verify-form .bc-button {
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
                  Check certificate authenticity using a certificate ID,
                  database record, and blockchain hash proof. No wallet or login
                  required.
                </p>

                <p className="home-authority">
                  Built for University of Buea certificate verification.
                </p>
              </div>

              <Card className="home-verify-card">
                <h2 className="home-verify-title">Verify a certificate</h2>
                <p className="home-verify-subtitle">
                  Enter the certificate ID and get a public verification result.
                </p>
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

                <div className="home-demo-row">
                  <button
                    type="button"
                    className="home-demo-link"
                    onClick={goTo(demoVerifierPath)}
                  >
                    Try demo: {demoCertId || "Open verifier"}
                    <FaArrowRight />
                  </button>
                </div>

                <p className="home-note">
                  Currently running on Ethereum Sepolia for demonstration and
                  testing.
                </p>

                <div className="home-verify-meta">
                  <span>
                    <FaCheckCircle />
                    No wallet required
                  </span>
                  <span>
                    <FaCheckCircle />
                    Public read-only check
                  </span>
                </div>
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
                <Card className="home-card" key={step.title}>
                  <div className="home-step">
                    <span className="home-step-number">{index + 1}</span>
                    <div>
                      <strong>{step.title}</strong>
                      <p className="home-muted small mb-0 mt-1">{step.text}</p>
                    </div>
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
                    Sign In
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
