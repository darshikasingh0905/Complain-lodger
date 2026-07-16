// ─────────────────────────────────────────────────────────────────────────────
// JWT token store — single source of truth for the session's Bearer token.
// Kept in its own module so authService and the API services can both import
// it without circular dependencies.
// ─────────────────────────────────────────────────────────────────────────────

const TOKEN_KEY = "auth_token";

export const getAuthToken = () => localStorage.getItem(TOKEN_KEY) || null;

export const setAuthToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
};

export const clearAuthToken = () => localStorage.removeItem(TOKEN_KEY);

/**
 * Axios interceptors:
 * - request: attach `Authorization: Bearer <jwt>` when present.
 * - response: a 401 from the API means the token is missing/expired/invalid —
 *   the session is dead server-side, so wipe it and redirect to /login.
 */
export const attachAuthInterceptor = (axiosInstance) => {
  axiosInstance.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  axiosInstance.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err?.response?.status === 401) {
        clearAuthToken();
        localStorage.removeItem("currentUser"); // kill the dead session
        if (!window.location.pathname.startsWith("/login")) {
          window.location.assign("/login");
        }
      }
      return Promise.reject(err);
    }
  );
};
