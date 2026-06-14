// src/pages/AdminCertificate.js

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaEthereum,
  FaExclamationTriangle,
  FaExternalLinkAlt,
  FaFilePdf,
  FaFingerprint,
  FaRedo,
  FaShieldAlt,
  FaUpload,
} from "react-icons/fa";
import { authFetch } from "../api.js";
import { getAdminContractWithSigner } from "../blockchain.js";
import AdminPageShell from "../components/layout/AdminPageShell.js";
import ActionButton from "../components/ui/ActionButton.js";
import AlertMessage from "../components/ui/AlertMessage.js";
import Card from "../components/ui/Card.js";
import ConfirmModal from "../components/ui/ConfirmModal.js";
import EmptyState from "../components/ui/EmptyState.js";
import StatusBadge from "../components/ui/StatusBadge.js";

const emptyForm = {
  cert_id: "",
  student_id: "",
  student_name: "",
  student_email: "",
  degree_program: "",
  gpa: "",
  completion_year: "",
  issue_date: "",
};

const AdminCertificate = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfHash, setPdfHash] = useState("");

  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [revokingCertId, setRevokingCertId] = useState("");

  const [recoveryTxHash, setRecoveryTxHash] = useState("");
  const [recovering, setRecovering] = useState(false);

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });
  const [selectedRevokeCertificate, setSelectedRevokeCertificate] =
    useState(null);
  const [issuePreview, setIssuePreview] = useState(null);

  const pdfInputRef = useRef(null);

  const formDisabled = loading || recovering || Boolean(revokingCertId);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });

    setTimeout(() => {
      setMessage({ type: "", text: "" });
    }, 7000);
  };

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setPdfFile(null);
    setPdfHash("");
    setRecoveryTxHash("");

    if (pdfInputRef.current) {
      pdfInputRef.current.value = "";
    }
  };

  const fetchCertificates = async () => {
    setTableLoading(true);

    try {
      const response = await authFetch("/api/certificates");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not fetch certificates.");
      }

      if (Array.isArray(data)) {
        setCertificates(data);
      } else if (Array.isArray(data.data)) {
        setCertificates(data.data);
      } else if (Array.isArray(data.certificates)) {
        setCertificates(data.certificates);
      } else {
        setCertificates([]);
      }
    } catch (error) {
      console.error("Fetch certificates error:", error);
      setCertificates([]);
    } finally {
      setTableLoading(false);
    }
  };

  const computePdfHash = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    return hashArray
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  };

  const handlePdfChange = async (file) => {
    if (!file) {
      setPdfFile(null);
      setPdfHash("");
      return;
    }

    if (file.type !== "application/pdf") {
      showMessage("warning", "Please upload a valid PDF certificate.");
      setPdfFile(null);
      setPdfHash("");

      if (pdfInputRef.current) {
        pdfInputRef.current.value = "";
      }

      return;
    }

    try {
      setPdfFile(file);
      showMessage("info", "Computing PDF hash...");

      const hash = await computePdfHash(file);
      setPdfHash(hash);

      showMessage("success", `PDF hash ready: ${hash.slice(0, 24)}...`);
    } catch (error) {
      console.error("PDF hash error:", error);
      setPdfFile(null);
      setPdfHash("");
      showMessage("error", "Could not compute PDF hash.");

      if (pdfInputRef.current) {
        pdfInputRef.current.value = "";
      }
    }
  };

  const validateForm = () => {
    if (!form.cert_id.trim()) return "Certificate ID is required.";
    if (!form.student_id.trim()) return "Student ID is required.";
    if (!form.student_name.trim()) return "Student name is required.";
    if (!form.degree_program.trim()) return "Degree program is required.";
    if (!form.issue_date.trim()) return "Issue date is required.";
    if (!pdfFile) return "Certificate PDF is required.";
    if (!pdfHash) return "PDF hash is not ready yet.";

    return "";
  };

  const getWalletPreviewDetails = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      return {
        walletAddress: "MetaMask not detected",
        networkInfo: "MetaMask not detected",
      };
    }

    try {
      const [accounts, chainId] = await Promise.all([
        window.ethereum.request({ method: "eth_accounts" }),
        window.ethereum.request({ method: "eth_chainId" }),
      ]);
      const walletAddress = Array.isArray(accounts) && accounts[0]
        ? accounts[0]
        : "Not connected";
      const networkInfo =
        chainId === "0xaa36a7"
          ? "Sepolia Test Network (11155111)"
          : chainId || "Unknown network";

      return {
        walletAddress,
        networkInfo,
      };
    } catch (error) {
      console.warn("Could not read wallet preview details:", error.message);

      return {
        walletAddress: "Not available",
        networkInfo: "Not available",
      };
    }
  };

  const checkCertificateAlreadyExistsOnChain = async (contract, certId) => {
    try {
      if (typeof contract.getCertificateHash !== "function") {
        throw new Error("Contract ABI does not contain getCertificateHash().");
      }

      const existingHash = await contract.getCertificateHash(certId);

      return Boolean(existingHash && String(existingHash).trim() !== "");
    } catch (error) {
      console.warn(
        "Could not check existing on-chain certificate:",
        error.message
      );
      return false;
    }
  };

  const buildCertificateFormData = (transactionHash) => {
    const formDataToSend = new FormData();

    formDataToSend.append("cert_id", form.cert_id.trim());
    formDataToSend.append("student_id", form.student_id.trim());
    formDataToSend.append("student_name", form.student_name.trim());
    formDataToSend.append("student_email", form.student_email.trim() || "");
    formDataToSend.append("degree_program", form.degree_program.trim());
    formDataToSend.append("degree", form.degree_program.trim());
    formDataToSend.append("gpa", form.gpa.trim() || "");
    formDataToSend.append("completion_year", form.completion_year.trim() || "");
    formDataToSend.append("issue_date", form.issue_date.trim());
    formDataToSend.append("pdf_hash", pdfHash);
    formDataToSend.append("transaction_hash", transactionHash);
    formDataToSend.append("pdf", pdfFile);

    return formDataToSend;
  };

  const issueCertificate = async () => {
    const validationError = validateForm();

    if (validationError) {
      showMessage("warning", validationError);
      return false;
    }

    setLoading(true);

    try {
      showMessage("info", "Checking admin wallet...");

      const { contract } = await getAdminContractWithSigner();

      if (typeof contract.issueCertificateWithHash !== "function") {
        throw new Error(
          "Your contract ABI does not contain issueCertificateWithHash(). Check contract.js."
        );
      }

      const existsOnChain = await checkCertificateAlreadyExistsOnChain(
        contract,
        form.cert_id.trim()
      );

      if (existsOnChain) {
        throw new Error(
          "This certificate ID already exists on the blockchain. Use a unique Certificate ID."
        );
      }

      showMessage("info", "Confirm the blockchain transaction in MetaMask.");

      const tx = await contract.issueCertificateWithHash(
        form.cert_id.trim(),
        form.student_name.trim(),
        form.degree_program.trim(),
        pdfHash
      );

      showMessage("info", "Transaction sent. Waiting for confirmation...");

      await tx.wait();

      showMessage("info", "Blockchain confirmed. Saving database record...");

      const formDataToSend = buildCertificateFormData(tx.hash);

      const response = await authFetch("/api/certificates/upload", {
        method: "POST",
        body: formDataToSend,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            `Blockchain transaction succeeded, but database saving failed. Transaction hash: ${tx.hash}`
        );
      }

      showMessage("success", "Certificate issued and saved.");

      resetForm();
      await fetchCertificates();
      return true;
    } catch (error) {
      console.error("Issue certificate error:", error);

      if (error?.code === "ACTION_REJECTED" || error?.code === 4001) {
        showMessage("error", "Transaction was rejected in MetaMask.");
      } else if (error?.reason) {
        showMessage("error", error.reason);
      } else {
        showMessage("error", error.message || "Failed to issue certificate.");
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const openIssuePreview = async () => {
    const validationError = validateForm();

    if (validationError) {
      showMessage("warning", validationError);
      return;
    }

    const walletDetails = await getWalletPreviewDetails();

    setIssuePreview({
      cert_id: form.cert_id.trim(),
      student_id: form.student_id.trim(),
      student_name: form.student_name.trim(),
      student_email: form.student_email.trim() || "Not provided",
      degree_program: form.degree_program.trim(),
      gpa: form.gpa.trim() || "Not provided",
      completion_year: form.completion_year.trim() || "Not provided",
      issue_date: form.issue_date.trim(),
      pdf_file_name: pdfFile?.name || "Not selected",
      pdf_hash: pdfHash,
      walletAddress: walletDetails.walletAddress,
      networkInfo: walletDetails.networkInfo,
    });
  };

  const confirmIssueCertificate = async () => {
    const success = await issueCertificate();

    if (success) {
      setIssuePreview(null);
    }
  };

  const recoverCertificateToDatabase = async () => {
    const validationError = validateForm();

    if (validationError) {
      showMessage("warning", validationError);
      return;
    }

    const finalRecoveryTxHash = recoveryTxHash.trim();

    if (!finalRecoveryTxHash) {
      showMessage("error", "Please enter the successful transaction hash.");
      return;
    }

    const confirmed = window.confirm(
      "This will not issue a new blockchain transaction. Continue?"
    );

    if (!confirmed) return;

    setRecovering(true);

    try {
      showMessage("info", "Recovering certificate to database...");

      const formDataToSend = buildCertificateFormData(finalRecoveryTxHash);

      const response = await authFetch("/api/certificates/recover-upload", {
        method: "POST",
        body: formDataToSend,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Certificate recovery failed.");
      }

      showMessage("success", "Certificate recovered.");

      resetForm();
      await fetchCertificates();
    } catch (error) {
      console.error("Certificate recovery error:", error);
      showMessage("error", error.message || "Failed to recover certificate.");
    } finally {
      setRecovering(false);
    }
  };

  const revokeCertificate = async (certId) => {
    setRevokingCertId(certId);

    try {
      showMessage("info", "Checking admin wallet...");

      const { contract } = await getAdminContractWithSigner();

      if (typeof contract.revokeCertificate !== "function") {
        throw new Error(
          "Your contract ABI does not contain revokeCertificate(). Check contract.js."
        );
      }

      showMessage("info", "Confirm the revocation transaction in MetaMask.");

      const tx = await contract.revokeCertificate(certId);

      showMessage("info", "Transaction sent. Waiting for confirmation...");

      await tx.wait();

      showMessage("info", "Blockchain confirmed. Updating database...");

      const response = await authFetch(`/api/certificates/${certId}/revoke`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          revoke_transaction_hash: tx.hash,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Database revocation update failed.");
      }

      showMessage("success", `Certificate ${certId} revoked.`);

      await fetchCertificates();
      setSelectedRevokeCertificate(null);
    } catch (error) {
      console.error("Revoke certificate error:", error);

      if (error?.code === "ACTION_REJECTED" || error?.code === 4001) {
        showMessage("error", "Revocation transaction was rejected in MetaMask.");
      } else if (error?.reason) {
        showMessage("error", error.reason);
      } else {
        showMessage("error", error.message || "Failed to revoke certificate.");
      }
    } finally {
      setRevokingCertId("");
    }
  };

  const confirmRevokeCertificate = () => {
    if (!selectedRevokeCertificate?.cert_id) {
      showMessage("error", "Certificate ID is missing.");
      return;
    }

    revokeCertificate(selectedRevokeCertificate.cert_id);
  };

  const recentCertificates = useMemo(() => {
    return certificates.slice(0, 6);
  }, [certificates]);

  const activeCount = useMemo(() => {
    return certificates.filter((certificate) => !certificate.revoked).length;
  }, [certificates]);

  const revokedCount = useMemo(() => {
    return certificates.filter((certificate) => certificate.revoked).length;
  }, [certificates]);

  const completedFields = useMemo(() => {
    const requiredValues = [
      form.cert_id,
      form.student_id,
      form.student_name,
      form.degree_program,
      form.issue_date,
      pdfFile ? "pdf" : "",
      pdfHash,
    ];

    return requiredValues.filter((value) => String(value || "").trim()).length;
  }, [form, pdfFile, pdfHash]);

  const completionPercent = Math.round((completedFields / 7) * 100);

  const issueSteps = [
    {
      title: "Certificate Details",
      text: "Student and academic fields are entered.",
      done: Boolean(
        form.cert_id.trim() &&
          form.student_id.trim() &&
          form.student_name.trim() &&
          form.degree_program.trim() &&
          form.issue_date.trim()
      ),
    },
    {
      title: "PDF Fingerprint",
      text: "PDF selected and SHA-256 hash generated.",
      done: Boolean(pdfFile && pdfHash),
    },
    {
      title: "Record Proof",
      text: "The approved wallet confirms the certificate record.",
      done: false,
      active: loading,
    },
    {
      title: "Save Record",
      text: "Certificate file and proof reference are stored.",
      done: false,
      active: recovering,
    },
    {
      title: "Verification Ready",
      text: "The public verifier can validate the certificate record.",
      done: false,
    },
  ];

  const trustChecklist = [
    {
      label: "PDF hash generated",
      done: Boolean(pdfHash),
    },
    {
      label: "Certificate proof confirmed",
      done: false,
      active: loading,
    },
    {
      label: "Certificate record saved",
      done: false,
      active: recovering,
    },
    {
      label: "Public verifier link available",
      done: recentCertificates.length > 0,
    },
  ];

  const headerActions = (
    <>
      <ActionButton
        variant="primary"
        onClick={fetchCertificates}
        disabled={tableLoading || formDisabled}
      >
        <FaRedo />
        Refresh Records
      </ActionButton>

      <ActionButton
        variant="secondary"
        onClick={() => navigate("/admin-certificates")}
      >
        View Registry
        <FaArrowRight />
      </ActionButton>
    </>
  );

  return (
    <AdminPageShell
      title="Issue Credential"
      subtitle="Create an academic certificate record and prepare it for public verification."
      actions={headerActions}
    >
      <style>{`
        .issue-workspace {
          display: grid;
          gap: var(--bc-space-4);
        }

        .issue-wizard-card,
        .issue-secure-card,
        .issue-trust-card {
          padding: var(--bc-space-5);
        }

        .issue-wizard-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: var(--bc-space-3);
        }

        .issue-wizard-step {
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-card);
          background: var(--bc-surface-soft);
          padding: var(--bc-space-3);
          min-height: 122px;
        }

        .issue-wizard-step.done {
          background: var(--bc-success-soft);
          border-color: #a7f3d0;
        }

        .issue-wizard-step.active {
          background: var(--bc-warning-soft);
          border-color: #fde68a;
        }

        .issue-wizard-number {
          width: 30px;
          height: 30px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: var(--bc-primary);
          color: #ffffff;
          font-size: 0.75rem;
          font-weight: 800;
          margin-bottom: var(--bc-space-2);
        }

        .issue-wizard-step.done .issue-wizard-number {
          background: var(--bc-success);
        }

        .issue-wizard-step.active .issue-wizard-number {
          background: var(--bc-warning);
        }

        .issue-wizard-title {
          color: var(--bc-text);
          font-size: 0.88rem;
          font-weight: 800;
          margin-bottom: 0.2rem;
        }

        .issue-wizard-text {
          color: var(--bc-muted);
          font-size: 0.78rem;
          line-height: 1.45;
          margin-bottom: 0;
        }

        .issue-upload-box.issue-upload-premium {
          min-height: 112px;
          background:
            linear-gradient(180deg, rgba(219, 234, 254, 0.5), rgba(238, 242, 247, 0.72));
        }

        .issue-upload-box.issue-upload-premium.has-file {
          border-color: #a7f3d0;
          background: var(--bc-success-soft);
        }

        .issue-blockchain-card {
          background: var(--bc-gradient);
          color: #ffffff;
          border-radius: var(--bc-radius-section);
          padding: var(--bc-space-5);
          box-shadow: var(--bc-shadow-lg);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .issue-blockchain-card .issue-muted {
          color: #dbeafe;
        }

        .issue-chain-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: var(--bc-space-3);
          margin: var(--bc-space-4) 0;
        }

        .issue-chain-item {
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.08);
          border-radius: var(--bc-radius-card);
          padding: var(--bc-space-3);
        }

        .issue-trust-list {
          display: grid;
          gap: var(--bc-space-3);
        }

        .issue-trust-item {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: var(--bc-space-3);
          align-items: flex-start;
          padding: var(--bc-space-3);
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-card);
          background: var(--bc-surface-soft);
        }

        .issue-trust-mark {
          width: 30px;
          height: 30px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: var(--bc-surface);
          border: 1px solid var(--bc-border);
          color: var(--bc-muted);
          font-size: 0.75rem;
          font-weight: 800;
        }

        .issue-trust-item.done .issue-trust-mark {
          background: var(--bc-success-soft);
          color: var(--bc-success);
          border-color: #a7f3d0;
        }

        .issue-trust-item.active .issue-trust-mark {
          background: var(--bc-warning-soft);
          color: var(--bc-warning);
          border-color: #fde68a;
        }

        .issue-security-note {
          border-left: 3px solid var(--bc-cobalt);
          padding-left: var(--bc-space-3);
        }

        .issue-page {
          min-height: 100vh;
          background: #e8edf3;
          padding: 1.25rem 1.25rem 4rem;
        }

        .issue-container {
          max-width: 1180px;
          margin: 0 auto;
        }

        .issue-topbar {
          background: #111827;
          color: #ffffff;
          border-radius: 20px;
          padding: 1.1rem;
          margin: 1rem 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          box-shadow: 0 14px 32px rgba(15, 23, 42, 0.16);
        }

        .issue-label {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          color: #bfdbfe;
          font-size: 0.78rem;
          font-weight: 850;
          margin-bottom: 0.45rem;
        }

        .issue-title {
          font-size: clamp(1.65rem, 3vw, 2.25rem);
          font-weight: 850;
          letter-spacing: 0;
          margin-bottom: 0.25rem;
        }

        .issue-subtitle {
          color: #cbd5e1;
          margin-bottom: 0;
          font-size: 0.92rem;
        }

        .issue-actions {
          display: flex;
          gap: 0.55rem;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .issue-btn {
          min-height: 38px;
          border-radius: 12px;
          border: 1px solid #d8dee8;
          background: #ffffff;
          color: #334155;
          padding: 0.5rem 0.75rem;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          text-decoration: none;
          white-space: nowrap;
        }

        .issue-btn:hover {
          background: #f8fafc;
          color: #111827;
        }

        .issue-btn-dark {
          background: #1f2937;
          color: #ffffff;
          border-color: #1f2937;
        }

        .issue-btn-dark:hover {
          background: #374151;
          color: #ffffff;
        }

        .issue-btn-light {
          background: #ffffff;
          color: #111827;
          border-color: #ffffff;
        }

        .issue-btn-danger {
          color: #dc2626;
          border-color: #fecaca;
        }

        .issue-card {
          background: var(--bc-surface);
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-lg);
          box-shadow: var(--bc-shadow-sm);
        }

        .issue-card-head {
          padding: 1rem;
          border-bottom: 1px solid var(--bc-border);
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          background: var(--bc-surface-soft);
        }

        .issue-section-title {
          color: var(--bc-text);
          font-size: 1.05rem;
          font-weight: 850;
          margin-bottom: 0.15rem;
        }

        .issue-muted {
          color: var(--bc-muted);
        }

        .issue-body {
          padding: 1rem;
        }

        .issue-form-label {
          display: block;
          font-weight: 800;
          color: var(--bc-text-soft);
          font-size: 0.82rem;
          margin-bottom: 0.4rem;
        }

        .issue-input {
          width: 100%;
          height: 42px;
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-md);
          padding: 0 0.8rem;
          outline: none;
          background: #ffffff;
          color: var(--bc-text);
          font-weight: 650;
        }

        .issue-input:focus {
          border-color: var(--bc-accent);
          box-shadow: var(--bc-focus);
        }

        .issue-upload-box {
          min-height: 80px;
          border: 1px dashed var(--bc-border-strong);
          border-radius: var(--bc-radius-md);
          background: var(--bc-surface-soft);
          padding: 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.85rem;
          cursor: pointer;
        }

        .issue-upload-icon {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: var(--bc-primary);
          color: #ffffff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .issue-hash {
          background: var(--bc-success-soft);
          border: 1px solid #a7f3d0;
          border-radius: var(--bc-radius-md);
          padding: 0.85rem;
        }

        .issue-side-dark {
          background: linear-gradient(135deg, var(--bc-primary), #172554 70%, var(--bc-accent));
          color: #ffffff;
          border-radius: var(--bc-radius-xl);
          padding: 1rem;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
        }

        .issue-side-dark .issue-muted {
          color: #cbd5e1;
        }

        .issue-mini-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .issue-mini {
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          padding: 0.8rem;
        }

        .issue-step-list {
          display: grid;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .issue-step {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 0.75rem;
          padding: 0.8rem;
          border-radius: var(--bc-radius-md);
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.07);
        }

        .issue-step-mark {
          width: 30px;
          height: 30px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.12);
          color: #dbeafe;
          font-size: 0.78rem;
          font-weight: 900;
          flex-shrink: 0;
        }

        .issue-step.done .issue-step-mark {
          background: var(--bc-success-soft);
          color: var(--bc-success-strong);
        }

        .issue-step.active .issue-step-mark {
          background: var(--bc-warning-soft);
          color: var(--bc-warning-strong);
        }

        .issue-step-title {
          color: #ffffff;
          font-size: 0.9rem;
          font-weight: 850;
          margin-bottom: 0.15rem;
        }

        .issue-step-text {
          color: #cbd5e1;
          font-size: 0.78rem;
          margin-bottom: 0;
        }

        .issue-status {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          border-radius: 999px;
          padding: 0.32rem 0.58rem;
          font-size: 0.72rem;
          font-weight: 850;
        }

        .issue-status-active {
          background: #ecfdf5;
          color: #059669;
          border: 1px solid #bbf7d0;
        }

        .issue-status-revoked {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .issue-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          min-width: 860px;
        }

        .issue-table th {
          position: sticky;
          top: 0;
          z-index: 2;
          background: var(--bc-surface-soft);
          color: var(--bc-text-soft);
          font-size: 0.72rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          font-weight: 850;
          padding: 0.8rem;
          border-bottom: 1px solid var(--bc-border);
        }

        .issue-table td {
          padding: 0.8rem;
          border-bottom: 1px solid var(--bc-border);
          color: var(--bc-text-soft);
          font-size: 0.86rem;
          vertical-align: middle;
        }

        .issue-table tbody tr:hover td {
          background: rgba(29, 78, 216, 0.035);
        }

        .issue-empty {
          padding: 3rem 1rem;
          text-align: center;
        }

        .issue-preview-grid {
          display: grid;
          gap: 0.75rem;
          min-width: 0;
        }

        .issue-preview-row {
          display: grid;
          grid-template-columns: minmax(120px, 0.45fr) minmax(0, 1fr);
          gap: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--bc-border);
          min-width: 0;
        }

        .issue-preview-row:last-child {
          border-bottom: 0;
          padding-bottom: 0;
        }

        .issue-preview-label {
          color: var(--bc-muted);
          font-size: 0.78rem;
          font-weight: 900;
          text-transform: uppercase;
        }

        .issue-preview-value {
          color: var(--bc-text);
          font-weight: 850;
          text-align: right;
          overflow-wrap: anywhere;
          word-break: break-word;
          min-width: 0;
        }

        .issue-preview-hash {
          font-family: var(--bc-font-mono);
          font-size: 0.78rem;
          line-height: 1.55;
          word-break: break-all;
        }

        .issue-preview-warning {
          display: flex;
          align-items: flex-start;
          gap: 0.65rem;
          margin-top: 0.85rem;
          padding: 0.85rem;
          border: 1px solid #fde68a;
          border-radius: var(--bc-radius-md);
          background: var(--bc-warning-soft);
          color: var(--bc-warning-strong);
        }

        @media(max-width: 768px) {
          .issue-page {
            padding: 1rem 1rem 3.5rem;
          }

          .issue-topbar,
          .issue-card-head {
            flex-direction: column;
            align-items: flex-start;
          }

          .issue-actions,
          .issue-btn {
            width: 100%;
          }

          .issue-mini-grid {
            grid-template-columns: 1fr;
          }

          .issue-wizard-grid,
          .issue-chain-grid {
            grid-template-columns: 1fr;
          }

          .issue-preview-row {
            grid-template-columns: 1fr;
            gap: 0.25rem;
          }

          .issue-preview-value {
            text-align: left;
          }
        }
      `}</style>

          {message.text && (
            <AlertMessage type={message.type} message={message.text} />
          )}

          <Card className="issue-wizard-card mb-3">
            <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-3">
              <div>
                <p className="bc-muted small fw-bold mb-1">
                  Issue checklist
                </p>
                <h2 className="h4 fw-bold mb-1">Certificate workflow</h2>
                <p className="bc-muted mb-0">
                  Complete each checkpoint before this credential becomes
                  available to students and verifiers.
                </p>
              </div>

              <StatusBadge
                status={`${completionPercent}% complete`}
                type={completionPercent === 100 ? "valid" : "pending"}
              />
            </div>

            <div className="issue-wizard-grid">
              {issueSteps.map((step, index) => (
                <div
                  className={`issue-wizard-step ${step.done ? "done" : ""} ${
                    step.active ? "active" : ""
                  }`}
                  key={step.title}
                >
                  <span className="issue-wizard-number">
                    {step.done ? "OK" : index + 1}
                  </span>
                  <p className="issue-wizard-title">{step.title}</p>
                  <p className="issue-wizard-text">{step.text}</p>
                </div>
              ))}
            </div>
          </Card>

          <section className="row g-3">
            <div className="col-xl-8">
              <Card>
                <div className="issue-card-head">
                  <div>
                    <h2 className="issue-section-title">Certificate Details</h2>
                    <p className="issue-muted small mb-0">
                      Required fields are certificate ID, student ID, name,
                      program, issue date, and PDF.
                    </p>
                  </div>

                  <ActionButton
                    onClick={resetForm}
                    variant="ghost"
                    disabled={formDisabled}
                  >
                    Clear
                  </ActionButton>
                </div>

                <div className="issue-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="issue-form-label">Certificate ID</label>
                      <input
                        className="issue-input"
                        placeholder="e.g. CT23A141"
                        value={form.cert_id}
                        onChange={(event) =>
                          updateField("cert_id", event.target.value)
                        }
                        disabled={formDisabled}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="issue-form-label">Student ID</label>
                      <input
                        className="issue-input"
                        placeholder="e.g. UB-STU-001"
                        value={form.student_id}
                        onChange={(event) =>
                          updateField("student_id", event.target.value)
                        }
                        disabled={formDisabled}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="issue-form-label">Student name</label>
                      <input
                        className="issue-input"
                        placeholder="Student full name"
                        value={form.student_name}
                        onChange={(event) =>
                          updateField("student_name", event.target.value)
                        }
                        disabled={formDisabled}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="issue-form-label">Student email</label>
                      <input
                        type="email"
                        className="issue-input"
                        placeholder="student@example.com"
                        value={form.student_email}
                        onChange={(event) =>
                          updateField("student_email", event.target.value)
                        }
                        disabled={formDisabled}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="issue-form-label">Degree program</label>
                      <input
                        className="issue-input"
                        placeholder="e.g. B.Tech Computer Engineering"
                        value={form.degree_program}
                        onChange={(event) =>
                          updateField("degree_program", event.target.value)
                        }
                        disabled={formDisabled}
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="issue-form-label">GPA</label>
                      <input
                        className="issue-input"
                        placeholder="3.65"
                        value={form.gpa}
                        onChange={(event) =>
                          updateField("gpa", event.target.value)
                        }
                        disabled={formDisabled}
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="issue-form-label">Year</label>
                      <input
                        className="issue-input"
                        placeholder="2026"
                        value={form.completion_year}
                        onChange={(event) =>
                          updateField("completion_year", event.target.value)
                        }
                        disabled={formDisabled}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="issue-form-label">Issue date</label>
                      <input
                        type="date"
                        className="issue-input"
                        value={form.issue_date}
                        onChange={(event) =>
                          updateField("issue_date", event.target.value)
                        }
                        disabled={formDisabled}
                      />
                    </div>

                  </div>
                </div>
              </Card>

              <Card className="mt-3 overflow-hidden">
                <div className="issue-card-head">
                  <div className="d-flex align-items-start gap-3">
                    <FaFilePdf className="text-primary mt-1" />

                    <div>
                      <h2 className="issue-section-title">
                        Certificate document
                      </h2>
                      <p className="issue-muted small mb-0">
                        Upload the final certificate PDF. BlockCred will create
                        a tamper-evident fingerprint for verification.
                      </p>
                    </div>
                  </div>

                  <StatusBadge
                    status={pdfHash ? "Hash ready" : "Pending"}
                    type={pdfHash ? "valid" : "pending"}
                  />
                </div>

                <div className="issue-body">
                  <input
                    ref={pdfInputRef}
                    id="certificate-pdf"
                    type="file"
                    accept="application/pdf"
                    className="d-none"
                    onChange={(event) =>
                      handlePdfChange(event.target.files?.[0])
                    }
                    disabled={formDisabled}
                  />

                  <label
                    htmlFor="certificate-pdf"
                    className={`issue-upload-box issue-upload-premium mb-3 ${
                      pdfFile ? "has-file" : ""
                    }`}
                    style={{
                      cursor: formDisabled ? "not-allowed" : "pointer",
                    }}
                  >
                    <span className="issue-upload-icon">
                      <FaUpload />
                    </span>

                    <span>
                      <span className="fw-bold d-block">
                        {pdfFile ? pdfFile.name : "Choose certificate PDF"}
                      </span>

                      <span className="issue-muted small">
                        {pdfFile
                          ? `${(pdfFile.size / 1024 / 1024).toFixed(2)} MB`
                          : "Upload the final certificate document in PDF format."}
                      </span>
                    </span>
                  </label>

                  <div className="issue-hash">
                    <div className="d-flex align-items-start gap-3">
                      <FaFingerprint className="text-success mt-1" />

                      <div className="min-w-0">
                        <p className="text-success fw-bold mb-1">
                          {pdfHash ? "PDF hash ready" : "Waiting for PDF hash"}
                        </p>

                        <p className="bc-mono small text-break mb-0">
                          {pdfHash ||
                            "Select a valid PDF to generate its SHA-256 fingerprint."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <section className="issue-blockchain-card mt-3">
                <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
                    <div>
                      <p className="issue-muted small fw-bold mb-1">
                      Final issuing action
                    </p>
                    <h2 className="h4 fw-bold mb-2">Confirm and issue</h2>
                    <p className="issue-muted mb-0">
                      Review the record, then sign with the approved admin
                      wallet to publish the certificate proof.
                    </p>
                  </div>

                  <span className="issue-wizard-number">
                    <FaEthereum />
                  </span>
                </div>

                <div className="issue-chain-grid">
                  <div className="issue-chain-item">
                    <p className="issue-muted small mb-1">Wallet</p>
                    <strong>Admin signer required</strong>
                  </div>

                  <div className="issue-chain-item">
                    <p className="issue-muted small mb-1">Network</p>
                    <strong>Ethereum Sepolia</strong>
                  </div>

                  <div className="issue-chain-item">
                    <p className="issue-muted small mb-1">Action</p>
                    <strong>Issue credential</strong>
                  </div>

                  <div className="issue-chain-item">
                    <p className="issue-muted small mb-1">Transaction status</p>
                    <strong>{loading ? "Waiting for confirmation" : "Ready"}</strong>
                  </div>
                </div>

                <ActionButton
                  onClick={openIssuePreview}
                  disabled={formDisabled}
                  variant="secondary"
                  className="w-100"
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Issue Certificate
                      <FaArrowRight />
                    </>
                  )}
                </ActionButton>
              </section>

              <Card className="mt-3">
                <div className="issue-card-head">
                  <div className="d-flex align-items-start gap-3">
                    <FaExclamationTriangle className="text-warning mt-1" />

                    <div>
                      <h2 className="issue-section-title">
                        Recover saved record
                      </h2>

                      <p className="issue-muted small mb-0">
                        If signing succeeded but saving was interrupted, recover
                        the certificate record here.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="issue-body">
                  <label className="issue-form-label">
                    Successful transaction hash
                  </label>

                  <div className="d-flex flex-column flex-md-row gap-2">
                    <input
                      type="text"
                      className="issue-input"
                      placeholder="0x..."
                      value={recoveryTxHash}
                      onChange={(event) =>
                        setRecoveryTxHash(event.target.value)
                      }
                      disabled={recovering || loading}
                    />

                    <ActionButton
                      onClick={recoverCertificateToDatabase}
                      variant="ghost"
                      disabled={recovering || loading}
                    >
                      {recovering ? "Recovering..." : "Recover"}
                    </ActionButton>
                  </div>
                </div>
              </Card>
            </div>

            <div className="col-xl-4">
              <div className="issue-side-dark mb-3">
                <h2 className="issue-section-title text-white">Readiness</h2>

                <p className="issue-muted small mb-3">
                  Complete the form before issuing.
                </p>

                <div className="d-flex justify-content-between mb-2">
                  <span className="issue-muted">Progress</span>
                  <strong>{completionPercent}%</strong>
                </div>

                <div className="progress rounded-pill" style={{ height: 9 }}>
                  <div
                    className="progress-bar bg-success"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>

                <div className="issue-mini-grid">
                  <div className="issue-mini">
                    <p className="issue-muted small mb-1">Active</p>
                    <h3 className="h5 fw-bold mb-0">{activeCount}</h3>
                  </div>

                  <div className="issue-mini">
                    <p className="issue-muted small mb-1">Revoked</p>
                    <h3 className="h5 fw-bold mb-0">{revokedCount}</h3>
                  </div>
                </div>

                <div className="issue-step-list">
                  {issueSteps.map((step, index) => (
                    <div
                      className={`issue-step ${step.done ? "done" : ""} ${
                        step.active ? "active" : ""
                      }`}
                      key={step.title}
                    >
                      <span className="issue-step-mark">
                        {step.done ? "OK" : index + 1}
                      </span>

                      <span>
                        <p className="issue-step-title">{step.title}</p>
                        <p className="issue-step-text">{step.text}</p>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Card className="issue-trust-card">
                <div className="d-flex gap-3 align-items-start mb-3">
                  <FaShieldAlt className="text-primary mt-1" />

                  <div>
                    <h2 className="issue-section-title">Issue controls</h2>
                    <p className="issue-muted small mb-0">
                      Issuing and revoking should only be completed by an
                      approved institution administrator.
                    </p>
                  </div>
                </div>

                <div className="issue-trust-list mb-4">
                  {trustChecklist.map((item) => (
                    <div
                      className={`issue-trust-item ${item.done ? "done" : ""} ${
                        item.active ? "active" : ""
                      }`}
                      key={item.label}
                    >
                      <span className="issue-trust-mark">
                        {item.done ? "OK" : item.active ? "..." : "!"}
                      </span>
                      <span>
                        <strong className="d-block">{item.label}</strong>
                        <span className="issue-muted small">
                          {item.done
                            ? "Complete"
                            : item.active
                            ? "In progress"
                            : "Pending"}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>

                <div className="issue-security-note mb-3">
                  <p className="fw-bold mb-1">Before you issue</p>
                  <p className="issue-muted small mb-2">
                    Never issue without checking student details.
                  </p>
                  <p className="issue-muted small mb-2">
                    Only an approved admin wallet should sign certificate
                    records.
                  </p>
                  <p className="issue-muted small mb-0">
                    Revocation should be treated as permanent.
                  </p>
                </div>

                <ActionButton
                  onClick={() => navigate("/admin-certificates")}
                  variant="ghost"
                  className="w-100"
                >
                  Manage certificates
                </ActionButton>
              </Card>
            </div>
          </section>

          <Card className="overflow-hidden mt-3">
            <div className="issue-card-head">
              <div>
                <h2 className="issue-section-title">Recent certificates</h2>
                <p className="issue-muted small mb-0">
                  Latest records in the system.
                </p>
              </div>

              <ActionButton
                onClick={() => navigate("/admin-certificates")}
                variant="ghost"
              >
                View all
              </ActionButton>
            </div>

            {tableLoading ? (
              <div className="issue-empty">
                <div className="spinner-border text-primary mb-3" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>

                <p className="issue-muted mb-0">Loading records...</p>
              </div>
            ) : recentCertificates.length === 0 ? (
              <div className="issue-empty">
                <EmptyState
                  title="No certificates issued yet"
                  message="Issued certificates will appear here after blockchain confirmation and database upload."
                />
              </div>
            ) : (
              <div className="table-responsive">
                <table className="issue-table">
                  <thead>
                    <tr>
                      <th>Certificate</th>
                      <th>Student</th>
                      <th>Program</th>
                      <th>Status</th>
                      <th>PDF</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentCertificates.map((certificate) => (
                      <tr key={certificate.cert_id}>
                        <td>
                          <div className="fw-bold text-dark font-monospace">
                            {certificate.cert_id}
                          </div>

                          <small className="issue-muted">
                            {certificate.issue_date || "No date"}
                          </small>
                        </td>

                        <td>
                          <div className="fw-bold text-dark">
                            {certificate.student_name || "N/A"}
                          </div>

                          <small className="issue-muted">
                            {certificate.student_id || "No student ID"}
                          </small>
                        </td>

                        <td>
                          <div className="fw-semibold text-dark">
                            {certificate.degree_program ||
                              certificate.degree ||
                              "N/A"}
                          </div>

                          <small className="issue-muted">
                            {certificate.completion_year || "No year"}
                          </small>
                        </td>

                        <td>
                          <StatusBadge
                            status={certificate.revoked ? "Revoked" : "Active"}
                            type={certificate.revoked ? "revoked" : "active"}
                          />
                        </td>

                        <td>
                          {certificate.pdf_url ? (
                            <a
                              href={certificate.pdf_url}
                              target="_blank"
                              rel="noreferrer"
                              className="issue-btn"
                            >
                              PDF
                              <FaExternalLinkAlt />
                            </a>
                          ) : (
                            <span className="issue-muted small">No PDF</span>
                          )}
                        </td>

                        <td>
                          {certificate.revoked ? (
                            <span className="issue-muted small">No action</span>
                          ) : (
                            <ActionButton
                              onClick={() =>
                                setSelectedRevokeCertificate(certificate)
                              }
                              variant="danger"
                              disabled={
                                loading ||
                                recovering ||
                                revokingCertId === certificate.cert_id
                              }
                            >
                              {revokingCertId === certificate.cert_id
                                ? "Revoking..."
                                : "Revoke"}
                            </ActionButton>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <ConfirmModal
            open={Boolean(issuePreview)}
            title="Review Certificate Before Issuing"
            message="Please confirm the certificate details before signing this record."
            confirmText="Confirm and Sign with MetaMask"
            cancelText="Cancel"
            variant="primary"
            loading={loading}
            onConfirm={confirmIssueCertificate}
            onCancel={() => setIssuePreview(null)}
          >
            <div className="issue-preview-grid">
              <div className="issue-preview-row">
                <span className="issue-preview-label">Certificate ID</span>
                <span className="issue-preview-value">
                  {issuePreview?.cert_id || "N/A"}
                </span>
              </div>

              <div className="issue-preview-row">
                <span className="issue-preview-label">Student ID</span>
                <span className="issue-preview-value">
                  {issuePreview?.student_id || "N/A"}
                </span>
              </div>

              <div className="issue-preview-row">
                <span className="issue-preview-label">Student name</span>
                <span className="issue-preview-value">
                  {issuePreview?.student_name || "N/A"}
                </span>
              </div>

              <div className="issue-preview-row">
                <span className="issue-preview-label">Student email</span>
                <span className="issue-preview-value">
                  {issuePreview?.student_email || "Not provided"}
                </span>
              </div>

              <div className="issue-preview-row">
                <span className="issue-preview-label">Programme/Degree</span>
                <span className="issue-preview-value">
                  {issuePreview?.degree_program || "N/A"}
                </span>
              </div>

              <div className="issue-preview-row">
                <span className="issue-preview-label">GPA</span>
                <span className="issue-preview-value">
                  {issuePreview?.gpa || "Not provided"}
                </span>
              </div>

              <div className="issue-preview-row">
                <span className="issue-preview-label">Completion year</span>
                <span className="issue-preview-value">
                  {issuePreview?.completion_year || "Not provided"}
                </span>
              </div>

              <div className="issue-preview-row">
                <span className="issue-preview-label">Issue date</span>
                <span className="issue-preview-value">
                  {issuePreview?.issue_date || "N/A"}
                </span>
              </div>

              <div className="issue-preview-row">
                <span className="issue-preview-label">PDF file</span>
                <span className="issue-preview-value">
                  {issuePreview?.pdf_file_name || "Not selected"}
                </span>
              </div>

              <div className="issue-preview-row">
                <span className="issue-preview-label">PDF SHA-256 hash</span>
                <span className="issue-preview-value issue-preview-hash">
                  {issuePreview?.pdf_hash || "N/A"}
                </span>
              </div>

              <div className="issue-preview-row">
                <span className="issue-preview-label">Wallet</span>
                <span className="issue-preview-value issue-preview-hash">
                  {issuePreview?.walletAddress || "Not available"}
                </span>
              </div>

              <div className="issue-preview-row">
                <span className="issue-preview-label">Network</span>
                <span className="issue-preview-value">
                  {issuePreview?.networkInfo || "Not available"}
                </span>
              </div>
            </div>

            <div className="issue-preview-warning">
              <FaExclamationTriangle className="mt-1" />
              <p className="mb-0 small fw-semibold">
                Please verify these details carefully. Once the certificate hash
                is signed, corrections may require revocation and re-issuance.
              </p>
            </div>
          </ConfirmModal>

          <ConfirmModal
            open={Boolean(selectedRevokeCertificate)}
            title="Confirm Certificate Revocation"
            message="You are about to mark this certificate as invalid across public verification."
            confirmText="Revoke Certificate"
            cancelText="Cancel"
            variant="danger"
            loading={Boolean(revokingCertId)}
            onConfirm={confirmRevokeCertificate}
            onCancel={() => setSelectedRevokeCertificate(null)}
          >
            <div className="d-grid gap-2">
              <div className="d-flex justify-content-between gap-3">
                <span className="text-muted">Certificate ID</span>
                <strong className="font-monospace text-end">
                  {selectedRevokeCertificate?.cert_id || "N/A"}
                </strong>
              </div>
              <div className="d-flex justify-content-between gap-3">
                <span className="text-muted">Student</span>
                <strong className="text-end">
                  {selectedRevokeCertificate?.student_name || "N/A"}
                </strong>
              </div>
              <div className="d-flex justify-content-between gap-3">
                <span className="text-muted">Programme/Degree</span>
                <strong className="text-end">
                  {selectedRevokeCertificate?.degree_program ||
                    selectedRevokeCertificate?.degree ||
                    "N/A"}
                </strong>
              </div>
              <div className="d-flex justify-content-between gap-3">
                <span className="text-muted">Current status</span>
                <StatusBadge
                  status={
                    selectedRevokeCertificate?.revoked ? "revoked" : "active"
                  }
                />
              </div>
              <p className="text-danger small fw-semibold mb-0 mt-2">
                Revoke carefully. Public verification will show this credential
                as invalid after confirmation.
              </p>
            </div>
          </ConfirmModal>
    </AdminPageShell>
  );
};

export default AdminCertificate;
