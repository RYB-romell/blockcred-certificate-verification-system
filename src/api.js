// src/api.js

import { auth } from "./firebase.js";

const DEFAULT_TIMEOUT_MS = 30000;

export const API_BASE_URL = (
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000"
)
  .trim()
  .replace(/\/+$/, "");

export const buildApiUrl = (endpoint = "") => {
  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint;
  }

  const finalEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${finalEndpoint}`;
};

const isFormDataBody = (body) => {
  return typeof FormData !== "undefined" && body instanceof FormData;
};

const isBlobBody = (body) => {
  return typeof Blob !== "undefined" && body instanceof Blob;
};

const isUrlSearchParamsBody = (body) => {
  return typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams;
};

const normalizeBody = (body) => {
  if (
    body === undefined ||
    body === null ||
    typeof body === "string" ||
    isFormDataBody(body) ||
    isBlobBody(body) ||
    isUrlSearchParamsBody(body)
  ) {
    return body;
  }

  if (typeof body === "object") {
    return JSON.stringify(body);
  }

  return body;
};

const createHeaders = (options = {}) => {
  const headers = new Headers(options.headers || {});
  const hasBody = options.body !== undefined && options.body !== null;

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (
    hasBody &&
    !headers.has("Content-Type") &&
    !isFormDataBody(options.body) &&
    !isBlobBody(options.body) &&
    !isUrlSearchParamsBody(options.body)
  ) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
};

const fetchWithTimeout = async (url, options = {}) => {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    forceRefreshToken,
    skipAuthRetry,
    ...fetchOptions
  } = options;

  if (fetchOptions.signal || !timeoutMs) {
    return fetch(url, fetchOptions);
  }

  const controller = new AbortController();

  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const buildFetchOptions = (options = {}, headers) => {
  return {
    ...options,
    headers,
    body: normalizeBody(options.body),
  };
};

const getConnectionErrorMessage = (authenticated = false) => {
  if (authenticated) {
    return "Could not connect to the backend server. Please check your internet connection, backend server, or API URL.";
  }

  return "Could not connect to the backend server. Please check your internet connection or backend API URL.";
};

const getAbortErrorMessage = () => {
  return "The request took too long and was cancelled. Please check your connection and try again.";
};

export const authFetch = async (endpoint, options = {}) => {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("You must be logged in to perform this action.");
  }

  const url = buildApiUrl(endpoint);

  try {
    const token = await currentUser.getIdToken(
      Boolean(options.forceRefreshToken)
    );

    const headers = createHeaders(options);
    headers.set("Authorization", `Bearer ${token}`);

    const response = await fetchWithTimeout(
      url,
      buildFetchOptions(options, headers)
    );

    if (response.status === 401 && !options.skipAuthRetry) {
      const freshToken = await currentUser.getIdToken(true);
      const retryHeaders = createHeaders(options);
      retryHeaders.set("Authorization", `Bearer ${freshToken}`);

      return await fetchWithTimeout(
        url,
        buildFetchOptions(
          {
            ...options,
            forceRefreshToken: true,
            skipAuthRetry: true,
          },
          retryHeaders
        )
      );
    }

    return response;
  } catch (error) {
    console.error("Authenticated API request failed:", error);

    if (error?.name === "AbortError") {
      throw new Error(getAbortErrorMessage());
    }

    throw new Error(getConnectionErrorMessage(true));
  }
};

export const publicFetch = async (endpoint, options = {}) => {
  const url = buildApiUrl(endpoint);

  try {
    const headers = createHeaders(options);

    return await fetchWithTimeout(url, buildFetchOptions(options, headers));
  } catch (error) {
    console.error("Public API request failed:", error);

    if (error?.name === "AbortError") {
      throw new Error(getAbortErrorMessage());
    }

    throw new Error(getConnectionErrorMessage(false));
  }
};

export const getApiErrorMessage = async (
  response,
  fallback = "Request failed."
) => {
  try {
    const clonedResponse = response.clone();
    const data = await clonedResponse.json();

    return data.message || data.error || fallback;
  } catch {
    try {
      const text = await response.clone().text();
      return text || fallback;
    } catch {
      return fallback;
    }
  }
};