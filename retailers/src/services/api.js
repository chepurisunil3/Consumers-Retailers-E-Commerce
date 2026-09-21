const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

const request = async (path, options = {}) => {
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
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

export const retailerApi = {
  register: (body) => request("/api/retailers/auth/register", { method: "POST", body: json(body) }),
  login: (body) => request("/api/retailers/auth/login", { method: "POST", body: json(body) }),
  staffLogin: (body) => request("/api/retailers/staff/login", { method: "POST", body: json(body) }),
  getProfile: (token) => request("/api/retailers/auth/me", { token }),
  updateProfile: (token, body) =>
    request("/api/retailers/auth/me", { method: "PATCH", token, body: json(body) }),

  getDashboard: (token) => request("/api/retailers/dashboard", { token }),

  getCategories: (token) => request("/api/retailers/categories", { token }),
  createCategory: (token, body) =>
    request("/api/retailers/categories", { method: "POST", token, body: json(body) }),
  deleteCategory: (token, id) => request(`/api/retailers/categories/${id}`, { method: "DELETE", token }),

  getProducts: (token) => request("/api/retailers/products", { token }),
  createProduct: (token, body) =>
    request("/api/retailers/products", { method: "POST", token, body: json(body) }),
  updateProduct: (token, id, body) =>
    request(`/api/retailers/products/${id}`, { method: "PATCH", token, body: json(body) }),
  deleteProduct: (token, id) => request(`/api/retailers/products/${id}`, { method: "DELETE", token }),

  getOrders: (token, status) =>
    request(`/api/retailers/orders${status ? `?status=${status}` : ""}`, { token }),
  getOrder: (token, id) => request(`/api/retailers/orders/${id}`, { token }),
  updateOrderItemStatus: (token, orderId, itemId, body) =>
    request(`/api/retailers/orders/${orderId}/items/${itemId}/status`, {
      method: "PATCH",
      token,
      body: json(body),
    }),

  getStaff: (token) => request("/api/retailers/staff", { token }),
  inviteStaff: (token, body) => request("/api/retailers/staff", { method: "POST", token, body: json(body) }),
  updateStaff: (token, id, body) =>
    request(`/api/retailers/staff/${id}`, { method: "PATCH", token, body: json(body) }),
  removeStaff: (token, id) => request(`/api/retailers/staff/${id}`, { method: "DELETE", token }),

  uploadImage: (token, file) => {
    const formData = new FormData();
    formData.append("image", file);
    return request("/api/uploads/image", { method: "POST", token, body: formData });
  },
};

export const INDUSTRIES = [
  { value: "grocery", label: "Grocery" },
  { value: "electronics", label: "Electronics" },
  { value: "fashion", label: "Fashion" },
  { value: "home_and_furniture", label: "Home & Furniture" },
  { value: "beauty_and_personal_care", label: "Beauty & Personal Care" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "books_and_stationery", label: "Books & Stationery" },
  { value: "sports_and_fitness", label: "Sports & Fitness" },
  { value: "other", label: "Other" },
];

export const ITEM_STATUS_LABELS = {
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
  dispatched: "Dispatched",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  return_requested: "Return Requested",
  returned: "Returned",
};
