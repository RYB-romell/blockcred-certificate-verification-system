// backend/services/paymentProviders/campayProvider.js

const notConfiguredResponse = () => {
  return {
    success: false,
    provider: "campay",
    message:
      "CamPay integration is not configured yet. Add official API details before enabling this provider.",
  };
};

export const createPayment = async () => {
  // TODO: add official CamPay token/auth flow.
  // TODO: add collection request endpoint.
  // TODO: map CamPay statuses to pending/successful/failed/cancelled.
  return notConfiguredResponse();
};

export const verifyPayment = async () => {
  // TODO: verify payment status.
  // TODO: map CamPay statuses to pending/successful/failed/cancelled.
  return notConfiguredResponse();
};

export const verifyWebhook = async () => {
  // TODO: verify webhook or callback.
  // TODO: map CamPay statuses to pending/successful/failed/cancelled.
  return notConfiguredResponse();
};

export default {
  createPayment,
  verifyPayment,
  verifyWebhook,
};
