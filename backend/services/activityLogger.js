import { supabase } from "../supabase.js";

const normalizeValue = (value) => {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized || null;
};

export const logActivity = async ({
  req,
  action,
  entity_type,
  entity_id,
  entity_label,
  description,
  metadata = {},
}) => {
  try {
    if (!action) {
      return;
    }

    const user = req?.user || {};

    const { error } = await supabase.from("activity_logs").insert([
      {
        actor_uid: normalizeValue(user.uid),
        actor_email: normalizeValue(user.email),
        actor_role: normalizeValue(user.role),
        action: normalizeValue(action),
        entity_type: normalizeValue(entity_type),
        entity_id: normalizeValue(entity_id),
        entity_label: normalizeValue(entity_label),
        description: normalizeValue(description),
        metadata: metadata && typeof metadata === "object" ? metadata : {},
      },
    ]);

    if (error) {
      console.warn("Activity log insert failed:", error.message);
    }
  } catch (error) {
    console.warn("Activity logging failed:", error.message);
  }
};
