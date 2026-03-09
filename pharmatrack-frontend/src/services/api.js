const API_BASE_URL = "http://localhost:5000/api";

// Concurrent Refresh Lock
let refreshPromise = null;

/**
 * Silent Refresh Logic
 * Automatically renews the access token using the refresh token.
 * Consolidates multiple concurrent requests into a single refresh attempt.
 */
export const refreshToken = async () => {
  // If a refresh is already in progress, wait for it to complete
  if (refreshPromise) {
    console.log("Waiting for existing refresh operation...");
    return refreshPromise;
  }

  const rfToken = localStorage.getItem("refreshToken");
  if (!rfToken) throw new Error("No refresh token available");

  // Create a new refresh promise
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: rfToken }),
      });

      if (!res.ok) {
        // Full logout on failure
        localStorage.clear();
        window.location.href = "/login";
        throw new Error("Session expired. Please login again.");
      }

      const data = await res.json();
      localStorage.setItem("token", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      return data.accessToken;
    } finally {
      // Release the lock regardless of success or failure
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

/**
 * Centralized API Wrapper
 * Handles Authorization headers and automatic Silent Refresh
 */
const apiCall = async (endpoint, options = {}) => {
  let token = localStorage.getItem("token");

  // Duck-type check for FormData to avoid cross-context instanceof failures
  const isFormData = options.body && typeof options.body.append === "function";

  const headers = {
    ...(token && { "Authorization": `Bearer ${token}` }),
    ...options.headers,
  };

  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  let res = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

  // Handle Token Expiration (401 Unauthorized)
  if (res.status === 401) {
    const data = await res.clone().json();
    if (data.message === "Invalid or expired token") {
      try {
        console.log("Session expired. Attempting silent refresh...");
        const newToken = await refreshToken();

        // Retry original request with new token
        const retryHeaders = {
          ...headers,
          "Authorization": `Bearer ${newToken}`,
        };
        res = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers: retryHeaders });
      } catch (err) {
        // If refresh fails or returns another 401, re-throw to trigger page offline/logout logic
        throw new Error("Session timed out. Redirecting to login...");
      }
    }
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Action failed");
  return data;
};

// --- AUTH ---
export const loginUser = async (username, password) => {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Login failed");
  return data;
};

export const registerUser = async (userData) => {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Registration failed");
  return data;
};

export const verifyEmail = async (email, code) => {
  const res = await fetch(`${API_BASE_URL}/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Verification failed");
  return data;
};

export const resendCode = async (email) => {
  const res = await fetch(`${API_BASE_URL}/auth/resend-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to resend code");
  return data;
};


export const forgotPassword = async (email) => {
  const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to request password reset");
  return data;
};

export const resetPassword = async (token, password) => {
  const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to reset password");
  return data;
};


// --- USERS ---
export const getProfile = () => apiCall("/users/profile");
export const getUsers = () => apiCall("/users");
export const updateUserStatus = (id, status) => apiCall(`/users/${id}/status`, {
  method: "PUT",
  body: JSON.stringify({ status }),
});

// --- DASHBOARD ---
export const getDashboardSummary = () => apiCall("/dashboard/summary");

// --- CATEGORIES ---
export const getCategories = () => apiCall("/categories");
export const createCategory = (name) => apiCall("/categories", {
  method: "POST",
  body: JSON.stringify({ name }),
});
export const updateCategory = (id, name) => apiCall(`/categories/${id}`, {
  method: "PUT",
  body: JSON.stringify({ name }),
});
export const deleteCategory = (id) => apiCall(`/categories/${id}`, {
  method: "DELETE",
});

// --- MEDICINES ---
export const getMedicines = () => apiCall("/medicines");
export const createMedicine = (data) => apiCall("/medicines", {
  method: "POST",
  body: (data && typeof data.append === "function") ? data : JSON.stringify(data),
});
export const updateMedicine = (id, data) => apiCall(`/medicines/${id}`, {
  method: "PUT",
  body: (data && typeof data.append === "function") ? data : JSON.stringify(data),
});
export const deleteMedicine = (id) => apiCall(`/medicines/${id}`, {
  method: "DELETE",
});

// --- BATCHES ---
export const getBatches = () => apiCall("/batches");
export const createBatch = (data) => apiCall("/batches", {
  method: "POST",
  body: JSON.stringify(data),
});
export const updateBatch = (id, data) => apiCall(`/batches/${id}`, {
  method: "PUT",
  body: JSON.stringify(data),
});
export const deleteBatch = (id) => apiCall(`/batches/${id}`, {
  method: "DELETE",
});

// --- SALES ---
export const createSale = (data) => apiCall("/sales", {
  method: "POST",
  body: JSON.stringify(data),
});
export const getSales = () => apiCall("/sales");

// --- PURCHASES ---
export const createPurchase = (data) => apiCall("/purchases", {
  method: "POST",
  body: JSON.stringify(data),
});
export const getPurchases = () => apiCall("/purchases");

// --- ALERTS ---
export const getAlerts = () => apiCall("/alerts");
export const triggerAlertGeneration = () => apiCall("/alerts/generate", {
  method: "POST",
});

// --- SUPPLIERS ---
export const getSuppliers = () => apiCall("/suppliers");
export const createSupplier = (data) => apiCall("/suppliers", {
  method: "POST",
  body: JSON.stringify(data),
});
export const updateSupplier = (id, data) => apiCall(`/suppliers/${id}`, {
  method: "PUT",
  body: JSON.stringify(data),
});
export const deleteSupplier = (id) => apiCall(`/suppliers/${id}`, {
  method: "DELETE",
});
