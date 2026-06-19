import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // Ensure this points to your backend
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {

    if (
      typeof window !== "undefined"
    ) {

      const token =
        localStorage.getItem(
          "token"
        );

      if (token) {

        config.headers.Authorization =
          `Bearer ${token}`;
      }
    }

    return config;
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      typeof window !== "undefined"
    ) {
      localStorage.removeItem("token");

      // CRITICAL FIX: Only redirect if we aren't already on the login page!
      if (window.location.pathname !== "/auth/login") {
        window.location.href = "/auth/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
