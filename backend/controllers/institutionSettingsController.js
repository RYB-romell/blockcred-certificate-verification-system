import { supabase } from "../supabase.js";
import { logActivity } from "../services/activityLogger.js";

const TEXT_FIELDS = [
  "institution_name",
  "institution_email",
  "institution_phone",
  "institution_address",
  "verification_system_name",
  "currency",
  "payment_provider",
  "support_email",
  "support_phone",
];

const ALLOWED_PAYMENT_PROVIDERS = new Set(["mock", "notchpay", "campay"]);

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

const normalizeText = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const normalizeSettings = (settings) => {
  if (!settings) return null;

  return {
    id: settings.id,
    institution_name: settings.institution_name,
    institution_email: settings.institution_email,
    institution_phone: settings.institution_phone,
    institution_address: settings.institution_address,
    verification_system_name: settings.verification_system_name,
    certificate_access_fee: Number(settings.certificate_access_fee || 0),
    currency: settings.currency,
    payment_provider: settings.payment_provider,
    support_email: settings.support_email,
    support_phone: settings.support_phone,
    updated_at: settings.updated_at,
  };
};

const getFirstSettingsRow = async () => {
  const { data, error } = await supabase
    .from("institution_settings")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const createDefaultSettingsRow = async () => {
  const { data, error } = await supabase
    .from("institution_settings")
    .insert([
      {
        institution_name: "BlockCred Institution",
        institution_email: "info@blockcred.local",
        institution_phone: "Not configured",
        institution_address: "Not configured",
        verification_system_name: "BlockCred",
        certificate_access_fee: 5000,
        currency: "XAF",
        payment_provider: "mock",
        support_email: "support@blockcred.local",
        support_phone: "Not configured",
      },
    ])
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const buildUpdatePayload = (body = {}) => {
  const updatePayload = {};

  TEXT_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      updatePayload[field] = normalizeText(body[field]);
    }
  });

  if (Object.prototype.hasOwnProperty.call(body, "certificate_access_fee")) {
    const fee = Number(body.certificate_access_fee);

    if (!Number.isFinite(fee) || fee < 0) {
      return {
        error: "Certificate access fee must be zero or a positive number.",
      };
    }

    updatePayload.certificate_access_fee = fee;
  }

  if (Object.prototype.hasOwnProperty.call(updatePayload, "currency")) {
    const currency = updatePayload.currency.toUpperCase();

    if (!currency || currency.length > 8) {
      return {
        error: "Currency must be a short value such as XAF.",
      };
    }

    updatePayload.currency = currency;
  }

  if (Object.prototype.hasOwnProperty.call(updatePayload, "payment_provider")) {
    const paymentProvider = updatePayload.payment_provider.toLowerCase();

    if (!ALLOWED_PAYMENT_PROVIDERS.has(paymentProvider)) {
      return {
        error: "Payment provider must be mock, notchpay, or campay.",
      };
    }

    updatePayload.payment_provider = paymentProvider;
  }

  if (Object.prototype.hasOwnProperty.call(updatePayload, "institution_name")) {
    if (!updatePayload.institution_name) {
      return {
        error: "Institution name is required.",
      };
    }
  }

  updatePayload.updated_at = new Date().toISOString();

  return {
    updatePayload,
  };
};

export const getInstitutionSettings = async (req, res) => {
  try {
    const existingSettings = await getFirstSettingsRow();
    const settings = existingSettings || (await createDefaultSettingsRow());

    return sendSuccess(res, 200, {
      settings: normalizeSettings(settings),
    });
  } catch (error) {
    console.error("getInstitutionSettings error:", error);

    return sendError(
      res,
      500,
      error.message || "Failed to fetch institution settings."
    );
  }
};

export const updateInstitutionSettings = async (req, res) => {
  try {
    const { updatePayload, error } = buildUpdatePayload(req.body);

    if (error) {
      return sendError(res, 400, error);
    }

    const existingSettings = await getFirstSettingsRow();
    const settingsRow = existingSettings || (await createDefaultSettingsRow());

    const { data, error: updateError } = await supabase
      .from("institution_settings")
      .update(updatePayload)
      .eq("id", settingsRow.id)
      .select("*")
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    await logActivity({
      req,
      action: "institution_settings_updated",
      entity_type: "institution_settings",
      entity_id: data.id,
      entity_label: "Institution Settings",
      description: "Admin updated institution settings.",
      metadata: {
        updated_fields: Object.keys(updatePayload).filter(
          (field) => field !== "updated_at"
        ),
      },
    });

    return sendSuccess(res, 200, {
      settings: normalizeSettings(data),
    });
  } catch (error) {
    console.error("updateInstitutionSettings error:", error);

    return sendError(
      res,
      500,
      error.message || "Failed to update institution settings."
    );
  }
};
