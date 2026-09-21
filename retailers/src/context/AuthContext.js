import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { retailerApi } from "../services/api";

const TOKEN_KEY = "retailer_token";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  const loadProfile = useCallback(async (authToken) => {
    try {
      const res = await retailerApi.getProfile(authToken);
      setUser(res.data);
    } catch (error) {
      localStorage.removeItem(TOKEN_KEY);
      setToken("");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      loadProfile(token);
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback((authToken, profile) => {
    localStorage.setItem(TOKEN_KEY, authToken);
    setToken(authToken);
    setUser(profile);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setUser(null);
  }, []);

  const staffRole = user?.staffRole || "owner";

  const can = useCallback(
    (action) => {
      const matrix = {
        "products.write": ["owner", "admin", "manager"],
        "categories.write": ["owner", "admin", "manager"],
        "orders.view": ["owner", "admin", "manager", "sales"],
        "orders.updateStatus": ["owner", "admin", "manager", "sales"],
        "staff.manage": ["owner", "admin"],
        "dashboard.earnings": ["owner", "admin", "manager"],
      };
      return (matrix[action] || []).includes(staffRole);
    },
    [staffRole],
  );

  const value = useMemo(
    () => ({ token, user, loading, isAuthenticated: Boolean(token && user), staffRole, login, logout, can, setUser }),
    [token, user, loading, staffRole, login, logout, can],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
