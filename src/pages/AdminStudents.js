// src/pages/AdminStudents.js

import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  FaArrowRight,
  FaCheckCircle,
  FaDownload,
  FaEdit,
  FaEnvelope,
  FaFileExcel,
  FaIdCard,
  FaPlus,
  FaRedo,
  FaSearch,
  FaTrashAlt,
  FaUpload,
  FaUserCheck,
  FaUserGraduate,
  FaUserTimes,
  FaUsers,
} from "react-icons/fa";
import { authFetch } from "../api.js";
import AdminPageShell from "../components/layout/AdminPageShell.js";
import ActionButton from "../components/ui/ActionButton.js";
import AlertMessage from "../components/ui/AlertMessage.js";
import Card from "../components/ui/Card.js";
import EmptyState from "../components/ui/EmptyState.js";
import PaginationControls from "../components/ui/PaginationControls.js";
import StatCard from "../components/ui/StatCard.js";
import StatusBadge from "../components/ui/StatusBadge.js";
import { downloadCsv, formatDateForCsv } from "../utils/exportCsv.js";

const emptyForm = {
  student_id: "",
  name: "",
  email: "",
  subscription_status: "inactive",
};

const allowedSubscriptionStatuses = ["inactive", "pending", "active"];

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingStudent, setEditingStudent] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [studentPage, setStudentPage] = useState(1);
  const [studentPageSize, setStudentPageSize] = useState(10);

  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);

  const [bulkRows, setBulkRows] = useState([]);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  const bulkInputRef = useRef(null);

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setStudentPage(1);
  }, [search, statusFilter]);

  const showMessage = (type, text) => {
    setMessage({ type, text });

    setTimeout(() => {
      setMessage({ type: "", text: "" });
    }, 6000);
  };

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingStudent(null);
  };

  const fetchStudents = async () => {
    setTableLoading(true);

    try {
      const response = await authFetch("/api/students");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch students.");
      }

      if (Array.isArray(data)) {
        setStudents(data);
      } else if (Array.isArray(data.data)) {
        setStudents(data.data);
      } else if (Array.isArray(data.students)) {
        setStudents(data.students);
      } else {
        setStudents([]);
      }
    } catch (error) {
      console.error("Fetch students error:", error);
      showMessage("error", error.message || "Could not fetch students.");
      setStudents([]);
    } finally {
      setTableLoading(false);
    }
  };

  const validateForm = () => {
    if (!form.student_id.trim()) return "Student ID is required.";
    if (!form.name.trim()) return "Student name is required.";
    if (!form.email.trim()) return "Student email is required.";
    if (!form.email.includes("@")) return "Please enter a valid email.";

    return "";
  };

  const getStudentRecordIdentifier = (student) =>
    String(student?.id || student?.student_id || "").trim();

  const saveStudent = async (event) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      showMessage("warning", validationError);
      return;
    }

    setLoading(true);

    try {
      const editingIdentifier = getStudentRecordIdentifier(editingStudent);

      if (editingStudent && !editingIdentifier) {
        throw new Error(
          "Cannot update this student because the record identifier is missing."
        );
      }

      const url = editingStudent
        ? `/api/students/${encodeURIComponent(editingIdentifier)}`
        : "/api/students";

      const method = editingStudent ? "PATCH" : "POST";

      const response = await authFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          student_id: form.student_id.trim(),
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          subscription_status: form.subscription_status,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to save student.");
      }

      showMessage(
        "success",
        editingStudent ? "Student updated." : "Student added."
      );

      resetForm();
      await fetchStudents();
    } catch (error) {
      console.error("Save student error:", error);
      showMessage("error", error.message || "Could not save student.");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (student) => {
    const identifier = getStudentRecordIdentifier(student);

    if (!identifier) {
      showMessage(
        "error",
        "Cannot edit this student because the record identifier is missing."
      );
      return;
    }

    setEditingStudent(student);

    setForm({
      student_id: student.student_id || "",
      name: student.name || "",
      email: student.email || "",
      subscription_status: student.subscription_status || "inactive",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const deleteStudent = async (student) => {
    const identifier = getStudentRecordIdentifier(student);

    if (!identifier) {
      showMessage(
        "error",
        "Cannot delete this student because the record identifier is missing."
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${student.name || "this student"}?`
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const response = await authFetch(
        `/api/students/${encodeURIComponent(identifier)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete student.");
      }

      showMessage("success", "Student deleted.");

      if (getStudentRecordIdentifier(editingStudent) === identifier) {
        resetForm();
      }

      await fetchStudents();
    } catch (error) {
      console.error("Delete student error:", error);
      showMessage("error", error.message || "Could not delete student.");
    } finally {
      setLoading(false);
    }
  };

  const normalizeBulkRow = (row, index) => {
    const rawStudentId =
      row.student_id ||
      row.Student_ID ||
      row["Student ID"] ||
      row["student id"] ||
      row.matricule ||
      row.Matricule ||
      "";

    const rawName =
      row.name ||
      row.Name ||
      row["Student Name"] ||
      row["student name"] ||
      row.full_name ||
      row["Full Name"] ||
      "";

    const rawEmail =
      row.email ||
      row.Email ||
      row["Student Email"] ||
      row["student email"] ||
      "";

    const rawStatus =
      row.subscription_status ||
      row["Subscription Status"] ||
      row.status ||
      row.Status ||
      "inactive";

    const subscriptionStatus = String(rawStatus || "inactive")
      .trim()
      .toLowerCase();

    return {
      rowNumber: index + 2,
      student_id: String(rawStudentId || "").trim(),
      name: String(rawName || "").trim(),
      email: String(rawEmail || "").trim().toLowerCase(),
      subscription_status: allowedSubscriptionStatuses.includes(
        subscriptionStatus
      )
        ? subscriptionStatus
        : "inactive",
      error: "",
    };
  };

  const validateBulkRows = (rows) => {
    const seenStudentIds = new Set();
    const seenEmails = new Set();

    return rows.map((row) => {
      let error = "";

      if (!row.student_id) {
        error = "Missing student ID.";
      } else if (!row.name) {
        error = "Missing student name.";
      } else if (!row.email) {
        error = "Missing email.";
      } else if (!row.email.includes("@")) {
        error = "Invalid email.";
      } else if (seenStudentIds.has(row.student_id.toLowerCase())) {
        error = "Duplicate student ID in file.";
      } else if (seenEmails.has(row.email.toLowerCase())) {
        error = "Duplicate email in file.";
      }

      seenStudentIds.add(row.student_id.toLowerCase());
      seenEmails.add(row.email.toLowerCase());

      return {
        ...row,
        error,
      };
    });
  };

  const handleBulkFileChange = async (file) => {
    setBulkRows([]);
    setBulkResult(null);

    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!["xlsx", "xls", "csv"].includes(extension)) {
      showMessage("warning", "Please upload an Excel or CSV file.");
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        throw new Error("The uploaded file does not contain any sheet.");
      }

      const sheet = workbook.Sheets[firstSheetName];

      const jsonRows = XLSX.utils.sheet_to_json(sheet, {
        defval: "",
      });

      if (jsonRows.length === 0) {
        throw new Error("The uploaded file is empty.");
      }

      const normalizedRows = jsonRows.map(normalizeBulkRow);
      const validatedRows = validateBulkRows(normalizedRows);

      setBulkRows(validatedRows);

      const validCount = validatedRows.filter((row) => !row.error).length;
      const invalidCount = validatedRows.length - validCount;

      showMessage(
        invalidCount > 0 ? "warning" : "success",
        `${validatedRows.length} row(s) loaded. ${validCount} valid, ${invalidCount} need review.`
      );
    } catch (error) {
      console.error("Bulk file parse error:", error);
      showMessage("error", error.message || "Could not read the uploaded file.");
    } finally {
      if (bulkInputRef.current) {
        bulkInputRef.current.value = "";
      }
    }
  };

  const importBulkStudents = async () => {
    const validRows = bulkRows.filter((row) => !row.error);

    if (validRows.length === 0) {
      showMessage("warning", "No valid student records to import.");
      return;
    }

    const confirmed = window.confirm(
      `Import ${validRows.length} student record(s)?`
    );

    if (!confirmed) return;

    setBulkImporting(true);

    const summary = {
      success: 0,
      failed: 0,
      errors: [],
    };

    try {
      for (const row of validRows) {
        try {
          const response = await authFetch("/api/students", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              student_id: row.student_id,
              name: row.name,
              email: row.email,
              subscription_status: row.subscription_status,
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.message || "Failed to add student.");
          }

          summary.success += 1;
        } catch (error) {
          summary.failed += 1;
          summary.errors.push({
            rowNumber: row.rowNumber,
            student_id: row.student_id,
            email: row.email,
            message: error.message || "Import failed.",
          });
        }
      }

      setBulkResult(summary);

      if (summary.failed > 0) {
        showMessage(
          "warning",
          `${summary.success} imported. ${summary.failed} failed.`
        );
      } else {
        showMessage("success", `${summary.success} student record(s) imported.`);
      }

      await fetchStudents();
    } catch (error) {
      console.error("Bulk import error:", error);
      showMessage("error", error.message || "Bulk import failed.");
    } finally {
      setBulkImporting(false);
    }
  };

  const downloadTemplate = () => {
    const worksheet = XLSX.utils.json_to_sheet([
      {
        student_id: "CT23A001",
        name: "Jane Doe",
        email: "jane.doe@example.com",
        subscription_status: "inactive",
      },
      {
        student_id: "CT23A002",
        name: "John Smith",
        email: "john.smith@example.com",
        subscription_status: "active",
      },
    ]);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

    XLSX.writeFile(workbook, "blockcred_students_template.xlsx");
  };

  const clearBulkRows = () => {
    setBulkRows([]);
    setBulkResult(null);

    if (bulkInputRef.current) {
      bulkInputRef.current.value = "";
    }
  };

  const filteredStudents = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        !keyword ||
        String(student.student_id || "").toLowerCase().includes(keyword) ||
        String(student.name || "").toLowerCase().includes(keyword) ||
        String(student.email || "").toLowerCase().includes(keyword) ||
        String(student.subscription_status || "")
          .toLowerCase()
          .includes(keyword);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "linked" && Boolean(student.firebase_uid)) ||
        (statusFilter === "unlinked" && !student.firebase_uid) ||
        (statusFilter === "active" &&
          student.subscription_status === "active") ||
        (statusFilter === "pending" &&
          student.subscription_status === "pending") ||
        (statusFilter === "inactive" &&
          (student.subscription_status || "inactive") === "inactive");

      return matchesSearch && matchesStatus;
    });
  }, [students, search, statusFilter]);

  const paginatedStudents = useMemo(() => {
    const start = (studentPage - 1) * studentPageSize;
    return filteredStudents.slice(start, start + studentPageSize);
  }, [filteredStudents, studentPage, studentPageSize]);

  useEffect(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(filteredStudents.length / studentPageSize)
    );

    if (studentPage > totalPages) {
      setStudentPage(totalPages);
    }
  }, [filteredStudents.length, studentPage, studentPageSize]);

  const exportStudentsCsv = () => {
    downloadCsv("blockcred-students.csv", filteredStudents, [
      { header: "Student ID", key: "student_id" },
      { header: "Full Name", key: "name" },
      { header: "Email", key: "email" },
      { header: "Access Status", key: "subscription_status" },
      {
        header: "Account Linked",
        value: (student) => Boolean(student.firebase_uid),
      },
      { header: "Account UID", key: "firebase_uid" },
      {
        header: "Created At",
        value: (student) =>
          formatDateForCsv(
            student.created_at || student.createdAt || student.created
          ),
      },
    ]);

    showMessage(
      "success",
      `Exported ${filteredStudents.length} filtered student record(s).`
    );
  };

  const stats = useMemo(() => {
    const linked = students.filter((student) =>
      Boolean(student.firebase_uid)
    ).length;

    const unlinked = students.filter((student) => !student.firebase_uid).length;

    const active = students.filter(
      (student) => student.subscription_status === "active"
    ).length;

    const pending = students.filter(
      (student) => student.subscription_status === "pending"
    ).length;

    const inactive = students.filter(
      (student) => (student.subscription_status || "inactive") === "inactive"
    ).length;

    return {
      total: students.length,
      linked,
      unlinked,
      active,
      pending,
      inactive,
    };
  }, [students]);

  const linkedRate = useMemo(() => {
    if (!stats.total) return 0;
    return Math.round((stats.linked / stats.total) * 100);
  }, [stats]);

  const activeAccessRate = useMemo(() => {
    if (!stats.total) return 0;
    return Math.round((stats.active / stats.total) * 100);
  }, [stats]);

  const validBulkCount = bulkRows.filter((row) => !row.error).length;
  const invalidBulkCount = bulkRows.length - validBulkCount;

  const statCards = [
    {
      key: "all",
      label: "Total students",
      value: stats.total,
      helper: "Approved records",
      icon: <FaUsers />,
    },
    {
      key: "active",
      label: "Active access",
      value: stats.active,
      helper: "Certificate access enabled",
      icon: <FaCheckCircle />,
    },
    {
      key: "pending",
      label: "Pending access",
      value: stats.pending,
      helper: "Access setup pending",
      icon: <FaUserGraduate />,
    },
    {
      key: "inactive",
      label: "Inactive access",
      value: stats.inactive,
      helper: "No certificate access",
      icon: <FaUserTimes />,
    },
    {
      key: "linked",
      label: "Linked accounts",
      value: stats.linked,
      helper: "Accounts linked",
      icon: <FaUserCheck />,
    },
  ];

  const headerActions = (
    <>
      <ActionButton
        variant="primary"
        onClick={fetchStudents}
        disabled={tableLoading || loading || bulkImporting}
      >
        <FaRedo />
        Refresh
      </ActionButton>

      <ActionButton
        variant="secondary"
        onClick={downloadTemplate}
        disabled={loading || bulkImporting}
      >
        <FaDownload />
        Download Template
      </ActionButton>

      <ActionButton
        variant="ghost"
        onClick={exportStudentsCsv}
        disabled={tableLoading || loading || bulkImporting}
        aria-label="Export filtered student records as CSV"
      >
        <FaDownload />
        Export CSV
      </ActionButton>
    </>
  );

  return (
    <AdminPageShell
      title="Students & Access"
      subtitle="Manage approved students, account links, imports, and certificate access."
      actions={headerActions}
    >
      <style>{`
        .students-page {
          min-height: 100vh;
          background: #e8edf3;
          padding: 1.25rem 1.25rem 4rem;
        }

        .students-container {
          max-width: 1180px;
          margin: 0 auto;
        }

        .students-topbar {
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

        .students-label {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          color: #bfdbfe;
          font-size: 0.78rem;
          font-weight: 850;
          margin-bottom: 0.45rem;
        }

        .students-title {
          font-size: clamp(1.65rem, 3vw, 2.25rem);
          font-weight: 850;
          letter-spacing: 0;
          margin-bottom: 0.25rem;
        }

        .students-subtitle {
          color: #cbd5e1;
          margin-bottom: 0;
          font-size: 0.92rem;
        }

        .students-actions {
          display: flex;
          gap: 0.55rem;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .students-btn {
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

        .students-btn:hover {
          background: #f8fafc;
          color: #111827;
        }

        .students-btn-dark {
          background: #1f2937;
          color: #ffffff;
          border-color: #1f2937;
        }

        .students-btn-dark:hover {
          background: #374151;
          color: #ffffff;
        }

        .students-btn-light {
          background: #ffffff;
          color: #111827;
          border-color: #ffffff;
        }

        .students-btn-success {
          background: #059669;
          color: #ffffff;
          border-color: #059669;
        }

        .students-btn-success:hover {
          background: #047857;
          color: #ffffff;
        }

        .students-btn-danger {
          color: #dc2626;
          border-color: #fecaca;
        }

        .students-btn-danger:hover {
          background: #fef2f2;
          color: #dc2626;
        }

        .students-card {
          background: var(--bc-surface);
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-xl);
          box-shadow: var(--bc-shadow-sm);
        }

        .students-card-head {
          padding: 1rem 1.05rem;
          border-bottom: 1px solid var(--bc-border);
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          background: var(--bc-surface-soft);
        }

        .students-section-title {
          color: var(--bc-text);
          font-size: 1.05rem;
          font-weight: 850;
          margin-bottom: 0.15rem;
        }

        .students-muted {
          color: var(--bc-muted);
        }

        .students-body {
          padding: 1rem;
        }

        .students-stat-card {
          width: 100%;
          height: 100%;
          min-height: 148px;
          overflow: hidden;
          position: relative;
          text-align: left;
          background: var(--bc-surface);
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-xl);
          padding: 1.25rem 1.1rem 1.1rem;
          box-shadow: var(--bc-shadow-sm);
          transition: 0.16s ease;
        }

        .students-stat-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--bc-cobalt), var(--bc-teal));
        }

        .students-stat-card .bc-stat-card {
          height: 100%;
          min-height: 0;
          padding: 0.25rem 0 0;
          border: 0;
          background: transparent;
          box-shadow: none;
          overflow: visible;
        }

        .students-stat-card .bc-stat-card::before {
          display: none;
        }

        .students-stat-card .bc-stat-label {
          line-height: 1.4;
          margin-bottom: 0.35rem !important;
        }

        .students-stat-card .bc-page-muted {
          display: block;
          line-height: 1.35;
          margin-top: 0.55rem !important;
          padding-right: 0.2rem;
        }

        .students-stat-card:hover {
          background: var(--bc-surface-soft);
          border-color: rgba(37, 99, 235, 0.28);
          transform: translateY(-1px);
        }

        .students-stat-card.active {
          border-color: rgba(37, 99, 235, 0.5);
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.09);
        }

        .students-stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .students-stat-label {
          color: #64748b;
          font-size: 0.82rem;
          font-weight: 750;
          margin-bottom: 0.2rem;
        }

        .students-stat-value {
          color: var(--bc-text);
          font-size: 1.65rem;
          font-weight: 850;
          margin-bottom: 0;
        }

        .students-stat-icon {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: rgba(37, 99, 235, 0.1);
          color: var(--bc-primary);
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .students-health-card {
          height: 100%;
          padding: 1rem;
          border-radius: var(--bc-radius-xl);
          border: 1px solid rgba(37, 99, 235, 0.16);
          background:
            linear-gradient(135deg, rgba(37, 99, 235, 0.09), rgba(14, 165, 233, 0.04)),
            var(--bc-surface);
          box-shadow: var(--bc-shadow-sm);
        }

        .students-health-card.dark {
          color: #ffffff;
          background:
            linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 64, 175, 0.88));
          border-color: rgba(255, 255, 255, 0.14);
          height: 100%;
        }

        .students-health-card.dark .students-muted {
          color: #cbd5e1;
        }

        .students-health-card.dark .students-section-title {
          color: #ffffff;
        }

        .students-summary {
          padding: 1rem;
          height: 100%;
        }

        .students-progress-label {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 0.65rem;
          font-size: 0.9rem;
        }

        .students-progress-track {
          width: 100%;
          height: 10px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.24);
        }

        .students-progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, var(--bc-primary), #22c55e);
        }

        .students-progress-fill.linked {
          background: linear-gradient(90deg, #0ea5e9, #2563eb);
        }

        .students-status-legend {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.7rem;
          margin-top: 1rem;
        }

        .students-status-meaning {
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-lg);
          background: rgba(255, 255, 255, 0.72);
          padding: 0.75rem;
        }

        .students-status-meaning p {
          margin: 0.45rem 0 0;
          color: var(--bc-muted);
          font-size: 0.76rem;
          font-weight: 650;
        }

        .students-form-label {
          display: block;
          font-weight: 800;
          color: #334155;
          font-size: 0.82rem;
          margin-bottom: 0.4rem;
        }

        .students-input-wrap {
          position: relative;
        }

        .students-input-icon {
          position: absolute;
          left: 0.85rem;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        .students-input {
          width: 100%;
          height: 42px;
          border: 1px solid #d8dee8;
          border-radius: 12px;
          padding: 0 0.8rem;
          outline: none;
          background: #ffffff;
          color: #111827;
          font-weight: 650;
        }

        .students-input.with-icon {
          padding-left: 2.35rem;
        }

        .students-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.08);
        }

        .students-upload-box {
          border: 1px dashed rgba(37, 99, 235, 0.28);
          border-radius: var(--bc-radius-lg);
          background:
            linear-gradient(135deg, rgba(37, 99, 235, 0.06), rgba(255, 255, 255, 0.8));
          padding: 0.9rem;
          cursor: pointer;
        }

        .students-upload-box:hover {
          background: #ffffff;
          border-color: #111827;
        }

        .students-upload-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: #111827;
          color: #ffffff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .students-toolbar {
          padding: 1rem;
          border-bottom: 1px solid var(--bc-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
          background: var(--bc-surface-soft);
        }

        .students-toolbar-title {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .students-toolbar-icon {
          width: 36px;
          height: 36px;
          border-radius: var(--bc-radius-md);
          background: rgba(37, 99, 235, 0.1);
          color: var(--bc-primary);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .students-search-area {
          display: flex;
          gap: 0.55rem;
          flex-wrap: wrap;
          align-items: center;
        }

        .students-search-wrap {
          position: relative;
          width: min(100%, 350px);
        }

        .students-search-icon {
          position: absolute;
          left: 0.85rem;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        .students-search-input,
        .students-filter {
          height: 38px;
          border: 1px solid var(--bc-border);
          border-radius: var(--bc-radius-md);
          background: var(--bc-surface);
          color: var(--bc-text);
          font-weight: 650;
          outline: none;
        }

        .students-search-input {
          width: 100%;
          padding: 0 0.8rem 0 2.35rem;
        }

        .students-filter {
          padding: 0 0.75rem;
        }

        .students-status {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          border-radius: 999px;
          padding: 0.32rem 0.58rem;
          font-size: 0.72rem;
          font-weight: 850;
        }

        .students-status-linked {
          background: #ecfdf5;
          color: #059669;
          border: 1px solid #bbf7d0;
        }

        .students-status-unlinked {
          background: #fffbeb;
          color: #d97706;
          border: 1px solid #fde68a;
        }

        .students-status-inactive {
          background: #f1f5f9;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }

        .students-status-error {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .students-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          min-width: 900px;
        }

        .students-table th {
          position: sticky;
          top: 0;
          z-index: 2;
          background: var(--bc-surface-soft);
          color: var(--bc-muted);
          font-size: 0.72rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          font-weight: 850;
          padding: 0.8rem;
          border-bottom: 1px solid var(--bc-border);
        }

        .students-table td {
          padding: 0.8rem;
          border-bottom: 1px solid var(--bc-border);
          color: var(--bc-text-soft);
          font-size: 0.86rem;
          vertical-align: middle;
        }

        .students-date-cell {
          color: var(--bc-muted);
          font-size: 0.8rem;
          white-space: nowrap;
        }

        .students-table tbody tr:hover td {
          background: rgba(29, 78, 216, 0.035);
        }

        .students-empty {
          padding: 3rem 1rem;
          text-align: center;
        }

        @media(max-width: 768px) {
          .students-page {
            padding: 1rem 1rem 3.5rem;
          }

          .students-topbar,
          .students-card-head,
          .students-toolbar {
            flex-direction: column;
            align-items: flex-start;
          }

          .students-actions,
          .students-btn,
          .students-search-wrap,
          .students-filter {
            width: 100%;
          }

          .students-status-legend {
            grid-template-columns: 1fr;
          }

          .students-stat-card {
            min-height: 124px;
          }
        }
      `}</style>

          {message.text && (
            <AlertMessage type={message.type} message={message.text} />
          )}

          <section className="row g-3 mb-4">
            {statCards.map((card) => {
              const isActive = statusFilter === card.key;

              return (
                <div className="col-sm-6 col-xl" key={card.key}>
                  <button
                    type="button"
                    onClick={() => setStatusFilter(card.key)}
                    className={`students-stat-card ${
                      isActive ? "active" : ""
                    }`}
                    aria-pressed={isActive}
                  >
                    <StatCard
                      label={card.label}
                      value={tableLoading ? "..." : card.value}
                      helper={card.helper}
                      icon={card.icon}
                    />
                  </button>
                </div>
              );
            })}
          </section>

          <section className="row g-3 mb-3">
            <div className="col-lg-6">
              <div className="students-health-card dark">
                <h2 className="students-section-title">
                  Access activation rate
                </h2>

                <p className="students-muted small mb-3">
                  {tableLoading
                    ? "Loading summary..."
                    : `${stats.active} of ${stats.total} students have active certificate access.`}
                </p>

                <div className="students-progress-label">
                  <span className="students-muted">
                    Active students / total
                  </span>
                  <strong>{tableLoading ? "..." : `${activeAccessRate}%`}</strong>
                </div>

                <div className="students-progress-track">
                  <div
                    className="students-progress-fill"
                    style={{ width: `${activeAccessRate}%` }}
                  />
                </div>

                <p className="students-muted small mt-3 mb-0">
                  Students with active access can view issued certificates.
                </p>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="students-health-card">
                <h2 className="students-section-title">Account access</h2>

                <p className="students-muted small mb-3">
                  {tableLoading
                    ? "Loading summary..."
                    : `${stats.linked} of ${stats.total} students have linked accounts.`}
                </p>

                <div className="students-progress-label">
                  <span className="students-muted">
                    Linked accounts / total
                  </span>
                  <strong>{tableLoading ? "..." : `${linkedRate}%`}</strong>
                </div>

                <div className="students-progress-track">
                  <div
                    className="students-progress-fill linked"
                    style={{ width: `${linkedRate}%` }}
                  />
                </div>

                <p className="students-muted small mt-3 mb-0">
                  Linked accounts can sign in and open the student workspace.
                </p>
              </div>
            </div>
          </section>

          <section className="students-status-legend mb-3">
            <div className="students-status-meaning">
              <StatusBadge status="Inactive" type="inactive" />
              <p>No certificate access.</p>
            </div>

            <div className="students-status-meaning">
              <StatusBadge status="Pending" type="pending" />
              <p>Access setup pending.</p>
            </div>

            <div className="students-status-meaning">
              <StatusBadge status="Active" type="active" />
              <p>Certificate access enabled.</p>
            </div>
          </section>

          <section className="row g-3 mb-3">
            <div className="col-xl-4">
              <Card className="h-100">
                <div className="students-card-head">
                  <div>
                    <h2 className="students-section-title">
                      {editingStudent ? "Edit Student" : "Add Student"}
                    </h2>

                    <p className="students-muted small mb-0">
                      Create or update a student's access profile.
                    </p>
                  </div>

                  <div className="d-flex align-items-center gap-2 flex-wrap justify-content-end">
                    <StatusBadge
                      status={form.subscription_status || "inactive"}
                      type={form.subscription_status || "inactive"}
                    />

                    <span className="students-stat-icon">
                      {editingStudent ? <FaEdit /> : <FaPlus />}
                    </span>
                  </div>
                </div>

                <form onSubmit={saveStudent} className="students-body">
                  <div className="mb-3">
                    <label className="students-form-label">Student ID</label>

                    <div className="students-input-wrap">
                      <FaIdCard className="students-input-icon" />

                      <input
                        className="students-input with-icon"
                        placeholder="e.g. CT23A003"
                        aria-label="Student ID"
                        value={form.student_id}
                        onChange={(event) =>
                          updateField("student_id", event.target.value)
                        }
                        disabled={loading || bulkImporting}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="students-form-label">Full Name</label>

                    <div className="students-input-wrap">
                      <FaUserGraduate className="students-input-icon" />

                      <input
                        className="students-input with-icon"
                        placeholder="Student full name"
                        aria-label="Full name"
                        value={form.name}
                        onChange={(event) =>
                          updateField("name", event.target.value)
                        }
                        disabled={loading || bulkImporting}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="students-form-label">Email</label>

                    <div className="students-input-wrap">
                      <FaEnvelope className="students-input-icon" />

                      <input
                        type="email"
                        className="students-input with-icon"
                        placeholder="student@example.com"
                        aria-label="Student email"
                        value={form.email}
                        onChange={(event) =>
                          updateField("email", event.target.value)
                        }
                        disabled={loading || bulkImporting}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="students-form-label">
                      Access Status
                    </label>

                    <select
                      className="students-input"
                      value={form.subscription_status}
                      onChange={(event) =>
                        updateField("subscription_status", event.target.value)
                      }
                      disabled={loading || bulkImporting}
                      aria-label="Access status"
                    >
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                    </select>
                  </div>

                  <ActionButton
                    type="submit"
                    variant="primary"
                    className="w-100"
                    disabled={loading || bulkImporting}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm" />
                        Saving...
                      </>
                    ) : editingStudent ? (
                      <>
                        Update Student
                        <FaArrowRight />
                      </>
                    ) : (
                      <>
                        Add Student
                        <FaArrowRight />
                      </>
                    )}
                  </ActionButton>

                  {editingStudent && (
                    <ActionButton
                      onClick={resetForm}
                      variant="ghost"
                      className="w-100 mt-2"
                      disabled={loading || bulkImporting}
                    >
                      Cancel Edit
                    </ActionButton>
                  )}
                </form>
              </Card>
            </div>

            <div className="col-xl-8">
              <Card className="h-100">
                <div className="students-card-head">
                  <div>
                    <h2 className="students-section-title">
                      Bulk Student Import
                    </h2>

                    <p className="students-muted small mb-0">
                      Use columns: student_id, name, email,
                      subscription_status.
                    </p>
                  </div>

                  <ActionButton
                    onClick={downloadTemplate}
                    variant="ghost"
                    disabled={bulkImporting}
                  >
                    <FaDownload />
                    Template
                  </ActionButton>
                </div>

                <div className="students-body">
                  <input
                    ref={bulkInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="d-none"
                    id="bulk-students-file"
                    onChange={(event) =>
                      handleBulkFileChange(event.target.files?.[0])
                    }
                    disabled={bulkImporting}
                    aria-label="Upload students Excel or CSV file"
                  />

                  <label
                    htmlFor="bulk-students-file"
                    className="students-upload-box d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-3"
                  >
                    <div className="d-flex align-items-center gap-3">
                      <span className="students-upload-icon">
                        <FaFileExcel size={20} />
                      </span>

                      <div>
                        <p className="fw-bold mb-1">Choose File</p>

                        <p className="students-muted small mb-0">
                          Accepted file types: Excel/CSV (.xlsx, .xls, .csv)
                        </p>
                      </div>
                    </div>

                    <span className="students-btn students-btn-dark">
                      <FaUpload />
                      Upload File
                    </span>
                  </label>

                  {bulkRows.length > 0 && (
                    <>
                      <div className="row g-3 mb-3">
                        <div className="col-md-4">
                          <div className="border rounded-4 p-3 bg-light">
                            <p className="students-muted small mb-1">Rows</p>
                            <h4 className="fw-bold mb-0">{bulkRows.length}</h4>
                          </div>
                        </div>

                        <div className="col-md-4">
                          <div className="border rounded-4 p-3 bg-light">
                            <p className="students-muted small mb-1">Valid</p>
                            <h4 className="fw-bold text-success mb-0">
                              {validBulkCount}
                            </h4>
                          </div>
                        </div>

                        <div className="col-md-4">
                          <div className="border rounded-4 p-3 bg-light">
                            <p className="students-muted small mb-1">Errors</p>
                            <h4 className="fw-bold text-danger mb-0">
                              {invalidBulkCount}
                            </h4>
                          </div>
                        </div>
                      </div>

                      <div className="table-responsive border rounded-4 mb-3">
                        <table className="students-table">
                          <thead>
                            <tr>
                              <th>Row</th>
                              <th>Student ID</th>
                              <th>Name</th>
                              <th>Email</th>
                              <th>Status</th>
                              <th>Check</th>
                            </tr>
                          </thead>

                          <tbody>
                            {bulkRows.slice(0, 8).map((row) => (
                              <tr key={`${row.rowNumber}-${row.email}`}>
                                <td>{row.rowNumber}</td>

                                <td className="font-monospace fw-bold">
                                  {row.student_id || "N/A"}
                                </td>

                                <td>{row.name || "N/A"}</td>

                                <td>{row.email || "N/A"}</td>

                                <td>{row.subscription_status}</td>

                                <td>
                                  {row.error ? (
                                    <StatusBadge
                                      status={row.error}
                                      type="failed"
                                    />
                                  ) : (
                                    <StatusBadge
                                      status="Ready"
                                      type="successful"
                                    />
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {bulkRows.length > 8 && (
                        <p className="students-muted small">
                          Showing first 8 rows only. All valid rows will be
                          imported.
                        </p>
                      )}

                      <div className="d-flex flex-column flex-md-row gap-2">
                        <ActionButton
                          onClick={importBulkStudents}
                          variant="primary"
                          disabled={bulkImporting || validBulkCount === 0}
                        >
                          {bulkImporting ? (
                            <>
                              <span className="spinner-border spinner-border-sm" />
                              Importing...
                            </>
                          ) : (
                            <>
                              Import {validBulkCount}
                            </>
                          )}
                        </ActionButton>

                        <ActionButton
                          onClick={clearBulkRows}
                          variant="ghost"
                          disabled={bulkImporting}
                        >
                          Clear
                        </ActionButton>
                      </div>

                      {bulkResult && (
                        <div className="mt-3">
                          <AlertMessage
                            type="info"
                            message={`Imported: ${bulkResult.success} - Failed: ${bulkResult.failed}`}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </Card>
            </div>
          </section>

          <Card className="overflow-hidden">
            <div className="students-toolbar">
              <div className="students-toolbar-title">
                <span className="students-toolbar-icon">
                  <FaUsers />
                </span>

                <div>
                  <h2 className="students-section-title">Student List</h2>

                  <p className="students-muted small mb-0">
                    Showing {filteredStudents.length} of {students.length}{" "}
                    student record(s).
                  </p>
                </div>
              </div>

              <div className="students-search-area">
                <div className="students-search-wrap">
                  <FaSearch className="students-search-icon" />

                  <input
                    className="students-search-input"
                    placeholder="Search name, ID, or email..."
                    aria-label="Search students"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>

                <select
                  className="students-filter"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  aria-label="Filter students"
                >
                  <option value="all">All</option>
                  <option value="linked">Linked</option>
                  <option value="unlinked">Unlinked</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {tableLoading ? (
              <div className="students-empty">
                <div className="spinner-border text-primary mb-3" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>

                <p className="text-primary fw-semibold mb-0">
                  Loading records...
                </p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="students-empty">
                <EmptyState
                  title="No students found"
                  message="Try a different search or status filter."
                />
              </div>
            ) : (
              <div className="table-responsive">
                <table className="students-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Email</th>
                      <th>Access Status</th>
                      <th>Account Link</th>
                      <th>Created/Updated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedStudents.map((student) => (
                      <tr key={student.id || student.student_id}>
                        <td>
                          <div className="fw-bold text-dark">
                            {student.name || "N/A"}
                          </div>

                          <small className="students-muted font-monospace">
                            {student.student_id || "No student ID"}
                          </small>
                        </td>

                        <td>{student.email || "N/A"}</td>

                        <td>
                          <StatusBadge
                            status={student.subscription_status || "inactive"}
                            type={student.subscription_status || "inactive"}
                          />
                        </td>

                        <td>
                          <StatusBadge
                            status={
                              student.firebase_uid ? "Linked" : "Unlinked"
                            }
                            type={student.firebase_uid ? "linked" : "unlinked"}
                          />
                        </td>

                        <td className="students-date-cell">
                          {student.updated_at ||
                            student.created_at ||
                            student.updatedAt ||
                            student.createdAt ||
                            "N/A"}
                        </td>

                        <td>
                          <div className="d-flex gap-2 flex-wrap">
                            <ActionButton
                              onClick={() => startEdit(student)}
                              variant="ghost"
                              disabled={loading || bulkImporting}
                            >
                              <FaEdit />
                              Edit
                            </ActionButton>

                            <ActionButton
                              onClick={() => deleteStudent(student)}
                              variant="danger"
                              disabled={loading || bulkImporting}
                            >
                              <FaTrashAlt />
                              Delete
                            </ActionButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <PaginationControls
                  currentPage={studentPage}
                  totalItems={filteredStudents.length}
                  pageSize={studentPageSize}
                  onPageChange={setStudentPage}
                  onPageSizeChange={(nextPageSize) => {
                    setStudentPageSize(nextPageSize);
                    setStudentPage(1);
                  }}
                />
              </div>
            )}
          </Card>
    </AdminPageShell>
  );
};

export default AdminStudents;
