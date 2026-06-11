import { supabase } from "../supabase.js";

const normalizeValue = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const getLimit = (value) => {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return 50;
  }

  return Math.min(parsed, 200);
};

export const getActivityLogs = async (req, res) => {
  try {
    const action = normalizeValue(req.query.action);
    const entityType = normalizeValue(req.query.entity_type);
    const limit = getLimit(req.query.limit);

    let query = supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (action) {
      query = query.eq("action", action);
    }

    if (entityType) {
      query = query.eq("entity_type", entityType);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return res.status(200).json({
      success: true,
      logs: data || [],
    });
  } catch (error) {
    console.error("getActivityLogs error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch activity logs.",
    });
  }
};
