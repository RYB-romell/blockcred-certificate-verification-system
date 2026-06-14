import Layout from "../components/Layout.js";
import Card from "../components/ui/Card.js";
import StatusBadge from "../components/ui/StatusBadge.js";
import { siteConfig } from "../config/site.js";

const TermsOfUse = () => (
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
          <StatusBadge status="Service terms" type="pending" />
          <h1>Terms of Use</h1>
          <p>
            These starter terms describe the expected use of BlockCred for{" "}
            {siteConfig.institutionName}. They should be reviewed and updated
            before formal production rollout.
          </p>
        </div>

        <Card className="bc-legal-card">
          <h2>Purpose</h2>
          <p>
            BlockCred provides certificate issuance, credential access, and
            public verification tools for academic records.
          </p>

          <h2>Verification results</h2>
          <p>
            Public verification results reflect the database and blockchain
            checks available at the time of verification. A valid result should
            be reviewed together with the certificate details shown on the page.
          </p>

          <h2>Authorized use</h2>
          <p>
            Administrative features are for authorized institution users only.
            Students should use their registered accounts to access issued
            credentials.
          </p>

          <h2>Demo network</h2>
          <p>
            The current deployment uses Ethereum Sepolia for demonstration and
            testing. Production blockchain and payment settings may be updated
            over time.
          </p>

          <h2>Support</h2>
          <p>
            For assistance, contact{" "}
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

export default TermsOfUse;
