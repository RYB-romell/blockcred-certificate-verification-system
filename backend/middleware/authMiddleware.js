// backend/middleware/authMiddleware.js

import admin from "../firebaseAdmin.js";

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

const getBearerToken = (req) => {
  const authHeader = normalizeValue(req.headers.authorization);

  if (!authHeader) return "";

  const [scheme, token] = authHeader.split(/\s+/);

  if (normalizeLower(scheme) !== "bearer" || !token) {
    return "";
  }

  return token.trim();
};

const getRoleFromDecodedToken = (decodedToken) => {
  const role = normalizeLower(decodedToken.role || decodedToken.user_role);

  if (!role) return "student";

  return role;
};

const buildAuthenticatedUser = (decodedToken) => {
  return {
    uid: decodedToken.uid,
    email: normalizeLower(decodedToken.email),
    role: getRoleFromDecodedToken(decodedToken),
    student_id: normalizeValue(
      decodedToken.student_id ||
        decodedToken.studentId ||
        decodedToken.matricule ||
        decodedToken.registration_number
    ),
    email_verified: Boolean(decodedToken.email_verified),
    claims: decodedToken,
  };
};

export const requireAuth = async (req, res, next) => {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return sendError(res, 401, "Authentication token is required.");
    }

    const decodedToken = await admin.auth().verifyIdToken(token, true);

    req.user = buildAuthenticatedUser(decodedToken);

    return next();
  } catch (error) {
    console.error("Firebase token verification error:", error.message);

    if (
      error?.code === "auth/id-token-expired" ||
      error?.code === "auth/session-cookie-expired"
    ) {
      return sendError(
        res,
        401,
        "Your session has expired. Please sign in again."
      );
    }

    return sendError(res, 401, "Invalid or expired authentication token.");
  }
};

export const requireAdminRole = (req, res, next) => {
  if (!req.user) {
    return sendError(res, 401, "Authentication is required.");
  }

  if (req.user.role !== "admin") {
    return sendError(res, 403, "Institution access is required.");
  }

  return next();
};

export const requireEmployerOrAdminRole = (req, res, next) => {
  if (!req.user) {
    return sendError(res, 401, "Authentication is required.");
  }

  const allowedRoles = ["admin", "employer"];

  if (!allowedRoles.includes(req.user.role)) {
    return sendError(res, 403, "Verifier access is required.");
  }

  return next();
};

export const requireRole = (...allowedRoles) => {
  const normalizedAllowedRoles = allowedRoles.map((role) =>
    normalizeLower(role)
  );

  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, "Authentication is required.");
    }

    if (!normalizedAllowedRoles.includes(req.user.role)) {
      return sendError(res, 403, "You do not have permission for this action.");
    }

    return next();
  };
};

export const requireSelfOrAdminByParam = (paramName) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, "Authentication is required.");
    }

    if (req.user.role === "admin") {
      return next();
    }

    const paramValue = normalizeLower(req.params[paramName]);

    if (!paramValue) {
      return sendError(res, 400, "Required account identifier is missing.");
    }

    const allowedSelfIdentifiers = [
      normalizeLower(req.user.email),
      normalizeLower(req.user.uid),
      normalizeLower(req.user.student_id),
    ].filter(Boolean);

    if (allowedSelfIdentifiers.includes(paramValue)) {
      return next();
    }

    return sendError(res, 403, "You can only access your own records.");
  };
};