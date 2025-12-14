import axios from "axios";

let accessToken = null;
let refreshPromise = null;

const isOffline = () =>
  typeof navigator !== "undefined" && navigator.onLine === false;

const isAuthPath = (url = "") =>
  /\/auth\/(login|register|refresh|logout)/.test(url);

const api = axios.create({
  baseURL: "http://localhost:8080/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  timeout: 5000, // 5 seconds timeout
});

api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }

    if (isOffline()) {
      const err = new Error("Network error: Offline");
      err.isOffline = true;
      err.config = config;
      return Promise.reject(err);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const tryRefresh = async () => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    if (isOffline())
      throw Object.assign(new Error("Offline"), { isOffline: true });

    let attempt = 0;
    const MAX = 2;
    while (true) {
      attempt++;
      try {
        const res = await api.post("/auth/refresh");
        accessToken = res.data.access_token || null;
        return accessToken;
      } catch (e) {
        const status = e?.response?.status;
        if (e?.isOffline) throw e;
        if (status === 401 || status === 403) throw e;
        if (attempt >= MAX) throw e;
        await sleep(300 * Math.pow(2, attempt - 1));
      }
    }
  })();
  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};

    if (error.code === "ECONNABORTED") {
      const err = new Error("Request timed out, please try again.");
      err.isTimeout = true;
      err.config = originalRequest;
      throw err;
    }

    const netDown =
      error.isOffline || (!error.response && error.message === "Network Error");

    if (netDown) {
      const err = new Error("Offline");
      err.isOffline = true;
      err.config = originalRequest;
      throw err;
    }

    if (
      !isAuthPath(originalRequest.url) &&
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        const token = await tryRefresh();
        if (token) {
          originalRequest.headers = {
            ...(originalRequest.headers || {}),
            Authorization: `Bearer ${token}`,
          };
          return api(originalRequest);
        }
      } catch (e) {
        if (e?.isOffline) {
          const err = new Error("Offline");
          err.isOffline = true;
          err.config = originalRequest;
          throw err;
        }
        accessToken = null;
        throw error;
      }
    }
    throw error;
  }
);

export const setAccessToken = (token) => {
  accessToken = token;
};
export const clearAccessToken = () => {
  accessToken = null;
};

export const loginRequest = (username, password) => {
  return api.post("/auth/login", { username, password });
};

export const registerRequest = (username, email, password) => {
  return api.post("/auth/register", {
    username,
    email,
    password,
  });
};

export default api;
