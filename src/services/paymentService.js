import { authFetch, getApiErrorMessage, publicFetch } from "../api.js";

const parseJsonResponse = async (response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

export const initiatePayment = async () => {
  const response = await authFetch("/api/payments/initiate", {
    method: "POST",
  });

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    const message = await getApiErrorMessage(
      response,
      data.message || "Could not initialize payment."
    );

    throw new Error(message);
  }

  return data;
};

export const getPaymentStatus = async (reference) => {
  const finalReference = String(reference || "").trim();

  if (!finalReference) {
    throw new Error("Payment reference is required.");
  }

  const response = await authFetch(
    `/api/payments/status/${encodeURIComponent(finalReference)}`
  );

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    const message = await getApiErrorMessage(
      response,
      data.message || "Could not fetch payment status."
    );

    throw new Error(message);
  }

  return data;
};

export const getMyPaymentHistory = async () => {
  const response = await authFetch("/api/payments/my-history");
  const data = await parseJsonResponse(response);

  if (!response.ok) {
    const message = await getApiErrorMessage(
      response,
      data.message || "Could not fetch payment history."
    );

    throw new Error(message);
  }

  return data;
};

export const getAdminPaymentRecords = async (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim()) {
      searchParams.set(key, String(value).trim());
    }
  });

  const queryString = searchParams.toString();
  const response = await authFetch(
    `/api/payments/admin-records${queryString ? `?${queryString}` : ""}`
  );
  const data = await parseJsonResponse(response);

  if (!response.ok) {
    const message = await getApiErrorMessage(
      response,
      data.message || "Could not fetch payment records."
    );

    throw new Error(message);
  }

  return data;
};

export const confirmMockPayment = async (reference) => {
  const finalReference = String(reference || "").trim();

  if (!finalReference) {
    throw new Error("Payment reference is required.");
  }

  const response = await publicFetch(
    `/api/payments/mock-confirm/${encodeURIComponent(finalReference)}`,
    {
      method: "POST",
    }
  );

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    const message = await getApiErrorMessage(
      response,
      data.message || "Could not confirm mock payment."
    );

    throw new Error(message);
  }

  return data;
};
