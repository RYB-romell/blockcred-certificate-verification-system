// backend/services/paymentProviders/notchpayProvider.js

const notConfiguredResponse = () => {
  return {
    success: false,
    provider: "notchpay",
    message:
      "Notch Pay integration is not configured yet. Add official API details before enabling this provider.",
  };
};

export const createPayment = async () => {
  // TODO: add official Notch Pay checkout endpoint.
  // TODO: add authorization header using NOTCHPAY_SECRET_KEY.
  // TODO: map Notch Pay statuses to pending/successful/failed/cancelled.
  return notConfiguredResponse();
};

export const verifyPayment = async () => {
  // TODO: add official Notch Pay payment verification endpoint.
  // TODO: add authorization header using NOTCHPAY_SECRET_KEY.
  // TODO: map Notch Pay statuses to pending/successful/failed/cancelled.
  return notConfiguredResponse();
};

export const verifyWebhook = async () => {
  // TODO: verify webhook signature using NOTCHPAY_WEBHOOK_SECRET.
  // TODO: map Notch Pay statuses to pending/successful/failed/cancelled.
  return notConfiguredResponse();
};

export default {
  createPayment,
  verifyPayment,
  verifyWebhook,
};
