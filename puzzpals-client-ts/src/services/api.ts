import axios from "axios";
import config from "@/config";

const api = axios.create({
  baseURL: config.apiBase,
  withCredentials: true,
});

// Attach persistent bearer token if session cookie is missing
api.interceptors.request.use((request) => {
  // Only attach if not already set and not for login endpoints
  const isAuthEndpoint =
    request.url?.includes("/auth/ticket/exchange") ||
    request.url?.includes("/auth/google") ||
    request.url?.includes("/auth/logout");

  if (!isAuthEndpoint) {
    // If no session cookie, try to attach persistent token
    const token = localStorage.getItem("persistentBearerToken");
    if (token && !request.headers?.Authorization) {
      request.headers = request.headers || {};
      request.headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return request;
});

export default api;
