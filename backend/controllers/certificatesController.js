// backend/controllers/certificatesController.js

import fs from "fs";
import crypto from "crypto";
import { ethers } from "ethers";
import { supabase } from "../supabase.js";
import { contractAddress, contractABI } from "../contract.js";
import { logActivity } from "../services/activityLogger.js";
import { sendCertificateIssuedEmail } from "../services/emailService.js";

const CERTIFICATE_BUCKET = "certificates";

const normalizeValue = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const normalizeEmail = (email) => {
  return normalizeValue(email).toLowerCase();
};

const normalizeLower = (value) => {
  return normalizeValue(value).toLowerCase();
};

const normalizePdfHash = (hash) => {
  return normalizeValue(hash).toLowerCase().replace(/^0x/, "");
};

const normalizeTxHash = (hash) => {
  return normalizeValue(hash).toLowerCase();
};

const normalizeGpa = (value) => {
  const cleaned = normalizeValue(value).replace(",", ".");

  if (!cleaned) return null;

  const numberValue = Number(cleaned);

  if (Number.isNaN(numberValue)) {
    throw new Error("GPA must be a valid number. Example: 4.23");
  }

  return numberValue;
};

const isValidEmail = (email) => {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidPdfHash = (hash) => {
  return /^[a-f0-9]{64}$/.test(hash);
};

const isValidTransactionHash = (hash) => {
  return /^0x[a-f0-9]{64}$/.test(hash);
};

const sendError = (res, status, message, extra = {}) => {
  return res.status(status).json({
    success: false,
    message,
    ...extra,
  });
};

const sendSuccess = (res, status, payload = {}) => {
  return res.status(status).json({
    success: true,
    ...payload,
  });
};

const deleteTempFile = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error("Temporary file delete error:", error.message);
  }
};

const computePdfHash = (pdfBuffer) => {
  return crypto.createHash("sha256").update(pdfBuffer).digest("hex");
};

const hashesMatch = (firstHash, secondHash) => {
  const first = normalizePdfHash(firstHash);
  const second = normalizePdfHash(secondHash);

  if (!first || !second) return false;
  if (first.length !== second.length) return false;

  return crypto.timingSafeEqual(Buffer.from(first), Buffer.from(second));
};

const safeStorageName = (value) => {
  return normalizeValue(value)
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .slice(0, 80);
};

const getJsonRpcProvider = () => {
  const rpcUrl = process.env.SEPOLIA_RPC_URL;

  if (!rpcUrl) {
    throw new Error("Missing SEPOLIA_RPC_URL in backend .env");
  }

  if (ethers.JsonRpcProvider) {
    return new ethers.JsonRpcProvider(rpcUrl);
  }

  return new ethers.providers.JsonRpcProvider(rpcUrl);
};

const getReadOnlyContract = () => {
  const provider = getJsonRpcProvider();
  return new ethers.Contract(contractAddress, contractABI, provider);
};

const toNumber = (value) => {
  if (value === undefined || value === null) return 0;

  if (typeof value === "bigint") {
    return Number(value);
  }

  if (typeof value.toString === "function") {
    return Number(value.toString());
  }

  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? 0 : numberValue;
};

const getCertificateFromBlockchain = async (certId) => {
  const contract = getReadOnlyContract();

  if (typeof contract.getCertificate !== "function") {
    throw new Error("Contract ABI does not contain getCertificate().");
  }

  const result = await contract.getCertificate(certId);

  return {
    certId: String(result[0] || ""),
    studentName: String(result[1] || ""),
    degree: String(result[2] || ""),
    pdfHash: normalizePdfHash(result[3] || ""),
    revoked: Boolean(result[4]),
    issueDate: toNumber(result[5]),
  };
};

const uploadPdfToSupabase = async ({ certId, pdfBuffer }) => {
  const safeCertId = safeStorageName(certId) || "certificate";
  const filePath = `${safeCertId}-${Date.now()}.pdf`;

  const { data, error } = await supabase.storage
    .from(CERTIFICATE_BUCKET)
    .upload(filePath, pdfBuffer, {
      contentType: "application/pdf",
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Supabase PDF upload failed: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(CERTIFICATE_BUCKET)
    .getPublicUrl(filePath);

  return {
    storagePath: data?.path || filePath,
    publicUrl: publicUrlData?.publicUrl || "",
  };
};

const findCertificateById = async (certId) => {
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .eq("cert_id", certId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const getPaymentDetails = () => {
  return {
    amount: Number(process.env.PAYMENT_AMOUNT || 5000),
    currency: process.env.PAYMENT_CURRENCY || "XAF",
  };
};

const getFrontendUrl = () => {
  return (process.env.FRONTEND_URL || "http://localhost:3000")
    .trim()
    .replace(/\/+$/, "");
};

const getInstitutionEmailDetails = async () => {
  try {
    const { data, error } = await supabase
      .from("institution_settings")
      .select("institution_name, support_email")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return {
      institutionName: data?.institution_name || "BlockCred Institution",
      supportEmail:
        data?.support_email ||
        process.env.EMAIL_SUPPORT_ADDRESS ||
        "support@blockcred.local",
    };
  } catch (error) {
    console.warn("Institution email settings fallback used:", error.message);

    return {
      institutionName: "BlockCred Institution",
      supportEmail:
        process.env.EMAIL_SUPPORT_ADDRESS || "support@blockcred.local",
    };
  }
};

const notifyCertificateIssuedEmail = async ({ req, certificate }) => {
  try {
    if (!certificate?.student_email) {
      return "skipped";
    }

    const { institutionName, supportEmail } =
      await getInstitutionEmailDetails();
    const frontendUrl = getFrontendUrl();
    const verificationUrl = `${frontendUrl}/public-verifier?certId=${encodeURIComponent(
      certificate.cert_id
    )}`;

    const result = await sendCertificateIssuedEmail({
      to: certificate.student_email,
      studentName: certificate.student_name,
      certificateId: certificate.cert_id,
      program: certificate.degree_program,
      verificationUrl,
      institutionName,
      supportEmail,
    });

    if (result.success) {
      await logActivity({
        req,
        action: "certificate_email_sent",
        entity_type: "certificate",
        entity_id: certificate.cert_id,
        entity_label: certificate.student_name || certificate.cert_id,
        description: "Certificate issued email sent to student.",
        metadata: {
          cert_id: certificate.cert_id,
          student_email: certificate.student_email,
          provider: result.provider || "console",
        },
      });

      return "sent";
    }

    if (!result.skipped) {
      await logActivity({
        req,
        action: "certificate_email_failed",
        entity_type: "certificate",
        entity_id: certificate.cert_id,
        entity_label: certificate.student_name || certificate.cert_id,
        description: "Certificate issued email could not be sent.",
        metadata: {
          cert_id: certificate.cert_id,
          student_email: certificate.student_email,
          reason: result.reason || "unknown",
        },
      });
    }

    return result.skipped ? "skipped" : "failed";
  } catch (error) {
    console.warn("Certificate issued email failed:", error.message);

    try {
      await logActivity({
        req,
        action: "certificate_email_failed",
        entity_type: "certificate",
        entity_id: certificate?.cert_id,
        entity_label: certificate?.student_name || certificate?.cert_id,
        description: "Certificate issued email could not be sent.",
        metadata: {
          cert_id: certificate?.cert_id,
          student_email: certificate?.student_email,
          reason: error.message,
        },
      });
    } catch (logError) {
      console.warn("Certificate email failure activity log failed:", logError.message);
    }

    return "failed";
  }
};

const findStudentByField = async (field, value) => {
  const finalValue = normalizeValue(value);

  if (!finalValue) return null;

  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq(field, finalValue)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const findStudentForCertificateAccess = async ({ studentIdentifier, user }) => {
  const lookupCandidates = [
    ["email", normalizeEmail(user?.email)],
    ["firebase_uid", normalizeValue(user?.uid)],
    ["student_id", normalizeValue(user?.student_id)],
    ["uid", normalizeValue(user?.student_id)],
    ["email", normalizeEmail(studentIdentifier)],
    ["student_id", normalizeValue(studentIdentifier)],
    ["firebase_uid", normalizeValue(studentIdentifier)],
    ["uid", normalizeValue(studentIdentifier)],
  ];

  const seen = new Set();

  for (const [field, value] of lookupCandidates) {
    const finalValue = normalizeValue(value);
    const key = `${field}:${finalValue}`;

    if (!finalValue || seen.has(key)) {
      continue;
    }

    seen.add(key);

    const student = await findStudentByField(field, finalValue);

    if (student) {
      return student;
    }
  }

  return null;
};

const getStudentSubscriptionStatus = (student) => {
  return normalizeLower(student?.subscription_status) || "inactive";
};

const isStudentPaymentActive = (student) => {
  return getStudentSubscriptionStatus(student) === "active";
};

const sendPaymentRequired = (res, subscriptionStatus) => {
  return res.status(402).json({
    success: false,
    payment_required: true,
    subscription_status: subscriptionStatus || "inactive",
    message: "Payment is required to access certificates.",
    payment: getPaymentDetails(),
  });
};

const validateCertificatePayload = ({
  certId,
  studentId,
  studentName,
  studentEmail,
  degreeProgram,
  issueDate,
  pdfHash,
  transactionHash,
  requirePdfHash = true,
  requireTransactionHash = true,
}) => {
  if (!certId || !studentId || !studentName || !degreeProgram || !issueDate) {
    return {
      valid: false,
      message:
        "Certificate ID, student ID, student name, degree program, and issue date are required.",
    };
  }

  if (studentEmail && !isValidEmail(studentEmail)) {
    return {
      valid: false,
      message: "Student email must be a valid email address.",
    };
  }

  if (requirePdfHash && !pdfHash) {
    return {
      valid: false,
      message: "PDF hash is required.",
    };
  }

  if (pdfHash && !isValidPdfHash(pdfHash)) {
    return {
      valid: false,
      message: "PDF hash must be a valid 64-character SHA-256 hash.",
    };
  }

  if (requireTransactionHash && !transactionHash) {
    return {
      valid: false,
      message:
        "Blockchain transaction hash is missing. Confirm MetaMask transaction before saving.",
    };
  }

  if (transactionHash && !isValidTransactionHash(transactionHash)) {
    return {
      valid: false,
      message: "Transaction hash must be a valid Ethereum transaction hash.",
    };
  }

  return {
    valid: true,
    message: "",
  };
};

export const uploadSingleCertificate = async (req, res) => {
  let tempPdfPath = null;

  try {
    const {
      cert_id,
      student_id,
      student_name,
      student_email,
      degree_program,
      degree,
      gpa,
      completion_year,
      issue_date,
      pdf_hash,
      transaction_hash,
    } = req.body;

    const pdfFile = req.file;
    tempPdfPath = pdfFile?.path;

    const finalCertId = normalizeValue(cert_id);
    const finalStudentId = normalizeValue(student_id);
    const finalStudentName = normalizeValue(student_name);
    const finalStudentEmail = normalizeEmail(student_email);
    const finalDegreeProgram = normalizeValue(degree_program || degree);
    const finalGpa = normalizeGpa(gpa);
    const finalCompletionYear = normalizeValue(completion_year);
    const finalIssueDate = normalizeValue(issue_date);
    const finalFrontendHash = normalizePdfHash(pdf_hash);
    const finalTransactionHash = normalizeTxHash(transaction_hash);

    const validation = validateCertificatePayload({
      certId: finalCertId,
      studentId: finalStudentId,
      studentName: finalStudentName,
      studentEmail: finalStudentEmail,
      degreeProgram: finalDegreeProgram,
      issueDate: finalIssueDate,
      pdfHash: finalFrontendHash,
      transactionHash: finalTransactionHash,
    });

    if (!validation.valid) {
      return sendError(res, 400, validation.message);
    }

    if (!pdfFile) {
      return sendError(res, 400, "Certificate PDF file is required.");
    }

    const existingCertificate = await findCertificateById(finalCertId);

    if (existingCertificate) {
      return sendError(
        res,
        409,
        "Certificate already exists in the database."
      );
    }

    const pdfBuffer = fs.readFileSync(pdfFile.path);
    const backendPdfHash = computePdfHash(pdfBuffer);

    if (!hashesMatch(backendPdfHash, finalFrontendHash)) {
      return sendError(
        res,
        400,
        "PDF hash mismatch. The uploaded PDF is not the same file that was sent to the blockchain.",
        {
          frontendHash: finalFrontendHash,
          backendHash: backendPdfHash,
        }
      );
    }

    let blockchainCertificate = null;

    if (process.env.SEPOLIA_RPC_URL) {
      blockchainCertificate = await getCertificateFromBlockchain(finalCertId);

      if (!blockchainCertificate.certId) {
        return sendError(
          res,
          400,
          "This certificate ID was not found on the blockchain. Wait for the transaction to confirm, then try again."
        );
      }

      if (!hashesMatch(blockchainCertificate.pdfHash, backendPdfHash)) {
        return sendError(
          res,
          400,
          "Blockchain hash does not match the uploaded PDF hash.",
          {
            blockchainHash: blockchainCertificate.pdfHash,
            backendHash: backendPdfHash,
          }
        );
      }
    }

    const { publicUrl, storagePath } = await uploadPdfToSupabase({
      certId: finalCertId,
      pdfBuffer,
    });

    const { data, error } = await supabase
      .from("certificates")
      .insert([
        {
          cert_id: finalCertId,
          student_id: finalStudentId,
          student_name: finalStudentName,
          student_email: finalStudentEmail || null,
          degree_program: finalDegreeProgram,
          gpa: finalGpa,
          completion_year: finalCompletionYear || null,
          issue_date: finalIssueDate,
          pdf_url: publicUrl,
          pdf_storage_path: storagePath,
          pdf_hash: backendPdfHash,
          transaction_hash: finalTransactionHash,
          revoked: blockchainCertificate?.revoked || false,
          revoke_transaction_hash: null,
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Database insert failed: ${error.message}`);
    }

    await logActivity({
      req,
      action: "certificate_issued",
      entity_type: "certificate",
      entity_id: data.cert_id,
      entity_label: data.student_name || data.cert_id,
      description: `Certificate ${data.cert_id} was issued for ${data.student_name}.`,
      metadata: {
        cert_id: data.cert_id,
        student_id: data.student_id,
        student_email: data.student_email,
        transaction_hash: data.transaction_hash,
        pdf_hash: data.pdf_hash,
      },
    });

    const emailNotification = await notifyCertificateIssuedEmail({
      req,
      certificate: data,
    });

    return sendSuccess(res, 201, {
      message: "Certificate saved successfully.",
      certificate: data,
      email_notification: emailNotification,
    });
  } catch (error) {
    console.error("uploadSingleCertificate error:", error);

    return sendError(
      res,
      500,
      error.message || "Failed to save certificate."
    );
  } finally {
    deleteTempFile(tempPdfPath);
  }
};

export const getAllCertificates = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("certificates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return res.status(200).json(data || []);
  } catch (error) {
    console.error("getAllCertificates error:", error);

    return sendError(
      res,
      500,
      error.message || "Failed to fetch certificates."
    );
  }
};

export const getCertificateStats = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("certificates")
      .select("cert_id, student_id, revoked");

    if (error) {
      throw new Error(error.message);
    }

    const certificates = data || [];
    const uniqueStudents = new Set(
      certificates
        .map((certificate) => certificate.student_id)
        .filter(Boolean)
    );

    return res.status(200).json({
      totalStudents: uniqueStudents.size,
      totalCertificates: certificates.length,
      activeCertificates: certificates.filter(
        (certificate) => !certificate.revoked
      ).length,
      revokedCertificates: certificates.filter(
        (certificate) => certificate.revoked
      ).length,
      verifications: 0,
    });
  } catch (error) {
    console.error("getCertificateStats error:", error);

    return sendError(
      res,
      500,
      error.message || "Failed to fetch certificate stats."
    );
  }
};

export const getStudentCertificates = async (req, res) => {
  try {
    const { studentIdentifier } = req.params;
    const identifier = normalizeValue(studentIdentifier);
    const lowerIdentifier = normalizeEmail(studentIdentifier);

    if (!identifier) {
      return sendError(res, 400, "Student identifier is required.");
    }

    if (req.user?.role !== "admin") {
      const student = await findStudentForCertificateAccess({
        studentIdentifier: identifier,
        user: req.user,
      });

      if (!student) {
        return sendError(
          res,
          404,
          "Student record not found. Payment status could not be verified."
        );
      }

      const subscriptionStatus = getStudentSubscriptionStatus(student);

      if (!isStudentPaymentActive(student)) {
        return sendPaymentRequired(res, subscriptionStatus);
      }
    }

    const { data, error } = await supabase
      .from("certificates")
      .select("*")
      .or(`student_id.eq.${identifier},student_email.eq.${lowerIdentifier}`)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return res.status(200).json(data || []);
  } catch (error) {
    console.error("getStudentCertificates error:", error);

    return sendError(
      res,
      500,
      error.message || "Failed to fetch student certificates."
    );
  }
};

export const getCertificateById = async (req, res) => {
  try {
    const { certId } = req.params;
    const finalCertId = normalizeValue(certId);

    if (!finalCertId) {
      return sendError(res, 400, "Certificate ID is required.");
    }

    const data = await findCertificateById(finalCertId);

    if (!data) {
      return sendError(res, 404, "Certificate not found.");
    }

    const certificate = {
      ...data,
    };

    if (process.env.SEPOLIA_RPC_URL) {
      try {
        const chainCertificate = await getCertificateFromBlockchain(finalCertId);

        certificate.blockchain = {
          found: Boolean(chainCertificate.certId),
          cert_id: chainCertificate.certId,
          student_name: chainCertificate.studentName,
          degree: chainCertificate.degree,
          pdf_hash: chainCertificate.pdfHash,
          revoked: chainCertificate.revoked,
          issue_date: chainCertificate.issueDate,
        };

        certificate.verification = {
          databaseFound: true,
          blockchainFound: Boolean(chainCertificate.certId),
          hashMatched: hashesMatch(data.pdf_hash, chainCertificate.pdfHash),
          revoked: Boolean(data.revoked || chainCertificate.revoked),
        };
      } catch (chainError) {
        console.error("Public blockchain check error:", chainError.message);

        certificate.blockchain = {
          found: false,
          error: chainError.message,
        };

        certificate.verification = {
          databaseFound: true,
          blockchainFound: false,
          hashMatched: false,
          revoked: Boolean(data.revoked),
        };
      }
    }

    return res.status(200).json(certificate);
  } catch (error) {
    console.error("getCertificateById error:", error);

    return sendError(
      res,
      500,
      error.message || "Failed to fetch certificate."
    );
  }
};

export const revokeCertificate = async (req, res) => {
  try {
    const { certId } = req.params;
    const { revoke_transaction_hash } = req.body || {};

    const finalCertId = normalizeValue(certId);
    const finalRevokeTransactionHash = normalizeTxHash(revoke_transaction_hash);

    if (!finalCertId) {
      return sendError(res, 400, "Certificate ID is required.");
    }

    if (
      finalRevokeTransactionHash &&
      !isValidTransactionHash(finalRevokeTransactionHash)
    ) {
      return sendError(
        res,
        400,
        "Revocation transaction hash must be a valid Ethereum transaction hash."
      );
    }

    const existingCertificate = await findCertificateById(finalCertId);

    if (!existingCertificate) {
      return sendError(res, 404, "Certificate not found.");
    }

    if (existingCertificate.revoked) {
      await logActivity({
        req,
        action: "certificate_revoked",
        entity_type: "certificate",
        entity_id: existingCertificate.cert_id,
        entity_label: existingCertificate.student_name || existingCertificate.cert_id,
        description: `Certificate ${existingCertificate.cert_id} was already revoked.`,
        metadata: {
          cert_id: existingCertificate.cert_id,
          already_revoked: true,
        },
      });

      return sendSuccess(res, 200, {
        message: "Certificate is already revoked.",
        certificate: existingCertificate,
      });
    }

    const { data, error } = await supabase
      .from("certificates")
      .update({
        revoked: true,
        revoke_transaction_hash: finalRevokeTransactionHash || null,
      })
      .eq("cert_id", finalCertId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    await logActivity({
      req,
      action: "certificate_revoked",
      entity_type: "certificate",
      entity_id: data.cert_id,
      entity_label: data.student_name || data.cert_id,
      description: `Certificate ${data.cert_id} was revoked.`,
      metadata: {
        cert_id: data.cert_id,
        student_id: data.student_id,
        revoke_transaction_hash: data.revoke_transaction_hash,
      },
    });

    return sendSuccess(res, 200, {
      message: "Certificate revoked successfully.",
      certificate: data,
    });
  } catch (error) {
    console.error("revokeCertificate error:", error);

    return sendError(
      res,
      500,
      error.message || "Failed to revoke certificate."
    );
  }
};

export const recoverCertificateUpload = async (req, res) => {
  let tempPdfPath = null;

  try {
    const {
      cert_id,
      student_id,
      student_name,
      student_email,
      degree_program,
      degree,
      gpa,
      completion_year,
      issue_date,
      pdf_hash,
      transaction_hash,
    } = req.body;

    const pdfFile = req.file;
    tempPdfPath = pdfFile?.path;

    const finalCertId = normalizeValue(cert_id);
    const finalStudentId = normalizeValue(student_id);
    const finalStudentName = normalizeValue(student_name);
    const finalStudentEmail = normalizeEmail(student_email);
    const finalDegreeProgram = normalizeValue(degree_program || degree);
    const finalGpa = normalizeGpa(gpa);
    const finalCompletionYear = normalizeValue(completion_year);
    const finalIssueDate = normalizeValue(issue_date);
    const finalPdfHash = normalizePdfHash(pdf_hash);
    const finalTransactionHash = normalizeTxHash(transaction_hash);

    const validation = validateCertificatePayload({
      certId: finalCertId,
      studentId: finalStudentId,
      studentName: finalStudentName,
      studentEmail: finalStudentEmail,
      degreeProgram: finalDegreeProgram,
      issueDate: finalIssueDate,
      pdfHash: finalPdfHash,
      transactionHash: finalTransactionHash,
    });

    if (!validation.valid) {
      return sendError(res, 400, validation.message);
    }

    if (!pdfFile) {
      return sendError(res, 400, "Certificate PDF file is required.");
    }

    const existingCertificate = await findCertificateById(finalCertId);

    if (existingCertificate) {
      return sendError(
        res,
        409,
        "Certificate already exists in the database."
      );
    }

    const chainCertificate = await getCertificateFromBlockchain(finalCertId);

    if (!chainCertificate.certId) {
      return sendError(
        res,
        404,
        "This certificate ID does not exist on the blockchain. Recovery stopped."
      );
    }

    if (!hashesMatch(chainCertificate.pdfHash, finalPdfHash)) {
      return sendError(
        res,
        400,
        "Blockchain hash does not match the submitted PDF hash. Recovery stopped.",
        {
          blockchainHash: chainCertificate.pdfHash,
          submittedHash: finalPdfHash,
        }
      );
    }

    const pdfBuffer = fs.readFileSync(pdfFile.path);
    const backendComputedHash = computePdfHash(pdfBuffer);

    if (!hashesMatch(backendComputedHash, finalPdfHash)) {
      return sendError(
        res,
        400,
        "Uploaded PDF does not match the submitted hash. Recovery stopped.",
        {
          backendComputedHash,
          submittedHash: finalPdfHash,
        }
      );
    }

    const uploadedPdf = await uploadPdfToSupabase({
      certId: finalCertId,
      pdfBuffer,
    });

    const { data, error } = await supabase
      .from("certificates")
      .insert([
        {
          cert_id: finalCertId,
          student_id: finalStudentId,
          student_name: finalStudentName,
          student_email: finalStudentEmail || null,
          degree_program: finalDegreeProgram,
          gpa: finalGpa,
          completion_year: finalCompletionYear || null,
          issue_date: finalIssueDate,
          pdf_url: uploadedPdf.publicUrl,
          pdf_storage_path: uploadedPdf.storagePath,
          pdf_hash: backendComputedHash,
          transaction_hash: finalTransactionHash,
          revoked: chainCertificate.revoked,
          revoke_transaction_hash: null,
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Database recovery insert failed: ${error.message}`);
    }

    await logActivity({
      req,
      action: "certificate_upload_recovered",
      entity_type: "certificate",
      entity_id: data.cert_id,
      entity_label: data.student_name || data.cert_id,
      description: `Certificate ${data.cert_id} upload was recovered.`,
      metadata: {
        cert_id: data.cert_id,
        student_id: data.student_id,
        student_email: data.student_email,
        transaction_hash: data.transaction_hash,
        pdf_hash: data.pdf_hash,
      },
    });

    const emailNotification = await notifyCertificateIssuedEmail({
      req,
      certificate: data,
    });

    return sendSuccess(res, 201, {
      message: "Certificate recovered successfully.",
      certificate: data,
      email_notification: emailNotification,
    });
  } catch (error) {
    console.error("recoverCertificateUpload error:", error);

    return sendError(
      res,
      500,
      error.message || "Failed to recover certificate."
    );
  } finally {
    deleteTempFile(tempPdfPath);
  }
};
