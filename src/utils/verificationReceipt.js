const escapeHtml = (value) => {
  if (value === undefined || value === null || value === "") {
    return "Not available";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const yesNo = (value) => {
  if (value === undefined || value === null) {
    return "Not available";
  }

  return value ? "Yes" : "No";
};

const getVerificationStatus = ({ certificate, verification }) => {
  if (!verification) return "Not verified";

  const title = String(verification.title || "").toLowerCase();

  if (title.includes("revoked") || certificate?.revoked) {
    return "Revoked";
  }

  if (verification.level === "success") {
    return "Valid";
  }

  if (verification.level === "warning") {
    return "Warning";
  }

  return "Not verified";
};

const downloadFile = (filename, content) => {
  const blob = new Blob([content], {
    type: "text/html;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadVerificationReceipt = ({
  certificate,
  verification,
  blockchain,
  verificationUrl,
}) => {
  const certId = certificate?.cert_id || "certificate";
  const safeCertId = String(certId).replace(/[^a-z0-9_-]/gi, "_");
  const verificationDate = new Date().toLocaleString();
  const status = getVerificationStatus({ certificate, verification });

  const rows = [
    ["Certificate ID", certificate?.cert_id],
    ["Student name", certificate?.student_name],
    ["Student ID", certificate?.student_id],
    ["Programme/Degree", certificate?.degree_program || certificate?.degree],
    ["Completion year", certificate?.completion_year],
    ["Issue date", certificate?.issue_date],
    ["Verification status", status],
    ["Revocation status", certificate?.revoked ? "Revoked" : "Not revoked"],
    ["Database record found", yesNo(Boolean(certificate))],
    ["Blockchain record found", yesNo(blockchain?.exists)],
    ["Certificate ID match", yesNo(verification?.certificateIdMatches)],
    ["PDF hash match", yesNo(verification?.hashMatches)],
    ["PDF hash", certificate?.pdf_hash || blockchain?.pdfHash],
    ["Blockchain transaction hash", certificate?.transaction_hash],
    ["Revoke transaction hash", certificate?.revoke_transaction_hash],
    ["Verification date/time", verificationDate],
    ["Verification URL", verificationUrl],
  ];

  const htmlRows = rows
    .map(
      ([label, value]) => `
        <tr>
          <th>${escapeHtml(label)}</th>
          <td>${escapeHtml(value)}</td>
        </tr>`
    )
    .join("");

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>BlockCred Verification Receipt - ${escapeHtml(certId)}</title>
  <style>
    body {
      margin: 0;
      padding: 32px;
      color: #0f172a;
      background: #f8fafc;
      font-family: Arial, sans-serif;
      line-height: 1.5;
    }
    main {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #dbe3ee;
      border-radius: 18px;
      padding: 32px;
    }
    h1 {
      margin: 0 0 8px;
      color: #0f2f57;
      font-size: 28px;
    }
    .subtitle {
      margin: 0 0 24px;
      color: #475569;
    }
    .status {
      display: inline-block;
      margin-bottom: 20px;
      padding: 8px 12px;
      border-radius: 999px;
      background: #e0f2fe;
      color: #075985;
      font-weight: 700;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }
    th,
    td {
      text-align: left;
      vertical-align: top;
      border-bottom: 1px solid #e2e8f0;
      padding: 11px 8px;
      word-break: break-word;
    }
    th {
      width: 34%;
      color: #334155;
      background: #f8fafc;
    }
    .note {
      margin-top: 24px;
      padding: 14px 16px;
      border-radius: 12px;
      background: #f1f5f9;
      color: #334155;
      font-size: 14px;
    }
    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      main {
        border: 0;
        border-radius: 0;
      }
    }
  </style>
</head>
<body>
  <main>
    <h1>BlockCred Verification Receipt</h1>
    <p class="subtitle">Printable record of a public certificate verification result.</p>
    <div class="status">Verification status: ${escapeHtml(status)}</div>
    <table>
      <tbody>${htmlRows}</tbody>
    </table>
    <p class="note">
      This receipt records the verification result displayed by BlockCred at the time of download.
    </p>
  </main>
</body>
</html>`;

  downloadFile(`BlockCred_Verification_Receipt_${safeCertId}.html`, html);
};
