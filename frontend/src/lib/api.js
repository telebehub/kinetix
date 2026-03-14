const backendUrl = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");

export const API = backendUrl ? `${backendUrl}/api` : "/api";