import "./App.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import AuthPanel from "./components/AuthPanel";
import DashboardShell from "./components/DashboardShell";
import HeroPanel from "./components/HeroPanel";
import { retailerApi } from "./services/api";

const RETAILER_TOKEN_KEY = "retailer_token";

const emptyAuthForm = {
  companyName: "",
  contactName: "",
  email: "",
  contactNumber: "",
  password: "",
  companyLogo: "",
};

const emptyCategoryForm = {
  name: "",
  description: "",
  imageUrl: "",
};

const emptyProductForm = {
  name: "",
  description: "",
  categoryId: "",
  price: "",
  inventory: "",
  imageUrl: "",
  isFeatured: false,
};

function App() {
  const [mode, setMode] = useState("login");
  const [authForm, setAuthForm] = useState(emptyAuthForm);
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [token, setToken] = useState(
    localStorage.getItem(RETAILER_TOKEN_KEY) || "",
  );
  const [user, setUser] = useState({});
  const [dashboard, setDashboard] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(
    Boolean(localStorage.getItem(RETAILER_TOKEN_KEY)),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const isAuthenticated = useMemo(() => Boolean(token), [token]);

  const resetSession = useCallback(() => {
    localStorage.removeItem(RETAILER_TOKEN_KEY);
    setToken("");
    setUser({});
    setDashboard(null);
    setCategories([]);
    setProducts([]);
    setLoading(false);
  }, []);

  const bootstrapDashboard = useCallback(
    async (authToken) => {
      if (!authToken) {
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [
          profileResponse,
          dashboardResponse,
          categoriesResponse,
          productsResponse,
        ] = await Promise.all([
          retailerApi.getProfile(authToken),
          retailerApi.getDashboard(authToken),
          retailerApi.getCategories(authToken),
          retailerApi.getProducts(authToken),
        ]);

        setUser(profileResponse.data || {});
        setDashboard(dashboardResponse.data || null);
        setCategories(categoriesResponse.data || []);
        setProducts(productsResponse.data || []);
      } catch (requestError) {
        setError(requestError.message);
        resetSession();
      } finally {
        setLoading(false);
      }
    },
    [resetSession],
  );

  useEffect(() => {
    bootstrapDashboard(token);
  }, [bootstrapDashboard, token]);

  const refreshRetailerData = useCallback(async () => {
    if (!token) {
      return;
    }

    const [dashboardResponse, categoriesResponse, productsResponse] =
      await Promise.all([
        retailerApi.getDashboard(token),
        retailerApi.getCategories(token),
        retailerApi.getProducts(token),
      ]);

    setDashboard(dashboardResponse.data || null);
    setCategories(categoriesResponse.data || []);
    setProducts(productsResponse.data || []);
  }, [token]);

  const handleAuthSubmit = useCallback(async () => {
    setSaving(true);
    setError("");

    try {
      const response =
        mode === "login"
          ? await retailerApi.login({
              email: authForm.email,
              password: authForm.password,
            })
          : await retailerApi.register(authForm);

      localStorage.setItem(RETAILER_TOKEN_KEY, response.token);
      setToken(response.token);
      setUser(response.data || {});
      setAuthForm(emptyAuthForm);
      setFeedback(
        mode === "login"
          ? "Welcome back to your retailer dashboard."
          : "Retailer account created successfully.",
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }, [authForm, mode]);

  const handleCategorySubmit = useCallback(async () => {
    if (!categoryForm.name.trim()) {
      setFeedback("Category name is required.");
      return;
    }

    setSaving(true);
    try {
      await retailerApi.createCategory(token, categoryForm);
      setCategoryForm(emptyCategoryForm);
      setFeedback("Category added.");
      await refreshRetailerData();
    } catch (requestError) {
      setFeedback(requestError.message);
    } finally {
      setSaving(false);
    }
  }, [categoryForm, refreshRetailerData, token]);

  const handleCategoryDelete = useCallback(
    async (categoryId) => {
      setSaving(true);
      try {
        await retailerApi.deleteCategory(token, categoryId);
        setFeedback("Category removed.");
        await refreshRetailerData();
      } catch (requestError) {
        setFeedback(requestError.message);
      } finally {
        setSaving(false);
      }
    },
    [refreshRetailerData, token],
  );

  const handleProductSubmit = useCallback(async () => {
    if (!productForm.name.trim() || !productForm.categoryId) {
      setFeedback("Product name and category are required.");
      return;
    }

    setSaving(true);
    try {
      await retailerApi.createProduct(token, {
        ...productForm,
        price: Number(productForm.price),
        inventory: Number(productForm.inventory),
      });
      setProductForm(emptyProductForm);
      setFeedback("Product added.");
      await refreshRetailerData();
    } catch (requestError) {
      setFeedback(requestError.message);
    } finally {
      setSaving(false);
    }
  }, [productForm, refreshRetailerData, token]);

  const handleProductDelete = useCallback(
    async (productId) => {
      setSaving(true);
      try {
        await retailerApi.deleteProduct(token, productId);
        setFeedback("Product deleted.");
        await refreshRetailerData();
      } catch (requestError) {
        setFeedback(requestError.message);
      } finally {
        setSaving(false);
      }
    },
    [refreshRetailerData, token],
  );

  const handleProductToggle = useCallback(
    async (product, changes) => {
      setSaving(true);
      try {
        await retailerApi.updateProduct(token, product.id, changes);
        setFeedback("Product updated.");
        await refreshRetailerData();
      } catch (requestError) {
        setFeedback(requestError.message);
      } finally {
        setSaving(false);
      }
    },
    [refreshRetailerData, token],
  );

  const handleLogout = useCallback(() => {
    resetSession();
    setMode("login");
    setFeedback("Logged out successfully.");
  }, [resetSession]);

  return (
    <main className="retailer-app-shell">
      <div className="background-glow background-glow-left" />
      <div className="background-glow background-glow-right" />

      {!isAuthenticated ? (
        <div className="auth-layout">
          <HeroPanel />
          <AuthPanel
            mode={mode}
            form={authForm}
            setForm={setAuthForm}
            onSubmit={handleAuthSubmit}
            onModeChange={(nextMode) => {
              setMode(nextMode);
              setError("");
            }}
            loading={saving}
            error={error}
          />
        </div>
      ) : loading ? (
        <section className="loading-state glass-card">
          <h2>Preparing your dashboard...</h2>
          <p className="muted-text">
            Syncing products, categories and order insights.
          </p>
        </section>
      ) : (
        <DashboardShell
          user={user}
          dashboard={dashboard}
          categories={categories}
          products={products}
          categoryForm={categoryForm}
          setCategoryForm={setCategoryForm}
          productForm={productForm}
          setProductForm={setProductForm}
          onCategorySubmit={handleCategorySubmit}
          onCategoryDelete={handleCategoryDelete}
          onProductSubmit={handleProductSubmit}
          onProductDelete={handleProductDelete}
          onProductToggle={handleProductToggle}
          saving={saving}
          onLogout={handleLogout}
          feedback={feedback}
        />
      )}
    </main>
  );
}

export default App;
