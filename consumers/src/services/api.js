const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || "Request failed.");
  }

  return payload;
};

const json = (body) => JSON.stringify(body);

export const consumerApi = {
  register: (body) => request("/api/consumers/auth/register", { method: "POST", body: json(body) }),
  login: (body) => request("/api/consumers/auth/login", { method: "POST", body: json(body) }),
  getProfile: (token) => request("/api/consumers/auth/me", { token }),
  updateProfile: (token, body) =>
    request("/api/consumers/auth/me", { method: "PATCH", token, body: json(body) }),

  getAddresses: (token) => request("/api/consumers/addresses", { token }),
  addAddress: (token, body) =>
    request("/api/consumers/addresses", { method: "POST", token, body: json(body) }),
  updateAddress: (token, id, body) =>
    request(`/api/consumers/addresses/${id}`, { method: "PATCH", token, body: json(body) }),
  deleteAddress: (token, id) => request(`/api/consumers/addresses/${id}`, { method: "DELETE", token }),

  getCategories: () => request("/api/store/categories"),
  getProducts: (params = {}) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        search.set(key, value);
      }
    });
    const query = search.toString();
    return request(`/api/store/products${query ? `?${query}` : ""}`);
  },
  getProduct: (id) => request(`/api/store/products/${id}`),
  getSuggestions: (id) => request(`/api/store/products/${id}/suggestions`),

  getOrders: (token) => request("/api/orders", { token }),
  getOrder: (token, id) => request(`/api/orders/${id}`, { token }),
  createOrder: (token, body) => request("/api/orders", { method: "POST", token, body: json(body) }),
  cancelOrderItem: (token, orderId, itemId) =>
    request(`/api/orders/${orderId}/items/${itemId}/cancel`, { method: "POST", token }),
  returnOrderItem: (token, orderId, itemId, reason) =>
    request(`/api/orders/${orderId}/items/${itemId}/return`, {
      method: "POST",
      token,
      body: json({ reason }),
    }),
};

export const ITEM_STATUS_LABELS = {
  pending: "Pending",
  accepted: "Confirmed",
  declined: "Declined by seller",
  dispatched: "Dispatched",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  return_requested: "Return Requested",
  returned: "Returned",
};

export const TRACKING_STEPS = ["pending", "accepted", "dispatched", "out_for_delivery", "delivered"];
