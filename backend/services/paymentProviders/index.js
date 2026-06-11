// backend/services/paymentProviders/index.js

import mockProvider from "./mockProvider.js";
import notchpayProvider from "./notchpayProvider.js";
import campayProvider from "./campayProvider.js";

const providers = {
  mock: mockProvider,
  notchpay: notchpayProvider,
  campay: campayProvider,
};

const normalizeProviderName = (value) => {
  return String(value || "mock").trim().toLowerCase();
};

export const getPaymentProvider = () => {
  const providerName = normalizeProviderName(process.env.PAYMENT_PROVIDER);
  const provider = providers[providerName];

  if (!provider) {
    console.warn(
      `Unsupported PAYMENT_PROVIDER "${providerName}". Falling back to mock provider.`
    );

    return {
      name: "mock",
      ...mockProvider,
    };
  }

  return {
    name: providerName,
    ...provider,
  };
};
