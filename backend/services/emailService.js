const normalizeValue = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const escapeHtml = (value) => {
  return normalizeValue(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const getEmailConfig = () => {
  return {
    provider: normalizeValue(process.env.EMAIL_PROVIDER || "console").toLowerCase(),
    fromName: normalizeValue(process.env.EMAIL_FROM_NAME) || "BlockCred",
    fromAddress:
      normalizeValue(process.env.EMAIL_FROM_ADDRESS) ||
      "no-reply@blockcred.local",
    supportAddress:
      normalizeValue(process.env.EMAIL_SUPPORT_ADDRESS) ||
      "support@blockcred.local",
  };
};

const buildCertificateIssuedEmail = ({
  studentName,
  certificateId,
  program,
  verificationUrl,
  dashboardUrl,
  institutionName,
  supportEmail,
}) => {
  const safeStudentName = normalizeValue(studentName) || "Student";
  const safeCertificateId = normalizeValue(certificateId) || "Not available";
  const safeProgram = normalizeValue(program) || "Not available";
  const safeInstitutionName =
    normalizeValue(institutionName) || "BlockCred Institution";
  const safeSupportEmail =
    normalizeValue(supportEmail) || "support@blockcred.local";

  const subject = `Certificate issued: ${safeCertificateId}`;

  const text = [
    `Hello ${safeStudentName},`,
    "",
    `${safeInstitutionName} has issued a certificate for you in BlockCred.`,
    "",
    `Certificate ID: ${safeCertificateId}`,
    `Programme/Degree: ${safeProgram}`,
    "",
    `Verify certificate: ${verificationUrl}`,
    `Student dashboard: ${dashboardUrl}`,
    "",
    "Security note: BlockCred verification links allow third parties to confirm certificate authenticity using institutional records and blockchain proof.",
    "",
    `For support, contact ${safeSupportEmail}.`,
  ].join("\n");

  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
    <div style="max-width:640px;margin:0 auto;padding:28px;">
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:28px;">
        <h1 style="margin:0 0 12px;font-size:24px;color:#0f172a;">Certificate issued</h1>
        <p style="margin:0 0 18px;line-height:1.6;">Hello ${escapeHtml(
          safeStudentName
        )},</p>
        <p style="margin:0 0 18px;line-height:1.6;">
          ${escapeHtml(
            safeInstitutionName
          )} has issued a certificate for you in BlockCred.
        </p>
        <div style="background:#f1f5f9;border-radius:12px;padding:16px;margin:18px 0;">
          <p style="margin:0 0 8px;"><strong>Certificate ID:</strong> ${escapeHtml(
            safeCertificateId
          )}</p>
          <p style="margin:0;"><strong>Programme/Degree:</strong> ${escapeHtml(
            safeProgram
          )}</p>
        </div>
        <p style="margin:18px 0;line-height:1.6;">
          <a href="${escapeHtml(
            verificationUrl
          )}" style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;border-radius:10px;padding:12px 16px;font-weight:bold;">Open Public Verifier</a>
        </p>
        <p style="margin:0 0 18px;line-height:1.6;">
          You can also sign in to your student dashboard: <a href="${escapeHtml(
            dashboardUrl
          )}">${escapeHtml(dashboardUrl)}</a>
        </p>
        <p style="margin:0 0 18px;line-height:1.6;color:#475569;">
          Security note: BlockCred verification links allow third parties to confirm certificate authenticity using institutional records and blockchain proof.
        </p>
        <p style="margin:0;line-height:1.6;color:#475569;">
          For support, contact <a href="mailto:${escapeHtml(
            safeSupportEmail
          )}">${escapeHtml(safeSupportEmail)}</a>.
        </p>
      </div>
    </div>
  </body>
</html>`;

  return {
    subject,
    text,
    html,
  };
};

export const sendCertificateIssuedEmail = async ({
  to,
  studentName,
  certificateId,
  program,
  verificationUrl,
  institutionName,
  supportEmail,
}) => {
  const finalTo = normalizeValue(to).toLowerCase();

  if (!finalTo) {
    return {
      success: false,
      skipped: true,
      reason: "missing_recipient",
    };
  }

  const config = getEmailConfig();
  const dashboardUrl = `${normalizeValue(process.env.FRONTEND_URL) || "http://localhost:3000"}/dashboard`;
  const email = buildCertificateIssuedEmail({
    studentName,
    certificateId,
    program,
    verificationUrl,
    dashboardUrl,
    institutionName,
    supportEmail: supportEmail || config.supportAddress,
  });

  if (!config.provider || config.provider === "console") {
    console.info("Certificate issued email notification:", {
      provider: "console",
      from: `${config.fromName} <${config.fromAddress}>`,
      to: finalTo,
      subject: email.subject,
      text: email.text,
    });

    return {
      success: true,
      provider: "console",
    };
  }

  console.warn(
    `EMAIL_PROVIDER "${config.provider}" is configured, but provider delivery is not implemented yet.`
  );

  return {
    success: false,
    skipped: true,
    provider: config.provider,
    reason: "provider_not_implemented",
  };
};
