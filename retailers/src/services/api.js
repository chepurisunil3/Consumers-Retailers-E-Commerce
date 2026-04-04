const request = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.token
        ? {
            Authorization: `Bearer ${options.token}`,
            "x-auth-token": options.token,
          }
        : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || "Request failed.");
  }

  return payload;
};

export const retailerApi = {
  register: (body) =>
    request("/api/retailers/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  login: (body) =>
    request("/api/retailers/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getProfile: (token) => request("/api/retailers/auth/me", { token }),
  getDashboard: (token) => request("/api/retailers/dashboard", { token }),
  getCategories: (token) => request("/api/retailers/categories", { token }),
  createCategory: (token, body) =>
    request("/api/retailers/categories", {
      method: "POST",
      token,
      body: JSON.stringify(body),
    }),
  deleteCategory: (token, id) =>
    request(`/api/retailers/categories/${id}`, {
      method: "DELETE",
      token,
    }),
  getProducts: (token) => request("/api/retailers/products", { token }),
  createProduct: (token, body) =>
    request("/api/retailers/products", {
      method: "POST",
      token,
      body: JSON.stringify(body),
    }),
  updateProduct: (token, id, body) =>
    request(`/api/retailers/products/${id}`, {
      method: "PATCH",
      token,
      body: JSON.stringify(body),
    }),
  deleteProduct: (token, id) =>
    request(`/api/retailers/products/${id}`, {
      method: "DELETE",
      token,
    }),
};
