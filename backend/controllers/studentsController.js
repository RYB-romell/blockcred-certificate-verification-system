// backend/controllers/studentsController.js

import { supabase } from "../supabase.js";
import { logActivity } from "../services/activityLogger.js";

const ALLOWED_SUBSCRIPTION_STATUSES = ["inactive", "pending", "active"];
const STUDENT_SELECT =
  "id, student_id, name, email, firebase_uid, subscription_status, created_at";
const STUDENT_PROFILE_SELECT =
  "id, student_id, name, email, firebase_uid, subscription_status, contact, phone, address, department, programme, level, created_at";
const STUDENT_IDENTIFIER_SELECT = "id, student_id, email";
const STUDENT_PROFILE_FIELDS = [
  "name",
  "contact",
  "phone",
  "address",
  "department",
  "programme",
  "level",
];
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const normalizeValue = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const normalizeEmail = (email) => {
  return normalizeValue(email).toLowerCase();
};

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const normalizeSubscriptionStatus = (status) => {
  const finalStatus = normalizeValue(status).toLowerCase();

  if (!finalStatus) return "inactive";

  if (!ALLOWED_SUBSCRIPTION_STATUSES.includes(finalStatus)) {
    return "";
  }

  return finalStatus;
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

const getSupabaseErrorMessage = (error, fallback) => {
  if (!error) return fallback;

  if (error.code === "23505") {
    return "A student with this Student ID or email already exists.";
  }

  return error.message || fallback;
};

const isUuid = (value) => UUID_PATTERN.test(normalizeValue(value));

const filterStudentByIdentifier = (query, identifier) => {
  const finalIdentifier = normalizeValue(identifier);

  if (isUuid(finalIdentifier)) {
    return query.eq("id", finalIdentifier);
  }

  return query.eq("student_id", finalIdentifier);
};

const isMissingProfileColumnError = (error) => {
  const message = `${error?.message || ""} ${error?.details || ""}`;
  return /column .*students.*(contact|phone|address|department|programme|level).*does not exist/i.test(
    message
  );
};

const findAuthenticatedStudent = async (user, selectFields = STUDENT_SELECT) => {
  const lookupCandidates = [
    ["firebase_uid", normalizeValue(user?.uid)],
    ["email", normalizeEmail(user?.email)],
    ["student_id", normalizeValue(user?.student_id)],
    ["student_id", normalizeValue(user?.uid)],
  ];
  const seen = new Set();

  for (const [field, value] of lookupCandidates) {
    if (!value) continue;

    const key = `${field}:${value}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const { data, error } = await supabase
      .from("students")
      .select(selectFields)
      .eq(field, value)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      return data;
    }
  }

  return null;
};

const findAuthenticatedStudentProfile = async (user) => {
  try {
    return await findAuthenticatedStudent(user, STUDENT_PROFILE_SELECT);
  } catch (error) {
    if (isMissingProfileColumnError(error)) {
      console.warn(
        "Student profile fields are not available yet. Run backend/database/student_profile_fields.sql."
      );
      return findAuthenticatedStudent(user, STUDENT_SELECT);
    }

    throw error;
  }
};

const formatStudentProfile = (student = {}) => ({
  id: student.id,
  student_id: student.student_id,
  name: student.name,
  email: student.email,
  firebase_uid: student.firebase_uid,
  subscription_status: student.subscription_status,
  contact: student.contact,
  phone: student.phone,
  address: student.address,
  department: student.department,
  programme: student.programme,
  level: student.level,
  created_at: student.created_at,
});

const excludeStudentIdentifier = (query, identifier) => {
  const finalIdentifier = normalizeValue(identifier);

  if (!finalIdentifier) {
    return query;
  }

  if (isUuid(finalIdentifier)) {
    return query.neq("id", finalIdentifier);
  }

  return query.neq("student_id", finalIdentifier);
};

const checkStudentConflict = async ({
  studentId,
  email,
  excludeIdentifier = null,
}) => {
  if (studentId) {
    let studentIdQuery = supabase
      .from("students")
      .select(STUDENT_IDENTIFIER_SELECT)
      .eq("student_id", studentId);

    studentIdQuery = excludeStudentIdentifier(
      studentIdQuery,
      excludeIdentifier
    );

    const { data, error } = await studentIdQuery.maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (data) {
      return "A student with this Student ID already exists.";
    }
  }

  if (email) {
    let emailQuery = supabase
      .from("students")
      .select(STUDENT_IDENTIFIER_SELECT)
      .eq("email", email);

    emailQuery = excludeStudentIdentifier(emailQuery, excludeIdentifier);

    const { data, error } = await emailQuery.maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (data) {
      return "A student with this email already exists.";
    }
  }

  return "";
};

export const precheckStudent = async (req, res) => {
  try {
    const { student_id, email } = req.body;

    const finalStudentId = normalizeValue(student_id);
    const finalEmail = normalizeEmail(email);

    if (!finalStudentId || !finalEmail) {
      return sendError(res, 400, "Student ID and email are required.");
    }

    if (!isValidEmail(finalEmail)) {
      return sendError(res, 400, "Please enter a valid email address.");
    }

    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("student_id", finalStudentId)
      .eq("email", finalEmail)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return sendError(
        res,
        404,
        "Student record not found. Please make sure your Student ID and email match the institution record."
      );
    }

    if (data.firebase_uid) {
      return sendError(
        res,
        409,
        "This student record is already linked to an account. Please sign in instead."
      );
    }

    return sendSuccess(res, 200, {
      message: "Student record verified. You can create your account.",
      student: {
        id: data.id,
        uid: data.uid,
        student_id: data.student_id,
        name: data.name,
        email: data.email,
        subscription_status: data.subscription_status,
      },
    });
  } catch (error) {
    console.error("precheckStudent error:", error);

    return sendError(
      res,
      500,
      error.message || "Failed to verify student record."
    );
  }
};

export const linkFirebaseAccount = async (req, res) => {
  try {
    const { student_id, email } = req.body;

    const finalStudentId = normalizeValue(student_id);
    const finalEmail = normalizeEmail(email);

    const verifiedFirebaseUid = normalizeValue(req.user?.uid);
    const verifiedFirebaseEmail = normalizeEmail(req.user?.email);

    if (!finalStudentId || !finalEmail) {
      return sendError(res, 400, "Student ID and email are required.");
    }

    if (!isValidEmail(finalEmail)) {
      return sendError(res, 400, "Please enter a valid email address.");
    }

    if (!verifiedFirebaseUid || !verifiedFirebaseEmail) {
      return sendError(res, 401, "Verified Firebase user is required.");
    }

    if (finalEmail !== verifiedFirebaseEmail) {
      return sendError(
        res,
        403,
        "The Firebase account email must match the approved student record email."
      );
    }

    const existing = await supabase
      .from("students")
      .select("*")
      .eq("student_id", finalStudentId)
      .eq("email", finalEmail)
      .maybeSingle();

    if (existing.error) {
      throw new Error(existing.error.message);
    }

    if (!existing.data) {
      return sendError(res, 404, "Student record not found.");
    }

    if (
      existing.data.firebase_uid &&
      existing.data.firebase_uid !== verifiedFirebaseUid
    ) {
      return sendError(
        res,
        409,
        "This student record is already linked to another account."
      );
    }

    const { data, error } = await supabase
      .from("students")
      .update({
        firebase_uid: verifiedFirebaseUid,
      })
      .eq("student_id", finalStudentId)
      .eq("email", finalEmail)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    await logActivity({
      req,
      action: "student_account_linked",
      entity_type: "student",
      entity_id: data.student_id,
      entity_label: data.name || data.email,
      description: `Firebase account linked for ${data.name || data.email}.`,
      metadata: {
        student_id: data.student_id,
        email: data.email,
        firebase_uid: data.firebase_uid,
      },
    });

    return sendSuccess(res, 200, {
      message: "Firebase account linked successfully.",
      student: data,
    });
  } catch (error) {
    console.error("linkFirebaseAccount error:", error);

    return sendError(
      res,
      500,
      error.message || "Failed to link Firebase account."
    );
  }
};

export const getStudentByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const finalEmail = normalizeEmail(email);

    if (!finalEmail) {
      return sendError(res, 400, "Email is required.");
    }

    if (!isValidEmail(finalEmail)) {
      return sendError(res, 400, "Please enter a valid email address.");
    }

    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("email", finalEmail)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return sendError(res, 404, "Student not found.");
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("getStudentByEmail error:", error);

    return sendError(res, 500, error.message || "Failed to fetch student.");
  }
};

export const getCurrentStudentProfile = async (req, res) => {
  try {
    const student = await findAuthenticatedStudentProfile(req.user);

    if (!student) {
      return sendError(res, 404, "Student profile not found.");
    }

    return sendSuccess(res, 200, {
      student: formatStudentProfile(student),
    });
  } catch (error) {
    console.error("getCurrentStudentProfile error:", error);

    return sendError(
      res,
      500,
      error.message || "Failed to fetch student profile."
    );
  }
};

export const updateCurrentStudentProfile = async (req, res) => {
  try {
    const student = await findAuthenticatedStudent(req.user, STUDENT_SELECT);

    if (!student) {
      return sendError(res, 404, "Student profile not found.");
    }

    const updateData = {};

    for (const field of STUDENT_PROFILE_FIELDS) {
      if (!Object.prototype.hasOwnProperty.call(req.body, field)) continue;

      const value = normalizeValue(req.body[field]);

      if (field === "name") {
        if (!value) {
          return sendError(res, 400, "Name cannot be empty.");
        }

        updateData.name = value;
        continue;
      }

      updateData[field] = value || null;
    }

    if (Object.keys(updateData).length === 0) {
      return sendError(res, 400, "No profile changes were provided.");
    }

    let updateQuery = supabase.from("students").update(updateData);

    if (student.id && isUuid(student.id)) {
      updateQuery = updateQuery.eq("id", student.id);
    } else {
      updateQuery = updateQuery.eq("student_id", student.student_id);
    }

    const { data, error } = await updateQuery
      .select(STUDENT_PROFILE_SELECT)
      .maybeSingle();

    if (error) {
      throw new Error(
        getSupabaseErrorMessage(error, "Failed to update student profile.")
      );
    }

    if (!data) {
      return sendError(res, 404, "Student profile not found.");
    }

    await logActivity({
      req,
      action: "student_profile_updated",
      entity_type: "student",
      entity_id: data.id || data.student_id,
      entity_label: data.name || data.email || data.student_id,
      description: "Student updated their profile details.",
      metadata: {
        student_id: data.student_id,
        updated_fields: Object.keys(updateData),
      },
    });

    return sendSuccess(res, 200, {
      message: "Profile updated successfully.",
      student: formatStudentProfile(data),
    });
  } catch (error) {
    console.error("updateCurrentStudentProfile error:", error);

    return sendError(
      res,
      500,
      error.message || "Failed to update student profile."
    );
  }
};

export const getAllStudents = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("students")
      .select(STUDENT_SELECT)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return res.status(200).json(data || []);
  } catch (error) {
    console.error("getAllStudents error:", error);

    return sendError(res, 500, error.message || "Failed to fetch students.");
  }
};

export const createStudent = async (req, res) => {
  try {
    const { student_id, name, email, subscription_status } = req.body;

    const finalStudentId = normalizeValue(student_id);
    const finalName = normalizeValue(name);
    const finalEmail = normalizeEmail(email);
    const finalSubscriptionStatus = normalizeSubscriptionStatus(
      subscription_status
    );

    if (!finalStudentId || !finalName || !finalEmail) {
      return sendError(res, 400, "Student ID, name, and email are required.");
    }

    if (!isValidEmail(finalEmail)) {
      return sendError(res, 400, "Please enter a valid email address.");
    }

    if (!finalSubscriptionStatus) {
      return sendError(
        res,
        400,
        "Invalid subscription status. Use inactive, pending, or active."
      );
    }

    const conflictMessage = await checkStudentConflict({
      studentId: finalStudentId,
      email: finalEmail,
    });

    if (conflictMessage) {
      return sendError(res, 409, conflictMessage);
    }

    const { data, error } = await supabase
      .from("students")
      .insert([
        {
          uid: finalStudentId,
          student_id: finalStudentId,
          name: finalName,
          email: finalEmail,
          subscription_status: finalSubscriptionStatus,
          firebase_uid: null,
        },
      ])
      .select(STUDENT_SELECT)
      .single();

    if (error) {
      throw new Error(
        getSupabaseErrorMessage(error, "Failed to create student.")
      );
    }

    await logActivity({
      req,
      action: "student_created",
      entity_type: "student",
      entity_id: data.id || data.student_id,
      entity_label: data.name || data.email,
      description: `Student ${data.name || data.student_id} was created.`,
      metadata: {
        student_id: data.student_id,
        email: data.email,
        subscription_status: data.subscription_status,
      },
    });

    return sendSuccess(res, 201, {
      message: "Student added successfully.",
      student: data,
    });
  } catch (error) {
    console.error("createStudent error:", error);

    return sendError(res, 500, error.message || "Failed to create student.");
  }
};

export const updateStudent = async (req, res) => {
  try {
    const identifier = normalizeValue(req.params.id);

    if (!identifier) {
      return sendError(res, 400, "Student record identifier is required.");
    }

    const {
      student_id,
      name,
      email,
      subscription_status,
      firebase_uid,
    } = req.body;

    const updateData = {};

    let finalStudentId = "";
    let finalEmail = "";

    if (student_id !== undefined) {
      finalStudentId = normalizeValue(student_id);

      if (!finalStudentId) {
        return sendError(res, 400, "Student ID cannot be empty.");
      }

      updateData.student_id = finalStudentId;
      updateData.uid = finalStudentId;
    }

    if (name !== undefined) {
      const finalName = normalizeValue(name);

      if (!finalName) {
        return sendError(res, 400, "Student name cannot be empty.");
      }

      updateData.name = finalName;
    }

    if (email !== undefined) {
      finalEmail = normalizeEmail(email);

      if (!finalEmail) {
        return sendError(res, 400, "Email cannot be empty.");
      }

      if (!isValidEmail(finalEmail)) {
        return sendError(res, 400, "Please enter a valid email address.");
      }

      updateData.email = finalEmail;
    }

    if (subscription_status !== undefined) {
      const finalSubscriptionStatus = normalizeSubscriptionStatus(
        subscription_status
      );

      if (!finalSubscriptionStatus) {
        return sendError(
          res,
          400,
          "Invalid subscription status. Use inactive, pending, or active."
        );
      }

      updateData.subscription_status = finalSubscriptionStatus;
    }

    if (firebase_uid !== undefined) {
      updateData.firebase_uid = normalizeValue(firebase_uid) || null;
    }

    if (Object.keys(updateData).length === 0) {
      return sendError(res, 400, "No valid update data was provided.");
    }

    const conflictMessage = await checkStudentConflict({
      studentId: finalStudentId,
      email: finalEmail,
      excludeIdentifier: identifier,
    });

    if (conflictMessage) {
      return sendError(res, 409, conflictMessage);
    }

    let updateQuery = supabase
      .from("students")
      .update(updateData);

    updateQuery = filterStudentByIdentifier(updateQuery, identifier);

    const { data, error } = await updateQuery
      .select(STUDENT_SELECT)
      .maybeSingle();

    if (error) {
      throw new Error(
        getSupabaseErrorMessage(error, "Failed to update student.")
      );
    }

    if (!data) {
      return sendError(res, 404, "Student not found.");
    }

    await logActivity({
      req,
      action: "student_updated",
      entity_type: "student",
      entity_id: data.id || data.student_id,
      entity_label: data.name || data.email,
      description: `Student ${data.name || data.student_id} was updated.`,
      metadata: {
        student_id: data.student_id,
        email: data.email,
        update_fields: Object.keys(updateData),
        subscription_status: data.subscription_status,
      },
    });

    return sendSuccess(res, 200, {
      message: "Student updated successfully.",
      student: data,
    });
  } catch (error) {
    console.error("updateStudent error:", error);

    return sendError(res, 500, error.message || "Failed to update student.");
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const identifier = normalizeValue(req.params.id);

    if (!identifier) {
      return sendError(res, 400, "Student record identifier is required.");
    }

    let deleteQuery = supabase
      .from("students")
      .delete();

    deleteQuery = filterStudentByIdentifier(deleteQuery, identifier);

    const { data, error } = await deleteQuery
      .select(STUDENT_SELECT)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return sendError(res, 404, "Student not found.");
    }

    await logActivity({
      req,
      action: "student_deleted",
      entity_type: "student",
      entity_id: data.id || data.student_id,
      entity_label: data.name || data.email,
      description: `Student ${data.name || data.student_id} was deleted.`,
      metadata: {
        student_id: data.student_id,
        email: data.email,
        subscription_status: data.subscription_status,
      },
    });

    return sendSuccess(res, 200, {
      message: "Student deleted successfully.",
      student: data,
    });
  } catch (error) {
    console.error("deleteStudent error:", error);

    return sendError(res, 500, error.message || "Failed to delete student.");
  }
};
