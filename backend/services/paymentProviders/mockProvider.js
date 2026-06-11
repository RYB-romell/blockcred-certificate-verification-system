// backend/services/paymentProviders/mockProvider.js

export const createPayment = async ({
  reference,
  callbackUrl,
}) => {
  return {
    success: true,
    provider: "mock",
    reference,
    checkout_url: callbackUrl,
    status: "pending",
  };
};

export const verifyPayment = async (reference) => {
  return {
    success: true,
    provider: "mock",
    reference,
    status: "pending",
    message: "Mock payment verification is handled by the local confirm route.",
  };
};

export const verifyWebhook = async () => {
  return {
    success: true,
    provider: "mock",
    message: "Mock webhook verification accepted for local testing.",
  };
};

export default {
  createPayment,
  verifyPayment,
  verifyWebhook,
};
