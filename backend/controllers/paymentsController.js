// backend/controllers/paymentsController.js

import crypto from "crypto";
import { supabase } from "../supabase.js";
import { getPaymentProvider } from "../services/paymentProviders/index.js";
import { logActivity } from "../services/activityLogger.js";

const normalizeValue = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const normalizeLower = (value) => {
  return normalizeValue(value).toLowerCase();
};

const sendError = (res, status, message) => {
  return res.status(status).json({
    success: false,
    message,
  });
};

const sendSuccess = (res, status, payload = {}) => {
  return res.status(status).json({
    success: true,
    ...payload,
  });
};

const getPaymentAmount = () => {
  const amount = Number(process.env.PAYMENT_AMOUNT || 5000);
  return Number.isFinite(amount) && amount > 0 ? amount : 5000;
};

const getPaymentCurrency = () => {
  return normalizeValue(process.env.PAYMENT_CURRENCY) || "XAF";
};

const isMockPaymentConfirmationAllowed = () => {
  const paymentProvider = normalizeLower(process.env.PAYMENT_PROVIDER || "mock");
  const allowMockConfirm = normalizeLower(
    process.env.ALLOW_MOCK_PAYMENT_CONFIRM
  );
  const nodeEnv = normalizeLower(process.env.NODE_ENV || "development");

  return (
    paymentProvider === "mock" &&
    allowMockConfirm === "true" &&
    nodeEnv !== "production"
  );
};

const getFrontendUrl = () => {
  return (
    normalizeValue(process.env.FRONTEND_URL) || "http://localhost:3000"
  ).replace(/\/+$/, "");
};

const createPaymentReference = () => {
  return `BC-PAY-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
};

const buildCheckoutUrl = (paymentReference) => {
  const encodedReference = encodeURIComponent(paymentReference);
  return `${getFrontendUrl()}/payment/callback?reference=${encodedReference}&mock=true`;
};

const formatPayment = (payment) => {
  if (!payment) return null;

  return {
    reference: payment.payment_reference,
    amount: Number(payment.amount),
    currency: payment.currency,
    status: payment.status,
    checkout_url: payment.checkout_url,
  };
};

const formatPaymentHistoryItem = (payment) => {
  return {
    id: payment.id,
    payment_reference: payment.payment_reference,
    amount: Number(payment.amount),
    currency: payment.currency,
    gateway: payment.gateway,
    status: payment.status,
    checkout_url: payment.checkout_url,
    gateway_transaction_id: payment.gateway_transaction_id,
    created_at: payment.created_at,
    paid_at: payment.paid_at,
  };
};

const formatAdminPaymentRecord = (payment) => {
  return {
    id: payment.id,
    student_id: payment.student_id,
    student_email: payment.student_email,
    amount: Number(payment.amount),
    currency: payment.currency,
    gateway: payment.gateway,
    payment_reference: payment.payment_reference,
    gateway_transaction_id: payment.gateway_transaction_id,
    status: payment.status,
    checkout_url: payment.checkout_url,
    created_at: payment.created_at,
    paid_at: payment.paid_at,
  };
};

const uniqueValues = (values) => {
  return Array.from(
    new Set(values.map((value) => normalizeValue(value)).filter(Boolean))
  );
};

const getAdminPaymentLimit = (value) => {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return 100;
  }

  return Math.min(parsed, 500);
};

const escapeSearchTerm = (value) => {
  return normalizeValue(value).replace(/[%,()]/g, "");
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

const findStudentForUser = async (user) => {
  const lookupCandidates = [
    ["email", normalizeLower(user?.email)],
    ["student_id", normalizeValue(user?.student_id)],
    ["student_id", normalizeValue(user?.uid)],
    ["uid", normalizeValue(user?.student_id)],
    ["uid", normalizeValue(user?.uid)],
    ["firebase_uid", normalizeValue(user?.uid)],
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

const findStudentForPayment = async (payment) => {
  const lookupCandidates = [
    ["student_id", normalizeValue(payment?.student_id)],
    ["uid", normalizeValue(payment?.student_id)],
    ["firebase_uid", normalizeValue(payment?.metadata?.firebase_uid)],
    ["email", normalizeLower(payment?.student_email)],
  ];

  for (const [field, value] of lookupCandidates) {
    const student = await findStudentByField(field, value);

    if (student) {
      return student;
    }
  }

  return null;
};

const findPaymentByReference = async (paymentReference) => {
  const finalReference = normalizeValue(paymentReference);

  if (!finalReference) return null;

  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("payment_reference", finalReference)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const userCanAccessPayment = (user, payment) => {
  if (!user || !payment) return false;

  if (user.role === "admin") {
    return true;
  }

  const userEmail = normalizeLower(user.email);
  const userStudentId = normalizeLower(user.student_id);
  const userFirebaseUid = normalizeLower(user.uid);
  const paymentStudentEmail = normalizeLower(payment.student_email);
  const paymentStudentId = normalizeLower(payment.student_id);
  const metadataFirebaseUid = normalizeLower(payment.metadata?.firebase_uid);
  const metadataUid = normalizeLower(payment.metadata?.uid);

  return Boolean(
    (userEmail && userEmail === paymentStudentEmail) ||
      (userStudentId && userStudentId === paymentStudentId) ||
      (userFirebaseUid && userFirebaseUid === metadataFirebaseUid) ||
      (userFirebaseUid && userFirebaseUid === metadataUid)
  );
};

const updateStudentSubscriptionStatus = async (student, status) => {
  const lookupCandidates = [
    ["student_id", student?.student_id],
    ["uid", student?.uid],
    ["firebase_uid", student?.firebase_uid],
    ["email", normalizeLower(student?.email)],
    ["id", student?.id],
  ];

  const seen = new Set();

  for (const [field, value] of lookupCandidates) {
    const finalValue = normalizeValue(value);
    const key = `${field}:${finalValue}`;

    if (!finalValue || seen.has(key)) {
      continue;
    }

    seen.add(key);

    const { data, error } = await supabase
      .from("students")
      .update({
        subscription_status: status,
      })
      .eq(field, finalValue)
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (data) {
      return data;
    }
  }

  throw new Error("Could not update student subscription status.");
};

export const initiatePayment = async (req, res) => {
  try {
    const student = await findStudentForUser(req.user);

    if (!student) {
      return sendError(res, 404, "Student record not found.");
    }

    if (normalizeLower(student.subscription_status) === "active") {
      return sendSuccess(res, 200, {
        already_active: true,
        message: "Your certificate access is already active.",
      });
    }

    const amount = getPaymentAmount();
    const currency = getPaymentCurrency();
    const paymentReference = createPaymentReference();
    const checkoutUrl = buildCheckoutUrl(paymentReference);
    const paymentProvider = getPaymentProvider();
    const paymentStudentId =
      student.student_id || student.uid || req.user?.uid || student.email || null;
    const paymentStudentEmail = normalizeLower(student.email || req.user?.email);
    const paymentFirebaseUid = student.firebase_uid || req.user?.uid || null;

    const providerPayment = await paymentProvider.createPayment({
      amount,
      currency,
      reference: paymentReference,
      studentEmail: paymentStudentEmail,
      studentName: student.name || "",
      callbackUrl: checkoutUrl,
      metadata: {
        firebase_uid: paymentFirebaseUid,
        student_id: paymentStudentId,
      },
    });

    if (!providerPayment.success) {
      return sendError(
        res,
        501,
        providerPayment.message || "Selected payment provider is not configured."
      );
    }

    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert([
        {
          student_id: paymentStudentId,
          student_email: paymentStudentEmail,
          amount,
          currency,
          gateway: providerPayment.provider || paymentProvider.name || "mock",
          payment_reference: paymentReference,
          status: providerPayment.status || "pending",
          checkout_url: providerPayment.checkout_url || checkoutUrl,
          metadata: {
            firebase_uid: paymentFirebaseUid,
            uid: student.uid || req.user?.uid || null,
            email: paymentStudentEmail,
            provider: providerPayment.provider || paymentProvider.name || "mock",
            source:
              (providerPayment.provider || paymentProvider.name) === "mock"
                ? "blockcred-local-test"
                : "blockcred-payment-provider",
          },
        },
      ])
      .select()
      .single();

    if (paymentError) {
      throw new Error(paymentError.message);
    }

    await updateStudentSubscriptionStatus(student, "pending");

    await logActivity({
      req,
      action: "payment_initiated",
      entity_type: "payment",
      entity_id: payment.payment_reference,
      entity_label: payment.student_email || payment.student_id,
      description: `Payment ${payment.payment_reference} was initiated.`,
      metadata: {
        payment_reference: payment.payment_reference,
        student_id: payment.student_id,
        student_email: payment.student_email,
        amount: Number(payment.amount),
        currency: payment.currency,
        gateway: payment.gateway,
        status: payment.status,
      },
    });

    return sendSuccess(res, 201, {
      message: "Payment initialized.",
      payment: formatPayment(payment),
    });
  } catch (error) {
    console.error("initiatePayment error:", error);

    return sendError(
      res,
      500,
      error.message || "Failed to initialize payment."
    );
  }
};

export const getPaymentStatus = async (req, res) => {
  try {
    const { reference } = req.params;
    const payment = await findPaymentByReference(reference);

    if (!payment) {
      return sendError(res, 404, "Payment not found.");
    }

    if (!userCanAccessPayment(req.user, payment)) {
      return sendError(res, 403, "You can only access your own payments.");
    }

    const student = await findStudentForPayment(payment);

    return sendSuccess(res, 200, {
      payment: formatPayment(payment),
      subscription_status:
        normalizeLower(student?.subscription_status) || "inactive",
    });
  } catch (error) {
    console.error("getPaymentStatus error:", error);

    return sendError(
      res,
      500,
      error.message || "Failed to fetch payment status."
    );
  }
};

export const getMyPaymentHistory = async (req, res) => {
  try {
    const student = await findStudentForUser(req.user);
    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit, 10) || 50, 1),
      200
    );

    const emailCandidates = uniqueValues([
      req.user?.email,
      student?.email,
    ]).map(normalizeLower);

    const studentIdCandidates = uniqueValues([
      req.user?.student_id,
      req.user?.uid,
      student?.student_id,
      student?.uid,
      student?.firebase_uid,
    ]);

    if (emailCandidates.length === 0 && studentIdCandidates.length === 0) {
      return sendSuccess(res, 200, {
        payments: [],
      });
    }

    const filters = [
      ...emailCandidates.map((email) => `student_email.eq.${email}`),
      ...studentIdCandidates.map((studentId) => `student_id.eq.${studentId}`),
    ].join(",");

    const { data, error } = await supabase
      .from("payments")
      .select(
        "id, payment_reference, amount, currency, gateway, status, checkout_url, gateway_transaction_id, created_at, paid_at"
      )
      .or(filters)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return sendSuccess(res, 200, {
      payments: (data || []).map(formatPaymentHistoryItem),
    });
  } catch (error) {
    console.error("getMyPaymentHistory error:", error);

    return sendError(
      res,
      500,
      error.message || "Failed to fetch payment history."
    );
  }
};

export const getAdminPaymentRecords = async (req, res) => {
  try {
    const status = normalizeLower(req.query.status);
    const gateway = normalizeLower(req.query.gateway);
    const search = escapeSearchTerm(req.query.search);
    const limit = getAdminPaymentLimit(req.query.limit);

    let query = supabase
      .from("payments")
      .select(
        "id, student_id, student_email, amount, currency, gateway, payment_reference, gateway_transaction_id, status, checkout_url, created_at, paid_at"
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (gateway && gateway !== "all") {
      query = query.eq("gateway", gateway);
    }

    if (search) {
      const searchPattern = `%${search}%`;
      query = query.or(
        [
          `payment_reference.ilike.${searchPattern}`,
          `student_email.ilike.${searchPattern}`,
          `student_id.ilike.${searchPattern}`,
          `gateway_transaction_id.ilike.${searchPattern}`,
        ].join(",")
      );
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return sendSuccess(res, 200, {
      payments: (data || []).map(formatAdminPaymentRecord),
    });
  } catch (error) {
    console.error("getAdminPaymentRecords error:", error);

    return sendError(
      res,
      500,
      error.message || "Failed to fetch payment records."
    );
  }
};

export const mockConfirmPayment = async (req, res) => {
  try {
    if (!isMockPaymentConfirmationAllowed()) {
      return sendError(
        res,
        403,
        "Mock payment confirmation is disabled in this environment."
      );
    }

    const { reference } = req.params;
    const payment = await findPaymentByReference(reference);

    if (!payment) {
      return sendError(res, 404, "Payment not found.");
    }

    const mockTransactionId = `MOCK-TX-${Date.now()}-${crypto
      .randomBytes(4)
      .toString("hex")}`;

    const { data: updatedPayment, error: paymentError } = await supabase
      .from("payments")
      .update({
        status: "successful",
        paid_at: new Date().toISOString(),
        gateway_transaction_id: mockTransactionId,
      })
      .eq("payment_reference", payment.payment_reference)
      .select()
      .single();

    if (paymentError) {
      throw new Error(paymentError.message);
    }

    const student = await findStudentForPayment(updatedPayment);

    if (!student) {
      return sendError(
        res,
        404,
        "Payment was confirmed, but the matching student record was not found."
      );
    }

    await updateStudentSubscriptionStatus(student, "active");

    await logActivity({
      req,
      action: "payment_confirmed_mock",
      entity_type: "payment",
      entity_id: updatedPayment.payment_reference,
      entity_label: updatedPayment.student_email || updatedPayment.student_id,
      description: `Mock payment ${updatedPayment.payment_reference} was confirmed.`,
      metadata: {
        payment_reference: updatedPayment.payment_reference,
        student_id: updatedPayment.student_id,
        student_email: updatedPayment.student_email,
        amount: Number(updatedPayment.amount),
        currency: updatedPayment.currency,
        gateway_transaction_id: updatedPayment.gateway_transaction_id,
      },
    });

    return sendSuccess(res, 200, {
      message: "Mock payment confirmed. Certificate access is now active.",
      payment_reference: updatedPayment.payment_reference,
      subscription_status: "active",
    });
  } catch (error) {
    console.error("mockConfirmPayment error:", error);

    return sendError(
      res,
      500,
      error.message || "Failed to confirm mock payment."
    );
  }
};

export const paymentWebhook = async (req, res) => {
  return sendSuccess(res, 200, {
    message:
      "Webhook endpoint ready. Real gateway verification will be added later.",
  });
};
