// src/pages/Home.js

import { useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaBuilding,
  FaCheckCircle,
  FaEthereum,
  FaLock,
  FaMoneyCheckAlt,
  FaQrcode,
  FaShieldAlt,
  FaUserGraduate,
} from "react-icons/fa";
import Layout from "../components/Layout.js";
import BrandLogo from "../components/BrandLogo.js";
import ActionButton from "../components/ui/ActionButton.js";
import Card from "../components/ui/Card.js";
import StatusBadge from "../components/ui/StatusBadge.js";

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <FaEthereum />,
      title: "Tamper-resistant proof",
      text: "Certificate PDF hashes are stored on the Sepolia blockchain.",
    },
    {
      icon: <FaQrcode />,
      title: "Instant public verification",
      text: "Employers can verify certificate status using certificate IDs or QR links.",
    },
    {
      icon: <FaUserGraduate />,
      title: "Secure student access",
      text: "Students access issued credentials through a protected credential wallet.",
    },
    {
      icon: <FaMoneyCheckAlt />,
      title: "Payment-controlled access",
      text: "Institutions can control certificate access using inactive, pending, and active statuses.",
    },
  ];

  const productAreas = [
    {
      icon: <FaBuilding />,
      title: "Admin Command Center",
      text: "Issue credentials, monitor records, manage students, and revoke certificates.",
    },
    {
      icon: <FaUserGraduate />,
      title: "Student Credential Wallet",
      text: "Students view, download, copy, and share their issued certificates.",
    },
    {
      icon: <FaQrcode />,
      title: "Public Trust Verifier",
      text: "Employers and reviewers confirm certificate authenticity instantly.",
    },
    {
      icon: <FaLock />,
      title: "Payment Access Layer",
      text: "Certificate visibility is controlled by inactive, pending, and active access states.",
    },
  ];

  const workflow = [
    "Admin issues certificate",
    "PDF hash is stored on blockchain",
    "Student accesses credential wallet",
    "Public verifier confirms authenticity",
  ];

  const trustItems = [
    "SHA-256 PDF hashing",
    "Firebase Authentication",
    "Supabase database and storage",
    "MetaMask/Sepolia smart contract transactions",
    "Revocation support",
  ];

  const goTo = (path) => () => navigate(path);

  return (
    <Layout user={null}>
      <style>{`
        .home-page {
          background:
            radial-gradient(circle at top left, rgba(37, 99, 235, 0.12), transparent 34rem),
            var(--bc-page-bg);
          min-height: 100vh;
        }

        .home-container {
          max-width: 1180px;
          margin: 0 auto;
          padding-left: 1.25rem;
          padding-right: 1.25rem;
        }

        .home-hero {
          background:
            linear-gradient(135deg, rgba(15, 23, 42, 0.97), rgba(29, 78, 216, 0.9));
          color: #ffffff;
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
          padding: 4.5rem 0 3.5rem;
        }

        .home-eyebrow {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          flex-wrap: wrap;
          margin-bottom: 1.1rem;
        }

        .home-title {
          color: #ffffff;
          font-size: clamp(2.5rem, 5vw, 4.5rem);
          font-weight: 850;
          letter-spacing: 0;
          line-height: 1;
          margin-bottom: 0.75rem;
        }

        .home-subtitle {
          color: #dbeafe;
          font-size: clamp(1.05rem, 2vw, 1.25rem);
          font-weight: 650;
          margin-bottom: 0;
        }

        .home-text {
          color: var(--bc-muted);
          font-size: 1rem;
          line-height: 1.7;
          max-width: 680px;
        }

        .home-hero .home-text {
          color: #cbd5e1;
        }

        .home-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-top: 1.5rem;
        }

        .home-action {
          min-height: 44px !important;
        }

        .home-preview {
          padding: 1.25rem;
          height: 100%;
          background: rgba(255, 255, 255, 0.96);
          border-color: rgba(255, 255, 255, 0.18);
          box-shadow: var(--bc-shadow-lg);
        }

        .home-preview-row {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--bc-border);
          font-size: 0.92rem;
        }

        .home-preview-row:last-child {
          border-bottom: 0;
        }

        .home-muted {
          color: var(--bc-muted);
        }

        .home-section {
          padding: 3.5rem 0;
        }

        .home-panel {
          background: var(--bc-surface);
          border-top: 1px solid var(--bc-border);
          border-bottom: 1px solid var(--bc-border);
        }

        .home-section-header {
          max-width: 720px;
          margin-bottom: 1.5rem;
        }

        .home-section-title {
          color: var(--bc-text);
          font-size: clamp(1.7rem, 3vw, 2.35rem);
          font-weight: 850;
          letter-spacing: 0;
          margin: 0.8rem 0 0.65rem;
        }

        .home-card {
          height: 100%;
          padding: 1.25rem;
        }

        .home-icon {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: var(--bc-soft-blue);
          color: var(--bc-primary);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
        }

        .home-step {
          display: flex;
          align-items: flex-start;
          gap: 0.85rem;
        }

        .home-step-number {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: var(--bc-gradient);
          color: #ffffff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.82rem;
          font-weight: 850;
          flex-shrink: 0;
        }

        .home-cta {
          background:
            linear-gradient(135deg, rgba(15, 23, 42, 0.97), rgba(29, 78, 216, 0.9));
          color: #ffffff;
          border-radius: var(--bc-radius-section);
          padding: 1.5rem;
          box-shadow: var(--bc-shadow-lg);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .home-cta p {
          color: rgba(255, 255, 255, 0.72);
        }

        @media(max-width: 768px) {
          .home-hero {
            padding: 3rem 0;
          }

          .home-section {
            padding: 2.75rem 0;
          }

          .home-action {
            width: 100%;
          }
        }
      `}</style>

      <main className="home-page">
        <section className="home-hero">
          <div className="home-container">
            <div className="row align-items-center g-4">
              <div className="col-lg-7">
                <div className="home-eyebrow">
                  <BrandLogo size="md" variant="light" />
                  <StatusBadge
                    status="Blockchain Credential Verification"
                    type="valid"
                  />
                </div>

                <h1 className="home-title">
                  Issue and verify academic certificates with
                  blockchain-backed trust.
                </h1>

                <p className="home-text mb-0">
                  BlockCred helps institutions issue tamper-resistant
                  certificates, students access verified credentials, and
                  employers confirm authenticity instantly.
                </p>

                <div className="home-actions">
                  <ActionButton
                    variant="primary"
                    className="home-action"
                    onClick={goTo("/public-verifier")}
                  >
                    <FaQrcode />
                    Verify Certificate
                    <FaArrowRight />
                  </ActionButton>

                  <ActionButton
                    variant="secondary"
                    className="home-action"
                    onClick={goTo("/login")}
                  >
                    <FaShieldAlt />
                    Sign In
                  </ActionButton>

                  <ActionButton
                    variant="ghost"
                    className="home-action"
                    onClick={goTo("/register-student")}
                  >
                    <FaUserGraduate />
                    Create Student Account
                    <FaArrowRight />
                  </ActionButton>
                </div>
              </div>

              <div className="col-lg-5">
                <Card className="home-preview">
                  <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                    <div>
                      <p className="home-muted small fw-bold mb-1">
                        Verification Preview
                      </p>
                      <h2 className="h5 fw-bold mb-0">Certificate Valid</h2>
                    </div>
                    <StatusBadge status="Verified" type="valid" />
                  </div>

                  {[
                    ["Certificate ID", "BC-2026-001"],
                    ["Blockchain record", "Found"],
                    ["PDF hash", "Matched"],
                    ["Status", "Active"],
                  ].map(([label, value]) => (
                    <div className="home-preview-row" key={label}>
                      <span className="home-muted">{label}</span>
                      <strong
                        className={label === "Certificate ID" ? "" : "text-success"}
                      >
                        {value}
                      </strong>
                    </div>
                  ))}

                  <ActionButton
                    variant="primary"
                    className="home-action w-100 mt-3"
                    onClick={goTo("/public-verifier")}
                  >
                    Open Verifier
                    <FaArrowRight />
                  </ActionButton>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="home-section">
          <div className="home-container">
            <div className="home-section-header">
              <StatusBadge status="Features" type="pending" />
              <h2 className="home-section-title">Built for certificate trust</h2>
              <p className="home-muted mb-0">
                Short, focused tools for institutions, students, and public
                reviewers.
              </p>
            </div>

            <div className="row g-3">
              {features.map((feature) => (
                <div className="col-md-6 col-xl-3" key={feature.title}>
                  <Card className="home-card">
                    <div className="home-icon">{feature.icon}</div>
                    <h3 className="h5 fw-bold mb-2">{feature.title}</h3>
                    <p className="home-muted mb-0">{feature.text}</p>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="home-section home-panel">
          <div className="home-container">
            <div className="home-section-header">
              <StatusBadge status="Workflow" type="successful" />
              <h2 className="home-section-title">Simple verification flow</h2>
              <p className="home-muted mb-0">
                From issuing to public verification, each step stays traceable.
              </p>
            </div>

            <div className="row g-3">
              {workflow.map((step, index) => (
                <div className="col-md-6 col-xl-3" key={step}>
                  <Card className="home-card">
                    <div className="home-step">
                      <span className="home-step-number">0{index + 1}</span>
                      <h3 className="h6 fw-bold mb-0">{step}</h3>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="home-section">
          <div className="home-container">
            <div className="home-section-header">
              <StatusBadge status="Product areas" type="valid" />
              <h2 className="home-section-title">
                One platform for every credential role
              </h2>
              <p className="home-muted mb-0">
                BlockCred separates admin control, student access, public
                verification, and payment-based access into clear workspaces.
              </p>
            </div>

            <div className="row g-3">
              {productAreas.map((area) => (
                <div className="col-md-6 col-xl-3" key={area.title}>
                  <Card className="home-card">
                    <div className="home-icon">{area.icon}</div>
                    <h3 className="h5 fw-bold mb-2">{area.title}</h3>
                    <p className="home-muted mb-0">{area.text}</p>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="home-section home-panel">
          <div className="home-container">
            <div className="row g-3 align-items-stretch">
              <div className="col-lg-7">
                <div className="home-section-header mb-0">
                  <StatusBadge status="Trust layer" type="valid" />
                  <h2 className="home-section-title">Security foundation</h2>
                  <p className="home-muted mb-0">
                    BlockCred combines authentication, storage, hashing, and
                    blockchain transactions into one certificate workflow.
                  </p>
                </div>
              </div>

              <div className="col-lg-5">
                <div className="row g-3">
                  {trustItems.map((item) => (
                    <div className="col-sm-6" key={item}>
                      <Card className="home-card">
                        <div className="d-flex align-items-center gap-3">
                          <div className="home-icon mb-0">
                            <FaCheckCircle />
                          </div>
                          <strong>{item}</strong>
                        </div>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
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
                    Enter a certificate ID or scan a QR code to confirm the
                    certificate record.
                  </p>
                </div>

                <div className="col-lg-4 text-lg-end">
                  <ActionButton
                    variant="secondary"
                    className="home-action"
                    onClick={goTo("/public-verifier")}
                  >
                    Open Public Verifier
                    <FaArrowRight />
                  </ActionButton>

                  <ActionButton
                    variant="ghost"
                    className="home-action ms-lg-2 mt-2 mt-lg-0"
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
