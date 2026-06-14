import Layout from "../components/Layout.js";
import Card from "../components/ui/Card.js";
import StatusBadge from "../components/ui/StatusBadge.js";
import { siteConfig } from "../config/site.js";

const PrivacyPolicy = () => (
  <Layout user={null}>
    <main className="bc-legal-page">
      <style>{`
        .bc-legal-page {
          min-height: 100vh;
          background: var(--bc-page-bg);
          padding: 3.5rem 1.25rem;
        }

        .bc-legal-wrap {
          max-width: 920px;
          margin: 0 auto;
        }

        .bc-legal-head {
          margin-bottom: 1.25rem;
        }

        .bc-legal-head h1 {
          margin: 0 0 0.65rem;
          color: var(--bc-text);
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 900;
          letter-spacing: 0;
        }

        .bc-legal-head p,
        .bc-legal-card p,
        .bc-legal-card li {
          color: var(--bc-muted);
          line-height: 1.7;
        }

        .bc-legal-card {
          padding: 1.5rem;
        }

        .bc-legal-card h2 {
          margin-top: 1.5rem;
          color: var(--bc-text);
          font-size: 1.1rem;
          font-weight: 850;
        }

        .bc-legal-card h2:first-child {
          margin-top: 0;
        }
      `}</style>

      <div className="bc-legal-wrap">
        <div className="bc-legal-head">
          <StatusBadge status="Public policy" type="valid" />
          <h1>Privacy Policy</h1>
          <p>
            This page explains how BlockCred handles information used for
            certificate issuance, student access, and public verification for{" "}
            {siteConfig.institutionName}.
          </p>
        </div>

        <Card className="bc-legal-card">
          <h2>Information we process</h2>
          <p>
            BlockCred may process certificate identifiers, student names,
            student IDs, email addresses, certificate metadata, PDF hashes,
            payment access status, and verification records required to operate
            the system.
          </p>

          <h2>How the information is used</h2>
          <p>
            Information is used to issue certificates, manage student access,
            support public verification, record revocation status, and maintain
            administrative audit trails.
          </p>

          <h2>Public verification</h2>
          <p>
            Public verification pages are intended to show only the information
            needed to confirm a credential. Verification does not require a
            wallet or public account login.
          </p>

          <h2>Security</h2>
          <p>
            Certificate PDFs are checked using SHA-256 hashes, and blockchain
            records are used as tamper-evident proof. Access to protected
            dashboards is controlled through authentication.
          </p>

          <h2>Contact</h2>
          <p>
            For support or privacy questions, contact{" "}
            <a href={`mailto:${siteConfig.supportEmail}`}>
              {siteConfig.supportEmail}
            </a>
            .
          </p>
        </Card>
      </div>
    </main>
  </Layout>
);

export default PrivacyPolicy;
