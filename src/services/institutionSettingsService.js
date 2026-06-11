import { authFetch, getApiErrorMessage, publicFetch } from "../api.js";

const parseJsonResponse = async (response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

export const getInstitutionSettings = async () => {
  const response = await publicFetch("/api/institution-settings");
  const data = await parseJsonResponse(response);

  if (!response.ok) {
    const message = await getApiErrorMessage(
      response,
      data.message || "Could not fetch institution settings."
    );

    throw new Error(message);
  }

  return data;
};

export const updateInstitutionSettings = async (payload) => {
  const response = await authFetch("/api/institution-settings", {
    method: "PATCH",
    body: payload,
  });
  const data = await parseJsonResponse(response);

  if (!response.ok) {
    const message = await getApiErrorMessage(
      response,
      data.message || "Could not update institution settings."
    );

    throw new Error(message);
  }

  return data;
};
