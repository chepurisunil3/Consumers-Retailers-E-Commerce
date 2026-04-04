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

export const consumerApi = {
  register: (body) =>
    request("/api/consumers/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  login: (body) =>
    request("/api/consumers/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getProfile: (token) => request("/api/consumers/auth/me", { token }),
  updateProfile: (token, body) =>
    request("/api/consumers/auth/me", {
      method: "PATCH",
      token,
      body: JSON.stringify(body),
    }),
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
  getOrders: (token) => request("/api/orders", { token }),
  createOrder: (token, body) =>
    request("/api/orders", {
      method: "POST",
      token,
      body: JSON.stringify(body),
    }),
};
